import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/types/database";
import { getSupabasePublicEnv } from "./env";

/**
 * Server-side Supabase client for Server Components, Server Actions, and
 * Route Handlers. Reads/writes the auth cookie via Next's `cookies()` API.
 *
 * Always create a fresh client per request (do not memoise across requests)
 * because the cookie store is request-scoped.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, key } = getSupabasePublicEnv();

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // The `setAll` method was called from a Server Component, where
          // setting cookies is not allowed. This is fine as long as the
          // root proxy.ts is refreshing the session on every request.
        }
      },
    },
  });
}
