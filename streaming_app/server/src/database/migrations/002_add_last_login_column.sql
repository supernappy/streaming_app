-- Add last_login column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;

-- Create index for better performance on last_login queries
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);
