-- Gate FI-2E — Ofertas Locales Staging runtime-schema reconciliation.
-- Additive only. Adds exactly the 17 columns the current, unmodified application runtime
-- (scan-prep insert/update, publish update, owner edit-hydration, admin review) already reads
-- and writes via app/lib/ofertas-locales/ofertasLocalesDbSchema.ts's own
-- OFERTAS_LOCALES_PRODUCTION_COLUMNS contract, proven present on live Production, proven safe
-- via Gates FI-2C/FI-2D forensic verification. No DROP, no RENAME, no UPDATE, no DELETE, no
-- backfill, no RLS/policy change, no function/trigger change, no other table touched.
--
-- Explicitly NOT added (proven unused by current runtime, see Gate OD4): product_type,
-- offer_description, business_subcategory, flyer_description, reviewed_at, reviewed_by,
-- archived_at, primary_asset_id, primary_asset_url, primary_storage_path, primary_mime_type,
-- primary_file_name, external_urls.

alter table public.ofertas_locales
  add column if not exists facebook_url text,
  add column if not exists instagram_url text,
  add column if not exists tiktok_url text,
  add column if not exists youtube_url text,
  add column if not exists google_business_url text,
  add column if not exists google_review_url text,
  add column if not exists yelp_url text,
  add column if not exists custom_market_type text,
  add column if not exists wants_ai_searchable_specials boolean not null default false,
  add column if not exists featured_placement_scope text,
  add column if not exists ai_scan_status text default 'not_started',
  add column if not exists ai_last_scan_job_id uuid,
  add column if not exists last_scan_error text,
  add column if not exists draft_snapshot jsonb not null default '{}'::jsonb,
  add column if not exists service_zips text[],
  add column if not exists offer_title text,
  add column if not exists wants_featured_placement boolean not null default false;
