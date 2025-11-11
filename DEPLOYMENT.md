# Contactium - Vercel Deployment Guide

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Push your code to GitHub
3. **Supabase Project**: Set up your database at [supabase.com](https://supabase.com)
4. **Stripe Account**: Configure at [stripe.com](https://stripe.com)

## Project Structure

```
contactium/
├── api/                    # Vercel serverless functions
│   ├── _lib/              # Shared utilities
│   │   ├── supabase.js
│   │   ├── emailService.js
│   │   └── stripeService.js
│   ├── companies/         # Company endpoints
│   ├── email/             # Email endpoints
│   └── stripe/            # Stripe endpoints
├── server/                # Local development server (Express)
├── src/                   # React frontend
├── vercel.json           # Vercel configuration
└── .env.local            # Local environment variables
```

## Step 1: Prepare Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your actual values in `.env.local`

## Step 2: Database Setup

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the migration file: `migrations/create_companies_table.sql`
4. Verify tables are created in the Table Editor

## Step 3: Deploy to Vercel

### Option A: Via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. Follow the prompts to link your project

### Option B: Via Vercel Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Vercel will auto-detect the Vite framework
4. Click "Deploy"

## Step 4: Configure Environment Variables in Vercel

1. Go to your project in Vercel Dashboard
2. Navigate to **Settings** > **Environment Variables**
3. Add the following variables:

   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_KEY=your_supabase_service_role_key
   VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
   VITE_API_URL=https://your-project.vercel.app
   ```

4. Make sure to add them for **Production**, **Preview**, and **Development** environments

## Step 5: Configure Stripe Webhooks

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Set the endpoint URL to: `https://your-project.vercel.app/api/stripe/webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the webhook signing secret
6. Add it to Vercel environment variables as `STRIPE_WEBHOOK_SECRET`

## Step 6: Update VITE_API_URL

After deployment, update the `VITE_API_URL` environment variable:

1. In Vercel Dashboard, go to **Settings** > **Environment Variables**
2. Update `VITE_API_URL` to your actual Vercel deployment URL
3. Redeploy the project for changes to take effect

## Step 7: Test Your Deployment

1. Visit your Vercel deployment URL
2. Test user registration and login
3. Test company imports
4. Test email campaign creation
5. Verify Stripe checkout flow

## Local Development

For local development, continue using the Express server:

```bash
# Terminal 1: Start frontend
npm run dev

# Terminal 2: Start backend
npm run server
```

The Express server (`server/index.js`) provides the same API endpoints for local development.

## Troubleshooting

### API Routes Not Working

- Check that environment variables are set correctly in Vercel
- Verify API routes are in the `api/` directory
- Check Vercel function logs in the dashboard

### Database Connection Issues

- Verify Supabase URL and keys
- Check Row Level Security policies in Supabase
- Ensure service role key has proper permissions

### Stripe Webhooks Failing

- Verify webhook URL is correct
- Check webhook signing secret matches
- Test webhooks using Stripe CLI locally first

### Build Failures

- Check Node.js version matches `package.json` engines field
- Verify all dependencies are in `package.json`
- Review build logs in Vercel dashboard

## Additional Configuration

### Custom Domain

1. Go to **Settings** > **Domains** in Vercel
2. Add your custom domain
3. Update DNS records as instructed
4. Update `VITE_API_URL` and Stripe webhook URL

### Performance Optimization

- Enable Vercel Analytics in project settings
- Configure caching headers if needed
- Monitor function execution times

### Security

- Never commit `.env.local` or `.env` files
- Rotate API keys regularly
- Use Vercel's secret management for sensitive data
- Enable CORS only for your frontend domain in production

## Monitoring

- **Vercel Dashboard**: Monitor deployments, functions, and analytics
- **Supabase Dashboard**: Monitor database queries and performance
- **Stripe Dashboard**: Monitor payments and webhooks

## Continuous Deployment

Vercel automatically deploys:
- **Production**: Commits to `main` branch
- **Preview**: Pull requests and other branches

## Support

For issues:
- Vercel: [vercel.com/support](https://vercel.com/support)
- Supabase: [supabase.com/docs](https://supabase.com/docs)
- Stripe: [stripe.com/docs](https://stripe.com/docs)
