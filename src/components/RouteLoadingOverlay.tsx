"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { LoadingView } from "@/components/LoadingView";
import { Portal } from "@/components/Portal";

type Props = {
  delayMs?: number;
  maxDurationMs?: number;
};

export function RouteLoadingOverlay({
  delayMs = 120,
  maxDurationMs = 10000,
}: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const showTimerRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (showTimerRef.current) window.clearTimeout(showTimerRef.current);
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    showTimerRef.current = null;
    hideTimerRef.current = null;
    setVisible(false);
  }, []);

  const start = useCallback(() => {
    if (showTimerRef.current) window.clearTimeout(showTimerRef.current);
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);

    showTimerRef.current = window.setTimeout(() => {
      setVisible(true);
    }, delayMs);

    hideTimerRef.current = window.setTimeout(() => {
      setVisible(false);
    }, maxDurationMs);
  }, [delayMs, maxDurationMs]);

  useEffect(() => {
    const id = window.setTimeout(stop, 0);
    return () => window.clearTimeout(id);
  }, [pathname, searchParams, stop]);

  useEffect(() => {
    function isInternalHref(href: string) {
      if (href.startsWith("#")) return false;
      if (href.startsWith("/")) return true;
      try {
        const url = new URL(href, window.location.href);
        return url.origin === window.location.origin;
      } catch {
        return false;
      }
    }

    function onClick(event: MouseEvent) {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) return;

      const target = event.target as Element | null;
      const anchor = target?.closest?.("a") as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.dataset.noLoader === "true") return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href || !isInternalHref(href)) return;
      start();
    }

    function onSubmit(event: Event) {
      if (event.defaultPrevented) return;
      const form = event.target as HTMLFormElement | null;
      if (!form) return;
      if (form.target && form.target !== "_self") return;
      start();
    }

    function onPopState() {
      start();
    }

    const originalPushState = history.pushState.bind(history);
    const originalReplaceState = history.replaceState.bind(history);

    function shouldStartForUrl(url: string | URL | null | undefined) {
      if (!url) return true;
      try {
        const next = new URL(String(url), window.location.href).href;
        return next !== window.location.href;
      } catch {
        return true;
      }
    }

    history.pushState = ((...args: Parameters<History["pushState"]>) => {
      if (shouldStartForUrl(args[2])) start();
      return originalPushState(...args);
    }) as History["pushState"];

    history.replaceState = ((...args: Parameters<History["replaceState"]>) => {
      if (shouldStartForUrl(args[2])) start();
      return originalReplaceState(...args);
    }) as History["replaceState"];

    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    window.addEventListener("popstate", onPopState);

    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
      window.removeEventListener("popstate", onPopState);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, [start]);

  if (!visible) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[2147483647] bg-white dark:bg-black">
        <LoadingView variant="page" />
      </div>
    </Portal>
  );
}
