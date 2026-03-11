-- Allow admin to disable user accounts
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS disabled boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN profiles.disabled IS 'When true, user is disabled by admin.';
