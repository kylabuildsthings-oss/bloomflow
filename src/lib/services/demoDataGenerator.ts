/**
 * Demo data generator for BloomFlow.
 * Generates 30 days of realistic cycle-aware data.
 * Isolated - never touches real user data.
 */

export type CyclePhase = "Menstrual" | "Follicular" | "Ovulation" | "Luteal";

export type DemoDailyLog = {
  date: string;
  phase: CyclePhase;
  dayInCycle: number;
  sleep_quality: number;
  energy: number;
  stress: number;
  workout_type: string | null;
  workout_rating: number | null;
  menstrual_flow: string;
  symptoms: string;
};

export type DemoAISuggestion = {
  date: string;
  phase: CyclePhase;
  suggestion: string;
  model: "openai" | "gemini" | "fallback";
  dayIndex: number;
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

const SYMPTOMS_BY_PHASE: Record<CyclePhase, string[]> = {
  Menstrual: ["cramps", "fatigue", "bloating"],
  Follicular: ["energized", "clear skin"],
  Ovulation: ["peak energy", "high libido"],
  Luteal: ["fatigue", "bloating", "mood swings"],
};

const MENSTRUAL_FLOW_BY_PHASE: Record<CyclePhase, string> = {
  Menstrual: "medium",
  Follicular: "none",
  Ovulation: "none",
  Luteal: "none",
};

/**
 * Generate 30 days of realistic demo data.
 */
export function generateDemoData(startDate: Date): {
  logs: DemoDailyLog[];
  aiSuggestions: DemoAISuggestion[];
} {
  const cycleLength = 28;
  const logs: DemoDailyLog[] = [];
  const aiSuggestions: DemoAISuggestion[] = [];

  const suggestionTemplates: Record<CyclePhase, string> = {
    Menstrual: "Gentle yoga or a short walk. Listen to your body today.",
    Follicular: "Great day for strength training! Your energy is rising.",
    Ovulation: "Peak performance - try HIIT or a challenging run.",
    Luteal: "Lower intensity. Yoga or Pilates to ease into the week.",
  };

  for (let i = 0; i < 30; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayInCycle = getDayInCycle(i + 1, cycleLength);
    const phase = getPhaseForDay(dayInCycle, cycleLength);

    // Realistic ranges: Menstrual=low energy, Follicular/Ovulation=high, Luteal=medium-low
    let energyBase = 3;
    let sleepBase = 4;
    let stressBase = 3;
    if (phase === "Menstrual") {
      energyBase = 2;
      sleepBase = 3;
      stressBase = 4;
    } else if (phase === "Follicular" || phase === "Ovulation") {
      energyBase = 4;
      sleepBase = 4;
      stressBase = 2;
    } else {
      energyBase = 3;
      sleepBase = 3;
      stressBase = 3;
    }

    const sleep = Math.min(5, Math.max(3, sleepBase + Math.floor(Math.random() * 2) - 1));
    const energy = Math.min(5, Math.max(2, energyBase + Math.floor(Math.random() * 2) - 1));
    const stress = Math.min(4, Math.max(1, stressBase + Math.floor(Math.random() * 2) - 1));

    const workoutOptions = WORKOUT_BY_PHASE[phase];
    const doWorkout = Math.random() > 0.4;
    const workout_type = doWorkout ? workoutOptions[Math.floor(Math.random() * workoutOptions.length)] : null;
    const workout_rating = workout_type ? 3 + Math.floor(Math.random() * 2) : null;

    const symptomList = SYMPTOMS_BY_PHASE[phase];
    const symptoms = symptomList[Math.floor(Math.random() * symptomList.length)];

    logs.push({
      date: dateStr,
      phase,
      dayInCycle,
      sleep_quality: sleep,
      energy,
      stress,
      workout_type,
      workout_rating,
      menstrual_flow: MENSTRUAL_FLOW_BY_PHASE[phase],
      symptoms,
    });

    const model: "openai" | "gemini" | "fallback" =
      i < 15 ? "openai" : i < 25 ? "gemini" : "fallback";
    aiSuggestions.push({
      date: dateStr,
      phase,
      suggestion: suggestionTemplates[phase],
      model,
      dayIndex: i + 1,
    });
  }

  return { logs, aiSuggestions };
}
