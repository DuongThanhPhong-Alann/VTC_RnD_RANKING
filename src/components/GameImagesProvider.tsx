"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { SafeImage } from "@/components/SafeImage";

export type GamePair = { platform: string; game_url: string };

type ImagesMap = Record<string, string | null>;

const Ctx = createContext<ImagesMap | null>(null);

function pairKey(pair: GamePair): string {
  return `${pair.platform}||${pair.game_url}`;
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
      try {
        const res = await fetch("/api/game-images", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body,
        });
        if (!res.ok) return;
        const data = (await res.json()) as { images?: ImagesMap };
        if (cancelled) return;
        setImagesState({ body, images: data.images ?? {} });
      } catch {
        // Ignore: fall back to placeholders.
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
  return images[`${platform}||${gameUrl}`] ?? null;
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

  return (
    placeholder ?? (
      <div
        className={[
          "flex items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-[10px] font-semibold text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-400",
          className ?? "",
        ].join(" ")}
        style={{ width, height }}
      >
        N/A
      </div>
    )
  );
}
