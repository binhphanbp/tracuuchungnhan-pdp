import Link from "next/link";
import { GraduationCapIcon, LockIcon } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export const metadata = { title: "Đăng nhập quản trị" };

type SearchParams = Promise<{ redirect?: string }>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { redirect } = await searchParams;

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center px-4 py-10">
      {/* Soft brand gradient that subtly distinguishes the login from public pages */}
      <div
        aria-hidden
        className="from-pdp-orange/10 absolute inset-x-0 top-0 -z-10 h-[60%] bg-gradient-to-b via-orange-50/30 to-transparent"
      />

      <div className="w-full max-w-md">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground mx-auto mb-6 flex w-fit items-center gap-2 text-sm"
        >
          <span className="bg-pdp-orange/10 text-pdp-orange inline-flex size-8 items-center justify-center rounded-md">
            <GraduationCapIcon className="size-4" aria-hidden />
          </span>
          PDP · FPT Polytechnic TP.HCM
        </Link>

        <Card className="border-border/60 shadow-sm ring-1 ring-black/5">
          <CardHeader className="space-y-1.5">
            <div className="text-pdp-orange flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
              <LockIcon className="size-3.5" aria-hidden />
              Quản trị · PDP
            </div>
            <h1 className="text-xl font-semibold tracking-tight">
              Đăng nhập quản trị viên
            </h1>
            <p className="text-muted-foreground text-sm">
              Khu vực dành riêng cho cán bộ Phòng Phát triển Cá nhân — FPT
              Polytechnic TP.HCM.
            </p>
          </CardHeader>
          <CardContent>
            <LoginForm redirectTo={redirect} />
            <p className="text-muted-foreground mt-6 text-center text-xs">
              Bạn là sinh viên?{" "}
              <Link
                href="/"
                className="hover:text-foreground hover:text-pdp-orange underline"
              >
                Tra cứu chứng nhận tại đây
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
