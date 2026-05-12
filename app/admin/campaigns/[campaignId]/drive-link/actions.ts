"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/require-admin";
import { parseManifest } from "@/lib/google-drive/manifest";
import {
  buildDriveDownloadUrl,
  buildDriveViewUrl,
} from "@/lib/google-drive/url";
import { createClient } from "@/lib/supabase/server";

import type { ApplyResult, ManifestPreview, PreviewResult } from "./types";

/**
 * Dry-run: parse the pasted manifest text and report how many rows would
 * match certificates in this campaign — without writing anything. The UI
 * shows this preview before the admin confirms.
 */
export async function previewDriveMapping(
  campaignId: string,
  manifestText: string,
): Promise<PreviewResult> {
  await requireAdmin();
  const supabase = await createClient();

  const { rows, errors: parseErrors } = parseManifest(manifestText);

  // Pull every certificate in this campaign so we can match by file_name.
  // For very large campaigns (>5000) this still fits comfortably in one
  // round-trip; we'd paginate if it became a problem.
  const { data: certificates, error } = await supabase
    .from("certificates")
    .select("id, student_code, full_name, file_name, drive_file_id")
    .eq("campaign_id", campaignId);
  if (error) return { ok: false, error: error.message };

  const byFilename = new Map((certificates ?? []).map((c) => [c.file_name, c]));

  const matched: ManifestPreview["matched"] = [];
  const unmatchedFilenames: string[] = [];
  const seenFilenames = new Set<string>();

  for (const row of rows) {
    if (seenFilenames.has(row.filename)) continue;
    seenFilenames.add(row.filename);

    const cert = byFilename.get(row.filename);
    if (!cert) {
      unmatchedFilenames.push(row.filename);
      continue;
    }
    matched.push({
      certificateId: cert.id,
      studentCode: cert.student_code,
      fullName: cert.full_name,
      fileName: cert.file_name,
      fileId: row.fileId,
      viewUrl: row.viewUrl ?? buildDriveViewUrl(row.fileId),
      downloadUrl: row.downloadUrl ?? buildDriveDownloadUrl(row.fileId),
      hasExistingLink: cert.drive_file_id !== null,
    });
  }

  // Certificates in this campaign whose file_name doesn't appear in the
  // manifest at all. The admin probably wants to know about these so they
  // can investigate (missing PNG upload, typo, etc).
  const uncoveredCertificateFilenames: string[] = [];
  for (const cert of certificates ?? []) {
    if (!seenFilenames.has(cert.file_name)) {
      uncoveredCertificateFilenames.push(cert.file_name);
    }
  }

  return {
    ok: true,
    preview: {
      matched,
      unmatchedFilenames,
      uncoveredCertificateFilenames,
      parseErrors,
    },
  };
}

/**
 * Apply: persist drive_file_id / drive_view_url / drive_download_url for
 * every matched row. Returns counts only — the UI re-fetches the campaign
 * page to show updated state. Skips unmatched rows entirely.
 */
export async function applyDriveMapping(
  campaignId: string,
  manifestText: string,
): Promise<ApplyResult> {
  await requireAdmin();
  const supabase = await createClient();

  const result = await previewDriveMapping(campaignId, manifestText);
  if (!result.ok) return result;

  const { matched, unmatchedFilenames } = result.preview;

  if (matched.length === 0) {
    return {
      ok: true,
      updated: 0,
      matchedCount: 0,
      unmatchedCount: unmatchedFilenames.length,
    };
  }

  // Update one certificate at a time. For large campaigns this is a few
  // thousand round-trips at worst; chunking with `upsert` would be cleaner
  // but requires repeating every column we DON'T want to touch. The simple
  // path here is per-row UPDATE via the typed query builder.
  let updated = 0;
  for (const row of matched) {
    const { error } = await supabase
      .from("certificates")
      .update({
        drive_file_id: row.fileId,
        drive_view_url: row.viewUrl,
        drive_download_url: row.downloadUrl,
      })
      .eq("id", row.certificateId);
    if (error) {
      // Stop early on the first DB error and report it; a partial run is
      // recoverable (admin can re-paste the same manifest, idempotent).
      return {
        ok: false,
        error: `Lỗi tại ${row.fileName}: ${error.message}`,
      };
    }
    updated += 1;
  }

  revalidatePath(`/admin/campaigns/${campaignId}`);
  revalidatePath(`/admin/campaigns/${campaignId}/certificates`);
  revalidatePath(`/admin/campaigns/${campaignId}/drive-link`);
  revalidatePath(`/admin/certificates`);

  return {
    ok: true,
    updated,
    matchedCount: matched.length,
    unmatchedCount: unmatchedFilenames.length,
  };
}
