/* eslint-disable no-console */
const fs = require("node:fs/promises");
const path = require("node:path");
const { google } = require("googleapis");

const DEFAULT_SHEET_ID = "1f1Rhrg1fp_i4REE4wNEXl3CuMQ9KLS0OJPOCY_3uxxQ";
const DEFAULT_OUTPUT = path.join(process.cwd(), "data", "sheet-cache.json");

function parseSheetId(input) {
  if (!input) return null;
  if (/^[a-zA-Z0-9-_]+$/.test(input)) return input;
  const match = String(input).match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match?.[1] ?? null;
}

function normalizeKey(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function mapRows(rows, columns) {
  return rows
    .map((row) => {
      const out = {};
      for (const column of columns) {
        out[column.key] = row[column.index] ?? "";
      }
      return out;
    })
    .filter((row) => columns.some((col) => String(row[col.key]).trim().length > 0));
}

function buildMaps(entries, keyField, valueField) {
  const map = {};
  for (const row of entries) {
    const key = normalizeKey(row[keyField]);
    const value = String(row[valueField] ?? "").trim();
    if (!key || !value) continue;
    map[key] = value;
  }
  return map;
}

async function fetchSheetValues({ sheets, spreadsheetId, range }) {
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  return res.data.values ?? [];
}

async function main() {
  const sheetId =
    parseSheetId(process.env.SHEET_ID) ??
    parseSheetId(process.env.SHEET_URL) ??
    DEFAULT_SHEET_ID;

  const keyFile =
    process.env.GOOGLE_SERVICE_ACCOUNT_PATH ??
    path.join(process.cwd(), "webrankgame.json");

  const outputPath = process.env.SHEET_OUTPUT_PATH ?? DEFAULT_OUTPUT;

  const auth = new google.auth.GoogleAuth({
    keyFile,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  const termSheet = "Data thể loại";
  const gameSheet = "Data tên game";

  const termRows = await fetchSheetValues({
    sheets,
    spreadsheetId: sheetId,
    range: `${termSheet}!A:Z`,
  });
  const gameRows = await fetchSheetValues({
    sheets,
    spreadsheetId: sheetId,
    range: `${gameSheet}!A:Z`,
  });

  if (!termRows.length || !gameRows.length) {
    throw new Error("Sheet data is empty or missing.");
  }

  const [termHeader, ...termBody] = termRows;
  const [gameHeader, ...gameBody] = gameRows;

  const termColumns = [
    {
      key: "term",
      name: "THUẬT NGỮ",
    },
    {
      key: "meaning",
      name: "NGHĨA VN THƯỜNG DÙNG",
    },
  ];

  const gameColumns = [
    {
      key: "original",
      name: "game_name_original",
    },
    {
      key: "sub",
      name: "game_name_sub",
    },
  ];

  const resolveColumns = (header, columns) => {
    return columns.map((column) => {
      const index = header.findIndex(
        (cell) => String(cell ?? "").trim() === column.name,
      );
      if (index === -1) {
        throw new Error(`Missing column "${column.name}" in sheet.`);
      }
      return { ...column, index };
    });
  };

  const termResolved = resolveColumns(termHeader, termColumns);
  const gameResolved = resolveColumns(gameHeader, gameColumns);

  const terms = mapRows(termBody, termResolved);
  const gameNames = mapRows(gameBody, gameResolved);

  const cache = {
    updatedAt: new Date().toISOString(),
    source: {
      spreadsheetId: sheetId,
      sheetUrl: `https://docs.google.com/spreadsheets/d/${sheetId}`,
    },
    terms,
    gameNames,
    maps: {
      terms: buildMaps(terms, "term", "meaning"),
      gameNames: buildMaps(gameNames, "original", "sub"),
    },
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(cache, null, 2), "utf8");

  console.log(`Sheet cache written to ${outputPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
