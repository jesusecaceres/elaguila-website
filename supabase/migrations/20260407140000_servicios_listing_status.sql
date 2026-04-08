-- Lifecycle for Servicios public listings (directory vs paused, future drafts server-side).
alter table public.servicios_public_listings
  add column if not exists listing_status text not null default 'published';

comment on column public.servicios_public_listings.listing_status is
  'draft | preview_ready | publish_ready | published | paused_unpublished';

create index if not exists servicios_public_listings_status_idx
  on public.servicios_public_listings (listing_status);
