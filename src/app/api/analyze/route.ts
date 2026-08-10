import { NextResponse } from 'next/server';
import { runAgentPipeline } from '@/lib/agents/orchestrator';
import { OrderRequest } from '@/lib/agents/types';
import { saveOrder } from '@/lib/store';
import { getErrorMessage } from '@/lib/gemini';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const order: OrderRequest = {
      id: crypto.randomUUID(),
      business_name: body.business_name || 'Unknown',
      business_description: body.business_description || '',
      industry: body.industry || 'General',
      target_market: body.target_market || 'General',
      competitors: Array.isArray(body.competitors) ? body.competitors : [],
      specific_questions: body.specific_questions,
      tier: body.tier || 'starter',
      customer_email: body.customer_email || 'test@example.com',
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    await saveOrder(order);

    // Run the pipeline in the background so the client can watch live telemetry
    runAgentPipeline(order).catch((err) => {
      console.error(`Pipeline error for order ${order.id}:`, err);
    });

    return NextResponse.json({ order_id: order.id });
  } catch (error: unknown) {
    console.error('API Error:', error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
