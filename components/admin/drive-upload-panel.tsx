"use client";

import { useState } from "react";
import {
  CheckCircle2Icon,
  CloudUploadIcon,
  KeyRoundIcon,
  Loader2Icon,
  LogOutIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isGoogleDriveConfigured } from "@/lib/google-drive/config";
import { extractFileIdFromUrl } from "@/lib/google-drive/url";

/**
 * Public state of the Drive auth flow. Lives in the generator wizard so the
 * batch-generation step can read the current token and folder.
 */
export type DriveAuthState =
  | { kind: "signed_out" }
  | { kind: "signed_in"; accessToken: string; expiresAt: number };

export type DriveUploadConfig = {
  auth: DriveAuthState;
  folderId: string | null;
};

export function DriveUploadPanel({
  config,
  onConfigChange,
  totalToUpload,
  uploadProgress,
  uploading,
  onStartUpload,
}: {
  config: DriveUploadConfig;
  onConfigChange: (next: DriveUploadConfig) => void;
  /** How many certificates would be uploaded if the admin clicked the button. */
  totalToUpload: number;
  /** Live progress while uploading. Null when idle. */
  uploadProgress: { done: number; total: number; failed: number } | null;
  uploading: boolean;
  /** Trigger the parent to begin uploading the already-rendered certificates. */
  onStartUpload: () => void;
}) {
  const [folderInput, setFolderInput] = useState(config.folderId ?? "");
  const [signing, setSigning] = useState(false);

  const driveConfigured = isGoogleDriveConfigured();
  const signedIn = config.auth.kind === "signed_in";

  const handleSignIn = async () => {
    setSigning(true);
    try {
      // Dynamic import so the GIS script never loads on public pages.
      const { requestDriveAccessToken } =
        await import("@/lib/google-drive/oauth");
      const { accessToken, expiresAt } = await requestDriveAccessToken();
      onConfigChange({
        auth: { kind: "signed_in", accessToken, expiresAt },
        folderId: config.folderId,
      });
      toast.success("Đã đăng nhập Google.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thể đăng nhập.");
    } finally {
      setSigning(false);
    }
  };

  const handleSignOut = () => {
    onConfigChange({ auth: { kind: "signed_out" }, folderId: config.folderId });
    toast.success("Đã đăng xuất khỏi Google.");
  };

  const handleApplyFolder = () => {
    const trimmed = folderInput.trim();
    if (!trimmed) {
      onConfigChange({ ...config, folderId: null });
      toast.info("Đã bỏ chọn thư mục Drive.");
      return;
    }
    // Accept either raw IDs or full Drive URLs (e.g. the folder URL from
    // the address bar). extractFileIdFromUrl handles both cases.
    const id = extractFileIdFromUrl(trimmed);
    if (!id) {
      toast.error("Không nhận diện được folder ID.");
      return;
    }
    onConfigChange({ ...config, folderId: id });
    toast.success("Đã chọn thư mục Drive.");
  };

  if (!driveConfigured) {
    return (
      <div className="bg-muted/40 rounded-md border border-dashed p-4 text-sm">
        <p className="font-medium">Tải lên Google Drive (M10) chưa được bật</p>
        <p className="text-muted-foreground mt-1">
          Quản trị hệ thống cần khai báo biến môi trường{" "}
          <code className="bg-muted rounded px-1 font-mono text-xs">
            NEXT_PUBLIC_GOOGLE_CLIENT_ID
          </code>{" "}
          (xem hướng dẫn trong README + HANDOFF). Trong thời gian chờ, hãy tải
          ZIP và dùng wizard &quot;Liên kết Drive (manifest)&quot; để gắn
          file_id thủ công.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Auth row */}
      <div className="flex flex-wrap items-center gap-3">
        {signedIn ? (
          <>
            <span className="inline-flex items-center gap-1.5 text-sm text-emerald-700">
              <CheckCircle2Icon className="size-4" aria-hidden />
              Đã đăng nhập Google
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              type="button"
            >
              <LogOutIcon aria-hidden />
              Đăng xuất
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            onClick={handleSignIn}
            disabled={signing}
            type="button"
          >
            {signing ? (
              <Loader2Icon className="animate-spin" aria-hidden />
            ) : (
              <KeyRoundIcon aria-hidden />
            )}
            Đăng nhập Google
          </Button>
        )}
        <p className="text-muted-foreground text-xs">
          Phạm vi yêu cầu:{" "}
          <code className="bg-muted rounded px-1 font-mono">drive.file</code> —
          chỉ truy cập file do app này tạo, không đọc toàn bộ Drive.
        </p>
      </div>

      {/* Folder picker */}
      <div className="grid gap-2">
        <Label htmlFor="drive-folder-id" className="text-sm">
          Thư mục Drive (folder ID hoặc URL)
        </Label>
        <div className="flex gap-2">
          <Input
            id="drive-folder-id"
            value={folderInput}
            onChange={(e) => setFolderInput(e.target.value)}
            placeholder="VD: 1abcDEF... hoặc https://drive.google.com/drive/folders/1abc..."
            className="font-mono text-xs"
          />
          <Button
            variant="outline"
            type="button"
            onClick={handleApplyFolder}
            disabled={uploading}
          >
            Lưu
          </Button>
        </div>
        {config.folderId ? (
          <p className="text-muted-foreground text-xs">
            Sẽ upload vào folder{" "}
            <code className="bg-muted rounded px-1 font-mono">
              {config.folderId}
            </code>
            . Nhớ đảm bảo folder đã chia sẻ &quot;Bất kỳ ai có liên kết — Người
            xem&quot; thì sinh viên mới xem được.
          </p>
        ) : (
          <p className="text-muted-foreground text-xs">
            Bỏ trống để upload vào root Drive (không khuyến khích — khó tìm lại
            sau này).
          </p>
        )}
      </div>

      {/* Upload action */}
      <div className="flex flex-wrap items-center gap-3 border-t pt-4">
        <Button
          type="button"
          onClick={onStartUpload}
          disabled={!signedIn || totalToUpload === 0 || uploading}
          className="bg-pdp-orange hover:bg-pdp-orange/90 text-white"
        >
          {uploading ? (
            <Loader2Icon className="animate-spin" aria-hidden />
          ) : (
            <CloudUploadIcon aria-hidden />
          )}
          Tải lên Drive
          {totalToUpload > 0
            ? ` (${totalToUpload.toLocaleString("vi-VN")})`
            : ""}
        </Button>
        {uploadProgress ? (
          <div className="text-muted-foreground flex flex-col gap-0.5 text-xs">
            <span>
              {uploadProgress.done.toLocaleString("vi-VN")} /{" "}
              {uploadProgress.total.toLocaleString("vi-VN")} đã upload
              {uploadProgress.failed > 0 ? (
                <span className="text-destructive ml-2">
                  ({uploadProgress.failed} lỗi)
                </span>
              ) : null}
            </span>
            <div className="bg-muted h-1.5 w-48 overflow-hidden rounded-full">
              <div
                className="bg-pdp-orange h-full transition-all"
                style={{
                  width: `${(uploadProgress.done / Math.max(1, uploadProgress.total)) * 100}%`,
                }}
              />
            </div>
          </div>
        ) : totalToUpload === 0 ? (
          <p className="text-muted-foreground text-xs">
            Hãy sinh chứng nhận trước, sau đó quay lại đây để upload.
          </p>
        ) : null}
      </div>
    </div>
  );
}
