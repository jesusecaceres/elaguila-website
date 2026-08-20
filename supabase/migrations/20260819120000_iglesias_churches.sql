-- Iglesias BUILD 01 — canonical church model (directory only).
-- No prayer_requests / acknowledgements / network delivery tables.

-- ---------------------------------------------------------------------------
-- churches
-- Public SELECT only for approved + active + published rows.
-- Applicant PII lives on church_submissions (service-role only).
-- verification_status and prayer_network_enrolled exist so states stay distinct,
-- but BUILD 01 does not display Verified or Prayer Network badges.
-- ---------------------------------------------------------------------------
create table if not exists public.churches (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  short_description text null,
  mission text null,
  church_type text null,
  denomination text null,
  approval_status text not null default 'pending'
    check (approval_status in ('pending', 'approved', 'rejected')),
  is_active boolean not null default false,
  verification_status text not null default 'unverified'
    check (verification_status in ('unverified', 'verified')),
  prayer_network_enrolled boolean not null default false,
  city text null,
  state text null,
  country text null,
  zip text null,
  address_line1 text null,
  address_line2 text null,
  public_location boolean not null default false,
  latitude double precision null,
  longitude double precision null,
  languages text[] not null default '{}'::text[],
  phone text null,
  email text null,
  website text null,
  whatsapp text null,
  livestream_url text null,
  socials jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz null,
  constraint churches_slug_nonempty check (length(trim(slug)) > 0),
  constraint churches_name_nonempty check (length(trim(name)) > 0),
  constraint churches_languages_allowed check (
    languages <@ array['es', 'en', 'bilingual']::text[]
  ),
  constraint churches_coords_pair check (
    (latitude is null and longitude is null)
    or (latitude is not null and longitude is not null)
  )
);

create unique index if not exists churches_slug_uidx on public.churches (slug);
create index if not exists churches_public_discovery_idx
  on public.churches (approval_status, is_active, published_at desc)
  where approval_status = 'approved' and is_active = true and published_at is not null;
create index if not exists churches_city_idx on public.churches (lower(city));
create index if not exists churches_state_idx on public.churches (lower(state));
create index if not exists churches_country_idx on public.churches (lower(country));
create index if not exists churches_zip_idx on public.churches (zip);

comment on table public.churches is
  'Iglesias canonical congregation records. Public reads approved+active+published only.';
comment on column public.churches.verification_status is
  'Distinct from approval. Do not show a Verified badge until an operational workflow exists.';
comment on column public.churches.prayer_network_enrolled is
  'BUILD 03 Prayer Network. Distinct from verified/approved. Default false.';
comment on column public.churches.public_location is
  'When false, address/coords must not be used for public directions.';

alter table public.churches enable row level security;

drop policy if exists churches_select_public on public.churches;
create policy churches_select_public
  on public.churches
  for select
  using (
    approval_status = 'approved'
    and is_active = true
    and published_at is not null
  );

grant select on table public.churches to anon, authenticated;
revoke insert, update, delete on table public.churches from anon, authenticated;

-- ---------------------------------------------------------------------------
-- church_submissions — applicant + admin review PII (no public SELECT)
-- ---------------------------------------------------------------------------
create table if not exists public.church_submissions (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  applicant_name text null,
  applicant_email text null,
  applicant_phone text null,
  admin_notes text null,
  reject_reason text null,
  reviewed_at timestamptz null,
  reviewed_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists church_submissions_church_id_uidx
  on public.church_submissions (church_id);

comment on table public.church_submissions is
  'Iglesias application/review metadata. Service-role only. Never exposed publicly.';

alter table public.church_submissions enable row level security;

revoke all on table public.church_submissions from anon, authenticated;

-- ---------------------------------------------------------------------------
-- church_services
-- ---------------------------------------------------------------------------
create table if not exists public.church_services (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  starts_at time not null,
  label text null,
  language text not null default 'es'
    check (language in ('es', 'en', 'bilingual')),
  mode text not null default 'in_person'
    check (mode in ('in_person', 'online', 'hybrid')),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists church_services_church_id_idx
  on public.church_services (church_id, sort_order, day_of_week, starts_at);

comment on table public.church_services is
  'Normalized service times. Public SELECT only when parent church is publicly eligible.';

alter table public.church_services enable row level security;

drop policy if exists church_services_select_public on public.church_services;
create policy church_services_select_public
  on public.church_services
  for select
  using (
    is_active = true
    and exists (
      select 1
      from public.churches c
      where c.id = church_services.church_id
        and c.approval_status = 'approved'
        and c.is_active = true
        and c.published_at is not null
    )
  );

grant select on table public.church_services to anon, authenticated;
revoke insert, update, delete on table public.church_services from anon, authenticated;

-- ---------------------------------------------------------------------------
-- church_ministries — canonical need keys only
-- ---------------------------------------------------------------------------
create table if not exists public.church_ministries (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  need_key text not null
    check (need_key in (
      'PRAYER',
      'SPANISH_SERVICE',
      'BILINGUAL_SERVICE',
      'CHILDREN',
      'YOUTH',
      'FAMILIES',
      'MARRIAGE',
      'GRIEF',
      'FOOD_SUPPORT',
      'COMMUNITY_SUPPORT',
      'BIBLE_STUDY',
      'RECOVERY',
      'SENIORS',
      'DISABILITY_ACCESS',
      'LIVESTREAM',
      'SMALL_GROUPS'
    )),
  display_note text null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (church_id, need_key)
);

create index if not exists church_ministries_need_key_idx
  on public.church_ministries (need_key)
  where is_active = true;

comment on table public.church_ministries is
  'Canonical Find-by-Need keys. display_note is display-only and never used as a filter.';

alter table public.church_ministries enable row level security;

drop policy if exists church_ministries_select_public on public.church_ministries;
create policy church_ministries_select_public
  on public.church_ministries
  for select
  using (
    is_active = true
    and exists (
      select 1
      from public.churches c
      where c.id = church_ministries.church_id
        and c.approval_status = 'approved'
        and c.is_active = true
        and c.published_at is not null
    )
  );

grant select on table public.church_ministries to anon, authenticated;
revoke insert, update, delete on table public.church_ministries from anon, authenticated;

-- ---------------------------------------------------------------------------
-- church_media
-- ---------------------------------------------------------------------------
create table if not exists public.church_media (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  role text not null check (role in ('logo', 'hero', 'gallery')),
  url text not null,
  alt_text text not null default '',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint church_media_url_nonempty check (length(trim(url)) > 0)
);

create index if not exists church_media_church_role_idx
  on public.church_media (church_id, role, sort_order);

comment on table public.church_media is
  'Church logo/hero/gallery. Fallback imagery must never be stored as if it belonged to the church.';

alter table public.church_media enable row level security;

drop policy if exists church_media_select_public on public.church_media;
create policy church_media_select_public
  on public.church_media
  for select
  using (
    is_active = true
    and exists (
      select 1
      from public.churches c
      where c.id = church_media.church_id
        and c.approval_status = 'approved'
        and c.is_active = true
        and c.published_at is not null
    )
  );

grant select on table public.church_media to anon, authenticated;
revoke insert, update, delete on table public.church_media from anon, authenticated;
