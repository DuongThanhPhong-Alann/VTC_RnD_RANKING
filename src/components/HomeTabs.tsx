"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LoadingOverlay } from "@/components/LoadingOverlay";

type TabType = "weekly" | "follow" | "new";

type Props = {
  tab: TabType;
};

export function HomeTabs({ tab }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function setTab(nextTab: TabType) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", nextTab);

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  const tabs: Array<{ id: TabType; label: string; subtitle: string }> = [
    { id: "weekly", label: "BXH TUẦN", subtitle: "Top 10" },
    { id: "follow", label: "THEO DÕI", subtitle: "BXH" },
    { id: "new", label: "GAME MỚI", subtitle: "Ra mắt" },
  ];

  return (
    <>
      <LoadingOverlay active={isPending} />

      <div className="relative w-full px-2 py-4">
        <div className="inline-flex rounded-2xl border border-blue-200/60 bg-white/60 p-2 shadow-lg shadow-blue-500/10 backdrop-blur-xl dark:border-blue-900/40 dark:bg-slate-950/35">
          <div className="flex flex-wrap gap-2">
            {tabs.map((item) => {
              const isActive = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={isPending}
                  aria-pressed={isActive}
                  onClick={() => setTab(item.id)}
                  className={[
                    "group relative min-w-[9rem] overflow-hidden rounded-full px-4 py-2.5 text-left transition-all duration-200",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/50",
                    isActive
                      ? "bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 text-white shadow-lg shadow-blue-500/30 ring-1 ring-blue-400/40"
                      : "bg-white/40 text-zinc-800 hover:bg-blue-50/60 hover:text-blue-950 dark:bg-slate-900/30 dark:text-zinc-100 dark:hover:bg-blue-950/35",
                    isPending ? "cursor-wait opacity-80" : "cursor-pointer",
                  ].join(" ")}
                >
                  {isActive ? (
                    <div className="pointer-events-none absolute inset-0 opacity-70">
                      <div className="absolute -left-10 top-1/2 h-24 w-24 -translate-y-1/2 rounded-full bg-white/20 blur-2xl" />
                      <div className="absolute -right-10 top-1/2 h-24 w-24 -translate-y-1/2 rounded-full bg-white/10 blur-2xl" />
                      <div className="absolute inset-x-0 bottom-0 h-1 bg-white/30" />
                    </div>
                  ) : null}

                  <div className="relative flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className={[
                        "h-2.5 w-2.5 rounded-full transition-all duration-200",
                        isActive
                          ? "bg-white shadow-sm shadow-white/40"
                          : "bg-blue-300/60 dark:bg-blue-700/60",
                      ].join(" ")}
                    />

                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{item.label}</div>
                      <div
                        className={[
                          "truncate text-[11px]",
                          isActive ? "text-white/80" : "text-zinc-500 dark:text-zinc-400",
                        ].join(" ")}
                      >
                        {item.subtitle}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
