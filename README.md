# BloomFlow

A women's wellness app with AI-powered workout suggestions, cycle tracking, and daily check-ins. Built with Next.js, Supabase, NextAuth, OpenAI, and Gemini.

---

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment template and fill in your keys
cp .env.local.template .env.local

# Run migrations in Supabase (see Supabase Setup below)

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

Create a `.env.local` file (use `.env.local.template` as a guide) and configure:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (Project Settings → API) |
| `OPENAI_API_KEY` | One of these | OpenAI API key (for BloomGuide AI) |
| `GEMINI_API_KEY` | One of these | Google Gemini API key (fallback when OpenAI quota is exceeded) |
| `NEXTAUTH_SECRET` | Yes | Run `npx auth secret` to generate |
| `NEXTAUTH_URL` | Yes | `http://localhost:3000` (or your deployed URL) |
| `OPIK_API_KEY` or `COMET_API_KEY` | Yes (for LLM tracing) | Comet/Opik API key to feed traces into LLM observability (same key from Comet dashboard). Required for Judge Dashboard, AI trace viewer, and A/B event logging. |
| `RESEND_API_KEY` | For password reset | Resend API key for forgot-password emails |
| `NEXT_PUBLIC_DEMO_MODE` | No | Set to `true` to enable /demo page and demo banner (isolated, no real user data) |
| `ADMIN_EMAIL` | No | Email that can access Admin tab (defaults to demo@bloomflow.com) |
| `DEMO_USER_EMAIL` | No | Demo account email (defaults to demo@bloomflow.com) |

**BloomGuide AI** uses OpenAI first; if OpenAI fails (e.g. quota exceeded), it automatically falls back to Gemini. You need at least one of `OPENAI_API_KEY` or `GEMINI_API_KEY`.

**LLM Tracing (Opik):** Set `OPIK_API_KEY` or `COMET_API_KEY` to feed BloomGuide AI traces, user events, and cycle predictions into Opik/Comet. Required for the Judge Dashboard, A/B metrics, and the Opik trace viewer. The app still runs without it, but tracing features will be disabled.

---

## Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Copy your **Project URL** and **service_role key** from Project Settings → API
3. Add them to `.env.local` as `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
4. Run the migrations:
   - Open **SQL Editor** in your Supabase project
   - Copy the entire contents of `supabase/run-all-migrations.sql`
   - Paste and run it

This creates the `profiles`, `daily_logs`, and `password_reset_tokens` tables with Row-Level Security.

---

## Features

### Authentication
- **Sign up** — Create an account with email and password
- **Sign in** — Log in with your credentials
- **Forgot password** — Request a reset link via email (requires `RESEND_API_KEY`)

### Dashboard & Body Garden
- **Daily check-in** — Log sleep, energy, stress, menstrual flow, workouts, and notes
- **Body Garden** — Visual summary of Sleep Flower, Energy Sunflower, and Workout Vine (7-day averages)
- **BloomGuide AI** — Get personalized workout suggestions based on your cycle phase and recent check-ins. Uses OpenAI with Gemini as fallback.

### Homepage
- **Logged out** — Sign in, Sign up, and Dashboard buttons
- **Logged in** — Plant illustration and “Go to Dashboard” button

### Demo Mode
- Set `NEXT_PUBLIC_DEMO_MODE=true` to enable the **Demo Dashboard** at `/demo`
- Generates 30 days of cycle-aware demo data (stored in localStorage)
- **Generate Opik Evidence** button creates real Opik traces: 15 OpenAI, 10 Gemini fallback, 5 error traces, A/B events, and statistical significance (p_value: 0.032)
- Demo banner appears when demo mode is on. No real user data is ever modified.

### Admin
- The **Admin** tab is only visible when signed in as the admin user (`ADMIN_EMAIL`, defaults to demo account)
- Regular users do not see the Admin tab

### Demo Account
- Sign in with `demo@bloomflow.com` / `demo123` for quick testing
- Demo account **cannot** save daily check-ins (sign up for a real account to track data)

---

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/signup` | POST | Create account |
| `/api/auth/forgot-password` | POST | Send password reset email |
| `/api/auth/reset-password` | POST | Reset password with token |
| `/api/logs` | GET | Fetch your log history |
| `/api/logs` | POST | Save a daily log |
| `/api/profile` | GET | Get profile and onboarding status |
| `/api/profile` | PATCH | Save onboarding and consent |
| `/api/ai/coach` | GET | BloomGuide AI workout suggestion |
| `/api/admin/insights` | GET | Admin analytics (admin only) |
| `/api/demo/generate-opik-evidence` | POST | Create demo Opik traces (demo mode only) |

---

## Database Migrations

To run migrations via CLI (requires `DATABASE_URL` in `.env.local`):

```bash
npm run db:migrate
```

Otherwise, run `supabase/run-all-migrations.sql` manually in the Supabase SQL Editor.

---

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Auth:** NextAuth.js (Credentials provider)
- **Database:** Supabase (PostgreSQL)
- **AI:** OpenAI (gpt-3.5-turbo) + Google Gemini (gemini-1.5-flash) fallback
- **Tracing:** Opik (optional)
- **Email:** Resend (for password reset)

---

## Project Structure

```
src/
├── app/
│   ├── api/          # API routes (auth, logs, profile, ai/coach)
│   ├── auth/         # Sign in, sign up, forgot/reset password
│   ├── dashboard/    # Main dashboard with Body Garden
│   ├── admin/        # Admin insights (admin only)
│   └── help/         # FAQ page
├── components/       # UI components
├── lib/              # Supabase, Opik, BloomGuide AI, cycle engine
└── auth.ts           # NextAuth config
```

---

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [NextAuth.js](https://next-auth.js.org/)
