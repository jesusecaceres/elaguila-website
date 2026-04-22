-- Servicios: structured leads, moderated customer reviews, lightweight analytics, moderation notes.
-- All reads/writes for these tables are intended to go through the Next.js service-role API layer.

-- Moderation notes on the public listing row (ops-only)
alter table public.servicios_public_listings
  add column if not exists moderation_notes text;

comment on column public.servicios_public_listings.moderation_notes is
  'Internal ops notes for moderation (admin-only surface).';

-- Quote / contact inquiries
create table if not exists public.servicios_public_leads (
  id uuid primary key default gen_random_uuid(),
  listing_slug text not null,
  provider_user_id uuid null,
  sender_name text not null,
  sender_email text not null,
  message text not null,
  request_kind text not null default 'quote' check (request_kind in ('quote', 'general')),
  honeypot text null,
  created_at timestamptz not null default now(),
  read_at timestamptz null
);

create index if not exists servicios_public_leads_listing_slug_idx
  on public.servicios_public_leads (listing_slug desc);
create index if not exists servicios_public_leads_provider_user_id_idx
  on public.servicios_public_leads (provider_user_id desc);

alter table public.servicios_public_leads enable row level security;

-- Customer-submitted reviews (moderated)
create table if not exists public.servicios_listing_reviews (
  id uuid primary key default gen_random_uuid(),
  listing_slug text not null,
  rating smallint not null check (rating >= 1 and rating <= 5),
  author_name text not null,
  body text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  moderated_at timestamptz null
);

create index if not exists servicios_listing_reviews_slug_status_idx
  on public.servicios_listing_reviews (listing_slug, status);

alter table public.servicios_listing_reviews enable row level security;

-- Servicios-specific analytics (service role inserts from API routes)
create table if not exists public.servicios_analytics_events (
  id uuid primary key default gen_random_uuid(),
  listing_slug text not null,
  event_type text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists servicios_analytics_events_slug_created_idx
  on public.servicios_analytics_events (listing_slug, created_at desc);

alter table public.servicios_analytics_events enable row level security;
