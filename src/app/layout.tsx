import type { Metadata } from "next";
import "./globals.css";
import { RouteLoadingOverlay } from "@/components/RouteLoadingOverlay";
import { LayoutShell } from "@/components/LayoutShell";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Game Ranking",
  description: "Xem hạng game theo tuần/tháng từ MongoDB",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        className="antialiased"
      >
        <Suspense fallback={null}>
          <RouteLoadingOverlay />
        </Suspense>
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
