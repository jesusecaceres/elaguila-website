-- Add listing_open event type
ALTER TABLE listing_analytics DROP CONSTRAINT IF EXISTS listing_analytics_event_type_check;
ALTER TABLE listing_analytics ADD CONSTRAINT listing_analytics_event_type_check
  CHECK (event_type IN ('listing_view', 'listing_save', 'listing_share', 'message_sent', 'profile_view', 'listing_open'));
