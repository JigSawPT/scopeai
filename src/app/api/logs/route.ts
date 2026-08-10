import { NextResponse } from 'next/server';
import { connection } from 'next/server';
import { getReport, getLogs } from '@/lib/store';

export async function GET(request: Request) {
  await connection();

  const { searchParams } = new URL(request.url);
  // Support both ?id= and ?order_id= for flexibility
  const id = searchParams.get('id') || searchParams.get('order_id');

  if (!id) {
    return NextResponse.json({ error: 'Missing id or order_id parameter' }, { status: 400 });
  }

  // Try to find the report by report id OR by order id
  const report = await getReport(id);
  
  if (report) {
    return NextResponse.json({ report, logs: report.logs });
  }

  // If no full report yet, return partial logs (pipeline may still be running)
  const logs = await getLogs(id);
  return NextResponse.json({ logs, report: null });
}
