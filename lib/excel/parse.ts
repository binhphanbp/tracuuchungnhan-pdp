import * as XLSX from "xlsx";

import { type CanonicalField, autoDetectMapping } from "./columns";

export type RawRow = Record<string, unknown>;

export type ParsedSheet = {
  /** Original headers in the order they appear in the file. */
  headers: string[];
  /** Auto-detected mapping from canonical field → original header. */
  detectedMapping: Partial<Record<CanonicalField, string>>;
  /** Each row keyed by its original header. */
  rows: RawRow[];
  /** Sheet name we read from. */
  sheetName: string;
};

/**
 * Read the first sheet of an Excel/CSV file into an array of header-keyed
 * rows. Runs entirely in the browser via SheetJS — no server cost.
 */
export async function parseSheet(file: File): Promise<ParsedSheet> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) {
    throw new Error("File không có sheet nào.");
  }
  const sheet = wb.Sheets[sheetName];

  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    blankrows: false,
    raw: false,
    defval: null,
  });

  if (matrix.length === 0) {
    return {
      headers: [],
      detectedMapping: {},
      rows: [],
      sheetName,
    };
  }

  const [headerRow, ...dataRows] = matrix;
  const headers = (headerRow as unknown[])
    .map((h) => (h == null ? "" : String(h).trim()))
    .filter((h) => h.length > 0);

  const rows: RawRow[] = dataRows.map((row) => {
    const out: RawRow = {};
    for (let i = 0; i < headers.length; i++) {
      out[headers[i]] = (row as unknown[])[i] ?? null;
    }
    return out;
  });

  return {
    headers,
    detectedMapping: autoDetectMapping(headers),
    rows,
    sheetName,
  };
}
