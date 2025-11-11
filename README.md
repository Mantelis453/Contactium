# Contactium - AI-Powered Cold Email Platform

Automated cold email campaigns with AI personalization for Lithuanian businesses.

## Features

- **User Authentication**: Secure login and signup with Supabase Auth
- **Dashboard**: Campaign statistics and overview
- **Campaign Management**: Create, view, and manage email campaigns
- **Company Filtering**: Filter Lithuanian companies by size, industry, and location
- **AI Email Generation**: Automatically generate personalized cold emails using OpenAI GPT-4
- **Campaign Tracking**: Track emails sent, opened, and replied
- **Settings**: Configure sender information and API keys

## Tech Stack

- **Frontend**: React 18 with Vite
- **Backend**: Supabase (PostgreSQL, Auth, Row Level Security)
- **Routing**: React Router v6
- **AI**: OpenAI GPT-4 API
- **Styling**: Custom CSS

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Supabase

1. Create a Supabase account at https://supabase.com
2. Create a new project
3. Copy your project URL and anon key
4. Create a `.env.local` file in the root directory:

```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

### 3. Set Up Database

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Open `SUPABASE_SETUP.md` and run all SQL commands in order
4. This will create:
   - `companies` table (Lithuanian business database)
   - `campaigns` table (email campaigns)
   - `campaign_recipients` table (campaign-company relationships)
   - `user_settings` table (user configuration)
   - Row Level Security policies
   - Indexes for performance

### 4. Add Company Data

Add Lithuanian companies to your database:

```sql
INSERT INTO companies (name, email, industry, company_size, location, website) VALUES
('Your Company', 'info@company.lt', 'technology', '11-50', 'vilnius', 'https://company.lt');
```

You can also import bulk data using CSV or connect to a companies database API.

### 5. Get AI API Key

Choose one of the following AI providers:

**Option 1: OpenAI (GPT-4)**
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Save it (you'll add it in the app settings)

**Option 2: Google Gemini Pro**
1. Go to https://makersuite.google.com/app/apikey
2. Create a new API key
3. Save it (you'll add it in the app settings)

Note: Gemini is typically more cost-effective than OpenAI GPT-4

### 6. Run the Application

```bash
npm run dev
```

The app will open at http://localhost:5173

## Usage Guide

### First Time Setup

1. **Sign Up**: Create an account with email and password
2. **Configure Settings**:
   - Go to Settings page
   - Add your sender name and email
   - Choose AI Provider (OpenAI or Google Gemini)
   - Add your API key for the selected provider
   - Set daily email limit (recommended: 50-100)
   - Click "Save Settings"

### Creating a Campaign

1. **Go to Create Campaign** page
2. **Fill in Campaign Details**:
   - Campaign name
   - Category (e.g., Technology, Healthcare)
   - Optional send date
   - Description of your offering and value proposition
3. **Filter Target Companies**:
   - Select company size, industry, and location
   - Click "Load Companies"
   - Select companies you want to target
4. **Generate Email with AI**:
   - Click "Generate Email with AI"
   - Review the generated subject and body
   - Regenerate if needed
   - Click "Approve Email"
5. **Save Campaign**:
   - Click "Save Campaign"
   - Your campaign is now created!

### Managing Campaigns

- **Dashboard**: View campaign statistics and recent campaigns
- **Campaigns**: View all campaigns with filtering and search
- **Delete**: Remove campaigns you no longer need

## Project Structure

```
src/
├── components/           # React components
│   ├── Auth.jsx         # Login/Signup
│   ├── Dashboard.jsx    # Main dashboard
│   ├── Campaigns.jsx    # Campaign list
│   ├── CreateCampaign.jsx  # Campaign creation
│   ├── Settings.jsx     # User settings
│   └── Layout.jsx       # App layout with navigation
├── hooks/               # Custom React hooks
│   └── useAuth.js       # Authentication hook
├── lib/                 # Utility libraries
│   ├── supabase.js      # Supabase client
│   └── aiService.js     # OpenAI integration
├── styles/              # CSS files
├── App.jsx              # Main app component
├── main.jsx            # Entry point
└── index.css           # Global styles
```

## Database Schema

### companies
- Company information (name, email, industry, size, location)
- Public read access for all authenticated users

### campaigns
- Campaign details and statistics
- User-specific with RLS policies

### campaign_recipients
- Links campaigns to target companies
- Tracks sending status and engagement

### user_settings
- User configuration (sender info, API keys)
- Private to each user

## API Integration

### AI Email Generation

The app supports two AI providers for generating personalized cold emails:

**OpenAI GPT-4**
- Industry-leading language model
- Excellent at understanding context and tone
- Higher cost per generation
- Model: gpt-4

**Google Gemini Pro**
- Google's advanced AI model
- Cost-effective alternative
- Fast response times
- Model: gemini-pro

Both providers generate emails based on:
- Campaign description
- Target category
- Company information

The AI creates:
- Compelling subject lines
- Professional email body
- Clear call-to-action
- Personalization placeholders

## Security

- Row Level Security (RLS) enabled on all tables
- User data isolated per account
- API keys stored securely in database
- Environment variables for sensitive data

## Future Enhancements

- Email scheduling and automation
- Email sending integration (SendGrid, AWS SES)
- A/B testing for email variations
- Advanced analytics and reporting
- Email template library
- Bulk company import from CSV
- Integration with Lithuanian business registries
- Follow-up sequence automation
- Email warmup functionality

## Support

For issues or questions, please refer to:
- `SUPABASE_SETUP.md` for database setup
- Supabase documentation: https://supabase.com/docs
- OpenAI API documentation: https://platform.openai.com/docs

## License

ISC
