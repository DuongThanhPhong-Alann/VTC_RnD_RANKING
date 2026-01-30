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
};

export function LeaderboardFilters({
  platforms,
  leaderboardsByPlatform,
  platform,
  leaderboard,
  snapshotBucket,
  snapshots,
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
    snapshotBucket?: string;
  }) {
    const nextPlatform = next.platform ?? platform;
    const nextLeaderboards = leaderboardsByPlatform[nextPlatform] ?? [];
    const nextLeaderboard =
      next.leaderboard ??
      (nextPlatform === platform ? leaderboard : nextLeaderboards[0]) ??
      "";

    const params = new URLSearchParams(searchParams.toString());
    params.set("platform", nextPlatform);
    params.set("leaderboard", nextLeaderboard);

    const platformOrLeaderboardChanged =
      (next.platform && next.platform !== platform) ||
      (next.leaderboard && next.leaderboard !== leaderboard);
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
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
        <span className="text-zinc-600 dark:text-zinc-400">thời gian</span>
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
    </div>
  );
}
