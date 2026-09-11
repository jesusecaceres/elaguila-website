-- Client Discovery & Project Blueprint Engine, Gate 7 — Client Review + QA + Launch/Handoff.
-- Purely additive: two new small tables, plus a narrow set of nullable release/handoff-completion
-- columns on the EXISTING business_project_blueprints table. No table dropped, no column removed,
-- no existing row's meaning changed.
--
-- Reuse audit (this gate's own first_inspection):
--   - business_project_blueprints (Gate 5/6) remains the ONE blueprint store — this migration adds
--     only released_at/released_by_*/final_destination_url/handoff_completed_at/
--     handoff_completed_by_* (MD <release_event>: "a minimal completion metadata set may live with
--     the Blueprint/execution link... do not build a new release-management subsystem"). The
--     existing handoff_status/handoff_assignee_roster_id/handoff_due_date/handoff_notes columns
--     from Gate 5 already represent NOT_STARTED -> PENDING_ASSIGNMENT -> ASSIGNED -> IN_PROGRESS ->
--     COMPLETE; "DELIVERED" is represented by released_at being set, never a 6th handoff_status
--     value — inspected and confirmed sufficient, no "Website Project v2".
--   - business_project_blueprint_check_items is ONE discriminated table (kind: qa/launch/handoff)
--     rather than three near-identical tables — QA/Launch/Handoff items share the exact same shape
--     (item key/label/category/criticality/status/note/evidence/checked-by/checked-at) and this
--     gate's own frozen-label doctrine (checklist_snapshot_integrity) applies identically to all
--     three. A discriminated union column is the smallest sound model, per this gate's own
--     <qa_checklist_model> guidance.
--   - business_project_blueprint_feedback is genuinely new ground — no existing table represents
--     "a piece of client feedback about a specific blueprint field/section." Gate 1's discovery
--     items/events were considered and rejected: feedback is about a FROZEN blueprint snapshot, not
--     live discovery truth, and Gate 1's own append-only event log has no field/section reference
--     or approval-state columns.
--   - Promise Keeper (business_commitments) is NOT extended here at the schema level — Gate 6 left
--     it untouched because no concrete commitment existed yet; Gate 7 creates REAL commitments only
--     when a concrete promise is captured, and links back via a nullable linked_commitment_id
--     column on the feedback/check-item row itself (mirroring Growth Solution's own
--     linked_commitment_id precedent), never a change to Promise Keeper's own closed source fields.
--   - No new asset/file store: QA evidence reuses business_source_files via a bare (non-composite)
--     FK, mirroring Gate 1's own business_project_discovery_sources.business_source_file_id
--     precedent exactly.
--
-- No CREATE POLICY anywhere (deny-all + explicit service_role grant only, matching every prior
-- migration in this domain). No remote application in this gate.

-- =================================================================================================
-- A. business_project_blueprints — minimal release/handoff-completion metadata (MD <release_event>).
-- =================================================================================================
ALTER TABLE public.business_project_blueprints
  ADD COLUMN IF NOT EXISTS released_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS released_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  ADD COLUMN IF NOT EXISTS released_by_auth_user_id uuid NULL,
  ADD COLUMN IF NOT EXISTS released_by_email text NULL,
  ADD COLUMN IF NOT EXISTS released_by_role text NULL,
  ADD COLUMN IF NOT EXISTS final_destination_url text NULL,
  ADD COLUMN IF NOT EXISTS handoff_completed_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS handoff_completed_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  ADD COLUMN IF NOT EXISTS handoff_completed_by_auth_user_id uuid NULL,
  ADD COLUMN IF NOT EXISTS handoff_completed_by_email text NULL,
  ADD COLUMN IF NOT EXISTS handoff_completed_by_role text NULL;

-- =================================================================================================
-- B. business_project_blueprint_feedback — client review feedback, always tied to one frozen
-- blueprint VERSION (never the "latest" pointer — a superseded version's feedback stays historical).
-- =================================================================================================
CREATE TABLE IF NOT EXISTS public.business_project_blueprint_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  blueprint_id uuid NOT NULL,
  project_intent_id uuid NOT NULL,

  section_key text NULL,
  field_key text NULL,

  feedback_type text NOT NULL CHECK (feedback_type IN (
    'approved', 'change_requested', 'needs_clarification', 'general'
  )),
  feedback_text text NOT NULL CHECK (char_length(btrim(feedback_text)) > 0),

  -- Truthfully separate from feedback_type: a general note can carry no approval signal at all.
  client_approved boolean NULL,

  source_meeting_id uuid NULL,
  linked_commitment_id uuid NULL REFERENCES public.business_commitments(id) ON DELETE SET NULL,

  captured_actor_type text NOT NULL CHECK (captured_actor_type IN ('staff', 'owner')),
  captured_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  captured_by_auth_user_id uuid NOT NULL,
  captured_by_email text NOT NULL,
  captured_by_role text NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_project_blueprint_feedback_captured_actor_chk CHECK (
    (captured_actor_type = 'staff' AND captured_by_roster_id IS NOT NULL) OR
    (captured_actor_type = 'owner' AND captured_by_roster_id IS NULL)
  ),

  CONSTRAINT business_project_blueprint_feedback_blueprint_business_fk
    FOREIGN KEY (blueprint_id, business_id)
    REFERENCES public.business_project_blueprints(id, business_id) ON DELETE CASCADE,
  CONSTRAINT business_project_blueprint_feedback_intent_business_fk
    FOREIGN KEY (project_intent_id, business_id)
    REFERENCES public.business_project_discovery_intents(id, business_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS business_project_blueprint_feedback_blueprint_idx ON public.business_project_blueprint_feedback (blueprint_id, created_at DESC);
CREATE INDEX IF NOT EXISTS business_project_blueprint_feedback_business_idx ON public.business_project_blueprint_feedback (business_id);

ALTER TABLE public.business_project_blueprint_feedback ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_project_blueprint_feedback FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_project_blueprint_feedback FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_project_blueprint_feedback FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_project_blueprint_feedback FROM service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.business_project_blueprint_feedback TO service_role;

COMMENT ON TABLE public.business_project_blueprint_feedback IS
  'Client Discovery & Project Blueprint Engine, Gate 7 — client review feedback tied to one frozen blueprint version. Never a comments platform: one row per feedback item, no threads/reactions/mentions.';

-- =================================================================================================
-- C. business_project_blueprint_check_items — QA / Launch / Handoff, ONE discriminated table.
-- Snapshot fields (label/category/criticality) are frozen at generation time per blueprint VERSION
-- — a superseded version's checklist stays historical and is never rewritten by later generator
-- logic changes (MD <checklist_snapshot_integrity>).
-- =================================================================================================
CREATE TABLE IF NOT EXISTS public.business_project_blueprint_check_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  blueprint_id uuid NOT NULL,
  project_intent_id uuid NOT NULL,

  kind text NOT NULL CHECK (kind IN ('qa', 'launch', 'handoff')),
  item_key text NOT NULL CHECK (char_length(btrim(item_key)) > 0),
  category text NULL,

  -- Frozen snapshot of the label at the moment this blueprint version was generated — never
  -- silently changed because a future generator revises its own item wording.
  label_es text NOT NULL CHECK (char_length(btrim(label_es)) > 0),
  label_en text NOT NULL CHECK (char_length(btrim(label_en)) > 0),

  -- Release-blocking only ever applies to kind='qa'; a launch/handoff item's own "required" nature
  -- is represented by release_blocking too (a required launch item blocks release the same way a
  -- release-critical QA item does) — one shared boolean, never two parallel criticality concepts.
  release_blocking boolean NOT NULL DEFAULT false,

  status text NOT NULL DEFAULT 'not_checked' CHECK (status IN (
    'not_checked', 'pending', 'pass', 'complete', 'fail', 'blocked', 'not_applicable'
  )),
  note text NULL,
  evidence_source_file_id uuid NULL REFERENCES public.business_source_files(id) ON DELETE SET NULL,
  evidence_url text NULL,

  linked_commitment_id uuid NULL REFERENCES public.business_commitments(id) ON DELETE SET NULL,

  checked_actor_type text NULL CHECK (checked_actor_type IS NULL OR checked_actor_type IN ('staff', 'owner')),
  checked_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  checked_by_auth_user_id uuid NULL,
  checked_by_email text NULL,
  checked_by_role text NULL,
  checked_at timestamptz NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- A status other than the two "untouched" defaults requires real checker attribution — a status
  -- can never silently read as checked without a real actor and timestamp behind it.
  CONSTRAINT business_project_blueprint_check_items_checked_pair_chk CHECK (
    (status IN ('not_checked', 'pending') AND checked_at IS NULL) OR
    (status NOT IN ('not_checked', 'pending') AND checked_at IS NOT NULL AND checked_actor_type IS NOT NULL)
  ),

  CONSTRAINT business_project_blueprint_check_items_blueprint_business_fk
    FOREIGN KEY (blueprint_id, business_id)
    REFERENCES public.business_project_blueprints(id, business_id) ON DELETE CASCADE,
  CONSTRAINT business_project_blueprint_check_items_intent_business_fk
    FOREIGN KEY (project_intent_id, business_id)
    REFERENCES public.business_project_discovery_intents(id, business_id) ON DELETE CASCADE,

  -- One row per (blueprint version, kind, item key) — regenerating the same version's checklist is
  -- an upsert, never a duplicate.
  CONSTRAINT business_project_blueprint_check_items_uk UNIQUE (blueprint_id, kind, item_key)
);

CREATE INDEX IF NOT EXISTS business_project_blueprint_check_items_blueprint_idx ON public.business_project_blueprint_check_items (blueprint_id, kind);
CREATE INDEX IF NOT EXISTS business_project_blueprint_check_items_business_idx ON public.business_project_blueprint_check_items (business_id);

ALTER TABLE public.business_project_blueprint_check_items ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_project_blueprint_check_items FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_project_blueprint_check_items FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_project_blueprint_check_items FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_project_blueprint_check_items FROM service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.business_project_blueprint_check_items TO service_role;

COMMENT ON TABLE public.business_project_blueprint_check_items IS
  'Client Discovery & Project Blueprint Engine, Gate 7 — QA/Launch/Handoff checklist items, discriminated by kind, snapshotted from one frozen blueprint version at generation time. Never a global editable QA-definition table; never one table per project type.';
