-- Full `listings` RLS after optional rentas ZIP migration (20260421120000).
-- Supersedes conditional `listings_public_read_rentas_active` with explicit anon + authenticated policies.

alter table public.listings enable row level security;

drop policy if exists "listings_public_read_rentas_active" on public.listings;
drop policy if exists "listings_anon_select_public_catalog" on public.listings;
drop policy if exists "listings_authenticated_select" on public.listings;
drop policy if exists "listings_authenticated_insert_own" on public.listings;
drop policy if exists "listings_authenticated_update_own" on public.listings;
drop policy if exists "listings_authenticated_delete_own" on public.listings;

create policy "listings_anon_select_public_catalog"
  on public.listings
  for select
  to anon
  using (
    (
      lower(coalesce(category, '')) = 'rentas'
      and lower(coalesce(status, '')) = 'active'
      and (is_published is distinct from false)
    )
    or (
      lower(coalesce(category, '')) = 'en-venta'
      and (is_published is distinct from false)
      and lower(coalesce(status, '')) in ('active', 'sold')
    )
    or (
      lower(coalesce(category, '')) = 'bienes-raices'
      and is_published = true
      and lower(coalesce(status, '')) in ('active', 'sold')
    )
    or (
      lower(coalesce(status, '')) = 'active'
      and (is_published is distinct from false)
      and coalesce(category, '') not in ('rentas', 'en-venta', 'bienes-raices')
    )
  );

create policy "listings_authenticated_select"
  on public.listings
  for select
  to authenticated
  using (
    owner_id = auth.uid()
    or exists (
      select 1
      from public.messages m
      where (m.sender_id = auth.uid() or m.receiver_id = auth.uid())
        and m.listing_id = public.listings.id::text
    )
    or (
      lower(coalesce(category, '')) = 'rentas'
      and lower(coalesce(status, '')) = 'active'
      and (is_published is distinct from false)
    )
    or (
      lower(coalesce(category, '')) = 'en-venta'
      and (is_published is distinct from false)
      and lower(coalesce(status, '')) in ('active', 'sold')
    )
    or (
      lower(coalesce(category, '')) = 'bienes-raices'
      and is_published = true
      and lower(coalesce(status, '')) in ('active', 'sold')
    )
    or (
      lower(coalesce(status, '')) = 'active'
      and (is_published is distinct from false)
      and coalesce(category, '') not in ('rentas', 'en-venta', 'bienes-raices')
    )
  );

create policy "listings_authenticated_insert_own"
  on public.listings
  for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "listings_authenticated_update_own"
  on public.listings
  for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "listings_authenticated_delete_own"
  on public.listings
  for delete
  to authenticated
  using (owner_id = auth.uid());
