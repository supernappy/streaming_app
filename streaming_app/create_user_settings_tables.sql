-- Create user notification settings table
CREATE TABLE IF NOT EXISTS user_notification_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT false,
    track_likes BOOLEAN DEFAULT true,
    new_followers BOOLEAN DEFAULT true,
    room_invites BOOLEAN DEFAULT true,
    track_comments BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Create user privacy settings table
CREATE TABLE IF NOT EXISTS user_privacy_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    profile_visibility VARCHAR(20) DEFAULT 'public' CHECK (profile_visibility IN ('public', 'followers', 'private')),
    show_email BOOLEAN DEFAULT false,
    show_location BOOLEAN DEFAULT true,
    allow_direct_messages BOOLEAN DEFAULT true,
    show_online_status BOOLEAN DEFAULT false,
    show_listening_activity BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_notification_settings_user_id ON user_notification_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_privacy_settings_user_id ON user_privacy_settings(user_id);

-- Insert default settings for existing users
INSERT INTO user_notification_settings (user_id)
SELECT id FROM users 
WHERE id NOT IN (SELECT user_id FROM user_notification_settings)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_privacy_settings (user_id)
SELECT id FROM users 
WHERE id NOT IN (SELECT user_id FROM user_privacy_settings)
ON CONFLICT (user_id) DO NOTHING;
