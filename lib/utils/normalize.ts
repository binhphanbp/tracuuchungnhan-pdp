/**
 * Vietnamese diacritic stripping + identifier-friendly normalization.
 *
 * Used to:
 *   - generate certificate filenames (`Nguyễn Văn A` → `NGUYEN_VAN_A`)
 *   - power admin search (`full_name_normalized` column)
 *   - sanitize student codes (`ps43995` / ` PS43995 ` → `PS43995`)
 *
 * NOT used for what's drawn on the certificate — the visible text keeps full
 * Vietnamese diacritics.
 */

/** Strip every combining diacritical mark via NFD decomposition. */
export function stripDiacritics(input: string): string {
  return (
    input
      .normalize("NFD")
      // U+0300–U+036F are the combining marks (acute, grave, hook, etc.).
      .replace(/[\u0300-\u036f]/g, "")
      // The Vietnamese letter `đ` / `Đ` decomposes to itself, not `d` + mark.
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
  );
}

/** Turn a full name into a filename-safe ASCII identifier. */
export function toFilenameIdentifier(fullName: string): string {
  const ascii = stripDiacritics(fullName)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return ascii || "UNKNOWN";
}

/** Normalize a student code: trim + uppercase. */
export function normalizeStudentCode(input: string): string {
  return input.trim().toUpperCase();
}

/**
 * Lowercased, whitespace-collapsed full name for sortable search indexes.
 * Diacritics are removed so admin search matches `nguyen van a`.
 */
export function toSearchableName(fullName: string): string {
  return stripDiacritics(fullName).toLowerCase().replace(/\s+/g, " ").trim();
}
