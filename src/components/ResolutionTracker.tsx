"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

type ResolutionMilestone = {
  date: string;
  week: number;
  phase: string;
  title: string;
  description: string;
};

type ResolutionPlan = {
  startDate: string;
  endDate: string;
  goal: string;
  milestones: ResolutionMilestone[];
};

type Profile = {
  cycle_data?: {
    resolutionPlan?: ResolutionPlan;
  };
};

const PHASE_COLORS: Record<string, string> = {
  Menstrual: "bg-rose-100 text-rose-800 border-rose-200",
  Follicular: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Ovulation: "bg-amber-100 text-amber-800 border-amber-200",
  Luteal: "bg-violet-100 text-violet-800 border-violet-200",
};

function formatDate(s: string): string {
  const d = new Date(s + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isPast(dateStr: string): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return dateStr <= today;
}

export function ResolutionTracker() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          setProfile(data.profile ?? null);
        }
      } catch {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const plan = profile?.cycle_data?.resolutionPlan;

  if (loading || !plan) {
    if (loading) {
      return (
        <div className="rounded-2xl border border-primary/20 bg-background shadow-lg shadow-primary/5 p-4 sm:p-6 animate-pulse">
          <div className="h-6 w-48 bg-primary/10 rounded mb-4" />
          <div className="h-24 bg-primary/5 rounded" />
        </div>
      );
    }
    return null;
  }

  const completed = plan.milestones.filter((m) => isPast(m.date)).length;
  const total = plan.milestones.length;
  const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="rounded-2xl border border-primary/20 bg-background shadow-lg shadow-primary/5 p-4 sm:p-6">
      <h2 className="text-xl font-semibold text-primary mb-1">Resolution Tracker</h2>
      <p className="text-sm text-foreground/70 mb-4">
        {plan.goal} • {plan.startDate} → {plan.endDate}
      </p>

      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-foreground/70">Progress</span>
          <span className="font-medium text-primary">
            {completed}/{total} milestones
          </span>
        </div>
        <div className="h-2 rounded-full bg-primary/20 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-full rounded-full bg-primary"
          />
        </div>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {plan.milestones.map((m) => {
          const done = isPast(m.date);
          const phaseClass =
            PHASE_COLORS[m.phase] ?? "bg-neutral-100 text-neutral-800 border-neutral-200";

          return (
            <div
              key={m.week}
              className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 text-sm ${
                done ? "bg-primary/5 border-primary/20" : "bg-white border-neutral-200"
              }`}
            >
              <span
                className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium border ${phaseClass}`}
              >
                {m.phase}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-neutral-900">
                    Week {m.week}: {m.title.replace(`Week ${m.week}: `, "")}
                  </span>
                  {done && (
                    <span className="shrink-0 text-primary" aria-label="Completed">
                      ✓
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">{formatDate(m.date)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
