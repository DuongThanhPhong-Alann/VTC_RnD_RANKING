import { NextResponse } from "next/server";
import { getGameCatalogByPlatformUrls, type Platform } from "@/lib/queries";

type Pair = { platform: string; game_url: string };

function isPair(value: unknown): value is Pair {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.platform === "string" && typeof v.game_url === "string";
}

export async function POST(req: Request) {
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

  const images: Record<string, string | null> = {};
  for (const p of pairs) images[`${p.platform}||${p.game_url}`] = null;
  for (const d of docs) {
    const key = `${d.platform}||${d.game_url}`;
    images[key] = typeof d.game_image === "string" ? d.game_image : null;
  }

  return NextResponse.json({ images });
}

