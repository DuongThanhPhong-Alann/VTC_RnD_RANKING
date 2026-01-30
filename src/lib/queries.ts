import type { Db } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { unstable_cache } from "next/cache";

export type Platform = "taptap" | "baidu" | "9game" | (string & {});
export type Leaderboard = string;

export type GameCatalogDoc = {
  _id: string;
  platform: Platform;
  category?: string | null;
  game_url: string;
  game_name_original?: string | null;
  game_name_vn_en?: string | null;
  game_image?: string | null;
  developer?: string | null;
  publisher?: string | null;
  genre?: string[] | null;
  rating?: string | number | null;
  release_status?: string | null;
  release_date?: string | null;
  fetch_time?: string | Date | null;
  ai_note?: string | null;
  human_note?: string | null;
  insights?: { markdown?: string } | null;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
};

export type LatestRankRow = {
  game_url: string;
  rank_numeric: number;
  rank_display?: string;
  snapshot_at: Date;
};

export type RankPoint = { day: string; rank: number | null };
export type SnapshotBucket = {
  bucket: string;
  snapshotAt: Date;
  countDocs: number;
};

export type WeeklyHighlightRow = {
  platform: Platform;
  leaderboard: Leaderboard;
  game_url: string;
  rank_numeric: number;
  snapshot_at: Date;
  hot_score: number;
};

export type NewReleaseRow = {
  platform: Platform;
  game_url: string;
  game_name_original?: string | null;
  game_name_vn_en?: string | null;
  game_image?: string | null;
  release_at: Date | string;
};

export type GameNameDoc = Pick<
  GameCatalogDoc,
  "platform" | "game_url" | "game_name_original" | "game_name_vn_en"
> & {
  // Optional so UI can reuse the same type with/without images.
  game_image?: string | null;
};

async function db(): Promise<Db> {
  return getDb();
}

const snapshotDateExpr = {
  $convert: {
    input: { $ifNull: ["$snapshot_at", "$created_at"] },
    to: "date",
    onError: null,
    onNull: null,
  },
} as const;

// Keep all server-side date bucketing consistent.
// Using a fixed offset avoids surprises when the server runs in UTC.
const MONGO_TIMEZONE = "+07:00" as const;

const snapshotBucketExpr = {
  $dateToString: {
    format: "%Y-%m-%d %H:%M",
    date: "$snapshotDate",
    timezone: MONGO_TIMEZONE,
  },
} as const;

const releaseDateExpr = {
  $convert: {
    input: "$release_date",
    to: "date",
    onError: null,
    onNull: null,
  },
} as const;

export async function getPlatformsAndLeaderboards(): Promise<{
  platforms: Platform[];
  leaderboardsByPlatform: Record<string, Leaderboard[]>;
}> {
  return getPlatformsAndLeaderboardsCached();
}

const getPlatformsAndLeaderboardsCached = unstable_cache(
  async (): Promise<{
    platforms: Platform[];
    leaderboardsByPlatform: Record<string, Leaderboard[]>;
  }> => {
    const database = await db();

    const rows = await database
      .collection("ranking_snapshots")
      .aggregate<{ platform: Platform; leaderboards: Leaderboard[] }>([
        { $match: { rank_numeric: { $gte: 1, $lte: 50 } } },
        {
          $group: {
            _id: { platform: "$platform", leaderboard: "$leaderboard" },
          },
        },
        {
          $group: {
            _id: "$_id.platform",
            leaderboards: { $addToSet: "$_id.leaderboard" },
          },
        },
        {
          $project: {
            _id: 0,
            platform: "$_id",
            leaderboards: 1,
          },
        },
        { $sort: { platform: 1 } },
      ])
      .toArray();

    const platforms = rows.map((r) => r.platform);
    const leaderboardsByPlatform: Record<string, Leaderboard[]> = {};
    for (const row of rows) {
      const lbs = [...(row.leaderboards ?? [])].sort();
      leaderboardsByPlatform[row.platform] = lbs;
    }

    return { platforms, leaderboardsByPlatform };
  },
  ["platforms-and-leaderboards"],
  { revalidate: 60 },
);

export async function getLatestLeaderboard(opts: {
  platform: Platform;
  leaderboard: Leaderboard;
  limit?: number;
}): Promise<LatestRankRow[]> {
  const { platform, leaderboard, limit = 50 } = opts;
  const database = await db();

  const rows = await database
    .collection("ranking_snapshots")
    .aggregate<LatestRankRow>([
      {
        $match: {
          platform,
          leaderboard,
          rank_numeric: { $gte: 1, $lte: 50 },
        },
      },
      { $addFields: { snapshotDate: snapshotDateExpr } },
      { $match: { snapshotDate: { $ne: null } } },
      { $sort: { snapshotDate: -1 } },
      {
        $group: {
          _id: "$game_url",
          game_url: { $first: "$game_url" },
          rank_numeric: { $first: "$rank_numeric" },
          rank_display: { $first: "$rank_display" },
          snapshot_at: { $first: "$snapshotDate" },
        },
      },
      { $sort: { rank_numeric: 1 } },
      { $limit: limit },
    ])
    .toArray();

  return rows;
}

export async function getLatestLeaderboardSnapshot(opts: {
  platform: Platform;
  leaderboard: Leaderboard;
  limit?: number;
}): Promise<{
  snapshotAt: Date | null;
  snapshotBucket: string | null;
  rows: LatestRankRow[];
}> {
  const { platform, leaderboard, limit = 50 } = opts;
  const database = await db();

  const [bucketRow] = await database
    .collection("ranking_snapshots")
    .aggregate<{ bucket: string }>([
      {
        $match: {
          platform,
          leaderboard,
          rank_numeric: { $gte: 1, $lte: 50 },
        },
      },
      { $addFields: { snapshotDate: snapshotDateExpr } },
      { $match: { snapshotDate: { $ne: null } } },
      { $addFields: { bucket: snapshotBucketExpr } },
      { $group: { _id: null, bucket: { $max: "$bucket" } } },
      { $project: { _id: 0, bucket: 1 } },
      { $limit: 1 },
    ])
    .toArray();

  const bucket = bucketRow?.bucket ?? null;
  if (!bucket) {
    return { snapshotAt: null, snapshotBucket: null, rows: [] };
  }

  const [facet] = await database
    .collection("ranking_snapshots")
    .aggregate<{
      meta: Array<{ snapshotAt: Date; countDocs: number }>;
      rows: LatestRankRow[];
    }>([
      {
        $match: {
          platform,
          leaderboard,
          rank_numeric: { $gte: 1, $lte: 50 },
        },
      },
      { $addFields: { snapshotDate: snapshotDateExpr } },
      { $match: { snapshotDate: { $ne: null } } },
      { $addFields: { bucket: snapshotBucketExpr } },
      { $match: { bucket } },
      {
        $facet: {
          meta: [
            {
              $group: {
                _id: null,
                snapshotAt: { $max: "$snapshotDate" },
                countDocs: { $sum: 1 },
              },
            },
            { $project: { _id: 0, snapshotAt: 1, countDocs: 1 } },
            { $limit: 1 },
          ],
          rows: [
            { $sort: { snapshotDate: -1 } },
            {
              $group: {
                _id: "$game_url",
                game_url: { $first: "$game_url" },
                rank_numeric: { $first: "$rank_numeric" },
                rank_display: { $first: "$rank_display" },
                snapshot_at: { $first: "$snapshotDate" },
              },
            },
            { $sort: { rank_numeric: 1 } },
            { $limit: limit },
            { $project: { _id: 0, game_url: 1, rank_numeric: 1, rank_display: 1, snapshot_at: 1 } },
          ],
        },
      },
      { $limit: 1 },
    ])
    .toArray();

  return {
    snapshotAt: facet?.meta?.[0]?.snapshotAt ?? null,
    snapshotBucket: bucket,
    rows: facet?.rows ?? [],
  };
}

export async function getSnapshotBuckets(opts: {
  platform: Platform;
  leaderboard: Leaderboard;
  limit?: number;
}): Promise<SnapshotBucket[]> {
  const { platform, leaderboard, limit = 30 } = opts;
  return getSnapshotBucketsCached(platform, leaderboard, limit);
}

const getSnapshotBucketsCached = unstable_cache(
  async (
    platform: Platform,
    leaderboard: Leaderboard,
    limit: number,
  ): Promise<SnapshotBucket[]> => {
    const database = await db();

    return database
      .collection("ranking_snapshots")
      .aggregate<SnapshotBucket>([
        {
          $match: {
            platform,
            leaderboard,
            rank_numeric: { $gte: 1, $lte: 50 },
          },
        },
        { $addFields: { snapshotDate: snapshotDateExpr } },
        { $match: { snapshotDate: { $ne: null } } },
        { $addFields: { bucket: snapshotBucketExpr } },
        {
          $group: {
            _id: "$bucket",
            bucket: { $first: "$bucket" },
            snapshotAt: { $max: "$snapshotDate" },
            countDocs: { $sum: 1 },
          },
        },
        { $sort: { bucket: -1 } },
        { $limit: limit },
        { $project: { _id: 0, bucket: 1, snapshotAt: 1, countDocs: 1 } },
      ])
      .toArray();
  },
  ["snapshot-buckets"],
  { revalidate: 60 },
);

export async function getLeaderboardSnapshotByBucket(opts: {
  platform: Platform;
  leaderboard: Leaderboard;
  bucket: string;
  limit?: number;
}): Promise<{
  snapshotAt: Date | null;
  snapshotBucket: string;
  rows: LatestRankRow[];
}> {
  const { platform, leaderboard, bucket, limit = 50 } = opts;
  return getLeaderboardSnapshotByBucketCached(platform, leaderboard, bucket, limit);
}

const getLeaderboardSnapshotByBucketCached = unstable_cache(
  async (
    platform: Platform,
    leaderboard: Leaderboard,
    bucket: string,
    limit: number,
  ): Promise<{
    snapshotAt: Date | null;
    snapshotBucket: string;
    rows: LatestRankRow[];
  }> => {
    const database = await db();

    const [facet] = await database
      .collection("ranking_snapshots")
      .aggregate<{
        meta: Array<{ snapshotAt: Date; countDocs: number }>;
        rows: LatestRankRow[];
      }>([
        {
          $match: {
            platform,
            leaderboard,
            rank_numeric: { $gte: 1, $lte: 50 },
          },
        },
        { $addFields: { snapshotDate: snapshotDateExpr } },
        { $match: { snapshotDate: { $ne: null } } },
        { $addFields: { bucket: snapshotBucketExpr } },
        { $match: { bucket } },
        {
          $facet: {
            meta: [
              {
                $group: {
                  _id: null,
                  snapshotAt: { $max: "$snapshotDate" },
                  countDocs: { $sum: 1 },
                },
              },
              { $project: { _id: 0, snapshotAt: 1, countDocs: 1 } },
              { $limit: 1 },
            ],
            rows: [
              { $sort: { snapshotDate: -1 } },
              {
                $group: {
                  _id: "$game_url",
                  game_url: { $first: "$game_url" },
                  rank_numeric: { $first: "$rank_numeric" },
                  rank_display: { $first: "$rank_display" },
                  snapshot_at: { $first: "$snapshotDate" },
                },
              },
              { $sort: { rank_numeric: 1 } },
              { $limit: limit },
              {
                $project: {
                  _id: 0,
                  game_url: 1,
                  rank_numeric: 1,
                  rank_display: 1,
                  snapshot_at: 1,
                },
              },
            ],
          },
        },
        { $limit: 1 },
      ])
      .toArray();

    return {
      snapshotAt: facet?.meta?.[0]?.snapshotAt ?? null,
      snapshotBucket: bucket,
      rows: facet?.rows ?? [],
    };
  },
  ["leaderboard-snapshot-by-bucket"],
  { revalidate: 60 },
);

export async function getTopGameUrlsAtBucket(opts: {
  platform: Platform;
  leaderboard: Leaderboard;
  bucket: string;
  limit?: number;
}): Promise<string[]> {
  const { platform, leaderboard, bucket, limit = 10 } = opts;
  return getTopGameUrlsAtBucketCached(platform, leaderboard, bucket, limit);
}

const getTopGameUrlsAtBucketCached = unstable_cache(
  async (
    platform: Platform,
    leaderboard: Leaderboard,
    bucket: string,
    limit: number,
  ): Promise<string[]> => {
    const database = await db();

    const rows = await database
      .collection("ranking_snapshots")
      .aggregate<{ game_url: string; rank_numeric: number }>([
        {
          $match: {
            platform,
            leaderboard,
            rank_numeric: { $gte: 1, $lte: 50 },
          },
        },
        { $addFields: { snapshotDate: snapshotDateExpr } },
        { $match: { snapshotDate: { $ne: null } } },
        { $addFields: { bucket: snapshotBucketExpr } },
        { $match: { bucket } },
        { $sort: { snapshotDate: -1 } },
        {
          $group: {
            _id: "$game_url",
            game_url: { $first: "$game_url" },
            rank_numeric: { $first: "$rank_numeric" },
          },
        },
        { $sort: { rank_numeric: 1 } },
        { $limit: limit },
        { $project: { _id: 0, game_url: 1, rank_numeric: 1 } },
      ])
      .toArray();

    return rows.map((r) => r.game_url);
  },
  ["top-game-urls-at-bucket"],
  { revalidate: 60 },
);
export async function getLatestSnapshotDate(opts: {
  platform: Platform;
  leaderboard: Leaderboard;
  gameUrl: string;
}): Promise<Date | null> {
  const { platform, leaderboard, gameUrl } = opts;
  const database = await db();

  const [row] = await database
    .collection("ranking_snapshots")
    .aggregate<{ latest: Date }>([
      {
        $match: {
          platform,
          leaderboard,
          game_url: gameUrl,
          rank_numeric: { $gte: 1, $lte: 50 },
        },
      },
      { $addFields: { snapshotDate: snapshotDateExpr } },
      { $match: { snapshotDate: { $ne: null } } },
      { $group: { _id: null, latest: { $max: "$snapshotDate" } } },
      { $project: { _id: 0, latest: 1 } },
      { $limit: 1 },
    ])
    .toArray();

  return row?.latest ?? null;
}

export async function getSnapshotBoundsForGame(opts: {
  platform: Platform;
  leaderboard: Leaderboard;
  gameUrl: string;
}): Promise<{ min: Date | null; max: Date | null }> {
  const { platform, leaderboard, gameUrl } = opts;
  const database = await db();

  const [row] = await database
    .collection("ranking_snapshots")
    .aggregate<{ min: Date; max: Date }>([
      {
        $match: {
          platform,
          leaderboard,
          game_url: gameUrl,
          rank_numeric: { $gte: 1, $lte: 50 },
        },
      },
      { $addFields: { snapshotDate: snapshotDateExpr } },
      { $match: { snapshotDate: { $ne: null } } },
      {
        $group: {
          _id: null,
          min: { $min: "$snapshotDate" },
          max: { $max: "$snapshotDate" },
        },
      },
      { $project: { _id: 0, min: 1, max: 1 } },
      { $limit: 1 },
    ])
    .toArray();

  return { min: row?.min ?? null, max: row?.max ?? null };
}

export async function getSnapshotBoundsForPlatforms(opts: {
  platforms: Platform[];
}): Promise<{ min: Date | null; max: Date | null }> {
  const { platforms } = opts;
  if (platforms.length === 0) return { min: null, max: null };

  const database = await db();
  const [row] = await database
    .collection("ranking_snapshots")
    .aggregate<{ min: Date; max: Date }>([
      {
        $match: {
          platform: { $in: platforms },
          rank_numeric: { $gte: 1, $lte: 50 },
        },
      },
      { $addFields: { snapshotDate: snapshotDateExpr } },
      { $match: { snapshotDate: { $ne: null } } },
      {
        $group: {
          _id: null,
          min: { $min: "$snapshotDate" },
          max: { $max: "$snapshotDate" },
        },
      },
      { $project: { _id: 0, min: 1, max: 1 } },
      { $limit: 1 },
    ])
    .toArray();

  return { min: row?.min ?? null, max: row?.max ?? null };
}

export async function getReleaseDateBounds(): Promise<{
  min: Date | null;
  max: Date | null;
}> {
  return getReleaseDateBoundsCached();
}

const getReleaseDateBoundsCached = unstable_cache(
  async (): Promise<{ min: Date | null; max: Date | null }> => {
    const database = await db();
    const [row] = await database
      .collection("game_catalog")
      .aggregate<{ min: Date; max: Date }>([
        { $addFields: { releaseAt: releaseDateExpr } },
        { $match: { releaseAt: { $ne: null } } },
        { $group: { _id: null, min: { $min: "$releaseAt" }, max: { $max: "$releaseAt" } } },
        { $project: { _id: 0, min: 1, max: 1 } },
        { $limit: 1 },
      ])
      .toArray();

    return { min: row?.min ?? null, max: row?.max ?? null };
  },
  ["release-date-bounds"],
  { revalidate: 300 },
);

export async function getNewReleases(opts: {
  start: Date;
  end: Date;
  limit?: number;
}): Promise<NewReleaseRow[]> {
  const { start, end, limit = 50 } = opts;
  return getNewReleasesCached(start.toISOString(), end.toISOString(), limit);
}

const getNewReleasesCached = unstable_cache(
  async (startIso: string, endIso: string, limit: number): Promise<NewReleaseRow[]> => {
    const start = new Date(startIso);
    const end = new Date(endIso);
    const database = await db();

    return database
      .collection("game_catalog")
      .aggregate<NewReleaseRow>([
        { $addFields: { releaseAt: releaseDateExpr } },
        { $match: { releaseAt: { $ne: null, $gte: start, $lte: end } } },
        { $sort: { releaseAt: -1 } },
        { $limit: limit },
        {
          $project: {
            _id: 0,
            platform: 1,
            game_url: 1,
            game_name_original: 1,
            game_name_vn_en: 1,
            game_image: 1,
            release_at: "$releaseAt",
          },
        },
      ])
      .toArray();
  },
  ["new-releases"],
  { revalidate: 300 },
);

export async function getWeeklyHighlights(opts: {
  platforms: Platform[];
  start: Date;
  end: Date;
  limit?: number;
}): Promise<WeeklyHighlightRow[]> {
  const { platforms, start, end, limit = 10 } = opts;
  if (platforms.length === 0) return [];

  return getWeeklyHighlightsCached(
    platforms.join("|"),
    start.toISOString(),
    end.toISOString(),
    limit,
  );
}

const getWeeklyHighlightsCached = unstable_cache(
  async (
    platformsKey: string,
    startIso: string,
    endIso: string,
    limit: number,
  ): Promise<WeeklyHighlightRow[]> => {
    const platforms = platformsKey.split("|").filter(Boolean) as Platform[];
    const start = new Date(startIso);
    const end = new Date(endIso);
    const database = await db();

    const hasLimit = Number.isFinite(limit) && limit > 0;

    const pipeline: object[] = [
      {
        $match: {
          platform: { $in: platforms },
          rank_numeric: { $gte: 1, $lte: 50 },
        },
      },
      { $addFields: { snapshotDate: snapshotDateExpr } },
      {
        $match: {
          snapshotDate: { $ne: null, $gte: start, $lte: end },
        },
      },
      {
        $addFields: {
          day: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$snapshotDate",
              timezone: MONGO_TIMEZONE,
            },
          },
        },
      },
      { $sort: { snapshotDate: 1 } },
      {
        $group: {
          _id: {
            platform: "$platform",
            leaderboard: "$leaderboard",
            game_url: "$game_url",
            day: "$day",
          },
          platform: { $first: "$platform" },
          leaderboard: { $first: "$leaderboard" },
          game_url: { $first: "$game_url" },
          day: { $first: "$day" },
          rank_numeric: { $last: "$rank_numeric" },
          snapshot_at: { $last: "$snapshotDate" },
        },
      },
      {
        $group: {
          _id: {
            platform: "$platform",
            leaderboard: "$leaderboard",
            game_url: "$game_url",
          },
          platform: { $first: "$platform" },
          leaderboard: { $first: "$leaderboard" },
          game_url: { $first: "$game_url" },
          best_rank: { $min: "$rank_numeric" },
          snapshot_at: { $max: "$snapshot_at" },
          hot_score: { $sum: { $subtract: [51, "$rank_numeric"] } },
        },
      },
      {
        $sort: {
          best_rank: 1,
          hot_score: -1,
          snapshot_at: -1,
        },
      },
    ];

    if (hasLimit) pipeline.push({ $limit: limit });

    pipeline.push({
      $project: {
        _id: 0,
        platform: 1,
        leaderboard: 1,
        game_url: 1,
        rank_numeric: "$best_rank",
        snapshot_at: 1,
        hot_score: 1,
      },
    });

    return database
      .collection("ranking_snapshots")
      .aggregate<WeeklyHighlightRow>(pipeline)
      .toArray();
  },
  ["weekly-highlights"],
  { revalidate: 60 },
);

export async function getGameCatalogByUrls(
  gameUrls: string[],
): Promise<GameCatalogDoc[]> {
  if (gameUrls.length === 0) return [];
  const database = await db();

  return database
    .collection("game_catalog")
    .find<GameCatalogDoc>({ game_url: { $in: gameUrls } })
    .toArray();
}

export async function getGameCatalogByUrl(
  gameUrl: string,
): Promise<GameCatalogDoc | null> {
  const database = await db();
  return database
    .collection("game_catalog")
    .findOne<GameCatalogDoc>({ game_url: gameUrl });
}

export async function getGameCatalogByPlatformUrl(opts: {
  platform: Platform;
  gameUrl: string;
}): Promise<GameCatalogDoc | null> {
  const database = await db();
  return database
    .collection("game_catalog")
    .findOne<GameCatalogDoc>({ platform: opts.platform, game_url: opts.gameUrl });
}

export async function getGameCatalogByPlatformUrls(opts: {
  pairs: Array<{ platform: Platform; game_url: string }>;
}): Promise<GameCatalogDoc[]> {
  const { pairs } = opts;
  if (pairs.length === 0) return [];
  const database = await db();

  const urlsByPlatform = new Map<Platform, string[]>();
  for (const pair of pairs) {
    const current = urlsByPlatform.get(pair.platform);
    if (current) current.push(pair.game_url);
    else urlsByPlatform.set(pair.platform, [pair.game_url]);
  }

  return database
    .collection("game_catalog")
    .find<GameCatalogDoc>({
      $or: Array.from(urlsByPlatform, ([platform, urls]) => ({
        platform,
        game_url: { $in: Array.from(new Set(urls)) },
      })),
    })
    .toArray();
}

export async function getGameNamesByPlatformUrls(opts: {
  pairs: Array<{ platform: Platform; game_url: string }>;
}): Promise<GameNameDoc[]> {
  const { pairs } = opts;
  if (pairs.length === 0) return [];
  const database = await db();

  const urlsByPlatform = new Map<Platform, string[]>();
  for (const pair of pairs) {
    const current = urlsByPlatform.get(pair.platform);
    if (current) current.push(pair.game_url);
    else urlsByPlatform.set(pair.platform, [pair.game_url]);
  }

  return database
    .collection("game_catalog")
    .find<GameNameDoc>(
      {
        $or: Array.from(urlsByPlatform, ([platform, urls]) => ({
          platform,
          game_url: { $in: Array.from(new Set(urls)) },
        })),
      },
      {
        projection: {
          _id: 0,
          platform: 1,
          game_url: 1,
          game_name_original: 1,
          game_name_vn_en: 1,
        },
      },
    )
    .toArray();
}

export async function getRankSeriesByDay(opts: {
  platform: Platform;
  leaderboard: Leaderboard;
  gameUrl: string;
  start: Date;
  end: Date;
}): Promise<{ day: string; rank: number }[]> {
  const { platform, leaderboard, gameUrl, start, end } = opts;
  const database = await db();

  return database
    .collection("ranking_snapshots")
    .aggregate<{ day: string; rank: number }>([
      {
        $match: {
          platform,
          leaderboard,
          game_url: gameUrl,
          rank_numeric: { $gte: 1, $lte: 50 },
        },
      },
      { $addFields: { snapshotDate: snapshotDateExpr } },
      { $match: { snapshotDate: { $gte: start, $lte: end } } },
      {
        $addFields: {
          day: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$snapshotDate",
              timezone: MONGO_TIMEZONE,
            },
          },
        },
      },
      { $sort: { snapshotDate: 1 } },
      {
        $group: {
          _id: "$day",
          day: { $first: "$day" },
          rank: { $last: "$rank_numeric" },
        },
      },
      { $sort: { day: 1 } },
      { $project: { _id: 0, day: 1, rank: 1 } },
    ])
    .toArray();
}

export async function getRankSeriesByDayForGames(opts: {
  platform: Platform;
  leaderboard: Leaderboard;
  gameUrls: string[];
  start: Date;
  end: Date;
}): Promise<{ day: string; game_url: string; rank: number }[]> {
  const { platform, leaderboard, gameUrls, start, end } = opts;
  if (gameUrls.length === 0) return [];

  const database = await db();
  return database
    .collection("ranking_snapshots")
    .aggregate<{ day: string; game_url: string; rank: number }>([
      {
        $match: {
          platform,
          leaderboard,
          game_url: { $in: gameUrls },
          rank_numeric: { $gte: 1, $lte: 50 },
        },
      },
      { $addFields: { snapshotDate: snapshotDateExpr } },
      { $match: { snapshotDate: { $gte: start, $lte: end } } },
      {
        $addFields: {
          day: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$snapshotDate",
              timezone: MONGO_TIMEZONE,
            },
          },
        },
      },
      { $sort: { snapshotDate: 1 } },
      {
        $group: {
          _id: { game_url: "$game_url", day: "$day" },
          game_url: { $first: "$game_url" },
          day: { $first: "$day" },
          rank: { $last: "$rank_numeric" },
        },
      },
      { $sort: { day: 1 } },
      { $project: { _id: 0, day: 1, game_url: 1, rank: 1 } },
    ])
    .toArray();
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function searchGameCatalog(opts: {
  query: string;
  queries?: string[];
  tokenGroups?: string[][];
  limit?: number;
}): Promise<GameCatalogDoc[]> {
  const { query, queries, tokenGroups, limit = 20 } = opts;
  const rawQueries = (queries && queries.length > 0 ? queries : [query])
    .map((q) => q.trim())
    .filter(Boolean);
  const uniqueQueries = Array.from(new Set(rawQueries));
  const cleanedGroups = (tokenGroups ?? [])
    .map((group) => group.map((q) => q.trim()).filter(Boolean))
    .filter((group) => group.length > 0);
  if (uniqueQueries.length === 0 && cleanedGroups.length === 0) return [];

  const database = await db();
  const buildOrFilters = (values: string[]) => {
    const regexes = values.map((q) => new RegExp(escapeRegExp(q), "i"));
    return regexes.flatMap((regex) => [
      { game_name_vn_en: regex },
      { game_name_original: regex },
      { game_url: regex },
      { category: regex },
      { genre: regex },
    ]);
  };

  let filter: Record<string, unknown> = {};
  if (cleanedGroups.length > 0) {
    const andFilters = cleanedGroups.map((group) => ({
      $or: buildOrFilters(group),
    }));
    filter = andFilters.length === 1 ? andFilters[0] : { $and: andFilters };
  } else {
    filter = { $or: buildOrFilters(uniqueQueries) };
  }

  return database
    .collection("game_catalog")
    .find<GameCatalogDoc>({
      ...filter,
    })
    .limit(limit)
    .toArray();
}
