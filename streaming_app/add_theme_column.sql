-- Add background_theme column to rooms table
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS background_theme VARCHAR(50) DEFAULT 'chill';

-- Update existing rooms to have the default theme
UPDATE rooms SET background_theme = 'chill' WHERE background_theme IS NULL;
