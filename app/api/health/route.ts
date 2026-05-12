import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Liveness probe — never touches Supabase, never redirects. */
export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      service: "pdp-certificates",
      time: new Date().toISOString(),
    },
    { headers: { "cache-control": "no-store" } },
  );
}
