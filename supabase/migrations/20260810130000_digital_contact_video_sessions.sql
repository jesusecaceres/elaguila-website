-- Build 04B: ephemeral video session host-credential store (service-role only).
-- Privileged host join URLs must never be readable by anon/authenticated clients.

create table if not exists public.digital_contact_video_sessions (
  id text primary key,
  profile_slug text not null,
  provider_id text not null,
  provider_room_name text not null,
  host_provider_join_url text not null,
  visitor_join_url text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  notified_at timestamptz null,
  notification_ok boolean null
);

create index if not exists digital_contact_video_sessions_expires_idx
  on public.digital_contact_video_sessions (expires_at);

create index if not exists digital_contact_video_sessions_slug_created_idx
  on public.digital_contact_video_sessions (profile_slug, created_at desc);

alter table public.digital_contact_video_sessions enable row level security;

comment on table public.digital_contact_video_sessions is
  'Human Connection ephemeral video sessions. Host credentials service-role only; short TTL.';
