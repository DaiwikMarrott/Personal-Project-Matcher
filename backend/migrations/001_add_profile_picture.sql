-- Migration: Add profile_picture_url and auth_user_id columns to profiles table
-- Date: 2026-02-28
-- Description: Adds support for profile picture uploads and links profiles to Supabase Auth users

-- Add the auth_user_id column if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS auth_user_id UUID;

-- Add unique constraint on auth_user_id
ALTER TABLE profiles 
ADD CONSTRAINT profiles_auth_user_id_unique UNIQUE (auth_user_id);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_auth_user_id ON profiles(auth_user_id);

-- Add the profile_picture_url column if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Comment on the columns
COMMENT ON COLUMN profiles.auth_user_id IS 'Links to auth.users(id) in Supabase Auth';
COMMENT ON COLUMN profiles.profile_picture_url IS 'URL to profile picture stored in Supabase Storage avatars bucket';
