-- Ofertas Locales AI scan jobs + searchable items — Stack 11 SQL foundation.
-- No public SELECT policies. No seed rows. Apply deferred to production gate.

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
    check (provider in (
      'google_document_ai',
      'leonix_manual',
      'future_provider'
    )),
  normalizer_provider text not null default 'leonix_normalizer'
    check (normalizer_provider in (
      'leonix_normalizer',
      'openai',
      'gemini',
      'manual'
    )),
  status text not null default 'pending'
    check (status in (
      'idle',
      'pending',
      'processing',
      'needs_review',
      'reviewed',
      'approved',
      'failed',
      'cancelled'
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
  'Leonix Ofertas Locales AI scan jobs. Stack 11: owner-only RLS; Document AI execution deferred.';

create index if not exists oferta_local_scan_jobs_owner_id_idx
  on public.oferta_local_scan_jobs (owner_id);

create index if not exists oferta_local_scan_jobs_oferta_local_id_idx
  on public.oferta_local_scan_jobs (oferta_local_id);

create index if not exists oferta_local_scan_jobs_status_idx
  on public.oferta_local_scan_jobs (status);

create index if not exists oferta_local_scan_jobs_provider_idx
  on public.oferta_local_scan_jobs (provider);

-- ---------------------------------------------------------------------------
-- oferta_local_items
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
  review_status text not null default 'pending'
    check (review_status in (
      'pending',
      'needs_review',
      'approved',
      'rejected'
    )),
  reviewer_note text,
  is_active boolean not null default false,
  is_sponsored boolean not null default false,
  sponsorship_weight integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.oferta_local_items is
  'Leonix Ofertas Locales AI-extracted items. Stack 11: defaults pending/inactive; public SELECT deferred.';

create index if not exists oferta_local_items_owner_id_idx
  on public.oferta_local_items (owner_id);

create index if not exists oferta_local_items_oferta_local_id_idx
  on public.oferta_local_items (oferta_local_id);

create index if not exists oferta_local_items_scan_job_id_idx
  on public.oferta_local_items (scan_job_id);

create index if not exists oferta_local_items_review_status_idx
  on public.oferta_local_items (review_status);

create index if not exists oferta_local_items_is_active_idx
  on public.oferta_local_items (is_active);

create index if not exists oferta_local_items_category_idx
  on public.oferta_local_items (category);

create index if not exists oferta_local_items_business_city_idx
  on public.oferta_local_items (lower(business_city));

create index if not exists oferta_local_items_business_zip_code_idx
  on public.oferta_local_items (business_zip_code);

create index if not exists oferta_local_items_valid_dates_idx
  on public.oferta_local_items (valid_from, valid_until);

create index if not exists oferta_local_items_normalized_item_name_idx
  on public.oferta_local_items (lower(normalized_item_name));

create index if not exists oferta_local_items_sponsorship_idx
  on public.oferta_local_items (is_sponsored, sponsorship_weight desc);

create index if not exists oferta_local_items_search_tags_gin_idx
  on public.oferta_local_items using gin (search_tags);

-- ---------------------------------------------------------------------------
-- RLS — owner only; no public SELECT
-- ---------------------------------------------------------------------------

alter table public.oferta_local_scan_jobs enable row level security;

create policy "oferta_local_scan_jobs_select_owner"
  on public.oferta_local_scan_jobs
  for select
  to authenticated
  using (owner_id = auth.uid());

create policy "oferta_local_scan_jobs_insert_owner"
  on public.oferta_local_scan_jobs
  for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "oferta_local_scan_jobs_update_owner"
  on public.oferta_local_scan_jobs
  for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

alter table public.oferta_local_items enable row level security;

create policy "oferta_local_items_select_owner"
  on public.oferta_local_items
  for select
  to authenticated
  using (owner_id = auth.uid());

create policy "oferta_local_items_insert_owner"
  on public.oferta_local_items
  for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "oferta_local_items_update_owner_reviewable"
  on public.oferta_local_items
  for update
  to authenticated
  using (
    owner_id = auth.uid()
    and review_status in ('pending', 'needs_review', 'rejected')
  )
  with check (
    owner_id = auth.uid()
    and review_status in ('pending', 'needs_review', 'rejected', 'approved')
  );

-- Public SELECT for approved/active items is intentionally deferred to a later public-results gate.
