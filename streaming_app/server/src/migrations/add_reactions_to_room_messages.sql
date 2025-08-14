-- Add reactions column to room_messages for emoji reactions
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.columns 
		WHERE table_name='room_messages' AND column_name='reactions'
	) THEN
		ALTER TABLE room_messages ADD COLUMN reactions JSONB DEFAULT '{}'::JSONB;
	END IF;
END $$;
