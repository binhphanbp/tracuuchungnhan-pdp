import { cn } from "@/lib/utils";
import type { CertificateStatus } from "@/types/database";

const STATUS_LABELS: Record<CertificateStatus, string> = {
  draft: "Nháp",
  published: "Đã phát hành",
  revoked: "Đã thu hồi",
};

const STATUS_STYLES: Record<CertificateStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-emerald-100 text-emerald-800",
  revoked: "bg-rose-100 text-rose-800",
};

export function CertificateStatusBadge({
  status,
}: {
  status: CertificateStatus;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        STATUS_STYLES[status],
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
