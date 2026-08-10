import { GoogleGenAI, Type } from '@google/genai';
import { SearchCitation } from './agents/types';
import fs from 'fs';
import path from 'path';

export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const vertexOptions = {
  vertexai: true,
  location: process.env.GCP_LOCATION || 'us-central1',
  project: process.env.GCP_PROJECT_ID,
};

function initClient(): { client: GoogleGenAI | null; provider: string } {
  const requested = process.env.GEMINI_PROVIDER;

  if (requested === 'vertex') {
    return { client: new GoogleGenAI(vertexOptions), provider: 'vertex (forced via GEMINI_PROVIDER)' };
  }
  if (requested === 'aistudio') {
    if (!process.env.GEMINI_API_KEY) return { client: null, provider: 'none' };
    return { client: new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }), provider: 'aistudio (forced via GEMINI_PROVIDER)' };
  }

  const gcpKeyPath = path.join(process.cwd(), 'gcp-key.json');
  if (fs.existsSync(gcpKeyPath)) {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = gcpKeyPath;
    return { client: new GoogleGenAI(vertexOptions), provider: 'vertex (gcp-key.json)' };
  }

  const home = process.env.HOME || process.env.USERPROFILE || '';
  const configDir = process.env.APPDATA || path.join(home, '.config');
  const adcPath = path.join(configDir, 'gcloud', 'application_default_credentials.json');
  if (fs.existsSync(adcPath)) {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = adcPath;
    return { client: new GoogleGenAI(vertexOptions), provider: 'vertex (gcloud ADC)' };
  }

  if (process.env.K_SERVICE || process.env.K_REVISION) {
    return { client: new GoogleGenAI(vertexOptions), provider: 'vertex (Cloud Run metadata)' };
  }

  if (process.env.GEMINI_API_KEY) {
    return { client: new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }), provider: 'aistudio (API key)' };
  }

  return { client: null, provider: 'none' };
}

const initialized = initClient();
const ai = initialized.client;
console.log(`[Gemini SDK] provider=${initialized.provider} model=${GEMINI_MODEL}`);

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

function getErrorStatus(err: unknown): number | undefined {
  return (err as { status?: number })?.status;
}

interface GroundingChunk {
  web?: { uri?: string; title?: string };
}

interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
}

export type JsonSchema = {
  type: Type;
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  required?: string[];
  propertyOrdering?: string[];
};

export function extractJSON<T>(text: string, fallback: T): T {
  if (!text) return fallback;

  try {
    return JSON.parse(text);
  } catch {}

  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {}

  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket > firstBracket) {
    try {
      const arraySubstring = cleaned.substring(firstBracket, lastBracket + 1);
      return JSON.parse(arraySubstring);
    } catch {}
  }

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
    } catch (error: unknown) {
      const status = getErrorStatus(error);
      const message = getErrorMessage(error);
      const isQuotaError = 
        status === 429 || 
        message.includes('429') || 
        message.includes('RESOURCE_EXHAUSTED') ||
        message.includes('quota');

      if (isQuotaError && attempt < maxRetries) {
        console.warn(`[${GEMINI_MODEL}] Rate limit (Attempt ${attempt}/${maxRetries}). Waiting ${currentDelay / 1000}s...`);
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
    throw new Error("Gemini client is not initialized. Set GEMINI_PROVIDER/GEMINI_API_KEY or provide Vertex AI credentials.");
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

async function groundedAttempt(
  prompt: string,
  systemInstruction?: string,
  schema?: JsonSchema
): Promise<{ text: string; sources: SearchCitation[] }> {
  const response = await ai!.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      systemInstruction: systemInstruction || undefined,
      tools: [{ googleSearch: {} }],
      ...(schema
        ? { responseMimeType: 'application/json', responseSchema: schema }
        : {}),
    },
  });

  const text = response.text || '';
  const sources: SearchCitation[] = [];
  const sourceSet = new Set<string>();

  try {
    const candidate = response.candidates?.[0] as { groundingMetadata?: GroundingMetadata } | undefined;
    const groundingMetadata = candidate?.groundingMetadata;

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

  return { text, sources };
}

export async function generateGroundedContent(
  prompt: string, 
  systemInstruction?: string,
  schema?: JsonSchema
): Promise<{ text: string; sources: SearchCitation[] }> {
  if (!ai) {
    throw new Error("Gemini client is not initialized. Set GEMINI_PROVIDER/GEMINI_API_KEY or provide Vertex AI credentials.");
  }

  // Grounded calls: attempt 1 with structured output schema (if provided),
  // attempt 2 without schema. Thinking models occasionally return empty text.
  const attempts: (JsonSchema | undefined)[] = schema ? [schema, undefined] : [undefined, undefined];
  for (let attempt = 0; attempt < attempts.length; attempt++) {
    try {
      const result = await groundedAttempt(prompt, systemInstruction, attempts[attempt]);
      if (result.text.trim().length > 0) {
        console.log(`[Gemini Grounding] SUCCESS — ${result.sources.length} web sources found.`);
        return result;
      }
      console.warn(`[Gemini Grounding] Attempt ${attempt + 1} returned empty text.`);
    } catch (groundingError: unknown) {
      console.warn(`[Gemini Grounding] Attempt ${attempt + 1} failed (${getErrorStatus(groundingError) || getErrorMessage(groundingError)}).`);
    }
  }
  console.warn('[Gemini Grounding] All grounded attempts failed. Falling back to standard intelligence.');

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
  } catch (fallbackError: unknown) {
    console.warn(`[Gemini Standard] Fallback hit limit: ${getErrorMessage(fallbackError)}. Using offline fallback.`);
    return {
      text: '',
      sources: []
    };
  }
}
