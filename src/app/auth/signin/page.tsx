"use client";

import { signIn } from "next-auth/react";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const error = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setFormError("Invalid email or password");
        setIsLoading(false);
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setFormError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-lg border border-primary/20 bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-2xl font-semibold text-primary">Sign in</h1>

        {(error || formError) && (
          <div className="mb-4 rounded-md bg-accent/10 p-3 text-sm text-accent">
            {formError || (error === "CredentialsSignin" && "Invalid email or password")}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-foreground">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full rounded-md border border-primary/30 px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Password
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-sm font-medium text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded-md border border-primary/30 px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-primary px-4 py-2 font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-foreground/70">
          Demo: demo@bloomflow.com / demo123
        </p>

        <p className="mt-4 text-center text-sm text-foreground/70">
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">Loading...</div>}>
      <SignInForm />
    </Suspense>
  );
}
