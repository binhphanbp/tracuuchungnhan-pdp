import { format } from "date-fns";

import { normalizeStudentCode, toFilenameIdentifier } from "./normalize";

export type FilenameInput = {
  studentCode: string;
  fullName: string;
  /** Campaign-level slug, e.g. `POLYPASS`. */
  campaignSlug?: string;
  /** Issue date — included as `yyyyMMdd` if present. */
  issueDate?: Date | string;
};

/**
 * Build the canonical certificate PNG filename.
 *
 * Examples (from PDP spec):
 *   PS43995_NGUYEN_VAN_A.png
 *   PS43995_NGUYEN_VAN_A_POLYPASS_20260506.png
 */
export function buildCertificateFilename(input: FilenameInput): string {
  const code = normalizeStudentCode(input.studentCode);
  const name = toFilenameIdentifier(input.fullName);
  const parts: string[] = [code, name];

  if (input.campaignSlug) {
    parts.push(input.campaignSlug.toUpperCase().replace(/[^A-Z0-9]+/g, "_"));
  }

  if (input.issueDate) {
    const date =
      typeof input.issueDate === "string"
        ? new Date(input.issueDate)
        : input.issueDate;
    if (!Number.isNaN(date.getTime())) {
      parts.push(format(date, "yyyyMMdd"));
    }
  }

  return `${parts.join("_")}.png`;
}
