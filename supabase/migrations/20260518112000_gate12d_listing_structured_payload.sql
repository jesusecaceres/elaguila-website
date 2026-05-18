-- Gate 12D-2: stable structured payload columns for Rentas + Bienes Raices.
-- Additive and backwards-compatible: existing rows keep using detail_pairs/business_meta fallbacks.

alter table public.listings
  add column if not exists listing_json jsonb not null default '{}'::jsonb;

alter table public.listings
  add column if not exists profile_json jsonb not null default '{}'::jsonb;

alter table public.listings
  add column if not exists contact_json jsonb not null default '{}'::jsonb;

comment on column public.listings.listing_json is
  'Stable machine-readable listing payload for category-specific fields (BR Gate 12D, Rentas structured rental fields).';

comment on column public.listings.profile_json is
  'Stable seller/business profile payload derived at publish time; public reads must not expose owner UUID.';

comment on column public.listings.contact_json is
  'Stable normalized contact/social/channel payload derived at publish time.';
