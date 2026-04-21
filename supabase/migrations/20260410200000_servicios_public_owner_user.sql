-- Provider ownership for Servicios public listings (dashboard + moderation).
-- Writes remain service-role; RLS unchanged.

alter table public.servicios_public_listings
  add column if not exists owner_user_id uuid;

create index if not exists servicios_public_listings_owner_user_id_idx
  on public.servicios_public_listings (owner_user_id);

comment on column public.servicios_public_listings.owner_user_id is
  'Auth user id of the provider who published this row (nullable for legacy imports).';

comment on column public.servicios_public_listings.listing_status is
  'draft | preview_ready | publish_ready | published | paused_unpublished | pending_review | rejected | suspended';
