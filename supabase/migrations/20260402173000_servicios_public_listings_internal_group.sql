-- Internal business-type group for future discovery filters (maps to BUSINESS_TYPE_PRESETS.internalGroup).

alter table public.servicios_public_listings
  add column if not exists internal_group text;

create index if not exists servicios_public_listings_internal_group_idx
  on public.servicios_public_listings (internal_group);
