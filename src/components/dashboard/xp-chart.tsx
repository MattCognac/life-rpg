"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Props {
  data: Array<{ date: string; xp: number }>;
}

export function XpChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="xpGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff8201" stopOpacity={0.6} />
            <stop offset="100%" stopColor="#dd6119" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a3030" vertical={false} />
        <XAxis
          dataKey="date"
          stroke="#6b7280"
          style={{ fontSize: "10px", fontFamily: "var(--font-inter)" }}
          tickLine={false}
          axisLine={{ stroke: "#2a3030" }}
        />
        <YAxis
          stroke="#6b7280"
          style={{ fontSize: "10px", fontFamily: "var(--font-inter)" }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#151a1a",
            border: "1px solid #dd6119",
            fontFamily: "var(--font-inter)",
            fontSize: "12px",
          }}
          labelStyle={{ color: "#c4b99a" }}
          itemStyle={{ color: "#ff8201" }}
        />
        <Area
          type="monotone"
          dataKey="xp"
          stroke="#dd6119"
          strokeWidth={2}
          fill="url(#xpGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
