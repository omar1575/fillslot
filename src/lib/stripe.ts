import Stripe from "stripe";
import { stripeSecretKey } from "@/lib/env";

let stripe: Stripe | null = null;
let loadedKey: string | null = null;

export function getStripe() {
  const key = stripeSecretKey();
  if (!key) return null;
  if (!stripe || loadedKey !== key) {
    stripe = new Stripe(key, {
      appInfo: { name: "Fillslot", version: "0.1.0" },
      maxNetworkRetries: 2,
    });
    loadedKey = key;
  }
  return stripe;
}
