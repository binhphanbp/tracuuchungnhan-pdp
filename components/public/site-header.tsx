import Link from "next/link";

import { SchoolLogo } from "@/components/brand/school-logo";

export function SiteHeader() {
  return (
    <header className="border-border/60 sticky top-0 z-30 border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-3 font-semibold tracking-tight"
        >
          <span className="flex h-10 w-28 shrink-0 items-center sm:w-32">
            <SchoolLogo
              priority
              className="h-auto w-full object-contain"
            />
          </span>
          <span className="border-border hidden border-l pl-3 sm:block">
            PDP · FPT Polytechnic TP.HCM
          </span>
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
