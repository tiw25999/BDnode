-- Migration: Make password_hash nullable for admin-created users
-- This allows admins to create users without passwords (they can set passwords later)

-- Make password_hash nullable
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Add a comment to explain the change
COMMENT ON COLUMN users.password_hash IS 'Password hash for user authentication. Can be NULL for admin-created users who need to set password later.';
