/**
 * Server-action result types for the Drive-link wizard.
 *
 * Kept in a non-"use server" module because Next.js 16 strips non-async
 * exports from "use server" modules. Server actions live in `actions.ts`.
 */

export type ManifestPreviewMatch = {
  certificateId: string;
  studentCode: string;
  fullName: string;
  fileName: string;
  fileId: string;
  viewUrl: string;
  downloadUrl: string;
  /** True if this certificate already has a drive_file_id and we're overwriting. */
  hasExistingLink: boolean;
};

export type ManifestPreview = {
  /** Manifest rows that matched a certificate by file_name. */
  matched: ManifestPreviewMatch[];
  /** Manifest filenames that did not match any certificate in this campaign. */
  unmatchedFilenames: string[];
  /** Certificate file_names in this campaign that aren't covered by the manifest. */
  uncoveredCertificateFilenames: string[];
  /** Per-line parse errors from the manifest text. */
  parseErrors: { line: number; message: string }[];
};

export type PreviewResult =
  | { ok: true; preview: ManifestPreview }
  | { ok: false; error: string };

export type ApplyResult =
  | { ok: true; updated: number; matchedCount: number; unmatchedCount: number }
  | { ok: false; error: string };
