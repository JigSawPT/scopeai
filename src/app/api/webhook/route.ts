import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getOrder, saveOrder } from '@/lib/store';
import { runAgentPipeline } from '@/lib/agents/orchestrator';

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature') || '';

  let event;

  try {
    if (process.env.STRIPE_WEBHOOK_SECRET) {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } else {
      event = JSON.parse(body);
    }
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Webhook Error' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;
    const orderId = session.metadata?.order_id;

    if (orderId) {
      const order = getOrder(orderId);
      if (order) {
        order.status = 'processing';
        saveOrder(order);

        // Asynchronously trigger the Gemini 3.6 Flash agent pipeline
        runAgentPipeline(order).catch((err) => {
          console.error(`Error running agent pipeline for order ${orderId}:`, err);
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
