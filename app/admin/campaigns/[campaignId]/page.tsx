import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AwardIcon,
  ChevronLeftIcon,
  FileSpreadsheetIcon,
  LinkIcon,
  SparklesIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CampaignStatusBadge } from "@/components/admin/campaign-status-badge";
import { PublishButton } from "@/components/admin/publish-button";
import { createClient } from "@/lib/supabase/server";
import { CampaignEditForm } from "./edit-form";

export const metadata = { title: "Chiến dịch" };

type Params = Promise<{ campaignId: string }>;

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "long",
  timeStyle: "short",
});

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return dateFormatter.format(d);
}

export default async function CampaignDetailPage({
  params,
}: {
  params: Params;
}) {
  const { campaignId } = await params;
  const supabase = await createClient();

  const { data: campaign, error } = await supabase
    .from("campaigns")
    .select(
      "id, title, slug, description, issue_date, signer_name, signer_title, drive_folder_id, status, created_at, updated_at",
    )
    .eq("id", campaignId)
    .maybeSingle();

  if (error) {
    return (
      <div className="text-destructive text-sm">
        Không thể tải chiến dịch: {error.message}
      </div>
    );
  }
  if (!campaign) notFound();

  // Lightweight count of certificates for this campaign so the admin sees
  // at-a-glance how many rows have been persisted.
  const { count: certificateCount } = await supabase
    .from("certificates")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", campaign.id);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/campaigns"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeftIcon className="size-4" aria-hidden />
          Quay lại danh sách
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">
            {campaign.title}
          </h1>
          <CampaignStatusBadge status={campaign.status} />
        </div>
        <p className="text-muted-foreground mt-1 text-xs">
          Tạo lúc {formatDate(campaign.created_at)} · Cập nhật{" "}
          {formatDate(campaign.updated_at)}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Button asChild variant="outline" className="justify-start">
          <Link href={`/admin/campaigns/${campaign.id}/import`}>
            <FileSpreadsheetIcon aria-hidden />
            Nhập danh sách Excel
          </Link>
        </Button>
        <Button
          asChild
          className="bg-pdp-orange hover:bg-pdp-orange/90 justify-start text-white"
        >
          <Link href={`/admin/campaigns/${campaign.id}/generator`}>
            <SparklesIcon aria-hidden />
            Sinh chứng nhận hàng loạt
          </Link>
        </Button>
        <Button asChild variant="outline" className="justify-start">
          <Link href={`/admin/campaigns/${campaign.id}/drive-link`}>
            <LinkIcon aria-hidden />
            Liên kết Drive (manifest)
          </Link>
        </Button>
        <Button asChild variant="outline" className="justify-start">
          <Link href={`/admin/campaigns/${campaign.id}/certificates`}>
            <AwardIcon aria-hidden />
            Chứng nhận đã lưu ({(certificateCount ?? 0).toLocaleString("vi-VN")}
            )
          </Link>
        </Button>
        <div className="sm:col-span-2 lg:col-span-1 lg:justify-self-end">
          <PublishButton
            campaignId={campaign.id}
            isPublished={campaign.status === "published"}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold">Chỉnh sửa thông tin</h2>
        </CardHeader>
        <CardContent>
          <CampaignEditForm
            campaignId={campaign.id}
            defaults={{
              title: campaign.title,
              slug: campaign.slug,
              description: campaign.description,
              issue_date: campaign.issue_date,
              signer_name: campaign.signer_name,
              signer_title: campaign.signer_title,
              drive_folder_id: campaign.drive_folder_id,
              status: campaign.status,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
