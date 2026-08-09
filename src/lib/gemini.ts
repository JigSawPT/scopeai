import { GoogleGenAI } from '@google/genai';
import { SearchCitation } from './agents/types';
import fs from 'fs';
import path from 'path';

export const GEMINI_MODEL = 'gemini-2.0-flash';

let ai: GoogleGenAI | null = null;

// Check for Vertex AI GCP Service Account JSON key or gcloud Application Default Credentials (uses $150 GCP credits)
const gcpKeyPath = path.join(process.cwd(), 'gcp-key.json');
const gcloudAdcPath = path.join(process.env.APPDATA || '', 'gcloud', 'application_default_credentials.json');

if (fs.existsSync(gcpKeyPath)) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = gcpKeyPath;
  console.log('[Gemini SDK] Initializing with Google Cloud Vertex AI (gcp-key.json)...');
  ai = new GoogleGenAI({
    vertexai: true,
    location: process.env.GCP_LOCATION || 'us-central1',
    project: process.env.GCP_PROJECT_ID
  });
} else if (fs.existsSync(gcloudAdcPath)) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = gcloudAdcPath;
  console.log('[Gemini SDK] Initializing with Google Cloud Vertex AI (gcloud ADC credentials)...');
  ai = new GoogleGenAI({
    vertexai: true,
    location: process.env.GCP_LOCATION || 'us-central1',
    project: process.env.GCP_PROJECT_ID
  });
} else if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function extractJSON<T>(text: string, fallback: T): T {
  if (!text) return fallback;

  // Attempt 1: Direct JSON parse
  try {
    return JSON.parse(text);
  } catch {}

  // Attempt 2: Strip code fences
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {}

  // Attempt 3: Extract JSON Array [...]
  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket > firstBracket) {
    try {
      const arraySubstring = cleaned.substring(firstBracket, lastBracket + 1);
      return JSON.parse(arraySubstring);
    } catch {}
  }

  // Attempt 4: Extract JSON Object {...}
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      const objectSubstring = cleaned.substring(firstBrace, lastBrace + 1);
      const parsed = JSON.parse(objectSubstring);
      if (Array.isArray(fallback) && parsed && typeof parsed === 'object') {
        const key = Object.keys(parsed).find(k => Array.isArray(parsed[k]));
        if (key) return parsed[key] as T;
      }
      return parsed;
    } catch {}
  }

  console.warn("extractJSON failed to parse text, returning fallback object.");
  return fallback;
}

async function singleCallWithRetry<T>(
  fn: () => Promise<T>, 
  maxRetries = 2, 
  initialDelayMs = 10000
): Promise<T> {
  let currentDelay = initialDelayMs;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const isQuotaError = 
        error?.status === 429 || 
        error?.message?.includes('429') || 
        error?.message?.includes('RESOURCE_EXHAUSTED') ||
        error?.message?.includes('quota');

      if (isQuotaError && attempt < maxRetries) {
        console.warn(`[Gemini 3.6 Flash] Rate limit (Attempt ${attempt}/${maxRetries}). Waiting ${currentDelay / 1000}s...`);
        await delay(currentDelay);
        currentDelay += 10000;
      } else {
        throw error;
      }
    }
  }
  throw new Error("Gemini API call failed after retries");
}

export async function generateContent(prompt: string, systemInstruction?: string): Promise<string> {
  if (!ai) {
    throw new Error("Gemini client is not initialized. Please set GEMINI_API_KEY or add gcp-key.json.");
  }

  const response = await singleCallWithRetry(async () => {
    return await ai!.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: systemInstruction ? { systemInstruction } : undefined,
    });
  });
  return response.text || '';
}

export async function generateGroundedContent(
  prompt: string, 
  systemInstruction?: string
): Promise<{ text: string; sources: SearchCitation[] }> {
  if (!ai) {
    throw new Error("Gemini client is not initialized. Please set GEMINI_API_KEY or add gcp-key.json.");
  }

  // Try grounded call (1 attempt only — no aggressive retry loop to preserve quota)
  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction || undefined,
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || '';
    const sources: SearchCitation[] = [];
    const sourceSet = new Set<string>();

    try {
      const candidate = response.candidates?.[0];
      const groundingMetadata = (candidate as any)?.groundingMetadata;

      if (groundingMetadata?.groundingChunks) {
        for (const chunk of groundingMetadata.groundingChunks) {
          try {
            if (chunk.web?.uri) {
              const url = chunk.web.uri;
              let title = chunk.web.title || url;
              try { title = chunk.web.title || new URL(url).hostname; } catch {}
              if (!sourceSet.has(url)) {
                sourceSet.add(url);
                sources.push({ title, url });
              }
            }
          } catch {
            // Skip malformed chunk
          }
        }
      }
    } catch (err) {
      console.warn('Error parsing grounding metadata:', err);
    }

    console.log(`[Gemini Grounding] SUCCESS — ${sources.length} web sources found.`);
    return { text, sources };
  } catch (groundingError: any) {
    console.warn(`[Gemini Grounding] Live Search tool unavailable (${groundingError?.status || groundingError?.message}). Falling back to standard intelligence.`);
  }

  // Fallback: Standard model (with 1 backoff retry)
  try {
    const fallbackText = await singleCallWithRetry(async () => {
      const r = await ai!.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt + "\n\nIMPORTANT: Provide specific, detailed, factual competitive intelligence based on your extensive knowledge base.",
        config: systemInstruction ? { systemInstruction } : undefined,
      });
      return r.text || '';
    });

    console.log(`[Gemini Standard] Fallback succeeded (${fallbackText.length} chars).`);
    return {
      text: fallbackText,
      sources: []
    };
  } catch (fallbackError: any) {
    console.warn(`[Gemini Standard] Fallback hit limit: ${fallbackError?.message}. Using offline fallback.`);
    return {
      text: '',
      sources: []
    };
  }
}
