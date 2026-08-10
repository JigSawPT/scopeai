import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key_for_build', {
  typescript: true,
});

export const TIER_PRICES = {
  starter: {
    amount: 4900, // $49.00 USD
    name: 'ScopeAI Starter Brief',
    description: 'Single competitor deep-dive report, 10-page analysis, 24h delivery.',
  },
  professional: {
    amount: 9900, // $99.00 USD
    name: 'ScopeAI Professional Brief',
    description: '3 competitor analysis, 25-page report, market positioning map.',
  },
  enterprise: {
    amount: 14900, // $149.00 USD
    name: 'ScopeAI Enterprise Suite',
    description: '5+ competitor deep-dive, 40-page report, priority 24h delivery.',
  },
};
