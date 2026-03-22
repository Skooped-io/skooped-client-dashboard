/**
 * Stripe Checkout Session Utility
 *
 * Creates a hosted Stripe Checkout session and returns the redirect URL.
 *
 * ⚠️  MVP NOTE: This calls the Stripe API client-side using VITE_STRIPE_SECRET_KEY.
 * This is acceptable for local dev / sandbox (test keys only).
 * Before going live with real keys, move this to a Supabase Edge Function or
 * other server-side route so the secret key is never exposed to the browser.
 *
 * TODO (pre-launch): Move to server-side — see src/lib/stripeWebhook.ts for notes.
 */

import { PRICE_IDS } from './stripe';

const STRIPE_SECRET_KEY = import.meta.env.VITE_STRIPE_SECRET_KEY as string | undefined;

/** Maps a plan name (as stored in onboarding) to a Stripe price ID. */
function getPriceId(plan: string): string {
  const priceId = PRICE_IDS[plan];
  if (!priceId) {
    throw new Error(
      `No Stripe price ID configured for plan "${plan}". ` +
      'Run scripts/stripe-setup.ts and update PRICE_IDS in src/lib/stripe.ts.'
    );
  }
  if (priceId.includes('REPLACE_AFTER_RUNNING')) {
    throw new Error(
      `Stripe price IDs are still placeholders. ` +
      'Run: STRIPE_SECRET_KEY=sk_test_... npx tsx scripts/stripe-setup.ts'
    );
  }
  return priceId;
}

/**
 * Creates a Stripe Checkout Session for a subscription with a 14-day free trial.
 *
 * @param plan      Plan name: "Starter" | "Growth" | "Scale"
 * @param userEmail Customer email (pre-fills the Stripe checkout form)
 * @param userId    Supabase user ID (stored in metadata for webhook reconciliation)
 * @returns         Stripe-hosted checkout URL to redirect the user to
 */
export async function createCheckoutSession(
  plan: string,
  userEmail: string,
  userId: string
): Promise<string> {
  if (!STRIPE_SECRET_KEY) {
    throw new Error(
      'VITE_STRIPE_SECRET_KEY is not set. Add your Stripe test secret key to .env.local.'
    );
  }

  const priceId = getPriceId(plan);

  const params = new URLSearchParams({
    mode: 'subscription',
    customer_email: userEmail,
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': '1',
    'subscription_data[trial_period_days]': '14',
    'subscription_data[metadata][userId]': userId,
    'subscription_data[metadata][plan]': plan,
    'metadata[userId]': userId,
    'metadata[plan]': plan,
    success_url: 'https://app.skooped.io/dashboard?checkout=success',
    cancel_url: 'https://app.skooped.io/dashboard?checkout=cancelled',
  });

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const session = (await res.json()) as { url?: string; error?: { message: string } };

  if (!res.ok || !session.url) {
    throw new Error(
      `Stripe Checkout error: ${session.error?.message ?? 'Unknown error — check Stripe Dashboard'}`
    );
  }

  return session.url;
}
