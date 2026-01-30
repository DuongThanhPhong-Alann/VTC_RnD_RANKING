"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LoadingOverlay } from "@/components/LoadingOverlay";

type Props = {
  week: string;
  weeks: Array<{ value: string; label: string }>;
};

export function WeeklyHighlightsFilters({ week, weeks }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function update(nextWeek: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "weekly");
    params.set("week", nextWeek);
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className="relative">
      <LoadingOverlay active={isPending} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">Tuần</span>
          <select
            className="control control-date min-w-64"
            value={week}
            disabled={isPending}
            onChange={(e) => update(e.target.value)}
          >
            {weeks.map((w) => (
              <option key={w.value} value={w.value}>
                {w.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
