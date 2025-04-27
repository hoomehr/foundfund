import { loadStripe, Stripe as StripeClient } from '@stripe/stripe-js';

// Stripe public key (test mode)
// Use the key from environment variables, or if not available, use a placeholder
// In production, you should always use environment variables
const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

// Initialize Stripe on the client side
let stripePromise: Promise<StripeClient | null>;

export const getStripe = () => {
  if (!stripePromise && stripePublicKey) {
    console.log('Initializing Stripe with public key');
    stripePromise = loadStripe(stripePublicKey);
  } else if (!stripePublicKey) {
    console.error('Stripe public key is not defined in environment variables');
    return Promise.resolve(null);
  }
  return stripePromise;
};
