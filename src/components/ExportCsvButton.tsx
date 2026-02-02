"use client";

import { useCallback } from "react";

type Props = {
  tableId: string;
  filename?: string;
  label?: string;
  className?: string;
};

function toCsvValue(value: string) {
  const needsQuotes = /[",\n\r]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

function extractCellText(cell: Element) {
  const text = cell.textContent ?? "";
  return text.replace(/\s+/g, " ").trim();
}

export function ExportCsvButton({
  tableId,
  filename,
  label = "Tải CSV",
  className,
}: Props) {
  const handleExport = useCallback(() => {
    const table = document.getElementById(tableId) as HTMLTableElement | null;
    if (!table) {
      alert("Không tìm thấy bảng để xuất CSV.");
      return;
    }

    const headerCells = Array.from(
      table.querySelectorAll<HTMLTableCellElement>("thead th"),
    );
    const headers = headerCells.map((cell) => extractCellText(cell));

    const bodyRows = Array.from(table.querySelectorAll("tbody tr"));
    const rows = bodyRows.map((row) => {
      const cells = Array.from(
        row.querySelectorAll<HTMLTableCellElement>("th, td"),
      );
      return cells.map((cell) => toCsvValue(extractCellText(cell)));
    });

    const csvLines: string[] = [];
    if (headers.length) {
      csvLines.push(headers.map((h) => toCsvValue(h)).join(","));
    }
    rows.forEach((row) => {
      if (row.length) csvLines.push(row.join(","));
    });

    if (csvLines.length === 0) {
      alert("Bảng hiện tại chưa có dữ liệu.");
      return;
    }

    const csvContent = `\ufeff${csvLines.join("\n")}`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename?.endsWith(".csv") ? filename : `${filename ?? tableId}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, [filename, tableId]);

  return (
    <button
      type="button"
      onClick={handleExport}
      className={
        className ??
        "inline-flex h-9 items-center gap-2 rounded-xl border border-sky-200/80 bg-white/90 px-3 text-xs font-semibold text-sky-700 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:text-sky-900 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-sky-200/60 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200 dark:hover:border-sky-400/50 dark:hover:text-sky-100 dark:focus:ring-sky-500/30"
      }
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3v12" />
        <path d="m7 10 5 5 5-5" />
        <path d="M5 21h14" />
      </svg>
      {label}
    </button>
  );
}
