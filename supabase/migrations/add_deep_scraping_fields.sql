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
