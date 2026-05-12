import { stripDiacritics } from "./normalize";

/**
 * Convert a free-form title into a URL-safe slug.
 *
 * @example
 *   toSlug("Chứng nhận PolyPass — Khoá 05/2026")
 *   // → "chung-nhan-polypass-khoa-05-2026"
 */
export function toSlug(input: string): string {
  return stripDiacritics(input)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}
