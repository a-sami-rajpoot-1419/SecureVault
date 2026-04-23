-- SecureVault Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Files table for user mode encrypted file storage
CREATE TABLE files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  original_filename TEXT NOT NULL,
  storage_path TEXT, -- null if user opted out of storage
  file_size BIGINT,
  file_type TEXT,
  encrypted BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE, -- 1 day from creation
  share_token TEXT UNIQUE, -- for shareable links
  is_stored BOOLEAN DEFAULT TRUE, -- user opt-out flag
  
  CONSTRAINT valid_storage CHECK (
    (is_stored = FALSE AND storage_path IS NULL) OR 
    (is_stored = TRUE)
  )
);

-- Encryption logs table for tracking operations
CREATE TABLE encryption_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  guest_session_id TEXT, -- for guest mode tracking
  operation_type TEXT CHECK (operation_type IN ('encrypt', 'decrypt')),
  original_filename TEXT,
  file_size BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  shared_via TEXT CHECK (shared_via IN ('download', 'gmail', 'outlook', 'yahoo', 'copy', 'teams', 'other')),
  file_id UUID REFERENCES files ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX idx_files_user_id ON files(user_id);
CREATE INDEX idx_files_share_token ON files(share_token);
CREATE INDEX idx_files_expires_at ON files(expires_at);
CREATE INDEX idx_encryption_logs_user_id ON encryption_logs(user_id);
CREATE INDEX idx_encryption_logs_guest_session ON encryption_logs(guest_session_id);
CREATE INDEX idx_encryption_logs_created_at ON encryption_logs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE encryption_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for files table
CREATE POLICY "Users can view own files"
  ON files FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own files"
  ON files FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own files"
  ON files FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own files"
  ON files FOR DELETE
  USING (auth.uid() = user_id);

-- Allow public access via share token
CREATE POLICY "Anyone can view shared files"
  ON files FOR SELECT
  USING (share_token IS NOT NULL);

-- RLS Policies for encryption_logs table
CREATE POLICY "Users can view own logs"
  ON encryption_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logs"
  ON encryption_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own logs"
  ON encryption_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Function to automatically set expiration date
CREATE OR REPLACE FUNCTION set_file_expiration()
RETURNS TRIGGER AS $$
BEGIN
  NEW.expires_at := NEW.created_at + INTERVAL '1 day';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set expiration on insert
CREATE TRIGGER trigger_set_file_expiration
  BEFORE INSERT ON files
  FOR EACH ROW
  EXECUTE FUNCTION set_file_expiration();

-- Function to cleanup expired files
CREATE OR REPLACE FUNCTION cleanup_expired_files()
RETURNS void AS $$
DECLARE
  expired_file RECORD;
BEGIN
  -- Find expired files
  FOR expired_file IN 
    SELECT id, storage_path 
    FROM files 
    WHERE expires_at < NOW() 
      AND storage_path IS NOT NULL
      AND is_stored = TRUE
  LOOP
    -- Delete from storage (this would be handled by your application)
    -- For now, just mark as deleted
    UPDATE files 
    SET storage_path = NULL, is_stored = FALSE 
    WHERE id = expired_file.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create storage bucket for encrypted files
-- Note: Run this in Supabase Dashboard Storage section
-- Bucket name: encrypted-files
-- Public: false (files accessed via share tokens only)

-- Example: Create storage bucket policy
-- Only authenticated users can upload to their own folder
-- Anyone with share token can download

-- Add comments for documentation
COMMENT ON TABLE files IS 'Stores encrypted file metadata for user mode';
COMMENT ON TABLE encryption_logs IS 'Tracks all encryption/decryption operations';
COMMENT ON COLUMN files.share_token IS 'Unique token for public sharing, null = not shared';
COMMENT ON COLUMN files.is_stored IS 'Whether user opted to store file (1-day retention) or not';
