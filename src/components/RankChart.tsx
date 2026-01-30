"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type RankChartPoint = { day: string; rank: number | null };

type Props = {
  points: RankChartPoint[];
  height?: number;
};

export function RankChart({ points, height = 320 }: Props) {
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
            domain={[1, 50]}
            reversed
            allowDecimals={false}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            formatter={(value) => (value == null ? "-" : `Hạng ${value}`)}
            labelFormatter={(label) => `Ngày ${label}`}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid rgb(161 161 170 / 0.35)",
              background: "var(--background)",
              color: "var(--foreground)",
              boxShadow: "0 8px 30px rgb(0 0 0 / 0.08)",
            }}
          />
          <Line
            type="monotone"
            dataKey="rank"
            strokeWidth={2.25}
            stroke="currentColor"
            dot={{ r: 2, fill: "currentColor", stroke: "currentColor" }}
            activeDot={{ r: 4 }}
            connectNulls={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
