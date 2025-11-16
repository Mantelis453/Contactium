-- Migration: Add web scraping features to companies table
-- Date: 2024-11-15
-- Description: Adds tags, business_summary, extracted_emails, and related fields

-- 1. Add new columns to companies table
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS tags TEXT[], -- Array of tags for categorization
ADD COLUMN IF NOT EXISTS business_summary TEXT, -- AI-generated business summary
ADD COLUMN IF NOT EXISTS extracted_emails TEXT[], -- Array of emails found on website
ADD COLUMN IF NOT EXISTS last_scraped_at TIMESTAMP WITH TIME ZONE, -- Last time website was scraped
ADD COLUMN IF NOT EXISTS scraping_status TEXT CHECK (scraping_status IN ('pending', 'in_progress', 'completed', 'failed')), -- Scraping status
ADD COLUMN IF NOT EXISTS scraping_error TEXT; -- Error message if scraping failed

-- 2. Create index for faster tag searches
CREATE INDEX IF NOT EXISTS idx_companies_tags ON companies USING GIN (tags);

-- 3. Create full-text search index for business summaries
CREATE INDEX IF NOT EXISTS idx_companies_business_summary ON companies USING GIN (to_tsvector('english', COALESCE(business_summary, '')));

-- 4. Create index for scraping status
CREATE INDEX IF NOT EXISTS idx_companies_scraping_status ON companies(scraping_status);

-- 5. Create a tags table for managing available tags (optional but recommended)
CREATE TABLE IF NOT EXISTS company_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  category TEXT, -- e.g., 'industry', 'size', 'technology', 'custom'
  color TEXT, -- Hex color for UI display
  description TEXT,
  usage_count INTEGER DEFAULT 0, -- How many companies use this tag
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create index for tag lookups
CREATE INDEX IF NOT EXISTS idx_company_tags_name ON company_tags(name);
CREATE INDEX IF NOT EXISTS idx_company_tags_category ON company_tags(category);

-- 7. Enable RLS on company_tags table
ALTER TABLE company_tags ENABLE ROW LEVEL SECURITY;

-- 8. Create policy for company_tags (everyone can read, authenticated users can manage)
CREATE POLICY "Everyone can view tags" ON company_tags
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create tags" ON company_tags
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update tags" ON company_tags
  FOR UPDATE USING (auth.role() = 'authenticated');

-- 9. Create function to update tag usage count
CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update usage counts for tags in company_tags table
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Increment counts for new tags
    INSERT INTO company_tags (name, usage_count)
    SELECT unnest(NEW.tags), 1
    ON CONFLICT (name)
    DO UPDATE SET usage_count = company_tags.usage_count + 1;
  END IF;

  IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
    -- Decrement counts for removed tags
    UPDATE company_tags
    SET usage_count = GREATEST(usage_count - 1, 0)
    WHERE name = ANY(OLD.tags);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create trigger to maintain tag usage counts
DROP TRIGGER IF EXISTS update_tag_usage_trigger ON companies;
CREATE TRIGGER update_tag_usage_trigger
AFTER INSERT OR UPDATE OF tags OR DELETE ON companies
FOR EACH ROW
EXECUTE FUNCTION update_tag_usage_count();

-- 11. Create function for full-text search with tags
CREATE OR REPLACE FUNCTION search_companies_with_tags(
  search_query TEXT DEFAULT NULL,
  tag_filters TEXT[] DEFAULT NULL,
  limit_count INTEGER DEFAULT 100,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  email TEXT,
  industry TEXT,
  website TEXT,
  tags TEXT[],
  business_summary TEXT,
  similarity REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.name,
    c.email,
    c.industry,
    c.website,
    c.tags,
    c.business_summary,
    CASE
      WHEN search_query IS NOT NULL THEN
        ts_rank(
          to_tsvector('english', COALESCE(c.name, '') || ' ' || COALESCE(c.business_summary, '') || ' ' || COALESCE(c.industry, '')),
          plainto_tsquery('english', search_query)
        )
      ELSE 0
    END as similarity
  FROM companies c
  WHERE
    (search_query IS NULL OR
     to_tsvector('english', COALESCE(c.name, '') || ' ' || COALESCE(c.business_summary, '') || ' ' || COALESCE(c.industry, '')) @@ plainto_tsquery('english', search_query))
    AND
    (tag_filters IS NULL OR c.tags && tag_filters) -- Check if any tag matches
  ORDER BY similarity DESC, c.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- 12. Insert some common default tags
INSERT INTO company_tags (name, category, color, description) VALUES
  ('B2B', 'business_model', '#3b82f6', 'Business-to-Business company'),
  ('B2C', 'business_model', '#10b981', 'Business-to-Consumer company'),
  ('SaaS', 'business_model', '#8b5cf6', 'Software as a Service'),
  ('E-commerce', 'industry', '#f59e0b', 'Online retail and e-commerce'),
  ('FinTech', 'industry', '#06b6d4', 'Financial Technology'),
  ('HealthTech', 'industry', '#ef4444', 'Healthcare Technology'),
  ('EdTech', 'industry', '#ec4899', 'Education Technology'),
  ('AI/ML', 'technology', '#6366f1', 'Artificial Intelligence / Machine Learning'),
  ('Blockchain', 'technology', '#14b8a6', 'Blockchain and Crypto'),
  ('Cloud', 'technology', '#0ea5e9', 'Cloud Computing'),
  ('Startup', 'size', '#84cc16', 'Early-stage startup'),
  ('Growth-stage', 'size', '#f97316', 'Growth-stage company'),
  ('Enterprise', 'size', '#64748b', 'Large enterprise'),
  ('Remote-first', 'culture', '#22c55e', 'Remote-first company'),
  ('Hiring', 'status', '#a855f7', 'Currently hiring'),
  ('Funded', 'status', '#eab308', 'Recently funded'),
  ('High-growth', 'status', '#f43f5e', 'High-growth company')
ON CONFLICT (name) DO NOTHING;

-- Migration complete!
-- Run this in your Supabase SQL Editor to add scraping features
