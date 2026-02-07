"use client";

import { useState } from "react";
import toast from "react-hot-toast";

const MENSTRUAL_FLOW_OPTIONS = [
  { value: "none", label: "None" },
  { value: "light", label: "Light" },
  { value: "medium", label: "Medium" },
  { value: "heavy", label: "Heavy" },
  { value: "spotting", label: "Spotting" },
] as const;

const WORKOUT_TYPES = [
  "Strength",
  "Cardio",
  "Yoga",
  "Pilates",
  "Walking",
  "Other",
] as const;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export function DailyCheckinModal({ isOpen, onClose, onSuccess }: Props) {
  const [menstrualFlow, setMenstrualFlow] = useState<string>("none");
  const [sleepQuality, setSleepQuality] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [stress, setStress] = useState(3);
  const [workoutCompleted, setWorkoutCompleted] = useState(false);
  const [workoutType, setWorkoutType] = useState<string>("Strength");
  const [workoutRating, setWorkoutRating] = useState(3);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const body: Record<string, unknown> = {
        date: today,
        menstrual_flow: menstrualFlow,
        sleep_quality: sleepQuality,
        energy,
        stress,
        symptoms: notes.trim() || undefined,
      };

      if (workoutCompleted) {
        body.workout_type = workoutType.toLowerCase();
        body.workout_rating = workoutRating;
      }

      const res = await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        const msg = err.detail ? `${err.error}: ${err.detail}` : (err.error ?? "Failed to save log");
        throw new Error(msg);
      }

      toast.success("Daily check-in saved!");
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        onClick={() => !isSubmitting && onClose()}
        aria-hidden
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="daily-checkin-title"
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-primary/20 bg-background shadow-xl shadow-primary/10"
      >
        <form onSubmit={handleSubmit} className="p-6 sm:p-8" aria-busy={isSubmitting}>
          <h2
            id="daily-checkin-title"
            className="text-xl font-semibold text-primary mb-6"
          >
            Daily Check-in
          </h2>

          {/* Cycle Status */}
          <fieldset className="mb-6">
            <legend className="text-sm font-medium text-foreground mb-3">
              Menstrual Flow
            </legend>
            <div className="flex flex-wrap gap-3">
              {MENSTRUAL_FLOW_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 transition-colors hover:border-primary/50 ${
                    menstrualFlow === opt.value
                      ? "border-primary bg-primary/10"
                      : "border-primary/30"
                  }`}
                >
                  <input
                    type="radio"
                    name="menstrualFlow"
                    value={opt.value}
                    checked={menstrualFlow === opt.value}
                    onChange={(e) => setMenstrualFlow(e.target.value)}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium text-foreground">
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Quick Metrics Sliders */}
          <div className="mb-6 space-y-5">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-foreground">Sleep Quality</span>
                <span className="text-foreground/70">{sleepQuality}/5</span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                value={sleepQuality}
                onChange={(e) => setSleepQuality(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-primary/20 accent-primary"
              />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-foreground">Energy Level</span>
                <span className="text-foreground/70">{energy}/5</span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                value={energy}
                onChange={(e) => setEnergy(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-primary/20 accent-primary"
              />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-foreground">Stress</span>
                <span className="text-foreground/70">{stress}/5</span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                value={stress}
                onChange={(e) => setStress(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-primary/20 accent-primary"
              />
            </div>
          </div>

          {/* Workout Log */}
          <div className="mb-6">
            <label className="flex cursor-pointer items-center gap-3 mb-4">
              <input
                type="checkbox"
                checked={workoutCompleted}
                onChange={(e) => setWorkoutCompleted(e.target.checked)}
                className="h-5 w-5 rounded border-primary/30 accent-primary"
              />
              <span className="font-medium text-foreground">
                Workout Completed?
              </span>
            </label>

            {workoutCompleted && (
              <div className="ml-8 space-y-4 rounded-xl border border-primary/20 bg-background/50 p-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Type
                  </label>
                  <select
                    value={workoutType}
                    onChange={(e) => setWorkoutType(e.target.value)}
                    className="w-full rounded-lg border border-primary/30 bg-background px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {WORKOUT_TYPES.map((t) => (
                      <option key={t} value={t.toLowerCase()}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-foreground">Rating</span>
                    <span className="text-foreground/70">{workoutRating}/5</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={workoutRating}
                    onChange={(e) => setWorkoutRating(Number(e.target.value))}
                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-primary/20 accent-primary"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-2">
              Notes <span className="text-foreground/50">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any symptoms or notes..."
              rows={3}
              className="w-full rounded-lg border border-primary/30 bg-background px-4 py-3 text-foreground placeholder:text-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-primary/30 px-4 py-3 font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-primary/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-xl bg-primary px-4 py-3 font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {isSubmitting ? "Saving..." : "Save Check-in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
