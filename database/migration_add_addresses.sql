-- Migration: Add addresses and default_address_index to users table
-- Run this in Supabase SQL Editor

-- Add new columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS addresses JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS default_address_index INTEGER DEFAULT 0;

-- Update existing users to have empty addresses array
UPDATE users 
SET addresses = '[]'::jsonb 
WHERE addresses IS NULL;

-- Update existing users to have default_address_index = 0
UPDATE users 
SET default_address_index = 0 
WHERE default_address_index IS NULL;

-- Verify the changes
SELECT id, email, first_name, last_name, addresses, default_address_index 
FROM users 
LIMIT 5;
