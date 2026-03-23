import { NextResponse } from "next/server";
import { getGameCatalogByPlatformUrls, type Platform } from "@/lib/queries";
import { getDb } from "@/lib/mongodb";

type Pair = { platform: string; game_url: string };

function isPair(value: unknown): value is Pair {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.platform === "string" && typeof v.game_url === "string";
}

function normalizeLookupUrl(raw: string): string | null {
  const input = String(raw ?? "").trim();
  if (!input) return null;
  try {
    const u = new URL(input);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;

    // Ignore query/hash differences for image lookup.
    const pathname = u.pathname.replace(/\/+$/, "");
    const normalizedPath = pathname || "/";
    const host = u.host.toLowerCase().replace(/^www\./, "");
    // Force protocol to https for canonical matching.
    return `https://${host}${normalizedPath}`;
  } catch {
    return null;
  }
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildUrlRegexFromNormalized(normalized: string): RegExp | null {
  // normalized format: protocol//host/path-without-trailing-slash
  const marker = "://";
  const i = normalized.indexOf(marker);
  if (i < 0) return null;
  const afterProtocol = normalized.slice(i + marker.length);
  const slashIndex = afterProtocol.indexOf("/");
  if (slashIndex < 0) return null;

  const host = afterProtocol.slice(0, slashIndex);
  const path = afterProtocol.slice(slashIndex);
  const safeHost = escapeRegex(host);
  const safePath = escapeRegex(path);

  // Match both with and without query/hash suffix.
  const hostPattern = `(?:www\\.)?${safeHost}`;
  return new RegExp(`^https?://${hostPattern}${safePath}(?:\\?.*)?(?:#.*)?$`, "i");
}

export async function POST(req: Request) {
  const apiKey = process.env.PUBLIC_API_KEY;
  if (apiKey) {
    const headerKey = req.headers.get("x-api-key");
    if (!headerKey || headerKey !== apiKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rawPairs = (payload as Record<string, unknown>)?.pairs;
  if (!Array.isArray(rawPairs)) {
    return NextResponse.json({ error: "Missing pairs[]" }, { status: 400 });
  }

  const pairs = rawPairs.filter(isPair).slice(0, 500);
  if (pairs.length === 0) {
    return NextResponse.json({ images: {} });
  }

  const docs = await getGameCatalogByPlatformUrls({
    pairs: pairs.map((p) => ({ platform: p.platform as Platform, game_url: p.game_url })),
  });

  const resolvedExact = new Set(docs.map((d) => `${d.platform}||${d.game_url}`));
  const fallbackPairs = pairs.filter((p) => !resolvedExact.has(`${p.platform}||${p.game_url}`));

  const fallbackDocs = (() => {
    if (fallbackPairs.length === 0) return Promise.resolve([] as typeof docs);

    const clauses: Array<{ platform: string; game_url: { $regex: RegExp } }> = [];
    for (const p of fallbackPairs) {
      const canonical = normalizeLookupUrl(p.game_url);
      if (!canonical) continue;
      const regex = buildUrlRegexFromNormalized(canonical);
      if (!regex) continue;
      clauses.push({ platform: p.platform, game_url: { $regex: regex } });
    }
    if (clauses.length === 0) return Promise.resolve([] as typeof docs);

    return getDb().then((database) =>
      database
        .collection("game_catalog")
        .find<{ platform: string; game_url: string; game_image?: string | null }>({ $or: clauses })
        .toArray(),
    );
  })();

  const allDocs = [...docs, ...(await fallbackDocs)];

  const images: Record<string, string | null> = {};
  const exactDocsByKey = new Map<string, (typeof allDocs)[number]>();
  const docsByCanonical = new Map<string, (typeof allDocs)[number]>();

  for (const d of allDocs) {
    const exactKey = `${d.platform}||${d.game_url}`;
    exactDocsByKey.set(exactKey, d);

    const canonical = normalizeLookupUrl(d.game_url);
    if (canonical) {
      const canonicalKey = `${d.platform}||${canonical}`;
      if (!docsByCanonical.has(canonicalKey)) {
        docsByCanonical.set(canonicalKey, d);
      }
    }
  }

  for (const p of pairs) {
    const requestKey = `${p.platform}||${p.game_url}`;
    const exact = exactDocsByKey.get(requestKey);
    if (exact) {
      images[requestKey] =
        typeof exact.game_image === "string" ? exact.game_image : null;
      continue;
    }

    const canonical = normalizeLookupUrl(p.game_url);
    if (!canonical) {
      images[requestKey] = null;
      continue;
    }

    const fallback = docsByCanonical.get(`${p.platform}||${canonical}`);
    images[requestKey] =
      fallback && typeof fallback.game_image === "string"
        ? fallback.game_image
        : null;
  }

  return NextResponse.json({ images });
}

