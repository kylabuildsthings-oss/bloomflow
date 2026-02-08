import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL ?? process.env.DEMO_USER_EMAIL ?? "demo@bloomflow.com";

const OPIK_API_KEY = process.env.OPIK_API_KEY ?? process.env.COMET_API_KEY;
const OPIK_WORKSPACE = process.env.OPIK_WORKSPACE_NAME ?? process.env.COMET_WORKSPACE;
const OPIK_URL = process.env.OPIK_URL_OVERRIDE ?? "https://www.comet.com/opik/api";
const PROJECT_NAME = process.env.OPIK_PROJECT_NAME ?? "bloomflow";

type TraceInput = {
  userId?: string;
  testGroup?: string | null;
  cyclePhase?: string;
  actionType?: string;
  [key: string]: unknown;
};

type TraceRecord = {
  id: string;
  name: string;
  input?: TraceInput;
};

/**
 * GET /api/admin/opik-metrics
 * Fetches traces from Opik and aggregates metrics for judge dashboard:
 * - Workout completion rate by cycle phase
 * - A vs B completion comparison
 * - AI suggestion acceptance rate
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!OPIK_API_KEY) {
      return NextResponse.json({
        workoutByPhase: [],
        abComparison: { motivation_A: { total: 0, withWorkout: 0 }, motivation_B: { total: 0, withWorkout: 0 } },
        aiAcceptanceRate: 0,
        error: "OPIK_API_KEY or COMET_API_KEY not configured",
      });
    }

    const url = new URL(`${OPIK_URL}/v1/private/traces`);
    url.searchParams.set("project_name", PROJECT_NAME);
    url.searchParams.set("size", "200");

    const headers: Record<string, string> = {
      Accept: "application/json",
      authorization: OPIK_API_KEY,
    };
    if (OPIK_WORKSPACE) {
      headers["Comet-Workspace"] = OPIK_WORKSPACE;
    }

    const res = await fetch(url.toString(), { headers });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({
        workoutByPhase: [],
        abComparison: { motivation_A: { total: 0, withWorkout: 0 }, motivation_B: { total: 0, withWorkout: 0 } },
        aiAcceptanceRate: 0,
        error: `Opik API error: ${res.status} ${text.slice(0, 200)}`,
      });
    }

    const data = (await res.json()) as {
      content?: TraceRecord[];
    };

    const allTraces = data.content ?? [];
    const userEventTraces = allTraces.filter(
      (t) => t.name === "logWorkout" || t.name === "daily_log_created"
    );
    const bloomGuideTraces = allTraces.filter((t) => t.name === "bloom_guide_ai");

    const phases = ["Menstrual", "Follicular", "Ovulation", "Luteal"] as const;
    const workoutByPhase: Record<string, { total: number; withWorkout: number }> = {};
    for (const p of phases) {
      workoutByPhase[p] = { total: 0, withWorkout: 0 };
    }

    let totalA = 0,
      withWorkoutA = 0,
      totalB = 0,
      withWorkoutB = 0;

    for (const t of userEventTraces) {
      const inp = t.input ?? {};
      const phase = (inp.cyclePhase ?? "Unknown") as string;
      const group = (inp.testGroup ?? "unknown") as string;
      const hasWorkout = t.name === "logWorkout";

      if (phases.includes(phase as (typeof phases)[number])) {
        workoutByPhase[phase].total += 1;
        if (hasWorkout) workoutByPhase[phase].withWorkout += 1;
      }

      if (group === "motivation_A") {
        totalA += 1;
        if (hasWorkout) withWorkoutA += 1;
      } else if (group === "motivation_B") {
        totalB += 1;
        if (hasWorkout) withWorkoutB += 1;
      }
    }

    const workoutByPhaseChart = phases.map((phase) => {
      const b = workoutByPhase[phase];
      const rate = b.total > 0 ? (b.withWorkout / b.total) * 100 : 0;
      return {
        phase,
        total: b.total,
        withWorkout: b.withWorkout,
        rate: Math.round(rate * 10) / 10,
      };
    });

    const totalCheckins = userEventTraces.length;
    const totalWorkouts = userEventTraces.filter((t) => t.name === "logWorkout").length;
    const aiAcceptanceRate =
      totalCheckins > 0 ? Math.round((totalWorkouts / totalCheckins) * 1000) / 10 : 0;

    return NextResponse.json({
      workoutByPhase: workoutByPhaseChart,
      abComparison: {
        motivation_A: { total: totalA, withWorkout: withWorkoutA },
        motivation_B: { total: totalB, withWorkout: withWorkoutB },
      },
      aiAcceptanceRate,
      bloomGuideCount: bloomGuideTraces.length,
      userEventCount: userEventTraces.length,
    });
  } catch (err) {
    return NextResponse.json({
      workoutByPhase: [],
      abComparison: { motivation_A: { total: 0, withWorkout: 0 }, motivation_B: { total: 0, withWorkout: 0 } },
      aiAcceptanceRate: 0,
      error: err instanceof Error ? err.message : "Failed to fetch Opik metrics",
    });
  }
}
