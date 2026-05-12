/**
 * Drive folder metadata listing helpers. Used by the admin Drive-link wizard
 * to replace the old Apps Script manifest-export step.
 */

export type DriveFolderFile = {
  id: string;
  name: string;
  mimeType: string;
};

type DriveFilesListResponse = {
  nextPageToken?: string;
  files?: DriveFolderFile[];
  error?: { message?: string };
};

const DRIVE_FILES_ENDPOINT = "https://www.googleapis.com/drive/v3/files";
const FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";

/**
 * List direct child files in a Drive folder. This reads metadata only: file
 * names, IDs, and MIME types. It does not download the certificate images.
 */
export async function listDriveFolderFiles(
  accessToken: string,
  folderId: string,
): Promise<DriveFolderFile[]> {
  const files: DriveFolderFile[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      q: [
        `'${escapeDriveQueryValue(folderId)}' in parents`,
        "trashed = false",
        `mimeType != '${FOLDER_MIME_TYPE}'`,
      ].join(" and "),
      pageSize: "1000",
      fields: "nextPageToken,files(id,name,mimeType)",
      spaces: "drive",
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true",
    });
    if (pageToken) params.set("pageToken", pageToken);

    const res = await fetch(`${DRIVE_FILES_ENDPOINT}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const body = (await res.json()) as DriveFilesListResponse;

    if (!res.ok) {
      throw new Error(
        `Không đọc được thư mục Drive (${res.status}): ${
          body.error?.message ?? res.statusText
        }`,
      );
    }

    files.push(...(body.files ?? []));
    pageToken = body.nextPageToken;
  } while (pageToken);

  return files;
}

export function buildDriveManifestCsv(files: DriveFolderFile[]): string {
  const rows = [["filename", "file_id"]];
  for (const file of files) {
    rows.push([file.name, file.id]);
  }
  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function escapeDriveQueryValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}
