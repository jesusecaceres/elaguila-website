-- Paid Autos classifieds: draft → payment → active public listings.
-- Writes go through Next.js API routes with the service role only.

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
  updated_at timestamptz not null default now()
);

create index if not exists autos_classifieds_listings_status_idx
  on public.autos_classifieds_listings (status);

create index if not exists autos_classifieds_listings_owner_idx
  on public.autos_classifieds_listings (owner_user_id);

create index if not exists autos_classifieds_listings_published_idx
  on public.autos_classifieds_listings (published_at desc nulls last);

alter table public.autos_classifieds_listings enable row level security;

-- Authenticated users can read their own rows (any status) when using the anon key + JWT.
create policy "autos_classifieds_listings_select_own"
  on public.autos_classifieds_listings
  for select
  to authenticated
  using (auth.uid() = owner_user_id);

-- Public discovery: only active listings (anon + authenticated).
create policy "autos_classifieds_listings_select_active"
  on public.autos_classifieds_listings
  for select
  using (status = 'active');

comment on table public.autos_classifieds_listings is 'Leonix Clasificados Autos paid listings; API writes via service role.';
