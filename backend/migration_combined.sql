-- =====================================================
-- Combined Migration: Add missing project fields
-- =====================================================
-- This migration adds the fields needed for the project detail page

-- Add availability_needed column if it doesn't exist
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS availability_needed VARCHAR(200);

-- Add project_image_url column if it doesn't exist
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS project_image_url TEXT;

-- Verify the migration
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name IN ('availability_needed', 'project_image_url', 'duration', 'status')
ORDER BY column_name;
