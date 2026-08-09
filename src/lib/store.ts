import { OrderRequest, Report, AgentLogEntry } from './agents/types';
import { 
  saveOrderToDB, 
  getOrderFromDB, 
  saveReportToDB, 
  getReportFromDB, 
  addLogToDB, 
  getLogsFromDB 
} from './db';

const globalAny = global as any;

if (!globalAny.ordersStore) {
  globalAny.ordersStore = new Map<string, OrderRequest>();
}
if (!globalAny.reportsStore) {
  globalAny.reportsStore = new Map<string, Report>();
}
if (!globalAny.logsStore) {
  globalAny.logsStore = new Map<string, AgentLogEntry[]>();
}

export function saveOrder(order: OrderRequest) {
  globalAny.ordersStore.set(order.id, order);
  try {
    saveOrderToDB(order);
  } catch (err) {
    console.error('DB save order error:', err);
  }
}

export function getOrder(id: string): OrderRequest | undefined {
  return globalAny.ordersStore.get(id) || getOrderFromDB(id);
}

export function updateOrderStatus(id: string, status: OrderRequest['status']) {
  const order = getOrder(id);
  if (order) {
    order.status = status;
    saveOrder(order);
  }
}

export function saveReport(report: Report) {
  globalAny.reportsStore.set(report.id, report);
  globalAny.reportsStore.set(report.order_id, report);
  try {
    saveReportToDB(report);
  } catch (err) {
    console.error('DB save report error:', err);
  }
}

export function getReport(id: string): Report | undefined {
  return globalAny.reportsStore.get(id) || getReportFromDB(id);
}

export function storeLogs(orderId: string, logs: AgentLogEntry[]) {
  const existing = globalAny.logsStore.get(orderId) || [];
  const updated = [...existing, ...logs];
  globalAny.logsStore.set(orderId, updated);
  try {
    logs.forEach(l => addLogToDB(orderId, l));
  } catch (err) {
    console.error('DB save log error:', err);
  }
}

export function getLogs(orderId: string): AgentLogEntry[] {
  const memoryLogs = globalAny.logsStore.get(orderId) || [];
  if (memoryLogs.length > 0) return memoryLogs;
  return getLogsFromDB(orderId);
}
