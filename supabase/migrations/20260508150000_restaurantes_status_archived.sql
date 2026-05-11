-- Allow staff archive without overloading `suspended` (keeps public policy: only `published` visible).

alter table public.restaurantes_public_listings
  drop constraint if exists restaurantes_public_listings_status_check;

alter table public.restaurantes_public_listings
  add constraint restaurantes_public_listings_status_check
  check (status in ('published', 'suspended', 'archived'));

comment on column public.restaurantes_public_listings.status is
  'published = live directory; suspended = staff hide (reversible); archived = removed from ops queues by default.';
