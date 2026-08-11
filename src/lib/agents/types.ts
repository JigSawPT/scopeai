export interface SearchCitation {
  title: string;
  url: string;
  snippet?: string;
}

export interface AgentLogEntry {
  id: string;
  timestamp: string;
  agent: 'INVESTIGATOR' | 'ANALYST' | 'WRITER' | 'ORCHESTRATOR';
  action: string;
  details: string;
  status: 'running' | 'completed' | 'error';
  durationMs?: number;
}

export interface CompetitorData {
  name: string;
  website?: string;
  pricing?: string;
  strengths: string[];
  weaknesses: string[];
  reviews_summary?: string;
  market_position?: string;
  sources: SearchCitation[];
}

export interface AnalysisResult {
  executive_summary: string;
  market_overview: string;
  competitors: CompetitorData[];
  strategic_gaps: string[];
  opportunities: string[];
  threats: string[];
  recommendations: string[];
  market_positioning?: string;
  market_sources: SearchCitation[];
}

export interface OrderRequest {
  id: string;
  access_token: string;
  business_name: string;
  business_description: string;
  industry: string;
  target_market: string;
  competitors: string[];
  specific_questions?: string;
  tier: 'starter' | 'professional' | 'enterprise';
  customer_email: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  created_at: string;
}

export interface Report {
  id: string;
  order_id: string;
  content: AnalysisResult;
  markdown: string;
  logs: AgentLogEntry[];
  all_sources: SearchCitation[];
  generated_at: string;
}
