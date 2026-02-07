-- Add menstrual_flow to daily_logs (optional - stores cycle status)
ALTER TABLE daily_logs
ADD COLUMN IF NOT EXISTS menstrual_flow TEXT;
