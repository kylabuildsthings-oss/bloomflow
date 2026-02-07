"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const COLORS = { motivation_A: "#87A96B", motivation_B: "#CC7357" };
type ChartPoint = {
  name: string;
  phase: string;
  group: string;
  rate: number;
  total: number;
};

type SymptomRow = {
  phase: string;
  symptom: string;
  count: number;
};

export function AdminInsightsClient() {
  const [workoutData, setWorkoutData] = useState<ChartPoint[]>([]);
  const [symptomsData, setSymptomsData] = useState<SymptomRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/insights")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        setWorkoutData(data.workoutChartData ?? []);
        setSymptomsData(data.symptomsTableData ?? []);
      })
      .catch(() => {
        setWorkoutData([]);
        setSymptomsData([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-foreground/70">Loading insights...</p>;
  }

  return (
    <div className="space-y-12">
      <section>
        <h2 className="mb-4 text-lg font-semibold text-primary">
          Workout Completion Rate by Group & Cycle Phase
        </h2>
        <div className="h-80 w-full rounded-xl border border-primary/20 bg-background p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={workoutData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(135,169,107,0.2)" />
              <XAxis
                dataKey="name"
                tick={{ fill: "var(--foreground)", fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: "var(--foreground)", fontSize: 12 }}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--background)",
                  border: "1px solid rgba(135,169,107,0.3)",
                  borderRadius: "12px",
                }}
                formatter={(value: unknown) => [
                  `${Number(value ?? 0).toFixed(1)}%`,
                  "Completion rate",
                ]}
                labelFormatter={(label) => label}
              />
              <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                {workoutData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.group === "motivation_A" ? COLORS.motivation_A : COLORS.motivation_B}
                    opacity={0.9}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-primary">
          Most Frequent Symptoms by Cycle Phase
        </h2>
        <div className="overflow-hidden rounded-xl border border-primary/20">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-primary/20 bg-primary/5">
                <th className="px-4 py-3 font-medium text-foreground">Phase</th>
                <th className="px-4 py-3 font-medium text-foreground">Symptom</th>
                <th className="px-4 py-3 font-medium text-foreground">Count</th>
              </tr>
            </thead>
            <tbody>
              {symptomsData.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-foreground/60">
                    No symptom data yet
                  </td>
                </tr>
              ) : (
                symptomsData.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-primary/10 hover:bg-primary/5 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-foreground capitalize">{row.phase}</td>
                    <td className="px-4 py-3 text-foreground capitalize">{row.symptom}</td>
                    <td className="px-4 py-3 text-foreground/80">{row.count}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
