import {
  ShieldCheckIcon,
  QrCodeIcon,
  DownloadIcon,
  AwardIcon,
  ArrowRightIcon,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { LookupForm } from "@/components/public/lookup-form";

export default function HomePage() {
  return (
    <div className="relative flex min-h-[calc(100svh-8.75rem)] items-center overflow-hidden">
      {/* Soft brand-tinted gradient backdrop, masked at top edge */}
      <div
        aria-hidden
        className="from-pdp-orange/10 absolute inset-x-0 top-0 -z-10 h-[48%] min-h-72 bg-gradient-to-b via-orange-50/40 to-transparent"
      />

      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:py-12 lg:py-8">
        <section className="mx-auto max-w-2xl text-center">
          <div className="border-pdp-orange/30 bg-pdp-orange/10 text-pdp-orange inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide uppercase">
            <AwardIcon className="size-3.5" aria-hidden />
            PDP · FPT Polytechnic TP.HCM
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">
            Tra cứu chứng nhận <span className="text-pdp-orange">PDP</span>
          </h1>
          <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-base sm:text-lg">
            Nhập mã số sinh viên để xem và tải chứng nhận điện tử.
          </p>
        </section>

        <Card className="border-border/60 mx-auto mt-7 max-w-2xl shadow-sm ring-1 ring-black/5">
          <CardContent className="p-5 sm:p-6">
            <LookupForm />
          </CardContent>
        </Card>

        <section
          id="how"
          className="mx-auto mt-9 grid max-w-4xl gap-4 sm:grid-cols-3 lg:mt-10"
        >
          <FeatureItem
            icon={<ShieldCheckIcon className="size-5" />}
            title="Xác thực chính thức"
            description="Chứng nhận do PDP — FPT Polytechnic TP.HCM cấp và quản lý."
          />
          <FeatureItem
            icon={<QrCodeIcon className="size-5" />}
            title="Quét mã QR để xác minh"
            description="Mỗi chứng nhận có mã QR liên kết tới trang xác minh duy nhất."
          />
          <FeatureItem
            icon={<DownloadIcon className="size-5" />}
            title="Tải về dạng PNG"
            description="Sinh viên có thể tải file chứng nhận chất lượng cao về máy."
          />
        </section>
      </div>
    </div>
  );
}

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="border-border/60 hover:border-pdp-orange/40 hover:shadow-pdp-orange/5 group relative rounded-xl border bg-white/70 p-5 transition-colors hover:shadow-md">
      <div className="bg-pdp-orange/10 text-pdp-orange inline-flex size-10 items-center justify-center rounded-lg">
        {icon}
      </div>
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="text-muted-foreground mt-1 text-sm">{description}</p>
      <ArrowRightIcon
        className="text-muted-foreground/40 group-hover:text-pdp-orange absolute top-5 right-5 size-4 transition-colors"
        aria-hidden
      />
    </div>
  );
}
