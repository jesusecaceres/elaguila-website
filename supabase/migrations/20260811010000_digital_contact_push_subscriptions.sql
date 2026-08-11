-- Build 12: Web Push subscriptions for Leonix digital doorbell (service-role only).
-- Additive / idempotent. No public access — staff enrollment via admin APIs only.

create table if not exists public.digital_contact_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  executive_slug text not null,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text null,
  device_label text null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_success_at timestamptz null,
  last_failure_at timestamptz null,
  revoked_at timestamptz null,
  constraint digital_contact_push_subscriptions_endpoint_unique unique (endpoint)
);

create index if not exists digital_contact_push_subscriptions_slug_active_idx
  on public.digital_contact_push_subscriptions (executive_slug, active)
  where active = true;

alter table public.digital_contact_push_subscriptions enable row level security;

-- Fail closed: no policies for anon/authenticated. Service role bypasses RLS.

comment on table public.digital_contact_push_subscriptions is
  'Human Connection Web Push subscriptions. Service-role only; multi-device per executive.';
