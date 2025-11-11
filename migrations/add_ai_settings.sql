-- Add language and email style settings
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS email_language VARCHAR(50) DEFAULT 'English',
ADD COLUMN IF NOT EXISTS email_tone VARCHAR(50) DEFAULT 'professional',
ADD COLUMN IF NOT EXISTS email_length VARCHAR(50) DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS personalization_level VARCHAR(50) DEFAULT 'high';

-- Add comment to describe the new columns
COMMENT ON COLUMN user_settings.email_language IS 'Language for AI-generated emails (English, Spanish, French, German, etc.)';
COMMENT ON COLUMN user_settings.email_tone IS 'Tone of emails: casual, professional, formal';
COMMENT ON COLUMN user_settings.email_length IS 'Length of emails: short, medium, long';
COMMENT ON COLUMN user_settings.personalization_level IS 'Level of personalization: low, medium, high';
