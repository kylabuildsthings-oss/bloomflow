/**
 * Utilities for admin insights when viewing demo data.
 * Derives chart metrics from DemoDailyLog[] stored in localStorage.
 */

import type { DemoDailyLog } from "./demo-data-generator";
import type { MockTraceEntry } from "./mock-opik";

const DEMO_STORAGE_KEY = "bloomflow_demo_data";
const OPIK_DEMO_STORAGE_KEY = "opik_demo_traces";

export function hasDemoData(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const demo = localStorage.getItem(DEMO_STORAGE_KEY);
    const opik = localStorage.getItem(OPIK_DEMO_STORAGE_KEY);
    if (demo) {
      const parsed = JSON.parse(demo);
      if (Array.isArray(parsed) && parsed.length === 30) return true;
    }
    if (opik) {
      const parsed = JSON.parse(opik);
      if (Array.isArray(parsed) && parsed.length > 0) return true;
    }
  } catch {
    // ignore
  }
  return false;
}

export function getDemoDataFromStorage(): DemoDailyLog[] | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(DEMO_STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as unknown;
    if (Array.isArray(parsed) && parsed.length === 30) {
      return parsed as DemoDailyLog[];
    }
  } catch {
    // ignore
  }
  return null;
}

export function getOpikDemoTracesFromStorage(): MockTraceEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(OPIK_DEMO_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as unknown;
    if (Array.isArray(parsed)) return parsed as MockTraceEntry[];
  } catch {
    // ignore
  }
  return [];
}

export type DemoDerivedMetrics = {
  phaseData: { phase: string; rate: number; total: number; withWorkout: number }[];
  abComparison: {
    motivation_A: { total: number; withWorkout: number };
    motivation_B: { total: number; withWorkout: number };
  };
  aiAcceptanceRate: number;
  bloomGuideCount: number;
  userEventCount: number;
  abTestPValue: number;
  aiProviderTimeline: { openai: number; gemini: number; fallback: number };
};

export function deriveMetricsFromDemoData(data: DemoDailyLog[]): DemoDerivedMetrics {
  const byPhase: Record<string, { total: number; withWorkout: number }> = {};
  const byGroup: Record<"motivation_A" | "motivation_B", { total: number; withWorkout: number }> = {
    motivation_A: { total: 0, withWorkout: 0 },
    motivation_B: { total: 0, withWorkout: 0 },
  };
  const aiProviderCounts = { openai: 0, gemini: 0, fallback: 0 };

  for (const log of data) {
    if (!byPhase[log.cyclePhase]) byPhase[log.cyclePhase] = { total: 0, withWorkout: 0 };
    byPhase[log.cyclePhase].total += 1;
    if (log.workoutCompleted) byPhase[log.cyclePhase].withWorkout += 1;

    const group = log.testGroup === "A" ? "motivation_A" : "motivation_B";
    byGroup[group].total += 1;
    if (log.workoutCompleted) byGroup[group].withWorkout += 1;

    aiProviderCounts[log.aiProvider] += 1;
  }

  const phaseData = Object.entries(byPhase).map(([phase, { total, withWorkout }]) => ({
    phase,
    total,
    withWorkout,
    rate: total > 0 ? (withWorkout / total) * 100 : 0,
  }));

  const workoutsTotal = data.filter((d) => d.workoutCompleted).length;
  const aiAcceptanceRate = data.length > 0 ? (workoutsTotal / data.length) * 100 : 0;

  // A/B p-value: use demo fixture (Group B outperformed 32% in luteal, p=0.03)
  const abTestPValue = 0.03;

  return {
    phaseData,
    abComparison: byGroup,
    aiAcceptanceRate,
    bloomGuideCount: data.filter((d) => d.aiProvider !== "fallback").length,
    userEventCount: data.length,
    abTestPValue,
    aiProviderTimeline: aiProviderCounts,
  };
}
