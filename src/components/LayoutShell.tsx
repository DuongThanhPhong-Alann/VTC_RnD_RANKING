"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Home, Search, Sparkles } from "lucide-react";
import { AuthStatus } from "@/components/AuthStatus";
import { LogoAI } from "@/components/LogoAI";

const AUTH_ROUTES = ["/login", "/account"];
const UI_THEME_STORAGE_KEY = "vtc-ui-theme";
const TET_BG_IMAGES = [
  "/1.jpg",
  "/2.jpg",
  "/3.jpg",
  "/4.jpg",
  "/5.jpg",
  "/6.jpg",
  "/7.jpg",
  "/8.jpg",
  "/9.jpg",
  "/10.jpg",
] as const;
const TET_BG_SWITCH_MS = 10_000;
const TET_BG_CELLS = 4;
const TET_BG_FADE_MS = 900;

type UiTheme = "default" | "tet";
type TetFallKind = "dao" | "mai" | "lixi";

type TetFallItem = {
  id: string;
  kind: TetFallKind;
  left: number;
  size: number;
  height: number;
  fallDuration: number;
  swayDuration: number;
  delay: number;
  driftA: number;
  driftB: number;
  spinA: number;
  spinB: number;
  spinC: number;
  opacity: number;
};

type TetFallStyle = CSSProperties & {
  "--tet-left": string;
  "--tet-size": string;
  "--tet-height": string;
  "--tet-fall-duration": string;
  "--tet-sway-duration": string;
  "--tet-delay": string;
  "--tet-drift-a": string;
  "--tet-drift-b": string;
  "--tet-spin-a": string;
  "--tet-spin-b": string;
  "--tet-spin-c": string;
  "--tet-opacity": string;
};

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function buildTetFallItems(count: number): TetFallItem[] {
  const items: TetFallItem[] = [];
  const sizeScale = 2 / 3;

  for (let i = 0; i < count; i++) {
    const seedBase = i + 1;
    const kind: TetFallKind = i % 3 === 0 ? "dao" : i % 3 === 1 ? "mai" : "lixi";
    const left = 2 + Math.round(seededRandom(seedBase * 2.11) * 96);
    const baseSize = kind === "mai" ? 28 : kind === "dao" ? 25 : 22;
    const extraSize = kind === "mai" ? 18 : kind === "dao" ? 14 : 11;
    const rawSize = baseSize + Math.round(seededRandom(seedBase * 3.17) * extraSize);
    const size = Math.max(12, Math.round(rawSize * sizeScale));
    const height = kind === "lixi" ? Math.round(size * 1.24) : size;
    const fallDuration = 9 + seededRandom(seedBase * 4.19) * 9;
    const swayDuration = 3.2 + seededRandom(seedBase * 5.23) * 3.8;
    const delay = -1 * Math.round(seededRandom(seedBase * 6.41) * 30);
    const driftA = Math.round((seededRandom(seedBase * 7.07) * 2 - 1) * 58);
    const driftB = Math.round((seededRandom(seedBase * 8.09) * 2 - 1) * 85);
    const spinA = Math.round((seededRandom(seedBase * 9.11) * 2 - 1) * 24);
    const spinB = Math.round((seededRandom(seedBase * 10.13) * 2 - 1) * 48);
    const spinC = Math.round((seededRandom(seedBase * 11.17) * 2 - 1) * 78);
    const opacity = 0.78 + seededRandom(seedBase * 12.19) * 0.14;

    items.push({
      id: `${kind}-${i + 1}`,
      kind,
      left,
      size,
      height,
      fallDuration,
      swayDuration,
      delay,
      driftA,
      driftB,
      spinA,
      spinB,
      spinC,
      opacity,
    });
  }

  return items;
}

const TET_FALL_ITEMS = buildTetFallItems(12);
const TET_BG_POSITIONS = [
  "bg-left-top",
  "bg-right-top",
  "bg-left-bottom",
  "bg-right-bottom",
] as const;

function isAuthRoute(pathname: string | null) {
  if (!pathname) return false;
  return AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function normalizeTheme(value: string | null): UiTheme {
  return value === "tet" ? "tet" : "default";
}

function pickRandomTetImages(
  count: number,
  avoidImages: readonly string[] = [],
): string[] {
  const pool = TET_BG_IMAGES.filter((img) => !avoidImages.includes(img));
  const workingPool = [...(pool.length >= count ? pool : TET_BG_IMAGES)];
  const picked: string[] = [];

  while (picked.length < count) {
    if (workingPool.length === 0) {
      workingPool.push(...TET_BG_IMAGES);
    }
    const index = Math.floor(Math.random() * workingPool.length);
    const selected = workingPool.splice(index, 1)[0];
    if (!selected) continue;
    if (picked.includes(selected) && workingPool.length > 0) continue;
    picked.push(selected);
  }

  return picked;
}

function TetFallingOverlay() {
  return (
    <div className="tet-fall-overlay pointer-events-none fixed inset-0 z-[80] overflow-hidden">
      {TET_FALL_ITEMS.map((item) => {
        const style: TetFallStyle = {
          "--tet-left": `${item.left}%`,
          "--tet-size": `${item.size}px`,
          "--tet-height": `${item.height}px`,
          "--tet-fall-duration": `${item.fallDuration.toFixed(2)}s`,
          "--tet-sway-duration": `${item.swayDuration.toFixed(2)}s`,
          "--tet-delay": `${item.delay}s`,
          "--tet-drift-a": `${item.driftA}px`,
          "--tet-drift-b": `${item.driftB}px`,
          "--tet-spin-a": `${item.spinA}deg`,
          "--tet-spin-b": `${item.spinB}deg`,
          "--tet-spin-c": `${item.spinC}deg`,
          "--tet-opacity": `${item.opacity.toFixed(2)}`,
        };

        return (
          <span key={item.id} className="tet-fall-track" style={style}>
            {item.kind === "lixi" ? (
              <span className="tet-fall tet-fall--lixi" />
            ) : (
              <img
                src={item.kind === "dao" ? "/kaidao1.png" : "/kaimai1.png"}
                alt=""
                className={`tet-fall tet-fall--${item.kind}`}
                draggable={false}
              />
            )}
          </span>
        );
      })}
    </div>
  );
}

function TetBackground({
  activeImages,
  fadingImages,
  fadeToken,
}: {
  activeImages: readonly string[];
  fadingImages: readonly string[] | null;
  fadeToken: number;
}) {
  const renderLayer = (images: readonly string[], extraClass = "", keyPrefix = "active") => (
    <div className={`absolute inset-0 grid grid-cols-2 grid-rows-2 ${extraClass}`}>
      {images.map((imageSrc, index) => (
        <div
          key={`${keyPrefix}-${imageSrc}-${index}`}
          className={`bg-cover bg-no-repeat ${TET_BG_POSITIONS[index] ?? "bg-center"}`}
          style={{ backgroundImage: `url('${imageSrc}')` }}
        />
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {renderLayer(activeImages)}
      {fadingImages
        ? renderLayer(fadingImages, "tet-collage-fadeout", `fading-${fadeToken}`)
        : null}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-50/18 via-rose-100/8 to-orange-100/16" />
      <div className="tet-sparkle-grid absolute inset-0 opacity-30" />
      <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-between px-6 sm:px-16">
        <span className="tet-lantern" />
        <span className="tet-lantern tet-lantern--delay" />
      </div>
    </div>
  );
}

export function LayoutShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const authPage = isAuthRoute(pathname);
  const [uiTheme, setUiTheme] = useState<UiTheme>("default");
  const [isThemeReady, setIsThemeReady] = useState(false);
  const [tetBgImages, setTetBgImages] = useState<string[]>(() =>
    pickRandomTetImages(TET_BG_CELLS),
  );
  const [tetBgFadingImages, setTetBgFadingImages] = useState<string[] | null>(null);
  const [tetBgFadeToken, setTetBgFadeToken] = useState(0);
  const isTetTheme = uiTheme === "tet";

  useEffect(() => {
    if (typeof window === "undefined") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUiTheme(normalizeTheme(window.localStorage.getItem(UI_THEME_STORAGE_KEY)));
    setIsThemeReady(true);
  }, []);

  useEffect(() => {
    if (!isThemeReady || typeof window === "undefined") return;
    window.localStorage.setItem(UI_THEME_STORAGE_KEY, uiTheme);
  }, [isThemeReady, uiTheme]);

  useEffect(() => {
    if (!isTetTheme) return;

    const intervalId = window.setInterval(() => {
      setTetBgImages((prev) => {
        const next = pickRandomTetImages(TET_BG_CELLS, prev);
        setTetBgFadingImages(prev);
        setTetBgFadeToken((token) => token + 1);
        return next;
      });
    }, TET_BG_SWITCH_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isTetTheme]);

  useEffect(() => {
    if (!tetBgFadingImages) return;
    const timerId = window.setTimeout(() => {
      setTetBgFadingImages(null);
    }, TET_BG_FADE_MS + 80);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [tetBgFadingImages]);

  const toggleTheme = () => {
    setUiTheme((prev) => (prev === "tet" ? "default" : "tet"));
  };

  const themeButtonLabel = isTetTheme ? "Giao diện mặc định" : "Giao diện Tết";
  const themeButtonClass = isTetTheme
    ? "inline-flex h-10 items-center gap-2 rounded-xl border border-rose-200/90 bg-gradient-to-r from-rose-200 via-amber-100 to-orange-200 px-4 text-sm font-semibold text-rose-700 shadow-md shadow-rose-200/50 transition-all hover:-translate-y-0.5 hover:shadow-rose-300/60"
    : "inline-flex h-10 items-center gap-2 rounded-xl border border-blue-200 bg-white/90 px-4 text-sm font-semibold text-blue-700 shadow-sm transition-all hover:bg-blue-50";

  if (authPage) {
    return (
      <div className={isTetTheme ? "theme-tet" : "theme-default"}>
        {isTetTheme ? (
          <TetBackground
            activeImages={tetBgImages}
            fadingImages={tetBgFadingImages}
            fadeToken={tetBgFadeToken}
          />
        ) : (
          <div className="fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-[#050b1a] via-[#0b1f3a] to-[#04070f]" />
        )}
        {isTetTheme ? <TetFallingOverlay /> : null}

        <div className="fixed top-4 right-4 z-50">
          <button type="button" onClick={toggleTheme} className={themeButtonClass}>
            <Sparkles aria-hidden="true" className="h-4 w-4" />
            {themeButtonLabel}
          </button>
        </div>

        <div className={isTetTheme ? "min-h-screen text-zinc-800" : "min-h-screen text-zinc-900"}>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className={isTetTheme ? "theme-tet" : "theme-default"}>
      {isTetTheme ? (
        <TetBackground
          activeImages={tetBgImages}
          fadingImages={tetBgFadingImages}
          fadeToken={tetBgFadeToken}
        />
      ) : (
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-[url('/background.png')] bg-cover bg-center bg-no-repeat" />
        </div>
      )}
      {isTetTheme ? <TetFallingOverlay /> : null}

      <div className="relative flex min-h-screen flex-col">
        <header
          className={
            isTetTheme
              ? "sticky top-0 z-50 overflow-visible border-b border-rose-200/70 bg-white/72 shadow-xl shadow-rose-200/35 backdrop-blur-xl backdrop-saturate-150"
              : "sticky top-0 z-50 overflow-visible border-b border-white/20 bg-white/60 shadow-xl shadow-blue-500/5 backdrop-blur-2xl backdrop-saturate-150 dark:border-gray-800/50 dark:bg-gray-950/60 dark:shadow-blue-500/10"
          }
        >
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-6">
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
              <form
                action="/search"
                method="get"
                className="group relative flex w-full items-center sm:w-80 md:w-96"
              >
                <div
                  className={
                    isTetTheme
                      ? "absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-rose-300 to-amber-300 opacity-0 blur transition duration-300 group-hover:opacity-40"
                      : "absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-blue-800 to-blue-600 opacity-0 blur transition duration-300 group-hover:opacity-30"
                  }
                />
                <Search
                  aria-hidden="true"
                  className={
                    isTetTheme
                      ? "absolute left-4 h-4 w-4 text-rose-400/90 transition-colors group-focus-within:text-rose-500"
                      : "absolute left-4 h-4 w-4 text-gray-400 transition-colors group-focus-within:text-blue-600 dark:text-gray-500 dark:group-focus-within:text-blue-400"
                  }
                />
                <input
                  name="q"
                  className={
                    isTetTheme
                      ? "relative h-11 w-full rounded-xl border border-rose-200/70 bg-white/80 py-0 pr-4 pl-11 text-sm text-rose-900 backdrop-blur-xl transition-all placeholder:text-rose-400/80 focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-200/60"
                      : "relative h-11 w-full rounded-xl border border-gray-200 bg-white/80 py-0 pr-4 pl-11 text-sm backdrop-blur-xl transition-all placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-900/80 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-blue-500"
                  }
                  placeholder="Tìm kiếm theo tên game, thể loại, nền tảng..."
                />
                <button
                  type="submit"
                  className={
                    isTetTheme
                      ? "absolute right-2 rounded-lg bg-gradient-to-r from-rose-300 via-rose-200 to-amber-200 px-4 py-2 text-xs font-semibold text-rose-700 shadow-md transition-all hover:scale-105 hover:shadow-rose-200/70"
                      : "absolute right-2 rounded-lg bg-gradient-to-r from-blue-800 to-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-blue-500/50"
                  }
                >
                  Tìm
                </button>
              </form>

              <nav className="flex flex-wrap items-center gap-2">
                <Link
                  className="group relative overflow-hidden rounded-lg px-4 py-2 text-sm font-medium transition-all hover:scale-105"
                  href="/"
                >
                  <span
                    className={
                      isTetTheme
                        ? "relative z-10 text-rose-700/90 transition-colors group-hover:text-rose-800"
                        : "relative z-10 text-gray-700 transition-colors group-hover:text-white dark:text-gray-300"
                    }
                  >
                    <span className="inline-flex items-center gap-2">
                      <Home aria-hidden="true" className="h-4 w-4" />
                      TRANG CHỦ
                    </span>
                  </span>
                  <div
                    className={
                      isTetTheme
                        ? "absolute inset-0 -z-0 bg-gradient-to-r from-rose-200 to-amber-200 opacity-0 transition-opacity group-hover:opacity-100"
                        : "absolute inset-0 -z-0 bg-gradient-to-r from-blue-800 to-blue-600 opacity-0 transition-opacity group-hover:opacity-100"
                    }
                  />
                </Link>

                <Link
                  className="group relative overflow-hidden rounded-lg px-4 py-2 text-sm font-medium transition-all hover:scale-105"
                  href="/overview"
                >
                  <span
                    className={
                      isTetTheme
                        ? "relative z-10 text-rose-700/90 transition-colors group-hover:text-rose-800"
                        : "relative z-10 text-gray-700 transition-colors group-hover:text-white dark:text-gray-300"
                    }
                  >
                    <span className="inline-flex items-center gap-2">
                      <BarChart3 aria-hidden="true" className="h-4 w-4" />
                      TỔNG QUAN
                    </span>
                  </span>
                  <div
                    className={
                      isTetTheme
                        ? "absolute inset-0 -z-0 bg-gradient-to-r from-rose-200 to-amber-200 opacity-0 transition-opacity group-hover:opacity-100"
                        : "absolute inset-0 -z-0 bg-gradient-to-r from-blue-800 to-blue-600 opacity-0 transition-opacity group-hover:opacity-100"
                    }
                  />
                </Link>

                <Link
                  className="group relative overflow-hidden rounded-lg px-4 py-2 text-sm font-medium transition-all hover:scale-105"
                  href="/search"
                >
                  <div
                    className={
                      isTetTheme
                        ? "absolute inset-0 -z-0 bg-gradient-to-r from-rose-200 to-amber-200 opacity-0 transition-opacity group-hover:opacity-100"
                        : "absolute inset-0 -z-0 bg-gradient-to-r from-blue-800 to-blue-600 opacity-0 transition-opacity group-hover:opacity-100"
                    }
                  />
                </Link>
              </nav>

              <div className="flex flex-wrap items-center justify-start gap-2 sm:justify-end">
                <button type="button" onClick={toggleTheme} className={themeButtonClass}>
                  <Sparkles aria-hidden="true" className="h-4 w-4" />
                  {themeButtonLabel}
                </button>
                <AuthStatus />
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-8 pb-10">
          <div
            className={
              isTetTheme
                ? "rounded-2xl border border-rose-200/75 bg-white/88 p-6 shadow-xl shadow-rose-200/40"
                : "rounded-2xl bg-white/40 p-6 shadow-xl backdrop-blur-xl dark:bg-gray-900/40"
            }
          >
            {children}
          </div>
        </main>

        <footer
          className={
            isTetTheme
              ? "mt-auto border-t border-rose-200/55 bg-white/45"
              : "mt-auto border-t border-white/20 bg-white/80 backdrop-blur-xl dark:border-gray-800/50 dark:bg-gray-900/70"
          }
        >
          <div className="mx-auto max-w-7xl px-4 py-6 text-center">
            <p className="inline-flex items-center justify-center gap-2 text-sm font-semibold tracking-wide">
              <span
                className={
                  isTetTheme
                    ? "bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 bg-clip-text text-transparent drop-shadow"
                    : "bg-gradient-to-r from-blue-700 via-cyan-600 to-sky-600 bg-clip-text text-transparent drop-shadow"
                }
              >
                © Developed by Team
              </span>
              <LogoAI size={24} />
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
