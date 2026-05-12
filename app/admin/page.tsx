import Link from "next/link";
import {
  AwardIcon,
  FolderKanbanIcon,
  PlusIcon,
  RocketIcon,
  SparklesIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Tổng quan" };

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Lightweight aggregate counts. We don't need the rows themselves —
  // `head: true, count: 'exact'` returns just a count without payload.
  const [
    { count: campaignTotal },
    { count: campaignPublished },
    { count: certificateTotal },
    { count: certificatePublished },
  ] = await Promise.all([
    supabase.from("campaigns").select("id", { count: "exact", head: true }),
    supabase
      .from("campaigns")
      .select("id", { count: "exact", head: true })
      .eq("status", "published"),
    supabase.from("certificates").select("id", { count: "exact", head: true }),
    supabase
      .from("certificates")
      .select("id", { count: "exact", head: true })
      .eq("status", "published"),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tổng quan</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Khu vực dành cho cán bộ Phòng Phát triển Cá nhân — quản lý chiến
            dịch, nhập danh sách và sinh chứng nhận hàng loạt.
          </p>
        </div>
        <Button
          asChild
          className="bg-pdp-orange hover:bg-pdp-orange/90 text-white"
        >
          <Link href="/admin/campaigns/new">
            <PlusIcon aria-hidden />
            Tạo chiến dịch mới
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Tổng chiến dịch"
          value={campaignTotal ?? 0}
          subtext={`${campaignPublished ?? 0} đã phát hành`}
          icon={<FolderKanbanIcon className="size-4" />}
          href="/admin/campaigns"
        />
        <StatCard
          label="Tổng chứng nhận"
          value={certificateTotal ?? 0}
          subtext={`${certificatePublished ?? 0} đã phát hành`}
          icon={<AwardIcon className="size-4" />}
          href="/admin/certificates"
        />
        <StatCard
          label="Tỷ lệ phát hành"
          value={
            certificateTotal && certificateTotal > 0
              ? `${Math.round(
                  ((certificatePublished ?? 0) / certificateTotal) * 100,
                )}%`
              : "—"
          }
          subtext="trên tổng số đã sinh"
          icon={<RocketIcon className="size-4" />}
        />
        <StatCard
          label="Drive sync"
          value="MVP"
          subtext="Đợi M9 hoặc M10"
          icon={<SparklesIcon className="size-4" />}
          muted
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ActionCard
          title="Bắt đầu một đợt cấp chứng nhận"
          description="Tạo chiến dịch mới, nhập danh sách Excel, sinh PNG hàng loạt và phát hành để sinh viên tra cứu."
          ctaLabel="Đến quản lý chiến dịch"
          href="/admin/campaigns"
        />
        <ActionCard
          title="Tra cứu chứng nhận đã sinh"
          description="Tìm theo MSSV, tên (kể cả không dấu), hoặc mã xác minh. Lọc theo chiến dịch và trạng thái."
          ctaLabel="Mở bảng chứng nhận"
          href="/admin/certificates"
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  subtext,
  icon,
  href,
  muted,
}: {
  label: string;
  value: number | string;
  subtext: string;
  icon: React.ReactNode;
  href?: string;
  muted?: boolean;
}) {
  const display =
    typeof value === "number" ? value.toLocaleString("vi-VN") : value;
  const inner = (
    <Card
      className={`${muted ? "bg-muted/40" : ""} hover:border-pdp-orange/40 h-full transition-colors`}
    >
      <CardContent className="space-y-1.5 p-5">
        <div className="text-muted-foreground flex items-center justify-between text-xs font-medium tracking-wide uppercase">
          <span>{label}</span>
          <span
            className={`bg-pdp-orange/10 text-pdp-orange inline-flex size-7 items-center justify-center rounded-md`}
          >
            {icon}
          </span>
        </div>
        <p className="text-2xl font-bold">{display}</p>
        <p className="text-muted-foreground text-xs">{subtext}</p>
      </CardContent>
    </Card>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

function ActionCard({
  title,
  description,
  ctaLabel,
  href,
}: {
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
}) {
  return (
    <Card className="hover:border-pdp-orange/40 transition-colors">
      <CardContent className="space-y-3 p-6">
        <h2 className="font-semibold">{title}</h2>
        <p className="text-muted-foreground text-sm">{description}</p>
        <Button asChild variant="outline" size="sm">
          <Link href={href}>{ctaLabel} →</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
