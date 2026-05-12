import { z } from "zod";

import { studentCodeSchema } from "./student-code";

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày phải có định dạng YYYY-MM-DD.")
  .nullable()
  .optional();

/**
 * Shape the generator wizard sends to `saveCertificateBatch`. Mirrors the
 * `certificates` table but uses the canonical names from `student-row.ts`.
 *
 * `verification_code` and `qr_payload` are produced by the wizard during
 * rendering — the server trusts what's sent here for v1. Future: server-side
 * verification-code reservation.
 */
export const certificateRecordSchema = z.object({
  student_code: studentCodeSchema(),
  full_name: z.string().min(1).max(200),
  class_name: z.string().max(80).nullable().optional(),
  email: z
    .string()
    .email()
    .max(200)
    .nullable()
    .optional()
    .or(z.literal("").transform(() => null)),
  date_of_birth: dateString,
  certificate_title: z.string().max(200).nullable().optional(),
  issue_date: dateString,
  file_name: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[A-Z0-9_]+\.png$/i, "Filename không hợp lệ."),
  verification_code: z
    .string()
    .min(8)
    .max(64)
    .regex(/^[A-Z0-9]+$/, "Mã xác minh không hợp lệ."),
  qr_payload: z.string().min(1).max(500),
  warnings: z.array(z.string()).optional().default([]),
  // Optional Drive metadata produced by the M10 OAuth uploader. When
  // absent (manual workflow), the Drive-link wizard (M9) can fill these
  // fields in later via a manifest paste.
  drive_file_id: z.string().min(1).max(128).nullable().optional(),
  drive_view_url: z.string().url().max(500).nullable().optional(),
  drive_download_url: z.string().url().max(500).nullable().optional(),
});

export const certificateBatchSchema = z
  .array(certificateRecordSchema)
  .min(1, "Không có chứng nhận nào để lưu.");

export type CertificateRecord = z.input<typeof certificateRecordSchema>;
export type CertificateRecordParsed = z.output<typeof certificateRecordSchema>;
