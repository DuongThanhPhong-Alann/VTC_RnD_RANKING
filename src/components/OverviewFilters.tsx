"use client";

import { useMemo, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LoadingOverlay } from "@/components/LoadingOverlay";

type Props = {
  platforms: string[];
  leaderboardsByPlatform: Record<string, string[]>;
  platform: string;
  leaderboard: string;
  snapshotBucket: string;
  snapshots: Array<{ bucket: string; label: string }>;
  range: "week" | "month";
  top: number;
};

export function OverviewFilters({
  platforms,
  leaderboardsByPlatform,
  platform,
  leaderboard,
  snapshotBucket,
  snapshots,
  range,
  top,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const leaderboards = useMemo(() => {
    return leaderboardsByPlatform[platform] ?? [];
  }, [leaderboardsByPlatform, platform]);

  function update(next: Partial<Props>) {
    const nextPlatform = next.platform ?? platform;
    const nextLeaderboards = leaderboardsByPlatform[nextPlatform] ?? [];
    const nextLeaderboard =
      next.leaderboard ??
      (nextPlatform === platform ? leaderboard : nextLeaderboards[0]) ??
      "";

    const platformOrLeaderboardChanged =
      (next.platform && next.platform !== platform) ||
      (next.leaderboard && next.leaderboard !== leaderboard);

    const params = new URLSearchParams(searchParams.toString());
    params.set("platform", nextPlatform);
    params.set("leaderboard", nextLeaderboard);
    params.set("range", next.range ?? range);
    params.set("top", String(next.top ?? top));

    if (next.snapshotBucket) {
      params.set("snapshot", next.snapshotBucket);
    } else if (platformOrLeaderboardChanged) {
      params.delete("snapshot");
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className="relative">
      <LoadingOverlay active={isPending} />
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">TRANG</span>
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
          <span className="text-zinc-600 dark:text-zinc-400">BẢNG XẾP HẠNG</span>
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
          <span className="text-zinc-600 dark:text-zinc-400">THỜI GIAN</span>
          <select
            className="control control-date min-w-56"
            value={snapshotBucket}
            disabled={isPending}
            onChange={(e) => update({ snapshotBucket: e.target.value })}
          >
            {snapshots.map((s) => (
              <option key={s.bucket} value={s.bucket}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
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

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">Top</span>
          <select
            className="control w-24"
            value={String(top)}
            disabled={isPending}
            onChange={(e) => update({ top: Number(e.target.value) })}
          >
            {[10, 20, 50].map((n) => (
              <option key={n} value={String(n)}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
    </div>
  );
}
