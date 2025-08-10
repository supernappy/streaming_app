-- Add room settings columns for enhanced functionality
ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS allow_chat BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS allow_reactions BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS require_approval BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS mute_participants BOOLEAN DEFAULT false;

-- Add updated_at column to room_participants if it doesn't exist
ALTER TABLE room_participants 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update existing rooms to have default settings
UPDATE rooms 
SET 
  allow_chat = true,
  allow_reactions = true,
  require_approval = false,
  mute_participants = false
WHERE 
  allow_chat IS NULL 
  OR allow_reactions IS NULL 
  OR require_approval IS NULL 
  OR mute_participants IS NULL;
