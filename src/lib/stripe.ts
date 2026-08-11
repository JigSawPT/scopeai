import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key_for_build', {
  typescript: true,
});

export const TIER_PRICES = {
  starter: {
    amount: 4900, // $49.00 USD
    name: 'ScopeAI Starter Brief',
    description: 'One-competitor competitive intelligence brief with live web sources.',
  },
  professional: {
    amount: 9900, // $99.00 USD
    name: 'ScopeAI Professional Brief',
    description: 'Three-competitor competitive intelligence brief with strategic recommendations.',
  },
  enterprise: {
    amount: 14900, // $149.00 USD
    name: 'ScopeAI Enterprise Suite',
    description: 'Up to five-competitor competitive intelligence brief with strategic recommendations.',
  },
};
