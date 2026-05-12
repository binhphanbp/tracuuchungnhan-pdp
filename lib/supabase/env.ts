/**
 * Reads the Supabase environment variables, accepting both the modern
 * `PUBLISHABLE_KEY` and the legacy `ANON_KEY` naming.
 *
 * We keep this in a tiny helper so missing-env errors all surface from one
 * place with a friendly message, instead of spreading `process.env.X!`
 * non-null assertions across the codebase.
 */
export function getSupabasePublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) in your .env.local — see .env.example.",
    );
  }
  return { url, key };
}

export function getSupabaseServiceRoleKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY. This must only be set on the server.",
    );
  }
  return key;
}
