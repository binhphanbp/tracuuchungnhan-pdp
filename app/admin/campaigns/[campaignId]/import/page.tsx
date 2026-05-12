import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeftIcon } from "lucide-react";

import { ExcelImportWizard } from "@/components/admin/excel-import-wizard";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Nhập danh sách Excel" };

type Params = Promise<{ campaignId: string }>;

export default async function CampaignImportPage({
  params,
}: {
  params: Params;
}) {
  const { campaignId } = await params;
  const supabase = await createClient();

  const { data: campaign, error } = await supabase
    .from("campaigns")
    .select("id, title, slug")
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
          Nhập danh sách Excel
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Tải lên file Excel chứa danh sách sinh viên cho chiến dịch{" "}
          <span className="font-medium">{campaign.title}</span>. Hệ thống sẽ tự
          nhận diện cột, kiểm tra dữ liệu và liệt kê lỗi trước khi sinh chứng
          nhận.
        </p>
      </div>

      <ExcelImportWizard />
    </div>
  );
}
