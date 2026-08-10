import { OrderRequest, Report, AgentLogEntry } from './types';
import { runInvestigator } from './investigator';
import { runAnalyst } from './analyst';
import { runWriter } from './writer';
import { storeLogs, saveReport, updateOrderStatus } from '../store';
import { getErrorMessage } from '../gemini';

export async function runAgentPipeline(order: OrderRequest): Promise<Report> {
  const allLogs: AgentLogEntry[] = [];
  const reportId = crypto.randomUUID();

  const addOrchestratorLog = async (action: string, details: string, status: 'running' | 'completed' | 'error' = 'running') => {
    const log: AgentLogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      agent: 'ORCHESTRATOR',
      action,
      details,
      status
    };
    allLogs.push(log);
    await storeLogs(order.id, [log]);
  };

  try {
    await updateOrderStatus(order.id, 'processing');
    await addOrchestratorLog('Started', `Beginning pipeline for order ${order.id}`);

    // 1. Investigator (Google Search Grounded)
    const { data: competitors, logs: invLogs } = await runInvestigator(order);
    allLogs.push(...invLogs);
    await storeLogs(order.id, invLogs);

    // 2. Analyst (Google Search Grounded)
    const { data: analysis, logs: anaLogs } = await runAnalyst(order, competitors);
    allLogs.push(...anaLogs);
    await storeLogs(order.id, anaLogs);

    // 3. Writer (Markdown Report Generator)
    const { data: markdown, logs: writLogs } = await runWriter(order, analysis);
    allLogs.push(...writLogs);
    await storeLogs(order.id, writLogs);

    await addOrchestratorLog('Completed', 'Grounded agent pipeline finished successfully', 'completed');

    const report: Report = {
      id: reportId,
      order_id: order.id,
      content: analysis,
      markdown,
      logs: allLogs,
      all_sources: analysis.market_sources || [],
      generated_at: new Date().toISOString()
    };
    
    await saveReport(report);
    await updateOrderStatus(order.id, 'completed');

    return report;
  } catch (error: unknown) {
    await addOrchestratorLog('Failed', `Pipeline failed: ${getErrorMessage(error)}`, 'error');
    await updateOrderStatus(order.id, 'error');
    throw error;
  }
}
