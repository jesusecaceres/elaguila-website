-- Autos classifieds: append-only analytics events (service-role writes via API).

create table if not exists public.autos_classifieds_analytics_events (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.autos_classifieds_listings (id) on delete cascade,
  event_type text not null,
  lane text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists autos_classifieds_analytics_listing_idx
  on public.autos_classifieds_analytics_events (listing_id, created_at desc);

create index if not exists autos_classifieds_analytics_type_idx
  on public.autos_classifieds_analytics_events (event_type, created_at desc);

comment on table public.autos_classifieds_analytics_events is 'Leonix Autos listing engagement; inserted by Next.js API with service role.';
