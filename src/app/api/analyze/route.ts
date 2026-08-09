import { NextResponse } from 'next/server';
import { runAgentPipeline } from '@/lib/agents/orchestrator';
import { OrderRequest } from '@/lib/agents/types';
import { saveOrder } from '@/lib/store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const order: OrderRequest = {
      id: crypto.randomUUID(),
      business_name: body.business_name || 'Unknown',
      business_description: body.business_description || '',
      industry: body.industry || 'General',
      target_market: body.target_market || 'General',
      competitors: body.competitors || [],
      specific_questions: body.specific_questions,
      tier: body.tier || 'starter',
      customer_email: body.customer_email || 'test@example.com',
      status: 'pending',
      created_at: new Date().toISOString(),
      ...body
    };

    saveOrder(order);

    const report = await runAgentPipeline(order);

    return NextResponse.json(report);
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
