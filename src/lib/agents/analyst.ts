import { generateGroundedContent, extractJSON, getErrorMessage } from '../gemini';
import { AnalysisResult, CompetitorData, AgentLogEntry, OrderRequest, SearchCitation } from './types';

export async function runAnalyst(
  order: OrderRequest, 
  competitors: CompetitorData[]
): Promise<{ data: AnalysisResult, logs: AgentLogEntry[] }> {
  const logs: AgentLogEntry[] = [];
  const addLog = (action: string, details: string, status: 'running' | 'completed' | 'error' = 'running') => {
    logs.push({
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      agent: 'ANALYST',
      action,
      details,
      status
    });
  };

  addLog('Initialization', 'Starting grounded strategic gap and trend analysis...');

  const systemInstruction = `You are an expert strategic business analyst with live web search capability.
Your job is to analyze real competitor data, search for current industry benchmarks, market trends, customer pain points, and strategic gaps.

OUTPUT REQUIREMENT:
Return ONLY a valid JSON object.

Schema:
{
  "executive_summary": "High-level summary of competitive landscape and key strategic insights",
  "market_overview": "Detailed overview of industry trends, growth drivers, and market shifts based on current data",
  "strategic_gaps": ["Unserved market need 1", "Unserved market need 2", "Unserved market need 3"],
  "opportunities": ["Actionable growth opportunity 1", "Actionable growth opportunity 2"],
  "threats": ["Competitive/market threat 1", "Competitive/market threat 2"],
  "recommendations": ["Strategic recommendation 1", "Strategic recommendation 2", "Strategic recommendation 3"],
  "market_positioning": "Strategic positioning statement for ${order.business_name}"
}`;

  const prompt = `Analyze the following business and verified competitor data, and search the live web for industry context in the "${order.industry}" market targeting "${order.target_market}".

Target Business: ${order.business_name}
Business Description: ${order.business_description}
Specific Client Questions: ${order.specific_questions || 'N/A'}

Verified Competitor Research Data:
${JSON.stringify(competitors, null, 2)}

Search for:
1. Current industry market trends, benchmarks, and growth drivers in ${order.industry}.
2. Common customer complaints and unaddressed pain points across these competitors.
3. Market positioning gaps that ${order.business_name} can exploit.`;

  try {
    addLog('Analyzing Market', 'Executing Google Search queries for industry trends and market gaps...');
    const startTime = Date.now();
    const { text, sources } = await generateGroundedContent(prompt, systemInstruction);
    const durationMs = Date.now() - startTime;

    const fallbackAnalysis = {
      executive_summary: `Degraded mode: the model returned no parseable analysis for ${order.business_name} in ${order.industry}.`,
      market_overview: `Degraded mode: no market overview could be generated for the ${order.industry} market.`,
      strategic_gaps: ["Unavailable — model returned no data"],
      opportunities: ["Unavailable — model returned no data"],
      threats: ["Unavailable — model returned no data"],
      recommendations: ["Unavailable — model returned no data"],
      market_positioning: `Unavailable — no positioning statement could be generated for ${order.business_name}.`
    };

    const parsed = extractJSON<Partial<AnalysisResult>>(text, fallbackAnalysis);

    // Collect competitor sources and market sources
    const allCompetitorSources = competitors.flatMap(c => c.sources || []);
    const combinedSourcesMap = new Map<string, SearchCitation>();
    
    [...allCompetitorSources, ...sources].forEach(s => {
      if (s.url && !combinedSourcesMap.has(s.url)) {
        combinedSourcesMap.set(s.url, s);
      }
    });

    const marketSources = Array.from(combinedSourcesMap.values());

    const data: AnalysisResult = {
      executive_summary: parsed.executive_summary || fallbackAnalysis.executive_summary,
      market_overview: parsed.market_overview || fallbackAnalysis.market_overview,
      competitors: competitors,
      strategic_gaps: Array.isArray(parsed.strategic_gaps) ? parsed.strategic_gaps : fallbackAnalysis.strategic_gaps,
      opportunities: Array.isArray(parsed.opportunities) ? parsed.opportunities : fallbackAnalysis.opportunities,
      threats: Array.isArray(parsed.threats) ? parsed.threats : fallbackAnalysis.threats,
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : fallbackAnalysis.recommendations,
      market_positioning: parsed.market_positioning || fallbackAnalysis.market_positioning,
      market_sources: marketSources
    };

    addLog('Completed', `Strategic analysis completed with ${marketSources.length} verified citations.`, 'completed');
    logs[logs.length - 1].durationMs = durationMs;

    return { data, logs };
  } catch (error: unknown) {
    addLog('Error', `Analyst failed: ${getErrorMessage(error)}`, 'error');
    throw error;
  }
}
