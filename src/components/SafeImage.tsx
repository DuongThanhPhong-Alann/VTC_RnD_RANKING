"use client";

import { useMemo, useState } from "react";

type Props = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
};

function normalizeImageSrc(value: string): string | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  if (raw.startsWith("//")) return `https:${raw}`;
  if (raw.startsWith("/")) return raw;
  try {
    const url = new URL(raw);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return raw;
    }
    return null;
  } catch {
    return null;
  }
}

export function SafeImage({ src, alt, width, height, className }: Props) {
  const [failed, setFailed] = useState(false);
  const normalizedSrc = useMemo(() => normalizeImageSrc(src), [src]);

  if (!normalizedSrc || failed) return null;

  // Intentionally use <img> to avoid runtime crashes from unconfigured hosts or bad URLs.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={normalizedSrc}
      alt={alt}
      width={width}
      height={height}
      loading="lazy"
      referrerPolicy="origin-when-cross-origin"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
