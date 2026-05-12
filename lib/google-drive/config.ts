/**
 * Drive integration runtime config + scope constants. Kept separate from
 * `oauth.ts` so server code can `import` it without dragging in window-only
 * type declarations.
 */

/**
 * Upload scope: only files created by this OAuth client are visible to it.
 * This is used by the browser-side generator when it uploads newly-created
 * PNG files directly to Drive.
 */
export const GOOGLE_DRIVE_FILE_SCOPE =
  "https://www.googleapis.com/auth/drive.file";

/**
 * Folder-linking scope: read Drive metadata only (file names, IDs, mime types),
 * not file contents. This lets the admin point the app at an existing Drive
 * folder and auto-build a filename -> file_id manifest for already-uploaded
 * PNGs.
 */
export const GOOGLE_DRIVE_METADATA_READONLY_SCOPE =
  "https://www.googleapis.com/auth/drive.metadata.readonly";

/**
 * Backwards-compatible default for existing upload code.
 */
export const GOOGLE_DRIVE_SCOPE = GOOGLE_DRIVE_FILE_SCOPE;

/**
 * True when `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is defined at runtime. Both the
 * client and the server can import this — `process.env.NEXT_PUBLIC_*` is
 * inlined at build time so it works in both contexts.
 */
export function isGoogleDriveConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
}
