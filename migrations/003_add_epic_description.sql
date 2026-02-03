-- Add description column to epics table
ALTER TABLE epics ADD COLUMN IF NOT EXISTS description TEXT;
