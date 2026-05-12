import Link from "next/link";
import { GraduationCapIcon } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="border-border/60 sticky top-0 z-30 border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <span className="bg-pdp-orange/10 text-pdp-orange inline-flex size-8 items-center justify-center rounded-md">
            <GraduationCapIcon className="size-4" />
          </span>
          <span className="hidden sm:block">PDP · FPT Polytechnic TP.HCM</span>
          <span className="sm:hidden">PDP</span>
        </Link>
        <nav className="text-muted-foreground flex items-center gap-4 text-sm">
          <Link href="/" className="hover:text-foreground">
            Tra cứu
          </Link>
          <Link href="/login" className="text-foreground hover:underline">
            Đăng nhập
          </Link>
        </nav>
      </div>
    </header>
  );
}
