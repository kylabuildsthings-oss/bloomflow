import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { runCycleEngine } from "@/lib/services/cycleEngine";
import { runBloomGuideAI } from "@/lib/services/bloomGuideAI";

type CycleData = {
  lastPeriodStart?: string | null;
  averageCycleLength?: number | null;
  fitnessGoal?: string | null;
};

/**
 * GET /api/ai/coach
 * Returns BloomGuide AI workout suggestion based on cycle phase, latest log, and profile.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase is not configured" },
        { status: 503 }
      );
    }

    // Fetch profile (id, cycle_data, test_group)
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, cycle_data, test_group")
      .eq("email", session.user.email)
      .single();

    const cycleData = (profile?.cycle_data ?? {}) as CycleData;
    const lastPeriodStart = cycleData.lastPeriodStart ?? null;
    const averageCycleLength = cycleData.averageCycleLength ?? 28;
    const fitnessGoal = cycleData.fitnessGoal ?? null;
    const testGroup = profile?.test_group ?? "motivation_A";

    // Fetch latest daily_log
    let latestLog: { sleep?: number; energy?: number; stress?: number } | null =
      null;
    if (profile?.id) {
      const { data: latestLogRow } = await supabase
        .from("daily_logs")
        .select("sleep_quality, energy, stress")
        .eq("user_id", profile.id)
        .order("date", { ascending: false })
        .limit(1)
        .single();

      if (latestLogRow) {
        latestLog = {
          sleep: latestLogRow.sleep_quality ?? undefined,
          energy: latestLogRow.energy ?? undefined,
          stress: latestLogRow.stress ?? undefined,
        };
      }
    }

    // Run cycle engine
    const { currentPhase } = await runCycleEngine(
      lastPeriodStart,
      averageCycleLength
    );

    // Run BloomGuide AI
    const result = await runBloomGuideAI({
      currentPhase,
      latestLog,
      fitnessGoal,
      testGroup,
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
