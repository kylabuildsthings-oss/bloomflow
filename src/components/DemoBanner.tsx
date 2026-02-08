"use client";

import Link from "next/link";

const isDemoMode =
  process.env.NEXT_PUBLIC_DEMO_MODE === "true" || process.env.DEMO_MODE === "true";

export function DemoBanner() {
  if (!isDemoMode) return null;

  return (
    <div className="border-b border-amber-300 bg-amber-100 px-4 py-2 text-center text-sm font-medium text-amber-900 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-200">
      Demo mode — isolated demo data only. No real user data is modified.{" "}
      <Link
        href="/demo"
        className="font-semibold underline hover:no-underline"
      >
        View Demo Dashboard →
      </Link>
    </div>
  );
}
