-- Company Tags Table
-- This table stores predefined and custom tags for categorizing companies

CREATE TABLE IF NOT EXISTS company_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'custom',
  color TEXT NOT NULL DEFAULT '#6366f1',
  description TEXT DEFAULT '',
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster tag lookups
CREATE INDEX IF NOT EXISTS idx_company_tags_name ON company_tags(name);
CREATE INDEX IF NOT EXISTS idx_company_tags_category ON company_tags(category);
CREATE INDEX IF NOT EXISTS idx_company_tags_usage_count ON company_tags(usage_count DESC);

-- Enable Row Level Security
ALTER TABLE company_tags ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read tags
CREATE POLICY "Allow authenticated users to read tags"
  ON company_tags FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert custom tags
CREATE POLICY "Allow authenticated users to create tags"
  ON company_tags FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update tags
CREATE POLICY "Allow authenticated users to update tags"
  ON company_tags FOR UPDATE
  TO authenticated
  USING (true);

-- Allow authenticated users to delete custom tags
CREATE POLICY "Allow authenticated users to delete tags"
  ON company_tags FOR DELETE
  TO authenticated
  USING (category = 'custom');

-- Insert some default tags
INSERT INTO company_tags (name, category, color, description, usage_count) VALUES
  ('SaaS', 'industry', '#3b82f6', 'Software as a Service companies', 0),
  ('E-commerce', 'industry', '#10b981', 'Online retail and marketplace companies', 0),
  ('FinTech', 'industry', '#f59e0b', 'Financial technology companies', 0),
  ('HealthTech', 'industry', '#ef4444', 'Healthcare technology companies', 0),
  ('EdTech', 'industry', '#8b5cf6', 'Education technology companies', 0),
  ('Enterprise', 'size', '#6366f1', 'Large enterprise companies', 0),
  ('SMB', 'size', '#14b8a6', 'Small and medium businesses', 0),
  ('Startup', 'size', '#f97316', 'Early-stage startup companies', 0),
  ('B2B', 'model', '#06b6d4', 'Business to business', 0),
  ('B2C', 'model', '#ec4899', 'Business to consumer', 0),
  ('AI/ML', 'technology', '#6366f1', 'Artificial Intelligence and Machine Learning', 0),
  ('Blockchain', 'technology', '#8b5cf6', 'Blockchain and crypto companies', 0),
  ('IoT', 'technology', '#14b8a6', 'Internet of Things', 0),
  ('Cloud', 'technology', '#3b82f6', 'Cloud computing services', 0),
  ('Mobile', 'technology', '#f59e0b', 'Mobile-first companies', 0)
ON CONFLICT (name) DO NOTHING;

-- Function to update usage_count when tags are used
CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  -- If tags changed, update usage counts
  IF TG_OP = 'UPDATE' AND OLD.tags IS DISTINCT FROM NEW.tags THEN
    -- Decrease count for removed tags
    IF OLD.tags IS NOT NULL THEN
      UPDATE company_tags
      SET usage_count = GREATEST(0, usage_count - 1)
      WHERE name = ANY(OLD.tags)
        AND NOT (name = ANY(NEW.tags));
    END IF;

    -- Increase count for added tags
    IF NEW.tags IS NOT NULL THEN
      UPDATE company_tags
      SET usage_count = usage_count + 1
      WHERE name = ANY(NEW.tags)
        AND (OLD.tags IS NULL OR NOT (name = ANY(OLD.tags)));
    END IF;
  END IF;

  -- If new company with tags
  IF TG_OP = 'INSERT' AND NEW.tags IS NOT NULL THEN
    UPDATE company_tags
    SET usage_count = usage_count + 1
    WHERE name = ANY(NEW.tags);
  END IF;

  -- If company deleted with tags
  IF TG_OP = 'DELETE' AND OLD.tags IS NOT NULL THEN
    UPDATE company_tags
    SET usage_count = GREATEST(0, usage_count - 1)
    WHERE name = ANY(OLD.tags);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on companies table to auto-update tag usage counts
DROP TRIGGER IF EXISTS update_company_tag_usage ON companies;
CREATE TRIGGER update_company_tag_usage
  AFTER INSERT OR UPDATE OR DELETE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_tag_usage_count();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_company_tags_updated_at ON company_tags;
CREATE TRIGGER update_company_tags_updated_at
  BEFORE UPDATE ON company_tags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
