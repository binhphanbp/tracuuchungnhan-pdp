import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import { getSupabasePublicEnv, getSupabaseServiceRoleKey } from "./env";

/**
 * Server-only Supabase client backed by the **service role key**, which
 * bypasses RLS. Only import this from API routes or Server Actions you've
 * explicitly audited — never from a Client Component or Server Component
 * that could leak its bundle.
 *
 * The `import "server-only"` directive at the top makes the build fail loudly
 * if someone does try to import this from a client module.
 */
export function createServiceClient() {
  const { url } = getSupabasePublicEnv();
  const serviceKey = getSupabaseServiceRoleKey();

  return createSupabaseClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
