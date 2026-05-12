import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import type { LookupApiResponse } from "@/types/certificate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/verify/[code] — used both by the QR landing page (server-side
 * fetch) and by anything that wants a JSON-only verification check.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ code: string }> },
): Promise<NextResponse<LookupApiResponse>> {
  const { code } = await context.params;

  const trimmed = code.trim();
  if (!trimmed) {
    return NextResponse.json<LookupApiResponse>(
      {
        ok: false,
        code: "invalid_student_code",
        message: "Thiếu mã xác thực.",
      },
      { status: 400 },
    );
  }

  let supabase;
  try {
    supabase = await createClient();
  } catch (err) {
    if (err instanceof Error && err.message.includes("Missing Supabase env")) {
      return NextResponse.json<LookupApiResponse>(
        {
          ok: false,
          code: "internal_error",
          message: "Hệ thống chưa được cấu hình.",
        },
        { status: 503 },
      );
    }
    throw err;
  }

  const { data, error } = await supabase.rpc("public_verify_certificate", {
    p_code: trimmed,
  });

  if (error) {
    console.error("public_verify_certificate failed", error);
    return NextResponse.json<LookupApiResponse>(
      {
        ok: false,
        code: "internal_error",
        message: "Không thể xác minh lúc này.",
      },
      { status: 500 },
    );
  }

  if (!data || data.length === 0) {
    return NextResponse.json<LookupApiResponse>(
      {
        ok: false,
        code: "not_found",
        message: "Mã xác thực không hợp lệ.",
      },
      { status: 404 },
    );
  }

  return NextResponse.json<LookupApiResponse>({
    ok: true,
    certificate: data[0],
  });
}
