-- A/B testing: password_hash for signup, cycle_phase for admin insights
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS cycle_phase TEXT;
