-- Migration: Add matching preference fields to profiles and AI summaries to both tables
-- Date: 2026-02-28
-- Description: Adds new columns for enhanced matching algorithm

-- Add new columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS availability_hours_per_week INTEGER,
ADD COLUMN IF NOT EXISTS project_size_preference TEXT CHECK (project_size_preference IN ('small', 'medium', 'large', NULL)),
ADD COLUMN IF NOT EXISTS project_duration_preference TEXT CHECK (project_duration_preference IN ('short', 'medium', 'long', NULL)),
ADD COLUMN IF NOT EXISTS collaboration_style TEXT,
ADD COLUMN IF NOT EXISTS profile_ai_summary TEXT;

-- Add AI summary column to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS project_ai_summary TEXT;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_experience_level ON profiles(experience_level);
CREATE INDEX IF NOT EXISTS idx_profiles_availability_hours ON profiles(availability_hours_per_week);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- Add comments for documentation
COMMENT ON COLUMN profiles.availability_hours_per_week IS 'Number of hours per week the user can dedicate to projects';
COMMENT ON COLUMN profiles.project_size_preference IS 'Preferred project size: small, medium, or large';
COMMENT ON COLUMN profiles.project_duration_preference IS 'Preferred project duration: short, medium, or long';
COMMENT ON COLUMN profiles.collaboration_style IS 'User''s preferred collaboration style (e.g., remote, in-person, async)';
COMMENT ON COLUMN profiles.profile_ai_summary IS 'AI-generated summary of the profile for matching purposes';
COMMENT ON COLUMN projects.project_ai_summary IS 'AI-generated summary of the project for matching purposes';
