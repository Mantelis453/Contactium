-- Instructions: Make yourself an admin user
--
-- Run this SQL in your Supabase SQL Editor (https://supabase.com/dashboard/project/YOUR_PROJECT/sql)
-- Replace YOUR_EMAIL_HERE with your actual email address

-- Step 1: Find your user ID
SELECT id, email, created_at
FROM auth.users
WHERE email = 'YOUR_EMAIL_HERE';

-- Step 2: Copy the 'id' from above and use it in the INSERT below
-- Replace 'YOUR_USER_ID_HERE' with the actual UUID

INSERT INTO admin_users (user_id, role)
VALUES ('YOUR_USER_ID_HERE', 'admin')
ON CONFLICT (user_id)
DO UPDATE SET role = 'admin';

-- Step 3: Verify you're now an admin
SELECT au.*, u.email
FROM admin_users au
JOIN auth.users u ON u.id = au.user_id;

-- Optional: Make multiple users admins at once
-- Uncomment and modify as needed:
-- INSERT INTO admin_users (user_id, role)
-- SELECT id, 'admin'
-- FROM auth.users
-- WHERE email IN ('user1@example.com', 'user2@example.com')
-- ON CONFLICT (user_id) DO NOTHING;
