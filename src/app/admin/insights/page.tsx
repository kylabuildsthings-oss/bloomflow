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
      <h1 className="mb-8 text-2xl font-semibold text-primary">Admin Insights</h1>
      <AdminInsightsClient />
    </div>
  );
}
