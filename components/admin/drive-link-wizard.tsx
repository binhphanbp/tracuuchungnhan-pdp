"use client";

import { useState, useTransition } from "react";
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  CopyIcon,
  Loader2Icon,
  LinkIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  applyDriveMapping,
  previewDriveMapping,
} from "@/app/admin/campaigns/[campaignId]/drive-link/actions";
import type { ManifestPreview } from "@/app/admin/campaigns/[campaignId]/drive-link/types";
import {
  GOOGLE_DRIVE_METADATA_READONLY_SCOPE,
  isGoogleDriveConfigured,
} from "@/lib/google-drive/config";
import { extractFileIdFromUrl } from "@/lib/google-drive/url";

const APPS_SCRIPT_SNIPPET = `// Mở Google Apps Script (script.google.com), tạo project mới, dán đoạn dưới
// rồi chạy. Thay FOLDER_ID bằng ID thư mục Drive chứa toàn bộ PNG.
// Khi chạy xong, copy nội dung Logger và dán vào ô bên dưới.

function exportManifest() {
  const folderId = "FOLDER_ID";
  const folder = DriveApp.getFolderById(folderId);
  const files = folder.getFiles();
  const out = ["filename,file_id"];
  while (files.hasNext()) {
    const f = files.next();
    out.push(f.getName() + "," + f.getId());
  }
  Logger.log(out.join("\\n"));
}`;

export function DriveLinkWizard({
  campaignId,
  folderId,
}: {
  campaignId: string;
  folderId: string | null;
}) {
  const [manifestText, setManifestText] = useState("");
  const [folderInput, setFolderInput] = useState(folderId ?? "");
  const [preview, setPreview] = useState<ManifestPreview | null>(null);
  const [listing, setListing] = useState(false);
  const [previewing, startPreview] = useTransition();
  const [applying, startApply] = useTransition();
  const driveConfigured = isGoogleDriveConfigured();

  const previewManifest = async (text: string) => {
    const res = await previewDriveMapping(campaignId, text);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setPreview(res.preview);
    if (res.preview.matched.length === 0) {
      if (res.preview.uncoveredCertificateFilenames.length === 0) {
        toast.warning(
          "Chiến dịch chưa có chứng nhận nào. Hãy sinh và lưu chứng nhận trước khi liên kết Drive.",
        );
      } else {
        toast.warning("Không có dòng nào ghép được. Hãy kiểm tra tên file.");
      }
    } else {
      toast.success(
        `Ghép được ${res.preview.matched.length.toLocaleString("vi-VN")} chứng nhận.`,
      );
    }
  };

  const onPreview = () => {
    if (!manifestText.trim()) {
      toast.error("Vui lòng dán nội dung manifest trước.");
      return;
    }
    startPreview(async () => {
      await previewManifest(manifestText);
    });
  };

  const onFetchDriveFolder = async () => {
    if (!driveConfigured) {
      toast.error("Chưa cấu hình NEXT_PUBLIC_GOOGLE_CLIENT_ID.");
      return;
    }

    const rawFolder = folderInput.trim();
    const resolvedFolderId = extractFileIdFromUrl(rawFolder);
    if (!resolvedFolderId) {
      toast.error("Vui lòng nhập Drive folder ID hoặc URL thư mục hợp lệ.");
      return;
    }

    setListing(true);
    try {
      const [
        { requestDriveAccessToken },
        { listDriveFolderFiles, buildDriveManifestCsv },
      ] = await Promise.all([
        import("@/lib/google-drive/oauth"),
        import("@/lib/google-drive/folder"),
      ]);
      const { accessToken } = await requestDriveAccessToken({
        scope: GOOGLE_DRIVE_METADATA_READONLY_SCOPE,
      });
      const files = await listDriveFolderFiles(accessToken, resolvedFolderId);
      if (files.length === 0) {
        toast.warning("Thư mục Drive không có file nào để ghép.");
        return;
      }

      const manifest = buildDriveManifestCsv(files);
      setManifestText(manifest);
      setPreview(null);
      toast.success(
        `Đã đọc ${files.length.toLocaleString("vi-VN")} file từ Drive. Đang ghép thử...`,
      );
      await previewManifest(manifest);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể đọc thư mục Drive.",
      );
    } finally {
      setListing(false);
    }
  };

  const onApply = (): Promise<void> =>
    new Promise<void>((resolve) => {
      startApply(async () => {
        const res = await applyDriveMapping(campaignId, manifestText);
        if (!res.ok) {
          toast.error(res.error);
          resolve();
          return;
        }
        toast.success(
          `Đã cập nhật liên kết Drive cho ${res.updated.toLocaleString("vi-VN")} chứng nhận.`,
        );
        // Clear the local preview so the wizard returns to step 1; the page
        // will refresh server-side state via revalidatePath.
        setPreview(null);
        setManifestText("");
        resolve();
      });
    });

  const copySnippet = async () => {
    try {
      await navigator.clipboard.writeText(APPS_SCRIPT_SNIPPET);
      toast.success("Đã sao chép Apps Script.");
    } catch {
      toast.error("Không sao chép được — vui lòng chọn và copy thủ công.");
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <h2 className="font-semibold">Bước 1 · Tải PNG lên Drive</h2>
          <p className="text-muted-foreground text-sm">
            Chuẩn bị thư mục Drive, sau đó để hệ thống tự đọc danh sách file và
            ghép với chứng nhận.
          </p>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="border-pdp-orange/20 bg-pdp-orange/5 space-y-3 rounded-lg border p-4">
            <div>
              <h3 className="font-medium">Lấy manifest tự động bằng Drive API</h3>
              <p className="text-muted-foreground mt-1 text-sm">
                Đăng nhập Google bằng tài khoản có quyền xem thư mục. Ứng dụng
                chỉ đọc metadata file (tên file và file_id), không tải nội dung
                ảnh chứng nhận.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="drive-folder-manifest" className="text-xs">
                Drive folder ID hoặc URL
              </Label>
              <Input
                id="drive-folder-manifest"
                value={folderInput}
                onChange={(e) => setFolderInput(e.target.value)}
                placeholder="VD: 1abcDEF... hoặc https://drive.google.com/drive/folders/1abc..."
                className="font-mono text-xs"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                onClick={onFetchDriveFolder}
                disabled={listing}
                className="bg-pdp-orange hover:bg-pdp-orange/90 text-white"
              >
                {listing ? (
                  <Loader2Icon className="animate-spin" aria-hidden />
                ) : (
                  <LinkIcon aria-hidden />
                )}
                Đọc folder bằng Drive API
              </Button>
              <p className="text-muted-foreground text-xs">
                Yêu cầu quyền{" "}
                <code className="bg-muted rounded px-1 font-mono">
                  drive.metadata.readonly
                </code>
                .
              </p>
            </div>
          </div>

          <ol className="list-decimal space-y-2 pl-5">
            <li>
              Vào{" "}
              <a
                href="https://drive.google.com/drive/my-drive"
                target="_blank"
                rel="noopener noreferrer"
                className="text-pdp-orange underline-offset-2 hover:underline"
              >
                Google Drive
              </a>
              , tạo (hoặc dùng lại) một thư mục dành riêng cho chiến dịch này.
              Nếu đã có folder ID hãy lưu vào ô &quot;Drive folder ID&quot;
              trong phần chỉnh sửa chiến dịch.
            </li>
            <li>
              Tải lên toàn bộ file PNG đã sinh ở bước &quot;Sinh chứng nhận hàng
              loạt&quot;. Có thể giải nén ZIP trước khi upload, hoặc kéo thẳng
              các file PNG vào folder.
            </li>
            <li>
              Click chuột phải vào folder → <em>Chia sẻ</em> → đổi sang{" "}
              <strong>&quot;Bất kỳ ai có liên kết — Người xem&quot;</strong>.
              Nếu không bật bước này, sinh viên sẽ không xem/tải được PNG khi
              tra cứu.
            </li>
            <li>
              Nếu Drive API không dùng được, mở{" "}
              <a
                href="https://script.google.com/home"
                target="_blank"
                rel="noopener noreferrer"
                className="text-pdp-orange underline-offset-2 hover:underline"
              >
                Google Apps Script
              </a>{" "}
              → <em>New project</em>, dán đoạn code dưới (thay{" "}
              <code className="bg-muted rounded px-1 font-mono text-xs">
                FOLDER_ID
              </code>
              ) → Run. Mở Executions → Logs → copy toàn bộ &quot;filename,
              file_id&quot; và dán vào ô bên cạnh.
            </li>
          </ol>

          <div className="bg-muted/50 relative rounded-md border">
            <pre className="overflow-x-auto p-3 text-xs leading-relaxed whitespace-pre">
              {APPS_SCRIPT_SNIPPET}
            </pre>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="absolute top-2 right-2"
              onClick={copySnippet}
            >
              <CopyIcon aria-hidden />
              Copy
            </Button>
          </div>

          {folderId ? (
            <p className="text-muted-foreground text-xs">
              Mẹo: thay <code className="font-mono">FOLDER_ID</code> bằng{" "}
              <code className="bg-muted rounded px-1 font-mono">
                {folderId}
              </code>{" "}
              (đã lưu trong chiến dịch).
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold">Bước 2 · Dán manifest</h2>
          <p className="text-muted-foreground text-sm">
            Hệ thống tự nhận diện CSV, TSV hoặc cột phân cách bằng dấu chấm
            phẩy. Tối thiểu cần 2 cột:{" "}
            <code className="bg-muted rounded px-1 font-mono text-xs">
              filename
            </code>{" "}
            và{" "}
            <code className="bg-muted rounded px-1 font-mono text-xs">
              file_id
            </code>{" "}
            (chấp nhận cả URL Drive).
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={manifestText}
            onChange={(e) => setManifestText(e.target.value)}
            placeholder={`filename,file_id\nPS43995_NGUYEN_VAN_A_POLYPASS_20260506.png,1AbCdEfGh...`}
            className="min-h-[200px] font-mono text-xs"
          />

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onPreview}
              disabled={previewing}
            >
              {previewing ? (
                <Loader2Icon className="animate-spin" aria-hidden />
              ) : (
                <LinkIcon aria-hidden />
              )}
              Xem trước
            </Button>
            {preview && preview.matched.length > 0 ? (
              <ConfirmDialog
                title={`Áp dụng cho ${preview.matched.length.toLocaleString("vi-VN")} chứng nhận?`}
                description={`Hệ thống sẽ ghi đè drive_file_id, drive_view_url, drive_download_url cho các chứng nhận đã ghép. ${
                  preview.matched.filter((m) => m.hasExistingLink).length
                } chứng nhận đã có liên kết Drive trước đó sẽ bị thay thế.`}
                confirmLabel="Áp dụng"
                cancelLabel="Huỷ"
                variant="primary"
                onConfirm={onApply}
                trigger={
                  <Button
                    type="button"
                    disabled={applying}
                    className="bg-pdp-orange hover:bg-pdp-orange/90 text-white"
                  >
                    {applying ? (
                      <Loader2Icon className="animate-spin" aria-hidden />
                    ) : (
                      <CheckCircle2Icon aria-hidden />
                    )}
                    Áp dụng
                  </Button>
                }
              />
            ) : null}
          </div>
        </CardContent>
      </Card>

      {preview ? (
        <div className="lg:col-span-2">
          <PreviewSummary preview={preview} />
        </div>
      ) : null}
    </div>
  );
}

function PreviewSummary({ preview }: { preview: ManifestPreview }) {
  const overwriteCount = preview.matched.filter(
    (m) => m.hasExistingLink,
  ).length;
  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold">Báo cáo ghép</h2>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat
            label="Sẽ cập nhật"
            value={preview.matched.length}
            tone="success"
          />
          <Stat
            label="Manifest không khớp"
            value={preview.unmatchedFilenames.length}
            tone="warning"
          />
          <Stat
            label="Chứng nhận chưa có file"
            value={preview.uncoveredCertificateFilenames.length}
            tone="warning"
          />
        </div>

        {overwriteCount > 0 ? (
          <div className="border-pdp-orange/30 bg-pdp-orange/5 text-pdp-orange flex items-start gap-2 rounded-md border p-3 text-xs">
            <AlertCircleIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              {overwriteCount.toLocaleString("vi-VN")} chứng nhận đã có liên kết
              Drive cũ sẽ bị ghi đè. Nếu đây là lần đầu liên kết, hãy bỏ qua
              cảnh báo này.
            </span>
          </div>
        ) : null}

        {preview.parseErrors.length > 0 ? (
          <details className="rounded-md border">
            <summary className="text-destructive cursor-pointer px-3 py-2 text-xs font-medium">
              {preview.parseErrors.length} dòng lỗi cú pháp
            </summary>
            <ul className="text-destructive max-h-48 overflow-auto px-4 py-2 text-xs">
              {preview.parseErrors.slice(0, 50).map((e, i) => (
                <li key={i}>
                  Dòng {e.line}: {e.message}
                </li>
              ))}
              {preview.parseErrors.length > 50 ? (
                <li className="text-muted-foreground">
                  ...và {preview.parseErrors.length - 50} dòng khác.
                </li>
              ) : null}
            </ul>
          </details>
        ) : null}

        <details className="rounded-md border">
          <summary className="cursor-pointer px-3 py-2 text-xs font-medium">
            Xem chi tiết ({preview.matched.length} ghép được)
          </summary>
          <div className="max-h-72 overflow-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="px-3 py-2">MSSV</th>
                  <th className="px-3 py-2">Họ và tên</th>
                  <th className="px-3 py-2">File</th>
                  <th className="px-3 py-2">file_id</th>
                </tr>
              </thead>
              <tbody>
                {preview.matched.slice(0, 200).map((m) => (
                  <tr key={m.certificateId} className="border-t">
                    <td className="px-3 py-1.5 font-mono">{m.studentCode}</td>
                    <td className="px-3 py-1.5">{m.fullName}</td>
                    <td className="px-3 py-1.5 font-mono">{m.fileName}</td>
                    <td className="px-3 py-1.5 font-mono">
                      {m.fileId.slice(0, 16)}...
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.matched.length > 200 ? (
              <p className="text-muted-foreground p-3 text-xs">
                ...và {preview.matched.length - 200} dòng khác.
              </p>
            ) : null}
          </div>
        </details>

        {preview.unmatchedFilenames.length > 0 ? (
          <details className="rounded-md border">
            <summary className="text-muted-foreground cursor-pointer px-3 py-2 text-xs font-medium">
              File trong manifest không có chứng nhận tương ứng (
              {preview.unmatchedFilenames.length})
            </summary>
            <ul className="max-h-48 overflow-auto px-4 py-2 font-mono text-xs">
              {preview.unmatchedFilenames.slice(0, 100).map((f, i) => (
                <li key={i}>{f}</li>
              ))}
              {preview.unmatchedFilenames.length > 100 ? (
                <li className="text-muted-foreground">
                  ...và {preview.unmatchedFilenames.length - 100} file khác.
                </li>
              ) : null}
            </ul>
          </details>
        ) : null}

        {preview.uncoveredCertificateFilenames.length > 0 ? (
          <details className="rounded-md border">
            <summary className="text-muted-foreground cursor-pointer px-3 py-2 text-xs font-medium">
              Chứng nhận chưa có file PNG (
              {preview.uncoveredCertificateFilenames.length})
            </summary>
            <ul className="max-h-48 overflow-auto px-4 py-2 font-mono text-xs">
              {preview.uncoveredCertificateFilenames
                .slice(0, 100)
                .map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              {preview.uncoveredCertificateFilenames.length > 100 ? (
                <li className="text-muted-foreground">
                  ...và {preview.uncoveredCertificateFilenames.length - 100}{" "}
                  file khác.
                </li>
              ) : null}
            </ul>
          </details>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "success" | "warning";
}) {
  const toneClass = tone === "success" ? "text-emerald-600" : "text-amber-600";
  return (
    <div className="rounded-md border p-3">
      <p className="text-muted-foreground text-xs tracking-wide uppercase">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-bold ${toneClass}`}>
        {value.toLocaleString("vi-VN")}
      </p>
    </div>
  );
}
