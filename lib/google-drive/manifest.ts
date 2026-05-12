import { extractFileIdFromUrl, isValidDriveFileId } from "./url";

/**
 * One parsed row from a pasted Drive manifest. The admin pastes a CSV/TSV
 * blob with at minimum two columns: filename + file_id (or filename + Drive
 * URL — we extract the ID).
 */
export type ManifestRow = {
  filename: string;
  fileId: string;
  /** Optional override; we'll derive from fileId if absent. */
  viewUrl?: string;
  /** Optional override; we'll derive from fileId if absent. */
  downloadUrl?: string;
};

export type ManifestParseResult = {
  /** Successfully parsed rows. */
  rows: ManifestRow[];
  /** Per-line errors (1-indexed line numbers). */
  errors: { line: number; message: string }[];
};

/**
 * Parse a pasted CSV/TSV manifest. Forgiving: auto-detects delimiter (comma,
 * tab, or semicolon) per-line, accepts an optional header row, accepts URLs
 * in any column, and tolerates extra whitespace.
 *
 * Required columns (in any order, detected via header if present):
 *   - filename | name | file
 *   - file_id  | id   | drive_id | url | link
 *
 * Optional columns:
 *   - view_url
 *   - download_url
 *
 * If no header is detected, we assume the format `filename<DELIM>file_id`.
 */
export function parseManifest(input: string): ManifestParseResult {
  const rows: ManifestRow[] = [];
  const errors: { line: number; message: string }[] = [];

  const lines = input
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { rows, errors };
  }

  // Detect delimiter from the first line: prefer tab > comma > semicolon.
  // This is per-document — once we pick, we use it for every line.
  const delim = detectDelimiter(lines[0]);

  // Detect header by checking if line[0] contains any known label.
  const firstFields = splitLine(lines[0], delim);
  const headerIdx = detectHeader(firstFields);
  const startLine = headerIdx ? 1 : 0;
  const idx = headerIdx ?? {
    filename: 0,
    fileId: 1,
    viewUrl: -1,
    downloadUrl: -1,
  };

  for (let i = startLine; i < lines.length; i++) {
    const lineNumber = i + 1;
    const fields = splitLine(lines[i], delim);

    const rawFilename = (fields[idx.filename] ?? "").trim();
    const rawIdOrUrl = (fields[idx.fileId] ?? "").trim();

    if (!rawFilename) {
      errors.push({ line: lineNumber, message: "Thiếu tên file (filename)" });
      continue;
    }
    if (!rawIdOrUrl) {
      errors.push({
        line: lineNumber,
        message: "Thiếu file_id hoặc URL Drive",
      });
      continue;
    }

    const fileId = extractFileIdFromUrl(rawIdOrUrl);
    if (!fileId || !isValidDriveFileId(fileId)) {
      errors.push({
        line: lineNumber,
        message: `Không nhận diện được file_id từ "${rawIdOrUrl}"`,
      });
      continue;
    }

    const viewUrl = idx.viewUrl >= 0 ? (fields[idx.viewUrl] ?? "").trim() : "";
    const downloadUrl =
      idx.downloadUrl >= 0 ? (fields[idx.downloadUrl] ?? "").trim() : "";

    rows.push({
      filename: rawFilename,
      fileId,
      viewUrl: viewUrl || undefined,
      downloadUrl: downloadUrl || undefined,
    });
  }

  return { rows, errors };
}

function detectDelimiter(line: string): "\t" | "," | ";" {
  if (line.includes("\t")) return "\t";
  if (line.includes(",")) return ",";
  if (line.includes(";")) return ";";
  return ",";
}

function splitLine(line: string, delim: string): string[] {
  // Minimal CSV-style splitting: respect double quotes for commas inside
  // quoted fields, but don't bother with escaped quotes (manifests are
  // always machine-generated and won't have those edge cases).
  if (!line.includes('"')) {
    return line.split(delim);
  }
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === delim && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result.map((s) => s.replace(/^"|"$/g, ""));
}

const FILENAME_LABELS = new Set([
  "filename",
  "file_name",
  "name",
  "file",
  "tên file",
  "ten file",
]);

const FILE_ID_LABELS = new Set([
  "file_id",
  "fileid",
  "id",
  "drive_id",
  "drive id",
  "url",
  "link",
  "share",
  "share_link",
]);

const VIEW_URL_LABELS = new Set([
  "view_url",
  "view",
  "preview",
  "preview_url",
  "view url",
]);

const DOWNLOAD_URL_LABELS = new Set([
  "download_url",
  "download",
  "dl",
  "dl_url",
  "download url",
]);

function detectHeader(fields: string[]): {
  filename: number;
  fileId: number;
  viewUrl: number;
  downloadUrl: number;
} | null {
  let filename = -1;
  let fileId = -1;
  let viewUrl = -1;
  let downloadUrl = -1;

  for (let i = 0; i < fields.length; i++) {
    const label = fields[i].trim().toLowerCase().replace(/^"|"$/g, "");
    if (filename < 0 && FILENAME_LABELS.has(label)) filename = i;
    else if (fileId < 0 && FILE_ID_LABELS.has(label)) fileId = i;
    else if (viewUrl < 0 && VIEW_URL_LABELS.has(label)) viewUrl = i;
    else if (downloadUrl < 0 && DOWNLOAD_URL_LABELS.has(label)) downloadUrl = i;
  }

  // Only count this as a header row if BOTH primary columns were identified.
  if (filename >= 0 && fileId >= 0) {
    return { filename, fileId, viewUrl, downloadUrl };
  }
  return null;
}
