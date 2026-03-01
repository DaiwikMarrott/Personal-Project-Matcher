-- Combined Migration: Add matching fields and fix RPC function
-- Run this in Supabase SQL Editor to enable the full matching system
-- Date: 2026-02-28

-- ===========================
-- PART 1: Add matching fields
-- ===========================

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

-- ==========================================
-- PART 2: Fix RPC function for matching
-- ==========================================

-- Drop existing function first (required when changing return type)
DROP FUNCTION IF EXISTS match_projects_to_profile(uuid, double precision, integer);

CREATE OR REPLACE FUNCTION match_projects_to_profile(
    profile_uuid UUID,
    match_threshold FLOAT DEFAULT 0.0,
    match_limit INT DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    title VARCHAR,
    description TEXT,
    tags TEXT[],
    owner_id UUID,
    status VARCHAR,
    duration VARCHAR,
    availability_needed VARCHAR,
    project_image_url TEXT,
    roadmap JSONB,
    project_ai_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        proj.id,
        proj.title,
        proj.description,
        proj.tags,
        proj.owner_id,
        proj.status,
        proj.duration,
        proj.availability_needed,
        proj.project_image_url,
        proj.roadmap,
        proj.project_ai_summary,
        proj.created_at,
        proj.updated_at,
        1 - (proj.project_embedding <=> (SELECT p.bio_embedding FROM profiles p WHERE p.id = profile_uuid)) AS similarity
    FROM projects proj
    WHERE proj.project_embedding IS NOT NULL
        AND proj.status = 'open'
        AND 1 - (proj.project_embedding <=> (SELECT p.bio_embedding FROM profiles p WHERE p.id = profile_uuid)) >= match_threshold
    ORDER BY similarity DESC
    LIMIT match_limit;
END;
$$ LANGUAGE plpgsql;

-- Success message
DO $$ 
BEGIN 
    RAISE NOTICE '✅ Migration completed successfully!';
    RAISE NOTICE 'Added matching fields to profiles and projects tables';
    RAISE NOTICE 'Updated match_projects_to_profile RPC function';
END $$;
