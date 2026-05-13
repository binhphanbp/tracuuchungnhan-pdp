import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";

import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "Tra cứu chứng nhận PDP — FPT Polytechnic TP.HCM",
    template: "%s · Tra cứu chứng nhận PDP",
  },
  description:
    "Hệ thống tra cứu và xác thực chứng nhận điện tử của Phòng Phát triển Cá nhân — FPT Polytechnic TP.HCM.",
  other: {
    google: "notranslate",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="vi"
      translate="no"
      className={`${inter.variable} notranslate h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        translate="no"
        className="bg-background text-foreground notranslate flex min-h-full flex-col"
      >
        {children}
        <Toaster richColors position="top-center" />
        <Analytics />
      </body>
    </html>
  );
}
