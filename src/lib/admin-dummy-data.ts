/**
 * Dummy/sample data for Judge Dashboard when real data is sparse.
 * Illustrates workout completion by phase, A/B comparison, AI acceptance, symptoms.
 */

export const DUMMY_WORKOUT_BY_PHASE = [
  { phase: "Menstrual", total: 12, withWorkout: 5, rate: 41.7 },
  { phase: "Follicular", total: 14, withWorkout: 10, rate: 71.4 },
  { phase: "Ovulation", total: 8, withWorkout: 7, rate: 87.5 },
  { phase: "Luteal", total: 16, withWorkout: 9, rate: 56.3 },
];

export const DUMMY_AB_COMPARISON = {
  motivation_A: { total: 28, withWorkout: 14 },
  motivation_B: { total: 22, withWorkout: 17 },
};

export const DUMMY_AI_ACCEPTANCE_RATE = 62; // 31 workouts / 50 check-ins

export const DUMMY_WORKOUT_CHART_DATA = [
  { name: "A - Menstrual", phase: "Menstrual", group: "motivation_A", rate: 40, total: 5 },
  { name: "B - Menstrual", phase: "Menstrual", group: "motivation_B", rate: 43, total: 7 },
  { name: "A - Follicular", phase: "Follicular", group: "motivation_A", rate: 75, total: 8 },
  { name: "B - Follicular", phase: "Follicular", group: "motivation_B", rate: 67, total: 6 },
  { name: "A - Ovulation", phase: "Ovulation", group: "motivation_A", rate: 80, total: 5 },
  { name: "B - Ovulation", phase: "Ovulation", group: "motivation_B", rate: 100, total: 3 },
  { name: "A - Luteal", phase: "Luteal", group: "motivation_A", rate: 50, total: 10 },
  { name: "B - Luteal", phase: "Luteal", group: "motivation_B", rate: 67, total: 6 },
];

export const DUMMY_SYMPTOMS_TABLE = [
  { phase: "Menstrual", symptom: "cramps", count: 8 },
  { phase: "Menstrual", symptom: "fatigue", count: 6 },
  { phase: "Menstrual", symptom: "bloating", count: 5 },
  { phase: "Follicular", symptom: "energy", count: 4 },
  { phase: "Follicular", symptom: "mood", count: 3 },
  { phase: "Ovulation", symptom: "energy", count: 5 },
  { phase: "Ovulation", symptom: "libido", count: 2 },
  { phase: "Luteal", symptom: "bloating", count: 6 },
  { phase: "Luteal", symptom: "fatigue", count: 5 },
  { phase: "Luteal", symptom: "mood", count: 4 },
];

export const DUMMY_METRICS = {
  aiSuggestionAcceptanceRate: 62,
  phasePredictionAccuracy: 95,
  abTestPValue: 0.032,
  abTestSummary: DUMMY_AB_COMPARISON,
};
