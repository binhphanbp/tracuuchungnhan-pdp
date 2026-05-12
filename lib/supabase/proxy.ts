import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/types/database";
import { getSupabasePublicEnv } from "./env";

/**
 * Refresh the Supabase session on every request, and gate `/admin/*` routes.
 *
 * Called from the root `proxy.ts` (Next.js 16 — formerly `middleware.ts`).
 *
 * IMPORTANT: We use `getClaims()` (validates the JWT signature against the
 * project's published public keys) — never `getSession()` for server-side
 * auth checks, because the latter does not revalidate tokens.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // If env isn't configured yet (e.g. during a fresh `pnpm build` in CI before
  // production envs are set), just pass the request through. The /admin route
  // server-side `requireAdmin()` will still reject anything sensitive.
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !(
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  ) {
    return supabaseResponse;
  }

  const { url, key } = getSupabasePublicEnv();

  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        supabaseResponse = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          supabaseResponse.cookies.set(name, value, options);
        }
      },
    },
  });

  // Do not insert any code between createServerClient() and getClaims() —
  // it would interfere with cookie refresh and could cause sporadic logouts.
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginRoute = pathname.startsWith("/login");

  if (isAdminRoute && !claims) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoginRoute && claims) {
    const adminUrl = request.nextUrl.clone();
    adminUrl.pathname = "/admin";
    adminUrl.search = "";
    return NextResponse.redirect(adminUrl);
  }

  return supabaseResponse;
}
