import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

type ResolutionMilestone = {
  date: string;
  week: number;
  phase: string;
  title: string;
  description: string;
};

type ResolutionPlan = {
  startDate: string;
  endDate: string;
  goal: string;
  milestones: ResolutionMilestone[];
};

type CycleData = {
  lastPeriodStart?: string;
  averageCycleLength?: number;
  fitnessGoal?: string;
  resolutionPlan?: ResolutionPlan;
};

type Consent = {
  storeLocally?: boolean;
  personalizeAI?: boolean;
  shareAnonymized?: boolean;
};

/**
 * GET /api/profile
 * Returns the current user's profile (including onboarding status)
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

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, email, cycle_data, test_group, onboarding_completed, consent")
      .eq("email", session.user.email)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!profile) {
      return NextResponse.json({ profile: null, needsOnboarding: true });
    }

    const needsOnboarding = profile.onboarding_completed !== true;

    return NextResponse.json({
      profile: {
        id: profile.id,
        email: profile.email,
        cycle_data: profile.cycle_data ?? {},
        test_group: profile.test_group,
        onboarding_completed: profile.onboarding_completed ?? false,
        consent: profile.consent ?? {},
      },
      needsOnboarding,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/profile
 * Updates profile (onboarding data, consent)
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const bodyCycleData = body.cycle_data as CycleData | undefined;
    const fitnessGoal = (body.fitnessGoal ?? body.fitness_goal) as string | undefined;
    const onboardingCompleted = body.onboarding_completed as boolean | undefined;
    const consent = body.consent as Consent | undefined;

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase is not configured" },
        { status: 503 }
      );
    }

    const { data: existing } = await supabase
      .from("profiles")
      .select("id, cycle_data, consent")
      .eq("email", session.user.email)
      .single();

    const currentCycleData = (existing?.cycle_data ?? {}) as CycleData;
    const currentConsent = (existing?.consent ?? {}) as Consent;

    const mergedCycleData: CycleData = { ...currentCycleData };
    if (bodyCycleData?.lastPeriodStart != null) {
      mergedCycleData.lastPeriodStart = bodyCycleData.lastPeriodStart;
    }
    if (bodyCycleData?.averageCycleLength != null) {
      mergedCycleData.averageCycleLength = bodyCycleData.averageCycleLength;
    }
    if (fitnessGoal != null || bodyCycleData?.fitnessGoal != null) {
      mergedCycleData.fitnessGoal = fitnessGoal ?? bodyCycleData?.fitnessGoal;
    }
    if (bodyCycleData?.resolutionPlan != null) {
      mergedCycleData.resolutionPlan = bodyCycleData.resolutionPlan;
    }

    if (!existing) {
      const testGroup = Math.random() < 0.5 ? "motivation_A" : "motivation_B";
      const { data: newProfile, error: insertError } = await supabase
        .from("profiles")
        .insert({
          email: session.user.email,
          test_group: testGroup,
          cycle_data: mergedCycleData,
          onboarding_completed: onboardingCompleted ?? true,
          consent: { ...currentConsent, ...consent },
        })
        .select()
        .single();

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
      return NextResponse.json(newProfile);
    }

    const updates: Record<string, unknown> = {};
    updates.cycle_data = mergedCycleData;
    if (onboardingCompleted === true) {
      updates.onboarding_completed = true;
    }
    if (consent != null) {
      updates.consent = { ...currentConsent, ...consent };
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("email", session.user.email)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(profile);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
