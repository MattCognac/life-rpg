"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

interface Props {
  data: Array<{ skill: string; level: number }>;
}

export function SkillRadar({ data }: Props) {
  const maxLevel = Math.max(5, ...data.map((d) => d.level));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart data={data}>
        <PolarGrid stroke="#2a3030" />
        <PolarAngleAxis
          dataKey="skill"
          tick={{
            fill: "#c4b99a",
            fontSize: 10,
            fontFamily: "var(--font-cinzel-decorative)",
          }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, maxLevel]}
          tick={false}
          axisLine={false}
        />
        <Radar
          name="Level"
          dataKey="level"
          stroke="#dd6119"
          fill="#dd6119"
          fillOpacity={0.4}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
