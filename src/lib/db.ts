import fs from 'fs';
import path from 'path';
import { OrderRequest, Report, AgentLogEntry } from '@/lib/agents/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface DatabaseSchema {
  orders: Record<string, OrderRequest>;
  reports: Record<string, Report>;
  logs: Record<string, AgentLogEntry[]>;
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadDB(): DatabaseSchema {
  try {
    ensureDataDir();
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading db.json:', error);
  }
  return { orders: {}, reports: {}, logs: {} };
}

function saveDB(db: DatabaseSchema) {
  try {
    ensureDataDir();
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing db.json:', error);
  }
}

export function saveOrderToDB(order: OrderRequest) {
  const db = loadDB();
  db.orders[order.id] = order;
  saveDB(db);
}

export function getOrderFromDB(id: string): OrderRequest | undefined {
  const db = loadDB();
  return db.orders[id];
}

export function getAllOrdersFromDB(): OrderRequest[] {
  const db = loadDB();
  return Object.values(db.orders);
}

export function saveReportToDB(report: Report) {
  const db = loadDB();
  db.reports[report.id] = report;
  db.reports[report.order_id] = report; // Index by order_id as well
  saveDB(db);
}

export function getReportFromDB(id: string): Report | undefined {
  const db = loadDB();
  return db.reports[id];
}

export function addLogToDB(orderId: string, log: AgentLogEntry) {
  const db = loadDB();
  if (!db.logs[orderId]) {
    db.logs[orderId] = [];
  }
  db.logs[orderId].push(log);
  saveDB(db);
}

export function getLogsFromDB(orderId: string): AgentLogEntry[] {
  const db = loadDB();
  return db.logs[orderId] || [];
}
