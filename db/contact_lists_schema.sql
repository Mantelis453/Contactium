-- Create contact_lists table
CREATE TABLE IF NOT EXISTS contact_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES contact_lists(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  company TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS contact_lists_user_id_idx ON contact_lists(user_id);
CREATE INDEX IF NOT EXISTS contacts_list_id_idx ON contacts(list_id);
CREATE INDEX IF NOT EXISTS contacts_email_idx ON contacts(email);

-- Enable RLS (Row Level Security)
ALTER TABLE contact_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for contact_lists
CREATE POLICY "Users can view their own contact lists"
  ON contact_lists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contact lists"
  ON contact_lists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contact lists"
  ON contact_lists FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contact lists"
  ON contact_lists FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for contacts
CREATE POLICY "Users can view contacts in their lists"
  ON contacts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM contact_lists
    WHERE contact_lists.id = contacts.list_id
    AND contact_lists.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert contacts in their lists"
  ON contacts FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM contact_lists
    WHERE contact_lists.id = contacts.list_id
    AND contact_lists.user_id = auth.uid()
  ));

CREATE POLICY "Users can update contacts in their lists"
  ON contacts FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM contact_lists
    WHERE contact_lists.id = contacts.list_id
    AND contact_lists.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete contacts in their lists"
  ON contacts FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM contact_lists
    WHERE contact_lists.id = contacts.list_id
    AND contact_lists.user_id = auth.uid()
  ));

-- Update campaign_recipients to support both companies and contacts
ALTER TABLE campaign_recipients
ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS recipient_email TEXT,
ADD COLUMN IF NOT EXISTS recipient_name TEXT;

-- Add check to ensure either company_id or contact_id is set
ALTER TABLE campaign_recipients
ADD CONSTRAINT campaign_recipients_company_or_contact_check
CHECK (
  (company_id IS NOT NULL AND contact_id IS NULL) OR
  (company_id IS NULL AND contact_id IS NOT NULL)
);
