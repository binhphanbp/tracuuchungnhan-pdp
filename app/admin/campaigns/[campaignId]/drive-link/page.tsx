import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeftIcon } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DriveLinkWizard } from "@/components/admin/drive-link-wizard";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Liên kết Drive" };

type Params = Promise<{ campaignId: string }>;

export default async function DriveLinkPage({ params }: { params: Params }) {
  const { campaignId } = await params;
  const supabase = await createClient();

  const { data: campaign, error } = await supabase
    .from("campaigns")
    .select("id, title, drive_folder_id")
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

  // Lightweight: how many certificates already have a Drive link, vs total.
  // Used by the wizard to show a "X / Y đã có link" status.
  const { count: totalCount } = await supabase
    .from("certificates")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", campaign.id);
  const { count: linkedCount } = await supabase
    .from("certificates")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", campaign.id)
    .not("drive_file_id", "is", null);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/admin/campaigns/${campaign.id}`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeftIcon className="size-4" aria-hidden />
          Quay lại chiến dịch
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          Liên kết Drive — {campaign.title}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Sau khi sinh ZIP ở bước &quot;Sinh chứng nhận hàng loạt&quot;, hãy tải
          toàn bộ file PNG lên Google Drive. Hệ thống có thể đọc danh sách file
          trong folder bằng Drive API rồi ghép từng file với từng chứng nhận
          trong cơ sở dữ liệu.
        </p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold">Trạng thái</h2>
        </CardHeader>
        <CardContent className="text-sm">
          <p>
            <strong>{(linkedCount ?? 0).toLocaleString("vi-VN")}</strong> /{" "}
            {(totalCount ?? 0).toLocaleString("vi-VN")} chứng nhận đã có liên
            kết Drive.
          </p>
          {campaign.drive_folder_id ? (
            <p className="text-muted-foreground mt-1">
              Drive folder ID đã lưu:{" "}
              <code className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">
                {campaign.drive_folder_id}
              </code>
            </p>
          ) : (
            <p className="text-muted-foreground mt-1">
              Chưa khai báo Drive folder ID. Bạn có thể bổ sung trong phần chỉnh
              sửa chiến dịch để dễ tham chiếu sau này (không bắt buộc cho luồng
              Drive API/manifest).
            </p>
          )}
        </CardContent>
      </Card>

      <DriveLinkWizard
        campaignId={campaign.id}
        folderId={campaign.drive_folder_id}
      />
    </div>
  );
}
