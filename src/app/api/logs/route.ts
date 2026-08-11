import { NextResponse } from 'next/server';
import { connection } from 'next/server';
import { getOrder, getReport, getLogs } from '@/lib/store';

export async function GET(request: Request) {
  await connection();

  const { searchParams } = new URL(request.url);
  // Support both ?id= and ?order_id= for flexibility
  const id = searchParams.get('id') || searchParams.get('order_id');
  const accessToken = searchParams.get('access') || '';

  if (!id) {
    return NextResponse.json({ error: 'Missing id or order_id parameter' }, { status: 400 });
  }

  // Try to find the report by report id OR by order id
  const report = await getReport(id);
  const order = await getOrder(report?.order_id || id);

  if (!order) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  // Orders created before the access-token system (demo/sample reports) stay
  // accessible; newer orders strictly require their private token.
  if (order.access_token && order.access_token !== accessToken) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }
  
  if (report) {
    return NextResponse.json({ report, logs: report.logs });
  }

  // If no full report yet, return partial logs (pipeline may still be running)
  const logs = await getLogs(id);
  return NextResponse.json({ logs, report: null });
}
