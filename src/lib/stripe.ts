import Stripe from "stripe";

let stripe: Stripe | null = null;

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!stripe) {
    stripe = new Stripe(key, {
      appInfo: { name: "Fillslot", version: "0.1.0" },
      maxNetworkRetries: 2,
    });
  }
  return stripe;
}
