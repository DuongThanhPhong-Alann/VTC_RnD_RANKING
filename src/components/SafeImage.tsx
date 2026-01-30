"use client";

import { useMemo, useState } from "react";

type Props = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
};

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function SafeImage({ src, alt, width, height, className }: Props) {
  const [failed, setFailed] = useState(false);
  const ok = useMemo(() => isHttpUrl(src), [src]);

  if (!ok || failed) return null;

  // Intentionally use <img> to avoid runtime crashes from unconfigured hosts or bad URLs.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
