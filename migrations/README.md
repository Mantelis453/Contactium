# Database Migrations

This folder contains SQL migration files for the Contactium database.

## How to Run Migrations

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: **fyoiswejujtnaosweouu**
3. Navigate to **SQL Editor** in the left sidebar
4. Open the migration file you want to run
5. Copy and paste the SQL content into the editor
6. Click **Run** to execute the migration

## Migration Files

### add_smtp_fields.sql
Adds SMTP configuration fields to the user_settings table.

### add_ai_settings.sql
Adds AI provider and email generation settings to the user_settings table.

### add_subscription_fields.sql ⚠️ **NEW - NEEDS TO BE RUN**
Adds Stripe subscription and billing fields to the user_settings table.
- subscription_tier (free, starter, professional)
- subscription_status (active, canceled, past_due, trialing)
- stripe_customer_id
- stripe_subscription_id
- subscription_end_date
- emails_sent_this_month (for tracking usage limits)
- last_reset_date

**Important:** Run this migration before using the Stripe payment integration.

## Order of Execution

If setting up a new database, run migrations in this order:
1. add_smtp_fields.sql
2. add_ai_settings.sql
3. add_subscription_fields.sql

## Verification

After running a migration, you can verify it worked by:
1. Going to **Table Editor** in Supabase Dashboard
2. Selecting the **user_settings** table
3. Checking that the new columns appear

## Troubleshooting

- If you get an error about columns already existing, the migration may have been run already
- The migrations use `IF NOT EXISTS` clauses to safely handle re-runs
- Check the Supabase logs if migrations fail
