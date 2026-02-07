-- BloomFlow: run all migrations in Supabase SQL Editor
-- Copy this entire file and paste into: https://supabase.com/dashboard/project/wjxsulcpqyzmjrmaskbo/sql/new

-- 001: profiles and daily_logs tables with RLS
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  cycle_data JSONB DEFAULT '{}',
  test_group TEXT
);

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

CREATE INDEX IF NOT EXISTS idx_daily_logs_user_id ON daily_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_date ON daily_logs(date);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restrict profiles" ON profiles FOR ALL USING (false);
CREATE POLICY "Restrict daily_logs" ON daily_logs FOR ALL USING (false);

-- 002: menstrual_flow
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS menstrual_flow TEXT;

-- 003: A/B testing
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS cycle_phase TEXT;

-- 004: onboarding
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS consent JSONB DEFAULT '{}';

-- 005: password reset
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Restrict password_reset_tokens" ON password_reset_tokens FOR ALL USING (false);
