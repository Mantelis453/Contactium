# Vercel Setup Status

## ✅ COMPLETED - Ready for Deployment!

### 1. Configuration Files
- **vercel.json**: Vercel configuration with routing (optimized for 12 function limit)
- **.env.example**: Template for environment variables
- **DEPLOYMENT.md**: Comprehensive deployment guide

### 2. Complete API Structure (12 Serverless Functions)
```
api/
├── _lib/
│   ├── supabase.js         ✅ Supabase client and helpers
│   ├── emailService.js     ✅ Email service
│   └── stripeService.js    ✅ Stripe service
├── companies/
│   ├── index.js            ✅ GET /api/companies (with filters)
│   ├── activities.js       ✅ GET /api/companies/activities (687 activities)
│   ├── import.js           ✅ POST /api/companies/import
│   └── [id].js             ✅ DELETE /api/companies/:id
├── email/
│   ├── test.js             ✅ POST /api/email/test
│   ├── send.js             ✅ POST /api/email/send
│   └── send-batch.js       ✅ POST /api/email/send-batch
├── stripe/
│   ├── webhook.js          ✅ POST /api/stripe/webhook (raw body handling)
│   ├── session.js          ✅ POST /api/stripe/session (combined checkout + portal)
│   ├── subscription/
│   │   └── [userId].js     ✅ GET /api/stripe/subscription/:userId
│   └── usage/
│       └── [userId].js     ✅ GET /api/stripe/usage/:userId
└── health.js               ✅ GET /api/health
```

**Total: 12 serverless functions** (Vercel free tier limit)

### 3. Key Optimizations

#### Vercel Free Tier Compliance
- Combined checkout and portal sessions into single `session.js` endpoint
- Removed test-upgrade.js (testing only, not needed in production)
- Total of exactly 12 functions (Vercel free tier limit)

#### Session Endpoint Usage
The `api/stripe/session.js` handles both Stripe Checkout and Customer Portal:

**Checkout Session** (upgrade subscription):
```javascript
POST /api/stripe/session
{
  "type": "checkout",
  "userId": "user-id",
  "tier": "starter",
  "successUrl": "https://yourapp.com/settings?success=true",
  "cancelUrl": "https://yourapp.com/settings"
}
```

**Portal Session** (manage subscription):
```javascript
POST /api/stripe/session
{
  "type": "portal",
  "userId": "user-id",
  "returnUrl": "https://yourapp.com/settings"
}
```

## Ready to Deploy!

### Next Steps

1. **Resolve Git Secrets Issue** (if not done already):
   ```bash
   git reset --soft HEAD~3
   git add .
   git commit -m "Add Vercel serverless API endpoints and deployment configuration"
   git push -f origin master
   ```

2. **Deploy to Vercel**:
   - Import your GitHub repository at [vercel.com](https://vercel.com)
   - Or use CLI: `vercel --prod`

3. **Configure Environment Variables** in Vercel Dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `VITE_API_URL` (your Vercel deployment URL)

4. **Set up Stripe Webhooks**:
   - Go to Stripe Dashboard → Webhooks
   - Add endpoint: `https://your-app.vercel.app/api/stripe/webhook`
   - Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy webhook secret to Vercel environment variables

5. **Test Deployment**:
   - Visit your Vercel URL
   - Test company filters and activities (687 activities)
   - Test email sending
   - Test subscription upgrade flow

## Local Development

Continue using the Express server for local development:
```bash
npm run server  # Backend on :3001
npm run dev     # Frontend on :5173
```

The `server/` directory remains unchanged and fully functional for local development.

## Documentation

- **Full deployment guide**: See `DEPLOYMENT.md`
- **API reference**: See `server/index.js` for endpoint logic
- **Vercel docs**: https://vercel.com/docs/functions/serverless-functions
