import { OrderRequest, Report, AgentLogEntry } from './types';
import { runInvestigator } from './investigator';
import { runAnalyst } from './analyst';
import { runWriter } from './writer';
import { storeLogs, saveReport, updateOrderStatus } from '../store';
import { delay } from '../gemini';

export async function runAgentPipeline(order: OrderRequest): Promise<Report> {
  const allLogs: AgentLogEntry[] = [];
  const reportId = crypto.randomUUID();

  const addOrchestratorLog = (action: string, details: string, status: 'running' | 'completed' | 'error' = 'running') => {
    const log: AgentLogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      agent: 'ORCHESTRATOR',
      action,
      details,
      status
    };
    allLogs.push(log);
    storeLogs(order.id, [log]);
  };

  try {
    updateOrderStatus(order.id, 'processing');
    addOrchestratorLog('Started', `Beginning pipeline for order ${order.id}`);

    // 1. Investigator (Google Search Grounded)
    const { data: competitors, logs: invLogs } = await runInvestigator(order);
    allLogs.push(...invLogs);
    storeLogs(order.id, invLogs);

    await delay(8000);

    // 2. Analyst (Google Search Grounded)
    const { data: analysis, logs: anaLogs } = await runAnalyst(order, competitors);
    allLogs.push(...anaLogs);
    storeLogs(order.id, anaLogs);

    await delay(8000);

    // 3. Writer (Markdown Report Generator)
    const { data: markdown, logs: writLogs } = await runWriter(order, analysis);
    allLogs.push(...writLogs);
    storeLogs(order.id, writLogs);

    addOrchestratorLog('Completed', 'Grounded agent pipeline finished successfully', 'completed');

    const report: Report = {
      id: reportId,
      order_id: order.id,
      content: analysis,
      markdown,
      logs: allLogs,
      all_sources: analysis.market_sources || [],
      generated_at: new Date().toISOString()
    };
    
    saveReport(report);
    updateOrderStatus(order.id, 'completed');

    return report;
  } catch (error: any) {
    addOrchestratorLog('Failed', `Pipeline failed: ${error.message}`, 'error');
    updateOrderStatus(order.id, 'error');
    throw error;
  }
}
