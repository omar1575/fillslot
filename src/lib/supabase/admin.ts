import { createClient } from "@supabase/supabase-js";
import { requireServiceRoleKey, requireSupabaseEnv } from "@/lib/env";

export function createSupabaseAdminClient() {
  const { url } = requireSupabaseEnv();
  return createClient(url, requireServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
