-- =====================================================================================================
-- ROLLBACK for 20260920123000_restaurantes_public_listings_draft_listing_id_uidx.sql - NOT APPLIED.
-- Drops the partial unique index. No data is touched. Restores the pre-migration state (no index on draft_listing_id).
-- If the index was built with CREATE INDEX CONCURRENTLY, run `drop index concurrently if exists
-- public.restaurantes_public_listings_draft_listing_id_uidx;` ALONE in the SQL editor instead (not inside a transaction).
-- =====================================================================================================
begin;

drop index if exists public.restaurantes_public_listings_draft_listing_id_uidx;

commit;
