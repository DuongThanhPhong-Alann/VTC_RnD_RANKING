"use client";

import { useMemo, useState } from "react";

type Props = {
  className?: string;
  size?: number;
};

export function LogoAI({ className, size = 24 }: Props) {
  const sources = useMemo(() => ["/logoAI.svg", "/logoAI.png"], []);
  const [index, setIndex] = useState(0);
  const src = sources[Math.min(index, sources.length - 1)];

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="AI"
      width={size}
      height={size}
      className={className}
      loading="lazy"
      onError={() => setIndex((i) => i + 1)}
    />
  );
}
