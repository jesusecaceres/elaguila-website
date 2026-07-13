-- Servicios paid checkout lifecycle repair.
-- Allows hidden pending-payment rows to exist with published_at = null until Revenue OS webhook paid truth.

alter table public.servicios_public_listings
  alter column published_at drop not null;

alter table public.servicios_public_listings
  drop constraint if exists servicios_public_listings_listing_status_chk;

alter table public.servicios_public_listings
  add constraint servicios_public_listings_listing_status_chk
  check (
    listing_status in (
      'draft',
      'preview_ready',
      'publish_ready',
      'pending_payment',
      'pending_review',
      'published',
      'paused_unpublished',
      'rejected',
      'suspended'
    )
  );

notify pgrst, 'reload schema';
