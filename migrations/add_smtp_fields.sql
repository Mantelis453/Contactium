-- Add SMTP configuration fields to user_settings table
-- Run this migration in your Supabase SQL Editor

ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS smtp_host TEXT,
ADD COLUMN IF NOT EXISTS smtp_port TEXT DEFAULT '587',
ADD COLUMN IF NOT EXISTS smtp_username TEXT,
ADD COLUMN IF NOT EXISTS smtp_password TEXT,
ADD COLUMN IF NOT EXISTS smtp_secure BOOLEAN DEFAULT false;

-- Add comment to document these fields
COMMENT ON COLUMN user_settings.smtp_host IS 'SMTP server hostname (e.g., smtp.gmail.com)';
COMMENT ON COLUMN user_settings.smtp_port IS 'SMTP server port (587 for TLS, 465 for SSL)';
COMMENT ON COLUMN user_settings.smtp_username IS 'SMTP authentication username (usually email address)';
COMMENT ON COLUMN user_settings.smtp_password IS 'SMTP authentication password or app password';
COMMENT ON COLUMN user_settings.smtp_secure IS 'Use SSL/TLS connection (true for port 465, false for port 587)';
