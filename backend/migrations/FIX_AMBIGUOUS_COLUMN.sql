-- CRITICAL FIX: Resolve ambiguous column reference in match_projects_to_profile
-- This fixes the "column reference 'id' is ambiguous" error
-- Run this in Supabase SQL Editor

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
DECLARE
    user_embedding VECTOR(768);
BEGIN
    -- First, get the user's bio_embedding
    SELECT bio_embedding INTO user_embedding
    FROM profiles
    WHERE profiles.id = profile_uuid;
    
    -- If no embedding found, return empty result
    IF user_embedding IS NULL THEN
        RETURN;
    END IF;
    
    -- Now query projects with the stored embedding
    RETURN QUERY
    SELECT 
        projects.id,
        projects.title,
        projects.description,
        projects.tags,
        projects.owner_id,
        projects.status,
        projects.duration,
        projects.availability_needed,
        projects.project_image_url,
        projects.roadmap,
        projects.project_ai_summary,
        projects.created_at,
        projects.updated_at,
        1 - (projects.project_embedding <=> user_embedding) AS similarity
    FROM projects
    WHERE projects.project_embedding IS NOT NULL
        AND projects.status = 'open'
        AND 1 - (projects.project_embedding <=> user_embedding) >= match_threshold
    ORDER BY similarity DESC, projects.created_at DESC
    LIMIT match_limit;
END;
$$ LANGUAGE plpgsql;

-- Test the function
DO $$
DECLARE
    test_profile_id UUID;
    project_count INTEGER;
BEGIN
    -- Get the first profile ID for testing
    SELECT profiles.id INTO test_profile_id FROM profiles LIMIT 1;
    
    IF test_profile_id IS NOT NULL THEN
        -- Test the function
        SELECT COUNT(*) INTO project_count
        FROM match_projects_to_profile(test_profile_id, 0.0, 10);
        
        RAISE NOTICE '✅ RPC function fixed! Test returned % projects for profile %', project_count, test_profile_id;
    ELSE
        RAISE NOTICE '⚠️ No profiles found for testing';
    END IF;
END $$;
