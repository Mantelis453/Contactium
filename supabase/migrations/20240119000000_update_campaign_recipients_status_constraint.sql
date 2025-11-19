-- Update the check constraint on campaign_recipients to allow 'failed' status
-- This allows the Edge Function to properly mark recipients as failed when email sending fails

-- First, drop the existing constraint
ALTER TABLE campaign_recipients
DROP CONSTRAINT IF EXISTS campaign_recipients_status_check;

-- Add the updated constraint with 'failed' included
ALTER TABLE campaign_recipients
ADD CONSTRAINT campaign_recipients_status_check
CHECK (status IN ('pending', 'sent', 'failed'));
