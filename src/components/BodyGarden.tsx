"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { DailyCheckinModal } from "./DailyCheckinModal";
import { MetricChartModal, type MetricType } from "./MetricChartModal";
import { SleepFlower } from "./plants/SleepFlower";
import { EnergySunflower } from "./plants/EnergySunflower";
import { WorkoutVine } from "./plants/WorkoutVine";

type DailyLog = {
  id: string;
  date: string;
  sleep_quality: number | null;
  energy: number | null;
  stress: number | null;
  menstrual_flow: string | null;
  workout_type: string | null;
  workout_rating: number | null;
  symptoms: string | null;
};

function getLast7Days(): string[] {
  const today = new Date();
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

type BloomGuideResult = { suggestion: string; workoutType?: string; reason?: string };

export function BodyGarden() {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [checkinModalOpen, setCheckinModalOpen] = useState(false);
  const [chartModalOpen, setChartModalOpen] = useState(false);
  const [chartMetric, setChartMetric] = useState<MetricType>("sleep_quality");
  const [bloomGuideResult, setBloomGuideResult] = useState<BloomGuideResult | null>(null);
  const [bloomGuideLoading, setBloomGuideLoading] = useState(false);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/logs");
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs ?? []);
      }
    } catch {
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const last7Days = getLast7Days();
  const last7Logs = logs.filter((l) => last7Days.includes(l.date));

  // 7-day average sleep_quality
  const sleepValues = last7Logs
    .map((l) => l.sleep_quality)
    .filter((v): v is number => v != null);
  const avgSleep =
    sleepValues.length > 0
      ? sleepValues.reduce((a, b) => a + b, 0) / sleepValues.length
      : 3;

  // 7-day average energy
  const energyValues = last7Logs
    .map((l) => l.energy)
    .filter((v): v is number => v != null);
  const avgEnergy =
    energyValues.length > 0
      ? energyValues.reduce((a, b) => a + b, 0) / energyValues.length
      : 3;

  // Workout consistency: days with workout logged this week
  const workoutDays = last7Logs.filter((l) => l.workout_type != null).length;

  const today = new Date().toISOString().slice(0, 10);
  const todayLog = logs.find((l) => l.date === today);

  function openChart(metric: MetricType) {
    setChartMetric(metric);
    setChartModalOpen(true);
  }

  async function fetchBloomGuideSuggestion() {
    setBloomGuideLoading(true);
    setBloomGuideResult(null);
    try {
      const res = await fetch("/api/ai/coach");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to get suggestion");
      }
      setBloomGuideResult(data);
    } catch (err) {
      setBloomGuideResult({
        suggestion: err instanceof Error ? err.message : "Unable to load suggestion. Check that OPENAI_API_KEY is set.",
      });
    } finally {
      setBloomGuideLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-primary/20 bg-background shadow-lg shadow-primary/5 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-xl font-semibold text-primary">Body Garden</h2>
        <button
          onClick={() => setCheckinModalOpen(true)}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
        >
          + Daily Check-in
        </button>
      </div>

      {isLoading ? (
        <p className="text-foreground/60 text-sm">Loading...</p>
      ) : (
        <>
          {/* Three plants */}
          <div className="flex flex-wrap items-end justify-around gap-4 sm:gap-6 py-6 sm:py-8 px-2 sm:px-4">
            <motion.button
              onClick={() => openChart("sleep_quality")}
              className="flex flex-col items-center gap-2 group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <SleepFlower avgSleep={avgSleep} />
              <span className="text-xs font-medium text-foreground/80 group-hover:text-primary transition-colors">
                Sleep Flower
              </span>
              <span className="text-xs text-foreground/50">
                {avgSleep.toFixed(1)}/5 avg
              </span>
            </motion.button>

            <motion.button
              onClick={() => openChart("energy")}
              className="flex flex-col items-center gap-2 group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <EnergySunflower avgEnergy={avgEnergy} />
              <span className="text-xs font-medium text-foreground/80 group-hover:text-primary transition-colors">
                Energy Sunflower
              </span>
              <span className="text-xs text-foreground/50">
                {avgEnergy.toFixed(1)}/5 avg
              </span>
            </motion.button>

            <motion.button
              onClick={() => openChart("workout")}
              className="flex flex-col items-center gap-2 group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <WorkoutVine workoutDays={workoutDays} />
              <span className="text-xs font-medium text-foreground/80 group-hover:text-primary transition-colors">
                Workout Vine
              </span>
              <span className="text-xs text-foreground/50">
                {workoutDays}/7 days
              </span>
            </motion.button>
          </div>

          {!todayLog && (
            <p className="text-center text-foreground/60 text-sm py-4">
              No check-in yet today. Track your wellness to tend your Body Garden.
            </p>
          )}

          {/* BloomGuide AI */}
          <div className="mt-8 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
            <h3 className="mb-2 text-base font-semibold text-primary">BloomGuide AI</h3>
            <p className="mb-4 text-sm text-foreground/70">
              Get a personalized workout suggestion based on your cycle phase and recent check-ins.
            </p>
            <button
              onClick={fetchBloomGuideSuggestion}
              disabled={bloomGuideLoading}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
            >
              {bloomGuideLoading ? "Getting suggestion..." : "Get today's suggestion"}
            </button>
            {bloomGuideResult && (
              <div className="mt-4 rounded-lg border border-primary/20 bg-white p-4 text-sm text-neutral-800">
                <p className="whitespace-pre-wrap">{bloomGuideResult.suggestion}</p>
              </div>
            )}
          </div>
        </>
      )}

      <DailyCheckinModal
        isOpen={checkinModalOpen}
        onClose={() => setCheckinModalOpen(false)}
        onSuccess={fetchLogs}
      />

      <MetricChartModal
        isOpen={chartModalOpen}
        onClose={() => setChartModalOpen(false)}
        metric={chartMetric}
        logs={logs}
      />
    </div>
  );
}
