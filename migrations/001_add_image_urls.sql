-- Migration: Add imageUrls column to tasks table
-- Date: 2026-02-01

ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS image_urls TEXT;

COMMENT ON COLUMN tasks.image_urls IS 'JSON array of image URLs uploaded for this task';
