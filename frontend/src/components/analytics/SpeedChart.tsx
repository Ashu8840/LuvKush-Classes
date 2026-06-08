"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatDate } from "@/lib/utils";

type DataPoint = { date: string; wpm: number; accuracy?: number };

export function SpeedChart({ data }: { data: DataPoint[] }) {
  const chartData = data.map((d) => ({
    ...d,
    label: formatDate(d.date),
  }));

  if (!chartData.length) {
    return <p className="py-8 text-center text-sm text-muted">No speed data yet. Start practicing!</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-default" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            borderRadius: "12px",
            border: "1px solid var(--border)",
            background: "var(--card)",
            color: "var(--foreground)",
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="wpm"
          name="WPM"
          stroke="var(--color-primary)"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}