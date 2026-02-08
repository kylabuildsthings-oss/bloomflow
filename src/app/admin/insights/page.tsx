import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { AdminInsightsClient } from "./AdminInsightsClient";

const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL ?? process.env.DEMO_USER_EMAIL ?? "demo@bloomflow.com";

export default async function AdminInsightsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin?callbackUrl=/admin/insights");
  }

  if (session.user?.email !== ADMIN_EMAIL) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-10 border-b border-primary/20 pb-6">
        <h1 className="text-3xl font-bold text-primary">Judge Dashboard</h1>
        <p className="mt-1 text-sm text-foreground/70">
          Opik-powered metrics: workout completion by phase, A/B comparison, AI acceptance
        </p>
      </header>
      <AdminInsightsClient />
    </div>
  );
}
