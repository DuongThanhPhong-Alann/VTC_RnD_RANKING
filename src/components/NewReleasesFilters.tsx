"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LoadingOverlay } from "@/components/LoadingOverlay";

type Props = {
  range: "week" | "month";
  period: string;
  periods: Array<{ value: string; label: string }>;
};

export function NewReleasesFilters({ range, period, periods }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function update(next: Partial<Props>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "new");
    params.set("range", next.range ?? range);
    if (next.period) {
      params.set("period", next.period);
    } else if (next.range && next.range !== range) {
      params.delete("period");
    } else if (period) {
      params.set("period", period);
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className="relative">
      <LoadingOverlay active={isPending} />
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">
            {range === "month" ? "Tháng" : "Tuần"}
          </span>
          <select
            className="control control-date min-w-64"
            value={period}
            disabled={isPending}
            onChange={(e) => update({ period: e.target.value })}
          >
            {periods.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className={`btn ${range === "week" ? "btn-primary" : "btn-ghost"}`}
            disabled={isPending}
            onClick={() => update({ range: "week" })}
          >
            Tuần
          </button>
          <button
            type="button"
            className={`btn ${range === "month" ? "btn-primary" : "btn-ghost"}`}
            disabled={isPending}
            onClick={() => update({ range: "month" })}
          >
            Tháng
          </button>
        </div>
      </div>
    </div>
  );
}
