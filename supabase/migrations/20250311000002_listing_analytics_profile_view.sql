-- Add profile_view event type and allow null listing_id (for existing DBs)
ALTER TABLE listing_analytics ALTER COLUMN listing_id DROP NOT NULL;

-- Update check constraint to include profile_view (Postgres: drop and re-add)
ALTER TABLE listing_analytics DROP CONSTRAINT IF EXISTS listing_analytics_event_type_check;
ALTER TABLE listing_analytics ADD CONSTRAINT listing_analytics_event_type_check
  CHECK (event_type IN ('listing_view', 'listing_save', 'listing_share', 'message_sent', 'profile_view'));
