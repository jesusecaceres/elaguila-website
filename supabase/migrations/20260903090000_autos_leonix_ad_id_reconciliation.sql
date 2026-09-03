-- Globalization Gate 6A-R/6A-FINAL — Autos-only Leonix Ad-ID reconciliation.
--
-- Staging's shared Ad-ID infrastructure (bump_leonix_ad_counter, leonix_allocate_formatted,
-- leonix_listings_prefix, leonix_ad_id_counters) has already been corrected live (alias-safe
-- counter bump, a real default on leonix_allocate_formatted's p_year, and an 'autos' -> 'AUTO'
-- prefix mapping already present) by migrations this repo does not have on file. The stale
-- 20260506150000_leonix_ad_id_all_classifieds.sql migration must NOT be replayed on Staging —
-- doing so would redefine those three shared functions back to older, broken bodies and regress
-- Leonix Ad-ID generation for every other live category (listings/servicios), not just Autos.
--
-- This migration is deliberately narrow: it only adds Leonix Ad-ID support to
-- autos_classifieds_listings, reusing the existing corrected shared functions verbatim. It never
-- creates or replaces bump_leonix_ad_counter, leonix_allocate_formatted, or leonix_listings_prefix,
-- and it mirrors the CURRENT live trigger architecture (one combined BEFORE INSERT OR UPDATE
-- function per table, e.g. listings_leonix_ad_id_biu / servicios_public_listings_leonix_ad_id_biu)
-- rather than the stale migration's separate _bi/_bu design.
--
-- Additive and idempotent: nullable column (matching the live listings/servicios_public_listings
-- columns, neither of which is NOT NULL today), partial unique index, no backfill (Autos has zero
-- rows on Staging as of this migration), no destructive DDL.

alter table public.autos_classifieds_listings
  add column if not exists leonix_ad_id text;

comment on column public.autos_classifieds_listings.leonix_ad_id is
  'Stable Leonix ad code (e.g. AUTO-2026-000001). Assigned by autos_classifieds_listings_leonix_ad_id_biu on insert; effectively immutable since that trigger only ever fills a null/blank value. Nullable to match the current live listings/servicios_public_listings leonix_ad_id contract.';

create unique index if not exists autos_classifieds_listings_leonix_ad_id_uidx
  on public.autos_classifieds_listings (leonix_ad_id)
  where leonix_ad_id is not null and trim(leonix_ad_id) <> '';

-- Reuses the existing, already-corrected public.leonix_allocate_formatted (and, transitively,
-- public.bump_leonix_ad_counter) exactly as they live today. Neither is created or replaced here.
-- 'AUTO' is passed as a literal, matching the servicios_public_listings_leonix_ad_id_biu precedent
-- for a dedicated single-category table (no need to call leonix_listings_prefix, whose live body
-- already maps 'autos' -> 'AUTO' but is not touched or depended on here).
create or replace function public.autos_classifieds_listings_leonix_ad_id_biu()
returns trigger
language plpgsql
as $function$
begin
  if new.leonix_ad_id is null or trim(new.leonix_ad_id) = '' then
    new.leonix_ad_id := public.leonix_allocate_formatted(
      'autos',
      'AUTO',
      extract(year from now())::int
    );
  end if;

  return new;
end;
$function$;

drop trigger if exists autos_classifieds_listings_leonix_ad_id_biu on public.autos_classifieds_listings;
create trigger autos_classifieds_listings_leonix_ad_id_biu
  before insert or update on public.autos_classifieds_listings
  for each row
  execute function public.autos_classifieds_listings_leonix_ad_id_biu();
