import Link from "next/link";
import {
  CheckCircle2Icon,
  ShieldAlertIcon,
  ShieldCheckIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CertificateImagePreview } from "@/components/public/certificate-image-preview";
import { createClient } from "@/lib/supabase/server";

type Params = Promise<{ code: string }>;

export default async function VerifyPage({ params }: { params: Params }) {
  const { code } = await params;

  let result = null as {
    student_code: string;
    full_name: string;
    certificate_title: string | null;
    issue_date: string;
    campaign_title: string;
    signer_name: string | null;
    signer_title: string | null;
    drive_view_url: string | null;
    drive_download_url: string | null;
    verification_code: string;
  } | null;

  let envMissing = false;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("public_verify_certificate", {
      p_code: code,
    });
    if (!error && data && data.length > 0) {
      result = data[0];
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes("Missing Supabase env")) {
      envMissing = true;
    } else {
      throw err;
    }
  }

  const tone = result ? "success" : "error";

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12">
      <p
        className={`text-xs font-semibold tracking-wide uppercase ${
          tone === "success" ? "text-pdp-orange" : "text-muted-foreground"
        }`}
      >
        Trang xác minh
      </p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
        {result
          ? "Chứng nhận hợp lệ"
          : envMissing
            ? "Hệ thống chưa sẵn sàng"
            : "Không tìm thấy chứng nhận"}
      </h1>

      <div className="mt-6">
        {envMissing ? (
          <Card className="border-border/60">
            <CardContent className="space-y-3 p-6">
              <div className="bg-muted text-muted-foreground inline-flex size-12 items-center justify-center rounded-full">
                <ShieldAlertIcon className="size-5" aria-hidden />
              </div>
              <p className="text-muted-foreground">
                Hệ thống chưa được cấu hình. Vui lòng quay lại sau.
              </p>
            </CardContent>
          </Card>
        ) : result ? (
          <Card className="border-pdp-orange/30 ring-pdp-orange/5 overflow-hidden ring-1">
            {/* Trust banner */}
            <div className="border-pdp-orange/20 bg-pdp-orange/5 flex items-center gap-2 border-b px-6 py-3">
              <CheckCircle2Icon
                className="text-pdp-orange size-5"
                aria-hidden
              />
              <span className="text-pdp-orange text-sm font-semibold">
                Đã xác minh thành công · Chứng nhận chính thức của PDP
              </span>
            </div>
            <CardContent className="space-y-5 p-6">
              <div>
                <p className="text-muted-foreground text-xs tracking-wide uppercase">
                  Họ và tên
                </p>
                <p className="mt-0.5 text-2xl leading-tight font-semibold">
                  {result.full_name}
                </p>
              </div>
              <div className="grid gap-4 text-sm sm:grid-cols-2">
                <Field label="MSSV" value={result.student_code} />
                <Field
                  label="Ngày cấp"
                  value={new Date(result.issue_date).toLocaleDateString(
                    "vi-VN",
                  )}
                />
                <Field
                  label="Chương trình"
                  value={result.certificate_title ?? result.campaign_title}
                  span={2}
                />
                {result.signer_name ? (
                  <Field
                    label="Đơn vị cấp"
                    value={[result.signer_name, result.signer_title]
                      .filter(Boolean)
                      .join(" · ")}
                    span={2}
                  />
                ) : null}
                <Field
                  label="Mã xác thực"
                  value={
                    <code className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">
                      {result.verification_code}
                    </code>
                  }
                  span={2}
                />
              </div>

              <CertificateImagePreview
                title={result.certificate_title ?? result.campaign_title}
                studentCode={result.student_code}
                driveViewUrl={result.drive_view_url}
                driveDownloadUrl={result.drive_download_url}
              />

              <p className="text-muted-foreground border-border/60 border-t pt-3 text-xs">
                <ShieldCheckIcon className="mr-1 inline size-3.5" aria-hidden />
                Trang này được sinh ra từ mã xác thực duy nhất ghi trên chứng
                nhận. Mọi chứng nhận hợp lệ đều có một mã xác thực riêng.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/60">
            <CardContent className="space-y-3 p-6">
              <div className="bg-muted text-muted-foreground inline-flex size-12 items-center justify-center rounded-full">
                <ShieldAlertIcon className="size-5" aria-hidden />
              </div>
              <p>
                Mã{" "}
                <code className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">
                  {code}
                </code>{" "}
                không khớp với chứng nhận nào trong hệ thống.
              </p>
              <p className="text-muted-foreground text-sm">
                Có thể chứng nhận chưa được phát hành, đã bị huỷ, hoặc mã đã bị
                nhập sai. Vui lòng kiểm tra lại trên giấy chứng nhận hoặc liên
                hệ phòng PDP.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/">← Trở về trang tra cứu</Link>
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  span,
}: {
  label: string;
  value: React.ReactNode;
  span?: 2;
}) {
  return (
    <div className={span === 2 ? "sm:col-span-2" : undefined}>
      <p className="text-muted-foreground text-xs tracking-wide uppercase">
        {label}
      </p>
      <p className="mt-0.5 break-words">{value}</p>
    </div>
  );
}
