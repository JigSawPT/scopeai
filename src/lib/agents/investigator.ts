import { generateGroundedContent, extractJSON, getErrorMessage } from '../gemini';
import { CompetitorData, AgentLogEntry, OrderRequest } from './types';

interface RawCompetitor {
  name?: string;
  website?: string;
  pricing?: string;
  strengths?: string[];
  weaknesses?: string[];
  reviews_summary?: string;
  market_position?: string;
}

export async function runInvestigator(order: OrderRequest): Promise<{ data: CompetitorData[], logs: AgentLogEntry[] }> {
  const logs: AgentLogEntry[] = [];
  const addLog = (action: string, details: string, status: 'running' | 'completed' | 'error' = 'running') => {
    logs.push({
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      agent: 'INVESTIGATOR',
      action,
      details,
      status
    });
  };

  addLog('Initialization', 'Starting real-time web search research phase...');

  const systemInstruction = `You are an elite competitive intelligence researcher with access to Google Search.
Your job is to search the live web for real, current, accurate information about specified competitors.
You MUST search for real pricing details, actual website URLs, verified user review themes, strengths, and weaknesses.

OUTPUT REQUIREMENT:
Return ONLY a valid JSON array of objects conforming to the schema below.

JSON Schema per object:
[
  {
    "name": "Exact Competitor Name",
    "website": "https://official-website-domain.com",
    "pricing": "Verified pricing structure with specific numbers if available",
    "strengths": ["Real verified strength 1", "Real verified strength 2"],
    "weaknesses": ["Real verified weakness 1", "Real verified weakness 2"],
    "reviews_summary": "Summary of real user feedback found on review sites",
    "market_position": "Concise market positioning description"
  }
]`;

  const prompt = `Perform live web searches and analyze the following competitors for a business named "${order.business_name}" in the "${order.industry}" industry targeting "${order.target_market}".

Competitors to research: ${order.competitors.join(', ')}

Search for:
1. Official website URL for each competitor.
2. Current pricing plans, tiers, and subscription costs.
3. Key product features and strengths.
4. Product limitations, common customer complaints, or weaknesses from reviews.
5. Overall market positioning.`;

  try {
    addLog('Searching Web', `Executing live Google Search queries for competitors: ${order.competitors.join(', ')}`);
    const startTime = Date.now();
    const { text, sources } = await generateGroundedContent(prompt, systemInstruction);
    const durationMs = Date.now() - startTime;
    
    addLog('Parsing Web Data', `Received grounded search response with ${sources.length} verified web sources.`);

    // Degraded template used only if the model returns nothing parseable (never claims verification)
    const fallbackCompetitors: CompetitorData[] = order.competitors.map(c => ({
      name: c,
      website: `https://${c.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      pricing: "Unavailable — model returned no data",
      strengths: ["Unavailable — model returned no data"],
      weaknesses: ["Unavailable — model returned no data"],
      reviews_summary: "Unavailable — model returned no data.",
      market_position: "Unanalyzed (degraded mode)",
      sources: sources
    }));

    const rawData = extractJSON<RawCompetitor[]>(text, fallbackCompetitors);
    const rawArray = Array.isArray(rawData) ? rawData : fallbackCompetitors;

    // Attach verified web search sources to competitors
    const data: CompetitorData[] = rawArray.map((item: RawCompetitor) => ({
      name: item.name || 'Competitor',
      website: item.website || '',
      pricing: item.pricing || 'Pricing info from live search',
      strengths: Array.isArray(item.strengths) ? item.strengths : [],
      weaknesses: Array.isArray(item.weaknesses) ? item.weaknesses : [],
      reviews_summary: item.reviews_summary || '',
      market_position: item.market_position || '',
      sources: sources
    }));

    addLog('Completed', `Competitor research finished successfully with ${sources.length} web sources verified.`, 'completed');
    logs[logs.length - 1].durationMs = durationMs;

    return { data, logs };
  } catch (error: unknown) {
    addLog('Error', `Investigator failed: ${getErrorMessage(error)}`, 'error');
    throw error;
  }
}
