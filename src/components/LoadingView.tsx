"use client";

import { useMemo } from "react";
import Image from "next/image";

type Props = {
  variant?: "page" | "inline";
  label?: string;
};

export function LoadingView({ variant = "page", label }: Props) {
  const message = useMemo(() => label ?? "Đang tải…", [label]);

  if (variant === "inline") {
    return (
      <div className="flex h-10 w-full items-center justify-center">
        <div className="inline-flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
          <span className="vtc-loading-blink">{message}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-white">
      <div className="absolute inset-0 grid place-items-center">
        <div className="flex flex-col items-center gap-4">
          <Image
            src="/logoload.png"
            alt="Loading"
            width={1024}
            height={1024}
            priority
            className="vtc-loading-blink h-[21rem] w-auto select-none"
          />
          <div
            className="vtc-loading-bar"
            role="progressbar"
            aria-label="Đang tải"
          >
            <div className="vtc-loading-bar__fill" />
          </div>
        </div>
      </div>
      <div className="vtc-loading-blink absolute inset-x-0 bottom-10 px-4 text-center text-3xl font-semibold text-zinc-600 dark:text-zinc-300">
        {message}
      </div>
    </div>
  );
}
