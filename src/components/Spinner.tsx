"use client";

type Props = {
  label?: string;
  size?: number;
  className?: string;
};

export function Spinner({ label = "Đang tải…", size = 16, className }: Props) {
  return (
    <div className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <span
        aria-hidden="true"
        className="inline-block animate-spin rounded-full border-2 border-blue-200 border-t-blue-600 dark:border-sky-500/25 dark:border-t-sky-400"
        style={{ width: size, height: size }}
      />
      <span className="text-xs text-zinc-600 dark:text-zinc-400">{label}</span>
    </div>
  );
}

