import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CampaignForm } from "@/components/admin/campaign-form";
import { createCampaign } from "@/app/admin/campaigns/actions";

export const metadata = { title: "Tạo chiến dịch" };

export default function NewCampaignPage() {
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
        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          Tạo chiến dịch mới
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Mỗi chiến dịch đại diện cho một đợt cấp chứng nhận. Sau khi tạo, bạn
          có thể nhập danh sách sinh viên và sinh chứng nhận hàng loạt.
        </p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold">Thông tin chiến dịch</h2>
        </CardHeader>
        <CardContent>
          <CampaignForm action={createCampaign} submitLabel="Tạo chiến dịch" />
        </CardContent>
      </Card>
    </div>
  );
}
