import Link from "next/link";
import { AwardIcon } from "lucide-react";

import { CertificateStatusBadge } from "@/components/admin/certificate-status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CertificateStatus } from "@/types/database";

type Row = {
  id: string;
  student_code: string;
  full_name: string;
  class_name: string | null;
  verification_code: string;
  status: CertificateStatus;
  issue_date: string;
  campaign?: { id: string; title: string; slug: string } | null;
};

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "medium",
});

export function CertificatesTable({
  rows,
  showCampaign = false,
}: {
  rows: Row[];
  showCampaign?: boolean;
}) {
  if (rows.length === 0) {
    return (
      <div className="border-border/60 flex flex-col items-center gap-3 rounded-lg border border-dashed p-10 text-center">
        <div className="bg-pdp-orange/10 text-pdp-orange flex size-12 items-center justify-center rounded-full">
          <AwardIcon className="size-5" aria-hidden />
        </div>
        <p className="font-semibold">Chưa có chứng nhận nào</p>
        <p className="text-muted-foreground max-w-md text-sm">
          Kết quả trống với bộ lọc hiện tại. Tử từ xóa bộ lọc, hoặc mở một chiến
          dịch và dùng trình sinh hàng loạt để tạo chứng nhận đầu tiên.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">MSSV</TableHead>
            <TableHead>Họ và tên</TableHead>
            <TableHead className="w-[120px]">Lớp</TableHead>
            {showCampaign ? <TableHead>Chiến dịch</TableHead> : null}
            <TableHead className="w-[120px]">Ngày cấp</TableHead>
            <TableHead className="w-[140px]">Mã xác minh</TableHead>
            <TableHead className="w-[120px]">Trạng thái</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-mono text-xs uppercase">
                {row.student_code}
              </TableCell>
              <TableCell className="font-medium">{row.full_name}</TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {row.class_name ?? "—"}
              </TableCell>
              {showCampaign ? (
                <TableCell className="text-sm">
                  {row.campaign ? (
                    <Link
                      href={`/admin/campaigns/${row.campaign.id}`}
                      className="hover:text-pdp-orange underline-offset-2 hover:underline"
                    >
                      {row.campaign.title}
                    </Link>
                  ) : (
                    "—"
                  )}
                </TableCell>
              ) : null}
              <TableCell className="text-muted-foreground text-sm">
                {formatDate(row.issue_date)}
              </TableCell>
              <TableCell className="font-mono text-xs">
                {row.verification_code}
              </TableCell>
              <TableCell>
                <CertificateStatusBadge status={row.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return dateFormatter.format(d);
}
