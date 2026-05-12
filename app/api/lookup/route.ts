import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { studentCodeSchema } from "@/lib/validation/student-code";
import type { LookupApiResponse } from "@/types/certificate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
): Promise<NextResponse<LookupApiResponse>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("invalid_student_code", "Yêu cầu không hợp lệ.");
  }

  const studentCodeRaw =
    typeof body === "object" && body !== null && "studentCode" in body
      ? (body as { studentCode: unknown }).studentCode
      : undefined;

  const parsed = studentCodeSchema().safeParse(studentCodeRaw);
  if (!parsed.success) {
    return jsonError(
      "invalid_student_code",
      parsed.error.issues[0]?.message ?? "Mã số sinh viên không hợp lệ.",
    );
  }

  const studentCode = parsed.data;

  let supabase: Awaited<ReturnType<typeof createClient>>;
  try {
    supabase = await createClient();
  } catch (err) {
    if (err instanceof Error && err.message.includes("Missing Supabase env")) {
      return jsonError(
        "internal_error",
        "Hệ thống chưa được cấu hình. Vui lòng quay lại sau.",
      );
    }
    throw err;
  }

  const { data, error } = await supabase.rpc("public_lookup_certificate", {
    p_student_code: studentCode,
  });

  if (error) {
    console.error("public_lookup_certificate failed", error);
    return jsonError("internal_error", "Không thể tra cứu lúc này.");
  }

  if (!data || data.length === 0) {
    return jsonError("not_found", "Không tìm thấy chứng nhận cho mã số này.");
  }

  return NextResponse.json<LookupApiResponse>({
    ok: true,
    certificate: data[0],
  });
}

function jsonError(
  code: Exclude<LookupApiResponse, { ok: true }>["code"],
  message: string,
) {
  return NextResponse.json<LookupApiResponse>(
    { ok: false, code, message },
    { status: code === "not_found" ? 404 : 400 },
  );
}
