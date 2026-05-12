import Link from "next/link";
import { CompassIcon, ArrowLeftIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Không tìm thấy trang" };

/**
 * Branded 404 page. Replaces the Next.js default so the missing-page UX
 * still feels like part of the PDP system.
 */
export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-xl items-center px-4 py-12">
      <Card className="border-border/60 w-full">
        <CardContent className="space-y-4 p-8 text-center">
          <div className="bg-pdp-orange/10 text-pdp-orange mx-auto inline-flex size-14 items-center justify-center rounded-full">
            <CompassIcon className="size-6" aria-hidden />
          </div>
          <p className="text-muted-foreground text-xs tracking-wide uppercase">
            Lỗi 404
          </p>
          <h1 className="text-3xl font-bold tracking-tight">
            Không tìm thấy trang
          </h1>
          <p className="text-muted-foreground">
            Trang bạn truy cập không tồn tại, đã bị xoá hoặc đường dẫn đã thay
            đổi. Hãy quay về trang chủ và thử lại.
          </p>
          <div className="flex flex-col items-center gap-2 pt-2 sm:flex-row sm:justify-center">
            <Button
              asChild
              className="bg-pdp-orange hover:bg-pdp-orange/90 text-white"
            >
              <Link href="/">
                <ArrowLeftIcon aria-hidden />
                Trở về trang tra cứu
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/login">Đăng nhập admin</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
