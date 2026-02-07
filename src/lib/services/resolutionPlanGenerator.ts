/**
 * Generates a 12-week, cycle-aware resolution plan.
 * Milestones are aligned with predicted cycle phases.
 */

export type CyclePhase = "Menstrual" | "Follicular" | "Ovulation" | "Luteal";

export type ResolutionMilestone = {
  date: string; // YYYY-MM-DD
  week: number;
  phase: CyclePhase;
  title: string;
  description: string;
};

export type ResolutionPlan = {
  startDate: string;
  endDate: string;
  goal: string;
  milestones: ResolutionMilestone[];
};

function getDayInCycle(
  refDate: Date,
  lastPeriodStart: Date,
  cycleLength: number
): number {
  const diffMs = refDate.getTime() - lastPeriodStart.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const day = (diffDays % cycleLength) + 1;
  return Math.max(1, Math.min(day, cycleLength));
}

function phaseFromDay(dayInCycle: number, cycleLength: number): CyclePhase {
  const ovulationDay = Math.floor(cycleLength * 0.5);
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

const GOAL_TITLES: Record<string, Record<CyclePhase, string>> = {
  "Build Consistency": {
    Menstrual: "Rest & reflect",
    Follicular: "Build momentum",
    Ovulation: "Peak consistency week",
    Luteal: "Sustain habits",
  },
  "Get Stronger": {
    Menstrual: "Light recovery",
    Follicular: "Progressive overload",
    Ovulation: "Strength peak",
    Luteal: "Maintain gains",
  },
  "Lose Weight": {
    Menstrual: "Gentle movement",
    Follicular: "Higher intensity",
    Ovulation: "Max effort week",
    Luteal: "Steady cardio",
  },
  "Improve Running": {
    Menstrual: "Recovery runs",
    Follicular: "Build base",
    Ovulation: "Speed week",
    Luteal: "Endurance focus",
  },
  "Reduce Stress": {
    Menstrual: "Restorative yoga",
    Follicular: "Morning flow",
    Ovulation: "Active release",
    Luteal: "Mindful movement",
  },
};

const DEFAULT_TITLES: Record<CyclePhase, string> = {
  Menstrual: "Rest & recovery",
  Follicular: "Build momentum",
  Ovulation: "Peak week",
  Luteal: "Sustain & maintain",
};

function getMilestoneTitle(goal: string, phase: CyclePhase, week: number): string {
  const byGoal = GOAL_TITLES[goal];
  const base = byGoal?.[phase] ?? DEFAULT_TITLES[phase];
  return `Week ${week}: ${base}`;
}

function getMilestoneDescription(phase: CyclePhase): string {
  const phaseTips: Record<CyclePhase, string> = {
    Menstrual: "Lower intensity—focus on rest and gentle movement.",
    Follicular: "Energy rising—good time to increase volume.",
    Ovulation: "Peak performance—ideal for challenging workouts.",
    Luteal: "Listen to your body—adjust intensity as needed.",
  };
  return phaseTips[phase];
}

/**
 * Generate a 12-week resolution plan with milestones every 2 weeks, aligned with cycle phases.
 */
export function generateResolutionPlan(
  startDate: string, // YYYY-MM-DD
  goal: string,
  lastPeriodStart: string | null | undefined,
  averageCycleLength: number = 28
): ResolutionPlan {
  const start = new Date(startDate + "T12:00:00");
  const cycleLength = averageCycleLength > 0 ? averageCycleLength : 28;
  const lastPeriod = lastPeriodStart
    ? new Date(lastPeriodStart + "T12:00:00")
    : new Date(start);
  if (!lastPeriodStart) {
    lastPeriod.setDate(lastPeriod.getDate() - 14); // Assume mid-cycle
  }

  const endDate = new Date(start);
  endDate.setDate(endDate.getDate() + 84); // 12 weeks

  const milestoneWeeks = [2, 4, 6, 8, 10, 12];
  const milestones: ResolutionMilestone[] = [];

  for (const week of milestoneWeeks) {
    const milestoneDate = new Date(start);
    milestoneDate.setDate(milestoneDate.getDate() + (week - 1) * 7);
    const dateStr = milestoneDate.toISOString().slice(0, 10);
    const dayInCycle = getDayInCycle(milestoneDate, lastPeriod, cycleLength);
    const phase = phaseFromDay(dayInCycle, cycleLength);

    milestones.push({
      date: dateStr,
      week,
      phase,
      title: getMilestoneTitle(goal, phase, week),
      description: getMilestoneDescription(phase),
    });
  }

  return {
    startDate,
    endDate: endDate.toISOString().slice(0, 10),
    goal,
    milestones,
  };
}
