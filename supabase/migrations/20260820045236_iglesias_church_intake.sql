-- Iglesias BUILD 04 — church intake audit metadata (service-role only).
-- Does not change churches.approval_status enum (pending | approved | rejected).

alter table public.church_submissions
  add column if not exists intake_decision text null
    check (intake_decision in ('AUTO_PUBLISH', 'HUMAN_REVIEW', 'BLOCK')),
  add column if not exists intake_confidence numeric null,
  add column if not exists identity_confidence numeric null,
  add column if not exists safety_confidence numeric null,
  add column if not exists intake_reasons text[] not null default '{}'::text[],
  add column if not exists intake_risk_signals text[] not null default '{}'::text[],
  add column if not exists intake_attention_fields text[] not null default '{}'::text[],
  add column if not exists intake_source text null,
  add column if not exists intake_decided_at timestamptz null;

comment on column public.church_submissions.intake_decision is
  'AUTO_PUBLISH | HUMAN_REVIEW | BLOCK. Admin/service-role only. Never exposed on public church APIs.';

alter table public.church_submissions enable row level security;
revoke all on table public.church_submissions from anon, authenticated;
