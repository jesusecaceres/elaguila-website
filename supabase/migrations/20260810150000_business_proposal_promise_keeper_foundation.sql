-- =============================================================================================
-- Program 5 — Proposal + Promise Keeper Foundation
-- Migration: 20260810150000_business_proposal_promise_keeper_foundation.sql
--
-- Creates 4 new tables:
--   F. business_proposals
--   G. business_proposal_versions
--   H. business_commitments
--   I. business_commitment_events
--
-- Doctrine:
-- - No invented pricing — proposal builder resolves prices from revenue_pricing_matrix
-- - Proposal acceptance does not charge, create payment, grant entitlement, or fulfill
-- - No payment state masquerading as proposal state
-- - Commitments are tracked, never silently disappear
-- - Capacity/blocker/release supported — no shame language
-- - Event history preserved for all commitment transitions
-- - RLS enabled, zero user policies, narrow service_role grants
-- - Actor attribution CHECK on every table
-- - Feature flags default disabled
-- =============================================================================================

BEGIN;

-- =============================================================================================
-- Prerequisite: add UNIQUE(id, business_id) to business_recommendations so that proposals
-- and commitments can use composite same-business FKs. This is safe — id is already PK,
-- so the UNIQUE constraint is logically redundant but required for composite FK targets.
-- Does not alter existing Program 3 behavior.
-- Uses a DO block with pg_constraint check because ADD CONSTRAINT IF NOT EXISTS is not
-- valid PostgreSQL syntax.
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

-- =============================================================================================
-- F. business_proposals — truthful proposal foundation.
-- Exposes UNIQUE(id, business_id) for composite same-business FKs from commitments and versions.
-- source_recommendation_id is a REAL FK to business_recommendations(id), plus a composite
-- same-business FK (source_recommendation_id, business_id) → business_recommendations(id, business_id).
-- Pricing is snapshotted from the real revenue_pricing_matrix, never invented.
-- Proposal acceptance does not charge, create payment, grant entitlement, or fulfill.
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.business_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  source_recommendation_id uuid NULL REFERENCES public.business_recommendations(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'staff_review', 'owner_review', 'accepted',
    'declined', 'expired', 'superseded', 'cancelled'
  )),
  version integer NOT NULL DEFAULT 1,
  is_current boolean NOT NULL DEFAULT true,

  owner_goal_en text NULL,
  owner_goal_es text NULL,
  verified_need_en text NOT NULL,
  verified_need_es text NOT NULL,
  recommended_intervention text NOT NULL,
  free_option_en text NULL,
  free_option_es text NULL,
  scope_en text NOT NULL,
  scope_es text NOT NULL,
  deliverables_en text NOT NULL,
  deliverables_es text NOT NULL,
  exclusions_en text NULL,
  exclusions_es text NULL,
  responsibilities_en text NOT NULL,
  responsibilities_es text NOT NULL,
  timeline_en text NOT NULL,
  timeline_es text NOT NULL,
  review_date date NULL,

  pricing_snapshot jsonb NULL,
  entitlement_reference text NULL,
  success_metric_en text NOT NULL,
  success_metric_es text NOT NULL,

  created_actor_type text NOT NULL CHECK (created_actor_type IN ('staff', 'owner')),
  created_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  created_by_auth_user_id uuid NOT NULL,
  created_by_email text NOT NULL,
  created_by_role text NOT NULL,

  accepted_actor_type text NULL CHECK (
    accepted_actor_type IS NULL OR accepted_actor_type IN ('staff', 'owner')
  ),
  accepted_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  accepted_by_auth_user_id uuid NULL,
  accepted_by_email text NULL,
  accepted_by_role text NULL,
  accepted_at timestamptz NULL,
  declined_at timestamptz NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_proposals_id_business_id_uk UNIQUE (id, business_id),

  -- Same-business recommendation FK: only enforced when source_recommendation_id is non-NULL.
  -- ON DELETE RESTRICT: deleting a recommendation referenced by a proposal is blocked to
  -- preserve proposal audit history. The simple FK above also uses RESTRICT for consistency.
  CONSTRAINT business_proposals_recommendation_business_fk
    FOREIGN KEY (source_recommendation_id, business_id)
    REFERENCES public.business_recommendations(id, business_id)
    ON DELETE RESTRICT,

  -- Actor integrity: staff must carry roster_id; owner must NOT.
  CONSTRAINT business_proposals_created_actor_chk CHECK (
    (created_actor_type = 'staff' AND created_by_roster_id IS NOT NULL) OR
    (created_actor_type = 'owner' AND created_by_roster_id IS NULL)
  ),

  -- Lifecycle: accepted requires accepted_at, accepted_actor_type, and atomic attribution.
  CONSTRAINT business_proposals_accepted_requires_at_chk CHECK (
    status != 'accepted' OR accepted_at IS NOT NULL
  ),
  CONSTRAINT business_proposals_accepted_requires_actor_type_chk CHECK (
    status != 'accepted' OR accepted_actor_type IS NOT NULL
  ),
  -- Accepted atomic attribution: auth_user_id, email, role, at all required.
  -- Roster_id is conditionally required based on actor type (see below).
  CONSTRAINT business_proposals_accepted_atomic_chk CHECK (
    status != 'accepted' OR (
      accepted_by_auth_user_id IS NOT NULL AND
      accepted_by_email IS NOT NULL AND char_length(btrim(accepted_by_email)) > 0 AND
      accepted_by_role IS NOT NULL AND char_length(btrim(accepted_by_role)) > 0 AND
      accepted_at IS NOT NULL
    )
  ),
  -- Owner-safe acceptance: owner actor must NOT carry roster_id.
  CONSTRAINT business_proposals_accepted_owner_no_roster_chk CHECK (
    status != 'accepted' OR accepted_actor_type != 'owner' OR accepted_by_roster_id IS NULL
  ),
  -- Staff acceptance: staff actor must carry roster_id.
  CONSTRAINT business_proposals_accepted_staff_requires_roster_chk CHECK (
    status != 'accepted' OR accepted_actor_type != 'staff' OR accepted_by_roster_id IS NOT NULL
  ),
  -- Accepted must NOT carry declined_at (mutual exclusion).
  CONSTRAINT business_proposals_accepted_not_declined_chk CHECK (
    status != 'accepted' OR declined_at IS NULL
  ),

  -- Lifecycle: declined requires declined_at.
  CONSTRAINT business_proposals_declined_requires_at_chk CHECK (
    status != 'declined' OR declined_at IS NOT NULL
  ),
  -- Declined must NOT carry any acceptance attribution (mutual exclusion).
  CONSTRAINT business_proposals_declined_not_accepted_chk CHECK (
    status != 'declined' OR (
      accepted_at IS NULL AND accepted_actor_type IS NULL AND
      accepted_by_roster_id IS NULL AND accepted_by_auth_user_id IS NULL AND
      accepted_by_email IS NULL AND accepted_by_role IS NULL
    )
  ),

  -- Pre-decision states (draft, staff_review, owner_review, expired, cancelled)
  -- must NOT carry acceptance attribution OR declined_at.
  -- These states have not yet reached a decision — no decision fields allowed.
  -- expired comes only from owner_review; cancelled comes only from draft/staff_review.
  -- Historical decision evidence is preserved in business_proposal_versions.
  CONSTRAINT business_proposals_predecision_no_decision_attribution_chk CHECK (
    status NOT IN ('draft', 'staff_review', 'owner_review', 'expired', 'cancelled') OR (
      accepted_at IS NULL AND accepted_actor_type IS NULL AND
      accepted_by_roster_id IS NULL AND accepted_by_auth_user_id IS NULL AND
      accepted_by_email IS NULL AND accepted_by_role IS NULL AND
      declined_at IS NULL
    )
  ),

  -- Superseded: can come from accepted, declined, or expired.
  -- May retain historical acceptance OR decline attribution, but NOT BOTH (mutual exclusion).
  -- If retaining acceptance, it must be atomically complete.
  -- If not retaining acceptance, no acceptance fields may be set.
  CONSTRAINT business_proposals_superseded_not_both_decisions_chk CHECK (
    status != 'superseded' OR accepted_at IS NULL OR declined_at IS NULL
  ),
  CONSTRAINT business_proposals_superseded_accepted_atomic_chk CHECK (
    status != 'superseded' OR accepted_at IS NULL OR (
      accepted_actor_type IS NOT NULL AND
      accepted_by_auth_user_id IS NOT NULL AND
      accepted_by_email IS NOT NULL AND char_length(btrim(accepted_by_email)) > 0 AND
      accepted_by_role IS NOT NULL AND char_length(btrim(accepted_by_role)) > 0
    )
  ),
  CONSTRAINT business_proposals_superseded_no_partial_accepted_chk CHECK (
    status != 'superseded' OR (
      (accepted_at IS NULL AND accepted_actor_type IS NULL AND
       accepted_by_roster_id IS NULL AND accepted_by_auth_user_id IS NULL AND
       accepted_by_email IS NULL AND accepted_by_role IS NULL)
      OR
      (accepted_at IS NOT NULL AND accepted_actor_type IS NOT NULL AND
       accepted_by_auth_user_id IS NOT NULL AND
       accepted_by_email IS NOT NULL AND accepted_by_role IS NOT NULL)
    )
  ),
  -- Superseded acceptance actor integrity: same roster invariant as active accepted.
  -- Owner actor must NOT carry roster_id; staff actor MUST carry roster_id.
  CONSTRAINT business_proposals_superseded_owner_no_roster_chk CHECK (
    status != 'superseded' OR accepted_at IS NULL OR accepted_actor_type != 'owner' OR accepted_by_roster_id IS NULL
  ),
  CONSTRAINT business_proposals_superseded_staff_requires_roster_chk CHECK (
    status != 'superseded' OR accepted_at IS NULL OR accepted_actor_type != 'staff' OR accepted_by_roster_id IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS business_proposals_business_id_idx ON public.business_proposals (business_id);
CREATE INDEX IF NOT EXISTS business_proposals_status_idx ON public.business_proposals (status);
CREATE INDEX IF NOT EXISTS business_proposals_current_idx ON public.business_proposals (business_id) WHERE is_current = true;

ALTER TABLE public.business_proposals ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_proposals FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_proposals FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_proposals FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_proposals FROM service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.business_proposals TO service_role;

COMMENT ON TABLE public.business_proposals IS
  'Program 5 — Proposals. Pricing snapshotted from revenue_pricing_matrix, never invented. Acceptance does not charge, create payment, grant entitlement, or fulfill. Real FK to business_recommendations + composite same-business FK. UNIQUE(id, business_id) for child composite FKs.';

-- =============================================================================================
-- G. business_proposal_versions — version history for proposals.
-- Now includes business_id for exact-business querying/audit and composite same-business FK.
-- Append-only (SELECT, INSERT only).
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.business_proposal_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  version integer NOT NULL,
  status text NOT NULL CHECK (status IN (
    'draft', 'staff_review', 'owner_review', 'accepted',
    'declined', 'expired', 'superseded', 'cancelled'
  )),

  changed_actor_type text NOT NULL CHECK (changed_actor_type IN ('staff', 'owner')),
  changed_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  changed_by_auth_user_id uuid NOT NULL,
  changed_by_email text NOT NULL,
  changed_by_role text NOT NULL,
  change_reason text NULL,

  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_proposal_versions_proposal_business_fk
    FOREIGN KEY (proposal_id, business_id)
    REFERENCES public.business_proposals(id, business_id)
    ON DELETE CASCADE,

  CONSTRAINT business_proposal_versions_changed_actor_chk CHECK (
    (changed_actor_type = 'staff' AND changed_by_roster_id IS NOT NULL) OR
    (changed_actor_type = 'owner' AND changed_by_roster_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS business_proposal_versions_proposal_id_idx ON public.business_proposal_versions (proposal_id);
CREATE INDEX IF NOT EXISTS business_proposal_versions_business_id_idx ON public.business_proposal_versions (business_id);

ALTER TABLE public.business_proposal_versions ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_proposal_versions FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_proposal_versions FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_proposal_versions FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_proposal_versions FROM service_role;
GRANT SELECT, INSERT ON TABLE public.business_proposal_versions TO service_role;

COMMENT ON TABLE public.business_proposal_versions IS
  'Program 5 — Proposal version history. Append-only audit trail of all status changes. Same-business integrity via composite FK. Actor attribution required.';

-- =============================================================================================
-- H. business_commitments — Promise Keeper commitments.
-- Exposes UNIQUE(id, business_id) for composite same-business FK from events.
-- Real FKs to business_recommendations, business_meetings, business_proposals — all with
-- composite same-business FKs to prevent cross-business linkage.
-- No shame language. Capacity/blocker/release supported.
-- Commitments never silently disappear.
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.business_commitments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  meeting_id uuid NULL,
  recommendation_id uuid NULL REFERENCES public.business_recommendations(id) ON DELETE RESTRICT,
  proposal_id uuid NULL,

  title_es text NOT NULL CHECK (char_length(title_es) > 0 AND char_length(title_es) <= 300),
  title_en text NOT NULL CHECK (char_length(title_en) > 0 AND char_length(title_en) <= 300),

  responsible_party text NOT NULL CHECK (responsible_party IN ('owner', 'staff', 'shared', 'external')),
  assigned_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  smallest_next_step text NULL,
  due_at timestamptz NULL,

  status text NOT NULL DEFAULT 'planned' CHECK (status IN (
    'planned', 'active', 'blocked', 'completed', 'released'
  )),
  blocker text NULL,
  help_requested boolean NOT NULL DEFAULT false,
  evidence_required boolean NOT NULL DEFAULT false,
  capacity_state text NOT NULL DEFAULT 'normal' CHECK (capacity_state IN ('normal', 'stretched', 'paused')),
  review_outcome text NULL CHECK (review_outcome IS NULL OR review_outcome IN ('continue', 'modify', 'delegate', 'release')),

  created_actor_type text NOT NULL CHECK (created_actor_type IN ('staff', 'owner')),
  created_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  created_by_auth_user_id uuid NOT NULL,
  created_by_email text NOT NULL,
  created_by_role text NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_commitments_id_business_id_uk UNIQUE (id, business_id),

  -- Same-business meeting FK: only enforced when meeting_id is non-NULL.
  -- ON DELETE RESTRICT: deleting a meeting referenced by a commitment is blocked to
  -- preserve commitment audit history.
  CONSTRAINT business_commitments_meeting_business_fk
    FOREIGN KEY (meeting_id, business_id)
    REFERENCES public.business_meetings(id, business_id)
    ON DELETE RESTRICT,

  -- Same-business recommendation FK: only enforced when recommendation_id is non-NULL.
  -- ON DELETE RESTRICT: deleting a recommendation referenced by a commitment is blocked.
  CONSTRAINT business_commitments_recommendation_business_fk
    FOREIGN KEY (recommendation_id, business_id)
    REFERENCES public.business_recommendations(id, business_id)
    ON DELETE RESTRICT,

  -- Same-business proposal FK: only enforced when proposal_id is non-NULL.
  -- ON DELETE RESTRICT: deleting a proposal referenced by a commitment is blocked.
  CONSTRAINT business_commitments_proposal_business_fk
    FOREIGN KEY (proposal_id, business_id)
    REFERENCES public.business_proposals(id, business_id)
    ON DELETE RESTRICT,

  -- Actor integrity: staff must carry roster_id; owner must NOT.
  CONSTRAINT business_commitments_created_actor_chk CHECK (
    (created_actor_type = 'staff' AND created_by_roster_id IS NOT NULL) OR
    (created_actor_type = 'owner' AND created_by_roster_id IS NULL)
  ),

  -- Responsible party: staff commitments require assigned_roster_id.
  -- Do not force roster ID for owner/external commitments.
  CONSTRAINT business_commitments_staff_requires_roster_chk CHECK (
    responsible_party != 'staff' OR assigned_roster_id IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS business_commitments_business_id_idx ON public.business_commitments (business_id);
CREATE INDEX IF NOT EXISTS business_commitments_status_idx ON public.business_commitments (status);
CREATE INDEX IF NOT EXISTS business_commitments_assigned_roster_id_idx ON public.business_commitments (assigned_roster_id);
CREATE INDEX IF NOT EXISTS business_commitments_due_at_idx ON public.business_commitments (due_at);

ALTER TABLE public.business_commitments ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_commitments FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_commitments FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_commitments FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_commitments FROM service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.business_commitments TO service_role;

COMMENT ON TABLE public.business_commitments IS
  'Program 5 — Promise Keeper. Commitments are tracked, never silently disappear. No shame language. Capacity/blocker/release supported. Real FKs to recommendations, meetings, proposals with composite same-business integrity.';

-- =============================================================================================
-- I. business_commitment_events — full event history for commitments.
-- Composite FK (commitment_id, business_id) → business_commitments(id, business_id).
-- Append-only (SELECT, INSERT only).
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.business_commitment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commitment_id uuid NOT NULL,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN (
    'created', 'started', 'blocked', 'help_requested',
    'due_date_changed', 'reassigned', 'completed', 'released', 'reviewed'
  )),

  event_actor_type text NOT NULL CHECK (event_actor_type IN ('staff', 'owner')),
  event_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  event_by_auth_user_id uuid NOT NULL,
  event_by_email text NOT NULL,
  event_by_role text NOT NULL,

  details jsonb NULL,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_commitment_events_commitment_business_fk
    FOREIGN KEY (commitment_id, business_id)
    REFERENCES public.business_commitments(id, business_id)
    ON DELETE CASCADE,

  CONSTRAINT business_commitment_events_event_actor_chk CHECK (
    (event_actor_type = 'staff' AND event_by_roster_id IS NOT NULL) OR
    (event_actor_type = 'owner' AND event_by_roster_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS business_commitment_events_commitment_id_idx ON public.business_commitment_events (commitment_id);
CREATE INDEX IF NOT EXISTS business_commitment_events_business_id_idx ON public.business_commitment_events (business_id);

ALTER TABLE public.business_commitment_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_commitment_events FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_commitment_events FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_commitment_events FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_commitment_events FROM service_role;
GRANT SELECT, INSERT ON TABLE public.business_commitment_events TO service_role;

COMMENT ON TABLE public.business_commitment_events IS
  'Program 5 — Commitment event history. Append-only. Preserves full audit trail of all commitment transitions. Same-business integrity via composite FK.';

-- =============================================================================================
-- Feature flags — reuses the existing business_identity_flags table.
-- Both start disabled.
-- =============================================================================================
INSERT INTO public.business_identity_flags (flag_key, enabled, emergency_disabled, pilot_user_ids)
VALUES ('business_proposal_studio', false, false, '{}')
ON CONFLICT (flag_key) DO NOTHING;

INSERT INTO public.business_identity_flags (flag_key, enabled, emergency_disabled, pilot_user_ids)
VALUES ('business_promise_keeper', false, false, '{}')
ON CONFLICT (flag_key) DO NOTHING;

COMMIT;
