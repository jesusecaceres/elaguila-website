-- Package C C9 — CERTIFICATION-ONLY schema setup.
--
-- NOT a repo migration. NOT applied to Production, ever. Applies ONLY to the isolated
-- "Leonix Certification" Supabase project (ref mvasgrdzmupsnuicwyjl), to reproduce the minimum
-- faithful shape of the 4 tables the Build 4 capacity RPCs (autos_dealer_activate_listing,
-- br_negocio_activate_listing) read/write, so that migration
-- supabase/migrations/20260810120000_autos_br_negocio_capacity_activation_rpc.sql can be applied
-- on top of it unmodified and exercised live.
--
-- Sources, exactly:
--   - public.listings: built VERBATIM from the authoritative READ-ONLY Production schema
--     snapshot supplied this gate (columns/types/defaults/not-null/constraints/indexes/RLS
--     policies) — NOT re-derived from this repo's tracked migrations, because no CREATE TABLE
--     for public.listings exists anywhere in supabase/migrations/ (confirmed: the earliest
--     migration touching it, 20250311000001_listings_price_drop.sql, is already an ALTER TABLE —
--     the table predates this repo's migration-tracking convention). A concrete drift instance
--     was also found and deferred to the snapshot correctly: the migration
--     20260506150000_leonix_ad_id_all_classifieds.sql implies leonix_ad_id ends up NOT NULL with
--     a trigger named listings_leonix_ad_id_bi (INSERT-only); the real snapshot shows the column
--     nullable and the live trigger renamed listings_leonix_ad_id_biu (INSERT-OR-UPDATE, with a
--     WHEN guard) — proof the migration history for this exact table no longer matches
--     production, which is exactly why the snapshot (not the migration) is authoritative here.
--   - public.autos_classifieds_listings, public.listing_package_entitlements,
--     public.leonix_subscription_records: reconstructed from their full, self-consistent,
--     gap-free migration chains (each has a real CREATE TABLE plus every subsequent ALTER TABLE
--     read directly from supabase/migrations/).
--
-- INTENTIONALLY EXCLUDED (documented per-item, not a blanket omission):
--   1. Four public.listings triggers (listings_leonix_ad_id_biu, listings_lifecycle_audit_ins,
--      listings_lifecycle_audit_trigger, listings_lifecycle_audit_upd, trg_prevent_owner_change,
--      trg_set_owner_id) and their backing functions — none are load-bearing for
--      br_negocio_activate_listing's correctness:
--        - listings_leonix_ad_id_biu: the RPC's UPDATE never touches leonix_ad_id; C9 fixtures
--          set it explicitly at insert time, making the trigger's purpose moot.
--        - listings_lifecycle_audit_*: AFTER triggers writing to a separate audit table — pure
--          side-effect logging that cannot change the row state or RPC return values C9 certifies.
--        - trg_prevent_owner_change: the RPC's UPDATE statement never includes owner_id in its SET
--          clause, so this guard's failure condition is structurally never reachable by this RPC.
--        - trg_set_owner_id: auto-fills owner_id only when NULL; C9 fixtures always explicitly
--          set owner_id at insert time, so this trigger would be a no-op regardless.
--   2. The equivalent leonix_ad_id NOT-NULL-with-trigger system on
--      public.autos_classifieds_listings (function bodies for bump_leonix_ad_counter/
--      autos_classifieds_leonix_ad_id_bi ARE fully known from the tracked migration, unlike
--      listings' — but reproducing them is unnecessary for the same reason: C9 fixtures always
--      set leonix_ad_id explicitly). The NOT NULL constraint + unique index ARE reproduced; only
--      the auto-generation trigger/counter-table plumbing is skipped.
--   3. Foreign keys from listing_package_entitlements/leonix_subscription_records to
--      leonix_payment_records, leonix_placement_entitlements, leonix_promo_codes, and
--      leonix_promo_code_redemptions — all 4 referenced tables are outside C9's required set, all
--      4 FK columns are nullable, and C9 fixtures never populate them. Columns are reproduced as
--      plain nullable uuid (identical behavior to a nullable FK for every operation C9 performs —
--      SELECT/UPDATE by id, insert with the column left NULL).
--
-- REQUIRED FOR C9 (reproduced faithfully): every column, default, NOT NULL flag, CHECK
-- constraint, primary key, and RLS policy for public.listings exactly as supplied in the
-- snapshot; full definitions of the other 3 tables including their CHECK constraints (lifecycle
-- status vocab, package_tier vocab, inventory_role vocab, dates), the entitlement live-uniqueness
-- partial unique index, and the auth.users FK on autos_classifieds_listings.owner_user_id (real —
-- every Supabase project provisions auth.users by default; C9 fixture owners are real
-- auth.users rows created via the GoTrue admin API, never a bare synthetic uuid for this table).

-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- 1) public.listings — built verbatim from the supplied Production schema snapshot.
-- ═══════════════════════════════════════════════════════════════════════════════════════════
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  status text default 'active'::text,
  category text,
  title text,
  description text,
  price numeric,
  city text,
  state text default 'CA'::text,
  zip text,
  lat double precision,
  lng double precision,
  membership_snapshot text,
  boost_until timestamptz,
  images jsonb,
  owner_id uuid,
  expires_at timestamptz,
  contact_email text,
  contact_phone text,
  is_free boolean default false,
  is_published boolean default false,
  mux_assest_id text,
  mux_playback_id text,
  mux_status text,
  mux_thumbnail_url text,
  mux_durations_seconds integer,
  mux_asset_id_2 text,
  mux_playback_id_2 text,
  mux_status_2 text,
  mux_thumbnail_url_2 text,
  mux_duration_seconds_2 integer,
  video_layout_type text,
  mux_asset_id text,
  mux_duration_seconds integer,
  detail_pairs jsonb,
  seller_type text,
  rentas_tier text,
  business_name text,
  business_meta text,
  updated_at timestamptz,
  published_at timestamptz,
  republished_at timestamptz,
  republish_count integer not null default 0,
  last_republished_by uuid,
  last_republished_source text,
  republish_override boolean,
  republish_override_reason text,
  leonix_ad_id text,
  br_inventory_group_id uuid,
  br_inventory_parent_listing_id uuid,
  inventory_role text,
  listing_json jsonb not null default '{}'::jsonb,
  profile_json jsonb not null default '{}'::jsonb,
  contact_json jsonb not null default '{}'::jsonb,
  admin_promoted boolean not null default false,
  leonix_verified boolean not null default false,
  constraint description_len_check check (description is null or char_length(description) >= 20 and char_length(description) <= 4000),
  constraint listings_inventory_role_check check (inventory_role is null or inventory_role = any (array['main'::text, 'inventory_property'::text])),
  constraint title_len_check check (title is null or char_length(title) >= 5 and char_length(title) <= 120)
);

create index if not exists listings_br_inventory_group_id_idx on public.listings using btree (br_inventory_group_id);
create index if not exists listings_br_inventory_parent_listing_id_idx on public.listings using btree (br_inventory_parent_listing_id);
create index if not exists listings_inventory_role_idx on public.listings using btree (inventory_role);
create unique index if not exists listings_leonix_ad_id_uidx on public.listings using btree (leonix_ad_id) where ((leonix_ad_id is not null) and (trim(both from leonix_ad_id) <> ''::text));
create index if not exists listings_rentas_active_expires_at_idx on public.listings using btree (expires_at) where ((category = 'rentas'::text) and (status = 'active'::text) and (is_published = true) and (expires_at is not null));
create index if not exists listings_republished_at_idx on public.listings using btree (republished_at desc nulls last);

alter table public.listings enable row level security;
alter table public.listings force row level security;

create policy "Owner insert own listings" on public.listings for insert to authenticated with check (owner_id = auth.uid());
create policy "Owner read own listings" on public.listings for select to authenticated using (owner_id = auth.uid());
create policy "Owner update own listings" on public.listings for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "Public read active listings" on public.listings for select using (status = 'active'::text);
create policy "listings_select_public" on public.listings for select using (true);

-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- 2) public.autos_classifieds_listings — reconstructed from its full migration chain.
-- ═══════════════════════════════════════════════════════════════════════════════════════════
create table if not exists public.autos_classifieds_listings (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  lane text not null check (lane in ('negocios', 'privado')),
  status text not null
    check (status in ('draft', 'pending_payment', 'active', 'payment_failed', 'cancelled', 'removed')),
  lang text not null default 'es' check (lang in ('es', 'en')),
  featured boolean not null default false,
  listing_payload jsonb not null default '{}'::jsonb,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  dealer_inventory_group_id uuid null,
  dealer_inventory_parent_listing_id uuid null,
  inventory_role text null check (inventory_role is null or inventory_role in ('main', 'inventory_vehicle')),
  leonix_ad_id text null, -- NOT NULL applied below after fixtures always supply it (see note)
  leonix_verified boolean not null default false,
  republished_at timestamptz,
  republish_count integer not null default 0,
  last_republished_by uuid null references auth.users (id) on delete set null,
  last_republished_source text,
  republish_override boolean null,
  suspended_reason text
);

alter table public.autos_classifieds_listings
  add constraint autos_classifieds_listings_inventory_parent_fkey
  foreign key (dealer_inventory_parent_listing_id)
  references public.autos_classifieds_listings (id)
  on delete set null;

create index if not exists autos_classifieds_listings_status_idx on public.autos_classifieds_listings (status);
create index if not exists autos_classifieds_listings_owner_idx on public.autos_classifieds_listings (owner_user_id);
create index if not exists autos_classifieds_listings_published_idx on public.autos_classifieds_listings (published_at desc nulls last);
create index if not exists autos_classifieds_listings_inventory_group_idx on public.autos_classifieds_listings (dealer_inventory_group_id);
create index if not exists autos_classifieds_listings_inventory_parent_idx on public.autos_classifieds_listings (dealer_inventory_parent_listing_id);
create index if not exists autos_classifieds_listings_inventory_role_idx on public.autos_classifieds_listings (inventory_role);
create index if not exists autos_classifieds_listings_dealer_active_count_idx on public.autos_classifieds_listings (owner_user_id, dealer_inventory_group_id, status) where lane = 'negocios';
create unique index if not exists autos_classifieds_listings_leonix_ad_id_uidx on public.autos_classifieds_listings (leonix_ad_id);

-- NOT NULL applied as a separate step (not in the CREATE TABLE) purely for DDL ordering
-- convenience; matches the real migration's own two-step shape (add column, backfill, THEN
-- set not null). C9 fixtures always supply leonix_ad_id explicitly, so no backfill is needed here.
alter table public.autos_classifieds_listings alter column leonix_ad_id set not null;

alter table public.autos_classifieds_listings enable row level security;
create policy "autos_classifieds_listings_select_own" on public.autos_classifieds_listings for select to authenticated using (auth.uid() = owner_user_id);
create policy "autos_classifieds_listings_select_active" on public.autos_classifieds_listings for select using (status = 'active');

-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- 3) public.listing_package_entitlements — reconstructed from its full migration chain.
--    FK columns to out-of-scope tables (leonix_payment_records, leonix_placement_entitlements,
--    leonix_promo_codes, leonix_promo_code_redemptions) kept as plain nullable uuid, no FK.
-- ═══════════════════════════════════════════════════════════════════════════════════════════
create table if not exists public.listing_package_entitlements (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid,
  revoked_by uuid,
  revoked_at timestamptz,
  status text not null default 'active',
  category text not null,
  listing_source text not null,
  listing_id text, -- NOT NULL dropped by 20260521130000, matches real shape
  package_tier text not null,
  entitlement_code text unique,
  contract_code text,
  customer_name text,
  business_name text,
  notes text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  placement_scope text[] not null default '{}',
  benefits jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  placement_entitlement_id uuid, -- FK to leonix_placement_entitlements intentionally excluded (out of scope, nullable, unused by C9)
  payment_record_id uuid, -- FK to leonix_payment_records intentionally excluded (out of scope, nullable, unused by C9)
  promo_code_id uuid, -- FK to leonix_promo_codes intentionally excluded (out of scope, nullable, unused by C9)
  promo_redemption_id uuid, -- FK to leonix_promo_code_redemptions intentionally excluded (out of scope, nullable, unused by C9)
  package_key text,
  billing_mode text,
  grant_source text check (grant_source is null or grant_source in ('stripe_webhook','admin_manual','print_included','comp','partner','manual_cleared_payment')),
  constraint listing_package_entitlements_status_chk check (status in ('active', 'scheduled', 'expired', 'revoked')),
  constraint listing_package_entitlements_tier_chk check (package_tier in ('premium','full_page','half_page','quarter_page','classified_print','digital_only')),
  constraint listing_package_entitlements_dates_chk check (ends_at > starts_at)
);

create index if not exists listing_package_entitlements_category_idx on public.listing_package_entitlements (category);
create index if not exists listing_package_entitlements_listing_idx on public.listing_package_entitlements (listing_source, listing_id);
create index if not exists listing_package_entitlements_status_idx on public.listing_package_entitlements (status);
create index if not exists listing_package_entitlements_starts_at_idx on public.listing_package_entitlements (starts_at);
create index if not exists listing_package_entitlements_ends_at_idx on public.listing_package_entitlements (ends_at);
create index if not exists listing_package_entitlements_entitlement_code_idx on public.listing_package_entitlements (entitlement_code) where entitlement_code is not null;
create index if not exists listing_package_entitlements_active_lookup_idx on public.listing_package_entitlements (category, listing_source, listing_id, status);
create index if not exists listing_package_entitlements_package_key_idx on public.listing_package_entitlements (package_key);
create unique index if not exists listing_package_entitlements_live_uniq
  on public.listing_package_entitlements (listing_source, listing_id, package_key)
  where status in ('active','scheduled') and listing_id is not null and package_key is not null;

alter table public.listing_package_entitlements enable row level security;

-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- 4) public.leonix_subscription_records — reconstructed from its full migration chain.
--    payment_record_id FK to leonix_payment_records intentionally excluded (out of scope).
--    package_entitlement_id FK to listing_package_entitlements KEPT (in scope, both tables exist).
-- ═══════════════════════════════════════════════════════════════════════════════════════════
create table if not exists public.leonix_subscription_records (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  stripe_subscription_id text not null,
  stripe_customer_id text,
  stripe_checkout_session_id text,
  stripe_price_id text,
  stripe_product_id text,
  latest_invoice_id text,
  last_paid_invoice_id text,
  last_failed_invoice_id text,
  payment_record_id uuid, -- FK to leonix_payment_records intentionally excluded (out of scope, nullable, unused by C9)
  package_entitlement_id uuid references public.listing_package_entitlements(id) on delete set null,
  consent_record_id uuid,
  owner_user_id uuid,
  category text,
  listing_source text,
  listing_id text,
  package_key text,
  amount_cents integer,
  currency text not null default 'usd',
  status text not null default 'pending' check (status in ('pending','active','grace','suspended','canceled')),
  stripe_status text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  cancel_at timestamptz,
  canceled_at timestamptz,
  ended_reason text,
  grace_started_at timestamptz,
  grace_ends_at timestamptz,
  suspended_at timestamptz,
  recovered_at timestamptz,
  suspension_reason text check (suspension_reason is null or suspension_reason in ('payment_failure','chargeback','admin')),
  listing_prior_status text,
  listing_suspended_status text,
  metadata jsonb not null default '{}'::jsonb
);

create unique index if not exists leonix_subscription_records_stripe_sub_key on public.leonix_subscription_records (stripe_subscription_id);
create index if not exists leonix_subscription_records_listing_idx on public.leonix_subscription_records (listing_source, listing_id);
create index if not exists leonix_subscription_records_owner_idx on public.leonix_subscription_records (owner_user_id);
create index if not exists leonix_subscription_records_status_idx on public.leonix_subscription_records (status);
create index if not exists leonix_subscription_records_grace_sweep_idx on public.leonix_subscription_records (grace_ends_at) where status = 'grace';

alter table public.leonix_subscription_records enable row level security;

alter table public.listing_package_entitlements
  add column if not exists subscription_record_id uuid references public.leonix_subscription_records(id) on delete set null;
create index if not exists listing_package_entitlements_subscription_record_idx on public.listing_package_entitlements (subscription_record_id);

-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- End of certification schema setup. Next step (separate, unmodified file, applied after this
-- one succeeds): supabase/migrations/20260810120000_autos_br_negocio_capacity_activation_rpc.sql
-- ═══════════════════════════════════════════════════════════════════════════════════════════
