"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// ─── Subject Mastery Bar Chart ───
// Shows mastery percentage per subject with gradient bars

type SubjectData = {
  id: string;
  name: string;
  masteryPct: number;
  color: string | null;
  masteredConcepts: number;
  totalConcepts: number;
};

interface SubjectMasteryChartProps {
  subjects: SubjectData[];
}

const FALLBACK_COLORS = [
  "var(--coral)",
  "var(--blue)",
  "var(--teal)",
  "var(--purple)",
  "var(--yellow)",
  "var(--orange)",
  "var(--pink)",
  "var(--green)",
];

export function SubjectMasteryChart({ subjects }: SubjectMasteryChartProps) {
  if (subjects.length === 0) return null;

  const data = subjects.map((s, i) => ({
    name: s.name.length > 10 ? `${s.name.slice(0, 10)}…` : s.name,
    fullName: s.name,
    mastery: s.masteryPct,
    color: s.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length],
    mastered: s.masteredConcepts,
    total: s.totalConcepts,
  }));

  return (
    <div className="h-[200px] w-full sm:h-[240px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: 4, left: -24, bottom: 0 }}
          barCategoryGap="20%"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-muted/15"
            vertical={false}
          />
          <XAxis
            dataKey="name"
            className="text-[9.5px] font-bold text-muted-foreground"
            axisLine={false}
            tickLine={false}
            dy={6}
          />
          <YAxis
            domain={[0, 100]}
            className="text-[9px] font-bold text-muted-foreground"
            axisLine={false}
            tickLine={false}
            dx={-4}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
            contentStyle={{
              backgroundColor: "rgba(30, 41, 59, 0.85)",
              borderColor: "rgba(255, 255, 255, 0.08)",
              borderRadius: "14px",
              backdropFilter: "blur(8px)",
              color: "#fff",
              fontSize: "11.5px",
              boxShadow: "0 8px 20px -4px rgba(0, 0, 0, 0.15)",
            }}
            formatter={(value, _name, props) => {
              const payload = props?.payload;
              const mastered = payload?.mastered ?? 0;
              const total = payload?.total ?? 0;
              return [
                `${value}% (${mastered}/${total} konsep)`,
                payload?.fullName ?? "",
              ];
            }}
            labelFormatter={() => ""}
          />
          <Bar dataKey="mastery" radius={[8, 8, 0, 0]} maxBarSize={40}>
            {data.map((entry, idx) => (
              <Cell
                // biome-ignore lint/suspicious/noArrayIndexKey: static bar data
                key={idx}
                fill={entry.color}
                fillOpacity={0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Daily Progress Radial Chart ───
// Shows today's overall score as a radial gauge

interface DailyScoreGaugeProps {
  overallScore: number;
  challengeScore: number;
  materialsScore: number;
  reflectionsScore: number;
  masteryScore: number;
}

export function DailyScoreGauge({
  overallScore,
  challengeScore,
  materialsScore,
  reflectionsScore,
  masteryScore,
}: DailyScoreGaugeProps) {
  const data = [
    {
      name: "Skor Hari Ini",
      value: overallScore,
      fill: "var(--blue)",
    },
  ];

  const breakdown = [
    { label: "Tantangan", value: challengeScore, color: "var(--teal)" },
    { label: "Materi", value: materialsScore, color: "var(--yellow)" },
    { label: "Refleksi", value: reflectionsScore, color: "var(--coral)" },
    { label: "Penguasaan", value: masteryScore, color: "var(--purple)" },
  ];

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-6">
      {/* Radial gauge */}
      <div className="relative size-[140px] sm:size-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="75%"
            outerRadius="100%"
            startAngle={180}
            endAngle={0}
            data={data}
            barSize={14}
          >
            <PolarAngleAxis
              type="number"
              domain={[0, 100]}
              tick={false}
              angleAxisId={0}
            />
            <RadialBar
              background={{ fill: "rgba(255,255,255,0.05)" }}
              dataKey="value"
              cornerRadius={10}
              fill="var(--blue)"
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
          <span className="font-heading text-[28px] font-extrabold leading-none text-foreground sm:text-[32px]">
            {overallScore}
          </span>
          <span className="text-[10px] font-bold text-muted-foreground mt-0.5">
            / 100
          </span>
        </div>
      </div>

      {/* Breakdown bars */}
      <div className="flex-1 space-y-2.5 w-full min-w-0">
        {breakdown.map((item) => (
          <div key={item.label} className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-muted-foreground">
                {item.label}
              </span>
              <span className="font-extrabold tabular-nums text-foreground">
                {item.value}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted/30">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${item.value}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
