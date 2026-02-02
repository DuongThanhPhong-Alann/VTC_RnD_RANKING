import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { RouteLoadingOverlay } from "@/components/RouteLoadingOverlay";
import { LayoutShell } from "@/components/LayoutShell";
import { Suspense } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});

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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Suspense fallback={null}>
          <RouteLoadingOverlay />
        </Suspense>
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
