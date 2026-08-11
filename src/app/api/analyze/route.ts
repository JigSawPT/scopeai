import { NextResponse } from 'next/server';
import { runAgentPipeline } from '@/lib/agents/orchestrator';
import { OrderRequest } from '@/lib/agents/types';
import { saveOrder } from '@/lib/store';
import { getErrorMessage } from '@/lib/gemini';

const DEMOS = {
  'b2b-saas': {
    business_name: 'MailPulse AI',
    business_description: 'An automated email marketing platform that uses generative AI to write, personalize, and optimize B2B sales sequences.',
    industry: 'B2B Software',
    target_market: 'B2B SaaS companies, sales teams, and agencies',
    competitors: ['Mailchimp', 'HubSpot Email', 'Instantly.ai'],
    specific_questions: 'How do competitors price their AI features? What is their main customer churn cause?',
    tier: 'professional' as const,
  },
  'coffee-roasters': {
    business_name: 'TerraCraft Coffee',
    business_description: 'Direct-to-consumer sustainable coffee roasters sourcing single-origin beans directly from high-altitude farms in Colombia and Ethiopia.',
    industry: 'Food & Beverage',
    target_market: 'Coffee enthusiasts, specialty cafes, and remote workers',
    competitors: ['Blue Bottle Coffee'],
    specific_questions: 'What organic certifications do competitors highlight? What subscription discounts do they offer?',
    tier: 'starter' as const,
  },
  'fintech-payroll': {
    business_name: 'PayFlow Global',
    business_description: 'Automated crypto and fiat payroll solution for remote global teams with instant tax compliance in 50+ countries.',
    industry: 'Fintech',
    target_market: 'Remote-first startups and international hiring managers',
    competitors: ['Deel', 'Rippling', 'Oyster HR'],
    specific_questions: 'What are their transparent transaction fees versus hidden FX markups?',
    tier: 'professional' as const,
  },
} as const;

const rateLimitStore = new Map<string, number>();
const DEMO_COOLDOWN_MS = 15 * 60 * 1_000;

function getClientKey(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const demo = DEMOS[body.demo_id as keyof typeof DEMOS];
    const clientKey = getClientKey(request);
    const nextAllowedAt = rateLimitStore.get(clientKey) || 0;

    if (!demo) {
      return NextResponse.json({ error: 'Only preset demo scenarios can be run from this endpoint.' }, { status: 400 });
    }

    if (Date.now() < nextAllowedAt) {
      const minutes = Math.ceil((nextAllowedAt - Date.now()) / 60_000);
      return NextResponse.json({ error: `Please wait ${minutes} minutes before running another live demo.` }, { status: 429 });
    }

    rateLimitStore.set(clientKey, Date.now() + DEMO_COOLDOWN_MS);
    
    const order: OrderRequest = {
      id: crypto.randomUUID(),
      access_token: crypto.randomUUID(),
      ...demo,
      competitors: [...demo.competitors],
      customer_email: 'demo@scopeai.app',
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    await saveOrder(order);

    // Run the pipeline in the background so the client can watch live telemetry
    runAgentPipeline(order).catch((err) => {
      console.error(`Pipeline error for order ${order.id}:`, err);
    });

    return NextResponse.json({ order_id: order.id, access_token: order.access_token });
  } catch (error: unknown) {
    console.error('API Error:', error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
