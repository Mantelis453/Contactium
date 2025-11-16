# Deep Scraping Setup Instructions

## Step 1: Run Database Migration

You **MUST** run this migration before using Deep Scrape feature!

### Option A: Via Supabase Dashboard (Recommended)

1. Go to: https://supabase.com/dashboard/project/fyoiswejujtnaosweouu/sql/new
2. Copy the entire contents of `supabase/migrations/add_deep_scraping_fields.sql`
3. Paste into the SQL Editor
4. Click **"Run"** button
5. Wait for success message

### Option B: Via Terminal

```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref fyoiswejujtnaosweouu

# Run migration
supabase db push
```

## Step 2: Verify Migration

Run this query in Supabase SQL Editor to verify columns exist:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'companies'
AND column_name IN (
  'social_media',
  'key_personnel',
  'phone_numbers',
  'technologies',
  'services',
  'certifications',
  'email_pattern',
  'deep_scraped_at',
  'deep_scrape_pages_found',
  'founded_year',
  'employee_count'
);
```

You should see 11 rows returned. If you see 0 rows, the migration didn't run.

## Step 3: Test Deep Scrape

1. Go to Companies page
2. Find a company with a website
3. Click **🔬 Deep** button
4. Wait 1-2 minutes
5. Check results!

## Troubleshooting

### Error: "Edge Function returned a non-2xx status code"

**Cause**: Database columns don't exist (migration not run)

**Solution**: Follow Step 1 above to run the migration

### Error: "Gemini API key is required"

**Cause**: No API key in Settings

**Solution**:
1. Go to Settings
2. Add your Gemini API key
3. Save

### Error: "Could not scrape any pages from the website"

**Cause**: Website blocks automated requests or is down

**Solution**: Try a different company or check if the website is accessible

## Migration SQL

If you need it, here's the full migration:

```sql
-- Add new columns for enhanced deep scraping

ALTER TABLE companies
ADD COLUMN IF NOT EXISTS social_media JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS key_personnel JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS phone_numbers TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS addresses TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS founded_year INTEGER,
ADD COLUMN IF NOT EXISTS employee_count INTEGER,
ADD COLUMN IF NOT EXISTS technologies TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS services TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS certifications TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS email_pattern TEXT,
ADD COLUMN IF NOT EXISTS deep_scraped_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deep_scrape_pages_found INTEGER DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN companies.social_media IS 'Social media links: {linkedin, twitter, facebook, instagram, youtube}';
COMMENT ON COLUMN companies.key_personnel IS 'Array of people: [{name, title, email}]';
COMMENT ON COLUMN companies.phone_numbers IS 'All phone numbers found across website';
COMMENT ON COLUMN companies.addresses IS 'All physical addresses found';
COMMENT ON COLUMN companies.founded_year IS 'Year company was founded';
COMMENT ON COLUMN companies.employee_count IS 'Estimated number of employees';
COMMENT ON COLUMN companies.technologies IS 'Technology stack detected (CMS, analytics, etc)';
COMMENT ON COLUMN companies.services IS 'List of services/products offered';
COMMENT ON COLUMN companies.certifications IS 'Certifications, awards, achievements';
COMMENT ON COLUMN companies.email_pattern IS 'Detected email pattern (e.g., firstname.lastname)';
COMMENT ON COLUMN companies.deep_scraped_at IS 'When deep scraping was last performed';
COMMENT ON COLUMN companies.deep_scrape_pages_found IS 'Number of pages successfully scraped';

-- Create index for deep scraping status
CREATE INDEX IF NOT EXISTS idx_companies_deep_scraped ON companies(deep_scraped_at);
```
