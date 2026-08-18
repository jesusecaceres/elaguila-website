-- Package 7: Ofertas/Cupones AI scan, review, publication, and cleanup contract.
-- Forward-only schema. No data backfill, no provider calls, no public activation.
begin;

create table if not exists public.oferta_local_scan_pages (
  id uuid primary key default gen_random_uuid(),
  oferta_local_id uuid not null references public.ofertas_locales (id) on delete cascade,
  scan_job_id uuid not null references public.oferta_local_scan_jobs (id) on delete cascade,
  source_asset_version_id uuid references public.ofertas_local_source_assets (id) on delete set null,
  owner_id uuid not null references auth.users (id) on delete cascade,
  page_number integer not null,
  page_status text not null default 'queued',
  stage text not null default 'queued',
  width integer,
  height integer,
  render_method text,
  candidate_count integer not null default 0,
  item_count integer not null default 0,
  crop_count integer not null default 0,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint oferta_local_scan_pages_page_positive_chk check (page_number > 0),
  constraint oferta_local_scan_pages_status_chk
    check (page_status in ('queued', 'processing', 'completed', 'failed', 'skipped')),
  constraint oferta_local_scan_pages_stage_chk
    check (stage in ('queued', 'rasterizing', 'scanning', 'extracting', 'creating_crops', 'completed', 'failed', 'skipped'))
);

create unique index if not exists oferta_local_scan_pages_job_page_idx
  on public.oferta_local_scan_pages (scan_job_id, page_number);

create index if not exists oferta_local_scan_pages_offer_source_idx
  on public.oferta_local_scan_pages (oferta_local_id, source_asset_version_id, page_status);

alter table public.oferta_local_scan_pages enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'oferta_local_scan_pages'
      and policyname = 'oferta_local_scan_pages_owner_read'
  ) then
    create policy "oferta_local_scan_pages_owner_read"
      on public.oferta_local_scan_pages for select to authenticated
      using (owner_id = auth.uid());
  end if;
end $$;

alter table public.oferta_local_scan_jobs
  add column if not exists source_asset_version_id uuid references public.ofertas_local_source_assets (id) on delete set null,
  add column if not exists total_pages integer not null default 0,
  add column if not exists completed_pages integer not null default 0,
  add column if not exists failed_pages integer not null default 0,
  add column if not exists current_page integer,
  add column if not exists current_stage text not null default 'preparing',
  add column if not exists retry_count integer not null default 0,
  add column if not exists failure_summary text,
  add column if not exists last_activity_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'oferta_local_scan_jobs_page_counts_chk'
  ) then
    alter table public.oferta_local_scan_jobs
      add constraint oferta_local_scan_jobs_page_counts_chk
      check (total_pages >= 0 and completed_pages >= 0 and failed_pages >= 0);
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'oferta_local_scan_jobs_current_stage_chk'
  ) then
    alter table public.oferta_local_scan_jobs
      add constraint oferta_local_scan_jobs_current_stage_chk
      check (current_stage in ('uploading', 'preparing', 'rasterizing', 'scanning', 'extracting', 'creating_crops', 'awaiting_review', 'failed', 'complete'));
  end if;
end $$;

alter table public.oferta_local_items
  add column if not exists source_asset_version_id uuid references public.ofertas_local_source_assets (id) on delete set null,
  add column if not exists scan_page_id uuid references public.oferta_local_scan_pages (id) on delete set null,
  add column if not exists source_lifecycle_status text not null default 'active',
  add column if not exists price_amount_cents integer,
  add column if not exists regular_price_amount_cents integer,
  add column if not exists original_price_text text,
  add column if not exists price_parse_status text not null default 'unknown',
  add column if not exists source_page_width integer,
  add column if not exists source_page_height integer,
  add column if not exists source_bbox_format text not null default 'normalized_0_1';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'oferta_local_items_price_cents_chk'
  ) then
    alter table public.oferta_local_items
      add constraint oferta_local_items_price_cents_chk
      check (
        (price_amount_cents is null or price_amount_cents >= 0) and
        (regular_price_amount_cents is null or regular_price_amount_cents >= 0)
      );
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'oferta_local_items_price_parse_status_chk'
  ) then
    alter table public.oferta_local_items
      add constraint oferta_local_items_price_parse_status_chk
      check (price_parse_status in ('unknown', 'parsed', 'deal_text', 'manual', 'invalid'));
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'oferta_local_items_bbox_format_chk'
  ) then
    alter table public.oferta_local_items
      add constraint oferta_local_items_bbox_format_chk
      check (source_bbox_format in ('normalized_0_1'));
  end if;
end $$;

create index if not exists oferta_local_items_scan_page_idx
  on public.oferta_local_items (scan_page_id);

create index if not exists oferta_local_items_public_source_active_idx
  on public.oferta_local_items (oferta_local_id, source_asset_version_id, source_lifecycle_status)
  where is_active = true and review_status = 'approved';

create table if not exists public.ofertas_local_asset_cleanup_queue (
  id uuid primary key default gen_random_uuid(),
  oferta_local_id uuid not null references public.ofertas_locales (id) on delete cascade,
  source_asset_version_id uuid references public.ofertas_local_source_assets (id) on delete set null,
  storage_path text not null,
  cleanup_type text not null default 'source_asset_removed',
  status text not null default 'pending',
  attempt_count integer not null default 0,
  last_attempt_at timestamptz,
  completed_at timestamptz,
  failure_reason text,
  requested_by uuid,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ofertas_asset_cleanup_type_chk
    check (cleanup_type in ('source_asset_removed', 'crop_superseded', 'scan_artifact_superseded')),
  constraint ofertas_asset_cleanup_status_chk
    check (status in ('pending', 'processing', 'failed', 'completed', 'cancelled')),
  constraint ofertas_asset_cleanup_attempt_chk check (attempt_count >= 0)
);

create index if not exists ofertas_asset_cleanup_queue_status_idx
  on public.ofertas_local_asset_cleanup_queue (status, created_at);

create index if not exists ofertas_asset_cleanup_queue_offer_idx
  on public.ofertas_local_asset_cleanup_queue (oferta_local_id, source_asset_version_id);

alter table public.ofertas_local_asset_cleanup_queue enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'ofertas_local_asset_cleanup_queue'
      and policyname = 'ofertas_asset_cleanup_owner_read'
  ) then
    create policy "ofertas_asset_cleanup_owner_read"
      on public.ofertas_local_asset_cleanup_queue for select to authenticated
      using (
        exists (
          select 1 from public.ofertas_locales ol
          where ol.id = oferta_local_id and ol.owner_id = auth.uid()
        )
      );
  end if;
end $$;

create or replace function public.activate_oferta_local_source_version(
  p_oferta_local_id uuid,
  p_source_asset_version_id uuid,
  p_actor_user_id uuid default null
)
returns void
language plpgsql
security invoker
as $$
begin
  if not exists (
    select 1
    from public.ofertas_local_source_assets s
    where s.id = p_source_asset_version_id
      and s.oferta_local_id = p_oferta_local_id
      and s.review_state = 'approved'
      and s.lifecycle_status in ('pending_review', 'active')
  ) then
    raise exception 'source asset is not eligible for activation';
  end if;

  update public.ofertas_local_source_assets
  set lifecycle_status = 'superseded',
      superseded_at = now(),
      updated_at = now()
  where oferta_local_id = p_oferta_local_id
    and lifecycle_status = 'active'
    and id <> p_source_asset_version_id;

  update public.oferta_local_items
  set source_lifecycle_status = 'superseded',
      is_active = false,
      updated_at = now()
  where oferta_local_id = p_oferta_local_id
    and (
      source_asset_version_id is null
      or source_asset_version_id <> p_source_asset_version_id
    );

  update public.ofertas_local_source_assets
  set lifecycle_status = 'active',
      review_state = 'approved',
      activated_at = coalesce(activated_at, now()),
      updated_at = now()
  where id = p_source_asset_version_id
    and oferta_local_id = p_oferta_local_id;

  update public.ofertas_locales
  set active_source_asset_id = p_source_asset_version_id,
      public_source_asset_id = p_source_asset_version_id,
      asset_lifecycle_status = 'current',
      asset_replacement_required_review = false,
      updated_at = now()
  where id = p_oferta_local_id;
end;
$$;

comment on table public.oferta_local_scan_pages is
  'Package 7 page-level Ofertas scan progress and failure truth. No backfill.';
comment on table public.ofertas_local_asset_cleanup_queue is
  'Package 7 truthful cleanup queue for deferred source/crop artifact removal. Does not imply physical deletion.';
comment on function public.activate_oferta_local_source_version(uuid, uuid, uuid) is
  'Package 7 narrow source activation RPC. Preserves parent, Leonix ID, payment, and public term.';

commit;
