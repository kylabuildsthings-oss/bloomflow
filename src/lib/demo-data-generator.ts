/**
 * Demo data generator for BloomFlow.
 * Exports generate30DayDemo() and generateOpikTraces().
 * Isolated - never touches real user data.
 */

export type CyclePhase = "Menstrual" | "Follicular" | "Ovulation" | "Luteal";

export type DemoDailyLog = {
  date: string;
  cyclePhase: CyclePhase;
  dayInCycle: number;
  sleep: number;
  energy: number;
  stress: number;
  workoutCompleted: boolean;
  workoutType: string | null;
  aiSuggestion: string;
  testGroup: "A" | "B";
  aiProvider: "openai" | "gemini" | "fallback";
};

export type OpikTraceObject = {
  name: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
};

function getPhaseForDay(dayInCycle: number, cycleLength: number): CyclePhase {
  const ovulationDay = Math.floor(cycleLength * 0.5);
  const menstrualEnd = 5;
  const ovulationWindow = 3;
  const d = ((dayInCycle - 1) % cycleLength) + 1;
  if (d <= menstrualEnd) return "Menstrual";
  if (d < ovulationDay - Math.floor(ovulationWindow / 2)) return "Follicular";
  if (d <= ovulationDay + Math.floor(ovulationWindow / 2)) return "Ovulation";
  return "Luteal";
}

function getDayInCycle(dateIndex: number, cycleLength: number): number {
  return ((dateIndex - 1) % cycleLength) + 1;
}

const WORKOUT_BY_PHASE: Record<CyclePhase, string[]> = {
  Menstrual: ["Yoga", "Walking", "Stretching"],
  Follicular: ["Strength", "HIIT", "Running"],
  Ovulation: ["Strength", "HIIT", "Running"],
  Luteal: ["Yoga", "Walking", "Pilates"],
};

const SUGGESTIONS_BY_PHASE: Record<CyclePhase, string> = {
  Menstrual: "Gentle yoga or a short walk. Listen to your body today.",
  Follicular: "Great day for strength training! Your energy is rising.",
  Ovulation: "Peak performance - try HIIT or a challenging run.",
  Luteal: "Lower intensity. Yoga or Pilates to ease into the week.",
};

/**
 * Generate 30 days of demo daily logs.
 * workoutCompleted: true on 18/30 days (60%).
 * aiProvider: openai (days 1-10), gemini (11-20), fallback (21-30).
 */
export function generate30DayDemo(): DemoDailyLog[] {
  const cycleLength = 28;
  const logs: DemoDailyLog[] = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  // Pre-determine which 18 days have workouts (for consistent distribution)
  const workoutDays = new Set<number>();
  while (workoutDays.size < 18) {
    workoutDays.add(Math.floor(Math.random() * 30));
  }

  for (let i = 0; i < 30; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayInCycle = getDayInCycle(i + 1, cycleLength);
    const cyclePhase = getPhaseForDay(dayInCycle, cycleLength);

    // sleep, energy, stress correlate with phase
    let sleepBase = 4;
    let energyBase = 3;
    let stressBase = 3;
    if (cyclePhase === "Menstrual") {
      sleepBase = 3;
      energyBase = 2;
      stressBase = 4;
    } else if (cyclePhase === "Follicular" || cyclePhase === "Ovulation") {
      sleepBase = 4;
      energyBase = 4;
      stressBase = 2;
    } else {
      sleepBase = 3;
      energyBase = 3;
      stressBase = 3;
    }

    const sleep = Math.min(5, Math.max(3, sleepBase + Math.floor(Math.random() * 2) - 1));
    const energy = Math.min(5, Math.max(2, energyBase + Math.floor(Math.random() * 2) - 1));
    const stress = Math.min(4, Math.max(1, stressBase + Math.floor(Math.random() * 2) - 1));

    const workoutCompleted = workoutDays.has(i);
    const workoutOptions = WORKOUT_BY_PHASE[cyclePhase];
    const workoutType = workoutCompleted
      ? workoutOptions[Math.floor(Math.random() * workoutOptions.length)]
      : null;

    const aiProvider: "openai" | "gemini" | "fallback" =
      i < 10 ? "openai" : i < 20 ? "gemini" : "fallback";

    const testGroup: "A" | "B" = Math.random() < 0.5 ? "A" : "B";

    logs.push({
      date: dateStr,
      cyclePhase,
      dayInCycle,
      sleep,
      energy,
      stress,
      workoutCompleted,
      workoutType,
      aiSuggestion: SUGGESTIONS_BY_PHASE[cyclePhase],
      testGroup,
      aiProvider,
    });
  }

  return logs;
}

/**
 * Format demo data as Opik trace objects.
 * Returns traces for bloom_guide_ai, logWorkout/daily_log_created, and ab_test_significance.
 */
export function generateOpikTraces(demoData: DemoDailyLog[]): OpikTraceObject[] {
  const traces: OpikTraceObject[] = [];

  for (const log of demoData) {
    const name = log.aiProvider === "fallback" ? "bloom_guide_ai_error" : "bloom_guide_ai";
    traces.push({
      name,
      input: {
        systemPrompt: `User in ${log.cyclePhase} phase. Energy ${log.energy}/5, stress ${log.stress}/5.`,
        userMessage: "What workout should I do today?",
        metadata: {
          currentPhase: log.cyclePhase,
          energy: log.energy,
          stress: log.stress,
          testGroup: log.testGroup,
          aiProvider: log.aiProvider,
          date: log.date,
        },
      },
      output:
        log.aiProvider === "fallback"
          ? { error: true }
          : { suggestion: log.aiSuggestion, model: log.aiProvider === "openai" ? "gpt-3.5-turbo" : "gemini-1.5-flash" },
    });

    const eventName = log.workoutCompleted ? "logWorkout" : "daily_log_created";
    traces.push({
      name: eventName,
      input: {
        userId: `demo-${log.testGroup.toLowerCase()}`,
        testGroup: `motivation_${log.testGroup}`,
        cyclePhase: log.cyclePhase,
        actionType: log.workoutCompleted ? "workout_completion" : "daily_checkin",
        date: log.date,
        sleep: log.sleep,
        energy: log.energy,
        stress: log.stress,
        workout_type: log.workoutType,
      },
      output: { log_id: "demo", success: true },
    });
  }

  traces.push({
    name: "ab_test_significance",
    input: {
      test: "workout_completion_by_group",
      finding: "Group B shows better workout completion in Luteal phase",
      p_value: 0.032,
      group_a: { total: 15, withWorkout: 6 },
      group_b: { total: 15, withWorkout: 10 },
      phase: "Luteal",
    },
    output: { significant: true, p_value: 0.032 },
  });

  return traces;
}
