-- Add subscription fields to user_settings table
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(50) DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS emails_sent_this_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_reset_date TIMESTAMPTZ DEFAULT NOW();

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_subscription_tier ON user_settings(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_stripe_customer_id ON user_settings(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscription_status ON user_settings(subscription_status);

-- Add comments
COMMENT ON COLUMN user_settings.subscription_tier IS 'free, starter, professional';
COMMENT ON COLUMN user_settings.subscription_status IS 'active, canceled, past_due, trialing';
COMMENT ON COLUMN user_settings.stripe_customer_id IS 'Stripe customer ID';
COMMENT ON COLUMN user_settings.stripe_subscription_id IS 'Stripe subscription ID';
COMMENT ON COLUMN user_settings.emails_sent_this_month IS 'Track email usage for limits';
COMMENT ON COLUMN user_settings.last_reset_date IS 'Last time emails_sent_this_month was reset';
