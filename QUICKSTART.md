# Quick Start Guide

Get your Contactium cold email platform up and running in 10 minutes!

## Prerequisites

- Node.js 20.19+ or 22.12+ installed
- A Supabase account (free tier works)
- An OpenAI API key (for AI email generation)

## Step-by-Step Setup

### 1. Environment Configuration (2 minutes)

Your `.env.local` file already exists with your Supabase credentials:
```
VITE_SUPABASE_URL=https://fyoiswejujtnaosweouu.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGci...
```

### 2. Database Setup (5 minutes)

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on "SQL Editor" in the left sidebar
4. Click "New Query"
5. Open `SUPABASE_SETUP.md` in this project
6. Copy ALL the SQL commands (sections 1-7)
7. Paste into the Supabase SQL Editor
8. Click "Run" or press Ctrl+Enter

This creates all necessary tables, relationships, and security policies.

### 3. Add Sample Companies (2 minutes)

The SQL setup already includes sample Lithuanian companies. You can add more:

```sql
INSERT INTO companies (name, email, industry, company_size, location, website) VALUES
('TechStartup LT', 'hello@techstartup.lt', 'technology', '1-10', 'vilnius', 'https://techstartup.lt'),
('HealthCare Solutions', 'info@healthcare.lt', 'healthcare', '51-200', 'kaunas', 'https://healthcare.lt');
```

### 4. Start the App (1 minute)

The development server is already running at: **http://localhost:5173**

If not, run:
```bash
npm run dev
```

### 5. First Login and Setup

1. **Open** http://localhost:5173 in your browser
2. **Sign Up** with your email and password
3. **Go to Settings** (click Settings in the navigation)
4. **Configure**:
   - Sender Name: Your name or company name
   - Sender Email: Your email address
   - Daily Limit: 50-100 (recommended for cold emails)
   - AI Provider: Choose between OpenAI or Google Gemini
     - **OpenAI**: Get API key from https://platform.openai.com/api-keys
     - **Gemini**: Get API key from https://makersuite.google.com/app/apikey (more cost-effective)
5. **Click "Save Settings"**

### 6. Create Your First Campaign

1. **Click "Create"** in the navigation
2. **Fill in details**:
   - Campaign Name: "Test Campaign"
   - Category: "Technology"
   - Description: "We help tech companies automate their sales outreach with AI"
3. **Filter companies**:
   - Select filters (or leave empty for all)
   - Click "Load Companies"
   - Select companies you want to target
4. **Generate email**:
   - Click "Generate Email with AI"
   - Review the generated email
   - Click "Approve Email"
5. **Click "Save Campaign"**

Done! Your first campaign is created.

## What's Next?

- **Dashboard**: View your campaign statistics
- **Campaigns**: Manage all your campaigns
- **Settings**: Update your configuration anytime

## Common Issues

### "Failed to load companies"
- Make sure you ran all SQL commands in Supabase
- Check that the companies table has data

### "Please configure your AI API key"
- Go to Settings and select your AI provider
- Add the corresponding API key:
  - OpenAI: https://platform.openai.com/api-keys
  - Gemini: https://makersuite.google.com/app/apikey

### "Failed to save campaign"
- Make sure you filled in all required fields
- Check that you selected at least one company
- Ensure you approved the email

### Database Connection Issues
- Verify your `.env.local` has the correct Supabase URL and key
- Check your Supabase project is active

## Tips for Best Results

1. **Start Small**: Test with 5-10 companies first
2. **Personalize**: Write detailed campaign descriptions for better AI emails
3. **Daily Limits**: Keep daily email limits under 100 to avoid spam filters
4. **Follow Up**: Plan follow-up sequences for non-responders
5. **Track Results**: Monitor open and reply rates in the dashboard

## Need Help?

- Check `README.md` for detailed documentation
- Review `SUPABASE_SETUP.md` for database schema
- Supabase docs: https://supabase.com/docs
- OpenAI docs: https://platform.openai.com/docs

Happy cold emailing! 🚀
