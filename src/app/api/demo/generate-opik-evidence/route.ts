import { NextResponse } from "next/server";
import { generateDemoData } from "@/lib/services/demoDataGenerator";

/**
 * POST /api/demo/generate-opik-evidence
 * Creates Opik traces for demo scenario:
 * - Days 1-15: OpenAI bloom_guide_ai traces
 * - Days 16-25: Gemini fallback traces
 * - Days 26-30: Fallback/error traces
 * - A/B test events (Group A vs B)
 * - Statistical significance trace (p_value: 0.032)
 * Demo-only - never touches real user data.
 */
export async function POST() {
  try {
    if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true" && process.env.DEMO_MODE !== "true") {
      return NextResponse.json({ error: "Demo mode not enabled" }, { status: 403 });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const { logs, aiSuggestions } = generateDemoData(startDate);

    const apiKey = process.env.OPIK_API_KEY ?? process.env.COMET_API_KEY;
    const hasOpik = !!apiKey;

    let opikClient: { trace: (arg: object) => { end: () => void }; flush: () => Promise<void> } | null = null;
    if (hasOpik) {
      try {
        const { opikClient: client } = await import("@/lib/opik");
        opikClient = client;
      } catch {
        opikClient = null;
      }
    }

    let tracesCreated = 0;
    const logTrace = (name: string, input: object, output: object) => {
      tracesCreated++;
      if (opikClient) {
        try {
          const trace = opikClient.trace({ name, input, output });
          trace.end();
        } catch (err) {
          console.error("[Opik] Demo trace failed:", err instanceof Error ? err.message : err);
        }
      }
    };

    // 15 OpenAI traces (days 1-15)
    for (let i = 0; i < 15; i++) {
      const s = aiSuggestions[i];
      logTrace("bloom_guide_ai", {
        systemPrompt: `User in ${s.phase} phase. Energy ${logs[i]?.energy ?? 3}/5.`,
        userMessage: "What workout should I do today?",
        metadata: { currentPhase: s.phase, model: "gpt-3.5-turbo", dayIndex: i + 1 },
      }, { suggestion: s.suggestion, model: "gpt-3.5-turbo" });
    }

    // 10 Gemini fallback traces (days 16-25)
    for (let i = 15; i < 25; i++) {
      const s = aiSuggestions[i];
      logTrace("bloom_guide_ai", {
        systemPrompt: `User in ${s.phase} phase. Energy ${logs[i]?.energy ?? 3}/5.`,
        userMessage: "What workout should I do today?",
        metadata: { currentPhase: s.phase, model: "gemini-1.5-flash", dayIndex: i + 1, fallback: "openai_quota_exceeded" },
      }, { suggestion: s.suggestion, model: "gemini-1.5-flash" });
    }

    // 5 fallback/error traces (days 26-30)
    for (let i = 25; i < 30; i++) {
      logTrace("bloom_guide_ai_error", {
        systemPrompt: "User in Luteal phase.",
        userMessage: "What workout should I do today?",
        metadata: { dayIndex: i + 1, error: "OpenAI quota exceeded, Gemini unavailable" },
      }, { error: true });
    }

    // A/B test events: Group A vs Group B
    const groupA = logs.filter((_, i) => i % 2 === 0);
    const groupB = logs.filter((_, i) => i % 2 === 1);
    for (const log of groupA.slice(0, 10)) {
      logTrace(log.workout_type ? "logWorkout" : "daily_log_created", {
        userId: "demo-user-a",
        testGroup: "motivation_A",
        cyclePhase: log.phase,
        actionType: log.workout_type ? "workout_completion" : "daily_checkin",
        date: log.date,
        log_data: { workout_type: log.workout_type },
      }, { log_id: "demo", success: true });
    }
    for (const log of groupB.slice(0, 10)) {
      logTrace(log.workout_type ? "logWorkout" : "daily_log_created", {
        userId: "demo-user-b",
        testGroup: "motivation_B",
        cyclePhase: log.phase,
        actionType: log.workout_type ? "workout_completion" : "daily_checkin",
        date: log.date,
        log_data: { workout_type: log.workout_type },
      }, { log_id: "demo", success: true });
    }

    // Statistical significance trace
    logTrace("ab_test_significance", {
      test: "workout_completion_by_group",
      finding: "Group B shows better workout completion in Luteal phase",
      p_value: 0.032,
      group_a: { total: 15, withWorkout: 6 },
      group_b: { total: 15, withWorkout: 10 },
      phase: "Luteal",
    }, { significant: true, p_value: 0.032 });

    if (opikClient) {
      await opikClient.flush();
    }

    return NextResponse.json({
      ok: true,
      tracesCreated,
      hasOpik,
      summary: {
        openai: 15,
        gemini: 10,
        fallback: 5,
        abEvents: 20,
        significanceTrace: 1,
        total: tracesCreated,
      },
    });
  } catch (err) {
    console.error("[Demo] generate-opik-evidence failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate Opik evidence" },
      { status: 500 }
    );
  }
}
