This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Copy `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from Project Settings > API
3. Run the migration in Supabase Dashboard > SQL Editor:

```sql
-- Copy contents from supabase/migrations/001_initial_schema.sql
```

This creates the `profiles` and `daily_logs` tables with Row-Level Security (RLS).

## API Routes

- **POST /api/logs** — Save a daily log (authenticated). Body: `{ date, sleep_quality?, energy?, stress?, workout_type?, workout_rating?, symptoms?, menstrual_flow? }`. Ratings are 1–5.
- **GET /api/logs** — Fetch the authenticated user's log history.
- **GET /api/ai/coach** — BloomGuide AI workout suggestion based on cycle phase, latest log, and profile (requires `OPENAI_API_KEY`).

### BloomGuide & Cycle Engine

- `cycleEngine`: Takes `lastPeriodStart` (YYYY-MM-DD) and `averageCycleLength`. Calculates current phase (Menstrual, Follicular, Ovulation, Luteal) and predicts next 5 days. Logs to Opik.
- `bloomGuideAI`: Uses cycle phase, latest log (sleep/energy/stress), fitness goal, and test group (A/B). Calls OpenAI gpt-3.5-turbo with a strict system prompt. Logs full trace to Opik.

Profile `cycle_data` (JSONB) format: `{ lastPeriodStart, averageCycleLength, fitnessGoal }`. `test_group` on profile: `motivation_A` (encouraging) or `motivation_B` (nurturing).

## A/B Testing & Admin

- **POST /api/auth/signup** — Creates profile with random `test_group` (motivation_A or motivation_B) and password hash. Requires Supabase.
- **BloomGuide AI** — Uses `test_group` for tone: motivation_A = encouraging/energetic, motivation_B = nurturing/accepting.
- **Opik events** — All log events include `test_group` and `cyclePhase`. Workout logs use `logWorkout` trace name.
- **Admin /admin/insights** — Protected; only `ADMIN_EMAIL` can access. Bar chart (workout completion by group & phase) and symptoms table. Set `ADMIN_EMAIL` in .env.local (defaults to demo user).

## Onboarding & Help

- **Onboarding** — After first login, users complete a 3-step flow: (1) cycle data (last period, average length), (2) fitness goal (Build Consistency, Get Stronger, Lose Weight, Improve Running, Reduce Stress), (3) medical disclaimer (required) and data consent toggles (store locally, personalize AI, share anonymized). Stored in `profiles.cycle_data`, `profiles.consent`, `profiles.onboarding_completed`.
- **GET /api/profile** — Returns profile and `needsOnboarding` status. **PATCH /api/profile** — Saves onboarding/consent. Creates profile if missing (e.g., demo user).
- **/help** — FAQs about cycle syncing and contact (support@bloomflow.app). Fully responsive on mobile.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
