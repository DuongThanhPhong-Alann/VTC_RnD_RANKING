import Link from "next/link";
import {
  eachDayOfInterval,
  endOfMonth,
  endOfDay,
  endOfWeek,
  format,
  isValid,
  parseISO,
  startOfDay,
  startOfWeek,
  startOfMonth,
  subMonths,
  subWeeks,
} from "date-fns";
import { Suspense } from "react";
import { GameFilters } from "@/components/GameFilters";
import { GameImagesProvider, GameThumb } from "@/components/GameImagesProvider";
import { LogoAI } from "@/components/LogoAI";
import { RankChart } from "@/components/RankChart";
import { SafeImage } from "@/components/SafeImage";
import { ExportCsvButton } from "@/components/ExportCsvButton";
import { applySheetSubstitutions, getSheetCache } from "@/lib/sheet-cache";
import {
  getGameCatalogByUrl,
  getGameCatalogByPlatformUrl,
  getPlatformsAndLeaderboards,
  getSnapshotBoundsForGame,
  getRankSeriesByDay,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function linkify(text: string) {
  const escaped = escapeHtml(text);
  const urlRegex = /\bhttps?:\/\/[^\s<]+/gi;
  return escaped.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank" rel="noreferrer" class="underline underline-offset-4 text-blue-700 hover:text-blue-900 dark:text-sky-300 dark:hover:text-sky-200">${url}</a>`;
  });
}

function pickString(value: SearchParams[string]): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function pickRange(value: SearchParams[string]): "week" | "month" {
  return value === "month" ? "month" : "week";
}

function pickPeriod(value: SearchParams[string]): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function formatYmd(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function formatYm(date: Date): string {
  return format(date, "yyyy-MM");
}

function buildWeekPeriods(minDate: Date, maxDate: Date, limit = 104) {
  const startMin = startOfWeek(minDate, { weekStartsOn: 1 });
  let cursor = startOfWeek(maxDate, { weekStartsOn: 1 });
  const out: Array<{
    value: string;
    label: string;
    start: Date;
    end: Date;
  }> = [];

  while (cursor >= startMin && out.length < limit) {
    const start = cursor;
    const end = endOfWeek(cursor, { weekStartsOn: 1 });
    const value = formatYmd(start);
    out.push({
      value,
      label: `${formatYmd(start)} → ${formatYmd(end)}`,
      start,
      end,
    });
    cursor = subWeeks(cursor, 1);
  }
  return out;
}

function buildMonthPeriods(minDate: Date, maxDate: Date, limit = 36) {
  const startMin = startOfMonth(minDate);
  let cursor = startOfMonth(maxDate);
  const out: Array<{
    value: string;
    label: string;
    start: Date;
    end: Date;
  }> = [];

  while (cursor >= startMin && out.length < limit) {
    const start = cursor;
    const end = endOfMonth(cursor);
    const value = formatYm(start);
    out.push({
      value,
      label: `${value} (${formatYmd(start)} → ${formatYmd(end)})`,
      start,
      end,
    });
    cursor = subMonths(cursor, 1);
  }
  return out;
}

function parseWeekStart(period: string): Date | null {
  const d = parseISO(period);
  if (!isValid(d)) return null;
  return startOfWeek(d, { weekStartsOn: 1 });
}

function parseMonthStart(period: string): Date | null {
  const d = parseISO(`${period}-01`);
  if (!isValid(d)) return null;
  return startOfMonth(d);
}

function formatMaybeDate(value: unknown, pattern = "yyyy-MM-dd HH:mm"): string | null {
  if (value == null) return null;
  if (value instanceof Date && isValid(value)) return format(value, pattern);
  if (typeof value === "string") {
    const d = new Date(value);
    if (isValid(d)) return format(d, pattern);
  }
  return null;
}

export default async function GamePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const gameUrl = pickString(resolvedSearchParams.url);
  if (!gameUrl) {
    return (
      <div className="card p-6">
        <h1 className="text-xl font-semibold tracking-tight">Thiếu tham số</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Mở từ TRANG BẢNG XẾP HẠNG để xem chi tiết.
        </p>
        <Link className="btn btn-primary mt-5 w-fit" href="/">
          Về TRANG CHỦ
        </Link>
      </div>
    );
  }

  const { platforms, leaderboardsByPlatform } =
    await getPlatformsAndLeaderboards();

  const requestedPlatform = pickString(resolvedSearchParams.platform);
  const platformFromQuery =
    requestedPlatform && platforms.includes(requestedPlatform)
      ? requestedPlatform
      : undefined;

  const gameFromUrl = platformFromQuery ? null : await getGameCatalogByUrl(gameUrl);
  const platform = platformFromQuery ?? gameFromUrl?.platform ?? platforms[0] ?? "taptap";
  const game =
    (await getGameCatalogByPlatformUrl({ platform, gameUrl })) ?? gameFromUrl;

  const leaderboards = leaderboardsByPlatform[platform] ?? [];
  const requestedLeaderboard = pickString(resolvedSearchParams.leaderboard);
  const leaderboard =
    (requestedLeaderboard && leaderboards.includes(requestedLeaderboard)
      ? requestedLeaderboard
      : undefined) ??
    leaderboards[0] ??
    "";

  const range = pickRange(pickString(resolvedSearchParams.range));
  const requestedPeriod = pickPeriod(resolvedSearchParams.period);

  const bounds = await getSnapshotBoundsForGame({ platform, leaderboard, gameUrl });
  const maxSnapshot = bounds.max ?? new Date();
  const minSnapshot =
    bounds.min ?? (range === "month" ? subMonths(maxSnapshot, 3) : subWeeks(maxSnapshot, 12));

  const weekPeriods = buildWeekPeriods(minSnapshot, maxSnapshot);
  const monthPeriods = buildMonthPeriods(minSnapshot, maxSnapshot);

  const selectedPeriod =
    range === "month"
      ? (requestedPeriod &&
          monthPeriods.some((p) => p.value === requestedPeriod) &&
          requestedPeriod) ||
        monthPeriods[0]?.value ||
        ""
      : (requestedPeriod &&
          weekPeriods.some((p) => p.value === requestedPeriod) &&
          requestedPeriod) ||
        weekPeriods[0]?.value ||
        "";

  const periodStart =
    range === "month"
      ? (selectedPeriod ? parseMonthStart(selectedPeriod) : null)
      : (selectedPeriod ? parseWeekStart(selectedPeriod) : null);
  const periodEnd =
    range === "month"
      ? (periodStart ? endOfMonth(periodStart) : null)
      : (periodStart ? endOfWeek(periodStart, { weekStartsOn: 1 }) : null);

  const start = startOfDay(periodStart ?? maxSnapshot);
  const end = endOfDay(periodEnd ?? maxSnapshot);

  const rawPoints = await getRankSeriesByDay({
    platform,
    leaderboard,
    gameUrl,
    start,
    end,
  });

  const rankByDay = new Map(rawPoints.map((p) => [p.day, p.rank]));
  const points = eachDayOfInterval({ start, end }).map((d) => {
    const day = format(d, "yyyy-MM-dd");
    return { day, rank: rankByDay.get(day) ?? null };
  });

  const sheetCache = await getSheetCache();
  const applyName = (value: string) => applySheetSubstitutions(value, sheetCache);

  const displayName = applyName(
    game?.game_name_vn_en ?? game?.game_name_original ?? gameUrl,
  );

  const genreText = Array.isArray(game?.genre)
    ? game.genre
        .filter((g) => typeof g === "string" && g.trim())
        .map((g) => applyName(g))
        .join(", ")
    : null;
  const releaseDateText =
    formatMaybeDate(game?.release_date, "yyyy-MM-dd") ??
    (typeof game?.release_date === "string" && game.release_date.trim()
      ? game.release_date
      : null);
  const fetchTimeText = formatMaybeDate(game?.fetch_time);
  const createdAtText = formatMaybeDate(game?.created_at);
  const updatedAtText = formatMaybeDate(game?.updated_at);

  const chips = [
    { label: "TRANG", value: game?.platform ? String(game.platform) : null },
    {
      label: "Thể loại",
      value: game?.category ? applyName(String(game.category)) : null,
    },
    { label: "Nhà phát triển", value: game?.developer ?? null },
    { label: "Nhà phát hành", value: game?.publisher ?? null },
    { label: "Tag", value: genreText },
    { label: "Đánh giá", value: game?.rating != null ? String(game.rating) : null },
    {
      label: "Tình trạng phát hành",
      value: game?.release_status ? String(game.release_status) : null,
    },
    { label: "Ngày phát hành", value: releaseDateText },
    { label: "Tạo lúc", value: createdAtText },
    { label: "Cập nhật lúc", value: updatedAtText },
  ].filter((r) => r.value && String(r.value).trim()) as Array<{
    label: string;
    value: string;
  }>;

  return (
    <div className="flex flex-col gap-6">
      <section className="card p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex gap-4">
            <GameImagesProvider pairs={[{ platform, game_url: gameUrl }]}>
              <GameThumb
                platform={platform}
                gameUrl={gameUrl}
                alt={displayName}
                width={96}
                height={96}
                className="h-24 w-24 shrink-0 rounded-2xl border border-zinc-200 object-cover shadow-sm dark:border-zinc-800"
                placeholder={
                  typeof game?.game_image === "string" && game.game_image.trim() ? (
                    <SafeImage
                      src={game.game_image}
                      alt={displayName}
                      width={96}
                      height={96}
                      className="h-24 w-24 shrink-0 rounded-2xl border border-zinc-200 object-cover shadow-sm dark:border-zinc-800"
                    />
                  ) : (
                    <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 text-sm font-semibold text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-400">
                      N/A
                    </div>
                  )
                }
              />
            </GameImagesProvider>

            <div className="min-w-0">
              <h1 className="text-xl font-semibold tracking-tight">
                {displayName}
              </h1>
              <div className="mt-1 break-all text-xs text-zinc-500 dark:text-zinc-400">
                <a
                  className="underline underline-offset-4 hover:text-zinc-900 dark:hover:text-zinc-50"
                  href={gameUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {gameUrl}
                </a>
              </div>

              {chips.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {chips.map((c) => (
                    <span key={c.label} className="chip">
                      {c.label}: <span className="font-semibold">{c.value}</span>
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="shrink-0">
            <div className="flex flex-col gap-3 md:items-end">
              <Link className="btn btn-ghost" href="/">
                ← Về TRANG CHỦ
              </Link>
            </div>
          </div>
        </div>
      </section>

      {game?.ai_note ? (
        <section className="card p-4">
          <details>
            <summary className="flex cursor-pointer list-none items-center gap-3">
              <LogoAI className="h-7 w-7 rounded-lg" size={28} />
              <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                Note
              </span>
              <span className="sr-only">Ghi chú AI</span>
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                className="h-4 w-4 text-zinc-500"
              >
                <path
                  d="M5 7l5 6 5-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </summary>
            <div
              className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300"
              dangerouslySetInnerHTML={{ __html: linkify(game.ai_note) }}
            />
          </details>
        </section>
      ) : null}

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
          <GameFilters
            platforms={platforms}
            leaderboardsByPlatform={leaderboardsByPlatform}
            platform={platform}
            leaderboard={leaderboard}
            range={range}
            period={selectedPeriod}
            periods={range === "month" ? monthPeriods : weekPeriods}
          />
        </Suspense>
      </section>

      <section className="card p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">Hạng theo ngày</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Trục X: ngày. Trục Y: hạng (1 tốt nhất, 50 thấp hơn).
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-start gap-2 sm:justify-end">
            <span className="chip chip-date">
              Kỳ:{" "}
              <span className="font-semibold">
                {range === "month" ? "Tháng" : "Tuần"}{" "}
                {range === "month" ? selectedPeriod : ""} ({formatYmd(start)} →{" "}
                {formatYmd(end)})
              </span>
            </span>
            <span className="chip">
              Dữ liệu mới nhất:{" "}
              <span className="font-semibold">
                {format(maxSnapshot, "yyyy-MM-dd HH:mm")}
              </span>
            </span>
          </div>
        </div>

        <div className="mt-4">
          <RankChart points={points} />
        </div>

        <div className="data-table-shell mt-5">
          <div className="flex items-center justify-end px-4 pt-4 pb-3">
            <ExportCsvButton
              tableId="game-rank-table"
              filename={`hang-theo-ngay-${platform}-${leaderboard}-${range}-${selectedPeriod}`}
            />
          </div>
          <table id="game-rank-table" className="data-table w-full border-collapse text-sm font-medium text-zinc-950 dark:text-zinc-50">
            <thead className="text-center text-xs font-bold uppercase tracking-wide text-sky-900 dark:text-sky-200">
              <tr>
                <th className="sticky top-0 bg-white/90 px-4 py-3 backdrop-blur dark:bg-zinc-950/75">
                  Ngày
                </th>
                <th className="sticky top-0 bg-white/90 px-4 py-3 backdrop-blur dark:bg-zinc-950/75">
                  Hạng
                </th>
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr
                  key={p.day}
                  className="border-t border-zinc-200/70 odd:bg-white even:bg-sky-50/70 hover:bg-sky-100/60 dark:border-zinc-800/70 dark:odd:bg-zinc-950/40 dark:even:bg-zinc-900/25 dark:hover:bg-sky-400/10"
                >
                  <td className="px-4 py-3 text-center tabular-nums">{p.day}</td>
                  <td className="px-4 py-3 text-center tabular-nums">
                    {p.rank == null ? (
                      <span className="text-zinc-400">-</span>
                    ) : (
                      <span className="inline-flex min-w-10 justify-center rounded-full bg-blue-600/10 px-2 py-1 font-semibold tabular-nums text-blue-700 dark:bg-sky-400/10 dark:text-sky-300">
                        {p.rank}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>


    </div>
  );
}

