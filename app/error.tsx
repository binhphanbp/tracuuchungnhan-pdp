"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangleIcon, RotateCwIcon, ArrowLeftIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Branded error boundary. Catches uncaught render errors in the app
 * route segment. Server-only errors are handled by Next.js's default
 * error page; this is shown for client errors and recoverable issues.
 *
 * Always renders inside the app's root layout, so nav/header may be
 * present depending on which segment threw.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In production this would go to Sentry/Datadog. For now just log.
    console.error("App error boundary caught:", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-xl items-center px-4 py-12">
      <Card className="border-border/60 w-full">
        <CardContent className="space-y-4 p-8 text-center">
          <div className="bg-destructive/10 text-destructive mx-auto inline-flex size-14 items-center justify-center rounded-full">
            <AlertTriangleIcon className="size-6" aria-hidden />
          </div>
          <p className="text-muted-foreground text-xs tracking-wide uppercase">
            Lỗi hệ thống
          </p>
          <h1 className="text-3xl font-bold tracking-tight">
            Đã có lỗi xảy ra
          </h1>
          <p className="text-muted-foreground">
            Hệ thống gặp sự cố không mong muốn. Bạn có thể thử lại; nếu lỗi lặp
            lại, vui lòng liên hệ phòng PDP và cung cấp mã lỗi bên dưới.
          </p>
          {error.digest ? (
            <p className="text-muted-foreground text-xs">
              Mã lỗi:{" "}
              <code className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">
                {error.digest}
              </code>
            </p>
          ) : null}
          <div className="flex flex-col items-center gap-2 pt-2 sm:flex-row sm:justify-center">
            <Button
              onClick={reset}
              className="bg-pdp-orange hover:bg-pdp-orange/90 text-white"
            >
              <RotateCwIcon aria-hidden />
              Thử lại
            </Button>
            <Button asChild variant="outline">
              <Link href="/">
                <ArrowLeftIcon aria-hidden />
                Về trang chủ
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
