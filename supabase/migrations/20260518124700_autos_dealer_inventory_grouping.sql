-- A4.0 Autos Negocio dealer inventory grouping.
-- Backend contract only: every vehicle remains a real row in public.autos_classifieds_listings.

alter table public.autos_classifieds_listings
  add column if not exists dealer_inventory_group_id uuid null,
  add column if not exists dealer_inventory_parent_listing_id uuid null,
  add column if not exists inventory_role text null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'autos_classifieds_listings_inventory_role_chk'
      and conrelid = 'public.autos_classifieds_listings'::regclass
  ) then
    alter table public.autos_classifieds_listings
      add constraint autos_classifieds_listings_inventory_role_chk
      check (inventory_role is null or inventory_role in ('main', 'inventory_vehicle'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'autos_classifieds_listings_inventory_parent_fkey'
      and conrelid = 'public.autos_classifieds_listings'::regclass
  ) then
    alter table public.autos_classifieds_listings
      add constraint autos_classifieds_listings_inventory_parent_fkey
      foreign key (dealer_inventory_parent_listing_id)
      references public.autos_classifieds_listings (id)
      on delete set null;
  end if;
end $$;

create index if not exists autos_classifieds_listings_inventory_group_idx
  on public.autos_classifieds_listings (dealer_inventory_group_id);

create index if not exists autos_classifieds_listings_inventory_parent_idx
  on public.autos_classifieds_listings (dealer_inventory_parent_listing_id);

create index if not exists autos_classifieds_listings_inventory_role_idx
  on public.autos_classifieds_listings (inventory_role);

create index if not exists autos_classifieds_listings_dealer_active_count_idx
  on public.autos_classifieds_listings (owner_user_id, dealer_inventory_group_id, status)
  where lane = 'negocios';

comment on column public.autos_classifieds_listings.dealer_inventory_group_id is
  'Optional Autos Negocio inventory grouping id. Vehicles in the same dealer inventory experience share this id.';

comment on column public.autos_classifieds_listings.dealer_inventory_parent_listing_id is
  'Optional anchor listing id for inventory vehicles. Each vehicle remains its own autos_classifieds_listings row.';

comment on column public.autos_classifieds_listings.inventory_role is
  'Autos Negocio inventory role: main anchor or inventory_vehicle. Null keeps legacy listings backward compatible.';
