-- QUICK FIX: Run this in Supabase SQL Editor to add missing columns
-- This adds the auth_user_id and profile_picture_url columns to existing profiles table

-- Add auth_user_id column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS auth_user_id UUID;

-- Add unique constraint
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'profiles_auth_user_id_unique'
    ) THEN
        ALTER TABLE profiles ADD CONSTRAINT profiles_auth_user_id_unique UNIQUE (auth_user_id);
    END IF;
END $$;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_auth_user_id ON profiles(auth_user_id);

-- Add profile_picture_url column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Add comments
COMMENT ON COLUMN profiles.auth_user_id IS 'Links to auth.users(id) in Supabase Auth';
COMMENT ON COLUMN profiles.profile_picture_url IS 'URL to profile picture stored in Supabase Storage avatars bucket';

-- Verify the changes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('auth_user_id', 'profile_picture_url');
