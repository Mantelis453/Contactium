-- Drop the existing companies table if it exists (from the old setup)
DROP TABLE IF EXISTS campaign_recipients CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

-- Create companies table matching the exact CSV structure
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Exact CSV columns in order
  company_code VARCHAR(255) UNIQUE,
  company_name TEXT NOT NULL,
  company_code_verify TEXT,
  address TEXT,
  scorist_rating DECIMAL(10,2),
  phone VARCHAR(100),
  website TEXT,
  email VARCHAR(255),
  registration_address TEXT,
  employees INTEGER,
  sodra_debt_days INTEGER,
  sodra_debt TEXT,
  vmi_debt TEXT,
  vehicles INTEGER,
  financial_reports TEXT,
  activity TEXT,

  -- Standard timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for filtering
CREATE INDEX idx_companies_company_code ON companies(company_code);
CREATE INDEX idx_companies_company_name ON companies(company_name);
CREATE INDEX idx_companies_activity ON companies(activity);
CREATE INDEX idx_companies_employees ON companies(employees);
CREATE INDEX idx_companies_scorist_rating ON companies(scorist_rating);

-- Enable Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Create policies - All authenticated users can read, only service role can modify
CREATE POLICY "Everyone can view companies"
  ON companies FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage companies"
  ON companies FOR ALL
  USING (auth.role() = 'service_role');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_companies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_companies_updated_at();

-- Recreate campaign_recipients table with the new companies table
CREATE TABLE IF NOT EXISTS campaign_recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  personalized_email TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'opened', 'replied', 'bounced')),
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, company_id)
);

-- Create indexes for campaign_recipients
CREATE INDEX idx_campaign_recipients_campaign ON campaign_recipients(campaign_id);
CREATE INDEX idx_campaign_recipients_company ON campaign_recipients(company_id);
CREATE INDEX idx_campaign_recipients_status ON campaign_recipients(status);

-- Enable RLS on campaign_recipients
ALTER TABLE campaign_recipients ENABLE ROW LEVEL SECURITY;

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
