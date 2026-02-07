import Link from "next/link";

export default function HomePage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-20 text-center sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl">
        BloomFlow
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-foreground/80">
        Your AI-powered workflow companion. Get started by signing in or exploring the app.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/auth/signin"
          className="rounded-md bg-primary px-6 py-3 text-base font-medium text-white transition-colors hover:bg-primary/90"
        >
          Sign in
        </Link>
        <Link
          href="/dashboard"
          className="rounded-md border border-primary/30 px-6 py-3 text-base font-medium text-primary transition-colors hover:border-primary hover:bg-primary/5"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}
