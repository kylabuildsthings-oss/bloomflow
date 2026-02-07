"use client";

import { useEffect, useState, useCallback } from "react";
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

type Metrics = {
  aiSuggestionAcceptanceRate: number;
  phasePredictionAccuracy: number;
  abTestPValue: number | null;
  abTestSummary: {
    motivation_A: { total: number; withWorkout: number };
    motivation_B: { total: number; withWorkout: number };
  };
};

type TraceItem = {
  id: string;
  name: string;
  startTime?: string;
  input?: unknown;
  output?: unknown;
  metadata?: unknown;
};

function formatTraceChain(input: unknown, output: unknown): string {
  const parts: string[] = [];
  if (input && typeof input === "object") {
    const inp = input as Record<string, unknown>;
    if (inp.systemPrompt) parts.push(`System: ${String(inp.systemPrompt).slice(0, 300)}...`);
    if (inp.userMessage) parts.push(`User: ${JSON.stringify(inp.userMessage)}`);
    if (inp.metadata) parts.push(`Metadata: ${JSON.stringify(inp.metadata)}`);
  }
  if (output && typeof output === "object") {
    const out = output as Record<string, unknown>;
    if (out.suggestion) parts.push(`Suggestion: ${String(out.suggestion)}`);
    if (out.model) parts.push(`Model: ${out.model}`);
  } else if (output) {
    parts.push(`Output: ${JSON.stringify(output)}`);
  }
  return parts.join("\n\n") || "No chain of thought data";
}

export function AdminInsightsClient() {
  const [workoutData, setWorkoutData] = useState<ChartPoint[]>([]);
  const [symptomsData, setSymptomsData] = useState<SymptomRow[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [traces, setTraces] = useState<TraceItem[]>([]);
  const [tracesError, setTracesError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchInsights = useCallback(() => {
    fetch("/api/admin/insights")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        setWorkoutData(data.workoutChartData ?? []);
        setSymptomsData(data.symptomsTableData ?? []);
        setMetrics(data.metrics ?? null);
      })
      .catch(() => {
        setWorkoutData([]);
        setSymptomsData([]);
        setMetrics(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const fetchTraces = useCallback(() => {
    fetch("/api/admin/opik-traces")
      .then((res) => res.json())
      .then((data) => {
        setTraces(data.traces ?? []);
        setTracesError(data.error ?? null);
      })
      .catch(() => {
        setTraces([]);
        setTracesError("Failed to fetch traces");
      });
  }, []);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  useEffect(() => {
    fetchTraces();
    const interval = setInterval(fetchTraces, 15000); // Refresh traces every 15s
    return () => clearInterval(interval);
  }, [fetchTraces]);

  if (loading) {
    return <p className="text-foreground/70">Loading insights...</p>;
  }

  return (
    <div className="space-y-12">
      {/* Metrics */}
      {metrics && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-primary">Key Metrics</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-sm font-medium text-foreground/70">AI Suggestion Acceptance Rate</p>
              <p className="mt-1 text-2xl font-bold text-primary">
                {metrics.aiSuggestionAcceptanceRate}%
              </p>
              <p className="mt-1 text-xs text-foreground/60">
                % of check-ins where user logged a workout
              </p>
            </div>
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-sm font-medium text-foreground/70">Phase Prediction Accuracy</p>
              <p className="mt-1 text-2xl font-bold text-primary">
                {metrics.phasePredictionAccuracy}%
              </p>
              <p className="mt-1 text-xs text-foreground/60">
                % of logs with cycle phase populated
              </p>
            </div>
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-sm font-medium text-foreground/70">A/B Test p-value</p>
              <p className="mt-1 text-2xl font-bold text-primary">
                {metrics.abTestPValue != null
                  ? metrics.abTestPValue < 0.001
                    ? "<0.001"
                    : metrics.abTestPValue.toFixed(4)
                  : "N/A"}
              </p>
              <p className="mt-1 text-xs text-foreground/60">
                A: {metrics.abTestSummary.motivation_A.withWorkout}/{metrics.abTestSummary.motivation_A.total} workouts
                {" · "}
                B: {metrics.abTestSummary.motivation_B.withWorkout}/{metrics.abTestSummary.motivation_B.total}
              </p>
              {metrics.abTestPValue != null && (
                <p className="mt-2 text-xs text-foreground/60">
                  {metrics.abTestPValue < 0.05
                    ? "Statistically significant (p < 0.05)"
                    : "Not significant (p ≥ 0.05)"}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Opik Trace Viewer */}
      <section>
        <h2 className="mb-2 text-lg font-semibold text-primary">
          Real-time Opik Trace Viewer (Last 5 AI Suggestions)
        </h2>
        <p className="mb-4 text-sm text-foreground/60">
          Chain of thought for BloomGuide AI. Auto-refreshes every 15 seconds.
        </p>
        {tracesError && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
            {tracesError}
          </div>
        )}
        {traces.length === 0 && !tracesError ? (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-8 text-center text-foreground/60">
            No AI traces yet. Configure OPIK_API_KEY and generate suggestions to see chain of thought.
          </div>
        ) : (
          <div className="space-y-4">
            {traces.map((trace, i) => (
              <details
                key={trace.id}
                className="group rounded-xl border border-primary/20 bg-background overflow-hidden"
              >
                <summary className="cursor-pointer px-4 py-3 font-medium text-foreground hover:bg-primary/5 list-none flex items-center justify-between">
                  <span>
                    #{i + 1} {trace.name}
                    {trace.startTime && (
                      <span className="ml-2 text-sm font-normal text-foreground/60">
                        {new Date(trace.startTime).toLocaleString()}
                      </span>
                    )}
                  </span>
                  <span className="text-primary group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="border-t border-primary/20 px-4 py-3">
                  <pre className="whitespace-pre-wrap break-words text-xs text-foreground/90 font-mono max-h-64 overflow-y-auto">
                    {formatTraceChain(trace.input, trace.output)}
                  </pre>
                </div>
              </details>
            ))}
          </div>
        )}
      </section>

      {/* Workout Chart */}
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

      {/* Symptoms */}
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
