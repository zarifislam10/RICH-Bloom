-- Fix RLS policy for user_profiles INSERT
-- This ensures users can create their own profile during signup

-- Drop the existing INSERT policy if it exists
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;

-- Recreate the INSERT policy with proper checks
CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id AND
    auth.uid() IS NOT NULL
  );

-- Also ensure the table has RLS enabled
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

