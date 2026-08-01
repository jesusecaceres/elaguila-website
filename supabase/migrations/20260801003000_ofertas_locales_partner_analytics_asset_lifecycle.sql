-- Package 6: Ofertas/Cupones partner operations, analytics, and asset lifecycle.
-- Forward-only schema. No data backfill, no payment fabrication, no public activation.
begin;

create table if not exists public.ofertas_local_partner_organizations (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  legal_name text,
  partner_type text not null default 'magazine_pickup_partner',
  verification_status text not null default 'unverified',
  operational_status text not null default 'active',
  pickup_location_eligible boolean not null default false,
  internal_notes text,
  verified_at timestamptz,
  verified_by uuid,
  suspended_at timestamptz,
  suspension_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ofertas_partner_org_type_chk
    check (partner_type in ('magazine_pickup_partner', 'sponsor', 'community_partner')),
  constraint ofertas_partner_org_verification_chk
    check (verification_status in ('unverified', 'verified', 'revoked')),
  constraint ofertas_partner_org_operational_chk
    check (operational_status in ('active', 'suspended', 'expired'))
);

create table if not exists public.ofertas_local_partner_pickup_locations (
  id uuid primary key default gen_random_uuid(),
  partner_organization_id uuid not null references public.ofertas_local_partner_organizations (id) on delete cascade,
  display_name text not null,
  address text not null,
  city text not null,
  state text,
  zip_code text,
  hours text,
  contact text,
  map_url text,
  public_status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ofertas_partner_pickup_status_chk
    check (public_status in ('active', 'hidden', 'removed'))
);

create table if not exists public.ofertas_local_partner_assignments (
  id uuid primary key default gen_random_uuid(),
  oferta_local_id uuid not null references public.ofertas_locales (id) on delete cascade,
  partner_organization_id uuid not null references public.ofertas_local_partner_organizations (id) on delete restrict,
  assignment_status text not null default 'active',
  courtesy_starts_at timestamptz,
  courtesy_ends_at timestamptz,
  courtesy_product_key text not null,
  placement_priority integer not null default 0,
  badge_enabled boolean not null default false,
  highlighted_placement_enabled boolean not null default false,
  pickup_visibility_enabled boolean not null default false,
  assignment_reason text,
  revoked_at timestamptz,
  revoked_by uuid,
  revoked_reason text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ofertas_partner_assignment_status_chk
    check (assignment_status in ('active', 'suspended', 'revoked', 'expired')),
  constraint ofertas_partner_assignment_product_chk
    check (courtesy_product_key in ('ofertas_locales_flyer_30d', 'ofertas_locales_coupons_30d')),
  constraint ofertas_partner_assignment_priority_chk
    check (placement_priority between 0 and 100),
  constraint ofertas_partner_assignment_courtesy_order_chk
    check (courtesy_starts_at is null or courtesy_ends_at is null or courtesy_starts_at < courtesy_ends_at)
);

create unique index if not exists ofertas_partner_assignments_one_active_idx
  on public.ofertas_local_partner_assignments (oferta_local_id)
  where assignment_status = 'active';

create index if not exists ofertas_partner_assignments_partner_idx
  on public.ofertas_local_partner_assignments (partner_organization_id, assignment_status);

create index if not exists ofertas_partner_assignments_courtesy_idx
  on public.ofertas_local_partner_assignments (courtesy_starts_at, courtesy_ends_at)
  where assignment_status = 'active';

create table if not exists public.ofertas_local_source_assets (
  id uuid primary key default gen_random_uuid(),
  oferta_local_id uuid not null references public.ofertas_locales (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  version_number integer not null,
  asset_kind text not null,
  source_asset_id text not null,
  storage_path text,
  public_url text,
  original_file_name text,
  mime_type text,
  size_bytes bigint,
  page_count integer,
  scan_job_id uuid references public.oferta_local_scan_jobs (id) on delete set null,
  review_state text not null default 'needs_review',
  lifecycle_status text not null default 'pending_review',
  replacement_reason text,
  uploaded_by uuid,
  activated_at timestamptz,
  superseded_at timestamptz,
  removed_at timestamptz,
  removed_by uuid,
  removal_reason text,
  cleanup_status text not null default 'not_requested',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ofertas_source_assets_asset_kind_chk
    check (asset_kind in ('flyer', 'coupon')),
  constraint ofertas_source_assets_review_state_chk
    check (review_state in ('needs_review', 'approved', 'rejected')),
  constraint ofertas_source_assets_lifecycle_chk
    check (lifecycle_status in ('pending_review', 'active', 'superseded', 'removed', 'scan_failed')),
  constraint ofertas_source_assets_cleanup_chk
    check (cleanup_status in ('not_requested', 'queued', 'completed', 'failed')),
  constraint ofertas_source_assets_version_positive_chk
    check (version_number > 0)
);

create unique index if not exists ofertas_source_assets_version_unique_idx
  on public.ofertas_local_source_assets (oferta_local_id, version_number);

create unique index if not exists ofertas_source_assets_one_active_idx
  on public.ofertas_local_source_assets (oferta_local_id, asset_kind)
  where lifecycle_status = 'active';

create index if not exists ofertas_source_assets_offer_status_idx
  on public.ofertas_local_source_assets (oferta_local_id, lifecycle_status, review_state);

alter table public.ofertas_locales
  add column if not exists partner_assignment_id uuid references public.ofertas_local_partner_assignments (id) on delete set null,
  add column if not exists commercial_eligibility_source text not null default 'paid',
  add column if not exists active_source_asset_id uuid references public.ofertas_local_source_assets (id) on delete set null,
  add column if not exists public_source_asset_id uuid references public.ofertas_local_source_assets (id) on delete set null,
  add column if not exists asset_lifecycle_status text not null default 'legacy',
  add column if not exists asset_replacement_required_review boolean not null default false;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'ofertas_locales_commercial_eligibility_source_chk'
  ) then
    alter table public.ofertas_locales
      add constraint ofertas_locales_commercial_eligibility_source_chk
      check (commercial_eligibility_source in ('paid', 'partner_courtesy'));
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'ofertas_locales_asset_lifecycle_status_chk'
  ) then
    alter table public.ofertas_locales
      add constraint ofertas_locales_asset_lifecycle_status_chk
      check (asset_lifecycle_status in ('legacy', 'current', 'replacement_pending', 'replacement_rejected', 'removed'));
  end if;
end $$;

alter table public.oferta_local_scan_jobs
  add column if not exists source_asset_version_id uuid references public.ofertas_local_source_assets (id) on delete set null;

alter table public.oferta_local_items
  add column if not exists source_asset_version_id uuid references public.ofertas_local_source_assets (id) on delete set null,
  add column if not exists source_lifecycle_status text not null default 'active';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'oferta_local_items_source_lifecycle_status_chk'
  ) then
    alter table public.oferta_local_items
      add constraint oferta_local_items_source_lifecycle_status_chk
      check (source_lifecycle_status in ('active', 'superseded', 'removed'));
  end if;
end $$;

create index if not exists oferta_local_scan_jobs_source_asset_version_idx
  on public.oferta_local_scan_jobs (source_asset_version_id);

create index if not exists oferta_local_items_source_asset_version_idx
  on public.oferta_local_items (source_asset_version_id, source_lifecycle_status);

create index if not exists oferta_local_items_public_active_source_idx
  on public.oferta_local_items (oferta_local_id, source_asset_version_id)
  where is_active = true and review_status = 'approved' and source_lifecycle_status = 'active';

alter table public.listing_analytics drop constraint if exists listing_analytics_event_type_check;

alter table public.listing_analytics
  add constraint listing_analytics_event_type_check
  check (event_type in (
    'listing_view',
    'listing_save',
    'listing_unsave',
    'listing_share',
    'message_sent',
    'profile_view',
    'listing_open',
    'listing_like',
    'listing_unlike',
    'cta_click',
    'phone_click',
    'whatsapp_click',
    'website_click',
    'directions_click',
    'lead_created',
    'apply_started',
    'apply_submitted',
    'contact_click',
    'outbound_click',
    'listing_impression',
    'result_card_click',
    'email_click',
    'message_click',
    'flyer_page_view',
    'product_impression',
    'product_open',
    'product_search',
    'product_search_result_click',
    'shopping_list_add',
    'shopping_list_remove',
    'coupon_open'
  ));

alter table public.ofertas_local_partner_organizations enable row level security;
alter table public.ofertas_local_partner_pickup_locations enable row level security;
alter table public.ofertas_local_partner_assignments enable row level security;
alter table public.ofertas_local_source_assets enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'ofertas_local_partner_organizations' and policyname = 'ofertas_partner_orgs_public_verified_read'
  ) then
    create policy "ofertas_partner_orgs_public_verified_read"
      on public.ofertas_local_partner_organizations for select to anon, authenticated
      using (verification_status = 'verified' and operational_status = 'active');
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'ofertas_local_partner_pickup_locations' and policyname = 'ofertas_partner_pickup_public_active_read'
  ) then
    create policy "ofertas_partner_pickup_public_active_read"
      on public.ofertas_local_partner_pickup_locations for select to anon, authenticated
      using (public_status = 'active');
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'ofertas_partner_assignments' and policyname = 'ofertas_partner_assignments_owner_read'
  ) then
    create policy "ofertas_partner_assignments_owner_read"
      on public.ofertas_local_partner_assignments for select to authenticated
      using (
        exists (
          select 1 from public.ofertas_locales ol
          where ol.id = oferta_local_id and ol.owner_id = auth.uid()
        )
      );
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'ofertas_local_source_assets' and policyname = 'ofertas_source_assets_owner_read'
  ) then
    create policy "ofertas_source_assets_owner_read"
      on public.ofertas_local_source_assets for select to authenticated
      using (owner_id = auth.uid());
  end if;
end $$;

comment on table public.ofertas_local_partner_organizations is
  'Package 6 verified partner organizations for Ofertas/Cupones. Admin writes via service role.';
comment on table public.ofertas_local_partner_assignments is
  'Package 6 assignment and courtesy entitlement provenance for canonical Ofertas parent rows.';
comment on table public.ofertas_local_partner_pickup_locations is
  'Package 6 real public pickup-location records tied to verified partners.';
comment on table public.ofertas_local_source_assets is
  'Package 6 versioned Ofertas source flyer/coupon assets. One canonical parent may have many versions.';

commit;
