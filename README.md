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

## Documentation

### User Documentation

- **[User Guide](USER_GUIDE.md)**: Comprehensive guide for end users covering all features, best practices, and workflows
- **In-App Help**: Access help documentation directly in the application via the Help menu

### Quick Start

1. **Sign Up**: Create an account with email and password
2. **Configure Settings**: Add sender information and API keys
3. **Add Contacts**: Create contact lists or add companies to your database
4. **Create Campaign**: Use AI to generate personalized cold emails
5. **Launch & Track**: Monitor performance on your dashboard

For detailed instructions, see the [User Guide](USER_GUIDE.md).

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

### For Users
- **[User Guide](USER_GUIDE.md)**: Complete user documentation
- **In-App Help**: Click "Help" in the navigation menu
- **Email Support**: support@contactium.com

### For Developers
- `SUPABASE_SETUP.md`: Database setup instructions
- [Supabase Documentation](https://supabase.com/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [React Router Documentation](https://reactrouter.com/)

## License

ISC
