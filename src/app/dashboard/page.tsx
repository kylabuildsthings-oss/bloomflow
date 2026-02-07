import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { BodyGarden } from "@/components/BodyGarden";
import { OnboardingWrapper } from "@/components/OnboardingWrapper";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin?callbackUrl=/dashboard");
  }

  return (
    <OnboardingWrapper>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-12 lg:px-8">
        <h1 className="text-xl font-semibold text-primary mb-2 sm:text-2xl">
          Dashboard
        </h1>
        <p className="mb-6 text-foreground/80 sm:mb-8 text-sm sm:text-base">
          Welcome back, {session.user?.email}. You are signed in.
        </p>
        <BodyGarden />
      </div>
    </OnboardingWrapper>
  );
}
