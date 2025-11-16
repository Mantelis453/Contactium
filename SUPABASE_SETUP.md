# Supabase Database Setup Instructions

Run these SQL commands in your Supabase SQL Editor to create the necessary tables:

## 1. Companies Table (Lithuanian Business Database)

```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  industry TEXT,
  company_size TEXT,
  location TEXT,
  website TEXT,
  phone TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster filtering
CREATE INDEX idx_companies_industry ON companies(industry);
CREATE INDEX idx_companies_size ON companies(company_size);
CREATE INDEX idx_companies_location ON companies(location);
```

## 2. Campaigns Table

```sql
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  email_subject TEXT,
  email_body TEXT,
  send_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'not-started' CHECK (status IN ('not-started', 'running', 'completed', 'paused')),
  emails_sent INTEGER DEFAULT 0,
  emails_opened INTEGER DEFAULT 0,
  emails_replied INTEGER DEFAULT 0,
  -- Personalization fields
  sender_name TEXT,
  sender_company TEXT,
  sender_title TEXT,
  value_proposition TEXT,
  call_to_action TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for user queries
CREATE INDEX idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
```

## 3. Campaign Recipients Table (Links campaigns to companies)

```sql
CREATE TABLE campaign_recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  personalized_email TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'opened', 'replied', 'bounced')),
  sent_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  replied_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(campaign_id, company_id)
);

-- Create indexes
CREATE INDEX idx_campaign_recipients_campaign ON campaign_recipients(campaign_id);
CREATE INDEX idx_campaign_recipients_company ON campaign_recipients(company_id);
CREATE INDEX idx_campaign_recipients_status ON campaign_recipients(status);
```

## 4. User Settings Table

```sql
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  sender_name TEXT,
  sender_email TEXT,
  daily_limit INTEGER DEFAULT 100,
  ai_provider TEXT DEFAULT 'openai' CHECK (ai_provider IN ('openai', 'gemini')),
  openai_api_key TEXT,
  gemini_api_key TEXT,
  email_provider TEXT DEFAULT 'supabase',
  email_provider_config JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for user lookups
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);
```

## 5. Enable Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Campaigns policies
CREATE POLICY "Users can view their own campaigns" ON campaigns
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own campaigns" ON campaigns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaigns" ON campaigns
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own campaigns" ON campaigns
  FOR DELETE USING (auth.uid() = user_id);

-- User settings policies
CREATE POLICY "Users can view their own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Campaign recipients policies
CREATE POLICY "Users can view their campaign recipients" ON campaign_recipients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = campaign_recipients.campaign_id
      AND campaigns.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert campaign recipients" ON campaign_recipients
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = campaign_recipients.campaign_id
      AND campaigns.user_id = auth.uid()
    )
  );

-- Companies table - everyone can read (for now)
CREATE POLICY "Everyone can view companies" ON companies
  FOR SELECT USING (true);

-- Optional: Admin policy for inserting companies
CREATE POLICY "Service role can manage companies" ON companies
  FOR ALL USING (auth.role() = 'service_role');
```

## 6. Sample Data (Optional - for testing)

```sql
INSERT INTO companies (name, email, industry, company_size, location, website) VALUES
('TechCorp Lithuania', 'info@techcorp.lt', 'technology', '51-200', 'vilnius', 'https://techcorp.lt'),
('MediHealth Solutions', 'contact@medihealth.lt', 'healthcare', '11-50', 'kaunas', 'https://medihealth.lt'),
('FinanceHub Baltic', 'hello@financehub.lt', 'finance', '201+', 'vilnius', 'https://financehub.lt'),
('RetailPro Lithuania', 'info@retailpro.lt', 'retail', '51-200', 'klaipeda', 'https://retailpro.lt'),
('ManufacturePlus', 'contact@manuplus.lt', 'manufacturing', '201+', 'siauliai', 'https://manuplus.lt'),
('StartupX Innovations', 'hello@startupx.lt', 'technology', '1-10', 'vilnius', 'https://startupx.lt'),
('HealthCare+ Services', 'info@healthcareplus.lt', 'healthcare', '11-50', 'vilnius', 'https://healthcareplus.lt'),
('Baltic Traders', 'sales@baltictraders.lt', 'retail', '11-50', 'klaipeda', 'https://baltictraders.lt'),
('Green Energy LT', 'info@greenenergy.lt', 'technology', '51-200', 'kaunas', 'https://greenenergy.lt'),
('Construction Pro', 'contact@constructionpro.lt', 'manufacturing', '51-200', 'vilnius', 'https://constructionpro.lt');
```

## 7. Create Database Functions (Optional but recommended)

```sql
-- Function to update campaign stats
CREATE OR REPLACE FUNCTION update_campaign_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE campaigns
  SET
    emails_sent = (SELECT COUNT(*) FROM campaign_recipients WHERE campaign_id = NEW.campaign_id AND status IN ('sent', 'opened', 'replied')),
    emails_opened = (SELECT COUNT(*) FROM campaign_recipients WHERE campaign_id = NEW.campaign_id AND status IN ('opened', 'replied')),
    emails_replied = (SELECT COUNT(*) FROM campaign_recipients WHERE campaign_id = NEW.campaign_id AND status = 'replied'),
    updated_at = NOW()
  WHERE id = NEW.campaign_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_campaign_stats_trigger
AFTER UPDATE ON campaign_recipients
FOR EACH ROW
EXECUTE FUNCTION update_campaign_stats();
```

## 8. Add Web Scraping Features (New)

To enable website scraping, email extraction, AI summaries, and tagging:

```sql
-- Run the migration file
-- Copy and paste contents from: supabase/migrations/add_scraping_features.sql
```

Or manually run the commands to add:
- Tags array column for company categorization
- Business summary field (AI-generated)
- Extracted emails array
- Scraping status tracking
- Full-text search on summaries
- Tag management table with usage counts

## 8.1. Add Lithuanian Business Activity Tags (Optional)

To add 288 Lithuanian business activity categories as pre-populated tags:

```sql
-- Run the migration file
-- Copy and paste contents from: supabase/migrations/add_lithuanian_activity_tags.sql
```

This will populate the `company_tags` table with common Lithuanian business activities such as:
- Akmens gaminiai (Stone products)
- Automobilių prekyba (Car sales)
- Baldai (Furniture)
- IT paslaugos (IT services)
- And 284 more...

## 9. Deploy Supabase Edge Functions

Deploy the scraping and tag management functions:

```bash
# Login to Supabase CLI
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy functions
supabase functions deploy scrape-company
supabase functions deploy company-tags
```

## After running these commands:

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste these SQL commands
4. Execute them in order
5. Deploy the Edge Functions
6. Your database schema will be ready with scraping features!
