-- =====================================================
-- MISSING DATABASE MIGRATIONS
-- =====================================================
-- Run this file in Supabase SQL Editor to fix errors:
-- 1. Campaign creation: "Could not find the 'contact_id' column"
-- 2. Company tags: 500 errors on company-tags endpoint
-- =====================================================

-- =====================================================
-- 1. UPDATE campaign_recipients TABLE
-- =====================================================
-- Add support for both companies and contacts in campaigns

ALTER TABLE campaign_recipients
ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS recipient_email TEXT,
ADD COLUMN IF NOT EXISTS recipient_name TEXT;

-- Add check to ensure either company_id or contact_id is set
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'campaign_recipients_company_or_contact_check'
  ) THEN
    ALTER TABLE campaign_recipients
    ADD CONSTRAINT campaign_recipients_company_or_contact_check
    CHECK (
      (company_id IS NOT NULL AND contact_id IS NULL) OR
      (company_id IS NULL AND contact_id IS NOT NULL)
    );
  END IF;
END $$;

-- =====================================================
-- 2. CREATE company_tags TABLE
-- =====================================================
-- Store custom tags for companies

CREATE TABLE IF NOT EXISTS company_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_name TEXT NOT NULL UNIQUE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE company_tags ENABLE ROW LEVEL SECURITY;

-- Create RLS policies - tags are globally visible to all authenticated users
CREATE POLICY "Anyone can view tags"
  ON company_tags FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert tags"
  ON company_tags FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update tags"
  ON company_tags FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Insert default tags (only if they don't exist)
INSERT INTO company_tags (tag_name, usage_count) VALUES
  ('High Priority', 0),
  ('Contacted', 0),
  ('Response Pending', 0),
  ('Interested', 0),
  ('Not Interested', 0),
  ('Follow Up', 0),
  ('Meeting Scheduled', 0),
  ('Deal Closed', 0),
  ('Cold Lead', 0),
  ('Warm Lead', 0),
  ('Hot Lead', 0),
  ('Partner', 0),
  ('Competitor', 0),
  ('Archived', 0),
  ('VIP', 0)
ON CONFLICT (tag_name) DO NOTHING;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these after the migration to verify success:

-- Check campaign_recipients columns
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'campaign_recipients'
-- ORDER BY ordinal_position;

-- Check company_tags table
-- SELECT * FROM company_tags ORDER BY tag_name;
