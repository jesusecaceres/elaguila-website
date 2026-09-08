-- Iglesias BUILD 02 — Prayer Wall (privacy + safety + human moderation).
-- Dedicated prayer tables. Do not reuse listing likes or listing moderation.
-- Prayer Network delivery tables belong BUILD 03 — not created here.

-- ---------------------------------------------------------------------------
-- prayer_requests
-- Public SELECT is column-bounded (no contact, identity, AI, or session fields).
-- Row policy: public visibilities + CLEARLY_SAFE + public lifecycle + published_at.
-- ---------------------------------------------------------------------------
create table if not exists public.prayer_requests (
  id uuid primary key default gen_random_uuid(),
  submitter_user_id uuid null,
  anonymous_session_hash text null,
  ip_hash text null,
  visibility text not null
    check (visibility in ('PUBLIC_NAMED', 'PUBLIC_ANONYMOUS', 'PRIVATE_PRAYER_TEAM')),
  language text not null
    check (language in ('es', 'en')),
  city text null,
  category text null
    check (
      category is null
      or category in (
        'HEALTH', 'FAMILY', 'MARRIAGE', 'CHILDREN', 'GRIEF', 'WORK',
        'HOUSING', 'RECOVERY', 'ANXIETY_FEAR', 'FAITH_DIRECTION', 'COMMUNITY', 'OTHER'
      )
    ),
  display_name text null,
  body text not null,
  body_normalized text not null,
  body_original_internal text null,
  status text not null default 'OPEN'
    check (status in (
      'OPEN', 'STILL_NEEDS_PRAYER', 'UPDATE_POSTED', 'CLOSED',
      'ANSWERED_OR_GRATITUDE', 'REMOVED', 'MODERATION_HOLD'
    )),
  moderation_status text not null default 'PENDING'
    check (moderation_status in (
      'PENDING', 'CLEARLY_SAFE', 'HUMAN_REVIEW', 'DISALLOWED', 'CRISIS_REVIEW'
    )),
  risk_level text null,
  ai_decision text null,
  ai_reason_codes text[] not null default '{}'::text[],
  contains_private_info boolean not null default false,
  contains_third_party_pii boolean not null default false,
  contains_spam boolean not null default false,
  contains_threat boolean not null default false,
  contains_hate boolean not null default false,
  contains_self_harm_signal boolean not null default false,
  contains_imminent_violence_signal boolean not null default false,
  contact_consent boolean not null default false,
  preferred_contact_method text null
    check (
      preferred_contact_method is null
      or preferred_contact_method in ('email', 'phone', 'whatsapp')
    ),
  contact_email text null,
  contact_phone text null,
  contact_whatsapp text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz null,
  closed_at timestamptz null,
  constraint prayer_requests_body_nonempty check (length(trim(body)) >= 20),
  constraint prayer_requests_body_max check (char_length(body) <= 4000),
  constraint prayer_requests_identity check (
    submitter_user_id is not null or length(coalesce(anonymous_session_hash, '')) > 0
  ),
  constraint prayer_requests_anon_name check (
    visibility <> 'PUBLIC_ANONYMOUS' or display_name is null
  ),
  constraint prayer_requests_private_only_contact check (
    visibility = 'PRIVATE_PRAYER_TEAM'
    or (
      contact_consent = false
      and contact_email is null
      and contact_phone is null
      and contact_whatsapp is null
    )
  )
);

create index if not exists prayer_requests_public_wall_idx
  on public.prayer_requests (published_at desc)
  where visibility in ('PUBLIC_NAMED', 'PUBLIC_ANONYMOUS')
    and moderation_status = 'CLEARLY_SAFE'
    and status in ('OPEN', 'STILL_NEEDS_PRAYER', 'UPDATE_POSTED', 'ANSWERED_OR_GRATITUDE')
    and published_at is not null;

create index if not exists prayer_requests_moderation_idx
  on public.prayer_requests (moderation_status, created_at desc);

create index if not exists prayer_requests_session_created_idx
  on public.prayer_requests (anonymous_session_hash, created_at desc);

create index if not exists prayer_requests_dup_idx
  on public.prayer_requests (anonymous_session_hash, body_normalized, created_at desc);

comment on table public.prayer_requests is
  'Iglesias Prayer Wall requests. Public reads are column-bounded and row-filtered. Contact and AI fields are never public.';
comment on column public.prayer_requests.contact_email is
  'PRIVATE. Never grant to anon/authenticated. BUILD 02 stores only; BUILD 03 routes private prayer.';
comment on column public.prayer_requests.anonymous_session_hash is
  'Hashed anonymous ownership token. Never returned by public APIs.';
comment on column public.prayer_requests.ip_hash is
  'Hashed request IP for abuse control. Never returned publicly.';

alter table public.prayer_requests enable row level security;

revoke all on table public.prayer_requests from anon, authenticated;
grant select (
  id,
  visibility,
  language,
  city,
  category,
  display_name,
  body,
  status,
  created_at,
  updated_at,
  published_at
) on table public.prayer_requests to anon, authenticated;

drop policy if exists prayer_requests_select_public on public.prayer_requests;
create policy prayer_requests_select_public
  on public.prayer_requests
  for select
  using (
    visibility in ('PUBLIC_NAMED', 'PUBLIC_ANONYMOUS')
    and moderation_status = 'CLEARLY_SAFE'
    and status in ('OPEN', 'STILL_NEEDS_PRAYER', 'UPDATE_POSTED', 'ANSWERED_OR_GRATITUDE')
    and published_at is not null
  );

-- ---------------------------------------------------------------------------
-- prayer_acknowledgements — not listing likes
-- ---------------------------------------------------------------------------
create table if not exists public.prayer_acknowledgements (
  id uuid primary key default gen_random_uuid(),
  prayer_request_id uuid not null references public.prayer_requests(id) on delete cascade,
  submitter_user_id uuid null,
  anonymous_session_hash text null,
  created_at timestamptz not null default now(),
  constraint prayer_ack_identity check (
    submitter_user_id is not null or length(coalesce(anonymous_session_hash, '')) > 0
  )
);

create unique index if not exists prayer_ack_user_uidx
  on public.prayer_acknowledgements (prayer_request_id, submitter_user_id)
  where submitter_user_id is not null;
create unique index if not exists prayer_ack_anon_uidx
  on public.prayer_acknowledgements (prayer_request_id, anonymous_session_hash)
  where anonymous_session_hash is not null;
create index if not exists prayer_ack_prayer_idx
  on public.prayer_acknowledgements (prayer_request_id);

comment on table public.prayer_acknowledgements is
  'Iglesias “Estoy orando” acknowledgements. Public APIs return counts only, never who prayed.';

alter table public.prayer_acknowledgements enable row level security;
revoke all on table public.prayer_acknowledgements from anon, authenticated;

-- ---------------------------------------------------------------------------
-- prayer_updates — do not overwrite original body
-- ---------------------------------------------------------------------------
create table if not exists public.prayer_updates (
  id uuid primary key default gen_random_uuid(),
  prayer_request_id uuid not null references public.prayer_requests(id) on delete cascade,
  kind text not null
    check (kind in ('STILL_NEEDS_PRAYER', 'UPDATE', 'GRATITUDE', 'CLOSE')),
  body text null,
  created_at timestamptz not null default now()
);

create index if not exists prayer_updates_prayer_idx
  on public.prayer_updates (prayer_request_id, created_at desc);

comment on table public.prayer_updates is
  'Requester updates and close/gratitude notes. Original prayer body stays on prayer_requests.';

alter table public.prayer_updates enable row level security;
revoke all on table public.prayer_updates from anon, authenticated;

-- Public-safe updates for published public prayers only (body + kind + time).
grant select (id, prayer_request_id, kind, body, created_at)
  on table public.prayer_updates to anon, authenticated;

drop policy if exists prayer_updates_select_public on public.prayer_updates;
create policy prayer_updates_select_public
  on public.prayer_updates
  for select
  using (
    exists (
      select 1
      from public.prayer_requests r
      where r.id = prayer_request_id
        and r.visibility in ('PUBLIC_NAMED', 'PUBLIC_ANONYMOUS')
        and r.moderation_status = 'CLEARLY_SAFE'
        and r.status in ('OPEN', 'STILL_NEEDS_PRAYER', 'UPDATE_POSTED', 'ANSWERED_OR_GRATITUDE')
        and r.published_at is not null
    )
  );

-- ---------------------------------------------------------------------------
-- prayer_moderation_events — audit; never public
-- ---------------------------------------------------------------------------
create table if not exists public.prayer_moderation_events (
  id uuid primary key default gen_random_uuid(),
  prayer_request_id uuid not null references public.prayer_requests(id) on delete cascade,
  action text not null
    check (action in (
      'AI_CLASSIFIED',
      'APPROVE',
      'REJECT',
      'REMOVE',
      'REDACT_PII_AND_APPROVE',
      'CLOSE',
      'MARK_REVIEWED'
    )),
  moderator_user_id text null,
  reason_code text null,
  note text null,
  created_at timestamptz not null default now()
);

create index if not exists prayer_moderation_events_prayer_idx
  on public.prayer_moderation_events (prayer_request_id, created_at desc);

comment on table public.prayer_moderation_events is
  'Iglesias prayer moderation audit. Service-role / admin only. Never public.';

alter table public.prayer_moderation_events enable row level security;
revoke all on table public.prayer_moderation_events from anon, authenticated;

-- ---------------------------------------------------------------------------
-- prayer_reports — never auto-remove; never public
-- ---------------------------------------------------------------------------
create table if not exists public.prayer_reports (
  id uuid primary key default gen_random_uuid(),
  prayer_request_id uuid not null references public.prayer_requests(id) on delete cascade,
  reason text not null
    check (reason in (
      'HATE_HARASSMENT', 'THREAT', 'PRIVATE_INFORMATION', 'SPAM', 'INAPPROPRIATE', 'OTHER'
    )),
  details text null,
  reporter_user_id uuid null,
  anonymous_session_hash text null,
  created_at timestamptz not null default now()
);

create index if not exists prayer_reports_prayer_idx
  on public.prayer_reports (prayer_request_id, created_at desc);

comment on table public.prayer_reports is
  'Public prayer reports. One report does not auto-remove. Admin queue only.';

alter table public.prayer_reports enable row level security;
revoke all on table public.prayer_reports from anon, authenticated;
