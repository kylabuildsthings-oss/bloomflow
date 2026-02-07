"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  generateResolutionPlan,
  type ResolutionPlan,
} from "@/lib/services/resolutionPlanGenerator";

const FITNESS_GOALS = [
  "Build Consistency",
  "Get Stronger",
  "Lose Weight",
  "Improve Running",
  "Reduce Stress",
] as const;

type ConsentState = {
  storeLocally: boolean;
  personalizeAI: boolean;
  shareAnonymized: boolean;
};

type Props = {
  onComplete: () => void;
};

export function OnboardingFlow({ onComplete }: Props) {
  const [step, setStep] = useState(1);
  const [lastPeriodStart, setLastPeriodStart] = useState("");
  const [averageCycleLength, setAverageCycleLength] = useState(28);
  const [fitnessGoal, setFitnessGoal] = useState<string>("");
  const [resolutionPlan, setResolutionPlan] = useState<ResolutionPlan | null>(null);
  const [medicalDisclaimerAccepted, setMedicalDisclaimerAccepted] = useState(false);
  const [consent, setConsent] = useState<ConsentState>({
    storeLocally: true,
    personalizeAI: true,
    shareAnonymized: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const planPreview = useMemo(() => {
    if (!fitnessGoal) return null;
    const start = new Date().toISOString().slice(0, 10);
    return generateResolutionPlan(
      start,
      fitnessGoal,
      lastPeriodStart || undefined,
      averageCycleLength || 28
    );
  }, [fitnessGoal, lastPeriodStart, averageCycleLength]);

  async function handleComplete() {
    if (!medicalDisclaimerAccepted) {
      toast.error("Please accept the medical disclaimer to continue");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cycle_data: {
            lastPeriodStart: lastPeriodStart || undefined,
            averageCycleLength: averageCycleLength || 28,
            fitnessGoal: fitnessGoal || undefined,
            resolutionPlan: resolutionPlan ?? planPreview ?? undefined,
          },
          onboarding_completed: true,
          consent: {
            storeLocally: consent.storeLocally,
            personalizeAI: consent.personalizeAI,
            shareAnonymized: consent.shareAnonymized,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save");
      }

      toast.success("Welcome to BloomFlow!");
      onComplete();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg rounded-2xl border border-primary/20 bg-white shadow-xl shadow-primary/10 p-6 sm:p-8"
      >
        <div className="mb-6 flex items-center gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full ${
                step >= s ? "bg-primary" : "bg-primary/20"
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <h2 className="text-xl font-semibold text-primary">Cycle Data</h2>
              <p className="text-sm text-neutral-600">
                Help us personalize your experience (optional).
              </p>
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-800">
                  Last period start date
                </label>
                <input
                  type="date"
                  value={lastPeriodStart}
                  onChange={(e) => setLastPeriodStart(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-neutral-900 placeholder:text-neutral-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-800">
                  Average cycle length (days)
                </label>
                <input
                  type="number"
                  min={21}
                  max={45}
                  value={averageCycleLength}
                  onChange={(e) => setAverageCycleLength(Number(e.target.value) || 28)}
                  className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-neutral-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <button
                onClick={() => setStep(2)}
                className="w-full rounded-xl bg-primary px-4 py-3 font-medium text-white hover:bg-primary/90 transition-colors"
              >
                Next
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <h2 className="text-xl font-semibold text-primary">
                New Year&apos;s Fitness Goal
              </h2>
              <p className="text-sm text-neutral-600">
                Select your primary goal for BloomGuide AI coaching.
              </p>
              <div className="space-y-2">
                {FITNESS_GOALS.map((goal) => (
                  <button
                    key={goal}
                    onClick={() => setFitnessGoal(goal)}
                    className={`block w-full rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors ${
                      fitnessGoal === goal
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-neutral-300 text-neutral-800 hover:border-primary/50"
                    }`}
                  >
                    {goal}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-xl border border-neutral-300 px-4 py-3 font-medium text-neutral-800 hover:bg-neutral-50"
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    if (planPreview) setResolutionPlan(planPreview);
                    setStep(3);
                  }}
                  className="flex-1 rounded-xl bg-primary px-4 py-3 font-medium text-white hover:bg-primary/90"
                >
                  Next
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <h2 className="text-xl font-semibold text-primary">
                Your Resolution Plan
              </h2>
              <p className="text-sm text-neutral-600">
                A 12-week, cycle-aware plan for <strong>{fitnessGoal}</strong>. Milestones align with your predicted cycle phases.
              </p>
              {planPreview && (
                <div className="max-h-48 overflow-y-auto space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
                  {planPreview.milestones.map((m) => (
                    <div key={m.week} className="rounded-lg border border-primary/10 bg-white px-3 py-2 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-primary">Week {m.week}</span>
                        <span className="text-xs text-neutral-500">{m.phase}</span>
                      </div>
                      <p className="text-neutral-800">{m.title.replace(`Week ${m.week}: `, "")}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">{m.date}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 rounded-xl border border-neutral-300 px-4 py-3 font-medium text-neutral-800 hover:bg-neutral-50"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="flex-1 rounded-xl bg-primary px-4 py-3 font-medium text-white hover:bg-primary/90"
                >
                  Next
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <h2 className="text-xl font-semibold text-primary">
                Legal & Data Consent
              </h2>

              <div className="rounded-lg border border-neutral-200 bg-primary/5 p-4">
                <p className="text-sm text-neutral-800">
                  <strong>Medical Disclaimer:</strong> BloomFlow is a wellness tool, not a medical
                  device. It does not diagnose, treat, or prevent any medical condition. Always
                  consult a healthcare provider for medical advice. Do not use BloomFlow to replace
                  professional care.
                </p>
                <label className="mt-3 flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={medicalDisclaimerAccepted}
                    onChange={(e) => setMedicalDisclaimerAccepted(e.target.checked)}
                    className="h-4 w-4 rounded border-primary/30 accent-primary"
                  />
                  <span className="text-sm font-medium text-neutral-800">
                    I understand and accept this disclaimer *
                  </span>
                </label>
              </div>

              <div className="space-y-3">
                <label className="flex cursor-pointer items-center justify-between rounded-lg border border-neutral-200 px-4 py-3">
                  <span className="text-sm text-neutral-800">Store my data locally</span>
                  <input
                    type="checkbox"
                    checked={consent.storeLocally}
                    onChange={(e) =>
                      setConsent((c) => ({ ...c, storeLocally: e.target.checked }))
                    }
                    className="h-5 w-5 rounded accent-primary"
                  />
                </label>
                <label className="flex cursor-pointer items-center justify-between rounded-lg border border-neutral-200 px-4 py-3">
                  <span className="text-sm text-neutral-800">
                    Use my data to personalize AI coaching
                  </span>
                  <input
                    type="checkbox"
                    checked={consent.personalizeAI}
                    onChange={(e) =>
                      setConsent((c) => ({ ...c, personalizeAI: e.target.checked }))
                    }
                    className="h-5 w-5 rounded accent-primary"
                  />
                </label>
                <label className="flex cursor-pointer items-center justify-between rounded-lg border border-neutral-200 px-4 py-3">
                  <span className="text-sm text-neutral-800">
                    Share anonymized data to improve the app
                  </span>
                  <input
                    type="checkbox"
                    checked={consent.shareAnonymized}
                    onChange={(e) =>
                      setConsent((c) => ({ ...c, shareAnonymized: e.target.checked }))
                    }
                    className="h-5 w-5 rounded accent-primary"
                  />
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 rounded-xl border border-neutral-300 px-4 py-3 font-medium text-neutral-800 hover:bg-neutral-50"
                >
                  Back
                </button>
                <button
                  onClick={handleComplete}
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl bg-primary px-4 py-3 font-medium text-white hover:bg-primary/90 disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Complete"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
