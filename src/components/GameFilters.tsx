"use client";

import { useMemo, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LoadingOverlay } from "@/components/LoadingOverlay";

type Props = {
  platforms: string[];
  leaderboardsByPlatform: Record<string, string[]>;
  platform: string;
  leaderboard: string;
  range: "week" | "month";
  period: string;
  periods: Array<{ value: string; label: string }>;
};

export function GameFilters({
  platforms,
  leaderboardsByPlatform,
  platform,
  leaderboard,
  range,
  period,
  periods,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const leaderboards = useMemo(() => {
    return leaderboardsByPlatform[platform] ?? [];
  }, [leaderboardsByPlatform, platform]);

  function update(next: {
    platform?: string;
    leaderboard?: string;
    range?: "week" | "month";
    period?: string;
  }) {
    const params = new URLSearchParams(searchParams.toString());

    const nextPlatform = next.platform ?? platform;
    const nextLeaderboards = leaderboardsByPlatform[nextPlatform] ?? [];
    const nextLeaderboard =
      next.leaderboard ??
      (nextPlatform === platform ? leaderboard : nextLeaderboards[0]) ??
      "";
    const nextRange = next.range ?? range;
    const nextPeriod = next.period ?? period;

    params.set("platform", nextPlatform);
    params.set("leaderboard", nextLeaderboard);
    params.set("range", nextRange);
    if (next.period) {
      params.set("period", next.period);
    } else if (next.range && next.range !== range) {
      params.delete("period");
    } else if (nextPeriod) {
      params.set("period", nextPeriod);
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className="relative">
      <LoadingOverlay active={isPending} />
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">Trang</span>
          <select
            className="control control-platform min-w-44"
            value={platform}
            disabled={isPending}
            onChange={(e) => update({ platform: e.target.value })}
          >
            {platforms.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">Bảng xếp hạng</span>
          <select
            className="control control-leaderboard min-w-64"
            value={leaderboard}
            disabled={isPending}
            onChange={(e) => update({ leaderboard: e.target.value })}
          >
            {leaderboards.map((lb) => (
              <option key={lb} value={lb}>
                {lb}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">
            {range === "month" ? "Tháng" : "Tuần"}
          </span>
          <select
            className="control control-date min-w-56"
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
      </div>

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
