import {
  eachDayOfInterval,
  endOfDay,
  format,
  startOfDay,
  startOfMonth,
  subDays,
} from "date-fns";
import Link from "next/link";
import { Suspense } from "react";
import { MultiRankChart, type MultiRankPoint } from "@/components/MultiRankChart";
import { OverviewFilters } from "@/components/OverviewFilters";
import {
  getGameCatalogByUrls,
  getPlatformsAndLeaderboards,
  getRankSeriesByDayForGames,
  getSnapshotBuckets,
  getTopGameUrlsAtBucket,
} from "@/lib/queries";
import { applySheetSubstitutions, getSheetCache } from "@/lib/sheet-cache";

export const dynamic = "force-dynamic";

// ============================================================================
// Types
// ============================================================================

type SearchParams = Record<string, string | string[] | undefined>;

type RangeType = "week" | "month";

type TopCount = 10 | 20 | 50;

interface SeriesItem {
  url: string;
  key: string;
  label: string;
  color: string;
}

interface SnapshotOption {
  bucket: string;
  label: string;
}

// ============================================================================
// Constants
// ============================================================================

const COLOR_PALETTE = [
  "#2563eb",
  "#9333ea",
  "#0ea5e9",
  "#f97316",
  "#16a34a",
  "#e11d48",
  "#0f766e",
  "#a16207",
  "#4f46e5",
  "#db2777",
  "#0891b2",
  "#65a30d",
  "#7c2d12",
  "#1d4ed8",
  "#7e22ce",
  "#0369a1",
] as const;

const DEFAULT_PLATFORM = "taptap";
const DEFAULT_TOP_COUNT = 10;
const VALID_TOP_COUNTS = [10, 20, 50] as const;
const SNAPSHOT_BUCKET_LIMIT = 30;
const LEGEND_GRID_THRESHOLD = 12;
const MAX_RANK = 50;

// ============================================================================
// Utility Functions
// ============================================================================

function parseSearchParam(value: SearchParams[string]): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function parseRange(value: SearchParams[string]): RangeType {
  return value === "month" ? "month" : "week";
}

function parseTopCount(value: SearchParams[string]): TopCount {
  const parsed = Number(value);
  return VALID_TOP_COUNTS.includes(parsed as TopCount)
    ? (parsed as TopCount)
    : DEFAULT_TOP_COUNT;
}

function getDateRange(snapshotDate: Date, range: RangeType) {
  const end = endOfDay(snapshotDate);
  const start =
    range === "month"
      ? startOfMonth(snapshotDate)
      : startOfDay(subDays(snapshotDate, 6));

  return { start, end };
}

function formatSnapshotOption(bucket: {
  bucket: string;
  snapshotAt: Date;
  countDocs: number;
}): SnapshotOption {
  return {
    bucket: bucket.bucket,
    label: `${format(bucket.snapshotAt, "yyyy-MM-dd HH:mm")} (${bucket.countDocs})`,
  };
}

function buildGameSeries(
  gameUrls: string[],
  catalogMap: ReadonlyMap<
    string,
    { game_name_vn_en?: string | null; game_name_original?: string | null }
  >,
  applyName: (value: string) => string
): SeriesItem[] {
  return gameUrls.map((url, index) => {
    const game = catalogMap.get(url);
    const label =
      applyName(
        game?.game_name_vn_en ??
          game?.game_name_original ??
          `Game ${index + 1}`,
      );

    return {
      url,
      key: `g${index + 1}`,
      label,
      color: COLOR_PALETTE[index % COLOR_PALETTE.length],
    };
  });
}

function buildChartPoints(
  series: SeriesItem[],
  rawPoints: Array<{ game_url: string; day: string; rank: number }>,
  dateRange: { start: Date; end: Date },
  maxRank: number
): MultiRankPoint[] {
  const rankMap = new Map<string, number>();
  
  for (const point of rawPoints) {
    rankMap.set(`${point.game_url}||${point.day}`, point.rank);
  }

  return eachDayOfInterval(dateRange).map((date) => {
    const day = format(date, "yyyy-MM-dd");
    const point: MultiRankPoint = { day };

    for (const item of series) {
      const rank = rankMap.get(`${item.url}||${day}`) ?? null;
      point[item.key] = rank != null && rank > maxRank ? null : rank;
    }

    return point;
  });
}

// ============================================================================
// Components
// ============================================================================

function EmptyState() {
  return (
    <div className="flex flex-col gap-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">TỔNG QUAN</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Chưa có THỜI GIAN nào cho TRANG/BẢNG XẾP HẠNG này.
        </p>
      </section>
    </div>
  );
}

function PageHeader({
  range,
  snapshotDate,
  dateRange,
  topCount,
}: {
  range: RangeType;
  snapshotDate: Date;
  dateRange: { start: Date; end: Date };
  topCount: number;
}) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">TỔNG QUAN</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Biểu đồ hạng của nhiều game trong{" "}
            {range === "month" ? "tháng" : "tuần"}.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-start gap-2 sm:justify-end">
          <span className="chip chip-date">
            THỜI GIAN:{" "}
            <span className="font-semibold">
              {format(snapshotDate, "yyyy-MM-dd HH:mm")}
            </span>
          </span>
          <span className="chip chip-date">
            Khoảng:{" "}
            <span className="font-semibold">
              {format(dateRange.start, "yyyy-MM-dd")} →{" "}
              {format(dateRange.end, "yyyy-MM-dd")}
            </span>
          </span>
          <span className="chip">
            THEO DÕI: <span className="font-semibold">Top {topCount}</span>
          </span>
        </div>
      </div>
    </section>
  );
}

function FiltersSection({
  platforms,
  leaderboardsByPlatform,
  platform,
  leaderboard,
  snapshotBucket,
  snapshots,
  range,
  top,
}: {
  platforms: string[];
  leaderboardsByPlatform: Record<string, string[]>;
  platform: string;
  leaderboard: string;
  snapshotBucket: string;
  snapshots: SnapshotOption[];
  range: RangeType;
  top: number;
}) {
  return (
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
        <OverviewFilters
          platforms={platforms}
          leaderboardsByPlatform={leaderboardsByPlatform}
          platform={platform}
          leaderboard={leaderboard}
          snapshotBucket={snapshotBucket}
          snapshots={snapshots}
          range={range}
          top={top}
        />
      </Suspense>
    </section>
  );
}

function LegendGrid({
  series,
  platform,
  leaderboard,
  range,
}: {
  series: SeriesItem[];
  platform: string;
  leaderboard: string;
  range: RangeType;
}) {
  if (series.length <= LEGEND_GRID_THRESHOLD) return null;

  return (
    <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {series.map((item) => (
        <Link
          key={item.key}
          href={`/game?platform=${encodeURIComponent(
            platform,
          )}&leaderboard=${encodeURIComponent(
            leaderboard,
          )}&range=${encodeURIComponent(range)}&url=${encodeURIComponent(
            item.url,
          )}`}
          className="flex items-center gap-2 rounded-xl border border-zinc-200/70 bg-white/60 px-3 py-2 text-sm transition hover:bg-sky-50/70 dark:border-zinc-800/70 dark:bg-zinc-950/40 dark:hover:bg-sky-400/10"
        >
          <span
            className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
            style={{ background: item.color }}
          />
          <span className="truncate" title={item.label}>
            {item.label}
          </span>
        </Link>
      ))}
    </div>
  );
}

function ChartSection({
  points,
  series,
  maxRank,
  platform,
  leaderboard,
  range,
}: {
  points: MultiRankPoint[];
  series: SeriesItem[];
  maxRank: number;
  platform: string;
  leaderboard: string;
  range: RangeType;
}) {
  const chartSeries = series.map(({ key, label, color }) => ({
    key,
    label,
    color,
  }));

  return (
    <section className="card p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">Hạng theo ngày</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Trục X: ngày. Trục Y: hạng (1 tốt nhất, 50 thấp hơn).
          </p>
        </div>
      </div>

      <div className="mt-4">
        <MultiRankChart points={points} series={chartSeries} maxRank={maxRank} />
      </div>

      <LegendGrid
        series={series}
        platform={platform}
        leaderboard={leaderboard}
        range={range}
      />
    </section>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedParams = await searchParams;
  const sheetCache = await getSheetCache();
  const applyName = (value: string) => applySheetSubstitutions(value, sheetCache);

  // Fetch platforms and leaderboards
  const { platforms, leaderboardsByPlatform } =
    await getPlatformsAndLeaderboards();

  // Determine platform
  const defaultPlatform = platforms.includes(DEFAULT_PLATFORM)
    ? DEFAULT_PLATFORM
    : platforms[0] ?? DEFAULT_PLATFORM;
  const platform = parseSearchParam(resolvedParams.platform) ?? defaultPlatform;

  // Determine leaderboard
  const availableLeaderboards = leaderboardsByPlatform[platform] ?? [];
  const requestedLeaderboard = parseSearchParam(resolvedParams.leaderboard);
  const leaderboard =
    (requestedLeaderboard && availableLeaderboards.includes(requestedLeaderboard)
      ? requestedLeaderboard
      : availableLeaderboards[0]) ?? "";

  // Fetch snapshot buckets
  const buckets = await getSnapshotBuckets({
    platform,
    leaderboard,
    limit: SNAPSHOT_BUCKET_LIMIT,
  });

  // Determine snapshot bucket
  const requestedBucket = parseSearchParam(resolvedParams.snapshot);
  const snapshotBucket =
    (requestedBucket && buckets.some((b) => b.bucket === requestedBucket)
      ? requestedBucket
      : buckets[0]?.bucket) ?? "";

  if (!snapshotBucket) {
    return <EmptyState />;
  }

  // Parse additional params
  const range = parseRange(parseSearchParam(resolvedParams.range));
  const topCount = parseTopCount(parseSearchParam(resolvedParams.top));

  // Prepare snapshot options
  const snapshotOptions = buckets.map(formatSnapshotOption);

  // Get snapshot date and date range
  const bucketInfo = buckets.find((b) => b.bucket === snapshotBucket);
  const snapshotDate = bucketInfo?.snapshotAt ?? new Date();
  const dateRange = getDateRange(snapshotDate, range);

  // Fetch game data
  const gameUrls = await getTopGameUrlsAtBucket({
    platform,
    leaderboard,
    bucket: snapshotBucket,
    limit: topCount,
  });

  const catalogDocs = await getGameCatalogByUrls(gameUrls);
  const catalogMap = new Map(catalogDocs.map((doc) => [doc.game_url, doc]));

  // Build series
  const series = buildGameSeries(gameUrls, catalogMap, applyName);

  // Fetch and build chart points
  const rawPoints = await getRankSeriesByDayForGames({
    platform,
    leaderboard,
    gameUrls,
    start: dateRange.start,
    end: dateRange.end,
  });

  const points = buildChartPoints(series, rawPoints, dateRange, MAX_RANK);

  // Render
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        range={range}
        snapshotDate={snapshotDate}
        dateRange={dateRange}
        topCount={topCount}
      />

      <FiltersSection
        platforms={platforms}
        leaderboardsByPlatform={leaderboardsByPlatform}
        platform={platform}
        leaderboard={leaderboard}
        snapshotBucket={snapshotBucket}
        snapshots={snapshotOptions}
        range={range}
        top={topCount}
      />

      <ChartSection
        points={points}
        series={series}
        maxRank={MAX_RANK}
        platform={platform}
        leaderboard={leaderboard}
        range={range}
      />
    </div>
  );
}
