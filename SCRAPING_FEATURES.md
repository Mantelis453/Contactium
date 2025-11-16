# Web Scraping & Company Intelligence Features

This document describes the website scraping, email extraction, AI-powered business summaries, and tagging system added to Contactium.

## Overview

The scraping system allows you to:
- **Scrape company websites** to extract additional email addresses
- **Generate AI business summaries** using OpenAI GPT-4
- **Auto-generate tags** for better company categorization
- **Filter companies by tags** for targeted outreach
- **Full-text search** across company summaries

## Features

### 1. Website Scraping

**What it does:**
- Fetches the company's website content
- Extracts all email addresses found on the site
- Filters out common false positives (example.com, tracking emails, etc.)
- Stores unique emails in the database

**How to use:**
1. Navigate to Companies page
2. Find a company with a website URL
3. Click the "🔍 Scrape" button
4. Wait for the scraping to complete
5. Expand the row to see extracted emails

### 2. AI Business Summaries

**What it does:**
- Uses Google Gemini 2.0 Flash to analyze website content
- Generates a concise professional summary (under 150 words)
- Focuses on: what they do, who they serve, key products/services, value proposition

**Requirements:**
- Gemini API key must be configured in Settings

**Example Summary:**
```
TechStartup is a B2B SaaS company providing cloud-based project
management solutions for remote teams. They serve small to medium-sized
businesses across Europe, offering features like real-time collaboration,
task automation, and analytics. Their unique value proposition is
seamless integration with 100+ existing tools while maintaining
enterprise-grade security.
```

### 3. Auto-Generated Tags

**What it does:**
- Automatically includes the company's Lithuanian business activity as a tag (if set in database)
- AI analyzes the company's business summary and website
- Automatically suggests 3-7 additional relevant tags
- Tags help categorize companies for better targeting

**Tag sources:**
1. **Activity Tag** (automatic): Company's Lithuanian business activity field (e.g., "IT paslaugos", "Automobilių prekyba")
2. **AI Tags** (generated): Business model, industry, technology, size, status

**Common AI tag categories:**
- **Business Model**: B2B, B2C, SaaS, E-commerce
- **Industry**: FinTech, HealthTech, EdTech
- **Technology**: AI/ML, Blockchain, Cloud
- **Size**: Startup, Growth-stage, Enterprise
- **Status**: Hiring, Funded, High-growth

### 4. Tag Management

**Add tags to companies:**
1. Click the "+" button in the Tags column
2. Select from predefined tags or commonly used tags
3. Tags are saved automatically

**Remove tags:**
- Click the "×" button on any tag badge

**Filter by tags:**
- Use the tag filter section above the companies table
- Click tags to filter companies
- Multiple tags can be selected (shows companies with ANY selected tag)

### 5. Advanced Search

**Full-text search includes:**
- Company name
- Business summary
- Industry
- Tags

**Benefits:**
- Find companies by what they do, not just their name
- Search for specific technologies or services
- Discover similar companies based on descriptions

## Database Schema

### New Columns in `companies` table:

```sql
tags TEXT[]                    -- Array of tag names
business_summary TEXT          -- AI-generated summary
extracted_emails TEXT[]        -- Emails found on website
last_scraped_at TIMESTAMP      -- When website was last scraped
scraping_status TEXT           -- pending, in_progress, completed, failed
scraping_error TEXT            -- Error message if failed
```

### New `company_tags` table:

```sql
id UUID                        -- Unique tag ID
name TEXT                      -- Tag name (unique)
category TEXT                  -- Tag category (industry, size, etc.)
color TEXT                     -- Hex color for UI
description TEXT               -- Tag description
usage_count INTEGER            -- How many companies use this tag
created_at TIMESTAMP
updated_at TIMESTAMP
```

## API Endpoints

### Scrape Company Website

**Endpoint**: Supabase Edge Function `scrape-company`

**Request:**
```json
{
  "companyId": "uuid",
  "website": "https://company.com",
  "companyName": "Company Name",
  "geminiApiKey": "AIza..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "company": { /* updated company object */ },
    "extracted_emails": ["info@company.com", "sales@company.com"],
    "business_summary": "AI-generated summary...",
    "tags": ["B2B", "SaaS", "AI/ML"],
    "emails_found": 2
  }
}
```

### Manage Tags

**Endpoint**: Supabase Edge Function `company-tags`

**Get all tags** (GET):
```
GET /company-tags?category=industry&limit=50
```

**Create new tag** (POST):
```json
{
  "name": "Custom Tag",
  "category": "custom",
  "color": "#6366f1",
  "description": "Description"
}
```

**Update company tags** (PUT):
```json
{
  "companyId": "uuid",
  "tags": ["Tag1", "Tag2", "Tag3"]
}
```

## Setup Instructions

### 1. Run Database Migration

```bash
# In Supabase SQL Editor, run:
supabase/migrations/add_scraping_features.sql
```

This adds all necessary columns, indexes, and functions.

### 2. Deploy Edge Functions

```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy functions
supabase functions deploy scrape-company
supabase functions deploy company-tags
```

### 3. Configure Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. In Contactium, go to Settings
4. Paste your API key in the Gemini API Key field
5. Save settings

### 4. Seed Default Tags (Optional)

Default tags are automatically created by the migration, including:
- B2B, B2C, SaaS, E-commerce
- FinTech, HealthTech, EdTech
- AI/ML, Blockchain, Cloud
- Startup, Growth-stage, Enterprise
- Remote-first, Hiring, Funded

## Usage Examples

### Example 1: Scrape a Single Company

```javascript
// Via Supabase client
const { data, error } = await supabase.functions.invoke('scrape-company', {
  body: {
    companyId: 'company-uuid',
    website: 'https://techstartup.com',
    companyName: 'TechStartup',
    geminiApiKey: 'AIza...'
  }
})

// Response will include:
// - extracted_emails: ["info@techstartup.com", "sales@techstartup.com"]
// - business_summary: "AI-generated summary..."
// - tags: ["IT paslaugos", "B2B", "SaaS", "AI/ML"]
//   (First tag is from company's activity field, rest are AI-generated)
```

### Example 2: Search Companies with Tags

```sql
-- Find all SaaS companies that are hiring
SELECT * FROM companies
WHERE tags && ARRAY['SaaS', 'Hiring'];
```

### Example 3: Full-Text Search

```sql
-- Search companies by summary content
SELECT * FROM companies
WHERE to_tsvector('english', business_summary) @@ plainto_tsquery('english', 'cloud project management');
```

### Example 4: Get Popular Tags

```sql
-- Get top 20 most used tags
SELECT name, usage_count, category, color
FROM company_tags
ORDER BY usage_count DESC
LIMIT 20;
```

## Best Practices

### Scraping

✅ **Do:**
- Scrape companies with valid website URLs
- Wait for scraping to complete before re-scraping
- Check `last_scraped_at` to avoid duplicate scraping
- Review extracted emails before using in campaigns

❌ **Don't:**
- Scrape the same company multiple times in a short period
- Use without an OpenAI API key (summaries won't be generated)
- Scrape websites that prohibit automated access

### Tagging

✅ **Do:**
- Use consistent tag names across companies
- Choose 3-7 relevant tags per company
- Leverage AI-generated tags as a starting point
- Create custom tags for your specific use case

❌ **Don't:**
- Over-tag companies (keep it focused)
- Create duplicate tags with different casing
- Use overly specific tags that won't apply to other companies

### Performance

- **Scraping speed**: ~3-5 seconds per company
- **AI summary generation**: ~2-3 seconds
- **Tag auto-generation**: ~1-2 seconds
- **Batch scraping**: Recommended maximum 10 companies at a time

## Troubleshooting

### Scraping Fails

**Problem**: "Failed to scrape website" error

**Solutions:**
1. Check if website URL is correct and accessible
2. Verify website allows automated access (no CAPTCHA)
3. Check Supabase Edge Function logs for details
4. Ensure Gemini API key is valid

### No Emails Found

**Problem**: Scraping succeeds but no emails extracted

**Possible reasons:**
1. Website uses contact forms instead of email addresses
2. Emails are dynamically loaded (JavaScript-heavy sites)
3. Emails are images or obfuscated
4. Website structure prevents email extraction

**Alternative**: Manually add emails to the company record

### Tags Not Appearing

**Problem**: Tags don't show in filter section

**Solutions:**
1. Refresh the page
2. Check if any companies have tags assigned
3. Verify migration ran successfully
4. Check browser console for errors

### AI Summary is Generic

**Problem**: Generated summary lacks detail

**Reasons:**
1. Website content is limited or vague
2. Website is mainly images/videos
3. AI model needs more context

**Solution**: Edit the summary manually or provide more detailed website content

## Cost Considerations

### Google Gemini API Usage

- **Model**: Gemini 2.0 Flash
- **Summary generation**: ~300 tokens per company
- **Tag generation**: ~100 tokens per company
- **Total**: ~400 tokens

**Gemini 2.0 Flash Pricing:**
- **Free tier**: 1,500 requests per day, 1 million tokens per day
- **Paid tier**: Free up to limits, then very low cost

**Monthly cost examples (within free tier):**
- 1,500 companies/day: **FREE**
- 45,000 companies/month: **FREE**

For most use cases, this will stay **completely FREE** within Gemini's generous limits!

### Supabase Edge Functions

- Free tier: 2 million function invocations/month
- After free tier: $2 per million invocations

For most use cases, this will stay within free limits.

## Future Enhancements

Planned features:
- [ ] Batch scraping for multiple companies
- [ ] Schedule automated scraping
- [ ] Social media profile extraction
- [ ] Company logo fetching
- [ ] Competitor analysis
- [ ] Industry trend detection
- [ ] Custom AI prompts for summaries
- [ ] Export companies with tags to CSV
- [ ] Tag-based campaign targeting
- [ ] Machine learning tag suggestions

## Support

For issues or questions:
- Check Supabase Edge Function logs
- Review browser console for frontend errors
- Verify Gemini API key is valid
- Contact support@contactium.com

## Security

- API keys are stored encrypted in database
- Only users with `service_role` can scrape companies
- Rate limiting on Edge Functions
- Scraped data is user-specific (RLS policies)

---

**Last Updated**: November 2024
**Version**: 1.0
