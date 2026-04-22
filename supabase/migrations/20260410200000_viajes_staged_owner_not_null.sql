-- Viajes staged listings: require owner_user_id for launch (no anonymous-owned rows).
-- Removes orphan rows with no owner, then enforces NOT NULL + ON DELETE CASCADE from auth.users.

alter table public.viajes_staged_listings
  drop constraint if exists viajes_staged_listings_owner_user_id_fkey;

delete from public.viajes_staged_listings
where owner_user_id is null;

alter table public.viajes_staged_listings
  alter column owner_user_id set not null;

alter table public.viajes_staged_listings
  add constraint viajes_staged_listings_owner_user_id_fkey
  foreign key (owner_user_id) references auth.users (id) on delete cascade;
