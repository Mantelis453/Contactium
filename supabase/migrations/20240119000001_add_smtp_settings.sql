-- Add SMTP configuration fields to user_settings table
-- This allows users to configure their own SMTP server for sending emails

ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS smtp_host TEXT,
ADD COLUMN IF NOT EXISTS smtp_port TEXT DEFAULT '587',
ADD COLUMN IF NOT EXISTS smtp_user TEXT,
ADD COLUMN IF NOT EXISTS smtp_pass TEXT,
ADD COLUMN IF NOT EXISTS smtp_from_email TEXT,
ADD COLUMN IF NOT EXISTS smtp_from_name TEXT;

-- Add comment to explain the fields
COMMENT ON COLUMN user_settings.smtp_host IS 'SMTP server hostname (e.g., smtp.gmail.com)';
COMMENT ON COLUMN user_settings.smtp_port IS 'SMTP server port (587 for TLS, 465 for SSL)';
COMMENT ON COLUMN user_settings.smtp_user IS 'SMTP username (usually your email address)';
COMMENT ON COLUMN user_settings.smtp_pass IS 'SMTP password or app-specific password';
COMMENT ON COLUMN user_settings.smtp_from_email IS 'Email address to send from (defaults to smtp_user if not set)';
COMMENT ON COLUMN user_settings.smtp_from_name IS 'Name to display as sender (defaults to campaign sender_name if not set)';
