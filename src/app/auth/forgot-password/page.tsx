"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Something went wrong");
        setIsLoading(false);
        return;
      }

      setSent(true);
      toast.success("Check your email for a reset link.");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-lg border border-primary/20 bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-2xl font-semibold text-primary">Forgot password</h1>
        <p className="mb-6 text-sm text-neutral-600">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>

        {sent ? (
          <div className="space-y-4">
            <p className="text-sm text-neutral-700">
              If an account exists with that email, you&apos;ll receive a reset link shortly.
              Check your spam folder if you don&apos;t see it.
            </p>
            <Link
              href="/auth/signin"
              className="block w-full rounded-md bg-primary px-4 py-2 text-center font-medium text-white hover:bg-primary/90"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-neutral-800">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-md border border-neutral-300 px-4 py-2 text-neutral-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-md bg-primary px-4 py-2 font-medium text-white hover:bg-primary/90 disabled:opacity-50"
            >
              {isLoading ? "Sending..." : "Send reset link"}
            </button>

            <p className="text-center text-sm text-neutral-600">
              <Link href="/auth/signin" className="font-medium text-primary hover:underline">
                Back to sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
