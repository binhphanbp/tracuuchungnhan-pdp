import Link from "next/link";

import { Button } from "@/components/ui/button";
import { CertificateFilters } from "@/components/admin/certificate-filters";
import { CertificatesTable } from "@/components/admin/certificates-table";
import { createClient } from "@/lib/supabase/server";
import { toSearchableName } from "@/lib/utils/normalize";
import type { CertificateStatus } from "@/types/database";

export const metadata = { title: "Chứng nhận" };

const PAGE_SIZE = 50;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function pickStatus(value: unknown): CertificateStatus | null {
  if (value === "draft" || value === "published" || value === "revoked") {
    return value;
  }
  return null;
}

export default async function CertificatesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const campaignId = typeof sp.campaign === "string" ? sp.campaign : "";
  const status = pickStatus(sp.status);
  const page = Math.max(1, Number(sp.page) || 1);

  const supabase = await createClient();

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, title")
    .order("created_at", { ascending: false });

  let query = supabase
    .from("certificates")
    .select(
      "id, student_code, full_name, class_name, verification_code, status, issue_date, campaign:campaigns(id, title, slug)",
      { count: "exact" },
    )
    .order("updated_at", { ascending: false });

  if (campaignId) query = query.eq("campaign_id", campaignId);
  if (status) query = query.eq("status", status);
  if (q) {
    // Search by student_code (uppercased) OR by name (using the diacritic-
    // stripped column populated server-side). The server-side ilike keeps the
    // query simple — for very large rosters, swap in pg_trgm later.
    const escapedCode = q.toUpperCase().replace(/[%_]/g, "\\$&");
    const escapedName = toSearchableName(q).replace(/[%_]/g, "\\$&");
    query = query.or(
      `student_code.ilike.%${escapedCode}%,full_name_normalized.ilike.%${escapedName}%,verification_code.ilike.%${escapedCode}%`,
    );
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) {
    return (
      <div className="text-destructive text-sm">
        Không thể tải danh sách: {error.message}
      </div>
    );
  }

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Chứng nhận</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Toàn bộ chứng nhận đã lưu vào hệ thống. Tìm theo MSSV, tên (không
          dấu), hoặc mã xác minh.
        </p>
      </div>

      <CertificateFilters campaigns={campaigns ?? []} />

      <div className="text-muted-foreground text-sm">
        {total.toLocaleString("vi-VN")} kết quả · Trang {page} / {totalPages}
      </div>

      <CertificatesTable rows={data ?? []} showCampaign />

      {totalPages > 1 ? (
        <div className="flex items-center justify-end gap-2">
          <PageLink
            page={page - 1}
            disabled={page <= 1}
            sp={sp}
            label="Trước"
          />
          <PageLink
            page={page + 1}
            disabled={page >= totalPages}
            sp={sp}
            label="Sau"
          />
        </div>
      ) : null}
    </div>
  );
}

function PageLink({
  page,
  disabled,
  sp,
  label,
}: {
  page: number;
  disabled: boolean;
  sp: Record<string, string | string[] | undefined>;
  label: string;
}) {
  if (disabled) {
    return (
      <Button variant="outline" size="sm" disabled>
        {label}
      </Button>
    );
  }
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === "string" && k !== "page") params.set(k, v);
  }
  params.set("page", String(page));
  return (
    <Button asChild variant="outline" size="sm">
      <Link href={`/admin/certificates?${params.toString()}`}>{label}</Link>
    </Button>
  );
}
