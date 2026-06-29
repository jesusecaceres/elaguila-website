-- ADMIN-LIVE-SCHEMA-DRIFT-FIX-01
-- Live schema drift repair based on ADMIN-SUPABASE-BACKING-MATRIX-01.
-- This migration is intentionally additive/idempotent:
-- - no table drops
-- - no column drops
-- - no renames
-- - no public write policies

-- ---------------------------------------------------------------------------
-- AI moderation review proof
-- ---------------------------------------------------------------------------
-- Some production environments were missing this table even though local
-- migrations already define it. Recreate the app-required shape safely.
create table if not exists public.listing_moderation_reviews (
  id uuid primary key default gen_random_uuid(),
  listing_id text not null,
  listing_source text null default 'public.listings',
  source_table text null default 'public.listings',
  category_slug text null,
  leonix_ad_id text null,
  listing_title text null,
  decision text not null default 'needs_review',
  risk_level text null,
  recommended_action text null,
  reason text null,
  reason_categories jsonb null,
  reason_category text null,
  reason_text text null,
  policy_flags jsonb null,
  keyword_flags jsonb null,
  category_rules jsonb null,
  scanner_result jsonb null,
  raw_input jsonb null,
  raw_result jsonb null,
  confidence text null,
  source text not null default 'ai',
  model text null,
  reviewed_by text null default 'ai',
  reviewed_at timestamptz null default now(),
  prompt_version text null,
  policy_version text null,
  error_message text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.listing_moderation_reviews
  add column if not exists listing_id text;

update public.listing_moderation_reviews
set listing_id = 'unknown'
where listing_id is null;

alter table public.listing_moderation_reviews
  alter column listing_id set not null;

alter table public.listing_moderation_reviews
  add column if not exists listing_source text null default 'public.listings',
  add column if not exists source_table text null default 'public.listings',
  add column if not exists category_slug text null,
  add column if not exists leonix_ad_id text null,
  add column if not exists listing_title text null,
  add column if not exists decision text not null default 'needs_review',
  add column if not exists risk_level text null,
  add column if not exists recommended_action text null,
  add column if not exists reason text null,
  add column if not exists reason_categories jsonb null,
  add column if not exists reason_category text null,
  add column if not exists reason_text text null,
  add column if not exists policy_flags jsonb null,
  add column if not exists keyword_flags jsonb null,
  add column if not exists category_rules jsonb null,
  add column if not exists scanner_result jsonb null,
  add column if not exists raw_input jsonb null,
  add column if not exists raw_result jsonb null,
  add column if not exists confidence text null,
  add column if not exists source text not null default 'ai',
  add column if not exists model text null,
  add column if not exists reviewed_by text null default 'ai',
  add column if not exists reviewed_at timestamptz null default now(),
  add column if not exists prompt_version text null,
  add column if not exists policy_version text null,
  add column if not exists error_message text null,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

-- Keep both names populated for compatibility: app code writes source_table,
-- while the drift repair gate requested listing_source.
update public.listing_moderation_reviews
set listing_source = coalesce(listing_source, source_table, 'public.listings'),
    source_table = coalesce(source_table, listing_source, 'public.listings')
where listing_source is null
   or source_table is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'listing_moderation_reviews_decision_chk'
  ) then
    alter table public.listing_moderation_reviews
      add constraint listing_moderation_reviews_decision_chk
      check (decision in ('approved', 'needs_review', 'rejected', 'unavailable'));
  end if;
end $$;

create index if not exists idx_listing_moderation_reviews_listing_source_listing_id
  on public.listing_moderation_reviews (listing_source, listing_id);

create index if not exists idx_listing_moderation_reviews_source_table_listing_id
  on public.listing_moderation_reviews (source_table, listing_id);

create index if not exists idx_listing_moderation_reviews_listing_id
  on public.listing_moderation_reviews (listing_id);

create index if not exists idx_listing_moderation_reviews_leonix_ad_id
  on public.listing_moderation_reviews (leonix_ad_id)
  where leonix_ad_id is not null;

create index if not exists idx_listing_moderation_reviews_decision
  on public.listing_moderation_reviews (decision);

create index if not exists idx_listing_moderation_reviews_risk_level
  on public.listing_moderation_reviews (risk_level)
  where risk_level is not null;

create index if not exists idx_listing_moderation_reviews_created_at
  on public.listing_moderation_reviews (created_at desc);

create index if not exists idx_listing_moderation_reviews_reviewed_at
  on public.listing_moderation_reviews (reviewed_at desc nulls last);

comment on table public.listing_moderation_reviews is
  'AI/human listing moderation proof rows. Service-role/admin writes only; no public write access.';

comment on column public.listing_moderation_reviews.listing_source is
  'Source table for the moderated listing; requested canonical drift-repair name.';

comment on column public.listing_moderation_reviews.source_table is
  'Compatibility source table column used by existing Admin OS app code.';

comment on column public.listing_moderation_reviews.recommended_action is
  'Advisory admin action only; never executed automatically.';

alter table public.listing_moderation_reviews enable row level security;

-- No anon/authenticated policies are added here. Admin OS uses trusted Next.js
-- server routes with the Supabase service role for reads/writes.

-- ---------------------------------------------------------------------------
-- Staff promote / Verify Leonix drift repair columns
-- ---------------------------------------------------------------------------
alter table public.listings
  add column if not exists admin_promoted boolean not null default false;

alter table public.listings
  add column if not exists leonix_verified boolean not null default false;

comment on column public.listings.admin_promoted is
  'Staff spotlight/top-placement flag used by Admin OS promote actions.';

comment on column public.listings.leonix_verified is
  'Leonix staff verification flag used by Admin OS verify actions.';

alter table public.servicios_public_listings
  add column if not exists promoted boolean not null default false;

comment on column public.servicios_public_listings.promoted is
  'Staff spotlight/top-placement flag used by Servicios admin promote actions.';

alter table public.empleos_public_listings
  add column if not exists admin_promoted boolean not null default false;

alter table public.empleos_public_listings
  add column if not exists leonix_verified boolean not null default false;

comment on column public.empleos_public_listings.admin_promoted is
  'Staff spotlight/top-placement flag used by Empleos admin promote actions.';

comment on column public.empleos_public_listings.leonix_verified is
  'Leonix staff verification flag used by Empleos admin verify actions.';

alter table public.viajes_staged_listings
  add column if not exists admin_promoted boolean not null default false;

alter table public.viajes_staged_listings
  add column if not exists leonix_verified boolean not null default false;

comment on column public.viajes_staged_listings.admin_promoted is
  'Staff spotlight/top-placement flag used by Viajes admin promote actions.';

comment on column public.viajes_staged_listings.leonix_verified is
  'Leonix staff verification flag used by Viajes admin verify actions.';
