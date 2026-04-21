-- Rentas go-live support: optional postal/ZIP on core listings + public read policy when RLS is enabled.
-- If `listings` does not use RLS yet, the DO block skips policy creation (avoid locking the table without a full policy set).

alter table public.listings add column if not exists zip text;

comment on column public.listings.zip is 'Optional postal/ZIP for browse filters (Rentas, En Venta, etc.).';

do $rentas_public_read$
begin
  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'listings'
      and c.relrowsecurity = true
  ) then
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'listings' and policyname = 'listings_public_read_rentas_active'
    ) then
      create policy "listings_public_read_rentas_active" on public.listings
        for select to public
        using (
          lower(coalesce(category, '')) = 'rentas'
          and lower(coalesce(status, '')) = 'active'
          and (is_published is distinct from false)
        );
    end if;
  end if;
end
$rentas_public_read$;
