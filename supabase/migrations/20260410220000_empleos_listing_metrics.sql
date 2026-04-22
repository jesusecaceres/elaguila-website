-- Operational metrics for Empleos listings (real counts, not demo placeholders).
alter table if exists public.empleos_public_listings
  add column if not exists apply_count integer not null default 0;

alter table if exists public.empleos_public_listings
  add column if not exists view_count integer not null default 0;

comment on column public.empleos_public_listings.apply_count is
  'Incremented when a candidate application is accepted for this listing.';
comment on column public.empleos_public_listings.view_count is
  'Optional server-side view counter; may be incremented from a future analytics endpoint.';
