-- BloomFlow: profiles and daily_logs tables with RLS
-- Run this in Supabase Dashboard > SQL Editor

-- profiles: user profile with cycle data and A/B test group
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  cycle_data JSONB DEFAULT '{}',
  test_group TEXT
);

-- daily_logs: wellness/period tracking logs
CREATE TABLE IF NOT EXISTS daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  sleep_quality INT CHECK (sleep_quality >= 1 AND sleep_quality <= 5),
  energy INT CHECK (energy >= 1 AND energy <= 5),
  stress INT CHECK (stress >= 1 AND stress <= 5),
  workout_type TEXT,
  workout_rating INT CHECK (workout_rating >= 1 AND workout_rating <= 5),
  symptoms TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_id ON daily_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_date ON daily_logs(date);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Enable Row-Level Security (RLS) on both tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies: API routes use service role (bypasses RLS). These policies
-- restrict direct anon/key access. Supabase Auth users can be added later.
CREATE POLICY "Restrict profiles" ON profiles
  FOR ALL USING (false);

CREATE POLICY "Restrict daily_logs" ON daily_logs
  FOR ALL USING (false);
