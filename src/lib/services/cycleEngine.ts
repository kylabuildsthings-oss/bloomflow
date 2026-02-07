/**
 * Cycle Engine: Calculates menstrual cycle phase and predicts next 5 days.
 * Logs predictions with confidence to Opik.
 */

export type CyclePhase = "Menstrual" | "Follicular" | "Ovulation" | "Luteal";

export type DayPrediction = {
  date: string;
  phase: CyclePhase;
  dayInCycle: number;
  confidence: number; // 0-1
};

export type CycleEngineResult = {
  currentPhase: CyclePhase;
  dayInCycle: number;
  predictions: DayPrediction[];
};

const DEFAULT_CYCLE_LENGTH = 28;
const DEFAULT_LAST_PERIOD_DAYS_AGO = 14; // Assume mid-cycle if no data

function getDayInCycle(
  referenceDate: Date,
  lastPeriodStart: Date,
  cycleLength: number
): number {
  const diffMs = referenceDate.getTime() - lastPeriodStart.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const day = (diffDays % cycleLength) + 1;
  return Math.max(1, Math.min(day, cycleLength));
}

function phaseFromDay(dayInCycle: number, cycleLength: number): CyclePhase {
  const ovulationDay = Math.floor(cycleLength * 0.5); // ~day 14 in 28-day
  const menstrualEnd = 5;
  const ovulationWindow = 3;

  if (dayInCycle <= menstrualEnd) return "Menstrual";
  if (dayInCycle < ovulationDay - Math.floor(ovulationWindow / 2))
    return "Follicular";
  if (
    dayInCycle >= ovulationDay - Math.floor(ovulationWindow / 2) &&
    dayInCycle <= ovulationDay + Math.floor(ovulationWindow / 2)
  )
    return "Ovulation";
  return "Luteal";
}

function confidenceForPhase(
  dayInCycle: number,
  phase: CyclePhase,
  cycleLength: number
): number {
  const ovulationDay = Math.floor(cycleLength * 0.5);
  const ovulationWindow = 3;

  switch (phase) {
    case "Menstrual":
      return dayInCycle >= 2 && dayInCycle <= 4 ? 0.9 : 0.75;
    case "Follicular":
      return 0.8;
    case "Ovulation":
      return dayInCycle === ovulationDay ? 0.85 : 0.7;
    case "Luteal":
      return dayInCycle > ovulationDay + ovulationWindow ? 0.85 : 0.75;
    default:
      return 0.7;
  }
}

/**
 * Calculate current cycle phase and predict next 5 days.
 * @param lastPeriodStart - ISO date string (YYYY-MM-DD) of last period start
 * @param averageCycleLength - Average cycle length in days (default 28)
 */
export async function runCycleEngine(
  lastPeriodStart: string | null | undefined,
  averageCycleLength: number = DEFAULT_CYCLE_LENGTH
): Promise<CycleEngineResult> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let lastPeriod: Date;
  if (lastPeriodStart) {
    lastPeriod = new Date(lastPeriodStart + "T12:00:00");
  } else {
    lastPeriod = new Date(today);
    lastPeriod.setDate(lastPeriod.getDate() - DEFAULT_LAST_PERIOD_DAYS_AGO);
  }

  const cycleLength = averageCycleLength > 0 ? averageCycleLength : DEFAULT_CYCLE_LENGTH;
  const dayInCycle = getDayInCycle(today, lastPeriod, cycleLength);
  const currentPhase = phaseFromDay(dayInCycle, cycleLength);

  const predictions: DayPrediction[] = [];
  for (let i = 0; i < 5; i++) {
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + i);
    const futureDay = getDayInCycle(futureDate, lastPeriod, cycleLength);
    const phase = phaseFromDay(futureDay, cycleLength);
    const confidence = confidenceForPhase(futureDay, phase, cycleLength);
    predictions.push({
      date: futureDate.toISOString().slice(0, 10),
      phase,
      dayInCycle: futureDay,
      confidence,
    });
  }

  // Log predictions to Opik
  if (process.env.OPIK_API_KEY) {
    try {
      const { opikClient } = await import("@/lib/opik");
      const trace = opikClient.trace({
        name: "cycle_engine_predictions",
        input: {
          lastPeriodStart: lastPeriodStart ?? "default",
          averageCycleLength: cycleLength,
          currentPhase,
          dayInCycle,
        },
        output: {
          predictions: predictions.map((p) => ({
            date: p.date,
            phase: p.phase,
            confidence: p.confidence,
          })),
        },
      });
      trace.end();
      await opikClient.flush();
    } catch {
      // Non-fatal
    }
  }

  return { currentPhase, dayInCycle, predictions };
}
