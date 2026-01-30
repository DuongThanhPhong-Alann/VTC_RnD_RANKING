"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function RouteChangeToast() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const showTimerRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (showTimerRef.current) window.clearTimeout(showTimerRef.current);
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);

    showTimerRef.current = window.setTimeout(() => setVisible(true), 0);
    hideTimerRef.current = window.setTimeout(() => setVisible(false), 900);
    return () => {
      if (showTimerRef.current) window.clearTimeout(showTimerRef.current);
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    };
  }, [pathname, searchParams]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-2 z-50 flex justify-center px-4">
      <div className="card flex items-center gap-2 px-4 py-2">
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600 dark:border-sky-500/25 dark:border-t-sky-400"
        />
        <div className="text-xs text-zinc-700 dark:text-zinc-300">
          Đang tải dữ liệu…
        </div>
      </div>
    </div>
  );
}
