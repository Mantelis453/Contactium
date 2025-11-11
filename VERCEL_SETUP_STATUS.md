# Vercel Setup Status

## ✅ Completed

### 1. Configuration Files
- **vercel.json**: Vercel configuration with routing and environment variables
- **.env.example**: Template for environment variables
- **DEPLOYMENT.md**: Comprehensive deployment guide

### 2. API Structure Created
```
api/
├── _lib/
│   ├── supabase.js         ✅ Supabase client and helpers
│   ├── emailService.js     ✅ Email service (copied from server/)
│   └── stripeService.js    ✅ Stripe service (copied from server/)
├── companies/
│   ├── index.js            ✅ GET /api/companies (with filters)
│   ├── activities.js       ✅ GET /api/companies/activities
│   ├── import.js           ✅ POST /api/companies/import
│   └── [id].js             ✅ DELETE /api/companies/:id
└── email/
    └── test.js             ✅ POST /api/email/test
```

## ⚠️ Needs Completion

### Missing API Endpoints

You need to create these remaining serverless function files:

#### Email Routes
- `api/email/send.js` - POST /api/email/send
- `api/email/send-batch.js` - POST /api/email/send-batch

#### Stripe Routes
- `api/stripe/webhook.js` - POST /api/stripe/webhook
- `api/stripe/create-checkout-session.js` - POST /api/stripe/create-checkout-session
- `api/stripe/create-portal-session.js` - POST /api/stripe/create-portal-session
- `api/stripe/subscription/[userId].js` - GET /api/stripe/subscription/:userId
- `api/stripe/usage/[userId].js` - GET /api/stripe/usage/:userId
- `api/stripe/test-upgrade.js` - POST /api/stripe/test-upgrade (optional, for testing)

#### Other
- `api/health.js` - GET /api/health

### How to Create Missing Endpoints

Each file should follow this pattern:

```javascript
import { supabase, getUserSettings } from '../_lib/supabase.js'
import { /* import needed services */ } from '../_lib/emailService.js'

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'EXPECTED_METHOD') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Your endpoint logic here (copy from server/index.js)

    res.json({ success: true, data: result })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: error.message })
  }
}
```

### Reference Implementation

Look at `server/index.js` for the complete logic of each endpoint. You need to:
1. Copy the route handler logic
2. Wrap it in the Vercel serverless function format
3. Replace Express-specific code (`req.body`, `req.params`, `req.query`) with Vercel equivalents

### Example: Email Send Endpoint

Create `api/email/send.js`:

```javascript
import { getUserSettings } from '../_lib/supabase.js'
import { createTransporter, sendEmail } from '../_lib/emailService.js'
import { checkUsageLimit, incrementEmailCount } from '../_lib/stripeService.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId, to, subject, text, html } = req.body

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' })
    }

    // Check usage limits
    const usageLimitCheck = await checkUsageLimit(userId)
    if (!usageLimitCheck.canSend) {
      return res.status(403).json({
        error: 'Monthly email limit reached',
        limit: usageLimitCheck.emailLimit,
        sent: usageLimitCheck.emailsSent,
        tier: usageLimitCheck.tier
      })
    }

    const settings = await getUserSettings(userId)
    const transporter = createTransporter({
      smtp_host: settings.smtp_host,
      smtp_port: settings.smtp_port,
      smtp_username: settings.smtp_username,
      smtp_password: settings.smtp_password,
      smtp_secure: settings.smtp_secure,
    })

    const result = await sendEmail(
      transporter,
      { to, subject, text, html },
      { sender_name: settings.sender_name, sender_email: settings.sender_email }
    )

    if (result.success) {
      await incrementEmailCount(userId, 1)
    }

    res.json(result)
  } catch (error) {
    console.error('Error sending email:', error)
    res.status(500).json({ error: error.message })
  }
}
```

## Quick Start After Completion

1. **Test Locally**:
   - Continue using `npm run server` for local development
   - The Express server in `server/index.js` works as-is

2. **Deploy to Vercel**:
   ```bash
   vercel
   ```

3. **Set Environment Variables** in Vercel Dashboard

4. **Test Production**: Visit your Vercel URL

## Alternative: Simpler Approach

If creating individual endpoints is too tedious, you can use a catch-all API route:

Create `api/[...path].js`:
```javascript
import app from '../server/app.js' // Export your Express app from server/index.js

export default app
```

This approach wraps your entire Express server as a Vercel serverless function, but may have limitations with larger apps.

## Next Steps

1. Choose your approach (individual endpoints or catch-all)
2. Complete the missing API endpoints
3. Test locally with the existing Express server
4. Deploy to Vercel
5. Configure environment variables in Vercel Dashboard
6. Set up Stripe webhooks pointing to your Vercel URL
7. Test the deployed application

## Need Help?

- Reference: `server/index.js` for endpoint logic
- Documentation: Read `DEPLOYMENT.md` for full deployment steps
- Vercel Docs: https://vercel.com/docs/functions/serverless-functions
