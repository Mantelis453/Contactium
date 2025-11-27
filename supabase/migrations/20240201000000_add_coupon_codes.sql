-- Create table for tracking coupon code usage
CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coupon_code VARCHAR(100) NOT NULL,
  stripe_coupon_id VARCHAR(255),
  discount_amount DECIMAL(10,2),
  discount_percent INTEGER,
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),
  stripe_subscription_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_coupon_user_id ON coupon_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_code ON coupon_redemptions(coupon_code);
CREATE INDEX IF NOT EXISTS idx_stripe_subscription ON coupon_redemptions(stripe_subscription_id);

-- Add RLS policies
ALTER TABLE coupon_redemptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own coupon redemptions" ON coupon_redemptions;
DROP POLICY IF EXISTS "Service role can insert coupon redemptions" ON coupon_redemptions;

-- Policy: Users can view their own coupon redemptions
CREATE POLICY "Users can view own coupon redemptions"
  ON coupon_redemptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Service role can insert coupon redemptions
CREATE POLICY "Service role can insert coupon redemptions"
  ON coupon_redemptions
  FOR INSERT
  WITH CHECK (true);

-- Add comments
COMMENT ON TABLE coupon_redemptions IS 'Tracks coupon code usage by users';
COMMENT ON COLUMN coupon_redemptions.user_id IS 'User who redeemed the coupon';
COMMENT ON COLUMN coupon_redemptions.coupon_code IS 'The coupon code entered by user';
COMMENT ON COLUMN coupon_redemptions.stripe_coupon_id IS 'Stripe coupon/promotion code ID';
COMMENT ON COLUMN coupon_redemptions.discount_amount IS 'Fixed discount amount in dollars';
COMMENT ON COLUMN coupon_redemptions.discount_percent IS 'Percentage discount (0-100)';
COMMENT ON COLUMN coupon_redemptions.stripe_subscription_id IS 'The subscription this coupon was applied to';
