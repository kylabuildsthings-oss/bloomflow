import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { runCycleEngine } from "@/lib/services/cycleEngine";
import { logUserEvent } from "@/lib/opik";

const ratingSchema = { min: 1, max: 5 };

function isValidRating(value: unknown): value is number {
  return typeof value === "number" && value >= ratingSchema.min && value <= ratingSchema.max;
}

const MENSTRUAL_FLOW_VALUES = ["none", "light", "medium", "heavy", "spotting"] as const;

function parseLogBody(body: unknown) {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const menstrualFlow =
    typeof b.menstrual_flow === "string" && MENSTRUAL_FLOW_VALUES.includes(b.menstrual_flow as (typeof MENSTRUAL_FLOW_VALUES)[number])
      ? (b.menstrual_flow as (typeof MENSTRUAL_FLOW_VALUES)[number])
      : undefined;
  return {
    date: typeof b.date === "string" ? b.date : null,
    menstrual_flow: menstrualFlow,
    sleep_quality: typeof b.sleep_quality === "number" ? b.sleep_quality : undefined,
    energy: typeof b.energy === "number" ? b.energy : undefined,
    stress: typeof b.stress === "number" ? b.stress : undefined,
    workout_type: typeof b.workout_type === "string" ? b.workout_type : undefined,
    workout_rating: typeof b.workout_rating === "number" ? b.workout_rating : undefined,
    symptoms: typeof b.symptoms === "string" ? b.symptoms : undefined,
  };
}

/**
 * POST /api/logs
 * Accepts JSON log data, saves to daily_logs, logs to Opik
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const demoEmail = process.env.DEMO_USER_EMAIL ?? "demo@bloomflow.com";
    if (session.user.email === demoEmail) {
      return NextResponse.json(
        { error: "Demo account cannot save check-ins. Sign up for an account to track your data." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = parseLogBody(body);
    if (!parsed || !parsed.date) {
      return NextResponse.json(
        { error: "Invalid request body. Required: date (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const { menstrual_flow, sleep_quality, energy, stress, workout_type, workout_rating, symptoms } =
      parsed;

    if (sleep_quality !== undefined && !isValidRating(sleep_quality)) {
      return NextResponse.json(
        { error: "sleep_quality must be between 1 and 5" },
        { status: 400 }
      );
    }
    if (energy !== undefined && !isValidRating(energy)) {
      return NextResponse.json(
        { error: "energy must be between 1 and 5" },
        { status: 400 }
      );
    }
    if (stress !== undefined && !isValidRating(stress)) {
      return NextResponse.json(
        { error: "stress must be between 1 and 5" },
        { status: 400 }
      );
    }
    if (workout_rating !== undefined && !isValidRating(workout_rating)) {
      return NextResponse.json(
        { error: "workout_rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY." },
        { status: 503 }
      );
    }

    // Get or create profile by email (assign random test_group on create)
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id, test_group, cycle_data")
      .eq("email", session.user.email)
      .single();

    let profileId: string;
    let testGroup: string | null;
    let cycleData: { lastPeriodStart?: string; averageCycleLength?: number } | null = null;

    if (existingProfile) {
      profileId = existingProfile.id;
      testGroup = existingProfile.test_group;
      cycleData = existingProfile.cycle_data as { lastPeriodStart?: string; averageCycleLength?: number } | null;
    } else {
      const newTestGroup =
        Math.random() < 0.5 ? "motivation_A" : "motivation_B";
      const { data: newProfile, error: insertError } = await supabase
        .from("profiles")
        .insert({ email: session.user.email, test_group: newTestGroup })
        .select("id, test_group")
        .single();
      if (insertError || !newProfile) {
        const detail = insertError?.message ?? "Unknown error";
        return NextResponse.json(
          { error: "Failed to create profile", detail },
          { status: 500 }
        );
      }
      profileId = newProfile.id;
      testGroup = newProfile.test_group;
    }

    const { currentPhase } = await runCycleEngine(
      cycleData?.lastPeriodStart,
      cycleData?.averageCycleLength ?? 28
    );
    const cyclePhase = currentPhase;

    const { data: log, error } = await supabase
      .from("daily_logs")
      .upsert(
        {
          user_id: profileId,
          date: parsed.date,
          menstrual_flow: menstrual_flow ?? null,
          sleep_quality: sleep_quality ?? null,
          energy: energy ?? null,
          stress: stress ?? null,
          workout_type: workout_type ?? null,
          workout_rating: workout_rating ?? null,
          symptoms: symptoms ?? null,
          cycle_phase: cyclePhase,
        },
        { onConflict: "user_id,date" }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log user action to Opik for A/B testing
    const eventName = workout_type ? "logWorkout" : "daily_log_created";
    const actionType = workout_type ? "workout_completion" : "daily_checkin";
    await logUserEvent(eventName, {
      userId: profileId,
      testGroup: testGroup ?? undefined,
      cyclePhase,
      actionType,
      date: parsed.date,
      log_data: {
        menstrual_flow,
        sleep_quality,
        energy,
        stress,
        workout_type,
        workout_rating,
        symptoms,
      },
      log_id: log?.id,
    });

    return NextResponse.json(log);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/logs
 * Returns the authenticated user's log history
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
        { error: "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY." },
        { status: 503 }
      );
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", session.user.email)
      .single();

    if (!profile) {
      return NextResponse.json({ logs: [] });
    }

    const { data: logs, error } = await supabase
      .from("daily_logs")
      .select("*")
      .eq("user_id", profile.id)
      .order("date", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ logs: logs ?? [] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
