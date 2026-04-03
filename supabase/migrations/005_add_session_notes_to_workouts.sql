-- Add session_notes column to workouts table for session-specific notes
-- This is separate from the existing 'notes' field to maintain backward compatibility
-- If 'notes' already exists, we'll use it for session notes

-- Ensure notes column exists (it should already exist from initial schema)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'workouts' 
        AND column_name = 'notes'
    ) THEN
        ALTER TABLE workouts ADD COLUMN notes TEXT;
    END IF;
END $$;

-- Add comment to clarify the notes field is for session notes
COMMENT ON COLUMN workouts.notes IS 'Session notes - general notes about the workout session (e.g., client feedback, progress, modifications, etc.)';

-- Create index for better query performance when searching by notes (optional, only if you plan to search notes)
-- CREATE INDEX IF NOT EXISTS idx_workouts_notes ON workouts USING gin(to_tsvector('english', notes));
