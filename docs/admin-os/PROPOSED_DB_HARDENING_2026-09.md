# Proposed database hardening — owner-approved apply ONLY (none applied)

Evidence gathered read-only from production `xuieateniufcrsfdomwl` on 2026-09-18/19. Nothing below has been run.
These are deliberately NOT in `supabase/migrations/` so no pipeline can apply them by accident.

## 1. `public.listings` — owner can activate a paid-lane row without paying (P0/P1)

Production state (verified): RLS enabled. Policy `Owner update own listings`: `UPDATE … USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid())`
— **no column restriction**, so any authenticated owner can set `status='active'` / `is_published=true` on their own Rentas, Bienes Raíces or
Clases row through the public anon API, skipping Revenue OS payment. Only `trg_prevent_owner_change` and audit triggers exist.
No production row is currently affected (Rentas 60 active / 58 legacy; BR 2 active; Clases 10 active — all pre-Revenue-OS).

Compatibility scan (source): no Rentas/BR module writes `active` client-side. The only client-side activation is
`app/(site)/dashboard/mis-anuncios/page.tsx#markStatus("active")` (relist/resume). Free lanes (En Venta, Busco, Comunidad, Mascotas, Clases-free)
go `draft → active` client-side and must stay allowed; paid Clases uses `pending`.

Proposed guard (only restricts PostgREST client roles; `service_role`/`postgres` used by all Revenue OS server code are untouched):

```sql
create or replace function public.listings_guard_paid_lane_owner_activation()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_cat text := lower(coalesce(new.category, ''));
begin
  -- Server code (service_role / postgres) is never restricted; only client roles are.
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  if v_cat in ('rentas', 'bienes-raices') then
    if tg_op = 'INSERT' and new.status = 'active' then
      raise exception 'paid_lane_activation_requires_payment' using errcode = '42501';
    end if;
    -- Owners may only return a row they already had live (paused -> active). Everything else
    -- (pending/draft/removed/sold/flagged -> active) is a payment/staff decision made server-side.
    if tg_op = 'UPDATE' and new.status = 'active' and old.status is distinct from 'active'
       and old.status is distinct from 'paused' then
      raise exception 'paid_lane_activation_requires_payment' using errcode = '42501';
    end if;
  elsif v_cat = 'clases' then
    -- Free Clases goes draft -> active; PAID Clases sits in `pending` until the webhook activates it.
    if tg_op = 'UPDATE' and new.status = 'active' and old.status = 'pending' then
      raise exception 'paid_lane_activation_requires_payment' using errcode = '42501';
    end if;
    if tg_op = 'INSERT' and new.status = 'pending' then
      null; -- allowed: this is how the paid flow starts
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists listings_guard_paid_lane_owner_activation on public.listings;
create trigger listings_guard_paid_lane_owner_activation
  before insert or update of status on public.listings
  for each row execute function public.listings_guard_paid_lane_owner_activation();
```

Pre-flight (must return 0 rows that the trigger would newly block among live flows): none required — the trigger only fires on writes.
Known UX consequence: an owner "Reactivate" on a `removed`/`sold` Rentas or BR row will now be refused (server relist routes still work).
Rollback: `drop trigger listings_guard_paid_lane_owner_activation on public.listings; drop function public.listings_guard_paid_lane_owner_activation();`

## 2. `public.listings.publish_attempt_key` missing in production (P1 — migration drift)

Repo migration `20260804120000_listings_publish_attempt_idempotency_key.sql` (additive: nullable column + partial unique index
`listings_owner_publish_attempt_key_uidx`) is **not applied**: production `listings` has no `publish_attempt_key` column and no such index.
Effect: the En Venta / Busco / Clases / Comunidad / Mascotas concurrent-double-submit protection silently degrades (the insert helper drops
unknown columns). Safe to apply as written (idempotent `if not exists`, no backfill, no destructive DDL).

## 3. `restaurantes_public_listings` — no uniqueness on `draft_listing_id` (P2)

Verified: column exists, 7 rows, 0 duplicate `draft_listing_id`, 0 NULLs. `comida_local_public_listings` already has the equivalent index.

```sql
create unique index concurrently if not exists restaurantes_public_listings_draft_listing_id_uidx
  on public.restaurantes_public_listings (draft_listing_id)
  where draft_listing_id is not null and btrim(draft_listing_id) <> '';
```
Rollback: `drop index concurrently restaurantes_public_listings_draft_listing_id_uidx;`

## 4. `public.listing_lifecycle_reminder_events` (P2) — see PUBLICATION_CIRCUIT_REPAIR_2026-09-18.md §5.
