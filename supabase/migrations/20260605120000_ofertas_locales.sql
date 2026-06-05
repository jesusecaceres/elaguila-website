-- Ofertas Locales offers — pending review foundation (Stack 7).
-- No public SELECT policy; no seed rows.

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
  'Leonix Ofertas Locales — business weekly flyers and coupons. Stack 7: pending_review inserts only; public reads deferred.';

create index if not exists ofertas_locales_owner_id_idx
  on public.ofertas_locales (owner_id);

create index if not exists ofertas_locales_status_idx
  on public.ofertas_locales (status);

create index if not exists ofertas_locales_offer_type_idx
  on public.ofertas_locales (offer_type);

create index if not exists ofertas_locales_business_category_idx
  on public.ofertas_locales (business_category);

create index if not exists ofertas_locales_city_idx
  on public.ofertas_locales (lower(city));

create index if not exists ofertas_locales_zip_code_idx
  on public.ofertas_locales (zip_code);

create index if not exists ofertas_locales_valid_dates_idx
  on public.ofertas_locales (valid_from, valid_until);

alter table public.ofertas_locales enable row level security;

create policy "ofertas_locales_select_owner"
  on public.ofertas_locales
  for select
  to authenticated
  using (owner_id = auth.uid());

create policy "ofertas_locales_insert_owner"
  on public.ofertas_locales
  for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "ofertas_locales_update_owner_pending"
  on public.ofertas_locales
  for update
  to authenticated
  using (
    owner_id = auth.uid()
    and status in ('draft', 'submitted', 'pending_review')
  )
  with check (
    owner_id = auth.uid()
    and status in ('draft', 'submitted', 'pending_review')
  );

-- Public SELECT for approved/live offers is intentionally deferred to a later gate.
