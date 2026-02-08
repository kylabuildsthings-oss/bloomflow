"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  hasDemoData,
  getDemoDataFromStorage,
  getOpikDemoTracesFromStorage,
  deriveMetricsFromDemoData,
} from "@/lib/admin-demo-utils";
import { generateOpikTraces } from "@/lib/demo-data-generator";
import { exportJudgeReportPdf } from "@/lib/export-judge-report";
import type { MockTraceEntry } from "@/lib/mock-opik";

const COLORS = { motivation_A: "#87A96B", motivation_B: "#CC7357" };
const PHASE_COLORS = ["#87A96B", "#9AB87A", "#B5C99A", "#7B8C6B"];

type ChartPoint = {
  name: string;
  phase: string;
  group: string;
  rate: number;
  total: number;
};

type OpikPhasePoint = { phase: string; rate: number; total: number; withWorkout: number };

type OpikMetrics = {
  workoutByPhase: OpikPhasePoint[];
  abComparison: {
    motivation_A: { total: number; withWorkout: number };
    motivation_B: { total: number; withWorkout: number };
  };
  aiAcceptanceRate: number;
  bloomGuideCount: number;
  userEventCount: number;
  error?: string;
  dummyData?: boolean;
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
  const [opikMetrics, setOpikMetrics] = useState<OpikMetrics | null>(null);
  const [symptomsData, setSymptomsData] = useState<SymptomRow[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [traces, setTraces] = useState<TraceItem[]>([]);
  const [tracesError, setTracesError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [opikTestResult, setOpikTestResult] = useState<{ ok: boolean; error?: string } | null>(null);
  const [opikTestLoading, setOpikTestLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"real" | "demo">("real");
  const [demoDataExists, setDemoDataExists] = useState(false);

  const fetchInsights = useCallback(() => {
    Promise.all([
      fetch("/api/admin/insights").then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch("/api/admin/opik-metrics").then((r) => r.json()).catch(() => null),
    ]).then(([insights, opik]) => {
      if (insights) {
        setWorkoutData(insights.workoutChartData ?? []);
        setSymptomsData(insights.symptomsTableData ?? []);
        setMetrics(insights.metrics ?? null);
      } else {
        setWorkoutData([]);
        setSymptomsData([]);
        setMetrics(null);
      }
      setOpikMetrics(opik ?? null);
      setLoading(false);
    });
  }, []);

  const testOpikConnection = useCallback(() => {
    setOpikTestLoading(true);
    setOpikTestResult(null);
    fetch("/api/admin/opik-test", { method: "POST" })
      .then((r) => r.json())
      .then((data) => setOpikTestResult({ ok: data.ok, error: data.error }))
      .catch(() => setOpikTestResult({ ok: false, error: "Request failed" }))
      .finally(() => setOpikTestLoading(false));
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

  useEffect(() => {
    setDemoDataExists(hasDemoData());
  }, [viewMode, loading]);

  const demoData = getDemoDataFromStorage();
  const demoMetrics = demoData ? deriveMetricsFromDemoData(demoData) : null;

  const isViewingDemo = viewMode === "demo" && demoMetrics;

  const aiRate = isViewingDemo
    ? demoMetrics.aiAcceptanceRate
    : opikMetrics?.aiAcceptanceRate ?? metrics?.aiSuggestionAcceptanceRate ?? 0;
  const abData = isViewingDemo ? demoMetrics.abComparison : (opikMetrics?.abComparison ?? metrics?.abTestSummary);
  const phaseData: OpikPhasePoint[] = isViewingDemo
    ? demoMetrics.phaseData
    : (opikMetrics?.workoutByPhase?.length
      ? opikMetrics.workoutByPhase
      : (() => {
          const byPhase: Record<string, { total: number; withWorkout: number }> = {};
          for (const d of workoutData) {
            if (!byPhase[d.phase]) byPhase[d.phase] = { total: 0, withWorkout: 0 };
            const w = Math.round((d.rate / 100) * d.total);
            byPhase[d.phase].total += d.total;
            byPhase[d.phase].withWorkout += w;
          }
          return Object.entries(byPhase).map(([phase, { total, withWorkout }]) => ({
            phase,
            total,
            withWorkout,
            rate: total > 0 ? (withWorkout / total) * 100 : 0,
          }));
        })());

  const abChartData = abData
    ? [
        {
          name: "Group A",
          value: abData.motivation_A.total > 0
            ? Math.round((abData.motivation_A.withWorkout / abData.motivation_A.total) * 100)
            : 0,
          total: abData.motivation_A.total,
          withWorkout: abData.motivation_A.withWorkout,
          fill: COLORS.motivation_A,
        },
        {
          name: "Group B",
          value: abData.motivation_B.total > 0
            ? Math.round((abData.motivation_B.withWorkout / abData.motivation_B.total) * 100)
            : 0,
          total: abData.motivation_B.total,
          withWorkout: abData.motivation_B.withWorkout,
          fill: COLORS.motivation_B,
        },
      ].filter((d) => d.total > 0)
    : [];

  const handleExportJudgeReport = useCallback(() => {
    const data = getDemoDataFromStorage();
    const metrics = data ? deriveMetricsFromDemoData(data) : demoMetrics;
    if (!metrics) return;
    let traces: MockTraceEntry[] = getOpikDemoTracesFromStorage();
    if (traces.length === 0 && data) {
      const generated = generateOpikTraces(data);
      traces = generated.map((t) => ({
        name: t.name,
        timestamp: new Date().toISOString(),
        ...t.input,
        ...t.output,
      }));
    }
    exportJudgeReportPdf(metrics, traces, true);
  }, [demoMetrics]);

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-primary/20 bg-primary/5">
        <p className="text-foreground/70">Loading insights from Opik & Supabase...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* View Real Data | View Demo Data toggle */}
      {demoDataExists && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-600 dark:bg-amber-950/30">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
            Demo data detected in localStorage. Switch view:
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setViewMode("real")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === "real"
                  ? "bg-primary text-white"
                  : "bg-white text-foreground hover:bg-primary/10 dark:bg-primary/20"
              }`}
            >
              View Real Data
            </button>
            <button
              type="button"
              onClick={() => setViewMode("demo")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === "demo"
                  ? "bg-amber-600 text-white"
                  : "bg-white text-foreground hover:bg-amber-100 dark:bg-primary/20 dark:hover:bg-amber-900/50"
              }`}
            >
              View Demo Data
            </button>
            {viewMode === "demo" && (
              <button
                type="button"
                onClick={handleExportJudgeReport}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
              >
                Export Judge Report
              </button>
            )}
          </div>
        </div>
      )}

      {/* DEMO watermark when viewing demo */}
      {isViewingDemo && (
        <div className="rounded-lg border-2 border-amber-400 bg-amber-50 px-4 py-2 text-center text-sm font-bold uppercase tracking-wide text-amber-900 dark:border-amber-500 dark:bg-amber-950/50 dark:text-amber-200">
          DEMO — 30-day trends from demo data
        </div>
      )}

      {/* Opik data source badge */}
      {opikMetrics && !isViewingDemo && (
        <p className="text-xs text-foreground/50">
          Charts powered by Opik traces • {opikMetrics.userEventCount ?? 0} user events •{" "}
          {opikMetrics.bloomGuideCount ?? 0} AI suggestions
        </p>
      )}
      {opikMetrics?.dummyData && !isViewingDemo && (
        <div className="rounded-lg border-2 border-dashed border-primary/40 bg-primary/10 px-4 py-2 text-sm text-primary dark:bg-primary/20">
          <strong>Sample data</strong> — Charts show illustrative data when real data is sparse. Add check-ins and AI suggestions to see live metrics.
        </div>
      )}
      {opikMetrics?.error && !opikMetrics?.dummyData && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          {opikMetrics.error} — Using Supabase data as fallback.
        </div>
      )}

      {/* Key Metrics */}
      <section className={isViewingDemo ? "relative" : ""}>
        {isViewingDemo && (
          <div
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center opacity-10"
            aria-hidden
          >
            <span className="text-6xl font-bold uppercase tracking-widest text-amber-600">DEMO</span>
          </div>
        )}
        <h2 className="mb-4 text-xl font-semibold text-primary">
          Key Metrics {isViewingDemo && <span className="text-sm font-normal text-amber-600">(DEMO DATA)</span>}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 p-6 shadow-sm">
            <p className="text-sm font-medium text-foreground/70 uppercase tracking-wide">
              AI Suggestion Acceptance
            </p>
            <p className="mt-2 text-3xl font-bold text-primary">{aiRate}%</p>
            <p className="mt-1 text-xs text-foreground/60">
              % of check-ins where user logged a workout
            </p>
          </div>
          {!isViewingDemo && metrics && (
            <>
              <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 p-6 shadow-sm">
                <p className="text-sm font-medium text-foreground/70 uppercase tracking-wide">
                  Phase Prediction
                </p>
                <p className="mt-2 text-3xl font-bold text-primary">
                  {metrics.phasePredictionAccuracy}%
                </p>
                <p className="mt-1 text-xs text-foreground/60">% of logs with cycle phase</p>
              </div>
              <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 p-6 shadow-sm">
                <p className="text-sm font-medium text-foreground/70 uppercase tracking-wide">
                  A/B Test p-value
                </p>
                <p className="mt-2 text-3xl font-bold text-primary">
                  {metrics.abTestPValue != null
                    ? metrics.abTestPValue < 0.001
                      ? "<0.001"
                      : metrics.abTestPValue.toFixed(4)
                    : "N/A"}
                </p>
                <p className="mt-1 text-xs text-foreground/60">
                  {metrics.abTestPValue != null &&
                    (metrics.abTestPValue < 0.05 ? "Significant" : "Not significant")}
                </p>
              </div>
            </>
          )}
          {isViewingDemo && demoMetrics && (
            <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 p-6 shadow-sm">
              <p className="text-sm font-medium text-foreground/70 uppercase tracking-wide">
                A/B Test p-value
              </p>
              <p className="mt-2 text-3xl font-bold text-primary">
                {demoMetrics.abTestPValue < 0.001
                  ? "<0.001"
                  : demoMetrics.abTestPValue.toFixed(4)}
              </p>
              <p className="mt-1 text-xs text-foreground/60">
                {demoMetrics.abTestPValue < 0.05 ? "Significant" : "Not significant"}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Opik Trace Viewer */}
      <section>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-primary">
              Real-time Opik Trace Viewer (Last 5 AI Suggestions)
            </h2>
            <p className="mt-1 text-sm text-foreground/60">
              Chain of thought for BloomGuide AI. Auto-refreshes every 15 seconds.
            </p>
          </div>
          <button
            type="button"
            onClick={testOpikConnection}
            disabled={opikTestLoading}
            className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 disabled:opacity-50"
          >
            {opikTestLoading ? "Testing..." : "Test Opik Connection"}
          </button>
        </div>
        {opikTestResult && (
          <div
            className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
              opikTestResult.ok
                ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200"
                : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
            }`}
          >
            {opikTestResult.ok
              ? "✓ Connection successful. Sample trace sent to Opik."
              : `✗ Connection failed: ${opikTestResult.error ?? "Unknown error"}`}
          </div>
        )}
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

      {/* Chart 1: Workout Completion Rate by Cycle Phase */}
      <section className={isViewingDemo ? "relative" : ""}>
        {isViewingDemo && (
          <div
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center opacity-10"
            aria-hidden
          >
            <span className="text-6xl font-bold uppercase tracking-widest text-amber-600">DEMO</span>
          </div>
        )}
        <h2 className="mb-4 text-xl font-semibold text-primary">
          1. Workout Completion Rate by Cycle Phase
          {isViewingDemo && <span className="ml-2 text-sm font-normal text-amber-600">(DEMO DATA)</span>}
        </h2>
        <p className="mb-4 text-sm text-foreground/60">
          From Opik traces (logWorkout, daily_log_created). Higher = more users completing workouts in that phase.
        </p>
        <div className="h-80 w-full rounded-2xl border border-primary/20 bg-white p-6 shadow-sm dark:bg-background">
          {phaseData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={phaseData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(135,169,107,0.2)" />
                <XAxis
                  dataKey="phase"
                  tick={{ fill: "var(--foreground)", fontSize: 13, fontWeight: 500 }}
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
                  formatter={(value: unknown, _: unknown, props: unknown) => {
                    const p = (props as { payload?: { total?: number; withWorkout?: number } })?.payload;
                    const extra = p ? ` (${p.withWorkout ?? 0}/${p.total ?? 0})` : "";
                    return [`${Number(value ?? 0).toFixed(1)}%`, `Workout rate${extra}`];
                  }}
                />
                <Bar dataKey="rate" radius={[8, 8, 0, 0]} name="Completion rate">
                  {phaseData.map((_, i) => (
                    <Cell key={i} fill={PHASE_COLORS[i % PHASE_COLORS.length]} opacity={0.9} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-foreground/50">
              No phase data yet. Log check-ins with Opik configured to see charts.
            </div>
          )}
        </div>
      </section>

      {/* Chart 2: A vs B Comparison */}
      <section className={isViewingDemo ? "relative" : ""}>
        {isViewingDemo && (
          <div
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center opacity-10"
            aria-hidden
          >
            <span className="text-6xl font-bold uppercase tracking-widest text-amber-600">DEMO</span>
          </div>
        )}
        <h2 className="mb-4 text-xl font-semibold text-primary">
          2. Workout Completion: Group A vs Group B
          {isViewingDemo && <span className="ml-2 text-sm font-normal text-amber-600">(DEMO DATA)</span>}
        </h2>
        <p className="mb-4 text-sm text-foreground/60">
          A/B test comparison. Group A: encouraging tone. Group B: nurturing tone.
        </p>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-72 rounded-2xl border border-primary/20 bg-white p-6 shadow-sm dark:bg-background">
            {abChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={abChartData} layout="vertical" margin={{ left: 80, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(135,169,107,0.2)" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 13 }} />
                  <Tooltip
                    formatter={(value: unknown, _: unknown, props: unknown) => {
                      const p = (props as { payload?: { total?: number; withWorkout?: number } })?.payload;
                      return [`${Number(value ?? 0)}%`, p ? `${p.withWorkout ?? 0}/${p.total ?? 0} workouts` : "Completion rate"];
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {abChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} opacity={0.9} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-foreground/50">
                No A/B data yet.
              </div>
            )}
          </div>
          {abData && (
            <div className="flex flex-col justify-center rounded-2xl border border-primary/20 bg-primary/5 p-6">
              <h3 className="mb-4 font-medium text-foreground">Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium" style={{ color: COLORS.motivation_A }}>
                    Group A
                  </span>
                  <span>
                    {abData.motivation_A.withWorkout}/{abData.motivation_A.total} workouts
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium" style={{ color: COLORS.motivation_B }}>
                    Group B
                  </span>
                  <span>
                    {abData.motivation_B.withWorkout}/{abData.motivation_B.total} workouts
                  </span>
                </div>
                {(isViewingDemo ? demoMetrics?.abTestPValue != null : metrics?.abTestPValue != null) && (
                  <p className="mt-4 border-t border-primary/20 pt-4 text-xs text-foreground/60">
                    p-value: {(isViewingDemo ? demoMetrics!.abTestPValue : metrics!.abTestPValue)! < 0.001
                      ? "<0.001"
                      : (isViewingDemo ? demoMetrics!.abTestPValue : metrics!.abTestPValue)!.toFixed(4)}
                    {(isViewingDemo ? demoMetrics!.abTestPValue : metrics!.abTestPValue)! < 0.05 ? " (significant)" : " (not significant)"}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Chart 3: AI Suggestion Acceptance (visual) */}
      <section className={isViewingDemo ? "relative" : ""}>
        {isViewingDemo && (
          <div
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center opacity-10"
            aria-hidden
          >
            <span className="text-6xl font-bold uppercase tracking-widest text-amber-600">DEMO</span>
          </div>
        )}
        <h2 className="mb-4 text-xl font-semibold text-primary">
          3. AI Suggestion Acceptance Rate
          {isViewingDemo && <span className="ml-2 text-sm font-normal text-amber-600">(DEMO DATA)</span>}
        </h2>
        <p className="mb-4 text-sm text-foreground/60">
          % of daily check-ins where the user logged a workout (proxy for acting on AI suggestions).
        </p>
        <div className="rounded-2xl border border-primary/20 bg-white p-6 shadow-sm dark:bg-background">
          <div className="flex items-center gap-8">
            <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <span className="text-2xl font-bold text-primary">{aiRate}%</span>
            </div>
            <div>
              <p className="text-sm text-foreground/70">
                Users who receive BloomGuide AI suggestions and then log a workout within their
                daily check-in show higher engagement. This metric reflects adoption of AI coaching.
              </p>
              {opikMetrics?.bloomGuideCount != null && opikMetrics.bloomGuideCount > 0 && (
                <p className="mt-2 text-xs text-foreground/50">
                  {opikMetrics.bloomGuideCount} AI suggestions served • {opikMetrics.userEventCount} check-ins logged
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Legacy Workout Chart by Group & Phase (Supabase) - kept for judges who want detail */}
      {workoutData.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold text-primary">
            Workout Rate by Group & Phase (Supabase)
          </h2>
          <div className="h-80 w-full rounded-2xl border border-primary/20 bg-white p-6 shadow-sm dark:bg-background">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workoutData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(135,169,107,0.2)" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "var(--foreground)", fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  formatter={(value: unknown) => [`${Number(value ?? 0).toFixed(1)}%`, "Completion rate"]}
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
      )}

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
