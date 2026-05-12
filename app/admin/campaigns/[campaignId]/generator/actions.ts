"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  templateConfigSchema,
  type TemplateConfig,
} from "@/lib/generator/template-config";
import {
  certificateBatchSchema,
  type CertificateRecord,
} from "@/lib/validation/certificate-record";
import { stripDiacritics } from "@/lib/utils/normalize";

export type SaveTemplateConfigResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Persist the position config to `campaigns.template_config` so the next
 * batch run can pick up where the admin left off.
 */
export async function saveTemplateConfig(
  campaignId: string,
  config: TemplateConfig,
): Promise<SaveTemplateConfigResult> {
  await requireAdmin();

  const parsed = templateConfigSchema.safeParse(config);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Cấu hình không hợp lệ.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("campaigns")
    .update({ template_config: parsed.data })
    .eq("id", campaignId);

  if (error) {
    return { ok: false, error: `Không thể lưu cấu hình: ${error.message}` };
  }

  revalidatePath(`/admin/campaigns/${campaignId}`);
  revalidatePath(`/admin/campaigns/${campaignId}/generator`);
  return { ok: true };
}

export type SaveCertificateBatchResult =
  | { ok: true; saved: number; total: number }
  | { ok: false; error: string };

const UPSERT_CHUNK_SIZE = 500;

/**
 * Persist a batch of generated certificates to `certificates`. Upserts on
 * the `(campaign_id, student_code)` unique constraint so re-runs update
 * existing rows instead of failing.
 *
 * Performs the work in chunks to keep payloads small and to give clearer
 * error messages when one chunk fails.
 */
export async function saveCertificateBatch(
  campaignId: string,
  records: CertificateRecord[],
): Promise<SaveCertificateBatchResult> {
  await requireAdmin();

  const parsed = certificateBatchSchema.safeParse(records);
  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ??
        "Danh sách chứng nhận có dòng không hợp lệ.",
    };
  }

  const supabase = await createClient();

  // Need the campaign's issue_date as a fallback when a row doesn't include
  // its own date. Also confirm the campaign exists / admin has access.
  const { data: campaign, error: campaignErr } = await supabase
    .from("campaigns")
    .select("id, issue_date, status")
    .eq("id", campaignId)
    .maybeSingle();

  if (campaignErr) {
    return { ok: false, error: campaignErr.message };
  }
  if (!campaign) {
    return { ok: false, error: "Không tìm thấy chiến dịch." };
  }

  // Build the upsert payload WITHOUT drive_* fields. Reason: re-running the
  // generator on a campaign that previously had Drive links applied (via
  // M9 manifest paste or earlier M10 upload) would overwrite those links
  // with NULLs if we included them in the upsert. Instead, drive_* is
  // applied as a separate UPDATE pass below for rows that carry fresh
  // values from the current run.
  const certificateStatus =
    campaign.status === "published" ? ("published" as const) : ("draft" as const);
  const rows = parsed.data.map((r) => ({
    campaign_id: campaignId,
    student_code: r.student_code,
    full_name: r.full_name,
    full_name_normalized: stripDiacritics(r.full_name).toUpperCase(),
    class_name: r.class_name ?? null,
    email: r.email ?? null,
    date_of_birth: r.date_of_birth ?? null,
    certificate_title: r.certificate_title ?? null,
    issue_date: r.issue_date ?? campaign.issue_date,
    file_name: r.file_name,
    verification_code: r.verification_code,
    qr_payload: r.qr_payload,
    status: certificateStatus,
    metadata:
      r.warnings && r.warnings.length > 0 ? { warnings: r.warnings } : {},
  }));

  let saved = 0;
  for (let i = 0; i < rows.length; i += UPSERT_CHUNK_SIZE) {
    const chunk = rows.slice(i, i + UPSERT_CHUNK_SIZE);
    const { error } = await supabase.from("certificates").upsert(chunk, {
      onConflict: "campaign_id,student_code",
      ignoreDuplicates: false,
    });
    if (error) {
      return {
        ok: false,
        error: `Lưu thất bại ở chunk ${i / UPSERT_CHUNK_SIZE + 1}: ${error.message}`,
      };
    }
    saved += chunk.length;
  }

  // Second pass: apply drive_* fields for rows that came in with them.
  // Per-row UPDATE keyed by (campaign_id, student_code) so re-runs without
  // Drive results don't clobber existing links.
  const driveRows = parsed.data.filter((r) => r.drive_file_id);
  for (const r of driveRows) {
    const { error } = await supabase
      .from("certificates")
      .update({
        drive_file_id: r.drive_file_id ?? null,
        drive_view_url: r.drive_view_url ?? null,
        drive_download_url: r.drive_download_url ?? null,
      })
      .eq("campaign_id", campaignId)
      .eq("student_code", r.student_code);
    if (error) {
      // Non-fatal: the metadata is already saved. Surface the error so the
      // admin can retry the Drive linking step.
      return {
        ok: false,
        error: `Lưu metadata thành công nhưng không gắn được link Drive cho ${r.student_code}: ${error.message}`,
      };
    }
  }

  // Log the batch run.
  await supabase.from("import_batches").insert({
    campaign_id: campaignId,
    original_file_name: null,
    row_count: rows.length,
    success_count: saved,
    error_count: 0,
  });

  revalidatePath(`/admin/campaigns/${campaignId}`);
  revalidatePath(`/admin/campaigns/${campaignId}/certificates`);
  revalidatePath(`/admin/certificates`);
  return { ok: true, saved, total: rows.length };
}

export type DriveLinkUpdate = {
  student_code: string;
  drive_file_id: string;
  drive_view_url: string;
  drive_download_url: string;
};

export type SaveDriveLinksResult =
  | { ok: true; saved: number }
  | { ok: false; error: string };

/**
 * Persist Drive metadata for already-saved certificates. Used by the M10
 * direct-upload flow: after the browser uploads a PNG to Drive, the wizard
 * calls this to write the resulting `drive_file_id` + URLs back to
 * `certificates`. Does NOT touch any other column.
 */
export async function saveDriveLinksForCertificates(
  campaignId: string,
  updates: DriveLinkUpdate[],
): Promise<SaveDriveLinksResult> {
  await requireAdmin();
  if (updates.length === 0) return { ok: true, saved: 0 };

  const supabase = await createClient();

  let saved = 0;
  for (const u of updates) {
    const { error } = await supabase
      .from("certificates")
      .update({
        drive_file_id: u.drive_file_id,
        drive_view_url: u.drive_view_url,
        drive_download_url: u.drive_download_url,
      })
      .eq("campaign_id", campaignId)
      .eq("student_code", u.student_code);
    if (error) {
      return {
        ok: false,
        error: `Không gắn được link Drive cho ${u.student_code}: ${error.message}`,
      };
    }
    saved += 1;
  }

  revalidatePath(`/admin/campaigns/${campaignId}`);
  revalidatePath(`/admin/campaigns/${campaignId}/certificates`);
  revalidatePath(`/admin/certificates`);
  return { ok: true, saved };
}
