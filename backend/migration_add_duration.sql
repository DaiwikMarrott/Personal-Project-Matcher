-- =====================================================
-- Migration: Add duration field to projects table
-- Date: February 28, 2026
-- =====================================================
-- 
-- Purpose: Add an optional duration field to store expected 
--          project timeline (e.g., "2 weeks", "3 months", "1 semester")
--
-- Instructions:
-- 1. Open Supabase Dashboard
-- 2. Go to SQL Editor
-- 3. Copy and paste this entire file
-- 4. Click "Run" to execute
-- =====================================================

-- Add duration column to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS duration VARCHAR(100);

-- Add column comment for documentation
COMMENT ON COLUMN projects.duration IS 'Expected project duration (e.g., "2 weeks", "3 months", "1 semester")';

-- Verify the column was added successfully
DO $$ 
BEGIN 
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'projects' 
        AND column_name = 'duration'
    ) THEN
        RAISE NOTICE '✓ Migration successful: duration column added to projects table';
    ELSE
        RAISE EXCEPTION '✗ Migration failed: duration column was not added';
    END IF;
END $$;
