"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboardIcon,
  FolderKanbanIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

const NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin", label: "Tổng quan", icon: LayoutDashboardIcon },
  { href: "/admin/campaigns", label: "Chiến dịch", icon: FolderKanbanIcon },
  { href: "/admin/certificates", label: "Chứng nhận", icon: UsersIcon },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 p-2 text-sm">
      {NAV_ITEMS.map((item) => {
        // Active when the current path is exactly the link or a child path,
        // but not when /admin matches every child route.
        const isActive =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "hover:bg-muted flex items-center gap-2 rounded-md px-2.5 py-1.5 transition-colors",
              isActive
                ? "bg-pdp-orange/10 text-pdp-orange font-medium"
                : "text-muted-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
