import { cn } from "@/lib/utils";
import type { CampaignStatus } from "@/lib/validation/campaign";

const STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: "Nháp",
  published: "Đang phát hành",
  archived: "Đã lưu trữ",
};

const STATUS_STYLES: Record<CampaignStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-emerald-100 text-emerald-800",
  archived: "bg-amber-100 text-amber-800",
};

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
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
