"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Image as ImageIcon, LoaderCircle } from "lucide-react";
import { SafeImage } from "@/components/SafeImage";

export type GamePair = { platform: string; game_url: string };

type ImagesMap = Record<string, string | null>;

const Ctx = createContext<ImagesMap | null>(null);

function pairKey(pair: GamePair): string {
  return `${pair.platform}||${pair.game_url}`;
}

function normalizeLookupUrl(raw: string): string | null {
  const input = String(raw ?? "").trim();
  if (!input) return null;
  try {
    const u = new URL(input);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    const pathname = u.pathname.replace(/\/+$/, "");
    const normalizedPath = pathname || "/";
    const host = u.host.toLowerCase().replace(/^www\./, "");
    return `${u.protocol}//${host}${normalizedPath}`;
  } catch {
    return null;
  }
}

export function GameImagesProvider({
  pairs,
  children,
}: {
  pairs: GamePair[];
  children: React.ReactNode;
}) {
  const [imagesState, setImagesState] = useState<{
    body: string;
    images: ImagesMap | null;
  }>({ body: "", images: null });

  const body = useMemo(() => {
    const unique = new Map<string, GamePair>();
    for (const p of pairs) {
      if (!p?.platform || !p?.game_url) continue;
      unique.set(pairKey(p), { platform: String(p.platform), game_url: String(p.game_url) });
    }
    return JSON.stringify({ pairs: Array.from(unique.values()).slice(0, 500) });
  }, [pairs]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const emptyMap = (() => {
        const out: ImagesMap = {};
        try {
          const parsed = JSON.parse(body) as { pairs?: GamePair[] };
          for (const p of parsed.pairs ?? []) {
            out[`${p.platform}||${p.game_url}`] = null;
          }
        } catch {
          // Ignore parse failure and return empty object.
        }
        return out;
      })();

      try {
        const headers: Record<string, string> = {
          "content-type": "application/json",
        };
        const publicKey = process.env.NEXT_PUBLIC_PUBLIC_API_KEY;
        if (publicKey) headers["x-api-key"] = publicKey;

        const res = await fetch("/api/game-images", {
          method: "POST",
          headers,
          body,
        });
        if (!res.ok) {
          if (cancelled) return;
          setImagesState({ body, images: emptyMap });
          return;
        }
        const data = (await res.json()) as { images?: ImagesMap };
        if (cancelled) return;
        setImagesState({ body, images: data.images ?? {} });
      } catch {
        if (cancelled) return;
        setImagesState({ body, images: emptyMap });
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [body]);

  const value = imagesState.body === body ? imagesState.images : null;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGameImage(platform: string, gameUrl: string): string | null | undefined {
  const images = useContext(Ctx);
  if (!images) return undefined; // still loading

  const exact = images[`${platform}||${gameUrl}`];
  if (typeof exact === "string" && exact.trim()) return exact;

  const canonical = normalizeLookupUrl(gameUrl);
  if (!canonical) return exact ?? null;

  // Fallback: find same platform + canonical URL even if query/hash differs.
  const prefix = `${platform}||`;
  for (const [key, value] of Object.entries(images)) {
    if (!key.startsWith(prefix)) continue;
    if (typeof value !== "string" || !value.trim()) continue;
    const candidateUrl = key.slice(prefix.length);
    const candidateCanonical = normalizeLookupUrl(candidateUrl);
    if (candidateCanonical && candidateCanonical === canonical) {
      return value;
    }
  }

  return exact ?? null;
}

export function GameThumb({
  platform,
  gameUrl,
  alt,
  width,
  height,
  className,
  placeholder,
}: {
  platform: string;
  gameUrl: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  placeholder?: React.ReactNode;
}) {
  const src = useGameImage(platform, gameUrl);

  if (typeof src === "string" && src.trim()) {
    return (
      <SafeImage
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
      />
    );
  }

  if (placeholder) return placeholder;

  const isLoading = src === undefined;
  const iconSize = Math.max(12, Math.min(18, Math.floor(Math.min(width, height) / 2.5)));
  const Icon = isLoading ? LoaderCircle : ImageIcon;

  return (
    <div
      className={[
        "flex items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-400",
        className ?? "",
      ].join(" ")}
      style={{ width, height }}
      aria-label={isLoading ? "Loading image" : "No image"}
    >
      <Icon
        size={iconSize}
        className={isLoading ? "animate-spin" : ""}
        aria-hidden="true"
      />
    </div>
  );
}
