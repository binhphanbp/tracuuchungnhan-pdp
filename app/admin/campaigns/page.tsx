import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CampaignStatusBadge } from "@/components/admin/campaign-status-badge";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Chiến dịch" };

const dateFormatter = new Intl.DateTimeFormat("vi-VN", { dateStyle: "long" });

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return dateFormatter.format(d);
}

export default async function CampaignListPage() {
  const supabase = await createClient();
  const { data: campaigns, error } = await supabase
    .from("campaigns")
    .select("id, title, slug, issue_date, status, updated_at")
    .order("updated_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Chiến dịch</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Mỗi chiến dịch đại diện cho một đợt cấp chứng nhận.
          </p>
        </div>
        <Button
          asChild
          className="bg-pdp-orange hover:bg-pdp-orange/90 text-white"
        >
          <Link href="/admin/campaigns/new">
            <PlusIcon aria-hidden />
            Tạo chiến dịch
          </Link>
        </Button>
      </div>

      {error ? (
        <Card>
          <CardContent className="text-destructive py-6 text-sm">
            Không thể tải danh sách: {error.message}
          </CardContent>
        </Card>
      ) : !campaigns || campaigns.length === 0 ? (
        <EmptyState />
      ) : (
        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Ngày cấp</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Cập nhật</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((c) => (
                <TableRow key={c.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    <Link
                      href={`/admin/campaigns/${c.id}`}
                      className="hover:text-pdp-orange"
                    >
                      {c.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {c.slug}
                  </TableCell>
                  <TableCell>{formatDate(c.issue_date)}</TableCell>
                  <TableCell>
                    <CampaignStatusBadge status={c.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-right text-xs">
                    {formatDate(c.updated_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <div className="bg-pdp-orange/10 text-pdp-orange flex size-12 items-center justify-center rounded-full">
          <PlusIcon className="size-5" aria-hidden />
        </div>
        <h2 className="text-lg font-semibold">Chưa có chiến dịch nào</h2>
        <p className="text-muted-foreground max-w-md text-sm">
          Tạo chiến dịch đầu tiên để bắt đầu nhập danh sách sinh viên và sinh
          chứng nhận hàng loạt.
        </p>
        <Button
          asChild
          className="bg-pdp-orange hover:bg-pdp-orange/90 mt-2 text-white"
        >
          <Link href="/admin/campaigns/new">Tạo chiến dịch đầu tiên</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
