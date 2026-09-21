export function appUrl() {
  return (
    process.env.APP_URL ??
    process.env.AUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000"
  );
}

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function isGoogleAuthConfigured() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  );
}

export function isResendConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

export function isDevLoginEnabled() {
  return process.env.NODE_ENV !== "production";
}
