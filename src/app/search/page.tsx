import Link from "next/link";
import { SafeImage } from "@/components/SafeImage";
import { searchGameCatalog } from "@/lib/queries";
import {
  applySheetSubstitutions,
  findReverseMatches,
  getSheetCache,
} from "@/lib/sheet-cache";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function pickString(value: SearchParams[string]): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const query = pickString(resolvedSearchParams.q) ?? "";
  const sheetCache = await getSheetCache();
  const applyName = (value: string) => applySheetSubstitutions(value, sheetCache);
  const mappedQuery = query.trim() ? applyName(query) : "";
  const baseQueries = [query, mappedQuery].map((q) => q.trim()).filter(Boolean);
  const reverseQueries = baseQueries.flatMap((q) =>
    findReverseMatches(q, sheetCache).map((value) => value.trim()),
  );
  const searchQueries = Array.from(
    new Set([...baseQueries, ...reverseQueries].filter(Boolean)),
  );
  const tokens = query
    .split(/[,+]/g)
    .map((token) => token.trim())
    .filter(Boolean);
  const tokenGroups =
    tokens.length > 1
      ? tokens.map((token) => {
        const mappedToken = applyName(token);
        const baseTokenQueries = [token, mappedToken]
          .map((value) => value.trim())
          .filter(Boolean);
        const reverseTokenQueries = baseTokenQueries.flatMap((value) =>
          findReverseMatches(value, sheetCache).map((match) => match.trim()),
        );
        return Array.from(
          new Set([...baseTokenQueries, ...reverseTokenQueries].filter(Boolean)),
        );
      })
      : [];

  const results = searchQueries.length > 0 || tokenGroups.length > 0
    ? await searchGameCatalog({
      query,
      queries: searchQueries,
      tokenGroups,
      limit: 30,
    })
    : [];

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Tìm game</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Nhập tên game, thể loại, tag (hoặc URL). Có thể ghép nhiều tag/điều
              kiện bằng dấu + hoặc dấu phẩy.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-start gap-2 sm:justify-end">
            {query.trim() ? (
              <span className="chip chip-primary">
                Từ khóa: <span className="font-semibold">{query}</span>
              </span>
            ) : null}
            <span className="chip">
              Kết quả: <span className="font-semibold">{results.length}</span>
            </span>
          </div>
        </div>
      </section>

      <section className="card p-4">
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="section-title">Tìm kiếm</div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            Enter để tìm
          </div>
        </div>

        <form action="/search" method="get" className="flex gap-3">
          <input
            className="control w-full"
            name="q"
            defaultValue={query}
            placeholder="VD: 王者荣耀, Idle, https://..."
          />
          <button className="btn btn-primary shrink-0" type="submit">
            Tìm
          </button>
        </form>
      </section>

      <section className="card overflow-hidden">
        {results.length === 0 ? (
          <div className="p-6 text-sm text-zinc-600 dark:text-zinc-400">
            {query.trim()
              ? "Không tìm thấy game nào."
              : "Nhập từ khóa để bắt đầu tìm."}
          </div>
        ) : (
          <ul className="divide-y divide-zinc-200/70 dark:divide-zinc-800/70">
            {results.map((g) => {
              const displayName = applyName(
                g.game_name_vn_en ?? g.game_name_original ?? "",
              );
              const title = displayName || g.game_url;
              const href = `/game?url=${encodeURIComponent(
                g.game_url,
              )}&platform=${encodeURIComponent(g.platform)}`;

              return (
                <li key={g._id} className="p-4 hover:bg-blue-50/40 dark:hover:bg-sky-400/10">
                  <Link className="flex gap-4" href={href}>
                    <div className="shrink-0">
                      {typeof g.game_image === "string" && g.game_image.trim() ? (
                        <SafeImage
                          src={g.game_image}
                          alt={title}
                          width={56}
                          height={56}
                          className="h-14 w-14 rounded-xl border border-zinc-200 object-cover shadow-sm dark:border-zinc-800"
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-400">
                          N/A
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-medium text-zinc-950 dark:text-zinc-50">
                          {title}
                        </div>
                        <span className="chip chip-platform">
                          Trang:{" "}
                          <span className="font-semibold">{g.platform}</span>
                        </span>
                      </div>

                      <div className="mt-1 break-all text-xs text-zinc-500 dark:text-zinc-400">
                        {g.game_url}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
