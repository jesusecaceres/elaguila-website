-- Reconcile the canonical Leonix Media Empleos table with the staff-assisted save/republish
-- contract proven during Quick gateway QA. Additive/idempotent; existing production columns and
-- rows are preserved.

begin;

alter table public.empleos_public_listings
  add column if not exists republish_sort_at timestamptz
  generated always as (coalesce(republished_at, published_at, created_at, updated_at)) stored;

-- The canonical trigger has already populated every existing row. Publishing and staff-assisted
-- saves require a stable Leonix identity, so make that invariant explicit.
alter table public.empleos_public_listings
  alter column leonix_ad_id set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.empleos_public_listings'::regclass
      and conname = 'empleos_public_listings_last_republished_by_fkey'
  ) then
    alter table public.empleos_public_listings
      add constraint empleos_public_listings_last_republished_by_fkey
      foreign key (last_republished_by) references auth.users(id) on delete set null;
  end if;
end $$;

create index if not exists empleos_public_listings_republish_sort_at_idx
  on public.empleos_public_listings (republish_sort_at desc nulls last);

comment on column public.empleos_public_listings.republish_sort_at is
  'Canonical recency sort: republished_at, then published_at, then created_at/updated_at.';

notify pgrst, 'reload schema';

commit;
