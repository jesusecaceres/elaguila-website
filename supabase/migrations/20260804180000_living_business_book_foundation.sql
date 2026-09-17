-- Gate BCO-5A — Living Business Book + Discovery foundation.
--
-- Additive only: eight new tables, no changes to any existing table/column/RPC. Every table is
-- server-only (read/written exclusively via getAdminSupabase(), the service-role client), gated
-- by the staff capability matrix (app/admin/_lib/salesWorkspaceCapabilities.ts) or the
-- entrepreneur's own verified Supabase Auth session for owner-facing reads/writes — never RLS
-- policies. RLS is enabled with zero policies on every table (deny-all for anon/authenticated),
-- matching the businesses-family and Sales Workspace precedent. Grant hardening follows the
-- owner-proven, live-certified Gate BCO-4A.6/4A.7 pattern exactly: REVOKE ALL FROM PUBLIC, then an
-- explicit GRANT SELECT, INSERT, UPDATE, DELETE to service_role only — never GRANT ALL PRIVILEGES,
-- never a grant to anon/authenticated/PUBLIC.
--
-- Actor attribution doctrine: every consequential row is authored by either a real, currently
-- active Leonix staff member (admin_team_members, via requireSalesWorkspaceAccess()'s verified
-- StrictSalesActor) or the real, authenticated business owner (auth.users, via their own verified
-- session) — never a placeholder. A shared `actor_type` + `actor_roster_id` + `actor_auth_user_id`
-- + `actor_email` + `actor_role` shape is reused across every table below (matching the exact
-- attribution columns already proven in business_sales_notes/business_follow_ups), with a CHECK
-- constraint enforcing that actor_roster_id is present if and only if actor_type = 'staff'.
--
-- History doctrine: business_facts rows are never overwritten in place when their canonical value
-- changes. The old row's status becomes 'superseded', a new row is inserted with
-- supersedes_fact_id pointing at it, and a partial unique index guarantees at most one 'active'
-- row per (business_id, fact_key) — the same "replace, don't mutate" pattern already proven by
-- business_follow_ups_one_current_per_business.
--
-- Dependency order:
--   1. public.business_facts
--   2. public.business_evidence           (references business_facts)
--   3. public.business_unknowns           (references business_facts)
--   4. public.business_contradictions     (references business_facts)
--   5. public.business_corrections        (references business_facts)
--   6. public.business_discovery_sessions
--   7. public.business_discovery_answers  (references business_discovery_sessions, business_facts, business_unknowns)
--   8. public.business_book_audit_log

-- =============================================================================================
-- 1. business_facts — a specific, versioned claim about a business. "Fact" here means "a claim
-- Leonix is tracking," not "verified truth" — confirmation_state and source_class carry that
-- distinction explicitly, so the UI never has to infer it.
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.business_facts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,

  fact_key text NOT NULL CHECK (char_length(btrim(fact_key)) > 0),
  fact_category text NOT NULL CHECK (fact_category IN (
    'business_and_owner_goals', 'customers_and_market', 'products_and_services',
    'operations_and_capacity', 'visibility_and_communication', 'challenges_and_readiness', 'other'
  )),

  -- Structured value (what the app reads/compares) + an optional human-readable display string
  -- (what the UI shows without having to re-derive formatting from the structured value).
  value jsonb NOT NULL,
  display_value text NULL,

  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'superseded', 'rejected')),
  source_class text NOT NULL CHECK (source_class IN (
    'owner_confirmed', 'owner_statement', 'staff_observation', 'public_source_observation',
    'connected_account_observation', 'leonix_listing_observation', 'imported_record',
    'ai_inference', 'unknown', 'system_derived'
  )),
  confidence text NOT NULL DEFAULT 'medium' CHECK (confidence IN ('low', 'medium', 'high')),

  -- "Freshness" is deliberately NOT a stored column — it is derived at read time from
  -- last_verified_at (see deriveFactFreshness() in app/lib/business/livingBook/logic.ts), the
  -- same pattern this repo already uses for business_follow_ups' due_today/overdue derivation
  -- (deriveFollowUpDisplayStatus). A stored freshness value would itself go stale.
  effective_date date NULL,
  last_verified_at timestamptz NULL,

  visibility text NOT NULL DEFAULT 'staff_only' CHECK (visibility IN ('owner_and_staff', 'staff_only')),
  sensitivity text NOT NULL DEFAULT 'standard' CHECK (sensitivity IN ('standard', 'sensitive')),
  confirmation_state text NOT NULL DEFAULT 'unconfirmed' CHECK (confirmation_state IN (
    'unconfirmed', 'owner_confirmed', 'owner_corrected', 'owner_rejected', 'staff_confirmed'
  )),

  supersedes_fact_id uuid NULL REFERENCES public.business_facts(id),

  -- Actor attribution — a real staff roster member OR a real authenticated business owner, never
  -- a placeholder. actor_roster_id is required if and only if actor_type = 'staff'.
  created_actor_type text NOT NULL CHECK (created_actor_type IN ('staff', 'owner')),
  created_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  created_by_auth_user_id uuid NOT NULL,
  created_by_email text NOT NULL,
  created_by_role text NOT NULL,
  updated_actor_type text NOT NULL CHECK (updated_actor_type IN ('staff', 'owner')),
  updated_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  updated_by_auth_user_id uuid NOT NULL,
  updated_by_email text NOT NULL,
  updated_by_role text NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_facts_created_actor_chk CHECK (
    (created_actor_type = 'staff' AND created_by_roster_id IS NOT NULL) OR
    (created_actor_type = 'owner' AND created_by_roster_id IS NULL)
  ),
  CONSTRAINT business_facts_updated_actor_chk CHECK (
    (updated_actor_type = 'staff' AND updated_by_roster_id IS NOT NULL) OR
    (updated_actor_type = 'owner' AND updated_by_roster_id IS NULL)
  )
);

-- At most one ACTIVE fact per (business, fact_key) — the actual "current truth" invariant.
-- Superseded/rejected rows are never deleted, so the full history is always queryable.
CREATE UNIQUE INDEX IF NOT EXISTS business_facts_one_active_per_key
  ON public.business_facts (business_id, fact_key)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS business_facts_business_id_idx ON public.business_facts (business_id, fact_category);
CREATE INDEX IF NOT EXISTS business_facts_supersedes_idx ON public.business_facts (supersedes_fact_id);

ALTER TABLE public.business_facts ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_facts FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.business_facts TO service_role;

COMMENT ON TABLE public.business_facts IS
  'Gate BCO-5A — versioned business claims. Never overwritten in place; a changed value supersedes the old row (business_facts_one_active_per_key). source_class/confirmation_state keep inference, statement, and confirmed fact visibly distinct — never the same UI treatment.';

-- =============================================================================================
-- 2. business_evidence — what supports a fact (or stands alone, not yet tied to one). Never
-- stores credentials, tokens, full private messages, or unbounded raw captures.
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.business_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  related_fact_id uuid NULL REFERENCES public.business_facts(id) ON DELETE SET NULL,
  related_unknown_id uuid NULL,

  evidence_type text NOT NULL CHECK (evidence_type IN (
    'owner_statement', 'staff_note', 'public_web_page', 'social_profile', 'listing_data',
    'document', 'photo', 'other'
  )),
  source_title text NOT NULL CHECK (char_length(btrim(source_title)) > 0),
  source_url text NULL,
  captured_text text NULL CHECK (captured_text IS NULL OR char_length(captured_text) <= 4000),
  captured_at timestamptz NOT NULL DEFAULT now(),
  source_date date NULL,

  consent_state text NOT NULL DEFAULT 'not_required' CHECK (consent_state IN (
    'not_required', 'owner_provided', 'owner_declined', 'unknown'
  )),
  reliability text NOT NULL DEFAULT 'medium' CHECK (reliability IN ('low', 'medium', 'high')),
  visibility text NOT NULL DEFAULT 'staff_only' CHECK (visibility IN ('owner_and_staff', 'staff_only')),
  checksum text NULL,
  retention_state text NOT NULL DEFAULT 'active' CHECK (retention_state IN ('active', 'archived', 'deleted')),

  collected_actor_type text NOT NULL CHECK (collected_actor_type IN ('staff', 'owner')),
  collected_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  collected_by_auth_user_id uuid NOT NULL,
  collected_by_email text NOT NULL,
  collected_by_role text NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_evidence_collected_actor_chk CHECK (
    (collected_actor_type = 'staff' AND collected_by_roster_id IS NOT NULL) OR
    (collected_actor_type = 'owner' AND collected_by_roster_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS business_evidence_business_id_idx ON public.business_evidence (business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS business_evidence_related_fact_idx ON public.business_evidence (related_fact_id);

ALTER TABLE public.business_evidence ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_evidence FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.business_evidence TO service_role;

COMMENT ON TABLE public.business_evidence IS
  'Gate BCO-5A — what supports a fact. captured_text is bounded and never a full private message or credential. retention_state=deleted is a soft marker (app redacts captured_text on delete); rows are never hard-deleted, preserving the audit trail.';

-- =============================================================================================
-- 3. business_unknowns — a legitimate "we do not know this yet" state, never represented as a
-- low-confidence fact.
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.business_unknowns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,

  question_label text NOT NULL CHECK (char_length(btrim(question_label)) > 0),
  why_it_matters text NULL,
  who_can_answer text NULL,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'answered', 'not_applicable')),
  assigned_channel text NULL CHECK (assigned_channel IS NULL OR assigned_channel IN (
    'discovery_session', 'staff_followup', 'owner_dashboard'
  )),
  asked_at timestamptz NULL,
  answered_at timestamptz NULL,
  resolution text NULL,
  related_fact_id uuid NULL REFERENCES public.business_facts(id) ON DELETE SET NULL,
  visibility text NOT NULL DEFAULT 'staff_only' CHECK (visibility IN ('owner_and_staff', 'staff_only')),

  created_actor_type text NOT NULL CHECK (created_actor_type IN ('staff', 'owner')),
  created_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  created_by_auth_user_id uuid NOT NULL,
  created_by_email text NOT NULL,
  created_by_role text NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_unknowns_created_actor_chk CHECK (
    (created_actor_type = 'staff' AND created_by_roster_id IS NOT NULL) OR
    (created_actor_type = 'owner' AND created_by_roster_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS business_unknowns_business_id_idx ON public.business_unknowns (business_id, status);

ALTER TABLE public.business_unknowns ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_unknowns FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.business_unknowns TO service_role;

COMMENT ON TABLE public.business_unknowns IS
  'Gate BCO-5A — a legitimate "not known yet" state, never conflated with a low-confidence fact. Resolving one sets status/answered_at/resolution and optionally links related_fact_id to the fact it produced.';

ALTER TABLE public.business_evidence
  ADD CONSTRAINT business_evidence_related_unknown_fkey FOREIGN KEY (related_unknown_id)
  REFERENCES public.business_unknowns(id) ON DELETE SET NULL;

-- =============================================================================================
-- 4. business_contradictions — two claims that disagree, preserved side by side. Never silently
-- resolved by picking a winner without an explanation on record.
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.business_contradictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,

  contradiction_type text NOT NULL CHECK (contradiction_type IN (
    'fact_vs_fact', 'fact_vs_evidence', 'evidence_vs_evidence', 'statement_vs_public_source'
  )),
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),

  claim_a_label text NOT NULL CHECK (char_length(btrim(claim_a_label)) > 0),
  claim_a_fact_id uuid NULL REFERENCES public.business_facts(id) ON DELETE SET NULL,
  claim_a_evidence_id uuid NULL REFERENCES public.business_evidence(id) ON DELETE SET NULL,
  claim_b_label text NOT NULL CHECK (char_length(btrim(claim_b_label)) > 0),
  claim_b_fact_id uuid NULL REFERENCES public.business_facts(id) ON DELETE SET NULL,
  claim_b_evidence_id uuid NULL REFERENCES public.business_evidence(id) ON DELETE SET NULL,

  -- Set only when status='resolved' -- see business_contradictions_resolution_chk below. Never
  -- silently choosing a winner: a resolution explanation is mandatory before a contradiction can
  -- close, and the new-canonical fact (if any) is recorded explicitly rather than inferred.
  resolution text NULL,
  resolved_canonical_fact_id uuid NULL REFERENCES public.business_facts(id) ON DELETE SET NULL,
  resolved_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  resolved_by_auth_user_id uuid NULL,
  resolved_by_email text NULL,
  resolved_by_role text NULL,
  resolved_at timestamptz NULL,

  created_by_roster_id uuid NOT NULL REFERENCES public.admin_team_members(id),
  created_by_auth_user_id uuid NOT NULL,
  created_by_email text NOT NULL,
  created_by_role text NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_contradictions_resolution_chk CHECK (
    (status = 'open' AND resolved_at IS NULL) OR
    (status = 'resolved' AND resolution IS NOT NULL AND resolved_at IS NOT NULL AND resolved_by_roster_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS business_contradictions_business_id_idx ON public.business_contradictions (business_id, status);

ALTER TABLE public.business_contradictions ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_contradictions FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.business_contradictions TO service_role;

COMMENT ON TABLE public.business_contradictions IS
  'Gate BCO-5A — two disagreeing claims, preserved side by side. Resolution always requires an explanation and a real staff actor (business_contradictions_resolution_chk) -- a contradiction can never silently resolve.';

-- =============================================================================================
-- 5. business_corrections — the owner-confirmation/correction workflow. A correction never
-- directly rewrites a canonical fact; it is decided (accepted/declined) by staff, and only an
-- accepted correction supersedes the fact (application-layer, via business_facts' supersession
-- chain).
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.business_corrections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  related_fact_id uuid NULL REFERENCES public.business_facts(id) ON DELETE SET NULL,

  correction_type text NOT NULL CHECK (correction_type IN (
    'owner_confirms', 'owner_corrects', 'owner_rejects', 'staff_clarification_request'
  )),
  submitted_value jsonb NULL,
  submitted_display_value text NULL,
  explanation text NULL CHECK (explanation IS NULL OR char_length(explanation) <= 2000),

  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  decision_note text NULL CHECK (decision_note IS NULL OR char_length(decision_note) <= 2000),
  decided_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  decided_by_auth_user_id uuid NULL,
  decided_by_email text NULL,
  decided_by_role text NULL,
  decided_at timestamptz NULL,

  -- Submitted by a real staff member OR the real authenticated business owner -- never a
  -- placeholder. Same dual-actor shape as business_facts.
  submitted_actor_type text NOT NULL CHECK (submitted_actor_type IN ('staff', 'owner')),
  submitted_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  submitted_by_auth_user_id uuid NOT NULL,
  submitted_by_email text NOT NULL,
  submitted_by_role text NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_corrections_submitted_actor_chk CHECK (
    (submitted_actor_type = 'staff' AND submitted_by_roster_id IS NOT NULL) OR
    (submitted_actor_type = 'owner' AND submitted_by_roster_id IS NULL)
  ),
  CONSTRAINT business_corrections_decision_chk CHECK (
    (status = 'pending' AND decided_at IS NULL) OR
    (status IN ('accepted', 'declined') AND decided_at IS NOT NULL AND decided_by_roster_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS business_corrections_business_id_idx ON public.business_corrections (business_id, status);
CREATE INDEX IF NOT EXISTS business_corrections_related_fact_idx ON public.business_corrections (related_fact_id);

ALTER TABLE public.business_corrections ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_corrections FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.business_corrections TO service_role;

COMMENT ON TABLE public.business_corrections IS
  'Gate BCO-5A — owner confirm/correct/reject workflow, and staff clarification requests. Deciding (accepted/declined) always requires a real staff actor (business_corrections_decision_chk). Accepting a correction does not itself mutate business_facts -- the deciding staff member explicitly supersedes the fact through the normal fact-write path, preserving one auditable place where canonical values change.';

-- =============================================================================================
-- 6. business_discovery_sessions — a structured conversation (questionnaire, interview, meeting,
-- call, review, or future authorized digital discovery). No recording/transcription in this
-- package -- consent_state is a future-safe foundation only.
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.business_discovery_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,

  session_type text NOT NULL CHECK (session_type IN (
    'owner_questionnaire', 'staff_interview', 'meeting', 'phone_call', 'business_review', 'digital_discovery'
  )),
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  language text NOT NULL CHECK (language IN ('es', 'en')),
  consent_state text NOT NULL DEFAULT 'not_required' CHECK (consent_state IN (
    'not_required', 'owner_provided', 'owner_declined', 'pending'
  )),

  facilitator_actor_type text NULL CHECK (facilitator_actor_type IS NULL OR facilitator_actor_type IN ('staff', 'owner')),
  facilitator_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  facilitator_auth_user_id uuid NULL,
  facilitator_email text NULL,
  facilitator_role text NULL,

  started_at timestamptz NULL,
  completed_at timestamptz NULL,
  summary text NULL CHECK (summary IS NULL OR char_length(summary) <= 4000),
  next_unanswered_question_key text NULL,

  created_actor_type text NOT NULL CHECK (created_actor_type IN ('staff', 'owner')),
  created_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  created_by_auth_user_id uuid NOT NULL,
  created_by_email text NOT NULL,
  created_by_role text NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_discovery_sessions_facilitator_chk CHECK (
    facilitator_actor_type IS NULL OR
    (facilitator_actor_type = 'staff' AND facilitator_roster_id IS NOT NULL) OR
    (facilitator_actor_type = 'owner' AND facilitator_roster_id IS NULL)
  ),
  CONSTRAINT business_discovery_sessions_created_actor_chk CHECK (
    (created_actor_type = 'staff' AND created_by_roster_id IS NOT NULL) OR
    (created_actor_type = 'owner' AND created_by_roster_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS business_discovery_sessions_business_id_idx ON public.business_discovery_sessions (business_id, status);

ALTER TABLE public.business_discovery_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_discovery_sessions FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.business_discovery_sessions TO service_role;

COMMENT ON TABLE public.business_discovery_sessions IS
  'Gate BCO-5A — a structured discovery conversation. No recording/transcription support yet; consent_state exists as a future-safe foundation only. Progress is computed live from business_discovery_answers, never denormalized here.';

-- =============================================================================================
-- 7. business_discovery_answers — one answer within a session, optionally producing a fact or an
-- unknown. Skipped answers are preserved (skipped=true), never deleted.
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.business_discovery_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.business_discovery_sessions(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,

  question_key text NOT NULL CHECK (char_length(btrim(question_key)) > 0),
  answer_value jsonb NULL,
  answer_text text NULL CHECK (answer_text IS NULL OR char_length(answer_text) <= 4000),
  skipped boolean NOT NULL DEFAULT false,

  created_fact_id uuid NULL REFERENCES public.business_facts(id) ON DELETE SET NULL,
  created_unknown_id uuid NULL REFERENCES public.business_unknowns(id) ON DELETE SET NULL,

  actor_type text NOT NULL CHECK (actor_type IN ('staff', 'owner')),
  actor_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  actor_auth_user_id uuid NOT NULL,
  actor_email text NOT NULL,
  actor_role text NOT NULL,

  answered_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_discovery_answers_actor_chk CHECK (
    (actor_type = 'staff' AND actor_roster_id IS NOT NULL) OR
    (actor_type = 'owner' AND actor_roster_id IS NULL)
  ),
  CONSTRAINT business_discovery_answers_one_per_session_question UNIQUE (session_id, question_key)
);

CREATE INDEX IF NOT EXISTS business_discovery_answers_session_id_idx ON public.business_discovery_answers (session_id);
CREATE INDEX IF NOT EXISTS business_discovery_answers_business_id_idx ON public.business_discovery_answers (business_id);

ALTER TABLE public.business_discovery_answers ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_discovery_answers FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.business_discovery_answers TO service_role;

COMMENT ON TABLE public.business_discovery_answers IS
  'Gate BCO-5A — one answer within a discovery session. At most one answer row per (session, question) -- re-answering updates the existing row, never duplicates it. skipped=true is preserved, not deleted, so "asked but not answered" stays visible.';

-- =============================================================================================
-- 8. business_book_audit_log (Gate BCO-5A) — dedicated, attributable audit trail for every Living
-- Business Book mutation. Not business_sales_audit_log (that table's action/record_type CHECK
-- values are about Sales Workspace mutations, not facts/evidence/discovery) and not the legacy
-- admin_audit_log (confirmed, again, to have no actor column at all).
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.business_book_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL CHECK (action IN (
    'fact_created', 'fact_updated', 'fact_confirmed', 'fact_rejected', 'fact_superseded',
    'evidence_added', 'unknown_created', 'unknown_resolved',
    'contradiction_created', 'contradiction_resolved',
    'correction_requested', 'correction_accepted', 'correction_declined',
    'discovery_started', 'discovery_answer_recorded', 'discovery_completed'
  )),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  record_type text NOT NULL CHECK (record_type IN (
    'business_fact', 'business_evidence', 'business_unknown', 'business_contradiction',
    'business_correction', 'business_discovery_session', 'business_discovery_answer'
  )),
  record_id uuid NULL,

  actor_type text NOT NULL CHECK (actor_type IN ('staff', 'owner')),
  actor_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  actor_auth_user_id uuid NOT NULL,
  actor_email text NOT NULL,
  actor_role text NOT NULL,

  -- Safe, bounded metadata only (e.g. {"fact_key":"busy_season","from_status":"active"}) -- never
  -- a raw answer body, sensitive evidence text, full correction body, or any secret value.
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_book_audit_log_actor_chk CHECK (
    (actor_type = 'staff' AND actor_roster_id IS NOT NULL) OR
    (actor_type = 'owner' AND actor_roster_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS business_book_audit_log_business_id_idx ON public.business_book_audit_log (business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS business_book_audit_log_actor_idx ON public.business_book_audit_log (actor_auth_user_id, created_at DESC);

ALTER TABLE public.business_book_audit_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_book_audit_log FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.business_book_audit_log TO service_role;

COMMENT ON TABLE public.business_book_audit_log IS
  'Gate BCO-5A — attributable audit trail for every Living Business Book mutation. actor is always a real staff roster member or the real authenticated owner, never a placeholder. metadata is bounded and safe -- never a raw answer, sensitive evidence text, or secret value.';

-- =============================================================================================
-- Feature flag — reuses the existing business_identity_flags table (Gate BCO-1C.1) rather than
-- creating a parallel flags table, matching "prefer the smallest truthful intervention." Starts
-- disabled, same as every prior gate's flag row.
-- =============================================================================================
INSERT INTO public.business_identity_flags (flag_key, enabled, emergency_disabled, pilot_user_ids)
VALUES ('living_business_book', false, false, '{}')
ON CONFLICT (flag_key) DO NOTHING;
