import { DownloadIcon, ExternalLinkIcon, ImageIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  buildDriveImagePreviewUrl,
  extractFileIdFromUrl,
} from "@/lib/google-drive/url";

export function CertificateImagePreview({
  title,
  studentCode,
  driveViewUrl,
  driveDownloadUrl,
}: {
  title: string;
  studentCode: string;
  driveViewUrl: string | null;
  driveDownloadUrl?: string | null;
}) {
  const fileId = extractFileIdFromUrl(driveViewUrl ?? driveDownloadUrl ?? "");
  const previewUrl = fileId ? buildDriveImagePreviewUrl(fileId) : null;

  if (!driveViewUrl && !driveDownloadUrl) {
    return null;
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold">Bản xem trước chứng nhận</p>
          <p className="text-muted-foreground text-sm">
            {title} · {studentCode}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {driveViewUrl ? (
            <Button asChild variant="outline" size="sm">
              <a href={driveViewUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLinkIcon aria-hidden />
                Mở trên Drive
              </a>
            </Button>
          ) : null}
          {driveDownloadUrl ? (
            <Button
              asChild
              size="sm"
              className="bg-pdp-orange hover:bg-pdp-orange/90 text-white"
            >
              <a
                href={driveDownloadUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <DownloadIcon aria-hidden />
                Tải PNG
              </a>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="bg-muted/50 overflow-hidden rounded-lg border p-2 sm:p-3">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt={`Chứng nhận của ${studentCode}`}
            className="mx-auto h-auto w-full rounded border bg-white object-contain shadow-sm"
            loading="eager"
          />
        ) : (
          <div className="text-muted-foreground flex min-h-48 flex-col items-center justify-center gap-2 text-center text-sm">
            <ImageIcon className="size-8" aria-hidden />
            <p>Chưa tạo được ảnh xem trước từ link Drive.</p>
          </div>
        )}
      </div>
    </section>
  );
}
