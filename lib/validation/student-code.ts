import { z } from "zod";

import { normalizeStudentCode } from "@/lib/utils/normalize";

/**
 * Default FPT Polytechnic student-code format: PS followed by at least 5
 * digits (PS00001..PS99999+). The `^PS\d{5,}$` regex matches the spec.
 *
 * Override at runtime by passing a different pattern to `studentCodeSchema()`.
 */
export const DEFAULT_STUDENT_CODE_PATTERN = /^PS\d{5,}$/;

export const studentCodeSchema = (
  pattern: RegExp = DEFAULT_STUDENT_CODE_PATTERN,
) =>
  z
    .string()
    .min(1, "Vui lòng nhập mã số sinh viên.")
    .transform((raw) => normalizeStudentCode(raw))
    .refine((value) => pattern.test(value), {
      message: "Mã số sinh viên không hợp lệ. Định dạng đúng: PSxxxxx.",
    });

export const lookupFormSchema = z.object({
  studentCode: studentCodeSchema(),
});

export type LookupFormInput = z.input<typeof lookupFormSchema>;
export type LookupFormValues = z.output<typeof lookupFormSchema>;
