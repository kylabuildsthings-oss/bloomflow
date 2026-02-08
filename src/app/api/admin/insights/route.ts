import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  DUMMY_WORKOUT_CHART_DATA,
  DUMMY_SYMPTOMS_TABLE,
  DUMMY_METRICS,
} from "@/lib/admin-dummy-data";

/** Two-proportion z-test for A/B significance. Returns p-value (two-tailed). */
function computeTwoProportionPValue(
  x1: number,
  n1: number,
  x2: number,
  n2: number
): number | null {
  if (n1 < 1 || n2 < 1) return null;
  const p1 = x1 / n1;
  const p2 = x2 / n2;
  const pPooled = (x1 + x2) / (n1 + n2);
  const se = Math.sqrt(pPooled * (1 - pPooled) * (1 / n1 + 1 / n2));
  if (se < 1e-10) return null;
  const z = Math.abs(p1 - p2) / se;
  const t = 1 / (1 + 0.2316419 * z);
  const d =
    0.3989423 *
    Math.exp((-z * z) / 2) *
    t *
    (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return Math.min(1, Math.max(0, 2 * (1 - d)));
}

const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL ?? process.env.DEMO_USER_EMAIL ?? "demo@bloomflow.com";

/**
 * GET /api/admin/insights
 * Aggregated data for admin dashboard. Protected - only admin user can access.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase is not configured" },
        { status: 503 }
      );
    }

    const { data: logs } = await supabase
      .from("daily_logs")
      .select("id, user_id, date, workout_type, symptoms, cycle_phase")
      .order("date", { ascending: false });

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, test_group");

    const profileMap = new Map(profiles?.map((p) => [p.id, p]) ?? []);

    const logsWithGroup = (logs ?? [])
      .map((log) => ({
        ...log,
        test_group: profileMap.get(log.user_id)?.test_group ?? "unknown",
      }))
      .filter((l) => l.test_group === "motivation_A" || l.test_group === "motivation_B");

    const phases = ["Menstrual", "Follicular", "Ovulation", "Luteal"] as const;

    // Workout completion rate by group and phase
    const workoutByGroupPhase: Record<string, Record<string, { total: number; withWorkout: number }>> = {
      motivation_A: {},
      motivation_B: {},
    };

    for (const phase of phases) {
      workoutByGroupPhase.motivation_A[phase] = { total: 0, withWorkout: 0 };
      workoutByGroupPhase.motivation_B[phase] = { total: 0, withWorkout: 0 };
    }

    for (const log of logsWithGroup) {
      const phase = log.cycle_phase ?? "Unknown";
      if (phase === "Unknown" || !workoutByGroupPhase[log.test_group]?.[phase]) continue;

      const bucket = workoutByGroupPhase[log.test_group][phase];
      bucket.total += 1;
      if (log.workout_type) bucket.withWorkout += 1;
    }

    const workoutChartData = phases.flatMap((phase) => [
      {
        name: `A - ${phase}`,
        phase,
        group: "motivation_A",
        rate:
          workoutByGroupPhase.motivation_A[phase].total > 0
            ? (workoutByGroupPhase.motivation_A[phase].withWorkout /
                workoutByGroupPhase.motivation_A[phase].total) *
              100
            : 0,
        total: workoutByGroupPhase.motivation_A[phase].total,
      },
      {
        name: `B - ${phase}`,
        phase,
        group: "motivation_B",
        rate:
          workoutByGroupPhase.motivation_B[phase].total > 0
            ? (workoutByGroupPhase.motivation_B[phase].withWorkout /
                workoutByGroupPhase.motivation_B[phase].total) *
              100
            : 0,
        total: workoutByGroupPhase.motivation_B[phase].total,
      },
    ]);

    // Symptoms per phase
    const symptomsByPhase: Record<string, Record<string, number>> = {};
    for (const phase of phases) {
      symptomsByPhase[phase] = {};
    }
    symptomsByPhase.Unknown = {};

    for (const log of logsWithGroup) {
      const phase = log.cycle_phase ?? "Unknown";
      if (!log.symptoms?.trim()) continue;

      const symptoms = log.symptoms
        .split(/[,;]+/)
        .map((s: string) => s.trim().toLowerCase())
        .filter((s: string) => s.length > 0);

      if (!symptomsByPhase[phase]) symptomsByPhase[phase] = {};
      for (const s of symptoms) {
        symptomsByPhase[phase][s] = (symptomsByPhase[phase][s] ?? 0) + 1;
      }
    }

    const symptomsTableData = phases.flatMap((phase) => {
      const counts = symptomsByPhase[phase] ?? {};
      const entries = Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);
      return entries.map(([symptom, count]) => ({
        phase,
        symptom,
        count,
      }));
    });

    // A/B test: workout completion by group for p-value
    let totalA = 0,
      withWorkoutA = 0,
      totalB = 0,
      withWorkoutB = 0;
    for (const log of logsWithGroup) {
      if (log.test_group === "motivation_A") {
        totalA += 1;
        if (log.workout_type) withWorkoutA += 1;
      } else if (log.test_group === "motivation_B") {
        totalB += 1;
        if (log.workout_type) withWorkoutB += 1;
      }
    }

    const pValue = computeTwoProportionPValue(withWorkoutA, totalA, withWorkoutB, totalB);

    // Phase Prediction Accuracy: % of logs with cycle_phase populated
    const logsWithPhase = logsWithGroup.filter((l) => l.cycle_phase && l.cycle_phase !== "Unknown");
    const phasePredictionAccuracy =
      logsWithGroup.length > 0
        ? (logsWithPhase.length / logsWithGroup.length) * 100
        : 0;

    // AI Suggestion Acceptance Rate: logs with workout / total logs (proxy: user acted on suggestion)
    const totalLogs = logsWithGroup.length;
    const logsWithWorkout = logsWithGroup.filter((l) => l.workout_type);
    const aiSuggestionAcceptanceRate =
      totalLogs > 0 ? (logsWithWorkout.length / totalLogs) * 100 : 0;

    const hasRealData = totalLogs >= 5 || logsWithWorkout.length > 0;

    const workoutChartDataOut = hasRealData ? workoutChartData : DUMMY_WORKOUT_CHART_DATA;
    const symptomsTableDataOut = hasRealData
      ? symptomsTableData
      : DUMMY_SYMPTOMS_TABLE;
    const metricsOut = hasRealData
      ? {
          aiSuggestionAcceptanceRate: Math.round(aiSuggestionAcceptanceRate * 10) / 10,
          phasePredictionAccuracy: Math.round(phasePredictionAccuracy * 10) / 10,
          abTestPValue: pValue,
          abTestSummary: {
            motivation_A: { total: totalA, withWorkout: withWorkoutA },
            motivation_B: { total: totalB, withWorkout: withWorkoutB },
          },
        }
      : DUMMY_METRICS;

    return NextResponse.json({
      workoutChartData: workoutChartDataOut,
      symptomsTableData: symptomsTableDataOut,
      metrics: metricsOut,
      ...(hasRealData ? {} : { dummyData: true }),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
