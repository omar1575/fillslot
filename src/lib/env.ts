export function appUrl() {
  return (
    process.env.APP_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000"
  );
}

export function stripeSecretKey() {
  return (
    process.env.STRIPE_SECRET_KEY ||
    process.env.STRIPE_API_KEY ||
    process.env.stripe_api_key ||
    ""
  );
}

export function isStripeConfigured() {
  return Boolean(stripeSecretKey());
}

export function isDevLoginEnabled() {
  return process.env.NODE_ENV !== "production";
}

export function devLoginPassword() {
  return process.env.DEV_LOGIN_PASSWORD ?? "fillslot-dev-local";
}

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.DATABASE_URL?.startsWith("postgres"),
  );
}

export function requireSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Fillslot needs NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY. Copy .env.example to .env.local.",
    );
  }
  return { url, anonKey };
}

export function requireDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url?.startsWith("postgres")) {
    throw new Error(
      "Fillslot needs DATABASE_URL pointing at Supabase Postgres (postgres://…). Copy .env.example to .env.local.",
    );
  }
  return url;
}

export function requireServiceRoleKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "Seeding needs SUPABASE_SERVICE_ROLE_KEY so demo Auth users can be created.",
    );
  }
  return key;
}

export function safeNextPath(value: unknown, fallback = "/") {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}
