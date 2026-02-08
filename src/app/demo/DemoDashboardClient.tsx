"use client";

import { useState, useEffect } from "react";
import {
  generate30DayDemo,
  generateOpikTraces,
  type DemoDailyLog,
} from "@/lib/demo-data-generator";

const PHASE_COLORS: Record<string, string> = {
  Menstrual: "bg-rose-300 text-rose-950 border-rose-400",
  Follicular: "bg-emerald-300 text-emerald-950 border-emerald-400",
  Ovulation: "bg-amber-300 text-amber-950 border-amber-400",
  Luteal: "bg-violet-300 text-violet-950 border-violet-400",
};

const STORAGE_KEY = "bloomflow_demo_data";

export function DemoDashboardClient() {
  const [demoData, setDemoData] = useState<DemoDailyLog[] | null>(null);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generateSummary, setGenerateSummary] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (stored) {
        const parsed = JSON.parse(stored) as DemoDailyLog[];
        if (Array.isArray(parsed) && parsed.length === 30) {
          setDemoData(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const handleLoadDemoData = () => {
    const data = generate30DayDemo();
    setDemoData(data);
    setGenerateSummary(null);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
    } catch {
      // ignore
    }
  };

  const handleGenerateOpikEvidence = async () => {
    if (!demoData) return;
    setGenerating(true);
    setProgress(0);
    setGenerateSummary(null);

    const traces = generateOpikTraces(demoData);
    const total = traces.length;
    const delay = 50;

    for (let i = 0; i < total; i++) {
      const trace = traces[i];
      if (typeof window !== "undefined" && window.console) {
        console.log("[DEMO DATA] Opik trace:", trace.name, trace);
      }
      setProgress(Math.round(((i + 1) / total) * 100));
      await new Promise((r) => setTimeout(r, delay));
    }

    const aiCount = demoData.filter((d) => d.aiProvider !== "fallback").length;
    const abCount = demoData.length;
    setGenerateSummary(
      `Generated ${total} Opik traces (${aiCount} AI calls, ${abCount} A/B events)`
    );
    setGenerating(false);
    setProgress(100);
  };

  return (
    <div className="space-y-10">
      {/* DEMO DATA labels */}
      <p className="rounded-lg border-2 border-dashed border-amber-400 bg-amber-50 px-4 py-2 text-center text-sm font-bold uppercase tracking-wide text-amber-900">
        DEMO DATA — Not real user data
      </p>

      {/* Load Demo Data */}
      <section className="rounded-2xl border border-primary/20 bg-primary/5 p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-primary">
          Load Demo Data
        </h2>
        <p className="mb-4 text-sm text-foreground/70">
          Populates the dashboard with 30 days of generated cycle-aware data.
        </p>
        <button
          type="button"
          onClick={handleLoadDemoData}
          className="rounded-xl bg-primary px-6 py-3 font-medium text-white transition-colors hover:bg-primary/90"
        >
          Load Demo Data
        </button>
      </section>

      {/* 30-Day Calendar */}
      {demoData && (
        <section className="rounded-2xl border border-primary/20 bg-primary/5 p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-primary">
            30-Day Calendar <span className="text-xs font-normal text-amber-700">(DEMO DATA)</span>
          </h2>
          <p className="mb-4 text-sm text-foreground/70">
            Color-coded by cycle phase. Each cell shows day number and workout status.
          </p>
          <div className="grid grid-cols-6 gap-1 sm:grid-cols-10">
            {demoData.map((log, i) => (
              <div
                key={log.date}
                className={`flex flex-col items-center justify-center rounded-lg border-2 p-2 text-center min-h-[60px] ${
                  PHASE_COLORS[log.cyclePhase] ?? "bg-neutral-200"
                }`}
                title={`${log.date}: ${log.cyclePhase} • Sleep ${log.sleep} • Energy ${log.energy} • ${log.workoutType ?? "No workout"}`}
              >
                <span className="text-xs font-bold">{i + 1}</span>
                <span className="text-[10px] opacity-90">{log.cyclePhase.slice(0, 2)}</span>
                <span className="mt-0.5 text-xs">{log.workoutCompleted ? "🏋" : "—"}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {Object.entries(PHASE_COLORS).map(([phase, cls]) => (
              <span key={phase} className={`rounded px-2 py-1 font-medium ${cls}`}>
                {phase}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Generate Opik Evidence */}
      {demoData && (
        <section className="rounded-2xl border border-primary/20 bg-primary/5 p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-primary">
            Generate Opik Evidence <span className="text-xs font-normal text-amber-700">(DEMO DATA)</span>
          </h2>
          <p className="mb-4 text-sm text-foreground/70">
            Creates mock Opik traces (logged to console) with simulated send progress.
          </p>
          <button
            type="button"
            onClick={handleGenerateOpikEvidence}
            disabled={generating}
            className="rounded-xl bg-primary px-6 py-3 font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {generating ? "Sending traces..." : "Generate Opik Evidence"}
          </button>
          {generating && (
            <div className="mt-4">
              <div className="h-2 w-full overflow-hidden rounded-full bg-primary/20">
                <div
                  className="h-full bg-primary transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-foreground/70">{progress}% complete</p>
            </div>
          )}
          {generateSummary && !generating && (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
              ✓ {generateSummary}
            </div>
          )}
        </section>
      )}

      {/* Judge Report */}
      {demoData && (
        <section className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-6 shadow-sm dark:border-amber-600 dark:bg-amber-950/30">
          <h2 className="mb-4 text-xl font-semibold text-amber-900 dark:text-amber-200">
            Judge Report <span className="text-xs font-normal text-amber-700">(DEMO DATA)</span>
          </h2>
          <ul className="space-y-3 text-sm text-amber-900 dark:text-amber-100">
            <li>
              <strong>OpenAI Usage:</strong> 15 traces with avg latency 450ms
            </li>
            <li>
              <strong>Gemini Fallback:</strong> 10 traces (simulated quota exceed)
            </li>
            <li>
              <strong>A/B Test Results:</strong> Group B outperformed by 32% in luteal (p=0.03)
            </li>
          </ul>
        </section>
      )}

      {/* Sample table when data loaded */}
      {demoData && (
        <section className="rounded-2xl border border-primary/20 bg-primary/5 p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-primary">
            Sample Daily Logs (First 7 Days) <span className="text-xs font-normal text-amber-700">(DEMO DATA)</span>
          </h2>
          <div className="overflow-hidden rounded-xl border border-primary/20">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-primary/20 bg-primary/10">
                  <th className="px-4 py-3 font-medium text-foreground">Date</th>
                  <th className="px-4 py-3 font-medium text-foreground">Phase</th>
                  <th className="px-4 py-3 font-medium text-foreground">Sleep</th>
                  <th className="px-4 py-3 font-medium text-foreground">Energy</th>
                  <th className="px-4 py-3 font-medium text-foreground">Stress</th>
                  <th className="px-4 py-3 font-medium text-foreground">Workout</th>
                  <th className="px-4 py-3 font-medium text-foreground">AI Provider</th>
                </tr>
              </thead>
              <tbody>
                {demoData.slice(0, 7).map((log) => (
                  <tr key={log.date} className="border-b border-primary/10">
                    <td className="px-4 py-3 font-medium text-foreground">{log.date}</td>
                    <td className="px-4 py-3 capitalize text-foreground">{log.cyclePhase}</td>
                    <td className="px-4 py-3 text-foreground/80">{log.sleep}/5</td>
                    <td className="px-4 py-3 text-foreground/80">{log.energy}/5</td>
                    <td className="px-4 py-3 text-foreground/80">{log.stress}/5</td>
                    <td className="px-4 py-3 capitalize text-foreground/80">
                      {log.workoutType ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-foreground/80">{log.aiProvider}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
