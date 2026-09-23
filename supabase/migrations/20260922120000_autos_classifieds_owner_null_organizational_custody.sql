-- Gate 2 staff gateway: Leonix-managed Autos rows may be born owner-null until later claim/release.
-- Additive only. Existing owned rows, the auth.users FK, and RLS owner policies are preserved.
-- A NULL owner_user_id does not match auth.uid() RLS, so public/customer writes stay owner-scoped;
-- staff writes continue to use the service role.

alter table public.autos_classifieds_listings
  alter column owner_user_id drop not null;

comment on column public.autos_classifieds_listings.owner_user_id is
  'Customer owner. Null on Leonix-managed organizational custody rows until claim/release.';
