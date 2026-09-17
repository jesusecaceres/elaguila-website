-- Gate BCO-6A — Explainable Business Health Map foundation.
--
-- Additive only: four new tables, no changes to any existing table/column/RPC (including the
-- eight Living Business Book tables from Gate BCO-5A, which remain the sole source of truth this
-- package reads from -- no business facts are duplicated into a second permanent profile here).
-- Every table is server-only (read/written exclusively via getAdminSupabase(), the service-role
-- client), gated by the staff capability matrix or the entrepreneur's own verified Supabase Auth
-- session -- never RLS policies. RLS is enabled with zero policies on every table (deny-all for
-- anon/authenticated), matching the businesses-family, Sales Workspace, and Living Business Book
-- precedent. Grant hardening follows the owner-proven, live-certified Gate BCO-4A.6/4A.7/5A
-- pattern exactly: REVOKE ALL FROM PUBLIC, then an explicit GRANT SELECT, INSERT, UPDATE, DELETE
-- to service_role only -- never GRANT ALL PRIVILEGES, never a grant to anon/authenticated/PUBLIC.
--
-- Actor attribution doctrine: every consequential row is authored by either a real, currently
-- active Leonix staff member (admin_team_members, via requireSalesWorkspaceAccess()'s verified
-- StrictSalesActor) or the real, authenticated business owner (auth.users, via their own verified
-- session) -- never a placeholder. The same actor_type + actor_roster_id + actor_auth_user_id +
-- actor_email + actor_role shape used throughout Gate BCO-5A is reused here, with a CHECK
-- constraint enforcing that actor_roster_id is present if and only if actor_type = 'staff'.
--
-- Immutability doctrine: an assessment run and its dimension results/findings are never mutated
-- once created -- a repeated assessment always produces a brand-new, independent run row, and
-- earlier runs remain permanently unchanged (the only exception is business_recommendation_
-- readiness.human_review_* columns, which record a staff follow-up flag layered on top of an
-- already-computed, unchanged readiness conclusion -- never a rewrite of the conclusion itself).
--
-- Dependency order:
--   1. public.business_health_assessment_runs
--   2. public.business_health_dimension_results  (references assessment_runs)
--   3. public.business_health_findings           (references assessment_runs, dimension_results)
--   4. public.business_recommendation_readiness   (references assessment_runs)

-- =============================================================================================
-- 1. business_health_assessment_runs -- one reproducible evaluation of a business at a point in
-- time. This package does not implement automatic scheduling; system_refresh exists in the enum
-- as a future-safe value only -- every run produced by this package is staff_requested,
-- owner_requested, or discovery_completed.
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.business_health_assessment_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,

  calculation_version text NOT NULL CHECK (char_length(btrim(calculation_version)) > 0),
  trigger_type text NOT NULL CHECK (trigger_type IN (
    'staff_requested', 'owner_requested', 'discovery_completed', 'business_record_changed', 'system_refresh'
  )),
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed')),

  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz NULL,
  source_data_cutoff_at timestamptz NULL,

  total_dimensions_assessed int NOT NULL DEFAULT 0 CHECK (total_dimensions_assessed >= 0),
  strong_count int NOT NULL DEFAULT 0 CHECK (strong_count >= 0),
  stable_count int NOT NULL DEFAULT 0 CHECK (stable_count >= 0),
  needs_attention_count int NOT NULL DEFAULT 0 CHECK (needs_attention_count >= 0),
  insufficient_information_count int NOT NULL DEFAULT 0 CHECK (insufficient_information_count >= 0),
  contradiction_blocked_count int NOT NULL DEFAULT 0 CHECK (contradiction_blocked_count >= 0),

  summary_es text NULL CHECK (summary_es IS NULL OR char_length(summary_es) <= 4000),
  summary_en text NULL CHECK (summary_en IS NULL OR char_length(summary_en) <= 4000),

  -- Actor attribution -- a real staff roster member OR a real authenticated business owner, never
  -- a placeholder. Same dual-actor shape proven throughout Gate BCO-5A.
  created_actor_type text NOT NULL CHECK (created_actor_type IN ('staff', 'owner')),
  created_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  created_by_auth_user_id uuid NOT NULL,
  created_by_email text NOT NULL,
  created_by_role text NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_health_runs_created_actor_chk CHECK (
    (created_actor_type = 'staff' AND created_by_roster_id IS NOT NULL) OR
    (created_actor_type = 'owner' AND created_by_roster_id IS NULL)
  ),
  CONSTRAINT business_health_runs_completion_chk CHECK (
    (status = 'in_progress' AND completed_at IS NULL) OR
    (status IN ('completed', 'failed') AND completed_at IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS business_health_runs_business_id_idx ON public.business_health_assessment_runs (business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS business_health_runs_business_status_idx ON public.business_health_assessment_runs (business_id, status, created_at DESC);

ALTER TABLE public.business_health_assessment_runs ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_health_assessment_runs FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.business_health_assessment_runs TO service_role;

COMMENT ON TABLE public.business_health_assessment_runs IS
  'Gate BCO-6A -- one reproducible, immutable evaluation of a business at a point in time. Never mutated after completion; a repeated assessment always creates a brand-new run row. Reads its source data exclusively from the Gate BCO-5A Living Business Book tables -- never a duplicated business-record system.';

-- =============================================================================================
-- 2. business_health_dimension_results -- exactly one result per (assessment_run_id,
-- dimension_key). Unknown information normally produces insufficient_information, never an
-- automatic needs_attention; an unresolved material contradiction can produce
-- blocked_by_contradiction.
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.business_health_dimension_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_run_id uuid NOT NULL REFERENCES public.business_health_assessment_runs(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,

  dimension_key text NOT NULL CHECK (dimension_key IN (
    'business_foundation', 'customer_clarity', 'offer_and_value', 'operations_and_capacity',
    'visibility_and_discovery', 'communication_and_follow_up', 'owner_goals_and_sustainability'
  )),
  status text NOT NULL CHECK (status IN (
    'strong', 'stable', 'needs_attention', 'insufficient_information', 'blocked_by_contradiction'
  )),
  confidence text NOT NULL CHECK (confidence IN ('low', 'medium', 'high')),
  evidence_strength text NOT NULL DEFAULT 'none' CHECK (evidence_strength IN ('none', 'low', 'medium', 'high')),
  freshness text NOT NULL DEFAULT 'unknown' CHECK (freshness IN ('fresh', 'aging', 'stale', 'unknown')),

  supporting_fact_ids uuid[] NOT NULL DEFAULT '{}',
  supporting_evidence_ids uuid[] NOT NULL DEFAULT '{}',
  related_unknown_ids uuid[] NOT NULL DEFAULT '{}',
  related_contradiction_ids uuid[] NOT NULL DEFAULT '{}',

  explanation_es text NOT NULL CHECK (char_length(explanation_es) <= 4000),
  explanation_en text NOT NULL CHECK (char_length(explanation_en) <= 4000),
  limitations_es text NULL CHECK (limitations_es IS NULL OR char_length(limitations_es) <= 4000),
  limitations_en text NULL CHECK (limitations_en IS NULL OR char_length(limitations_en) <= 4000),

  calculated_at timestamptz NOT NULL DEFAULT now(),
  calculation_version text NOT NULL CHECK (char_length(btrim(calculation_version)) > 0),

  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_health_dim_results_one_per_run_dimension UNIQUE (assessment_run_id, dimension_key)
);

CREATE INDEX IF NOT EXISTS business_health_dim_results_business_id_idx ON public.business_health_dimension_results (business_id, dimension_key, calculated_at DESC);
CREATE INDEX IF NOT EXISTS business_health_dim_results_run_id_idx ON public.business_health_dimension_results (assessment_run_id);

ALTER TABLE public.business_health_dimension_results ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_health_dimension_results FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.business_health_dimension_results TO service_role;

COMMENT ON TABLE public.business_health_dimension_results IS
  'Gate BCO-6A -- one result per (run, dimension). Exactly one active status value; unknown information normally yields insufficient_information, never an automatic needs_attention. supporting_*_ids/related_*_ids are traceable references back into the Living Business Book -- never a restated copy of the underlying record.';

-- =============================================================================================
-- 3. business_health_findings -- a transparent statement derived from one dimension assessment.
-- A finding is never itself a recommendation.
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.business_health_findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_run_id uuid NOT NULL REFERENCES public.business_health_assessment_runs(id) ON DELETE CASCADE,
  dimension_result_id uuid NOT NULL REFERENCES public.business_health_dimension_results(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,

  finding_type text NOT NULL CHECK (finding_type IN ('strength', 'risk', 'gap', 'opportunity', 'unknown', 'contradiction')),
  severity text NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'low', 'medium', 'high')),

  title_es text NOT NULL CHECK (char_length(btrim(title_es)) > 0 AND char_length(title_es) <= 300),
  title_en text NOT NULL CHECK (char_length(btrim(title_en)) > 0 AND char_length(title_en) <= 300),
  explanation_es text NOT NULL CHECK (char_length(explanation_es) <= 4000),
  explanation_en text NOT NULL CHECK (char_length(explanation_en) <= 4000),

  supporting_fact_ids uuid[] NOT NULL DEFAULT '{}',
  supporting_evidence_ids uuid[] NOT NULL DEFAULT '{}',
  related_unknown_ids uuid[] NOT NULL DEFAULT '{}',
  related_contradiction_ids uuid[] NOT NULL DEFAULT '{}',

  confidence text NOT NULL CHECK (confidence IN ('low', 'medium', 'high')),
  visibility text NOT NULL DEFAULT 'staff_only' CHECK (visibility IN ('owner_and_staff', 'staff_only')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),

  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS business_health_findings_business_id_idx ON public.business_health_findings (business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS business_health_findings_run_id_idx ON public.business_health_findings (assessment_run_id);
CREATE INDEX IF NOT EXISTS business_health_findings_dimension_result_idx ON public.business_health_findings (dimension_result_id);
CREATE INDEX IF NOT EXISTS business_health_findings_type_idx ON public.business_health_findings (finding_type, severity);

ALTER TABLE public.business_health_findings ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_health_findings FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.business_health_findings TO service_role;

COMMENT ON TABLE public.business_health_findings IS
  'Gate BCO-6A -- a transparent, traceable statement derived from a dimension assessment. Never itself a recommendation. visibility follows the same owner_and_staff/staff_only vocabulary as business_facts; sensitivity always wins when shaping the owner-facing view.';

-- =============================================================================================
-- 4. business_recommendation_readiness -- one deterministic readiness result per assessment run.
-- Determines only whether a future recommendation MAY safely be generated -- this package does
-- not generate the recommendation itself.
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.business_recommendation_readiness (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_run_id uuid NOT NULL UNIQUE REFERENCES public.business_health_assessment_runs(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,

  readiness_status text NOT NULL CHECK (readiness_status IN (
    'ready', 'needs_more_information', 'resolve_contradictions_first', 'capacity_risk', 'human_review_required'
  )),
  reason_es text NOT NULL CHECK (char_length(reason_es) <= 2000),
  reason_en text NOT NULL CHECK (char_length(reason_en) <= 2000),

  blocking_dimension_keys text[] NOT NULL DEFAULT '{}',
  blocking_unknown_ids uuid[] NOT NULL DEFAULT '{}',
  blocking_contradiction_ids uuid[] NOT NULL DEFAULT '{}',

  -- Staff follow-up flag layered on top of the computed conclusion above -- setting this never
  -- rewrites readiness_status/reason_* as originally calculated; it only records that a human
  -- reviewed (or must review) this run's sensitive condition.
  human_review_required boolean NOT NULL DEFAULT false,
  human_review_marked_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  human_review_marked_by_auth_user_id uuid NULL,
  human_review_marked_by_email text NULL,
  human_review_marked_at timestamptz NULL,
  human_review_note text NULL CHECK (human_review_note IS NULL OR char_length(human_review_note) <= 2000),

  calculation_version text NOT NULL CHECK (char_length(btrim(calculation_version)) > 0),

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS business_recommendation_readiness_business_id_idx ON public.business_recommendation_readiness (business_id, created_at DESC);

ALTER TABLE public.business_recommendation_readiness ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_recommendation_readiness FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.business_recommendation_readiness TO service_role;

COMMENT ON TABLE public.business_recommendation_readiness IS
  'Gate BCO-6A -- deterministic gate on whether a future recommendation MAY be generated. This package never generates the recommendation itself (no Next Right Move). human_review_* columns record a staff follow-up flag layered on the computed conclusion -- never a rewrite of it.';

-- =============================================================================================
-- Feature flag -- reuses the existing business_identity_flags table (Gate BCO-1C.1) rather than
-- creating a parallel flags table, matching "prefer the smallest truthful intervention." Starts
-- disabled, same as every prior gate's flag row.
-- =============================================================================================
INSERT INTO public.business_identity_flags (flag_key, enabled, emergency_disabled, pilot_user_ids)
VALUES ('business_health_map', false, false, '{}')
ON CONFLICT (flag_key) DO NOTHING;
