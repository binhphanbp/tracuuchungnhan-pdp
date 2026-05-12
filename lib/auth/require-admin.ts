import "server-only";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type AdminClaims = {
  sub: string;
  email?: string;
};

/**
 * Server-side guard for `/admin/*` Server Components. Verifies the request
 * has a valid Supabase JWT AND that the user has an `admin` or `super_admin`
 * role in `public.profiles`.
 *
 * Use this in every `app/admin/**\/page.tsx` and `layout.tsx` even though
 * `proxy.ts` already redirects unauthenticated users — proxy can be spoofed
 * by anyone who controls cookies, server-side checks cannot.
 */
export async function requireAdmin(): Promise<AdminClaims> {
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (!claims) {
    redirect("/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", claims.sub as string)
    .maybeSingle();

  if (error || !profile || !["admin", "super_admin"].includes(profile.role)) {
    // Authenticated user but not an admin — send them home.
    redirect("/");
  }

  return {
    sub: claims.sub as string,
    email: typeof claims.email === "string" ? claims.email : undefined,
  };
}
