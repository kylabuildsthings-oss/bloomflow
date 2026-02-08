"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

const isDemoMode =
  process.env.NEXT_PUBLIC_DEMO_MODE === "true" || process.env.DEMO_MODE === "true";

type Props = { adminEmail?: string };

export function Header({ adminEmail }: Props) {
  const { data: session, status } = useSession();
  const showAdmin = adminEmail && session?.user?.email === adminEmail;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary/20 bg-background">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-xl font-semibold text-primary transition-colors hover:text-primary/80"
        >
          BloomFlow
        </Link>

        <div className="flex items-center gap-3 sm:gap-6 flex-wrap justify-end">
          <Link
            href="/"
            className="text-sm font-medium text-foreground transition-colors hover:text-accent"
          >
            Home
          </Link>
          <Link
            href="/help"
            className="text-sm font-medium text-foreground transition-colors hover:text-accent"
          >
            Help
          </Link>
          {isDemoMode && (
            <Link
              href="/demo"
              className="text-sm font-medium text-amber-700 transition-colors hover:text-amber-800 dark:text-amber-300 dark:hover:text-amber-200"
            >
              Demo
            </Link>
          )}

          {status === "loading" ? (
            <span className="text-sm text-foreground/70">Loading...</span>
          ) : session ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-foreground transition-colors hover:text-accent"
              >
                Dashboard
              </Link>
              {showAdmin && (
                <Link
                  href="/admin/insights"
                  className="text-sm font-medium text-foreground transition-colors hover:text-accent"
                >
                  Admin
                </Link>
              )}
              <span className="hidden sm:inline text-sm text-foreground/70 truncate max-w-[140px]">
                {session.user?.email}
              </span>
              <button
                onClick={() => signOut()}
                className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/90"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/signin"
                className="text-sm font-medium text-foreground transition-colors hover:text-accent"
              >
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
