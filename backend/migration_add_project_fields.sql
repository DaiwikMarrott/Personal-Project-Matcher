-- =====================================================
-- Migration: Add project_image_url and availability_needed fields
-- Date: February 28, 2026
-- =====================================================
-- 
-- Purpose: Add fields for project images and availability requirements
--
-- Instructions:
-- 1. Open Supabase Dashboard
-- 2. Go to SQL Editor
-- 3. Copy and paste this entire file
-- 4. Click "Run" to execute
-- =====================================================

-- Add availability_needed column
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS availability_needed VARCHAR(200);

-- Add project_image_url column
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS project_image_url TEXT;

-- Add column comments for documentation
COMMENT ON COLUMN projects.availability_needed IS 'When team members are needed (e.g., "10 hours/week", "Weekends")';
COMMENT ON COLUMN projects.project_image_url IS 'URL to project schematic/image uploaded by project owner';

-- Verify the columns were added successfully
DO $$ 
BEGIN 
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'projects' 
        AND column_name IN ('availability_needed', 'project_image_url')
    ) THEN
        RAISE NOTICE '✓ Migration successful: availability_needed and project_image_url columns added to projects table';
    ELSE
        RAISE EXCEPTION '✗ Migration failed: columns were not added';
    END IF;
END $$;
