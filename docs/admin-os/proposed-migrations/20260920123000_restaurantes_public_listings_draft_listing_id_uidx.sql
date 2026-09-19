-- =====================================================================================================
-- PROPOSED MIGRATION - NOT APPLIED. Deliberately outside supabase/migrations/.
-- Apply order: 4 of 5 - AFTER the restaurantes publish route change (see FINAL_DB_MIGRATIONS_PROPOSED_2026-09.md s.C) is deployed.
-- Risk: LOW.   Priority: P2.
--
-- PRODUCTION EVIDENCE (read-only, 2026-09-18, xuieateniufcrsfdomwl):
--   restaurantes_public_listings: 7 rows; draft_listing_id NULL = 0; blank = 0; non-null = 7; distinct non-null = 7;
--   duplicate groups (group by draft_listing_id having count(*) > 1) = 0   <-- EXACT NUMBER: 0.
--   The table currently has NO index on draft_listing_id (only pkey, leonix_ad_id_key, slug_key + 4 non-unique).
--   comida_local_public_listings already has the same index (comida_local_public_listings_draft_listing_id_uidx).
--
-- WHY: two concurrent first-saves for the same draft could both INSERT; the route now tolerates it in code (oldest row wins,
--   loser archived) but only a unique index makes it impossible.
--
-- HOW TO RUN: this file uses a plain CREATE UNIQUE INDEX inside a transaction. With 7 rows the ShareLock is sub-millisecond
--   and this is safe to apply through the migration pipeline. If the table ever grows large, instead run the CONCURRENTLY
--   variant below ALONE in the SQL editor (CREATE INDEX CONCURRENTLY cannot run inside a transaction block / multi-statement
--   migration file), then insert the migration-history row manually:
--
--       create unique index concurrently if not exists restaurantes_public_listings_draft_listing_id_uidx
--         on public.restaurantes_public_listings (draft_listing_id)
--         where draft_listing_id is not null and btrim(draft_listing_id) <> '';
--
--   A failed CONCURRENTLY build leaves an INVALID index: `drop index concurrently if exists ...` it and retry.
--
-- ROLLBACK: 20260920123000_restaurantes_public_listings_draft_listing_id_uidx_rollback.sql
-- =====================================================================================================
begin;

set local lock_timeout = '5s';

-- Pre-flight: refuse to run if duplicates exist (the CREATE would fail anyway; this gives a readable error and no partial state).
do $pre$
declare
  v_dups int;
begin
  select count(*) into v_dups from (
    select draft_listing_id
      from public.restaurantes_public_listings
     where draft_listing_id is not null and btrim(draft_listing_id) <> ''
     group by draft_listing_id
    having count(*) > 1
  ) d;
  if v_dups > 0 then
    raise exception 'restaurantes_public_listings_draft_listing_id_uidx: % duplicate draft_listing_id group(s) exist - resolve (archive the loser rows) first', v_dups;
  end if;
end
$pre$;

create unique index if not exists restaurantes_public_listings_draft_listing_id_uidx
  on public.restaurantes_public_listings (draft_listing_id)
  where draft_listing_id is not null and btrim(draft_listing_id) <> '';

do $post$
begin
  if not exists (
    select 1
      from pg_index i join pg_class c on c.oid = i.indexrelid
     where c.relname = 'restaurantes_public_listings_draft_listing_id_uidx'
       and i.indrelid = 'public.restaurantes_public_listings'::regclass
       and i.indisunique and i.indisvalid
  ) then
    raise exception 'restaurantes_public_listings_draft_listing_id_uidx: unique index missing or invalid';
  end if;
end
$post$;

commit;
