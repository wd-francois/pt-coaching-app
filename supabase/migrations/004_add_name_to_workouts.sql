-- Add name field to workouts table
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS name TEXT;

-- Create index for better query performance when searching by name
CREATE INDEX IF NOT EXISTS idx_workouts_name ON workouts(name);
