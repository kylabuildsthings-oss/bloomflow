"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const errorMessages: Record<string, string> = {
    Configuration: "There is a problem with the server configuration.",
    AccessDenied: "Access denied.",
    Verification: "The verification link may have expired or already been used.",
    Default: "An error occurred during authentication.",
  };

  const message = error ? errorMessages[error] ?? errorMessages.Default : errorMessages.Default;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-lg border border-primary/20 bg-white p-8 shadow-sm">
        <h1 className="mb-4 text-2xl font-semibold text-accent">Authentication Error</h1>
        <p className="mb-6 text-foreground/80">{message}</p>
        <Link
          href="/auth/signin"
          className="block w-full rounded-md bg-primary px-4 py-2 text-center font-medium text-white transition-colors hover:bg-primary/90"
        >
          Try again
        </Link>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">Loading...</div>}>
      <AuthErrorContent />
    </Suspense>
  );
}
