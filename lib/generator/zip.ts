import JSZip from "jszip";

import { stripDiacritics } from "@/lib/utils/normalize";

export type GeneratedCertificate = {
  filename: string;
  blob: Blob;
  student_code: string;
  full_name: string;
  class_name?: string | null;
  verification_code: string;
  qr_payload: string;
  warnings: string[];
};

/**
 * Build the deterministic filename PDP wants:
 *   PS43995_NGUYEN_VAN_A.png
 * Or with the optional verification suffix:
 *   PS43995_NGUYEN_VAN_A_POLYPASS_20260506.png
 */
export function buildFilename(
  studentCode: string,
  fullName: string,
  options: { suffix?: string; date?: string } = {},
): string {
  const code = studentCode.toUpperCase();
  const name = stripDiacritics(fullName)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const parts = [code, name];
  if (options.suffix) parts.push(options.suffix.toUpperCase());
  if (options.date) parts.push(options.date.replace(/-/g, ""));
  return `${parts.join("_")}.png`;
}

/**
 * Bundle a batch of generated certificates into a single ZIP plus a
 * `manifest.csv` listing every file and its metadata. The CSV is UTF-8 with
 * a BOM so Excel opens it correctly with Vietnamese diacritics intact.
 */
export async function buildCertificateZip(
  certificates: GeneratedCertificate[],
): Promise<Blob> {
  const zip = new JSZip();

  for (const cert of certificates) {
    zip.file(cert.filename, cert.blob);
  }

  zip.file("manifest.csv", buildManifestCsv(certificates));

  return zip.generateAsync({
    type: "blob",
    // PNG files are already compressed. Re-compressing hundreds/thousands of
    // them burns CPU for little size gain and makes large batches look stuck.
    compression: "STORE",
  });
}

export function buildManifestCsv(
  certificates: Pick<
    GeneratedCertificate,
    | "filename"
    | "student_code"
    | "full_name"
    | "class_name"
    | "verification_code"
    | "qr_payload"
    | "warnings"
  >[],
): string {
  const headers = [
    "filename",
    "student_code",
    "full_name",
    "class_name",
    "verification_code",
    "qr_payload",
    "warnings",
  ];
  const rows = certificates.map((c) => [
    c.filename,
    c.student_code,
    c.full_name,
    c.class_name ?? "",
    c.verification_code,
    c.qr_payload,
    c.warnings.join("; "),
  ]);

  const escape = (value: string) => {
    if (/["\n,]/.test(value)) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const lines = [headers, ...rows].map((row) => row.map(escape).join(","));
  return "\uFEFF" + lines.join("\r\n");
}

/** Save a Blob to disk by triggering a download via an anchor element. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke after a beat so the download has time to start.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
