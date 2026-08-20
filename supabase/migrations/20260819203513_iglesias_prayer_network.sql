-- Iglesias BUILD 03 — Prayer Network (private routing + church prayer teams).
-- Does not rewrite BUILD 01 churches or BUILD 02 prayer wall migrations.

-- Optional applicant intent. Does NOT auto-enroll Prayer Network.
alter table public.church_submissions
  add column if not exists prayer_team_intent text null
    check (prayer_team_intent is null or prayer_team_intent in ('YES', 'NO', 'INTERESTED'));

comment on column public.church_submissions.prayer_team_intent is
  'Applicant intent only. Admin must still activate Prayer Network.';

-- Targeted private prayer. Never public.
alter table public.prayer_requests
  add column if not exists target_church_id uuid null references public.churches(id) on delete set null;

create index if not exists prayer_requests_target_church_idx
  on public.prayer_requests (target_church_id)
  where target_church_id is not null;

comment on column public.prayer_requests.target_church_id is
  'Optional PRIVATE_PRAYER_TEAM target. Not granted to anon.';

-- ---------------------------------------------------------------------------
-- church_prayer_teams — one configuration row per church
-- ---------------------------------------------------------------------------
create table if not exists public.church_prayer_teams (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  enabled boolean not null default false,
  accepts_private_requests boolean not null default false,
  accepts_general_requests boolean not null default false,
  accepts_high_priority_requests boolean not null default false,
  supported_languages text[] not null default '{}'::text[],
  supported_categories text[] not null default '{}'::text[],
  geographic_scope text null,
  primary_contact_email text null,
  primary_contact_phone text null,
  delivery_email_enabled boolean not null default false,
  delivery_dashboard_enabled boolean not null default true,
  status text not null default 'DISABLED'
    check (status in ('ACTIVE', 'PAUSED', 'DISABLED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint church_prayer_teams_languages_allowed check (
    supported_languages <@ array['es', 'en', 'bilingual']::text[]
  )
);

create unique index if not exists church_prayer_teams_church_uidx
  on public.church_prayer_teams (church_id);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'church_prayer_teams_church_id_key'
  ) then
    alter table public.church_prayer_teams
      add constraint church_prayer_teams_church_id_key unique using index church_prayer_teams_church_uidx;
  end if;
end $$;

comment on table public.church_prayer_teams is
  'Prayer Network team configuration. Distinct from church approval/verification.';

alter table public.church_prayer_teams enable row level security;
revoke all on table public.church_prayer_teams from anon, authenticated;

-- Safe public projection: participation flags only. Never grant contact columns.
grant select (
  church_id,
  enabled,
  status,
  accepts_private_requests
) on table public.church_prayer_teams to anon, authenticated;

drop policy if exists church_prayer_teams_select_public on public.church_prayer_teams;
create policy church_prayer_teams_select_public
  on public.church_prayer_teams
  for select
  using (
    enabled = true
    and status = 'ACTIVE'
    and accepts_private_requests = true
    and exists (
      select 1
      from public.churches c
      where c.id = church_prayer_teams.church_id
        and c.approval_status = 'approved'
        and c.is_active = true
        and c.published_at is not null
    )
  );

-- ---------------------------------------------------------------------------
-- church_prayer_team_members — never public
-- ---------------------------------------------------------------------------
create table if not exists public.church_prayer_team_members (
  id uuid primary key default gen_random_uuid(),
  prayer_team_id uuid not null references public.church_prayer_teams(id) on delete cascade,
  name text not null,
  email text not null,
  phone text null,
  preferred_language text null check (
    preferred_language is null or preferred_language in ('es', 'en', 'bilingual')
  ),
  role text not null default 'MEMBER'
    check (role in ('COORDINATOR', 'MEMBER')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint church_prayer_team_members_name_nonempty check (length(trim(name)) > 0),
  constraint church_prayer_team_members_email_nonempty check (length(trim(email)) > 0)
);

create index if not exists church_prayer_team_members_team_idx
  on public.church_prayer_team_members (prayer_team_id, is_active);

comment on table public.church_prayer_team_members is
  'Internal prayer-team roster. Never public.';

alter table public.church_prayer_team_members enable row level security;
revoke all on table public.church_prayer_team_members from anon, authenticated;

-- ---------------------------------------------------------------------------
-- prayer_team_deliveries — never public
-- ---------------------------------------------------------------------------
create table if not exists public.prayer_team_deliveries (
  id uuid primary key default gen_random_uuid(),
  prayer_request_id uuid not null references public.prayer_requests(id) on delete cascade,
  church_id uuid not null references public.churches(id) on delete cascade,
  prayer_team_id uuid not null references public.church_prayer_teams(id) on delete cascade,
  delivery_channel text not null check (delivery_channel in ('EMAIL', 'DASHBOARD')),
  delivery_status text not null default 'PENDING'
    check (delivery_status in ('PENDING', 'PROCESSING', 'DELIVERED', 'FAILED', 'SKIPPED', 'CANCELLED')),
  attempt_count integer not null default 0,
  last_error text null,
  created_at timestamptz not null default now(),
  attempted_at timestamptz null,
  delivered_at timestamptz null
);

create unique index if not exists prayer_team_deliveries_unique_uidx
  on public.prayer_team_deliveries (prayer_request_id, prayer_team_id, delivery_channel);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'prayer_team_deliveries_unique'
  ) then
    alter table public.prayer_team_deliveries
      add constraint prayer_team_deliveries_unique unique using index prayer_team_deliveries_unique_uidx;
  end if;
end $$;

create index if not exists prayer_team_deliveries_prayer_idx
  on public.prayer_team_deliveries (prayer_request_id, created_at desc);

create index if not exists prayer_team_deliveries_team_idx
  on public.prayer_team_deliveries (prayer_team_id, created_at desc);

comment on table public.prayer_team_deliveries is
  'Durable Prayer Network delivery audit. Never public. Do not store analytics bodies here.';

alter table public.prayer_team_deliveries enable row level security;
revoke all on table public.prayer_team_deliveries from anon, authenticated;
