"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type MultiRankSeries = {
  key: string;
  label: string;
  color: string;
};

export type MultiRankPoint = {
  day: string;
  [seriesKey: string]: number | string | null;
};

type Props = {
  points: MultiRankPoint[];
  series: MultiRankSeries[];
  height?: number;
  maxRank?: number;
};

export function MultiRankChart({
  points,
  series,
  height = 360,
  maxRank = 50,
}: Props) {
  const showLegend = series.length <= 12;
  const nonNullCounts = new Map<string, number>();
  for (const p of points) {
    for (const s of series) {
      if (p[s.key] != null) {
        nonNullCounts.set(s.key, (nonNullCounts.get(s.key) ?? 0) + 1);
      }
    }
  }

  return (
    <div
      style={{ height }}
      className="w-full min-w-0 text-blue-600 dark:text-sky-400"
    >
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={0}
        minHeight={height}
        initialDimension={{ width: 1, height }}
      >
        <LineChart data={points} margin={{ top: 10, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.18} />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 12 }}
            interval="preserveStartEnd"
            minTickGap={20}
          />
          <YAxis
            domain={[1, maxRank]}
            reversed
            allowDecimals={false}
            tick={{ fontSize: 12 }}
            ticks={[1, maxRank]}
          />
          <Tooltip
            formatter={(value, name) => {
              if (value == null) return ["-", String(name)];
              return [`Hạng ${value}`, String(name)];
            }}
            labelFormatter={(label) => `Ngày ${label}`}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid rgb(161 161 170 / 0.35)",
              background: "var(--background)",
              color: "var(--foreground)",
              boxShadow: "0 8px 30px rgb(0 0 0 / 0.08)",
            }}
          />

          {showLegend ? (
            <Legend
              verticalAlign="top"
              height={28}
              iconType="plainline"
              wrapperStyle={{ fontSize: 12 }}
            />
          ) : null}

          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              dot={
                (nonNullCounts.get(s.key) ?? 0) <= 1
                  ? { r: 2.5, fill: s.color, stroke: s.color }
                  : false
              }
              activeDot={{ r: 4 }}
              connectNulls={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
