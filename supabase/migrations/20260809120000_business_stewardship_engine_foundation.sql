-- Gate BCO-TODAY-3 — Next Right Move + Stewardship Engine foundation.
--
-- Additive only: four new tables, no changes to any existing table/column/RPC. This package reads
-- its diagnosis input exclusively from the existing, immutable Gate BCO-6A Business Health Map
-- (business_health_assessment_runs/dimension_results/findings/business_recommendation_readiness)
-- and the existing Gate BCO-5A Living Business Book (facts/evidence/unknowns/contradictions) --
-- it never duplicates a business fact, a health assessment, or a learning record into a second
-- copy. The deterministic recommendation TEMPLATE registry (candidate interventions, bilingual
-- explanations) lives in code (app/lib/business/stewardship/recommendationRegistry.ts), matching
-- the existing ruleRegistry.ts/actionRegistry.ts convention -- only the INSTANTIATED
-- recommendation, its immutable six-test results, its override history, and the Stewardship
-- Ledger are persisted here.
--
-- Every table is server-only (read/written exclusively via getAdminSupabase(), the service-role
-- client). RLS is enabled with zero policies on every table (deny-all for anon/authenticated),
-- matching the businesses-family/Sales Workspace/Living Business Book/Health Map/Learning Center/
-- DIY Concierge precedent exactly. Privilege hardening uses the corrected TODAY-1A posture from
-- the beginning: REVOKE ALL FROM PUBLIC, anon, authenticated, AND service_role, then an explicit
-- narrow GRANT SELECT, INSERT, UPDATE, DELETE to service_role only -- never GRANT ALL PRIVILEGES,
-- never REFERENCES/TRIGGER/TRUNCATE to anyone, never a grant to anon/authenticated/PUBLIC.
--
-- Actor attribution doctrine: every consequential row is authored by either a real, currently
-- active Leonix staff member (admin_team_members, via requireSalesWorkspaceAccess()'s verified
-- StrictSalesActor) or the real, authenticated business owner (auth.users, via their own verified
-- session) -- never a placeholder. Overrides require a real manager+ staff actor exclusively.
--
-- Governing doctrine: "What is the smallest truthful intervention that can produce meaningful
-- progress?" -- never "what can Leonix sell?" Every recommendation must pass six immutable tests
-- (need, readiness, capacity, life_alignment, value, lion_code) before it may ever reach
-- 'approved' or 'shared_with_owner' -- enforced by CHECK constraints below, not just app trust.
--
-- Dependency order:
--   1. public.business_recommendations
--   2. public.business_recommendation_tests        (references business_recommendations)
--   3. public.business_recommendation_overrides    (references business_recommendations)
--   4. public.business_stewardship_ledger           (references business_recommendations, optional)

BEGIN;

-- =============================================================================================
-- 1. business_recommendations -- one instantiated Next Right Move candidate/version. Only one
-- row per business may ever have is_current = true (the partial unique index below) -- when a
-- new version supersedes an old one, the old row's is_current is cleared and its status becomes
-- 'superseded' in the same write. Never mutates the source Health Map run or readiness gate.
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.business_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,

  source_run_id uuid NOT NULL REFERENCES public.business_health_assessment_runs(id) ON DELETE RESTRICT,
  source_finding_id uuid NULL REFERENCES public.business_health_findings(id) ON DELETE SET NULL,
  candidate_key text NOT NULL CHECK (char_length(btrim(candidate_key)) > 0),
  registry_version text NOT NULL CHECK (char_length(btrim(registry_version)) > 0),
  dimension_key text NOT NULL CHECK (dimension_key IN (
    'business_foundation', 'customer_clarity', 'offer_and_value', 'operations_and_capacity',
    'visibility_and_discovery', 'communication_and_follow_up', 'owner_goals_and_sustainability'
  )),

  status text NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'review_required', 'approved', 'shared_with_owner', 'accepted', 'declined',
    'postponed', 'superseded', 'archived'
  )),
  visibility text NOT NULL DEFAULT 'staff_only' CHECK (visibility IN ('owner_and_staff', 'staff_only')),
  version int NOT NULL DEFAULT 1 CHECK (version > 0),
  is_current boolean NOT NULL DEFAULT true,

  confidence text NOT NULL CHECK (confidence IN ('low', 'medium', 'high')),

  verified_need_es text NOT NULL CHECK (char_length(verified_need_es) > 0),
  verified_need_en text NOT NULL CHECK (char_length(verified_need_en) > 0),
  readiness_explanation_es text NOT NULL,
  readiness_explanation_en text NOT NULL,
  business_consequence_es text NOT NULL,
  business_consequence_en text NOT NULL,
  owner_goal_alignment_es text NOT NULL,
  owner_goal_alignment_en text NOT NULL,
  capacity_impact_es text NOT NULL,
  capacity_impact_en text NOT NULL,

  primary_intervention text NOT NULL CHECK (primary_intervention IN (
    'free_owner_action', 'education_guided_self_service', 'small_corrective_service',
    'leonix_product_or_advertising', 'ongoing_managed_support', 'external_specialist_referral',
    'no_action_yet'
  )),
  free_option_es text NULL, free_option_en text NULL,
  guided_option_es text NULL, guided_option_en text NULL,
  corrective_service_option_es text NULL, corrective_service_option_en text NULL,
  managed_option_es text NULL, managed_option_en text NULL,
  external_referral_option_es text NULL, external_referral_option_en text NULL,
  do_nothing_yet_option_es text NULL, do_nothing_yet_option_en text NULL,

  selection_reason_es text NOT NULL,
  selection_reason_en text NOT NULL,
  rejected_higher_cost_reason_es text NULL,
  rejected_higher_cost_reason_en text NULL,

  expected_effort text NOT NULL CHECK (expected_effort IN ('minutes', 'under_1_hour', 'half_day', '1_2_days', 'ongoing')),
  cost_band text NOT NULL DEFAULT 'unknown' CHECK (cost_band IN ('free', 'under_100', '100_500', '500_plus', 'unknown')),
  success_metric_es text NOT NULL,
  success_metric_en text NOT NULL,
  review_date timestamptz NULL,

  supersedes_recommendation_id uuid NULL REFERENCES public.business_recommendations(id) ON DELETE SET NULL,

  created_actor_type text NOT NULL CHECK (created_actor_type IN ('staff', 'owner')),
  created_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  created_by_auth_user_id uuid NOT NULL,
  created_by_email text NOT NULL,
  created_by_role text NOT NULL,

  approved_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  approved_by_auth_user_id uuid NULL,
  approved_by_email text NULL,
  approved_by_role text NULL,
  approved_at timestamptz NULL,

  shared_at timestamptz NULL,

  owner_decision text NULL CHECK (owner_decision IS NULL OR owner_decision IN ('accepted', 'declined', 'postponed')),
  owner_decision_at timestamptz NULL,
  owner_decision_note text NULL CHECK (owner_decision_note IS NULL OR char_length(owner_decision_note) <= 2000),
  owner_decision_review_date timestamptz NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_recommendations_created_actor_chk CHECK (
    (created_actor_type = 'staff' AND created_by_roster_id IS NOT NULL) OR
    (created_actor_type = 'owner' AND created_by_roster_id IS NULL)
  ),
  -- REPAIR 1 (atomic approval attribution): the five approval columns must always travel
  -- together -- either every one of them is NULL (never approved / approval was cleared by a
  -- consequential override) or every one of them is a real, nonblank value. Partial attribution
  -- (e.g. an approved_at with no approver identity) is rejected in every status, including
  -- draft/review_required -- a record legitimately returned to review_required after a
  -- consequential override always has this cleared to the fully-NULL shape by the same write.
  CONSTRAINT business_recommendations_approval_atomic_chk CHECK (
    (
      approved_by_roster_id IS NULL AND approved_by_auth_user_id IS NULL AND
      approved_by_email IS NULL AND approved_by_role IS NULL AND approved_at IS NULL
    ) OR (
      approved_by_roster_id IS NOT NULL AND approved_by_auth_user_id IS NOT NULL AND
      approved_by_email IS NOT NULL AND char_length(btrim(approved_by_email)) > 0 AND
      approved_by_role IS NOT NULL AND char_length(btrim(approved_by_role)) > 0 AND
      approved_at IS NOT NULL
    )
  ),
  -- Human approval required (DB layer): approved/shared/accepted/declined/postponed states
  -- always carry the complete, real staff approval attribution shape above -- never a
  -- placeholder, never bypassed, never the NULL (unapproved) shape.
  CONSTRAINT business_recommendations_approval_chk CHECK (
    status NOT IN ('approved', 'shared_with_owner', 'accepted', 'declined', 'postponed') OR (
      approved_by_roster_id IS NOT NULL AND approved_by_auth_user_id IS NOT NULL AND
      approved_by_email IS NOT NULL AND char_length(btrim(approved_by_email)) > 0 AND
      approved_by_role IS NOT NULL AND char_length(btrim(approved_by_role)) > 0 AND
      approved_at IS NOT NULL
    )
  ),
  -- REPAIR 2 (sharing consistency): shared_with_owner/accepted/declined/postponed always carry a
  -- real shared_at; draft/review_required may never carry one; and shared_at may only ever be set
  -- alongside the complete approval attribution shape (approval can precede sharing, but sharing
  -- can never precede or exist without approval).
  CONSTRAINT business_recommendations_status_requires_shared_chk CHECK (
    status NOT IN ('shared_with_owner', 'accepted', 'declined', 'postponed') OR shared_at IS NOT NULL
  ),
  CONSTRAINT business_recommendations_no_shared_before_review_chk CHECK (
    status NOT IN ('draft', 'review_required') OR shared_at IS NULL
  ),
  CONSTRAINT business_recommendations_shared_requires_approval_chk CHECK (
    shared_at IS NULL OR (
      approved_by_roster_id IS NOT NULL AND approved_by_auth_user_id IS NOT NULL AND
      approved_by_email IS NOT NULL AND approved_by_role IS NOT NULL AND approved_at IS NOT NULL
    )
  ),
  -- REPAIR 3 (owner decision consistency): outside accepted/declined/postponed, every owner
  -- decision field -- including the note, which must never be preserved without a decision -- is
  -- fully NULL. Inside those three statuses, the decision value matches the status, a real
  -- timestamp and a real shared_at exist, and the review date is present if and only if postponed.
  CONSTRAINT business_recommendations_status_decision_null_chk CHECK (
    status IN ('accepted', 'declined', 'postponed') OR (
      owner_decision IS NULL AND owner_decision_at IS NULL AND
      owner_decision_note IS NULL AND owner_decision_review_date IS NULL
    )
  ),
  CONSTRAINT business_recommendations_owner_decision_chk CHECK (
    (owner_decision IS NULL AND owner_decision_at IS NULL) OR
    (owner_decision IS NOT NULL AND owner_decision_at IS NOT NULL AND shared_at IS NOT NULL)
  ),
  CONSTRAINT business_recommendations_owner_decision_status_chk CHECK (
    (owner_decision IS NULL) OR
    (owner_decision = 'accepted' AND status = 'accepted') OR
    (owner_decision = 'declined' AND status = 'declined') OR
    (owner_decision = 'postponed' AND status = 'postponed')
  ),
  CONSTRAINT business_recommendations_owner_decision_review_date_chk CHECK (
    (owner_decision IS DISTINCT FROM 'postponed' AND owner_decision_review_date IS NULL) OR
    (owner_decision = 'postponed' AND owner_decision_review_date IS NOT NULL)
  )
);

-- One current Next Right Move per business at any moment.
CREATE UNIQUE INDEX IF NOT EXISTS business_recommendations_one_current_per_business_idx
  ON public.business_recommendations (business_id)
  WHERE is_current = true;

CREATE INDEX IF NOT EXISTS business_recommendations_business_status_idx ON public.business_recommendations (business_id, status);
CREATE INDEX IF NOT EXISTS business_recommendations_source_run_idx ON public.business_recommendations (source_run_id);
CREATE INDEX IF NOT EXISTS business_recommendations_source_finding_idx ON public.business_recommendations (source_finding_id);
CREATE INDEX IF NOT EXISTS business_recommendations_candidate_version_idx ON public.business_recommendations (business_id, candidate_key, version);
CREATE INDEX IF NOT EXISTS business_recommendations_owner_visible_idx ON public.business_recommendations (business_id, visibility, status);
CREATE INDEX IF NOT EXISTS business_recommendations_review_date_idx ON public.business_recommendations (review_date);

ALTER TABLE public.business_recommendations ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_recommendations FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_recommendations FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_recommendations FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_recommendations FROM service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.business_recommendations TO service_role;

COMMENT ON TABLE public.business_recommendations IS
  'TODAY-3 -- one instantiated Next Right Move candidate/version. Only one is_current=true row may exist per business at any moment. Never a generative/AI-authored row; never reachable at approved/shared/accepted/declined/postponed without complete real staff approval attribution.';

-- =============================================================================================
-- 2. business_recommendation_tests -- exactly six immutable test results per recommendation
-- (need, readiness, capacity, life_alignment, value, lion_code). Never updated after creation --
-- regeneration always creates a new recommendation version and a new set of six test rows.
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.business_recommendation_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id uuid NOT NULL REFERENCES public.business_recommendations(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,

  test_key text NOT NULL CHECK (test_key IN ('need', 'readiness', 'capacity', 'life_alignment', 'value', 'lion_code')),
  result text NOT NULL CHECK (result IN ('pass', 'caution', 'fail', 'blocked')),
  explanation_es text NOT NULL,
  explanation_en text NOT NULL,
  evidence_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  confidence text NOT NULL CHECK (confidence IN ('low', 'medium', 'high')),
  rule_version text NOT NULL CHECK (char_length(btrim(rule_version)) > 0),

  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_recommendation_tests_one_per_test_key UNIQUE (recommendation_id, test_key)
);

CREATE INDEX IF NOT EXISTS business_recommendation_tests_recommendation_idx ON public.business_recommendation_tests (recommendation_id);
CREATE INDEX IF NOT EXISTS business_recommendation_tests_business_key_idx ON public.business_recommendation_tests (business_id, test_key);

ALTER TABLE public.business_recommendation_tests ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_recommendation_tests FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_recommendation_tests FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_recommendation_tests FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_recommendation_tests FROM service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.business_recommendation_tests TO service_role;

COMMENT ON TABLE public.business_recommendation_tests IS
  'TODAY-3 -- exactly six immutable six-test results per recommendation. Never updated after creation (application layer never issues an UPDATE against this table); a fail or blocked result must prevent the parent recommendation from ever reaching approved.';

-- =============================================================================================
-- 3. business_recommendation_overrides -- immutable override history. An override may only ever
-- be recorded by a real manager+ staff actor, requires a non-empty reason, and can never bypass
-- readiness, erase a failed test, fabricate evidence, or alter historical test rows.
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.business_recommendation_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id uuid NOT NULL REFERENCES public.business_recommendations(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,

  reason text NOT NULL CHECK (char_length(btrim(reason)) > 0),
  before_snapshot jsonb NOT NULL,
  after_snapshot jsonb NOT NULL,
  changed_fields text[] NOT NULL DEFAULT '{}',
  six_test_effect text NOT NULL DEFAULT 'unchanged' CHECK (six_test_effect IN ('unchanged', 'requires_reapproval', 'test_result_noted')),
  reapproval_required boolean NOT NULL DEFAULT true,

  actor_type text NOT NULL CHECK (actor_type = 'staff'),
  actor_roster_id uuid NOT NULL REFERENCES public.admin_team_members(id),
  actor_auth_user_id uuid NOT NULL,
  actor_email text NOT NULL,
  actor_role text NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS business_recommendation_overrides_recommendation_idx ON public.business_recommendation_overrides (recommendation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS business_recommendation_overrides_business_idx ON public.business_recommendation_overrides (business_id, created_at DESC);

ALTER TABLE public.business_recommendation_overrides ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_recommendation_overrides FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_recommendation_overrides FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_recommendation_overrides FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_recommendation_overrides FROM service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.business_recommendation_overrides TO service_role;

COMMENT ON TABLE public.business_recommendation_overrides IS
  'TODAY-3 -- immutable override history. actor_type is CHECK-locked to staff only (an owner may never override); reason is required non-empty; before/after snapshots are preserved permanently. Never deleted, never mutated after creation.';

-- =============================================================================================
-- 4. business_stewardship_ledger -- permanent ethical audit trail. Distinguishes what Leonix
-- taught freely, what it chose not to recommend, and what was sold/requested and why. Never
-- claims payment occurred without a truthful structured basis -- and TODAY-3 creates no payment
-- records at all.
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.business_stewardship_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  recommendation_id uuid NULL REFERENCES public.business_recommendations(id) ON DELETE SET NULL,

  event_type text NOT NULL CHECK (event_type IN (
    'recommendation_created', 'recommendation_approved', 'recommendation_shared', 'owner_accepted',
    'owner_declined', 'owner_postponed', 'override_recorded', 'intentionally_not_recommended',
    'taught_freely', 'sold_or_requested', 'external_referral', 'do_nothing_yet', 'review_due'
  )),
  reason_es text NULL,
  reason_en text NULL,
  structured_reason jsonb NOT NULL DEFAULT '{}'::jsonb,
  evidence_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  product_or_service_key text NULL,
  money_involved boolean NOT NULL DEFAULT false,
  payment_reference text NULL,

  actor_type text NOT NULL CHECK (actor_type IN ('staff', 'owner')),
  actor_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  actor_auth_user_id uuid NOT NULL,
  actor_email text NOT NULL,
  actor_role text NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_stewardship_ledger_actor_chk CHECK (
    (actor_type = 'staff' AND actor_roster_id IS NOT NULL) OR
    (actor_type = 'owner' AND actor_roster_id IS NULL)
  ),
  -- REPAIR 4 (nonblank payment reference): no ledger entry may claim payment occurred without a
  -- real, nonblank external reference -- TODAY-3 never sets money_involved=true itself; this
  -- constraint exists so no future caller can silently claim payment without citing a truthful,
  -- nonblank reference.
  CONSTRAINT business_stewardship_ledger_money_chk CHECK (
    money_involved = false OR (payment_reference IS NOT NULL AND char_length(btrim(payment_reference)) > 0)
  ),
  -- REPAIR 5 (nonempty ledger explanation): every row must carry at least one meaningful,
  -- nonblank explanation -- a nonblank ES reason, a nonblank EN reason, or a genuinely nonempty
  -- structured_reason object. Bilingual text is never required for purely internal/structured
  -- events, but a silent, unexplained ledger row is never permitted.
  CONSTRAINT business_stewardship_ledger_explanation_chk CHECK (
    (reason_es IS NOT NULL AND char_length(btrim(reason_es)) > 0) OR
    (reason_en IS NOT NULL AND char_length(btrim(reason_en)) > 0) OR
    (jsonb_typeof(structured_reason) = 'object' AND structured_reason <> '{}'::jsonb)
  )
);

CREATE INDEX IF NOT EXISTS business_stewardship_ledger_business_event_idx ON public.business_stewardship_ledger (business_id, event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS business_stewardship_ledger_business_time_idx ON public.business_stewardship_ledger (business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS business_stewardship_ledger_recommendation_idx ON public.business_stewardship_ledger (recommendation_id);

ALTER TABLE public.business_stewardship_ledger ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_stewardship_ledger FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_stewardship_ledger FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_stewardship_ledger FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_stewardship_ledger FROM service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.business_stewardship_ledger TO service_role;

COMMENT ON TABLE public.business_stewardship_ledger IS
  'TODAY-3 -- permanent ethical audit trail (Stewardship Ledger). Append-only. Distinguishes what Leonix taught freely, what it intentionally did not recommend, and what was sold/requested and why -- never claims payment without a truthful structured reference. TODAY-3 creates no payment records.';

-- =============================================================================================
-- 5. record_business_recommendation_owner_decision -- the sole write path for an owner's
-- accept/decline/postpone decision. Runs the recommendation UPDATE and the matching Stewardship
-- Ledger INSERT inside one PostgreSQL transaction (a single function invocation), so a failure of
-- either statement rolls back both -- there is no compensating-rollback code anywhere; Postgres
-- itself guarantees the atomicity. Narrowly scoped: it accepts the business id and owner actor
-- identity only as arguments supplied by the caller -- it never resolves membership itself, never
-- trusts a client-provided business relationship, and performs no payment, checkout,
-- entitlement, or Globalization write. SECURITY DEFINER with a fixed search_path so it can write
-- through RLS-enabled-with-zero-policies tables exactly like every other TODAY-3 write path
-- (server-only, via the service-role client) -- EXECUTE is revoked from every role except
-- service_role.
-- =============================================================================================
CREATE OR REPLACE FUNCTION public.record_business_recommendation_owner_decision(
  p_recommendation_id uuid,
  p_business_id uuid,
  p_decision text,
  p_note text,
  p_review_date timestamptz,
  p_actor_auth_user_id uuid,
  p_actor_email text,
  p_actor_role text
)
RETURNS SETOF public.business_recommendations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recommendation_id uuid;
  v_event_type text;
BEGIN
  IF p_decision NOT IN ('accepted', 'declined', 'postponed') THEN
    RAISE EXCEPTION 'invalid_decision';
  END IF;

  IF p_decision = 'postponed' AND p_review_date IS NULL THEN
    RAISE EXCEPTION 'postpone_requires_review_date';
  END IF;

  IF p_decision <> 'postponed' AND p_review_date IS NOT NULL THEN
    RAISE EXCEPTION 'review_date_not_allowed';
  END IF;

  IF p_actor_auth_user_id IS NULL
     OR p_actor_email IS NULL OR char_length(btrim(p_actor_email)) = 0
     OR p_actor_role IS NULL OR char_length(btrim(p_actor_role)) = 0 THEN
    RAISE EXCEPTION 'missing_owner_actor_attribution';
  END IF;

  -- Exact eligibility: the caller's business id, this exact recommendation id, currently the
  -- one is_current row, already shared, and owner-visible -- never a bare id lookup.
  SELECT id INTO v_recommendation_id
  FROM public.business_recommendations
  WHERE id = p_recommendation_id
    AND business_id = p_business_id
    AND status = 'shared_with_owner'
    AND visibility = 'owner_and_staff'
    AND is_current = true
  FOR UPDATE;

  IF v_recommendation_id IS NULL THEN
    RAISE EXCEPTION 'not_eligible';
  END IF;

  v_event_type := CASE p_decision
    WHEN 'accepted' THEN 'owner_accepted'
    WHEN 'declined' THEN 'owner_declined'
    ELSE 'owner_postponed'
  END;

  UPDATE public.business_recommendations
  SET
    status = p_decision,
    owner_decision = p_decision,
    owner_decision_at = now(),
    owner_decision_note = p_note,
    owner_decision_review_date = CASE WHEN p_decision = 'postponed' THEN p_review_date ELSE NULL END,
    review_date = CASE WHEN p_decision = 'postponed' THEN p_review_date ELSE review_date END,
    updated_at = now()
  WHERE id = v_recommendation_id;

  INSERT INTO public.business_stewardship_ledger (
    business_id, recommendation_id, event_type, reason_es, reason_en, structured_reason,
    evidence_refs, product_or_service_key, money_involved, payment_reference,
    actor_type, actor_roster_id, actor_auth_user_id, actor_email, actor_role
  )
  SELECT
    p_business_id, v_recommendation_id, v_event_type, p_note, p_note,
    jsonb_build_object('decision', p_decision, 'candidateKey', r.candidate_key),
    '[]'::jsonb, NULL, false, NULL,
    'owner', NULL, p_actor_auth_user_id, p_actor_email, p_actor_role
  FROM public.business_recommendations r
  WHERE r.id = v_recommendation_id;

  RETURN QUERY SELECT * FROM public.business_recommendations WHERE id = v_recommendation_id;
END;
$$;

REVOKE ALL ON FUNCTION public.record_business_recommendation_owner_decision(uuid, uuid, text, text, timestamptz, uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_business_recommendation_owner_decision(uuid, uuid, text, text, timestamptz, uuid, text, text) FROM anon;
REVOKE ALL ON FUNCTION public.record_business_recommendation_owner_decision(uuid, uuid, text, text, timestamptz, uuid, text, text) FROM authenticated;
REVOKE ALL ON FUNCTION public.record_business_recommendation_owner_decision(uuid, uuid, text, text, timestamptz, uuid, text, text) FROM service_role;
GRANT EXECUTE ON FUNCTION public.record_business_recommendation_owner_decision(uuid, uuid, text, text, timestamptz, uuid, text, text) TO service_role;

COMMENT ON FUNCTION public.record_business_recommendation_owner_decision IS
  'TODAY-3 -- the sole write path for an owner accept/decline/postpone decision. Updates business_recommendations and inserts the matching business_stewardship_ledger row inside one transaction; either both writes succeed or neither does. Called exclusively by the server-only stewardship repository via the service-role client, after the owner API route has independently resolved exact membership and derived a real owner actor -- this function never resolves membership or trusts a client-supplied business relationship itself.';

-- =============================================================================================
-- Feature flag -- reuses the existing business_identity_flags table (Gate BCO-1C.1) rather than
-- creating a parallel flags table. Starts disabled, same as every prior gate's flag row.
-- =============================================================================================
INSERT INTO public.business_identity_flags (flag_key, enabled, emergency_disabled, pilot_user_ids)
VALUES ('business_stewardship_engine', false, false, '{}')
ON CONFLICT (flag_key) DO NOTHING;

COMMIT;
