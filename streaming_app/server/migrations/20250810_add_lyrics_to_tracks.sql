-- Add lyrics column to tracks table
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS lyrics TEXT;
