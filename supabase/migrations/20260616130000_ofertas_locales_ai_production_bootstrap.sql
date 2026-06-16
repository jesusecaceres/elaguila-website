-- Gate OL-7B — Ofertas Locales AI production bootstrap (idempotent).
-- IMPORTANT: Apply this migration to production Supabase before expecting AI scan to work.
-- Vercel deploy alone is not sufficient.
--
-- Includes Stack 7 (ofertas_locales) + Stack 11 (scan jobs + items) + OL-7B extraction columns.
-- Safe when earlier migrations (20260605120000, 20260606120000) were never applied.

-- ---------------------------------------------------------------------------
-- ofertas_locales (parent offer / draft record for scan-prep)
-- ---------------------------------------------------------------------------

create table if not exists public.ofertas_locales (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending_review'
    check (status in (
      'draft',
      'submitted',
      'pending_review',
      'approved',
      'rejected',
      'archived',
      'expired'
    )),
  offer_type text not null,
  business_category text not null,
  market_type text,
  business_name text not null,
  title text not null,
  description text,
  coupon_text text,
  flyer_title text,
  valid_from date not null,
  valid_until date not null,
  address text,
  city text not null,
  state text,
  zip_code text not null,
  service_zip_codes text[] not null default '{}',
  phone text,
  whatsapp text,
  website_url text,
  directions_url text,
  membership_url text,
  membership_cta_label text,
  membership_note text,
  requires_membership_for_deals boolean not null default false,
  digital_coupon_url text,
  digital_coupon_note text,
  is_magazine_pickup_partner boolean not null default false,
  magazine_distribution_status text not null default 'not_offered',
  magazine_monthly_drop_estimate text,
  magazine_pickup_notes text,
  flyer_assets jsonb not null default '[]'::jsonb,
  coupon_assets jsonb not null default '[]'::jsonb,
  is_featured_requested boolean not null default false,
  language_tags text[] not null default '{}',
  internal_notes text,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.ofertas_locales is
  'Leonix Ofertas Locales — weekly flyers and coupons. OL-7B production bootstrap.';

create index if not exists ofertas_locales_owner_id_idx on public.ofertas_locales (owner_id);
create index if not exists ofertas_locales_status_idx on public.ofertas_locales (status);
create index if not exists ofertas_locales_offer_type_idx on public.ofertas_locales (offer_type);
create index if not exists ofertas_locales_zip_code_idx on public.ofertas_locales (zip_code);

alter table public.ofertas_locales enable row level security;

-- ---------------------------------------------------------------------------
-- oferta_local_scan_jobs
-- ---------------------------------------------------------------------------

create table if not exists public.oferta_local_scan_jobs (
  id uuid primary key default gen_random_uuid(),
  oferta_local_id uuid not null references public.ofertas_locales (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  source_asset_id text,
  source_asset_type text,
  source_asset_url text,
  provider text not null default 'google_document_ai'
    check (provider in ('google_document_ai', 'leonix_manual', 'future_provider')),
  normalizer_provider text not null default 'leonix_normalizer'
    check (normalizer_provider in ('leonix_normalizer', 'openai', 'gemini', 'manual')),
  status text not null default 'pending'
    check (status in (
      'idle', 'pending', 'processing', 'needs_review', 'reviewed', 'approved', 'failed', 'cancelled'
    )),
  started_at timestamptz,
  completed_at timestamptz,
  raw_result_storage_path text,
  normalized_result_storage_path text,
  error_message text,
  pages_processed integer not null default 0,
  items_extracted_count integer not null default 0,
  confidence_average numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.oferta_local_scan_jobs is
  'Leonix Ofertas Locales AI scan jobs. OL-7B production bootstrap.';

create index if not exists oferta_local_scan_jobs_owner_id_idx on public.oferta_local_scan_jobs (owner_id);
create index if not exists oferta_local_scan_jobs_oferta_local_id_idx on public.oferta_local_scan_jobs (oferta_local_id);
create index if not exists oferta_local_scan_jobs_status_idx on public.oferta_local_scan_jobs (status);

alter table public.oferta_local_scan_jobs enable row level security;

-- OL-7B scan job columns
alter table public.oferta_local_scan_jobs add column if not exists source_storage_path text;
alter table public.oferta_local_scan_jobs add column if not exists source_mime_type text;
alter table public.oferta_local_scan_jobs add column if not exists source_asset_kind text;
alter table public.oferta_local_scan_jobs add column if not exists draft_session_id text;
alter table public.oferta_local_scan_jobs add column if not exists raw_ocr_summary jsonb;

-- ---------------------------------------------------------------------------
-- oferta_local_items (extracted candidates)
-- ---------------------------------------------------------------------------

create table if not exists public.oferta_local_items (
  id uuid primary key default gen_random_uuid(),
  oferta_local_id uuid not null references public.ofertas_locales (id) on delete cascade,
  scan_job_id uuid references public.oferta_local_scan_jobs (id) on delete set null,
  owner_id uuid not null references auth.users (id) on delete cascade,
  business_name text,
  business_address text,
  business_city text,
  business_state text,
  business_zip_code text,
  business_latitude numeric,
  business_longitude numeric,
  item_name text not null,
  normalized_item_name text,
  description text,
  price_text text,
  price_amount numeric,
  unit text,
  deal_type text,
  quantity text,
  category text,
  subcategory text,
  search_tags text[] not null default '{}',
  valid_from date,
  valid_until date,
  source_asset_id text,
  source_asset_url text,
  source_page integer,
  source_crop_url text,
  confidence numeric,
  review_status text not null default 'needs_review'
    check (review_status in ('pending', 'needs_review', 'approved', 'rejected')),
  reviewer_note text,
  is_active boolean not null default false,
  is_sponsored boolean not null default false,
  sponsorship_weight integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.oferta_local_items is
  'Leonix Ofertas Locales AI-extracted candidates. Defaults needs_review + inactive.';

create index if not exists oferta_local_items_owner_id_idx on public.oferta_local_items (owner_id);
create index if not exists oferta_local_items_oferta_local_id_idx on public.oferta_local_items (oferta_local_id);
create index if not exists oferta_local_items_scan_job_id_idx on public.oferta_local_items (scan_job_id);
create index if not exists oferta_local_items_review_status_idx on public.oferta_local_items (review_status);
create index if not exists oferta_local_items_is_active_idx on public.oferta_local_items (is_active);

alter table public.oferta_local_items enable row level security;

-- OL-7B candidate extraction columns
alter table public.oferta_local_items add column if not exists candidate_type text not null default 'product_deal';
alter table public.oferta_local_items add column if not exists regular_price_text text;
alter table public.oferta_local_items add column if not exists coupon_title text;
alter table public.oferta_local_items add column if not exists offer_text text;
alter table public.oferta_local_items add column if not exists terms text;
alter table public.oferta_local_items add column if not exists source_file_name text;
alter table public.oferta_local_items add column if not exists source_context text;
alter table public.oferta_local_items add column if not exists source_bbox jsonb;
alter table public.oferta_local_items add column if not exists extracted_json jsonb not null default '{}'::jsonb;

-- Ensure defaults for existing rows / prior migrations
alter table public.oferta_local_items alter column review_status set default 'needs_review';
alter table public.oferta_local_items alter column is_active set default false;

-- Candidate type constraint (add only if missing)
do $constraint$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'oferta_local_items_candidate_type_check'
  ) then
    alter table public.oferta_local_items
      add constraint oferta_local_items_candidate_type_check
      check (candidate_type in ('product_deal', 'coupon', 'promo'));
  end if;
end $constraint$;

-- ---------------------------------------------------------------------------
-- RLS policies (owner-only; service role bypasses for API routes)
-- ---------------------------------------------------------------------------

do $ofertas_policies$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'ofertas_locales' and policyname = 'ofertas_locales_select_owner'
  ) then
    create policy "ofertas_locales_select_owner"
      on public.ofertas_locales for select to authenticated
      using (owner_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'ofertas_locales' and policyname = 'ofertas_locales_insert_owner'
  ) then
    create policy "ofertas_locales_insert_owner"
      on public.ofertas_locales for insert to authenticated
      with check (owner_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'ofertas_locales' and policyname = 'ofertas_locales_update_owner_pending'
  ) then
    create policy "ofertas_locales_update_owner_pending"
      on public.ofertas_locales for update to authenticated
      using (owner_id = auth.uid() and status in ('draft', 'submitted', 'pending_review'))
      with check (owner_id = auth.uid() and status in ('draft', 'submitted', 'pending_review'));
  end if;
end $ofertas_policies$;

do $scan_policies$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'oferta_local_scan_jobs' and policyname = 'oferta_local_scan_jobs_select_owner'
  ) then
    create policy "oferta_local_scan_jobs_select_owner"
      on public.oferta_local_scan_jobs for select to authenticated using (owner_id = auth.uid());
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'oferta_local_scan_jobs' and policyname = 'oferta_local_scan_jobs_insert_owner'
  ) then
    create policy "oferta_local_scan_jobs_insert_owner"
      on public.oferta_local_scan_jobs for insert to authenticated with check (owner_id = auth.uid());
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'oferta_local_scan_jobs' and policyname = 'oferta_local_scan_jobs_update_owner'
  ) then
    create policy "oferta_local_scan_jobs_update_owner"
      on public.oferta_local_scan_jobs for update to authenticated
      using (owner_id = auth.uid()) with check (owner_id = auth.uid());
  end if;
end $scan_policies$;

do $item_policies$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'oferta_local_items' and policyname = 'oferta_local_items_select_owner'
  ) then
    create policy "oferta_local_items_select_owner"
      on public.oferta_local_items for select to authenticated using (owner_id = auth.uid());
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'oferta_local_items' and policyname = 'oferta_local_items_insert_owner'
  ) then
    create policy "oferta_local_items_insert_owner"
      on public.oferta_local_items for insert to authenticated with check (owner_id = auth.uid());
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'oferta_local_items' and policyname = 'oferta_local_items_update_owner_reviewable'
  ) then
    create policy "oferta_local_items_update_owner_reviewable"
      on public.oferta_local_items for update to authenticated
      using (owner_id = auth.uid() and review_status in ('pending', 'needs_review', 'rejected'))
      with check (owner_id = auth.uid() and review_status in ('pending', 'needs_review', 'rejected', 'approved'));
  end if;
end $item_policies$;

-- No public SELECT policies — public search uses service role with explicit filters.
