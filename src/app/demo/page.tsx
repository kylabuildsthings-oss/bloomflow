import { redirect } from "next/navigation";
import { DemoDashboardClient } from "./DemoDashboardClient";

export default function DemoPage() {
  const isDemoMode =
    process.env.NEXT_PUBLIC_DEMO_MODE === "true" || process.env.DEMO_MODE === "true";

  if (!isDemoMode) {
    redirect("/");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-10 border-b border-primary/20 pb-6">
        <h1 className="text-3xl font-bold text-primary">
          Demo Dashboard <span className="text-sm font-normal text-amber-600">— DEMO DATA</span>
        </h1>
        <p className="mt-1 text-sm text-foreground/70">
          30-day cycle-aware demo data • Opik trace generation • Judge report
        </p>
        <p className="mt-2 rounded-lg border-2 border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
          DEMO MODE — All data is isolated. No real user data is modified.
        </p>
      </header>
      <DemoDashboardClient />
    </div>
  );
}
