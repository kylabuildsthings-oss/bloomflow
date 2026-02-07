import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

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

    return NextResponse.json({
      workoutChartData,
      symptomsTableData,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
