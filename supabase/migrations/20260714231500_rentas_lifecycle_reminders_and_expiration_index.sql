-- Rentas lifecycle renewal support.
-- Forward-only, nullable, and safe for shared public.listings:
-- - no status weakening
-- - no destructive backfill
-- - no fabricated payment/expiration dates

create index if not exists listings_rentas_active_expires_at_idx
  on public.listings (expires_at)
  where category = 'rentas' and status = 'active' and is_published = true and expires_at is not null;

create table if not exists public.listing_lifecycle_reminder_events (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null,
  leonix_ad_id text,
  owner_id uuid,
  category text not null,
  package_key text not null,
  expires_at timestamptz not null,
  reminder_type text not null,
  scheduled_for timestamptz not null,
  sent_at timestamptz,
  channel text not null,
  delivery_status text not null default 'pending',
  dedupe_key text not null,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint listing_lifecycle_reminder_events_category_chk
    check (category in ('rentas')),
  constraint listing_lifecycle_reminder_events_reminder_type_chk
    check (reminder_type in ('before_7d', 'before_3d', 'before_1d', 'expires_today', 'after_3d')),
  constraint listing_lifecycle_reminder_events_channel_chk
    check (channel in ('dashboard', 'email')),
  constraint listing_lifecycle_reminder_events_delivery_status_chk
    check (delivery_status in ('pending', 'sent', 'skipped', 'failed'))
);

create unique index if not exists listing_lifecycle_reminder_events_dedupe_key_idx
  on public.listing_lifecycle_reminder_events (dedupe_key);

create index if not exists listing_lifecycle_reminder_events_due_idx
  on public.listing_lifecycle_reminder_events (scheduled_for, delivery_status)
  where delivery_status = 'pending';
