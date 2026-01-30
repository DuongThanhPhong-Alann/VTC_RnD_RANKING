import "server-only";
import fs from "node:fs/promises";
import path from "node:path";

type SheetTermRow = {
  term: string;
  meaning: string;
};

type SheetGameNameRow = {
  original: string;
  sub: string;
};

export type SheetCache = {
  updatedAt: string;
  source: {
    spreadsheetId: string;
    sheetUrl: string;
  };
  terms: SheetTermRow[];
  gameNames: SheetGameNameRow[];
  maps: {
    terms: Record<string, string>;
    gameNames: Record<string, string>;
  };
};

type ReplacementRule = {
  key: string;
  value: string;
  regex: RegExp;
};

const DEFAULT_CACHE_PATH = path.join(process.cwd(), "data", "sheet-cache.json");
const cachePath = process.env.SHEET_CACHE_PATH ?? DEFAULT_CACHE_PATH;

let memoryCache: SheetCache | null = null;
let memoryLoadedAt = 0;
let cachedRules: ReplacementRule[] | null = null;
let cachedReverse: {
  terms: Record<string, string[]>;
  gameNames: Record<string, string[]>;
} | null = null;

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildReplacementRules(cache: SheetCache): ReplacementRule[] {
  const entries = [
    ...Object.entries(cache.maps.gameNames),
    ...Object.entries(cache.maps.terms),
  ];

  return entries
    .filter(([key, value]) => key && value)
    .sort((a, b) => b[0].length - a[0].length)
    .map(([key, value]) => ({
      key,
      value,
      regex: new RegExp(escapeRegExp(key), "gi"),
    }));
}

function buildReverseMap(map: Record<string, string>) {
  const reverse: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(map)) {
    const normalizedValue = normalizeKey(value);
    if (!normalizedValue) continue;
    if (!reverse[normalizedValue]) reverse[normalizedValue] = [];
    reverse[normalizedValue].push(key);
  }
  return reverse;
}

async function readCacheFromFile(): Promise<SheetCache | null> {
  try {
    const raw = await fs.readFile(cachePath, "utf8");
    const data = JSON.parse(raw) as SheetCache;
    return data;
  } catch {
    return null;
  }
}

export async function getSheetCache(options?: { maxAgeMs?: number }) {
  const maxAgeMs = options?.maxAgeMs ?? 5 * 60 * 1000;
  const now = Date.now();
  if (memoryCache && now - memoryLoadedAt < maxAgeMs) return memoryCache;

  const data = await readCacheFromFile();
  if (data) {
    memoryCache = data;
    memoryLoadedAt = now;
    cachedRules = null;
    cachedReverse = null;
  }
  return memoryCache;
}

export function applySheetSubstitutions(
  input: string,
  cache: SheetCache | null | undefined,
): string {
  if (!input || !cache) return input;

  const normalized = normalizeKey(input);
  const exactGame = cache.maps.gameNames[normalized];
  if (exactGame) return exactGame;
  const exactTerm = cache.maps.terms[normalized];
  if (exactTerm) return exactTerm;

  if (!cachedRules) cachedRules = buildReplacementRules(cache);

  let output = input;
  for (const rule of cachedRules) {
    if (rule.regex.test(output)) {
      output = output.replace(rule.regex, rule.value);
    }
  }

  return output;
}

export function findReverseMatches(
  input: string,
  cache: SheetCache | null | undefined,
): string[] {
  if (!input || !cache) return [];
  if (!cachedReverse) {
    cachedReverse = {
      terms: buildReverseMap(cache.maps.terms),
      gameNames: buildReverseMap(cache.maps.gameNames),
    };
  }
  const normalized = normalizeKey(input);
  const matches = new Set<string>();
  for (const value of cachedReverse.terms[normalized] ?? []) {
    matches.add(value);
  }
  for (const value of cachedReverse.gameNames[normalized] ?? []) {
    matches.add(value);
  }
  return Array.from(matches);
}
