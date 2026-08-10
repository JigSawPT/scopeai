import { Firestore, FieldValue } from '@google-cloud/firestore';
import { OrderRequest, Report, AgentLogEntry } from '@/lib/agents/types';

let firestore: Firestore | null = null;

function getDb(): Firestore {
  if (!firestore) {
    firestore = new Firestore({
      projectId: process.env.GCP_PROJECT_ID,
    });
  }
  return firestore;
}

function clean<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export async function saveOrderToDB(order: OrderRequest): Promise<void> {
  await getDb().collection('orders').doc(order.id).set(clean(order));
}

export async function getOrderFromDB(id: string): Promise<OrderRequest | undefined> {
  const doc = await getDb().collection('orders').doc(id).get();
  return doc.exists ? (doc.data() as OrderRequest) : undefined;
}

export async function getAllOrdersFromDB(): Promise<OrderRequest[]> {
  const snapshot = await getDb().collection('orders').get();
  return snapshot.docs.map(d => d.data() as OrderRequest);
}

export async function saveReportToDB(report: Report): Promise<void> {
  const data = clean(report);
  const batch = getDb().batch();
  batch.set(getDb().collection('reports').doc(report.id), data);
  batch.set(getDb().collection('reports').doc(report.order_id), data);
  await batch.commit();
}

export async function getReportFromDB(id: string): Promise<Report | undefined> {
  const doc = await getDb().collection('reports').doc(id).get();
  return doc.exists ? (doc.data() as Report) : undefined;
}

export async function addLogToDB(orderId: string, log: AgentLogEntry): Promise<void> {
  await getDb().collection('logs').doc(orderId).set(
    { logs: FieldValue.arrayUnion(clean(log)) },
    { merge: true }
  );
}

export async function getLogsFromDB(orderId: string): Promise<AgentLogEntry[]> {
  const doc = await getDb().collection('logs').doc(orderId).get();
  if (!doc.exists) return [];
  const data = doc.data();
  return Array.isArray(data?.logs) ? (data!.logs as AgentLogEntry[]) : [];
}
