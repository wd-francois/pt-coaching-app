-- Add video_url column to exercises table if it doesn't exist
ALTER TABLE exercises 
ADD COLUMN IF NOT EXISTS video_url TEXT;
