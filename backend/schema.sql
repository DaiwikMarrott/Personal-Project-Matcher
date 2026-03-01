-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE NOT NULL, -- Links to auth.users(id) in Supabase Auth
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    language VARCHAR(50) DEFAULT 'en',
    major VARCHAR(200),
    interests TEXT,
    skills TEXT[],
    experience_level VARCHAR(50) CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    availability JSONB DEFAULT '{}', -- e.g., {"hours_per_week": 10, "timezone": "PST"}
    urls JSONB DEFAULT '{}', -- e.g., {"github": "...", "linkedin": "...", "discord": "..."}
    profile_picture_url TEXT, -- URL to profile picture in Supabase Storage
    bio_embedding VECTOR(768), -- 768-dimensional embedding for semantic matching
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(300) NOT NULL,
    description TEXT NOT NULL,
    tags TEXT[],
    roadmap JSONB DEFAULT '{}', -- AI-generated technical roadmap
    project_embedding VECTOR(768), -- 768-dimensional embedding for semantic matching
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'completed', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_profiles_auth_user_id ON profiles(auth_user_id);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_major ON profiles(major);
CREATE INDEX idx_projects_owner_id ON projects(owner_id);
CREATE INDEX idx_projects_status ON projects(status);

-- Create indexes for vector similarity search using HNSW (Hierarchical Navigable Small World)
CREATE INDEX idx_profiles_bio_embedding ON profiles USING hnsw (bio_embedding vector_cosine_ops);
CREATE INDEX idx_projects_project_embedding ON projects USING hnsw (project_embedding vector_cosine_ops);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RPC function for finding matching profiles based on project embedding
CREATE OR REPLACE FUNCTION match_profiles_to_project(
    project_uuid UUID,
    match_threshold FLOAT DEFAULT 0.7,
    match_limit INT DEFAULT 10
)
RETURNS TABLE (
    profile_id UUID,
    first_name VARCHAR,
    last_name VARCHAR,
    email VARCHAR,
    major VARCHAR,
    skills TEXT[],
    experience_level VARCHAR,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.first_name,
        p.last_name,
        p.email,
        p.major,
        p.skills,
        p.experience_level,
        1 - (p.bio_embedding <=> (SELECT project_embedding FROM projects WHERE id = project_uuid)) AS similarity
    FROM profiles p
    WHERE p.bio_embedding IS NOT NULL
        AND 1 - (p.bio_embedding <=> (SELECT project_embedding FROM projects WHERE id = project_uuid)) >= match_threshold
    ORDER BY similarity DESC
    LIMIT match_limit;
END;
$$ LANGUAGE plpgsql;

-- RPC function for finding matching projects based on profile embedding
CREATE OR REPLACE FUNCTION match_projects_to_profile(
    profile_uuid UUID,
    match_threshold FLOAT DEFAULT 0.7,
    match_limit INT DEFAULT 10
)
RETURNS TABLE (
    project_id UUID,
    title VARCHAR,
    description TEXT,
    tags TEXT[],
    owner_id UUID,
    status VARCHAR,
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
        1 - (proj.project_embedding <=> (SELECT bio_embedding FROM profiles WHERE id = profile_uuid)) AS similarity
    FROM projects proj
    WHERE proj.project_embedding IS NOT NULL
        AND proj.status = 'open'
        AND 1 - (proj.project_embedding <=> (SELECT bio_embedding FROM profiles WHERE id = profile_uuid)) >= match_threshold
    ORDER BY similarity DESC
    LIMIT match_limit;
END;
$$ LANGUAGE plpgsql;
