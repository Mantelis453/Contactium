# Email API Setup Guide

This guide will help you set up the email sending functionality in Contactium.

## Prerequisites

1. A working Supabase account with your database set up
2. An SMTP email provider (Gmail, Outlook, SendGrid, etc.)

## Setup Steps

### 1. Database Migration

Run the following SQL migration in your Supabase SQL Editor:

```sql
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS smtp_host TEXT,
ADD COLUMN IF NOT EXISTS smtp_port TEXT DEFAULT '587',
ADD COLUMN IF NOT EXISTS smtp_username TEXT,
ADD COLUMN IF NOT EXISTS smtp_password TEXT,
ADD COLUMN IF NOT EXISTS smtp_secure BOOLEAN DEFAULT false;
```

Or run the migration file:
```bash
# The SQL file is located at: migrations/add_smtp_fields.sql
```

### 2. Environment Variables

Add the following to your `.env.local` file:

```env
# Supabase Configuration (should already be set)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key

# Optional: Use service key for server-side operations (more secure)
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Email API URL (defaults to http://localhost:3001)
VITE_EMAIL_API_URL=http://localhost:3001
```

### 3. Start the Servers

You have two options:

**Option 1: Run both servers together (recommended for development)**
```bash
npm run dev:all
```

**Option 2: Run servers separately**
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Email API Server
npm run server
```

The frontend will run on http://localhost:5173 and the email API on http://localhost:3001.

## Configuring Email Settings

1. Navigate to **Settings** in your application
2. Fill in the **SMTP Configuration** section:
   - **SMTP Host**: Your email provider's SMTP server
   - **SMTP Port**: Usually 587 (TLS) or 465 (SSL)
   - **SMTP Username**: Your email address
   - **SMTP Password**: Your email password or app password
   - **Use SSL/TLS**: Check for port 465, uncheck for port 587

3. Click **Test SMTP Connection** to verify your settings
4. Click **Save Settings** to save your configuration

## Common SMTP Providers

### Gmail
- **Host**: `smtp.gmail.com`
- **Port**: `587` (TLS) or `465` (SSL)
- **Username**: Your Gmail address
- **Password**: Use an [App Password](https://support.google.com/accounts/answer/185833) (not your regular password)
- **SSL/TLS**: Uncheck for port 587, check for port 465

### Outlook/Office 365
- **Host**: `smtp.office365.com`
- **Port**: `587`
- **Username**: Your Outlook/Office 365 email
- **Password**: Your account password
- **SSL/TLS**: Uncheck

### SendGrid
- **Host**: `smtp.sendgrid.net`
- **Port**: `587`
- **Username**: `apikey` (literally the word "apikey")
- **Password**: Your SendGrid API key
- **SSL/TLS**: Uncheck

### Custom SMTP Server
- Use your own SMTP server settings as provided by your email host

## Using the Email API

### In Your Code

Import the email API service:

```javascript
import { sendEmail, sendBatchEmails, testSmtpConnection } from './lib/emailApi'
```

### Send a Single Email

```javascript
try {
  const result = await sendEmail(userId, {
    to: 'recipient@example.com',
    subject: 'Hello from Contactium',
    text: 'This is a plain text email',
    html: '<p>This is an <strong>HTML</strong> email</p>'
  })
  console.log('Email sent:', result)
} catch (error) {
  console.error('Error sending email:', error)
}
```

### Send Batch Emails

```javascript
const emails = [
  {
    to: 'user1@example.com',
    subject: 'Campaign Email 1',
    html: '<p>Email content 1</p>'
  },
  {
    to: 'user2@example.com',
    subject: 'Campaign Email 2',
    html: '<p>Email content 2</p>'
  }
]

try {
  const result = await sendBatchEmails(userId, emails)
  console.log(`Sent ${result.successful} emails, ${result.failed} failed`)
  console.log('Results:', result.results)
} catch (error) {
  console.error('Error sending batch emails:', error)
}
```

### Test SMTP Connection

```javascript
try {
  const result = await testSmtpConnection(userId)
  if (result.success) {
    console.log('SMTP connection successful')
  } else {
    console.error('SMTP connection failed:', result.message)
  }
} catch (error) {
  console.error('Error testing connection:', error)
}
```

## API Endpoints

The email API server exposes the following endpoints:

### POST `/api/email/send`
Send a single email.

**Request Body:**
```json
{
  "userId": "user-uuid",
  "to": "recipient@example.com",
  "subject": "Email Subject",
  "text": "Plain text content",
  "html": "<p>HTML content</p>"
}
```

### POST `/api/email/send-batch`
Send multiple emails.

**Request Body:**
```json
{
  "userId": "user-uuid",
  "emails": [
    {
      "to": "user1@example.com",
      "subject": "Subject 1",
      "html": "<p>Content 1</p>"
    },
    {
      "to": "user2@example.com",
      "subject": "Subject 2",
      "html": "<p>Content 2</p>"
    }
  ]
}
```

### POST `/api/email/test`
Test SMTP connection.

**Request Body:**
```json
{
  "userId": "user-uuid"
}
```

### GET `/api/health`
Check if the API server is running.

## Troubleshooting

### "SMTP configuration is incomplete"
- Make sure you've filled in all SMTP fields in Settings
- Click "Save Settings" before testing or sending emails

### "Authentication failed"
- For Gmail: Make sure you're using an App Password, not your regular password
- Check that your username and password are correct
- Verify that your email provider allows SMTP access

### "Connection timeout"
- Check that your SMTP host and port are correct
- Verify your firewall isn't blocking the connection
- Some networks block SMTP ports (especially port 25)

### "Cannot connect to server"
- Make sure the email API server is running (`npm run server` or `npm run dev:all`)
- Check that the API URL is correct in your `.env.local` file
- Verify port 3001 is not in use by another application

## Security Notes

1. **Never commit your `.env.local` file** - It contains sensitive credentials
2. **Use App Passwords** for Gmail instead of your regular password
3. **Consider using environment-specific SMTP settings** for production
4. **For production deployment**, use a service key instead of the anon key for the email API server
5. **Implement rate limiting** to prevent abuse of the email API

## Production Deployment

For production, consider:

1. Deploying the email API as a separate service (e.g., Heroku, Railway, etc.)
2. Using environment variables for all sensitive configuration
3. Implementing proper authentication/authorization for API endpoints
4. Adding rate limiting and queue management
5. Using a dedicated email service like SendGrid, Mailgun, or AWS SES
6. Setting up proper error logging and monitoring

## Support

If you encounter issues:
1. Check the console logs for error messages
2. Test your SMTP connection using the "Test SMTP Connection" button
3. Verify your email provider's SMTP documentation
4. Review the troubleshooting section above
