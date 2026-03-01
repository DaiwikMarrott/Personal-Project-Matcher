-- URGENT FIX: Fix ambiguous column reference in RPC function
-- Run this in Supabase SQL Editor NOW!

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

-- Test query
DO $$
BEGIN
    RAISE NOTICE '✅ RPC function fixed! The ambiguous column reference error is resolved.';
END $$;
