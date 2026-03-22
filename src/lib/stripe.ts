import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export { stripePromise };

/**
 * Stripe Price IDs for each subscription plan.
 *
 * HOW TO POPULATE:
 *   1. Get your test secret key from 1Password → "Stripe Test Keys"
 *   2. Run: STRIPE_SECRET_KEY=sk_test_... npx tsx scripts/stripe-setup.ts
 *   3. Replace the placeholder strings below with the output price IDs.
 *
 * These are test-mode IDs. Run the script again with a live key before going to production.
 */
export const PRICE_IDS: Record<string, string> = {
  Starter: 'price_1TDn0H6Xc06SnkKQ7epakWFT', // $49/mo
  Growth:  'price_1TDn0I6Xc06SnkKQNxQe0eNn', // $99/mo  (most popular)
  Scale:   'price_1TDn0I6Xc06SnkKQtRDdKU7w', // $149/mo
};
