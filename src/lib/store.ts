import { OrderRequest, Report, AgentLogEntry } from './agents/types';
import { 
  saveOrderToDB, 
  getOrderFromDB, 
  saveReportToDB, 
  getReportFromDB, 
  addLogToDB, 
  getLogsFromDB 
} from './db';

const globalAny = global as typeof globalThis & {
  ordersStore?: Map<string, OrderRequest>;
  reportsStore?: Map<string, Report>;
  logsStore?: Map<string, AgentLogEntry[]>;
};

globalAny.ordersStore ??= new Map<string, OrderRequest>();
globalAny.reportsStore ??= new Map<string, Report>();
globalAny.logsStore ??= new Map<string, AgentLogEntry[]>();

const ordersStore = globalAny.ordersStore;
const reportsStore = globalAny.reportsStore;
const logsStore = globalAny.logsStore;

export async function saveOrder(order: OrderRequest) {
  ordersStore.set(order.id, order);
  try {
    await saveOrderToDB(order);
  } catch (err) {
    console.error('DB save order error:', err);
  }
}

export async function getOrder(id: string): Promise<OrderRequest | undefined> {
  return ordersStore.get(id) || getOrderFromDB(id);
}

export async function updateOrderStatus(id: string, status: OrderRequest['status']) {
  const order = await getOrder(id);
  if (order) {
    order.status = status;
    await saveOrder(order);
  }
}

export async function saveReport(report: Report) {
  reportsStore.set(report.id, report);
  reportsStore.set(report.order_id, report);
  try {
    await saveReportToDB(report);
  } catch (err) {
    console.error('DB save report error:', err);
  }
}

export async function getReport(id: string): Promise<Report | undefined> {
  return reportsStore.get(id) || getReportFromDB(id);
}

export async function storeLogs(orderId: string, logs: AgentLogEntry[]) {
  const existing = logsStore.get(orderId) || [];
  const updated = [...existing, ...logs];
  logsStore.set(orderId, updated);
  try {
    await Promise.all(logs.map(l => addLogToDB(orderId, l)));
  } catch (err) {
    console.error('DB save log error:', err);
  }
}

export async function getLogs(orderId: string): Promise<AgentLogEntry[]> {
  const memoryLogs = logsStore.get(orderId) || [];
  if (memoryLogs.length > 0) return memoryLogs;
  return getLogsFromDB(orderId);
}
