-- Allow authenticated owners to read their own restaurant rows (any status), for /dashboard/restaurantes.
-- Anonymous + authenticated users still read published rows via existing policy (OR semantics).

create policy "restaurantes_public_listings_select_owner"
  on public.restaurantes_public_listings
  for select
  to authenticated
  using (owner_user_id is not null and owner_user_id = auth.uid());
