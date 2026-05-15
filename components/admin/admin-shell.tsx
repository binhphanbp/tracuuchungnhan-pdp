import Link from "next/link";

import { SchoolLogo } from "@/components/brand/school-logo";
import { AdminNav } from "./admin-nav";
import { SignOutButton } from "./sign-out-button";

export function AdminShell({
  email,
  children,
}: {
  email?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-border/60 sticky top-0 z-30 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
          <Link
            href="/admin"
            className="flex min-w-0 items-center gap-3 font-semibold tracking-tight"
          >
            <span className="flex h-10 w-28 shrink-0 items-center sm:w-32">
              <SchoolLogo
                priority
                className="h-auto w-full object-contain"
              />
            </span>
            <span className="border-border truncate border-l pl-3">
              PDP Quản lý chứng nhận
            </span>
          </Link>
          <div className="flex items-center gap-3">
            {email ? (
              <span className="text-muted-foreground hidden text-sm sm:inline">
                {email}
              </span>
            ) : null}
            <SignOutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 px-4">
        <aside className="border-border/60 hidden w-56 shrink-0 border-r py-4 pr-2 sm:block">
          <AdminNav />
        </aside>
        <main className="flex-1 py-4 sm:pl-4">{children}</main>
      </div>
    </div>
  );
}
