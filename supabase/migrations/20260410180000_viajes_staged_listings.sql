-- Viajes staged listings: internal beta / moderation pipeline (business + private lanes).
-- Public read: approved + is_public. Owners read own rows (all statuses). Writes via service role API + moderation.

create table if not exists public.viajes_staged_listings (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  category text not null default 'viajes'
    check (category = 'viajes'),
  lane text not null
    check (lane in ('business', 'private')),
  owner_user_id uuid references auth.users (id) on delete set null,
  business_profile_slug text,
  submitter_name text,
  submitter_email text,
  submitter_phone text,
  title text not null,
  lifecycle_status text not null default 'submitted'
    check (lifecycle_status in (
      'draft',
      'submitted',
      'in_review',
      'approved',
      'rejected',
      'changes_requested',
      'expired',
      'unpublished'
    )),
  is_public boolean not null default false,
  review_notes text,
  moderation_reason text,
  hero_image_url text,
  listing_json jsonb not null default '{}'::jsonb,
  lang text not null default 'es'
    check (lang in ('es', 'en')),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  published_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists viajes_staged_listings_lifecycle_idx
  on public.viajes_staged_listings (lifecycle_status);

create index if not exists viajes_staged_listings_owner_idx
  on public.viajes_staged_listings (owner_user_id);

create index if not exists viajes_staged_listings_submitted_idx
  on public.viajes_staged_listings (submitted_at desc nulls last);

create index if not exists viajes_staged_listings_public_idx
  on public.viajes_staged_listings (is_public, published_at desc)
  where lifecycle_status = 'approved' and is_public = true;

alter table public.viajes_staged_listings enable row level security;

-- Anonymous + authenticated: approved public rows only
create policy "viajes_staged_select_public_approved"
  on public.viajes_staged_listings
  for select
  using (lifecycle_status = 'approved' and is_public = true);

-- Authenticated owners: all own rows (dashboard / status)
create policy "viajes_staged_select_owner"
  on public.viajes_staged_listings
  for select
  using (auth.uid() is not null and owner_user_id = auth.uid());

comment on table public.viajes_staged_listings is
  'Viajes publish pipeline (staging). Inserts/updates via Next.js service role; public discovery reads approved+is_public.';
