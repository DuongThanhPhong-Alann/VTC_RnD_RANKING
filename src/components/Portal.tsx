"use client";

import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";

export function Portal({ children }: { children: React.ReactNode }) {
  const container = useMemo(() => {
    if (typeof window === "undefined") return null;
    const el = document.createElement("div");
    el.dataset.portal = "true";
    return el;
  }, []);

  useEffect(() => {
    if (!container) return;
    document.body.appendChild(container);
    return () => container.remove();
  }, [container]);

  if (!container) return null;
  return createPortal(children, container);
}

