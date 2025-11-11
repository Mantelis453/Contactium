# ⚠️ Database Migration Required

## Important: Your database needs to be updated!

If you already ran the Supabase setup, you need to run a migration to add the new personalization features.

## Quick Migration (2 minutes)

1. Open your Supabase Dashboard: https://supabase.com/dashboard
2. Go to SQL Editor
3. Copy and paste this SQL:

```sql
-- AI Provider Support (OpenAI + Gemini)
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS ai_provider TEXT DEFAULT 'openai' CHECK (ai_provider IN ('openai', 'gemini')),
ADD COLUMN IF NOT EXISTS gemini_api_key TEXT;

UPDATE user_settings
SET ai_provider = 'openai'
WHERE ai_provider IS NULL;

-- Personalization Fields for Individual Emails
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS sender_name TEXT,
ADD COLUMN IF NOT EXISTS sender_company TEXT,
ADD COLUMN IF NOT EXISTS sender_title TEXT,
ADD COLUMN IF NOT EXISTS value_proposition TEXT,
ADD COLUMN IF NOT EXISTS call_to_action TEXT;
```

4. Click "Run" or press Ctrl+Enter
5. Done! Your database is updated.

## What's New?

### 1. Multiple AI Providers
- Choose between OpenAI GPT-4 and Google Gemini
- Gemini is more cost-effective for high-volume campaigns

### 2. Personalized Emails
- Each company gets a unique, personalized email
- AI considers:
  - Company name and industry
  - Your name, company, and title
  - Custom value proposition
  - Specific call to action
- No more generic templates!

### 3. Batch Generation
- Generate personalized emails for all selected companies
- See real-time progress
- Preview samples before sending

## If You're Starting Fresh

Just run the updated `SUPABASE_SETUP.md` file - it already includes all these changes!

## Need Help?

Check `DATABASE_MIGRATION.md` for detailed migration instructions and verification steps.
