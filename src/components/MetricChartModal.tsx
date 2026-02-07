"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export type MetricType = "sleep_quality" | "energy" | "workout";

type DailyLog = {
  id: string;
  date: string;
  sleep_quality: number | null;
  energy: number | null;
  workout_type: string | null;
};

type ChartDataPoint = {
  date: string;
  label: string;
  value: number;
  fullMark: number;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  metric: MetricType;
  logs: DailyLog[];
};

const METRIC_CONFIG = {
  sleep_quality: {
    title: "Sleep Quality",
    color: "#87A96B",
  },
  energy: {
    title: "Energy Level",
    color: "#E8C547",
  },
  workout: {
    title: "Workout Consistency",
    color: "#CC7357",
  },
};

function buildChartData(
  logs: DailyLog[],
  metric: MetricType
): ChartDataPoint[] {
  const today = new Date();
  const data: ChartDataPoint[] = [];
  const dateToLog = new Map(logs.map((l) => [l.date, l]));

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const log = dateToLog.get(dateStr);

    let value = 0;
    if (metric === "sleep_quality" && log?.sleep_quality != null) {
      value = log.sleep_quality;
    } else if (metric === "energy" && log?.energy != null) {
      value = log.energy;
    } else if (metric === "workout" && log?.workout_type) {
      value = 1;
    }

    data.push({
      date: dateStr,
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value,
      fullMark: metric === "workout" ? 1 : 5,
    });
  }

  if (metric === "workout") {
    // Show rolling 7-day workout count per day
    return data.map((point, idx) => {
      const weekStart = Math.max(0, idx - 6);
      const weekData = data.slice(weekStart, idx + 1);
      const workoutCount = weekData.filter((d) => d.value === 1).length;
      return { ...point, value: workoutCount };
    });
  }

  return data;
}

export function MetricChartModal({ isOpen, onClose, metric, logs }: Props) {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const config = METRIC_CONFIG[metric];

  useEffect(() => {
    setData(buildChartData(logs, metric));
  }, [logs, metric]);

  const yDomain = metric === "workout" ? [0, 7] : [0, 5];

  if (!isOpen) return null;

  return (
    <AnimatePresence mode="wait">
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="chart-title"
          className="relative w-full max-w-2xl rounded-2xl border border-primary/20 bg-background shadow-xl shadow-primary/10 p-6"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 id="chart-title" className="text-xl font-semibold text-primary">
              {config.title} — 30-Day History
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-foreground/70 hover:bg-primary/10 transition-colors"
            >
              Close
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{ top: 5, right: 5, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(135,169,107,0.2)" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "var(--foreground)", fontSize: 12 }}
                  tickLine={false}
                />
                <YAxis
                  domain={yDomain}
                  tick={{ fill: "var(--foreground)", fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--background)",
                    border: "1px solid rgba(135,169,107,0.3)",
                    borderRadius: "12px",
                  }}
                  labelStyle={{ color: "var(--foreground)" }}
                  formatter={(value?: number) => [
                    metric === "workout"
                      ? `${value ?? 0} workout${(value ?? 0) !== 1 ? "s" : ""} this week`
                      : `${value ?? 0}/5`,
                    config.title,
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={config.color}
                  strokeWidth={2}
                  dot={{ fill: config.color, r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
