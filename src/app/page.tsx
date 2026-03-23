import Link from "next/link";
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isValid,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from "date-fns";
import { Suspense } from "react";
import { HomeTabs } from "@/components/HomeTabs";
import { LeaderboardFilters } from "@/components/LeaderboardFilters";
import { GameImagesProvider, GameThumb } from "@/components/GameImagesProvider";
import { NewReleasesFilters } from "@/components/NewReleasesFilters";
import { SafeImage } from "@/components/SafeImage";
import { WeeklyHighlightsFilters } from "@/components/WeeklyHighlightsFilters";
import { ExportCsvButton } from "@/components/ExportCsvButton";
import {
  getGameNamesByPlatformUrls,
  getLeaderboardSnapshotByBucket,
  getNewReleases,
  getPlatformsAndLeaderboards,
  getReleaseDateBounds,
  getSnapshotBoundsForPlatforms,
  getSnapshotBuckets,
  getWeeklyHighlights,
} from "@/lib/queries";
import { applySheetSubstitutions, getSheetCache } from "@/lib/sheet-cache";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function pickString(value: SearchParams[string]): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function pickTab(value: SearchParams[string]): "weekly" | "follow" | "new" {
  if (value === "weekly") return "weekly";
  if (value === "new") return "new";
  return "follow";
}

function pickRange(value: SearchParams[string]): "week" | "month" {
  return value === "month" ? "month" : "week";
}

function formatYmd(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function formatYm(date: Date): string {
  return format(date, "yyyy-MM");
}

function buildWeekOptions(maxDate: Date, limit = 16) {
  let cursor = startOfWeek(maxDate, { weekStartsOn: 1 });
  const out: Array<{ value: string; label: string }> = [];
  for (let i = 0; i < limit; i++) {
    const start = cursor;
    const end = endOfWeek(cursor, { weekStartsOn: 1 });
    const value = formatYmd(start);
    out.push({ value, label: `${formatYmd(start)} - ${formatYmd(end)}` });
    cursor = subWeeks(cursor, 1);
  }
  return out;
}

function buildMonthOptions(maxDate: Date, limit = 24) {
  let cursor = startOfMonth(maxDate);
  const out: Array<{ value: string; label: string }> = [];
  for (let i = 0; i < limit; i++) {
    const start = cursor;
    const end = endOfMonth(cursor);
    const value = formatYm(start);
    out.push({ value, label: `${formatYmd(start)} - ${formatYmd(end)}` });
    cursor = subMonths(cursor, 1);
  }
  return out;
}

function parseWeekStart(value: string): Date | null {
  const d = parseISO(value);
  if (!isValid(d)) return null;
  return startOfWeek(d, { weekStartsOn: 1 });
}

function parseMonthStart(value: string): Date | null {
  const d = parseISO(`${value}-01`);
  if (!isValid(d)) return null;
  return startOfMonth(d);
}

function coerceDate(value: unknown): Date | null {
  if (value instanceof Date) return isValid(value) ? value : null;
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    return isValid(d) ? d : null;
  }
  return null;
}

function normalizeKey(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function platformSortKey(platform: string): number {
  const p = platform.toLowerCase();
  if (p === "taptap") return 0;
  if (p === "baidu") return 1;
  if (p === "9game") return 2;
  return 10;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const tab = pickTab(resolvedSearchParams.tab);
  const sheetCache = await getSheetCache();

  const applyName = (value: string | null | undefined) =>
    value ? applySheetSubstitutions(value, sheetCache) : value ?? "";

  const { platforms, leaderboardsByPlatform } =
    await getPlatformsAndLeaderboards();

  const defaultPlatform = platforms.includes("taptap")
    ? "taptap"
    : platforms[0] ?? "taptap";

  const platform = pickString(resolvedSearchParams.platform) ?? defaultPlatform;
  const leaderboards = leaderboardsByPlatform[platform] ?? [];
  const requestedLeaderboard = pickString(resolvedSearchParams.leaderboard);
  const leaderboard =
    (requestedLeaderboard && leaderboards.includes(requestedLeaderboard)
      ? requestedLeaderboard
      : undefined) ??
    leaderboards[0] ??
    "";

  const buckets =
    tab === "follow"
      ? await getSnapshotBuckets({ platform, leaderboard, limit: 30 })
      : [];
  const requestedBucket = pickString(resolvedSearchParams.snapshot);
  const snapshotBucket =
    tab === "follow"
      ? (requestedBucket && buckets.some((b) => b.bucket === requestedBucket)
          ? requestedBucket
          : undefined) ??
        buckets[0]?.bucket ??
        ""
      : "";

  const snapshotOptions =
    tab === "follow"
      ? buckets.map((b) => ({
          bucket: b.bucket,
          label: `${format(b.snapshotAt, "yyyy-MM-dd HH:mm")} (${b.countDocs})`,
        }))
      : [];

  const platformsWanted = ["taptap", "baidu", "9game"] as const;
  const platformsForWeekly = platformsWanted.filter((p) => platforms.includes(p));
  const weeklyPlatforms =
    platformsForWeekly.length > 0 ? platformsForWeekly : platforms.slice(0, 3);

  const bounds =
    tab === "weekly"
      ? await getSnapshotBoundsForPlatforms({ platforms: weeklyPlatforms })
      : { min: null, max: null };
  const maxDate = bounds.max ?? new Date();
  const weekOptions = buildWeekOptions(maxDate, 16);
  const requestedWeek = pickString(resolvedSearchParams.week);
  const week =
    (requestedWeek && weekOptions.some((w) => w.value === requestedWeek)
      ? requestedWeek
      : undefined) ??
    weekOptions[0]?.value ??
    formatYmd(startOfWeek(maxDate, { weekStartsOn: 1 }));

  const weekStart = parseWeekStart(week) ?? startOfWeek(maxDate, { weekStartsOn: 1 });
  const weekEnd = endOfDay(endOfWeek(weekStart, { weekStartsOn: 1 }));

  const weeklyRows =
    tab === "weekly"
      ? await getWeeklyHighlights({
          platforms: weeklyPlatforms,
          start: startOfDay(weekStart),
          end: weekEnd,
          limit: 0,
        })
      : [];

  const weeklyCatalog =
    tab === "weekly"
      ? await getGameNamesByPlatformUrls({
          pairs: Array.from(
            new Map(
              weeklyRows.map((r) => [
                `${r.platform}||${r.game_url}`,
                { platform: r.platform, game_url: r.game_url },
              ]),
            ).values(),
          ),
        })
      : [];
  const weeklyCatalogByKey = new Map<string, (typeof weeklyCatalog)[number]>();
  for (const d of weeklyCatalog) {
    weeklyCatalogByKey.set(`${d.platform}||${d.game_url}`, d);
  }

  type WeeklyMerged = {
    key: string;
    title: string;
    platforms: string[];
    bestRank: number;
    avgRank: number;
    hotScore: number;
    perPlatform: Record<
      string,
      {
        representative: (typeof weeklyRows)[number];
        catalog?: (typeof weeklyCatalog)[number];
        entries: Array<(typeof weeklyRows)[number]>;
      }
    >;
  };

  const mergedMap = new Map<string, WeeklyMerged>();
  for (const row of weeklyRows) {
    const catalog = weeklyCatalogByKey.get(`${row.platform}||${row.game_url}`);
    const nameKeyRaw =
      catalog?.game_name_original ?? catalog?.game_name_vn_en ?? row.game_url;
    const nameKey = normalizeKey(applyName(nameKeyRaw));
    const groupKey = nameKey ? `name:${nameKey}` : `url:${row.game_url}`;

    const title =
      applyName(
        catalog?.game_name_vn_en ?? catalog?.game_name_original ?? row.game_url,
      );

    const existing = mergedMap.get(groupKey);
    if (!existing) {
      mergedMap.set(groupKey, {
        key: groupKey,
        title,
        platforms: [String(row.platform)],
        bestRank: row.rank_numeric,
        avgRank: row.rank_numeric,
        hotScore: row.hot_score,
        perPlatform: {
          [String(row.platform)]: {
            representative: row,
            catalog,
            entries: [row],
          },
        },
      });
      continue;
    }

    if (!existing.platforms.includes(String(row.platform))) {
      existing.platforms.push(String(row.platform));
    }
    existing.hotScore += row.hot_score;
    existing.bestRank = Math.min(existing.bestRank, row.rank_numeric);
    const platformKey = String(row.platform);
    const slot = existing.perPlatform[platformKey];
    if (!slot) {
      existing.perPlatform[platformKey] = {
        representative: row,
        catalog,
        entries: [row],
      };
    } else {
      slot.entries.push(row);
      const shouldReplaceRepresentative =
        row.rank_numeric < slot.representative.rank_numeric ||
        (row.rank_numeric === slot.representative.rank_numeric &&
          row.hot_score > slot.representative.hot_score);
      if (shouldReplaceRepresentative) {
        slot.representative = row;
        if (catalog) slot.catalog = catalog;
      }
    }
  }

  const weeklyMerged = Array.from(mergedMap.values())
    .map((m) => {
      const allRanks: number[] = [];
      for (const platform of m.platforms) {
        const slot = m.perPlatform[platform];
        if (!slot) continue;
        for (const entry of slot.entries) allRanks.push(entry.rank_numeric);
      }
      const avgRank =
        allRanks.length > 0
          ? allRanks.reduce((a, b) => a + b, 0) / allRanks.length
          : m.bestRank;

      return { ...m, avgRank, platforms: [...m.platforms].sort() };
    })
    .sort((a, b) => {
      if (a.avgRank !== b.avgRank) return a.avgRank - b.avgRank;
      if (a.bestRank !== b.bestRank) return a.bestRank - b.bestRank;
      if (b.hotScore !== a.hotScore) return b.hotScore - a.hotScore;
      return b.platforms.length - a.platforms.length;
    })
    .slice(0, 10);

  const weeklyTopImagePairs =
    tab === "weekly"
      ? weeklyMerged.flatMap((item) => {
          const orderedPlatforms = [...item.platforms].sort((a, b) => {
            const ka = platformSortKey(a);
            const kb = platformSortKey(b);
            if (ka !== kb) return ka - kb;
            return a.localeCompare(b);
          });

          const primaryPlatform = orderedPlatforms[0];
          if (!primaryPlatform) return [];
          const entry = item.perPlatform[primaryPlatform]?.representative;
          if (!entry) return [];
          return [{ platform: entry.platform, game_url: entry.game_url }];
        })
      : [];

  const followSnapshot =
    tab === "follow" && snapshotBucket
      ? await getLeaderboardSnapshotByBucket({
          platform,
          leaderboard,
          bucket: snapshotBucket,
          limit: 50,
        })
      : null;

  const followRows = followSnapshot?.rows ?? [];
  const followPairs =
    tab === "follow"
      ? followRows.map((r) => ({ platform, game_url: r.game_url }))
      : [];
  const followNameDocs =
    tab === "follow" && followPairs.length > 0
      ? await getGameNamesByPlatformUrls({ pairs: followPairs })
      : [];
  const followNamesByKey = new Map(
    followNameDocs.map((d) => [`${d.platform}||${d.game_url}`, d] as const),
  );

  const newRange =
    tab === "new" ? pickRange(pickString(resolvedSearchParams.range)) : "week";
  const releaseBounds =
    tab === "new" ? await getReleaseDateBounds() : { min: null, max: null };
  const releaseMaxDate = releaseBounds.max ?? new Date();
  const newPeriods =
    tab === "new"
      ? newRange === "month"
        ? buildMonthOptions(releaseMaxDate, 24)
        : buildWeekOptions(releaseMaxDate, 24)
      : [];
  const requestedNewPeriod = pickString(resolvedSearchParams.period);
  const newPeriod =
    tab === "new"
      ? (requestedNewPeriod &&
        newPeriods.some((p) => p.value === requestedNewPeriod)
          ? requestedNewPeriod
          : undefined) ??
        newPeriods[0]?.value ??
        (newRange === "month"
          ? formatYm(releaseMaxDate)
          : formatYmd(startOfWeek(releaseMaxDate, { weekStartsOn: 1 })))
      : "";
  const newPeriodStart =
    tab === "new"
      ? newRange === "month"
        ? parseMonthStart(newPeriod) ?? startOfMonth(releaseMaxDate)
        : parseWeekStart(newPeriod) ?? startOfWeek(releaseMaxDate, { weekStartsOn: 1 })
      : new Date();
  const newPeriodEnd =
    tab === "new"
      ? newRange === "month"
        ? endOfDay(endOfMonth(newPeriodStart))
        : endOfDay(endOfWeek(newPeriodStart, { weekStartsOn: 1 }))
      : new Date();
  const newReleaseRows =
    tab === "new"
      ? await getNewReleases({
          start: startOfDay(newPeriodStart),
          end: newPeriodEnd,
          limit: 300,
        })
      : [];

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">TRANG CHỦ</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Tab 1: BXH TUẦN tổng hợp. Tab 2: THEO DÕI BXH từng platform. Tab 3: GAME MỚI ra mắt.
            </p>
          </div>
        </div>
        <HomeTabs tab={tab} />
      </section>

      {tab === "weekly" ? (
        <>
          <section className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-start gap-2 sm:justify-end">
              <span className="chip chip-platform">
                Nền tảng:{" "}
                <span className="font-semibold">{weeklyPlatforms.join(", ")}</span>
              </span>
              <span className="chip chip-date">
                Kỳ: <span className="font-semibold">{formatYmd(weekStart)} → {formatYmd(weekEnd)}</span>
              </span>
            </div>
          </section>

          <section className="card p-4">
            <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div className="section-title">Bộ lọc</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                Chọn tuần để xem BXH tổng hợp
              </div>
            </div>
            <WeeklyHighlightsFilters week={week} weeks={weekOptions} />
          </section>

          <section className="card overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-blue-500/10 dark:hover:shadow-sky-500/10">
            {weeklyMerged.length === 0 ? (
              <div className="p-6 text-sm text-zinc-600 dark:text-zinc-400">
                Không có dữ liệu trong tuần này.
              </div>
            ) : (
              <GameImagesProvider pairs={weeklyTopImagePairs}>
                <div className="flex items-center justify-end px-4 pt-4 pb-3">
                  <ExportCsvButton
                    tableId="weekly-table"
                    filename={`bxh-tuan-${week}`}
                  />
                </div>
                <div className="overflow-x-auto">
                <table id="weekly-table" className="data-table w-full border-collapse text-sm font-medium text-zinc-950 dark:text-zinc-50">
                  <thead className="text-center text-xs font-bold uppercase tracking-wide text-sky-900 dark:text-sky-200">
                    <tr>
                      <th className="sticky top-0 bg-white/90 px-4 py-3 backdrop-blur dark:bg-zinc-950/75">
                        STT
                      </th>
                      <th className="sticky top-0 bg-white/90 px-4 py-3 text-left backdrop-blur dark:bg-zinc-950/75">
                        Game
                      </th>
                      <th className="sticky top-0 bg-white/90 px-4 py-3 backdrop-blur dark:bg-zinc-950/75">
                        Hạng
                      </th>
                      <th className="sticky top-0 bg-white/90 px-4 py-3 backdrop-blur dark:bg-zinc-950/75">
                        Link
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {weeklyMerged.map((item, index) => {
                      const orderedPlatforms = [...item.platforms].sort((a, b) => {
                        const ka = platformSortKey(a);
                        const kb = platformSortKey(b);
                        if (ka !== kb) return ka - kb;
                        return a.localeCompare(b);
                      });
                      const orderedEntries = orderedPlatforms.flatMap((p) => {
                        const entry = item.perPlatform[p];
                        return entry ? [{ platform: p, entry }] : [];
                      });

                      const primaryPlatform = orderedPlatforms[0] ?? "";
                      const primary = primaryPlatform
                        ? item.perPlatform[primaryPlatform]
                        : undefined;
                      const primaryRow = primary?.representative;
                      const primaryCatalog = primary?.catalog;
                      const name = applyName(
                        primaryCatalog?.game_name_vn_en ??
                          primaryCatalog?.game_name_original ??
                          item.title,
                      );

                      return (
                        <tr
                          key={item.key}
                          className="border-t border-zinc-200/70 odd:bg-white even:bg-sky-50/70 hover:bg-sky-100/60 dark:border-zinc-800/70 dark:odd:bg-zinc-950/40 dark:even:bg-zinc-900/25 dark:hover:bg-sky-400/10"
                        >
                          <td className="px-4 py-3 text-center align-top">
                            <span className="inline-flex min-w-10 justify-center rounded-full bg-blue-600/10 px-2 py-1 font-semibold tabular-nums text-blue-700 dark:bg-sky-400/10 dark:text-sky-300">
                              {index + 1}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-left">
                            <div className="flex items-center gap-4">
                              <div className="shrink-0">
                                {primaryRow ? (
                                  typeof primaryCatalog?.game_image === "string" &&
                                  primaryCatalog.game_image.trim() ? (
                                    <SafeImage
                                      src={primaryCatalog.game_image}
                                      alt={name}
                                      width={56}
                                      height={56}
                                      className="h-14 w-14 rounded-xl border border-zinc-200 object-cover shadow-sm dark:border-zinc-800"
                                    />
                                  ) : (
                                    <GameThumb
                                      platform={String(primaryRow.platform)}
                                      gameUrl={primaryRow.game_url}
                                      alt={name}
                                      width={56}
                                      height={56}
                                      className="h-14 w-14 rounded-xl border border-zinc-200 object-cover shadow-sm dark:border-zinc-800"
                                    />
                                  )
                                ) : (
                                  <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-400">
                                    N/A
                                  </div>
                                )}
                              </div>

                              <div className="min-w-0">
                                <Link
                                  className="font-medium text-zinc-950 underline-offset-4 hover:underline dark:text-zinc-50"
                                  href={
                                    primaryRow
                                      ? `/game?url=${encodeURIComponent(
                                          primaryRow.game_url,
                                        )}&platform=${encodeURIComponent(
                                          primaryRow.platform,
                                        )}&leaderboard=${encodeURIComponent(
                                          primaryRow.leaderboard,
                                        )}&range=week&period=${encodeURIComponent(week)}`
                                      : "#"
                                  }
                                >
                                  {name}
                                </Link>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center align-top">
                            <div className="flex flex-col items-center gap-2">
                              {orderedEntries.map(({ platform: p, entry }) => {
                                const href = `/game?url=${encodeURIComponent(
                                  entry.representative.game_url,
                                )}&platform=${encodeURIComponent(
                                  entry.representative.platform,
                                )}&leaderboard=${encodeURIComponent(
                                  entry.representative.leaderboard,
                                )}&range=week&period=${encodeURIComponent(week)}`;
                                return (
                                  <Link
                                    key={p}
                                    className="inline-flex min-w-10 justify-center rounded-full bg-blue-600/10 px-2 py-1 font-semibold tabular-nums text-blue-700 hover:bg-blue-600/15 dark:bg-sky-400/10 dark:text-sky-300 dark:hover:bg-sky-400/15"
                                    href={href}
                                    title={`Hạng (${p})`}
                                  >
                                    {entry.representative.rank_numeric}
                                  </Link>
                                );
                              })}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center align-top">
                            <div className="flex flex-col items-center gap-2">
                              {orderedEntries.map(({ platform: p, entry }) => {
                                const href = entry.representative.game_url;
                                return (
                                  <a
                                    key={p}
                                    className="chip chip-platform"
                                    href={href}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    {p}
                                  </a>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>
              </GameImagesProvider>
            )}
          </section>
        </>
      ) : tab === "new" ? (
        <>
          <section className="flex flex-wrap items-center justify-start gap-2 sm:justify-end">
            <span className="chip chip-date">
              Kỳ:{" "}
              <span className="font-semibold">
                {formatYmd(newPeriodStart)} - {formatYmd(newPeriodEnd)}
              </span>
            </span>
            <span className="chip">
              Tổng: <span className="font-semibold">{newReleaseRows.length}</span>
            </span>
          </section>

          <section className="card p-4">
            <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div className="section-title">Bộ lọc</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                Lọc GAME MỚI ra mắt theo tuần hoặc tháng
              </div>
            </div>
            <NewReleasesFilters range={newRange} period={newPeriod} periods={newPeriods} />
          </section>

          <section className="card overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-blue-500/10 dark:hover:shadow-sky-500/10">
            {newReleaseRows.length === 0 ? (
              <div className="p-6 text-sm text-zinc-600 dark:text-zinc-400">
                Không có dữ liệu trong kỳ này.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="flex items-center justify-end px-4 pt-4 pb-3">
                  <ExportCsvButton
                    tableId="new-release-table"
                    filename={`game-moi-${newPeriod}`}
                  />
                </div>
                <table id="new-release-table" className="data-table w-full border-collapse text-sm font-medium text-zinc-950 dark:text-zinc-50">
                  <thead className="text-center text-xs font-bold uppercase tracking-wide text-sky-900 dark:text-sky-200">
                    <tr>
                      <th className="sticky top-0 bg-white/90 px-4 py-3 backdrop-blur dark:bg-zinc-950/75">
                        STT
                      </th>
                      <th className="sticky top-0 bg-white/90 px-4 py-3 backdrop-blur dark:bg-zinc-950/75">
                        Ảnh
                      </th>
                      <th className="sticky top-0 bg-white/90 px-4 py-3 backdrop-blur dark:bg-zinc-950/75">
                        Tên game
                      </th>
                      <th className="sticky top-0 bg-white/90 px-4 py-3 backdrop-blur dark:bg-zinc-950/75">
                        TRANG
                      </th>
                      <th className="sticky top-0 bg-white/90 px-4 py-3 backdrop-blur dark:bg-zinc-950/75">
                        Ngày phát hành
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {newReleaseRows.map((row, index) => {
                      const name =
                        applyName(
                          row.game_name_vn_en ??
                            row.game_name_original ??
                            row.game_url,
                        );
                      const href = `/game?url=${encodeURIComponent(
                        row.game_url,
                      )}&platform=${encodeURIComponent(String(row.platform))}`;
                      const releaseAt = coerceDate(row.release_at);
                      const releaseKey =
                        releaseAt?.toISOString() ?? String(row.release_at ?? "");

                      return (
                        <tr
                          key={`${row.platform}||${row.game_url}||${releaseKey}||${index}`}
                          className="border-t border-zinc-200/70 odd:bg-white even:bg-sky-50/70 hover:bg-sky-100/60 dark:border-zinc-800/70 dark:odd:bg-zinc-950/40 dark:even:bg-zinc-900/25 dark:hover:bg-sky-400/10"
                        >
                          <td className="px-4 py-3 text-center align-top">
                            <span className="inline-flex min-w-10 justify-center rounded-full bg-blue-600/10 px-2 py-1 font-semibold tabular-nums text-blue-700 dark:bg-sky-400/10 dark:text-sky-300">
                              {index + 1}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center">
                              {typeof row.game_image === "string" &&
                              row.game_image.trim() ? (
                                <SafeImage
                                  src={row.game_image}
                                  alt={name}
                                  width={40}
                                  height={40}
                                  className="h-10 w-10 rounded-xl border border-zinc-200 object-cover shadow-sm dark:border-zinc-800"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/30" />
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Link
                              className="font-medium text-zinc-950 underline-offset-4 hover:underline dark:text-zinc-50"
                              href={href}
                            >
                              {name}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <a
                              className="chip chip-platform"
                              href={row.game_url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {row.platform}
                            </a>
                          </td>
                          <td className="px-4 py-3 text-center text-zinc-700 dark:text-zinc-300">
                            {releaseAt ? format(releaseAt, "yyyy-MM-dd") : ""}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : (
        <>
          <section className="flex flex-wrap items-center justify-start gap-2 sm:justify-end">
            {followSnapshot?.snapshotAt ? (
              <span className="chip chip-date">
                THỜI GIAN:{" "}
                <span className="font-semibold">
                  {format(followSnapshot.snapshotAt, "yyyy-MM-dd HH:mm")}
                </span>
              </span>
            ) : null}
            <span className="chip">
              Hiển thị:{" "}
              <span className="font-semibold">{followRows.length}/50</span>
            </span>
            <Link
              className="btn btn-primary h-9 px-3 text-xs"
              href={`/overview?platform=${encodeURIComponent(
                platform,
              )}&leaderboard=${encodeURIComponent(
                leaderboard,
              )}&snapshot=${encodeURIComponent(snapshotBucket)}`}
            >
              Xem biểu đồ nhiều game
            </Link>
          </section>

          <section className="card p-4">
            <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div className="section-title">Bộ lọc</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                Các mục có thể chọn sẽ nằm trong khu này
              </div>
            </div>

            <Suspense
              fallback={null}
            >
              <LeaderboardFilters
                platforms={platforms}
                leaderboardsByPlatform={leaderboardsByPlatform}
                platform={platform}
                leaderboard={leaderboard}
                snapshotBucket={snapshotBucket}
                snapshots={snapshotOptions}
              />
            </Suspense>
          </section>

          <section className="card overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-blue-500/10 dark:hover:shadow-sky-500/10">
            <GameImagesProvider pairs={followPairs}>
              <div className="overflow-x-auto">
              <div className="flex items-center justify-end px-4 pt-4 pb-3">
                <ExportCsvButton
                  tableId="leaderboard-table"
                  filename={`bxh-${platform}-${leaderboard}-${snapshotBucket}`}
                />
              </div>
              <table id="leaderboard-table" className="data-table w-full border-collapse text-sm font-medium text-zinc-950 dark:text-zinc-50">
                <thead className="text-center text-xs font-bold uppercase tracking-wide text-sky-900 dark:text-sky-200">
                  <tr>
                    <th className="sticky top-0 bg-white/90 px-4 py-3 text-center backdrop-blur dark:bg-zinc-950/75">
                      Hạng
                    </th>
                    <th className="sticky top-0 bg-white/90 px-4 py-3 text-center backdrop-blur dark:bg-zinc-950/75">
                      Ảnh
                    </th>
                    <th className="sticky top-0 bg-white/90 px-4 py-3 text-center backdrop-blur dark:bg-zinc-950/75">
                      Game
                    </th>
                    <th className="sticky top-0 bg-white/90 px-4 py-3 text-center backdrop-blur dark:bg-zinc-950/75">
                      Ngày cập nhật
                    </th>
                    <th className="sticky top-0 bg-white/90 px-4 py-3 text-center backdrop-blur dark:bg-zinc-950/75">
                      Nguồn
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {followRows.length === 0 ? (
                    <tr>
                      <td
                        className="px-4 py-10 text-center text-zinc-600 dark:text-zinc-400"
                        colSpan={5}
                      >
                        Không có dữ liệu.
                      </td>
                    </tr>
                  ) : (
                    followRows.map((row) => {
                      const game = followNamesByKey.get(`${platform}||${row.game_url}`);
                      const name =
                        applyName(
                          game?.game_name_vn_en ??
                            game?.game_name_original ??
                            row.game_url,
                        );
                      const href = `/game?url=${encodeURIComponent(
                        row.game_url,
                      )}&platform=${encodeURIComponent(
                        platform,
                      )}&leaderboard=${encodeURIComponent(leaderboard)}`;
                      return (
                        <tr
                          key={row.game_url}
                          className="border-t border-zinc-200/70 odd:bg-white even:bg-sky-50/70 hover:bg-sky-100/60 dark:border-zinc-800/70 dark:odd:bg-zinc-950/40 dark:even:bg-zinc-900/25 dark:hover:bg-sky-400/10"
                        >
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex min-w-10 justify-center rounded-full bg-blue-600/10 px-2 py-1 font-semibold tabular-nums text-blue-700 dark:bg-sky-400/10 dark:text-sky-300">
                              {row.rank_numeric}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center">
                              <GameThumb
                                platform={platform}
                                gameUrl={row.game_url}
                                alt={name}
                                width={40}
                                height={40}
                                className="h-10 w-10 rounded-xl border border-zinc-200 object-cover shadow-sm dark:border-zinc-800"
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Link
                              className="font-medium text-zinc-950 underline-offset-4 hover:underline dark:text-zinc-50"
                              href={href}
                            >
                              {name}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-center text-zinc-700 dark:text-zinc-300">
                            {format(row.snapshot_at, "yyyy-MM-dd HH:mm")}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <a
                              className="btn btn-ghost h-8 px-3 text-xs"
                              href={row.game_url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Mở nguồn
                            </a>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              </div>
            </GameImagesProvider>
          </section>
        </>
      )}
    </div>
  );
}
