-- Leonix Digital Contact Platform: Lead Exchange + isolated analytics.
-- All reads/writes for these tables go through the Next.js service-role API layer
-- (app/lib/digitalContact/digitalContactOpsTablesServer.ts). Never mirrored into
-- servicios/listing analytics — Digital Contact stays its own isolated surface.

create table if not exists public.digital_contact_leads (
  id uuid primary key default gen_random_uuid(),
  profile_slug text not null,
  sender_name text not null,
  business_name text null,
  sender_phone text null,
  sender_email text not null,
  message text null,
  how_met text null,
  consent boolean not null default false,
  honeypot text null,
  created_at timestamptz not null default now(),
  read_at timestamptz null
);

create index if not exists digital_contact_leads_profile_slug_idx
  on public.digital_contact_leads (profile_slug, created_at desc);

alter table public.digital_contact_leads enable row level security;

-- Digital Contact-only analytics (page views, CTA taps, VCF saves, QR downloads, lead submits).
create table if not exists public.digital_contact_analytics_events (
  id uuid primary key default gen_random_uuid(),
  profile_slug text not null,
  event_type text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists digital_contact_analytics_events_slug_created_idx
  on public.digital_contact_analytics_events (profile_slug, created_at desc);

alter table public.digital_contact_analytics_events enable row level security;
