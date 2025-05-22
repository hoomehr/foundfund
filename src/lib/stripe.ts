import { loadStripe, Stripe as StripeClient } from '@stripe/stripe-js';

// Stripe public key (test mode)
// Use the key from environment variables, or if not available, use a placeholder
// In production, you should always use environment variables
const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

// Initialize Stripe on the client side
let stripePromise: Promise<StripeClient | null>;

export const getStripe = () => {
  if (!stripePromise && stripePublicKey) {
    stripePromise = loadStripe(stripePublicKey);
  } else if (!stripePublicKey) {
    return Promise.resolve(null);
  }
  return stripePromise;
};
