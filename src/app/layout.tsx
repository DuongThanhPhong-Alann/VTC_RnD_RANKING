import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LogoAI } from "@/components/LogoAI";
import { RouteLoadingOverlay } from "@/components/RouteLoadingOverlay";
import { Suspense } from "react";
import { BarChart3, Gamepad2, Home, Search } from "lucide-react";
import { AuthStatus } from "@/components/AuthStatus";

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
        
        {/* Background image */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-[url('/background.png')] bg-cover bg-center bg-no-repeat" />
        </div>

        <div className="relative flex min-h-screen flex-col">
          <header className="sticky top-0 z-50 overflow-visible border-b border-white/20 bg-white/60 shadow-xl shadow-blue-500/5 backdrop-blur-2xl backdrop-saturate-150 dark:border-gray-800/50 dark:bg-gray-950/60 dark:shadow-blue-500/10">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-6">
              {/* Logo */}
              <Link href="/" className="group flex shrink-0 items-center">
                <Image
                  src="/logowweb.png"
                  alt="Game Ranking"
                  width={240}
                  height={135}
                  priority
                  unoptimized
                  className="h-24 w-auto select-none object-contain sm:h-28"
                />
              </Link>

              <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row sm:items-center">
                
                {/* Modern search bar */}
                <form
                  action="/search"
                  method="get"
                  className="group relative flex w-full items-center sm:w-80 md:w-96"
                >
                  <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-blue-800 to-blue-600 opacity-0 blur transition duration-300 group-hover:opacity-30" />
                  <Search
                    aria-hidden="true"
                    className="absolute left-4 h-4 w-4 text-gray-400 transition-colors group-focus-within:text-blue-600 dark:text-gray-500 dark:group-focus-within:text-blue-400"
                  />
                  <input
                    name="q"
                    className="relative h-11 w-full rounded-xl border border-gray-200 bg-white/80 py-0 pr-4 pl-11 text-sm backdrop-blur-xl transition-all placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-900/80 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-blue-500"
                    placeholder="Tìm kiếm theo tên game, thể loại, nền tảng..."
                  />
                  <button
                    type="submit"
                    className="absolute right-2 rounded-lg bg-gradient-to-r from-blue-800 to-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-blue-500/50"
                  >
                    Tìm
                  </button>
                </form>

                {/* Modern navigation */}
                <nav className="flex flex-wrap items-center gap-2">
                  <Link
                    className="group relative overflow-hidden rounded-lg px-4 py-2 text-sm font-medium transition-all hover:scale-105"
                    href="/"
                  >
                    <span className="relative z-10 text-gray-700 transition-colors group-hover:text-white dark:text-gray-300">
                      <span className="inline-flex items-center gap-2">
                        <Home aria-hidden="true" className="h-4 w-4" />
                        TRANG CHỦ
                      </span>
                    </span>
                    <div className="absolute inset-0 -z-0 bg-gradient-to-r from-blue-800 to-blue-600 opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                  
                  <Link
                    className="group relative overflow-hidden rounded-lg px-4 py-2 text-sm font-medium transition-all hover:scale-105"
                    href="/overview"
                  >
                    <span className="relative z-10 text-gray-700 transition-colors group-hover:text-white dark:text-gray-300">
                      <span className="inline-flex items-center gap-2">
                        <BarChart3 aria-hidden="true" className="h-4 w-4" />
                        TỔNG QUAN
                      </span>
                    </span>
                    <div className="absolute inset-0 -z-0 bg-gradient-to-r from-blue-800 to-blue-600 opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                  
                  <Link
                    className="group relative overflow-hidden rounded-lg px-4 py-2 text-sm font-medium transition-all hover:scale-105"
                    href="/search"
                  >
                    <div className="absolute inset-0 -z-0 bg-gradient-to-r from-blue-800 to-blue-600 opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                </nav>

                <div className="flex items-center justify-start sm:justify-end">
                  <AuthStatus />
                </div>
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-8 pb-10">
            <div className="rounded-2xl bg-white/40 p-6 shadow-xl backdrop-blur-xl dark:bg-gray-900/40">
              {children}
            </div>
          </main>

          {/* Decorative footer */}
          <footer className="mt-auto border-t border-white/20 bg-white/80 backdrop-blur-xl dark:border-gray-800/50 dark:bg-gray-900/70">
            <div className="mx-auto max-w-7xl px-4 py-6 text-center">
              <p className="inline-flex items-center justify-center gap-2 text-sm font-semibold tracking-wide">
                <span className="bg-gradient-to-r from-blue-700 via-cyan-600 to-sky-600 bg-clip-text text-transparent drop-shadow">
                  © Developed by Team
                </span>
                <LogoAI size={24} />
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
