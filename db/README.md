# Database Migrations

This directory contains SQL scripts for database schema changes.

## Setup Contact Lists Feature

To enable the contact lists feature, run the following SQL script in your Supabase SQL Editor:

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Open the file `contact_lists_schema.sql`
4. Copy and paste the contents into the SQL Editor
5. Click "Run" to execute the script

This will create:
- `contact_lists` table - stores user's custom contact lists
- `contacts` table - stores contacts within each list
- Necessary indexes for performance
- Row Level Security (RLS) policies for data isolation
- Updates to `campaign_recipients` table to support both companies and contacts

## What This Enables

After running this migration, users will be able to:
- Create and manage their own contact lists
- Add custom contacts with email, name, company, and notes
- Choose between sending campaigns to Lithuanian companies or their custom contact lists
- Send campaigns to specific groups of contacts
