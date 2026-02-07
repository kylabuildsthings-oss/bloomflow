"use client";

import { useState, useEffect, useCallback } from "react";
import { OnboardingFlow } from "./OnboardingFlow";
import { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export function OnboardingWrapper({ children }: Props) {
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const checkOnboarding = useCallback(async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setNeedsOnboarding(data.needsOnboarding ?? false);
      } else {
        setNeedsOnboarding(false);
      }
    } catch {
      setNeedsOnboarding(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkOnboarding();
  }, [checkOnboarding]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-foreground/60">Loading...</p>
      </div>
    );
  }

  if (needsOnboarding) {
    return (
      <OnboardingFlow
        onComplete={() => {
          setNeedsOnboarding(false);
          checkOnboarding();
        }}
      />
    );
  }

  return <>{children}</>;
}
