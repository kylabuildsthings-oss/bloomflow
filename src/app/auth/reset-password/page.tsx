"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (!token) {
      toast.error("Invalid reset link. Please request a new one.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Something went wrong");
        setIsLoading(false);
        return;
      }

      toast.success("Password reset! Sign in with your new password.");
      router.push("/auth/signin");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-lg border border-primary/20 bg-white p-8 shadow-sm">
          <h1 className="mb-2 text-2xl font-semibold text-primary">Invalid link</h1>
          <p className="mb-4 text-sm text-neutral-600">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <Link
            href="/auth/forgot-password"
            className="block w-full rounded-md bg-primary px-4 py-2 text-center font-medium text-white hover:bg-primary/90"
          >
            Request new reset link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-lg border border-primary/20 bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-2xl font-semibold text-primary">Reset password</h1>
        <p className="mb-6 text-sm text-neutral-600">
          Enter your new password below.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-neutral-800">
              New password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full rounded-md border border-neutral-300 px-4 py-2 text-neutral-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label htmlFor="confirm" className="mb-1 block text-sm font-medium text-neutral-800">
              Confirm password
            </label>
            <input
              id="confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full rounded-md border border-neutral-300 px-4 py-2 text-neutral-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-primary px-4 py-2 font-medium text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {isLoading ? "Resetting..." : "Reset password"}
          </button>

          <p className="text-center text-sm text-neutral-600">
            <Link href="/auth/signin" className="font-medium text-primary hover:underline">
              Back to sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
