-- =============================================================================================
-- Program 7 — Business Outcomes + Proactive Advisor + Contextual Assistant Foundation
-- Migration: 20260811170000_business_program7_foundation.sql
--
-- Creates 7 new tables:
--   A. business_outcomes                    (mutable)
--   B. business_outcome_evidence            (append-only)
--   C. business_outcome_reflections         (append-only)
--   D. business_advisor_signals             (mutable)
--   E. business_advisor_signal_events       (append-only)
--   F. business_assistant_threads           (mutable)
--   G. business_assistant_messages          (append-only)
--
-- Doctrine:
-- - One canonical business: public.businesses.id
-- - Never duplicate business identity, Health Map, or recommendation system
-- - Outcomes measure truthfully — no guaranteed/proven causation, no attributed revenue
-- - Advisor is NOT a second recommendation engine — it detects reviewable signals only
-- - Assistant is bounded to a specific business context — no global blank chatbot
-- - Assistant action boundary: READ, EXPLAIN, SUMMARIZE, GUIDE, DRAFT, SUGGEST only
-- - Never auto-send messages, auto-charge, auto-create sales activity, or auto-mutate state
-- - RLS enabled, zero user policies, revoke PUBLIC/anon/authenticated, narrow service_role grants
-- - Actor attribution CHECK on every human-authored table
-- - Same-business composite integrity on every cross-table relationship
-- - Append-only tables: SELECT, INSERT only for service_role
-- - Mutable tables: SELECT, INSERT, UPDATE, DELETE for service_role
-- - Feature flags default disabled
-- =============================================================================================

BEGIN;

-- =============================================================================================
-- Prerequisite: ensure UNIQUE(id, business_id) on parent tables that outcomes reference.
-- business_recommendations already has business_recommendations_id_business_id_uk (Program 5).
-- business_commitments already has business_commitments_id_business_id_uk (Program 5).
-- business_creative_jobs already has business_creative_jobs_id_business_id_uk (Program 6).
-- All are safe — id is already PK, so the UNIQUE constraint is logically redundant but
-- required for composite FK targets. Guarded with DO blocks.
-- =============================================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'business_recommendations_id_business_id_uk'
      AND conrelid = 'public.business_recommendations'::regclass
  ) THEN
    ALTER TABLE public.business_recommendations
      ADD CONSTRAINT business_recommendations_id_business_id_uk UNIQUE (id, business_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'business_commitments_id_business_id_uk'
      AND conrelid = 'public.business_commitments'::regclass
  ) THEN
    ALTER TABLE public.business_commitments
      ADD CONSTRAINT business_commitments_id_business_id_uk UNIQUE (id, business_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'business_creative_jobs_id_business_id_uk'
      AND conrelid = 'public.business_creative_jobs'::regclass
  ) THEN
    ALTER TABLE public.business_creative_jobs
      ADD CONSTRAINT business_creative_jobs_id_business_id_uk UNIQUE (id, business_id);
  END IF;
END $$;

-- =============================================================================================
-- A. business_outcomes — one truthful business outcome measurement.
-- Mutable: review status transitions, measurement updates.
-- References public.businesses(id), optionally business_recommendations, business_commitments,
-- business_creative_jobs — all with composite same-business FKs.
-- Exposes UNIQUE(id, business_id) for child composite FKs from evidence and reflections.
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.business_outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,

  recommendation_id uuid NULL REFERENCES public.business_recommendations(id) ON DELETE RESTRICT,
  commitment_id uuid NULL REFERENCES public.business_commitments(id) ON DELETE RESTRICT,
  creative_job_id uuid NULL REFERENCES public.business_creative_jobs(id) ON DELETE RESTRICT,

  metric_key text NOT NULL CHECK (char_length(btrim(metric_key)) > 0),
  metric_label_es text NOT NULL CHECK (char_length(btrim(metric_label_es)) > 0),
  metric_label_en text NOT NULL CHECK (char_length(btrim(metric_label_en)) > 0),

  baseline_value text NULL,
  baseline_unit text NULL,
  baseline_observed_at timestamptz NULL,

  measured_value text NULL,
  measured_unit text NULL,
  measurement_source text NOT NULL CHECK (measurement_source IN (
    'manual_entry', 'system_derived', 'staff_observation', 'owner_reported', 'external_source'
  )),
  measured_at timestamptz NULL,

  result text NOT NULL DEFAULT 'inconclusive' CHECK (result IN (
    'improved', 'unchanged', 'declined', 'inconclusive'
  )),
  confidence text NOT NULL DEFAULT 'insufficient_evidence' CHECK (confidence IN (
    'low', 'medium', 'high', 'insufficient_evidence'
  )),
  causation_claim text NOT NULL DEFAULT 'none' CHECK (causation_claim IN (
    'none', 'possible', 'supported'
  )),

  review_status text NOT NULL DEFAULT 'pending' CHECK (review_status IN (
    'pending', 'reviewed', 'skipped'
  )),
  next_review_at timestamptz NULL,

  created_actor_type text NOT NULL CHECK (created_actor_type IN ('staff', 'owner')),
  created_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  created_by_auth_user_id uuid NOT NULL,
  created_by_email text NOT NULL,
  created_by_role text NOT NULL,

  reviewed_actor_type text NULL CHECK (reviewed_actor_type IS NULL OR reviewed_actor_type IN ('staff', 'owner')),
  reviewed_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  reviewed_by_auth_user_id uuid NULL,
  reviewed_by_email text NULL,
  reviewed_by_role text NULL,
  reviewed_at timestamptz NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_outcomes_id_business_id_uk UNIQUE (id, business_id),

  -- Same-business recommendation FK: only enforced when recommendation_id is non-NULL.
  CONSTRAINT business_outcomes_recommendation_business_fk
    FOREIGN KEY (recommendation_id, business_id)
    REFERENCES public.business_recommendations(id, business_id)
    ON DELETE RESTRICT,

  -- Same-business commitment FK: only enforced when commitment_id is non-NULL.
  CONSTRAINT business_outcomes_commitment_business_fk
    FOREIGN KEY (commitment_id, business_id)
    REFERENCES public.business_commitments(id, business_id)
    ON DELETE RESTRICT,

  -- Same-business creative job FK: only enforced when creative_job_id is non-NULL.
  CONSTRAINT business_outcomes_creative_job_business_fk
    FOREIGN KEY (creative_job_id, business_id)
    REFERENCES public.business_creative_jobs(id, business_id)
    ON DELETE RESTRICT,

  -- Actor integrity: staff must carry roster_id; owner must NOT.
  CONSTRAINT business_outcomes_created_actor_chk CHECK (
    (created_actor_type = 'staff' AND created_by_roster_id IS NOT NULL) OR
    (created_actor_type = 'owner' AND created_by_roster_id IS NULL)
  ),

  -- Reviewed atomic: if reviewed_at is set, reviewed_actor_type and reviewed_by_auth_user_id must be set.
  CONSTRAINT business_outcomes_reviewed_atomic_chk CHECK (
    reviewed_at IS NULL OR (
      reviewed_actor_type IS NOT NULL AND
      reviewed_by_auth_user_id IS NOT NULL AND
      char_length(btrim(reviewed_by_email)) > 0 AND
      char_length(btrim(reviewed_by_role)) > 0
    )
  ),

  -- Reviewed actor roster integrity: staff must carry roster_id; owner must NOT.
  CONSTRAINT business_outcomes_reviewed_owner_no_roster_chk CHECK (
    reviewed_at IS NULL OR reviewed_actor_type != 'owner' OR reviewed_by_roster_id IS NULL
  ),
  CONSTRAINT business_outcomes_reviewed_staff_requires_roster_chk CHECK (
    reviewed_at IS NULL OR reviewed_actor_type != 'staff' OR reviewed_by_roster_id IS NOT NULL
  ),

  -- Pre-review state must NOT carry reviewed attribution.
  CONSTRAINT business_outcomes_pre_review_no_attribution_chk CHECK (
    review_status != 'pending' OR (
      reviewed_actor_type IS NULL AND
      reviewed_by_roster_id IS NULL AND
      reviewed_by_auth_user_id IS NULL AND
      reviewed_by_email IS NULL AND
      reviewed_by_role IS NULL AND
      reviewed_at IS NULL
    )
  )
);

CREATE INDEX IF NOT EXISTS business_outcomes_business_id_idx ON public.business_outcomes (business_id);
CREATE INDEX IF NOT EXISTS business_outcomes_result_idx ON public.business_outcomes (result);
CREATE INDEX IF NOT EXISTS business_outcomes_review_status_idx ON public.business_outcomes (review_status);
CREATE INDEX IF NOT EXISTS business_outcomes_recommendation_id_idx ON public.business_outcomes (recommendation_id);
CREATE INDEX IF NOT EXISTS business_outcomes_commitment_id_idx ON public.business_outcomes (commitment_id);
CREATE INDEX IF NOT EXISTS business_outcomes_creative_job_id_idx ON public.business_outcomes (creative_job_id);

ALTER TABLE public.business_outcomes ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_outcomes FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_outcomes FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_outcomes FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_outcomes FROM service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.business_outcomes TO service_role;

COMMENT ON TABLE public.business_outcomes IS
  'Program 7 — Business Outcomes. Mutable. Truthful measurement with bounded result/confidence/causation. Never guaranteed/proven. Composite same-business FKs to recommendations, commitments, creative jobs.';

-- =============================================================================================
-- B. business_outcome_evidence — append-only evidence history for outcomes.
-- Never overwrite evidence history. Composite FK (outcome_id, business_id) → business_outcomes.
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.business_outcome_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  outcome_id uuid NOT NULL,

  evidence_type text NOT NULL CHECK (evidence_type IN (
    'before_evidence', 'after_evidence', 'measurement_evidence',
    'owner_provided_evidence', 'staff_observed_evidence', 'system_derived_evidence'
  )),
  source_class text NOT NULL CHECK (source_class IN (
    'observed_fact', 'owner_provided_fact', 'staff_observation',
    'system_derived_result', 'ai_inference', 'unknown', 'contradiction'
  )),
  source_reference text NOT NULL CHECK (char_length(btrim(source_reference)) > 0),
  source_url text NULL,
  observed_at timestamptz NOT NULL,
  structured_value jsonb NULL,
  text_excerpt text NULL,
  visibility text NOT NULL CHECK (visibility IN ('owner_and_staff', 'staff_only')),
  sensitivity text NOT NULL CHECK (sensitivity IN ('standard', 'sensitive')),

  created_actor_type text NOT NULL CHECK (created_actor_type IN ('staff', 'owner')),
  created_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  created_by_auth_user_id uuid NOT NULL,
  created_by_email text NOT NULL,
  created_by_role text NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_outcome_evidence_outcome_business_fk
    FOREIGN KEY (outcome_id, business_id)
    REFERENCES public.business_outcomes(id, business_id)
    ON DELETE CASCADE,

  CONSTRAINT business_outcome_evidence_created_actor_chk CHECK (
    (created_actor_type = 'staff' AND created_by_roster_id IS NOT NULL) OR
    (created_actor_type = 'owner' AND created_by_roster_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS business_outcome_evidence_outcome_id_idx ON public.business_outcome_evidence (outcome_id);
CREATE INDEX IF NOT EXISTS business_outcome_evidence_business_id_idx ON public.business_outcome_evidence (business_id);

ALTER TABLE public.business_outcome_evidence ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_outcome_evidence FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_outcome_evidence FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_outcome_evidence FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_outcome_evidence FROM service_role;
GRANT SELECT, INSERT ON TABLE public.business_outcome_evidence TO service_role;

COMMENT ON TABLE public.business_outcome_evidence IS
  'Program 7 — Outcome evidence history. Append-only. Never overwrite evidence. Composite same-business FK to business_outcomes.';

-- =============================================================================================
-- C. business_outcome_reflections — append-only owner/staff reflections on outcomes.
-- Not a vanity journal. Owner reflection must never be silently created by staff or AI.
-- Composite FK (outcome_id, business_id) → business_outcomes.
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.business_outcome_reflections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  outcome_id uuid NOT NULL,

  actor_type text NOT NULL CHECK (actor_type IN ('staff', 'owner')),
  reflection_type text NOT NULL CHECK (reflection_type IN (
    'owner_reflection', 'staff_reflection', 'lesson_learned', 'next_adjustment'
  )),
  text text NOT NULL CHECK (char_length(btrim(text)) > 0),
  capability_transferred boolean NOT NULL DEFAULT false,

  created_actor_type text NOT NULL CHECK (created_actor_type IN ('staff', 'owner')),
  created_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  created_by_auth_user_id uuid NOT NULL,
  created_by_email text NOT NULL,
  created_by_role text NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_outcome_reflections_outcome_business_fk
    FOREIGN KEY (outcome_id, business_id)
    REFERENCES public.business_outcomes(id, business_id)
    ON DELETE CASCADE,

  -- Actor integrity: staff must carry roster_id; owner must NOT.
  CONSTRAINT business_outcome_reflections_created_actor_chk CHECK (
    (created_actor_type = 'staff' AND created_by_roster_id IS NOT NULL) OR
    (created_actor_type = 'owner' AND created_by_roster_id IS NULL)
  ),

  -- Owner reflection must be created by an owner actor, never by staff.
  CONSTRAINT business_outcome_reflections_owner_reflection_owner_only_chk CHECK (
    reflection_type != 'owner_reflection' OR created_actor_type = 'owner'
  )
);

CREATE INDEX IF NOT EXISTS business_outcome_reflections_outcome_id_idx ON public.business_outcome_reflections (outcome_id);
CREATE INDEX IF NOT EXISTS business_outcome_reflections_business_id_idx ON public.business_outcome_reflections (business_id);

ALTER TABLE public.business_outcome_reflections ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_outcome_reflections FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_outcome_reflections FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_outcome_reflections FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_outcome_reflections FROM service_role;
GRANT SELECT, INSERT ON TABLE public.business_outcome_reflections TO service_role;

COMMENT ON TABLE public.business_outcome_reflections IS
  'Program 7 — Outcome reflections. Append-only. Owner reflection never silently created by staff or AI. Composite same-business FK to business_outcomes.';

-- =============================================================================================
-- D. business_advisor_signals — proactive advisor signals (mutable).
-- Signals are deterministic, reviewable items — NOT recommendations, NOT auto-actions.
-- Exposes UNIQUE(id, business_id) for composite FK from events.
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.business_advisor_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,

  signal_type text NOT NULL CHECK (signal_type IN (
    'COMMITMENT_DUE', 'COMMITMENT_BLOCKED', 'POSTPONED_RECOMMENDATION_REVIEW_DUE',
    'CREATIVE_AWAITING_REVIEW', 'PROPOSAL_AWAITING_OWNER',
    'UNRESOLVED_CONTRADICTION', 'STALE_CRITICAL_TRUTH',
    'OUTCOME_REVIEW_DUE', 'CAPACITY_STRETCHED'
  )),
  severity text NOT NULL CHECK (severity IN (
    'information', 'opportunity', 'priority', 'blocked'
  )),
  status text NOT NULL DEFAULT 'active' CHECK (status IN (
    'active', 'acknowledged', 'resolved', 'expired', 'dismissed'
  )),
  source_type text NOT NULL CHECK (source_type IN (
    'commitment', 'recommendation', 'creative_job', 'proposal',
    'contradiction', 'fact', 'outcome', 'capacity'
  )),
  source_reference_id uuid NULL,

  title_es text NOT NULL CHECK (char_length(btrim(title_es)) > 0),
  title_en text NOT NULL CHECK (char_length(btrim(title_en)) > 0),
  explanation_es text NOT NULL,
  explanation_en text NOT NULL,

  detected_at timestamptz NOT NULL DEFAULT now(),
  acknowledged_at timestamptz NULL,
  resolved_at timestamptz NULL,
  expires_at timestamptz NULL,

  created_actor_type text NOT NULL CHECK (created_actor_type IN ('staff', 'owner', 'system')),
  created_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  created_by_auth_user_id uuid NULL,
  created_by_email text NULL,
  created_by_role text NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_advisor_signals_id_business_id_uk UNIQUE (id, business_id),

  -- Actor integrity: staff must carry roster_id and auth_user_id; owner must NOT carry roster_id;
  -- system has no human actor.
  CONSTRAINT business_advisor_signals_created_actor_chk CHECK (
    (created_actor_type = 'staff' AND created_by_roster_id IS NOT NULL AND created_by_auth_user_id IS NOT NULL) OR
    (created_actor_type = 'owner' AND created_by_roster_id IS NULL AND created_by_auth_user_id IS NOT NULL) OR
    (created_actor_type = 'system' AND created_by_roster_id IS NULL AND created_by_auth_user_id IS NULL AND char_length(btrim(created_by_role)) > 0)
  ),

  -- Acknowledged requires acknowledged_at.
  CONSTRAINT business_advisor_signals_acknowledged_at_chk CHECK (
    status != 'acknowledged' OR acknowledged_at IS NOT NULL
  ),
  -- Resolved requires resolved_at.
  CONSTRAINT business_advisor_signals_resolved_at_chk CHECK (
    status != 'resolved' OR resolved_at IS NOT NULL
  ),
  -- Active must NOT carry acknowledged_at or resolved_at.
  CONSTRAINT business_advisor_signals_active_no_decision_chk CHECK (
    status != 'active' OR (acknowledged_at IS NULL AND resolved_at IS NULL)
  ),
  -- Acknowledged must NOT carry resolved_at.
  CONSTRAINT business_advisor_signals_acknowledged_no_resolved_chk CHECK (
    status != 'acknowledged' OR resolved_at IS NULL
  )
);

CREATE INDEX IF NOT EXISTS business_advisor_signals_business_id_idx ON public.business_advisor_signals (business_id);
CREATE INDEX IF NOT EXISTS business_advisor_signals_status_idx ON public.business_advisor_signals (status);
CREATE INDEX IF NOT EXISTS business_advisor_signals_signal_type_idx ON public.business_advisor_signals (signal_type);

ALTER TABLE public.business_advisor_signals ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_advisor_signals FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_advisor_signals FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_advisor_signals FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_advisor_signals FROM service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.business_advisor_signals TO service_role;

COMMENT ON TABLE public.business_advisor_signals IS
  'Program 7 — Proactive Advisor signals. Mutable. Deterministic, reviewable items — NOT recommendations. Never auto-acts, auto-sends, or auto-charges. Composite same-business FK for events.';

-- =============================================================================================
-- E. business_advisor_signal_events — append-only event history for advisor signals.
-- Composite FK (signal_id, business_id) → business_advisor_signals.
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.business_advisor_signal_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  signal_id uuid NOT NULL,

  event_type text NOT NULL CHECK (event_type IN (
    'detected', 'acknowledged', 'resolved', 'expired', 'dismissed', 're_detected'
  )),

  event_actor_type text NOT NULL CHECK (event_actor_type IN ('staff', 'owner', 'system')),
  event_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  event_by_auth_user_id uuid NULL,
  event_by_email text NULL,
  event_by_role text NOT NULL,
  event_note text NULL,

  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_advisor_signal_events_signal_business_fk
    FOREIGN KEY (signal_id, business_id)
    REFERENCES public.business_advisor_signals(id, business_id)
    ON DELETE CASCADE,

  -- Actor integrity: staff must carry roster_id and auth_user_id; owner must NOT carry roster_id;
  -- system has no human actor.
  CONSTRAINT business_advisor_signal_events_actor_chk CHECK (
    (event_actor_type = 'staff' AND event_by_roster_id IS NOT NULL AND event_by_auth_user_id IS NOT NULL) OR
    (event_actor_type = 'owner' AND event_by_roster_id IS NULL AND event_by_auth_user_id IS NOT NULL) OR
    (event_actor_type = 'system' AND event_by_roster_id IS NULL AND event_by_auth_user_id IS NULL AND char_length(btrim(event_by_role)) > 0)
  )
);

CREATE INDEX IF NOT EXISTS business_advisor_signal_events_signal_id_idx ON public.business_advisor_signal_events (signal_id);
CREATE INDEX IF NOT EXISTS business_advisor_signal_events_business_id_idx ON public.business_advisor_signal_events (business_id);

ALTER TABLE public.business_advisor_signal_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_advisor_signal_events FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_advisor_signal_events FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_advisor_signal_events FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_advisor_signal_events FROM service_role;
GRANT SELECT, INSERT ON TABLE public.business_advisor_signal_events TO service_role;

COMMENT ON TABLE public.business_advisor_signal_events IS
  'Program 7 — Advisor signal event history. Append-only. Composite same-business FK to business_advisor_signals.';

-- =============================================================================================
-- F. business_assistant_threads — contextual Business Concierge assistant threads (mutable).
-- Always scoped to a specific business. Never a global blank chatbot.
-- Exposes UNIQUE(id, business_id) for composite FK from messages.
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.business_assistant_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,

  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  title_es text NULL,
  title_en text NULL,
  primary_context_type text NOT NULL CHECK (primary_context_type IN (
    'living_book', 'health_map', 'stewardship', 'ai_research',
    'meeting_studio', 'proposals', 'promise_keeper', 'creative_studio',
    'outcomes', 'advisor', 'general'
  )),
  last_message_at timestamptz NULL,

  created_actor_type text NOT NULL CHECK (created_actor_type IN ('staff', 'owner')),
  created_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  created_by_auth_user_id uuid NOT NULL,
  created_by_email text NOT NULL,
  created_by_role text NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_assistant_threads_id_business_id_uk UNIQUE (id, business_id),

  -- Actor integrity: staff must carry roster_id; owner must NOT.
  CONSTRAINT business_assistant_threads_created_actor_chk CHECK (
    (created_actor_type = 'staff' AND created_by_roster_id IS NOT NULL) OR
    (created_actor_type = 'owner' AND created_by_roster_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS business_assistant_threads_business_id_idx ON public.business_assistant_threads (business_id);
CREATE INDEX IF NOT EXISTS business_assistant_threads_status_idx ON public.business_assistant_threads (status);

ALTER TABLE public.business_assistant_threads ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_assistant_threads FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_assistant_threads FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_assistant_threads FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_assistant_threads FROM service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.business_assistant_threads TO service_role;

COMMENT ON TABLE public.business_assistant_threads IS
  'Program 7 — Contextual Business Concierge assistant threads. Mutable (status only). Always scoped to a specific business. Never a global blank chatbot. Composite same-business FK for messages.';

-- =============================================================================================
-- G. business_assistant_messages — append-only message history for assistant threads.
-- Composite FK (thread_id, business_id) → business_assistant_threads.
-- AI messages are always draft/suggestion — never written directly to business_facts.
-- Action boundary enforced: READ, EXPLAIN, SUMMARIZE, GUIDE, DRAFT, SUGGEST only.
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.business_assistant_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  thread_id uuid NOT NULL,

  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL CHECK (char_length(btrim(content)) > 0),
  context_type text NOT NULL CHECK (context_type IN (
    'living_book', 'health_map', 'stewardship', 'ai_research',
    'meeting_studio', 'proposals', 'promise_keeper', 'creative_studio',
    'outcomes', 'advisor', 'general'
  )),
  action_boundary text NULL CHECK (action_boundary IS NULL OR action_boundary IN (
    'READ', 'EXPLAIN', 'SUMMARIZE', 'GUIDE', 'DRAFT', 'SUGGEST'
  )),
  visibility text NOT NULL CHECK (visibility IN ('owner_and_staff', 'staff_only')),
  source_reference_id uuid NULL,

  created_actor_type text NOT NULL CHECK (created_actor_type IN ('staff', 'owner', 'system')),
  created_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  created_by_auth_user_id uuid NULL,
  created_by_email text NULL,
  created_by_role text NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_assistant_messages_thread_business_fk
    FOREIGN KEY (thread_id, business_id)
    REFERENCES public.business_assistant_threads(id, business_id)
    ON DELETE CASCADE,

  -- Actor integrity: staff must carry roster_id and auth_user_id; owner must NOT carry roster_id;
  -- system has no human actor.
  CONSTRAINT business_assistant_messages_created_actor_chk CHECK (
    (created_actor_type = 'staff' AND created_by_roster_id IS NOT NULL AND created_by_auth_user_id IS NOT NULL) OR
    (created_actor_type = 'owner' AND created_by_roster_id IS NULL AND created_by_auth_user_id IS NOT NULL) OR
    (created_actor_type = 'system' AND created_by_roster_id IS NULL AND created_by_auth_user_id IS NULL AND char_length(btrim(created_by_role)) > 0)
  )
);

CREATE INDEX IF NOT EXISTS business_assistant_messages_thread_id_idx ON public.business_assistant_messages (thread_id);
CREATE INDEX IF NOT EXISTS business_assistant_messages_business_id_idx ON public.business_assistant_messages (business_id);

ALTER TABLE public.business_assistant_messages ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_assistant_messages FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_assistant_messages FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_assistant_messages FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_assistant_messages FROM service_role;
GRANT SELECT, INSERT ON TABLE public.business_assistant_messages TO service_role;

COMMENT ON TABLE public.business_assistant_messages IS
  'Program 7 — Assistant message history. Append-only. AI output is always draft/suggestion. Action boundary: READ, EXPLAIN, SUMMARIZE, GUIDE, DRAFT, SUGGEST only. Composite same-business FK to threads.';

-- =============================================================================================
-- Feature flags — reuses the existing business_identity_flags table.
-- All four default disabled, same as every prior gate's flag row.
-- =============================================================================================
INSERT INTO public.business_identity_flags (flag_key, enabled, emergency_disabled, pilot_user_ids)
VALUES
  ('business_outcomes', false, false, '{}'),
  ('business_proactive_advisor', false, false, '{}'),
  ('business_contextual_assistant', false, false, '{}'),
  ('business_staff_field_pwa', false, false, '{}')
ON CONFLICT (flag_key) DO NOTHING;

COMMIT;
