-- Gate BCO-TODAY-2 — Personalized DIY Concierge + Package Experience foundation.
--
-- Additive only: six new tables, no changes to any existing table/column/RPC. This package reads
-- its diagnosis input exclusively from the existing, immutable Gate BCO-6A Business Health Map
-- tables (business_health_assessment_runs/dimension_results/findings) and the existing Gate BCO-5A
-- Living Business Book -- it never duplicates a business fact, a health assessment, or a learning
-- record into a second copy. The deterministic action TEMPLATE registry (condition, why-it-matters,
-- steps, tools, evidence requirements, related lesson/checklist/template keys) lives in code
-- (app/lib/business/diyConcierge/actionRegistry.ts), matching the existing ruleRegistry.ts
-- convention for the Health Map -- only the INSTANTIATED per-business action state, its event
-- history, evidence, owner approvals, and paid-service requests are persisted here.
--
-- Every table is server-only (read/written exclusively via getAdminSupabase(), the service-role
-- client). RLS is enabled with zero policies on every table (deny-all for anon/authenticated),
-- matching the businesses-family/Sales Workspace/Living Business Book/Health Map/Learning Center
-- precedent exactly. Privilege hardening uses the corrected TODAY-1A posture from the beginning:
-- REVOKE ALL FROM PUBLIC, anon, authenticated, AND service_role, then an explicit narrow
-- GRANT SELECT, INSERT, UPDATE, DELETE to service_role only -- never GRANT ALL PRIVILEGES, never
-- REFERENCES/TRIGGER/TRUNCATE to anyone, never a grant to anon/authenticated/PUBLIC.
--
-- Actor attribution doctrine: every consequential row is authored by either a real, currently
-- active Leonix staff member (admin_team_members, via requireSalesWorkspaceAccess()'s verified
-- StrictSalesActor) or the real, authenticated business owner (auth.users, via their own verified
-- session) -- never a placeholder. Same dual-actor shape proven throughout Gate BCO-5A/6A.
--
-- Commercial-model doctrine: this package NEVER implements Stripe, checkout, payment capture,
-- promo-code ownership, marketplace ranking, Featured placement, or package fulfillment. It
-- consumes entitlement state computed elsewhere (business_listing_links + the existing
-- listing_package_entitlements table) and only ever creates a structured, truthful, pending
-- request record for paid human work -- never an automatic work order, payment, or assignment.
--
-- Dependency order:
--   1. public.business_diy_actions
--   2. public.business_diy_action_events       (references business_diy_actions)
--   3. public.business_diy_action_evidence     (references business_diy_actions)
--   4. public.business_owner_approvals
--   5. public.business_owner_approval_events   (references business_owner_approvals)
--   6. public.business_service_requests        (references business_diy_actions, optional)

BEGIN;

-- =============================================================================================
-- 1. business_diy_actions -- one instantiated, deterministic DIY action per (business, action_key).
-- Re-evaluating a business against a newer Health Map run updates source_run_id/source_finding_id
-- in place via an event-recorded status change; it never creates a duplicate row for the same
-- action_key, and it never mutates the source Health Map run itself.
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.business_diy_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,

  action_key text NOT NULL CHECK (char_length(btrim(action_key)) > 0),
  dimension_key text NOT NULL CHECK (dimension_key IN (
    'business_foundation', 'customer_clarity', 'offer_and_value', 'operations_and_capacity',
    'visibility_and_discovery', 'communication_and_follow_up', 'owner_goals_and_sustainability'
  )),
  source_run_id uuid NULL REFERENCES public.business_health_assessment_runs(id) ON DELETE SET NULL,
  source_finding_id uuid NULL REFERENCES public.business_health_findings(id) ON DELETE SET NULL,
  registry_version text NOT NULL CHECK (char_length(btrim(registry_version)) > 0),

  status text NOT NULL DEFAULT 'available' CHECK (status IN (
    'available', 'in_progress', 'awaiting_evidence', 'awaiting_owner_confirmation',
    'completed', 'postponed', 'blocked', 'no_longer_applicable', 'cancelled'
  )),
  owner_decision text NULL CHECK (owner_decision IS NULL OR owner_decision IN (
    'start', 'continue', 'mark_ready_for_review', 'confirm_completion', 'postpone', 'resume',
    'decline', 'request_guidance', 'request_managed_service'
  )),
  review_date timestamptz NULL,
  reassessment_trigger text NULL CHECK (reassessment_trigger IS NULL OR char_length(reassessment_trigger) <= 500),
  completed_at timestamptz NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_diy_actions_one_per_business_key UNIQUE (business_id, action_key),
  CONSTRAINT business_diy_actions_completion_chk CHECK (
    (status = 'completed' AND completed_at IS NOT NULL) OR
    (status <> 'completed' AND completed_at IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS business_diy_actions_business_status_idx ON public.business_diy_actions (business_id, status);
CREATE INDEX IF NOT EXISTS business_diy_actions_business_dimension_idx ON public.business_diy_actions (business_id, dimension_key);
CREATE INDEX IF NOT EXISTS business_diy_actions_source_run_idx ON public.business_diy_actions (source_run_id);

ALTER TABLE public.business_diy_actions ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_diy_actions FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_diy_actions FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_diy_actions FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_diy_actions FROM service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.business_diy_actions TO service_role;

COMMENT ON TABLE public.business_diy_actions IS
  'TODAY-2 -- one instantiated DIY action per (business, action_key), deterministically selected from the code-resident action registry against the latest Health Map run. Never a generative/AI-authored row.';

-- =============================================================================================
-- 2. business_diy_action_events -- append-only, immutable history. A status change, an owner
-- decision, evidence being linked, or a note is always recorded here in addition to updating the
-- parent row's current status -- history is never erased or overwritten.
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.business_diy_action_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  action_id uuid NOT NULL REFERENCES public.business_diy_actions(id) ON DELETE CASCADE,

  event_type text NOT NULL CHECK (event_type IN ('created', 'status_changed', 'decision_recorded', 'evidence_linked', 'note_added')),
  from_status text NULL,
  to_status text NULL,
  decision text NULL,
  note text NULL CHECK (note IS NULL OR char_length(note) <= 2000),

  actor_type text NOT NULL CHECK (actor_type IN ('staff', 'owner')),
  actor_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  actor_auth_user_id uuid NOT NULL,
  actor_email text NOT NULL,
  actor_role text NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_diy_action_events_actor_chk CHECK (
    (actor_type = 'staff' AND actor_roster_id IS NOT NULL) OR
    (actor_type = 'owner' AND actor_roster_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS business_diy_action_events_action_idx ON public.business_diy_action_events (action_id, created_at DESC);
CREATE INDEX IF NOT EXISTS business_diy_action_events_business_idx ON public.business_diy_action_events (business_id, created_at DESC);

ALTER TABLE public.business_diy_action_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_diy_action_events FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_diy_action_events FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_diy_action_events FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_diy_action_events FROM service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.business_diy_action_events TO service_role;

COMMENT ON TABLE public.business_diy_action_events IS
  'TODAY-2 -- append-only action history. Never deleted, never mutated after creation. Preserves every status change and owner decision even after the parent action reaches a terminal state.';

-- =============================================================================================
-- 3. business_diy_action_evidence -- structured, bounded completion evidence. Never a new
-- insecure upload system: file_reference only stores a reference into an already-approved
-- storage pattern, never a raw upload target of its own.
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.business_diy_action_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  action_id uuid NOT NULL REFERENCES public.business_diy_actions(id) ON DELETE CASCADE,

  evidence_type text NOT NULL CHECK (evidence_type IN (
    'owner_attestation', 'url', 'text_note', 'checklist_confirmation', 'file_reference',
    'business_fact_reference', 'listing_reference', 'staff_confirmation'
  )),
  value_text text NULL CHECK (value_text IS NULL OR char_length(value_text) <= 2000),
  reference_id uuid NULL,
  owner_note text NULL CHECK (owner_note IS NULL OR char_length(owner_note) <= 2000),
  visibility text NOT NULL DEFAULT 'owner_and_staff' CHECK (visibility IN ('owner_and_staff', 'staff_only')),

  actor_type text NOT NULL CHECK (actor_type IN ('staff', 'owner')),
  actor_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  actor_auth_user_id uuid NOT NULL,
  actor_email text NOT NULL,
  actor_role text NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_diy_action_evidence_actor_chk CHECK (
    (actor_type = 'staff' AND actor_roster_id IS NOT NULL) OR
    (actor_type = 'owner' AND actor_roster_id IS NULL)
  ),
  CONSTRAINT business_diy_action_evidence_value_chk CHECK (
    value_text IS NOT NULL OR reference_id IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS business_diy_action_evidence_action_idx ON public.business_diy_action_evidence (action_id, created_at DESC);
CREATE INDEX IF NOT EXISTS business_diy_action_evidence_business_idx ON public.business_diy_action_evidence (business_id, created_at DESC);

ALTER TABLE public.business_diy_action_evidence ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_diy_action_evidence FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_diy_action_evidence FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_diy_action_evidence FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_diy_action_evidence FROM service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.business_diy_action_evidence TO service_role;

COMMENT ON TABLE public.business_diy_action_evidence IS
  'TODAY-2 -- structured, bounded completion evidence for one action. reference_id points at an existing fact/listing/file record by id only -- never a raw secret, credential, or a new upload target. Deterministic completion rules live in code, not here.';

-- =============================================================================================
-- 4. business_owner_approvals -- items requiring an explicit owner (or staff, for staff-only
-- decisions) decision. Silence is never treated as approval; nothing here is auto-approved.
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.business_owner_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,

  request_type text NOT NULL CHECK (request_type IN (
    'action_completion_confirmation', 'owner_correction_confirmation', 'concierge_guidance_request',
    'managed_service_request', 'postponement_review', 'resume_decision', 'content_draft_approval'
  )),
  source_record_type text NOT NULL CHECK (char_length(btrim(source_record_type)) > 0),
  source_record_id uuid NOT NULL,
  requested_decision text NOT NULL CHECK (char_length(btrim(requested_decision)) > 0),

  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined', 'withdrawn', 'expired', 'superseded')),
  requested_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz NULL,

  requested_by_actor_type text NOT NULL CHECK (requested_by_actor_type IN ('staff', 'owner')),
  requested_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  requested_by_auth_user_id uuid NOT NULL,
  requested_by_email text NOT NULL,
  requested_by_role text NOT NULL,

  decided_by_actor_type text NULL CHECK (decided_by_actor_type IS NULL OR decided_by_actor_type IN ('staff', 'owner')),
  decided_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  decided_by_auth_user_id uuid NULL,
  decided_by_email text NULL,
  decided_by_role text NULL,

  owner_note text NULL CHECK (owner_note IS NULL OR char_length(owner_note) <= 2000),
  staff_note text NULL CHECK (staff_note IS NULL OR char_length(staff_note) <= 2000),

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_owner_approvals_requested_by_actor_chk CHECK (
    (requested_by_actor_type = 'staff' AND requested_by_roster_id IS NOT NULL) OR
    (requested_by_actor_type = 'owner' AND requested_by_roster_id IS NULL)
  ),
  CONSTRAINT business_owner_approvals_decided_by_actor_chk CHECK (
    decided_by_actor_type IS NULL OR
    (decided_by_actor_type = 'staff' AND decided_by_roster_id IS NOT NULL) OR
    (decided_by_actor_type = 'owner' AND decided_by_roster_id IS NULL)
  ),
  -- Locked actor-attribution doctrine: every consequential (non-pending) decision must carry a
  -- real, fully-attributed deciding actor -- decided_at alone is never sufficient. A pending
  -- request must carry NO deciding-actor field at all (silence is never treated as approval).
  CONSTRAINT business_owner_approvals_decision_chk CHECK (
    (
      status = 'pending' AND
      decided_at IS NULL AND
      decided_by_actor_type IS NULL AND
      decided_by_roster_id IS NULL AND
      decided_by_auth_user_id IS NULL AND
      decided_by_email IS NULL AND
      decided_by_role IS NULL
    ) OR (
      status <> 'pending' AND
      decided_at IS NOT NULL AND
      decided_by_actor_type IS NOT NULL AND
      decided_by_auth_user_id IS NOT NULL AND
      decided_by_email IS NOT NULL AND
      decided_by_role IS NOT NULL
    )
  )
);

CREATE INDEX IF NOT EXISTS business_owner_approvals_business_status_idx ON public.business_owner_approvals (business_id, status);
CREATE INDEX IF NOT EXISTS business_owner_approvals_source_idx ON public.business_owner_approvals (source_record_type, source_record_id);
CREATE INDEX IF NOT EXISTS business_owner_approvals_type_idx ON public.business_owner_approvals (request_type, status);

ALTER TABLE public.business_owner_approvals ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_owner_approvals FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_owner_approvals FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_owner_approvals FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_owner_approvals FROM service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.business_owner_approvals TO service_role;

COMMENT ON TABLE public.business_owner_approvals IS
  'TODAY-2 -- Approval Center requests. Nothing here is auto-approved; silence is never treated as approval. decided_by_* is populated only at the moment of an explicit decision -- never a staff actor impersonating the owner or vice versa (request_type gates who may decide via app-layer authorization, not a DB policy).';

-- =============================================================================================
-- 5. business_owner_approval_events -- immutable decision history for an approval, one row per
-- state transition (request, decision, note).
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.business_owner_approval_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_id uuid NOT NULL REFERENCES public.business_owner_approvals(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,

  event_type text NOT NULL CHECK (event_type IN ('requested', 'approved', 'declined', 'withdrawn', 'expired', 'superseded', 'note_added')),
  note text NULL CHECK (note IS NULL OR char_length(note) <= 2000),

  actor_type text NOT NULL CHECK (actor_type IN ('staff', 'owner')),
  actor_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  actor_auth_user_id uuid NOT NULL,
  actor_email text NOT NULL,
  actor_role text NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_owner_approval_events_actor_chk CHECK (
    (actor_type = 'staff' AND actor_roster_id IS NOT NULL) OR
    (actor_type = 'owner' AND actor_roster_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS business_owner_approval_events_approval_idx ON public.business_owner_approval_events (approval_id, created_at DESC);
CREATE INDEX IF NOT EXISTS business_owner_approval_events_business_idx ON public.business_owner_approval_events (business_id, created_at DESC);

ALTER TABLE public.business_owner_approval_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_owner_approval_events FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_owner_approval_events FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_owner_approval_events FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_owner_approval_events FROM service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.business_owner_approval_events TO service_role;

COMMENT ON TABLE public.business_owner_approval_events IS
  'TODAY-2 -- append-only decision history for business_owner_approvals. Never deleted, never mutated after creation.';

-- =============================================================================================
-- 6. business_service_requests -- structured, truthful, PENDING-only requests for paid human
-- work (Guide Me / Let Leonix Handle It). Never an automatic work order, payment, scheduling
-- commitment, staff assignment, or guaranteed outcome. This package owns none of that -- it only
-- records what was requested and the server-resolved entitlement/account context at request time.
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.business_service_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  source_action_id uuid NULL REFERENCES public.business_diy_actions(id) ON DELETE SET NULL,

  request_type text NOT NULL CHECK (request_type IN ('guide_me_concierge', 'let_leonix_handle_it')),
  requested_deliverable text NOT NULL CHECK (char_length(btrim(requested_deliverable)) > 0 AND char_length(requested_deliverable) <= 2000),
  requested_outcome text NULL CHECK (requested_outcome IS NULL OR char_length(requested_outcome) <= 2000),
  owner_note text NULL CHECK (owner_note IS NULL OR char_length(owner_note) <= 2000),
  urgency_preference text NOT NULL DEFAULT 'no_rush' CHECK (urgency_preference IN ('no_rush', 'soon', 'urgent')),

  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'closed', 'cancelled')),
  entitlement_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,

  requested_by_auth_user_id uuid NOT NULL,
  requested_by_email text NOT NULL,

  acknowledged_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  acknowledged_by_email text NULL,
  acknowledged_at timestamptz NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_service_requests_ack_chk CHECK (
    (status = 'acknowledged' AND acknowledged_at IS NOT NULL AND acknowledged_by_roster_id IS NOT NULL) OR
    (status <> 'acknowledged')
  )
);

CREATE INDEX IF NOT EXISTS business_service_requests_business_status_idx ON public.business_service_requests (business_id, status);
CREATE INDEX IF NOT EXISTS business_service_requests_type_idx ON public.business_service_requests (request_type, status);
CREATE INDEX IF NOT EXISTS business_service_requests_source_action_idx ON public.business_service_requests (source_action_id);

ALTER TABLE public.business_service_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_service_requests FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_service_requests FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_service_requests FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_service_requests FROM service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.business_service_requests TO service_role;

COMMENT ON TABLE public.business_service_requests IS
  'TODAY-2 -- structured pending requests for paid Guide Me / Let Leonix Handle It human work. Never Stripe/payment/scheduling/assignment -- this table only records the truthful request and a snapshot of the server-resolved entitlement context; commercial fulfillment happens entirely outside this package.';

-- =============================================================================================
-- Feature flag -- reuses the existing business_identity_flags table (Gate BCO-1C.1) rather than
-- creating a parallel flags table. Starts disabled, same as every prior gate's flag row.
-- =============================================================================================
INSERT INTO public.business_identity_flags (flag_key, enabled, emergency_disabled, pilot_user_ids)
VALUES ('business_diy_concierge', false, false, '{}')
ON CONFLICT (flag_key) DO NOTHING;

COMMIT;
