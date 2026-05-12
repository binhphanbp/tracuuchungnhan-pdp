import { buildDriveDownloadUrl, buildDriveViewUrl } from "./url";

/**
 * Drive REST API helpers — multipart upload + share-link permission setup.
 *
 * All calls use the access token from `oauth.ts`. We don't proxy through
 * any server route because the Blob already lives in the browser (the
 * generator renders client-side) and Drive's CORS policy permits direct
 * `fetch` calls from any origin with a Bearer token.
 */

export type DriveUploadResult = {
  fileId: string;
  /** Computed locally from fileId — Drive doesn't return this in the response. */
  viewUrl: string;
  /** Computed locally from fileId. */
  downloadUrl: string;
};

const UPLOAD_ENDPOINT =
  "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id";
const PERMISSION_ENDPOINT_BASE = "https://www.googleapis.com/drive/v3/files";

/**
 * Upload a single PNG Blob to Drive via multipart upload.
 *
 * @param accessToken OAuth bearer token from `requestDriveAccessToken`.
 * @param blob The PNG content.
 * @param name Filename Drive should display (e.g. `PS43995_NGUYEN_VAN_A.png`).
 * @param folderId Optional Drive folder ID to upload into. If omitted, the
 *   file lands in the user's root Drive — discouraged but supported.
 * @returns The created file ID (and computed view/download URLs).
 */
export async function uploadFileToDrive(
  accessToken: string,
  blob: Blob,
  name: string,
  folderId?: string | null,
): Promise<DriveUploadResult> {
  // Drive multipart upload requires a specific RFC 2387 multipart/related
  // body with two parts: metadata JSON + file content. We construct it
  // manually instead of relying on FormData (which uses multipart/form-data,
  // a different MIME convention Drive rejects).

  const boundary = `pdp_${Math.random().toString(36).slice(2)}`;
  const metadata: Record<string, unknown> = {
    name,
    mimeType: "image/png",
  };
  if (folderId) metadata.parents = [folderId];

  const closeDelim = `\r\n--${boundary}--`;

  // Body part 1: metadata as JSON
  const metaPart = [
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    JSON.stringify(metadata),
    "",
  ].join("\r\n");

  // Body part 2: PNG bytes (binary). We assemble as Blob to avoid encoding
  // the binary data as text.
  const filePartHeader = [
    `--${boundary}`,
    "Content-Type: image/png",
    "Content-Transfer-Encoding: binary",
    "",
    "",
  ].join("\r\n");

  const body = new Blob([metaPart, filePartHeader, blob, closeDelim]);

  const res = await fetch(UPLOAD_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": `multipart/related; boundary="${boundary}"`,
    },
    body,
  });

  if (!res.ok) {
    const errBody = await safeReadJson(res);
    throw new Error(
      `Upload thất bại (${res.status}): ${errBody?.error?.message ?? res.statusText}`,
    );
  }

  const json = (await res.json()) as { id: string };
  if (!json.id) {
    throw new Error("Drive trả về phản hồi không có file id.");
  }

  return {
    fileId: json.id,
    viewUrl: buildDriveViewUrl(json.id),
    downloadUrl: buildDriveDownloadUrl(json.id),
  };
}

/**
 * Make a Drive file readable by anyone with its link. Required for the
 * public lookup page to render the certificate without OAuth on the
 * student's side.
 *
 * Idempotent — Drive accepts duplicate "anyoneWithLink/reader" grants
 * silently.
 */
export async function makeDriveFilePublic(
  accessToken: string,
  fileId: string,
): Promise<void> {
  const res = await fetch(
    `${PERMISSION_ENDPOINT_BASE}/${encodeURIComponent(fileId)}/permissions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        role: "reader",
        type: "anyone",
      }),
    },
  );
  if (!res.ok) {
    const errBody = await safeReadJson(res);
    throw new Error(
      `Không set được quyền chia sẻ (${res.status}): ${errBody?.error?.message ?? res.statusText}`,
    );
  }
}

async function safeReadJson(res: Response): Promise<{
  error?: { message?: string };
} | null> {
  try {
    return (await res.json()) as { error?: { message?: string } };
  } catch {
    return null;
  }
}
