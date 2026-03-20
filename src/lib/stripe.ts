import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export { stripePromise };

// For MVP: we'll use Stripe Payment Links
// These will be configured in Stripe Dashboard and the URLs stored here
export const STRIPE_LINKS = {
  starter: '', // Will be filled with actual Stripe Payment Link URLs
  growth: '',
  scale: '',
};
