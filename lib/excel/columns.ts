import { stripDiacritics } from "@/lib/utils/normalize";

/**
 * Canonical fields produced by the parser. The certificate generator only
 * cares about these; everything else from the spreadsheet is dropped.
 */
export const CANONICAL_FIELDS = [
  "student_code",
  "full_name",
  "class_name",
  "email",
  "date_of_birth",
  "certificate_title",
  "issue_date",
] as const;
export type CanonicalField = (typeof CANONICAL_FIELDS)[number];

/**
 * Common header aliases (English + Vietnamese, with and without diacritics).
 * The match is case-insensitive and diacritic-insensitive — `Họ và tên`,
 * `ho va ten`, `HO VA TEN`, `Full Name`, and `full_name` all map to
 * `full_name`.
 */
const ALIASES: Record<CanonicalField, string[]> = {
  student_code: [
    "student_code",
    "studentcode",
    "student id",
    "studentid",
    "mssv",
    "ma so sinh vien",
    "ma sinh vien",
    "mã sinh viên",
    "mã số sinh viên",
    "ma sv",
    "msv",
  ],
  full_name: [
    "full_name",
    "fullname",
    "full name",
    "name",
    "ho ten",
    "ho va ten",
    "ho và ten",
    "họ tên",
    "họ và tên",
    "ten sv",
    "ten sinh vien",
    "tên sinh viên",
  ],
  class_name: [
    "class",
    "class_name",
    "classname",
    "class name",
    "lop",
    "lớp",
    "ma lop",
    "mã lớp",
  ],
  email: ["email", "e-mail", "thu dien tu", "thư điện tử"],
  date_of_birth: [
    "date_of_birth",
    "dateofbirth",
    "date of birth",
    "dob",
    "ngay sinh",
    "ngày sinh",
  ],
  certificate_title: [
    "certificate_title",
    "certificate title",
    "title",
    "ten chung nhan",
    "tên chứng nhận",
    "ten chung chi",
    "tên chứng chỉ",
  ],
  issue_date: [
    "issue_date",
    "issuedate",
    "issue date",
    "ngay cap",
    "ngày cấp",
    "ngay cap chung nhan",
    "ngày cấp chứng nhận",
  ],
};

const ALIAS_LOOKUP: Record<string, CanonicalField> = (() => {
  const out: Record<string, CanonicalField> = {};
  for (const field of CANONICAL_FIELDS) {
    for (const alias of ALIASES[field]) {
      out[normalizeHeader(alias)] = field;
    }
  }
  return out;
})();

export function normalizeHeader(value: string): string {
  return stripDiacritics(value)
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, " ");
}

/**
 * Given the spreadsheet's header row (in original column order), produce a
 * mapping from canonical field name → original header. Headers that don't
 * match anything are ignored. Multiple headers matching the same field —
 * first one wins.
 */
export function autoDetectMapping(
  headers: string[],
): Partial<Record<CanonicalField, string>> {
  const mapping: Partial<Record<CanonicalField, string>> = {};
  for (const header of headers) {
    const field = ALIAS_LOOKUP[normalizeHeader(header)];
    if (field && !mapping[field]) {
      mapping[field] = header;
    }
  }
  return mapping;
}
