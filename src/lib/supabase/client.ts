import { createBrowserClient } from "@supabase/ssr";
import { requireSupabaseEnv } from "@/lib/env";

export function createSupabaseBrowserClient() {
  const { url, anonKey } = requireSupabaseEnv();
  return createBrowserClient(url, anonKey);
}
