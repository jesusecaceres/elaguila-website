-- Leonix Human Connection (Build 04): executive temporary presence + schedule requests.
-- Service-role only via Next.js APIs. RLS enabled with no anon/authenticated policies.
-- AVAILABLE / BUSY / AWAY must always expire — never seed fake presence.

create table if not exists public.digital_contact_executive_presence (
  profile_slug text primary key,
  status text not null check (status in ('available', 'busy', 'away')),
  expires_at timestamptz not null,
  updated_at timestamptz not null default now(),
  updated_by text null,
  constraint digital_contact_executive_presence_expires_after_update
    check (expires_at > updated_at)
);

create index if not exists digital_contact_executive_presence_expires_idx
  on public.digital_contact_executive_presence (expires_at);

alter table public.digital_contact_executive_presence enable row level security;

comment on table public.digital_contact_executive_presence is
  'ECP temporary presence for Human Connection video eligibility. Service-role writes only; all statuses expire.';

create table if not exists public.digital_contact_schedule_requests (
  id uuid primary key default gen_random_uuid(),
  profile_slug text not null,
  visitor_name text not null,
  contact_method text not null check (contact_method in ('email', 'phone', 'whatsapp')),
  visitor_email text null,
  visitor_phone text null,
  preferred_time text not null,
  message text null,
  lang text not null default 'es',
  surface text not null default 'virtual_front_desk',
  source text null,
  created_at timestamptz not null default now(),
  read_at timestamptz null
);

create index if not exists digital_contact_schedule_requests_slug_created_idx
  on public.digital_contact_schedule_requests (profile_slug, created_at desc);

alter table public.digital_contact_schedule_requests enable row level security;

comment on table public.digital_contact_schedule_requests is
  'Human Connection follow-up / schedule REQUESTS only — not confirmed calendar appointments. Not CRM pipeline.';
