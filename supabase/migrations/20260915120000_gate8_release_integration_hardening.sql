-- Client Discovery & Project Blueprint Engine, Gate 8 — release integration hardening.
-- Purely additive: a narrow set of nullable columns on the EXISTING business_project_blueprints
-- table. No table dropped, no column removed, no existing row's meaning changed.
--
-- Closes two disclosed Gate 7 simplifications (MD <staleness_decision>, <client_confirmation_precision>):
--
--   1. staleExplicitlyAcknowledged was previously ALWAYS true in releaseReadinessAssembler.ts — no
--      real acknowledgement existed. This adds a persisted single-value acknowledgement record
--      (mirrors the released_at/released_by_* and handoff_completed_at/handoff_completed_by_*
--      actor-quad pattern already established in the Gate 7 migration on this same table): who
--      acknowledged, when, a note, and — critically — WHICH input fingerprint was acknowledged, so
--      the acknowledgement is only valid for that exact truth state. If discovery truth changes
--      again after the acknowledgement, the newly-recomputed current fingerprint will no longer
--      match stale_acknowledged_fingerprint and the blueprint is stale-and-unacknowledged again,
--      requiring a fresh acknowledgement or a new blueprint version. Never auto-invalidates the
--      APPROVED status itself — only affects the release-readiness gate.
--
--   2. requiresClientConfirmation was previously a hardcoded `true` literal in
--      releaseReadinessAssembler.ts, with "complete" inferred from the mere ABSENCE of open
--      change-request/needs-clarification feedback — not affirmative evidence. This adds one
--      explicit persisted boolean so the requirement itself is real, persisted truth rather than a
--      hardcoded literal; defaults to true, preserving Gate 7's original conservative behavior.
--      "Complete" now requires an actual affirmative business_project_blueprint_feedback row
--      (feedback_type = 'approved', client_approved = true, field_key IS NULL — a whole-blueprint
--      approval, not a per-field note) referencing this exact blueprint — reusing the existing
--      feedback table rather than adding a second one, per this gate's own reuse doctrine.
--
-- No CREATE POLICY anywhere (deny-all + explicit service_role grant only, matching every prior
-- migration in this domain).

ALTER TABLE public.business_project_blueprints
  ADD COLUMN IF NOT EXISTS client_confirmation_required boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS stale_acknowledged_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS stale_acknowledged_fingerprint text NULL,
  ADD COLUMN IF NOT EXISTS stale_acknowledged_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  ADD COLUMN IF NOT EXISTS stale_acknowledged_by_auth_user_id uuid NULL,
  ADD COLUMN IF NOT EXISTS stale_acknowledged_by_email text NULL,
  ADD COLUMN IF NOT EXISTS stale_acknowledged_by_role text NULL,
  ADD COLUMN IF NOT EXISTS stale_acknowledgement_note text NULL;

COMMENT ON COLUMN public.business_project_blueprints.client_confirmation_required IS
  'Gate 8 — explicit persisted truth (default true) consumed by releaseReadinessAssembler.ts; replaces a hardcoded literal.';
COMMENT ON COLUMN public.business_project_blueprints.stale_acknowledged_fingerprint IS
  'Gate 8 — the input_fingerprint value that was current at acknowledgement time; only valid while the live-recomputed fingerprint still matches it.';
