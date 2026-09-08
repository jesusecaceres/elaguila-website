-- Recursos Intake + Partner Verification OS — Gate 1: data foundation only.
-- Adds the durable backend tables needed for the future Intake OS without touching the
-- existing public Recursos publication contract in any way: community_resources,
-- community_resource_candidate_reviews (aside from widening its disposition CHECK), the two
-- public query functions, and the promotion/verification gates all remain exactly as they are.
--
-- Every new table here is service-role only — same zero-public-policy pattern as
-- community_resource_candidate_reviews (20260819120000). No queue/cron/storage/AI code is
-- introduced by this migration; PDF storage and pg_trgm matching are explicitly deferred to
-- their own future gates per this build's authorization.

-- ---------------------------------------------------------------------------
-- 1. source_documents — one row per uploaded/discovered source-document edition.
-- ---------------------------------------------------------------------------

create table if not exists public.source_documents (
  id uuid primary key default gen_random_uuid(),

  title text not null,
  source_type text not null
    check (source_type in ('pdf', 'url')),
  source_url text,

  storage_bucket text,
  storage_path text,
  file_sha256 text,
  original_filename text,
  mime_type text,
  file_size_bytes bigint,

  supersedes_document_id uuid
    references public.source_documents (id)
    on delete set null,

  source_date date,

  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.source_documents is
  'Recursos Intake OS — durable identity for one edition of a PDF guide or a snapshotted URL. Schema only in Gate 1: no storage bucket or upload path exists yet (deferred to the PDF intake gate).';

create index if not exists source_documents_source_type_idx
  on public.source_documents (source_type);

create index if not exists source_documents_supersedes_document_id_idx
  on public.source_documents (supersedes_document_id);

create index if not exists source_documents_file_sha256_idx
  on public.source_documents (file_sha256);

create index if not exists source_documents_created_at_idx
  on public.source_documents (created_at desc);

-- ---------------------------------------------------------------------------
-- 2. resource_intake_jobs — one row per intake-processing attempt.
-- ---------------------------------------------------------------------------

create table if not exists public.resource_intake_jobs (
  id uuid primary key default gen_random_uuid(),

  source_type text not null
    check (source_type in ('pdf', 'url', 'manual', 'partner_referral')),
  source_document_id uuid
    references public.source_documents (id)
    on delete set null,

  status text not null default 'pending'
    check (status in ('pending', 'processing', 'needs_review', 'completed', 'failed', 'cancelled')),

  provider text,
  pages_processed integer not null default 0,
  candidates_created_count integer not null default 0,
  matches_found_count integer not null default 0,

  raw_result_storage_path text,
  error_message text,

  created_by text,
  started_at timestamptz,
  completed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.resource_intake_jobs is
  'Recursos Intake OS — one row per intake attempt (pdf/url/manual/partner_referral). No queue/cron infra: jobs run inline in a serverless function and are tracked here, same shape as oferta_local_scan_jobs.';

create index if not exists resource_intake_jobs_status_idx
  on public.resource_intake_jobs (status);

create index if not exists resource_intake_jobs_source_document_id_idx
  on public.resource_intake_jobs (source_document_id);

create index if not exists resource_intake_jobs_created_at_idx
  on public.resource_intake_jobs (created_at desc);

-- ---------------------------------------------------------------------------
-- 3. resource_change_proposals — field-level OLD -> NEW review queue.
-- ---------------------------------------------------------------------------

create table if not exists public.resource_change_proposals (
  id uuid primary key default gen_random_uuid(),

  resource_id uuid not null
    references public.community_resources (id)
    on delete restrict,
  source_intake_job_id uuid
    references public.resource_intake_jobs (id)
    on delete set null,

  field_name text not null,
  old_value jsonb,
  proposed_value jsonb,

  proposal_source text not null
    check (proposal_source in ('pdf_reextraction', 'url_recheck', 'partner_request', 'manual')),

  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected', 'needs_more_research')),

  reviewed_by text,
  reviewed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.resource_change_proposals is
  'Recursos Intake OS — one row per proposed field change on an existing resource. No DB trigger ever writes community_resources from this table: every accept is an explicit admin-approved app-layer write. resource_id is ON DELETE RESTRICT so a resource cannot be removed out from under its change history.';

create index if not exists resource_change_proposals_resource_id_idx
  on public.resource_change_proposals (resource_id);

create index if not exists resource_change_proposals_status_idx
  on public.resource_change_proposals (status);

create index if not exists resource_change_proposals_source_intake_job_id_idx
  on public.resource_change_proposals (source_intake_job_id);

-- ---------------------------------------------------------------------------
-- 4. partner_update_requests — V1 is admin-entered only; no public policy.
-- ---------------------------------------------------------------------------

create table if not exists public.partner_update_requests (
  id uuid primary key default gen_random_uuid(),

  resource_id uuid
    references public.community_resources (id)
    on delete set null,

  organization_name text,
  submitted_contact_name text,
  submitted_contact_email text,

  request_type text not null,
  requested_changes jsonb not null default '{}'::jsonb,
  source_notes text,

  status text not null default 'pending'
    check (status in ('pending', 'reviewing', 'resolved', 'rejected')),

  created_by text,
  reviewed_by text,
  reviewed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.partner_update_requests is
  'Recursos Intake OS — V1 is admin-entered only (staff logs what a partner reported by phone/email). No public INSERT policy exists in this migration. submitted_contact_name/email is treated as internal PII, never exposed publicly.';

create index if not exists partner_update_requests_resource_id_idx
  on public.partner_update_requests (resource_id);

create index if not exists partner_update_requests_status_idx
  on public.partner_update_requests (status);

-- ---------------------------------------------------------------------------
-- 5. verification_events — append-only Recursos-domain verification history.
-- ---------------------------------------------------------------------------

create table if not exists public.verification_events (
  id uuid primary key default gen_random_uuid(),

  candidate_id text,
  resource_id uuid
    references public.community_resources (id)
    on delete set null,
  source_intake_job_id uuid
    references public.resource_intake_jobs (id)
    on delete set null,

  event_type text not null
    check (event_type in (
      'candidate_created', 'ai_proposal_generated', 'evidence_recorded',
      'field_accepted', 'field_rejected', 'promoted', 'dropped', 'reverified'
    )),

  actor_email text,
  source_url text,
  source_type text,

  fields_confirmed jsonb,
  previous_value jsonb,
  accepted_value jsonb,

  notes text,

  created_at timestamptz not null default now()
);

comment on table public.verification_events is
  'Recursos Intake OS — append-only history log. No updated_at by design: rows are never modified after insert. candidate_id is free text (mirrors community_resource_candidate_reviews.candidate_id) since candidates are not a DB table.';

create index if not exists verification_events_candidate_id_idx
  on public.verification_events (candidate_id);

create index if not exists verification_events_resource_id_idx
  on public.verification_events (resource_id);

create index if not exists verification_events_created_at_idx
  on public.verification_events (created_at desc);

-- ---------------------------------------------------------------------------
-- 6. Widen community_resource_candidate_reviews.disposition to add 'researching'.
-- ---------------------------------------------------------------------------
-- Every existing disposition value (pending, ready_for_promotion, promoted, dropped) is
-- preserved unchanged; 'researching' is additive only. No existing candidate review rows
-- are rewritten by this migration.

alter table public.community_resource_candidate_reviews
  drop constraint if exists community_resource_candidate_reviews_disposition_check;

alter table public.community_resource_candidate_reviews
  add constraint community_resource_candidate_reviews_disposition_check
  check (disposition in ('pending', 'researching', 'ready_for_promotion', 'promoted', 'dropped'));

-- ---------------------------------------------------------------------------
-- RLS — service_role only. Zero public policies on any of the five new tables.
-- ---------------------------------------------------------------------------

alter table public.source_documents enable row level security;
alter table public.resource_intake_jobs enable row level security;
alter table public.resource_change_proposals enable row level security;
alter table public.partner_update_requests enable row level security;
alter table public.verification_events enable row level security;

-- No policies are created for anon/authenticated on any of the five tables above — this is
-- intentional and mirrors community_resource_candidate_reviews' own zero-policy pattern.
-- Access is service-role only, which bypasses RLS by role privilege but still requires the
-- explicit GRANTs below (RLS bypass and table-level GRANT are independent — the exact gap
-- that blocked the Certification launch's community_resources reads before it was fixed).

-- ---------------------------------------------------------------------------
-- Explicit service_role grants — minimum privileges each table's app usage actually needs.
-- verification_events is intentionally SELECT/INSERT only (no UPDATE/DELETE): append-only
-- is enforced at the grant level here, not just by app-code convention.
-- ---------------------------------------------------------------------------

grant select, insert, update on public.source_documents to service_role;
grant select, insert, update on public.resource_intake_jobs to service_role;
grant select, insert, update on public.resource_change_proposals to service_role;
grant select, insert, update on public.partner_update_requests to service_role;
grant select, insert on public.verification_events to service_role;
