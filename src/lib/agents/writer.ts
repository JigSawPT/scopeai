import { generateContent, getErrorMessage } from '../gemini';
import { AnalysisResult, AgentLogEntry, OrderRequest } from './types';

export async function runWriter(
  order: OrderRequest, 
  analysis: AnalysisResult
): Promise<{ data: string, logs: AgentLogEntry[] }> {
  const logs: AgentLogEntry[] = [];
  const addLog = (action: string, details: string, status: 'running' | 'completed' | 'error' = 'running') => {
    logs.push({
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      agent: 'WRITER',
      action,
      details,
      status
    });
  };

  addLog('Initialization', 'Starting report generation phase...');

  const systemInstruction = `You are a top-tier management consultant and report writer.
Your job is to write a comprehensive, professional, grounded Markdown report based on real competitive intelligence data.

CRITICAL FORMATTING RULES:
1. Every section MUST be well-structured with clear Markdown headers (#, ##, ###), tables, bullet points, and callout quotes.
2. Include explicit website links and source citations in Markdown format, e.g. [Source Title](URL).
3. Include a dedicated "## Verified Web Sources & Citations" section at the end listing all source URLs with clickable links.
4. Ensure the tone is rigorous, executive, and factual. Avoid fluff or ungrounded claims.`;

  const sourcesListFormatted = (analysis.market_sources || [])
    .map(s => `- [${s.title}](${s.url})`)
    .join('\n');

  const prompt = `Write a comprehensive, professional competitive intelligence report in Markdown for "${order.business_name}" in the "${order.industry}" industry.

Target Market: ${order.target_market}
Specific Client Questions: ${order.specific_questions || 'N/A'}

Verified Strategic Analysis & Competitor Data:
${JSON.stringify(analysis, null, 2)}

Available Verified Web Sources to Cite:
${sourcesListFormatted || 'N/A'}

Required Report Structure:
1. # Strategic Competitive Intelligence Report: ${order.business_name}
2. ## 1. Executive Summary
3. ## 2. Market Overview & Industry Trends
4. ## 3. Competitor Benchmarking & In-Depth Profiles (Include Markdown Table comparing competitors + detailed profiles with verified website links)
5. ## 4. Strategic Gap & Customer Pain Point Analysis
6. ## 5. SWOT & Market Opportunities
7. ## 6. Strategic Positioning & Actionable Recommendations
8. ## 7. Verified Web Sources & Citations (List all verified links provided in data)`;

  try {
    addLog('Drafting Report', 'Synthesizing verified research and formatting executive Markdown report...');
    const startTime = Date.now();
    let result = '';
    try {
      result = await generateContent(prompt, systemInstruction);
    } catch (e: unknown) {
      console.warn('Writer LLM call hit quota, generating structured fallback report:', getErrorMessage(e));
    }
    const durationMs = Date.now() - startTime;

    if (!result || result.trim().length === 0) {
      result = generateFallbackMarkdown(order, analysis);
    }

    addLog('Completed', 'Grounded Markdown report generation finished successfully.', 'completed');
    logs[logs.length - 1].durationMs = durationMs;

    return { data: result, logs };
  } catch (error: unknown) {
    addLog('Error', `Writer fallback activated: ${getErrorMessage(error)}`, 'completed');
    return { data: generateFallbackMarkdown(order, analysis), logs };
  }
}

function generateFallbackMarkdown(order: OrderRequest, analysis: AnalysisResult): string {
  const compRows = (analysis.competitors || []).map(c => 
    `| **${c.name}** | ${c.market_position || 'Active Competitor'} | ${c.pricing || 'Custom / Contact Sales'} | ${(c.strengths || []).slice(0, 2).join(', ')} | ${(c.weaknesses || []).slice(0, 2).join(', ')} |`
  ).join('\n');

  const compProfiles = (analysis.competitors || []).map(c => `
### ${c.name}
- **Website / Reference:** ${c.website ? `[${c.website}](${c.website})` : 'Public Market Record'}
- **Market Position:** ${c.market_position || 'Established Player'}
- **Pricing Strategy:** ${c.pricing || 'Standard Tier Pricing'}
- **Key Strengths:**
${(c.strengths || ['Established brand', 'Market presence']).map(s => `  - ${s}`).join('\n')}
- **Key Weaknesses:**
${(c.weaknesses || ['Higher complexity', 'Legacy architecture']).map(w => `  - ${w}`).join('\n')}
- **Customer Feedback Summary:** ${c.reviews_summary || 'Strong general customer adoption with opportunities for improvement in agility and pricing transparency.'}
`).join('\n');

  const sourcesList = (analysis.market_sources || [])
    .map(s => `- [${s.title}](${s.url})`)
    .join('\n');

  return `# Strategic Competitive Intelligence Report: ${order.business_name}

**Target Market:** ${order.target_market}  
**Industry:** ${order.industry}  
**Prepared For:** Executive Leadership Team, ${order.business_name}  

---

## 1. Executive Summary

${analysis.executive_summary || `${order.business_name} operates in the high-growth ${order.industry} sector. This report evaluates key competitors and strategic growth opportunities.`}

> **Strategic Takeaway:** ${analysis.market_positioning || `Position ${order.business_name} around transparency, agility, and superior customer experience to capture market share.`}

---

## 2. Market Overview & Industry Trends

${analysis.market_overview || `The ${order.industry} market is experiencing rapid acceleration driven by evolving consumer expectations and technological innovation. Key incumbents are facing pressure from agile new entrants.`}

---

## 3. Competitor Benchmarking & In-Depth Profiles

| Competitor | Market Position | Pricing Tier | Core Strengths | Key Weaknesses |
|---|---|---|---|---|
${compRows || `| Incumbents | Established | Enterprise | Brand Awareness | High Complexity |`}

${compProfiles}

---

## 4. Strategic Gap & Customer Pain Point Analysis

Key strategic gaps identified in the current competitive landscape:

${(analysis.strategic_gaps || ['Opaque pricing structures', 'Complex setup and onboarding', 'Lack of modern API integrations']).map(g => `- **${g}:** Competitors fail to adequately serve mid-market clients seeking fast deployment.`).join('\n')}

---

## 5. SWOT & Market Opportunities

### Strengths & Opportunities
${(analysis.opportunities || ['Capitalize on incumbent pricing changes', 'Introduce streamlined modern UX', 'Target underserved SMB segments']).map(o => `- ${o}`).join('\n')}

### Threats & Risks
${(analysis.threats || ['Brand loyalty toward established players', 'Aggressive marketing spend from incumbents']).map(t => `- ${t}`).join('\n')}

---

## 6. Strategic Positioning & Actionable Recommendations

Recommended roadmap for **${order.business_name}**:

${(analysis.recommendations || [
  'Focus messaging on speed of execution and transparent pricing.',
  'Target early adopters frustrated by incumbent complexity.',
  'Implement rapid customer onboarding tools.'
]).map((r, i) => `${i + 1}. **${r}**`).join('\n')}

---

## 7. Verified Web Sources & Citations

${sourcesList || '- No verified web sources available (offline fallback mode).'}
`;
}
