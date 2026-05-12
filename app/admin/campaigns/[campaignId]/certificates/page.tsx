import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeftIcon } from "lucide-react";

import { CertificatesTable } from "@/components/admin/certificates-table";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Chứng nhận của chiến dịch" };

type Params = Promise<{ campaignId: string }>;

export default async function CampaignCertificatesPage({
  params,
}: {
  params: Params;
}) {
  const { campaignId } = await params;
  const supabase = await createClient();

  const { data: campaign, error: campaignErr } = await supabase
    .from("campaigns")
    .select("id, title")
    .eq("id", campaignId)
    .maybeSingle();

  if (campaignErr) {
    return (
      <div className="text-destructive text-sm">
        Không thể tải chiến dịch: {campaignErr.message}
      </div>
    );
  }
  if (!campaign) notFound();

  const { data: rows, error: rowsErr } = await supabase
    .from("certificates")
    .select(
      "id, student_code, full_name, class_name, verification_code, status, issue_date",
    )
    .eq("campaign_id", campaignId)
    .order("student_code", { ascending: true })
    .limit(500);

  if (rowsErr) {
    return (
      <div className="text-destructive text-sm">
        Không thể tải chứng nhận: {rowsErr.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/admin/campaigns/${campaign.id}`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeftIcon className="size-4" aria-hidden />
          Quay lại {campaign.title}
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          Chứng nhận đã lưu
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {rows?.length === 500
            ? "Hiển thị 500 dòng đầu tiên — sử dụng tìm kiếm toàn cục để xem thêm."
            : `Tổng ${(rows?.length ?? 0).toLocaleString("vi-VN")} chứng nhận trong chiến dịch này.`}
        </p>
      </div>

      <CertificatesTable rows={rows ?? []} />
    </div>
  );
}
