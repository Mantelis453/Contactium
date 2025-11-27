-- Fix infinite recursion in admin_users RLS policies
-- The issue: policy checks admin_users table to verify admin, causing circular reference

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Admins can view admin_users" ON admin_users;
DROP POLICY IF EXISTS "Super admins can manage admin_users" ON admin_users;

-- Disable RLS temporarily to avoid recursion
-- Admin users table should be accessible by service role only for security
-- Frontend will check via backend API or service role calls
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;

-- Alternative approach: Create a simple policy that allows users to check their own admin status
-- This breaks the recursion by not checking the admin_users table within the policy
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own admin record (if it exists)
-- This doesn't cause recursion because it uses auth.uid() directly
CREATE POLICY "Users can view own admin status"
  ON admin_users
  FOR SELECT
  USING (auth.uid() = user_id);

-- Note: Only service role (backend) can INSERT/UPDATE/DELETE admin_users
-- This is secure because normal users can only check if THEY are admins
