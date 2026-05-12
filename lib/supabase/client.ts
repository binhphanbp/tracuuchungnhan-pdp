import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/types/database";
import { getSupabasePublicEnv } from "./env";

/**
 * Browser-side Supabase client (uses the public/anon/publishable key).
 *
 * `createBrowserClient` already singletons internally, so calling this
 * function in many components is fine — there's only ever one socket.
 */
export function createClient() {
  const { url, key } = getSupabasePublicEnv();
  return createBrowserClient<Database>(url, key);
}
