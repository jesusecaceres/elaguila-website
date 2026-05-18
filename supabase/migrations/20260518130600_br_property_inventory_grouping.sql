-- BR13A: Bienes Raices Negocio property inventory grouping.
-- Backend contract only: every property remains a real row in public.listings.

alter table public.listings
  add column if not exists br_inventory_group_id uuid null,
  add column if not exists br_inventory_parent_listing_id uuid null,
  add column if not exists inventory_role text null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'listings_br_inventory_role_chk'
      and conrelid = 'public.listings'::regclass
  ) then
    alter table public.listings
      add constraint listings_br_inventory_role_chk
      check (inventory_role is null or inventory_role in ('main', 'inventory_property'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'listings_br_inventory_parent_fkey'
      and conrelid = 'public.listings'::regclass
  ) then
    alter table public.listings
      add constraint listings_br_inventory_parent_fkey
      foreign key (br_inventory_parent_listing_id)
      references public.listings (id)
      on delete set null;
  end if;
end $$;

create index if not exists listings_br_inventory_group_idx
  on public.listings (br_inventory_group_id);

create index if not exists listings_br_inventory_parent_idx
  on public.listings (br_inventory_parent_listing_id);

create index if not exists listings_br_inventory_role_idx
  on public.listings (inventory_role);

create index if not exists listings_br_negocio_inventory_active_count_idx
  on public.listings (owner_id, br_inventory_group_id, status, is_published)
  where category = 'bienes-raices' and seller_type = 'business';

comment on column public.listings.br_inventory_group_id is
  'Optional Bienes Raices Negocio inventory grouping id. Properties in the same agent/broker/business inventory share this id.';

comment on column public.listings.br_inventory_parent_listing_id is
  'Optional anchor listing id for BR Negocio inventory properties. Each property remains its own public.listings row.';

comment on column public.listings.inventory_role is
  'Inventory role for category-specific grouped inventory. For BR Negocio: main or inventory_property; null keeps legacy listings backward compatible.';
