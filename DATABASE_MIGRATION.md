# Database Migration Guide

If you already set up your database before the latest updates, you need to run these migrations to support the new features.

## Migration 1: AI Provider Support (Gemini)

Run this SQL command in your Supabase SQL Editor:

```sql
-- Add new columns for AI provider selection
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS ai_provider TEXT DEFAULT 'openai' CHECK (ai_provider IN ('openai', 'gemini')),
ADD COLUMN IF NOT EXISTS gemini_api_key TEXT;

-- Update existing records to have openai as default provider
UPDATE user_settings
SET ai_provider = 'openai'
WHERE ai_provider IS NULL;
```

## Migration 2: Personalization Fields for Campaigns

Run this SQL command to add personalization fields to campaigns:

```sql
-- Add personalization fields to campaigns table
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS sender_name TEXT,
ADD COLUMN IF NOT EXISTS sender_company TEXT,
ADD COLUMN IF NOT EXISTS sender_title TEXT,
ADD COLUMN IF NOT EXISTS value_proposition TEXT,
ADD COLUMN IF NOT EXISTS call_to_action TEXT;
```

## Run All Migrations at Once

You can also run all migrations together:

```sql
-- AI Provider Support
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS ai_provider TEXT DEFAULT 'openai' CHECK (ai_provider IN ('openai', 'gemini')),
ADD COLUMN IF NOT EXISTS gemini_api_key TEXT;

UPDATE user_settings
SET ai_provider = 'openai'
WHERE ai_provider IS NULL;

-- Personalization Fields
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS sender_name TEXT,
ADD COLUMN IF NOT EXISTS sender_company TEXT,
ADD COLUMN IF NOT EXISTS sender_title TEXT,
ADD COLUMN IF NOT EXISTS value_proposition TEXT,
ADD COLUMN IF NOT EXISTS call_to_action TEXT;
```

## Verify the Migrations

You can verify the migrations were successful by running:

```sql
-- Check user_settings columns
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'user_settings'
ORDER BY ordinal_position;

-- Check campaigns columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'campaigns'
ORDER BY ordinal_position;
```

You should see:
- `ai_provider` and `gemini_api_key` in user_settings
- `sender_name`, `sender_company`, `sender_title`, `value_proposition`, `call_to_action` in campaigns

## Next Steps

1. Go to your app Settings page
2. Select your preferred AI provider
3. Add the corresponding API key
4. Create campaigns with personalized emails!

Your database is now fully up to date!
