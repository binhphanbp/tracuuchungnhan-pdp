import { z } from "zod";

import { studentCodeSchema } from "./student-code";

const studentCode = studentCodeSchema();

const optionalString = (max: number) =>
  z
    .string()
    .max(max)
    .transform((s) => s.trim())
    .optional();

const dateString = z
  .string()
  .trim()
  .refine(
    (v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)),
    "Ngày không hợp lệ — dùng định dạng YYYY-MM-DD.",
  );

/**
 * One canonical row read out of the spreadsheet. Required fields are
 * `student_code` and `full_name`; everything else is optional and falls back
 * to the campaign-level value at generation time.
 */
export const studentRowSchema = z.object({
  student_code: studentCode,
  full_name: z
    .string()
    .min(1, "Họ tên không được để trống.")
    .max(200, "Họ tên quá dài (tối đa 200 ký tự).")
    .transform((s) => s.trim().replace(/\s+/g, " ")),
  class_name: optionalString(80),
  email: z
    .string()
    .email("Email không hợp lệ.")
    .max(200)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  date_of_birth: dateString
    .optional()
    .or(z.literal("").transform(() => undefined)),
  certificate_title: optionalString(200),
  issue_date: dateString
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export type StudentRow = z.output<typeof studentRowSchema>;

export type RowError = {
  rowNumber: number; // 1-based row in the spreadsheet, header is row 1
  field: keyof StudentRow | "_row";
  message: string;
};

export type ValidationReport = {
  validRows: { rowNumber: number; data: StudentRow }[];
  errors: RowError[];
  duplicates: { rowNumber: number; student_code: string }[];
};

/**
 * Run the canonical row schema across an array of unknown objects. Also
 * detects duplicate `student_code` values across the batch — Supabase will
 * reject these later anyway, but surfacing them up front saves a round trip.
 */
export function validateRows(
  rows: Record<string, unknown>[],
): ValidationReport {
  const validRows: ValidationReport["validRows"] = [];
  const errors: RowError[] = [];
  const seen = new Map<string, number>(); // student_code → first row number
  const duplicates: ValidationReport["duplicates"] = [];

  for (let i = 0; i < rows.length; i++) {
    const rowNumber = i + 2; // +1 because rows array is 0-indexed, +1 for header row
    const parsed = studentRowSchema.safeParse(rows[i]);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = (issue.path[0] as keyof StudentRow | undefined) ?? "_row";
        errors.push({ rowNumber, field, message: issue.message });
      }
      continue;
    }
    const code = parsed.data.student_code;
    const firstSeen = seen.get(code);
    if (firstSeen !== undefined) {
      duplicates.push({ rowNumber, student_code: code });
      errors.push({
        rowNumber,
        field: "student_code",
        message: `Trùng MSSV với dòng ${firstSeen}.`,
      });
      continue;
    }
    seen.set(code, rowNumber);
    validRows.push({ rowNumber, data: parsed.data });
  }

  return { validRows, errors, duplicates };
}
