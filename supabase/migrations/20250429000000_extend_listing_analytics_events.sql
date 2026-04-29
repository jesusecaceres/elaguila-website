-- Extend listing_analytics to support comprehensive engagement tracking
-- Adds missing event types for likes, CTAs, and applications while preserving existing data

-- First, update the CHECK constraint to include new event types
ALTER TABLE listing_analytics DROP CONSTRAINT IF EXISTS listing_analytics_event_type_check;

ALTER TABLE listing_analytics 
ADD CONSTRAINT listing_analytics_event_type_check 
CHECK (event_type IN (
  -- Existing events
  'listing_view', 
  'listing_save', 
  'listing_share', 
  'message_sent', 
  'profile_view', 
  'listing_open',
  -- New events
  'listing_like',
  'listing_unlike', 
  'listing_unsave',
  'cta_click',
  'lead_created',
  'apply_started',
  'apply_submitted',
  'phone_click',
  'whatsapp_click',
  'website_click',
  'directions_click'
));

-- Add metadata column for additional context (optional, JSON)
ALTER TABLE listing_analytics 
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

-- Add event_source column for tracking where events originated
ALTER TABLE listing_analytics 
ADD COLUMN IF NOT EXISTS event_source text DEFAULT 'unknown';

-- Add anonymous_session_id for tracking non-authenticated users
ALTER TABLE listing_analytics 
ADD COLUMN IF NOT EXISTS anonymous_session_id text;

-- Add owner_user_id for category-aware tracking and safety
ALTER TABLE listing_analytics 
ADD COLUMN IF NOT EXISTS owner_user_id uuid;

-- Create indexes for new fields to maintain performance
CREATE INDEX IF NOT EXISTS idx_listing_analytics_metadata ON listing_analytics USING gin(metadata);
CREATE INDEX IF NOT EXISTS idx_listing_analytics_event_source ON listing_analytics(event_source);
CREATE INDEX IF NOT EXISTS idx_listing_analytics_anonymous_session_id ON listing_analytics(anonymous_session_id);
CREATE INDEX IF NOT EXISTS idx_listing_analytics_owner_user_id ON listing_analytics(owner_user_id);

-- Create a composite index for common query patterns (listing + event_type + user)
CREATE INDEX IF NOT EXISTS idx_listing_analytics_listing_event_user ON listing_analytics(listing_id, event_type, user_id);

-- Update RLS policies to allow reading new fields (existing policies already cover this)
-- No policy changes needed as existing policies allow all inserts and selects
