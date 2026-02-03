-- Add images column to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS images TEXT;
