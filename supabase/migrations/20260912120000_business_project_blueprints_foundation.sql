-- Client Discovery & Project Blueprint Engine, Gate 5 — canonical, versioned Website Project
-- Blueprint persistence. Purely additive: ONE new table, no existing table/column/policy touched.
--
-- Reuse audit (see this gate's own first_inspection): this migration deliberately does NOT
-- duplicate any existing canonical system —
--   - Creative Studio (business_creative_jobs, Program 6) is a narrow AI-image/print short-form
--     creative pipeline (magazine ads, flyers, logo directions, 30-day campaign plans) — never a
--     legitimate execution destination for a full multi-page website build. Not reused, not copied.
--   - No generic business_projects/business_tasks/business_work_orders table exists anywhere in
--     this schema (confirmed by direct inspection of every prior migration) — this table is
--     genuinely new ground, not a duplicate of something already built.
--   - Promise Keeper (business_commitments) has no generic sourceType/sourceId linking mechanism
--     and is not extended here; a blueprint's own "build handoff" state lives on THIS table instead
--     of forcing a mismatched link into Promise Keeper's closed meeting/recommendation/proposal
--     source fields.
--   - Discovery truth itself stays in business_project_discovery_items (Gate 1) — a blueprint
--     VERSION is an immutable snapshot (packet_json + markdown_snapshot) taken FROM that truth at
--     generation time, never a live view of it and never a second truth store for ongoing capture.
--   - The approved WebsiteArchitectureDecisionPacket (Gate 4) is embedded inside packet_json as
--     part of the snapshot, never re-fetched live from discovery items after approval — this is
--     exactly what makes an APPROVED_FOR_BUILD version immutable.
--
-- One table, minimal version/history linkage (self-referencing supersedes_blueprint_id), and a
-- small "build handoff" state living on the row itself — never a second project-management system.
CREATE TABLE IF NOT EXISTS public.business_project_blueprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  discovery_id uuid NOT NULL,
  project_intent_id uuid NOT NULL,

  -- Only "website" is ever written by Gate 5; the column is free text (not a narrow CHECK) so a
  -- later gate's specialized blueprint types (logo, print, campaign — MD Gate 6) can reuse this
  -- same table without a migration, matching the project_type_registry's own "evolves in code"
  -- convention rather than a hardcoded enum here.
  blueprint_type text NOT NULL DEFAULT 'website' CHECK (char_length(btrim(blueprint_type)) > 0),

  version integer NOT NULL CHECK (version > 0),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'internal_review', 'client_confirmation_needed', 'approved_for_build', 'superseded'
  )),

  -- The full structured WebsiteProjectBlueprintPacket (includes the embedded approved
  -- WebsiteArchitectureDecisionPacket) and its deterministic Markdown rendering, both frozen at
  -- generation time — MD <versioning>: "Once APPROVED_FOR_BUILD, later discovery edits must NOT
  -- silently mutate that version."
  packet_json jsonb NOT NULL,
  markdown_snapshot text NOT NULL CHECK (char_length(btrim(markdown_snapshot)) > 0),

  -- Deterministic SHA-256 fingerprint of the structured truth this version was generated from (MD
  -- <staleness>: "Prefer a deterministic input fingerprint/hash... Do not compare raw timestamps").
  input_fingerprint text NOT NULL CHECK (char_length(input_fingerprint) = 64),

  discovery_catalog_version text NOT NULL,
  platform_registry_version text NOT NULL,

  created_actor_type text NOT NULL CHECK (created_actor_type IN ('staff', 'owner')),
  created_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  created_by_auth_user_id uuid NOT NULL,
  created_by_email text NOT NULL,
  created_by_role text NOT NULL,

  -- Internal review (MD <internal_review>) — a lighter-weight staff confirmation step, distinct
  -- from the final build approval below.
  reviewed_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  reviewed_by_auth_user_id uuid NULL,
  reviewed_by_email text NULL,
  reviewed_by_role text NULL,
  reviewed_at timestamptz NULL,

  approved_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  approved_by_auth_user_id uuid NULL,
  approved_by_email text NULL,
  approved_by_role text NULL,
  approved_at timestamptz NULL,

  supersedes_blueprint_id uuid NULL,

  -- Build handoff (MD <build_handoff>) — the smallest canonical record representing "blueprint
  -- approved, execution destination pending/assigned" without a whole project-management system.
  -- Only ever meaningful once status = 'approved_for_build'.
  handoff_status text NOT NULL DEFAULT 'not_started' CHECK (handoff_status IN (
    'not_started', 'pending_assignment', 'assigned', 'in_progress', 'complete'
  )),
  handoff_assignee_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  handoff_due_date date NULL,
  handoff_notes text NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_project_blueprints_id_business_id_uk UNIQUE (id, business_id),
  CONSTRAINT business_project_blueprints_intent_version_uk UNIQUE (project_intent_id, version),

  CONSTRAINT business_project_blueprints_actor_chk CHECK (
    (created_actor_type = 'staff' AND created_by_roster_id IS NOT NULL) OR
    (created_actor_type = 'owner' AND created_by_roster_id IS NULL)
  ),
  CONSTRAINT business_project_blueprints_reviewed_pair_chk CHECK (
    (reviewed_at IS NULL AND reviewed_by_auth_user_id IS NULL) OR
    (reviewed_at IS NOT NULL AND reviewed_by_auth_user_id IS NOT NULL)
  ),
  CONSTRAINT business_project_blueprints_approved_pair_chk CHECK (
    (approved_at IS NULL AND approved_by_auth_user_id IS NULL) OR
    (approved_at IS NOT NULL AND approved_by_auth_user_id IS NOT NULL)
  ),
  CONSTRAINT business_project_blueprints_approved_requires_status_chk CHECK (
    (status = 'approved_for_build' AND approved_at IS NOT NULL) OR
    (status != 'approved_for_build')
  ),

  CONSTRAINT business_project_blueprints_discovery_same_business_fk
    FOREIGN KEY (discovery_id, business_id)
    REFERENCES public.business_project_discoveries(id, business_id) ON DELETE CASCADE,
  CONSTRAINT business_project_blueprints_intent_same_business_fk
    FOREIGN KEY (project_intent_id, business_id)
    REFERENCES public.business_project_discovery_intents(id, business_id) ON DELETE CASCADE,
  -- Self-referencing version history — SET NULL on delete rather than CASCADE, so removing a
  -- newer version (should essentially never happen) never silently deletes the version it
  -- superseded.
  CONSTRAINT business_project_blueprints_supersedes_fk
    FOREIGN KEY (supersedes_blueprint_id) REFERENCES public.business_project_blueprints(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS business_project_blueprints_business_created_idx ON public.business_project_blueprints (business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS business_project_blueprints_intent_version_idx ON public.business_project_blueprints (project_intent_id, version DESC);
CREATE INDEX IF NOT EXISTS business_project_blueprints_status_idx ON public.business_project_blueprints (status);
CREATE INDEX IF NOT EXISTS business_project_blueprints_discovery_idx ON public.business_project_blueprints (discovery_id);

ALTER TABLE public.business_project_blueprints ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_project_blueprints FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_project_blueprints FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_project_blueprints FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_project_blueprints FROM service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.business_project_blueprints TO service_role;

COMMENT ON TABLE public.business_project_blueprints IS
  'Client Discovery & Project Blueprint Engine, Gate 5 — versioned, immutable-once-approved Website Project Blueprint snapshots (structured packet + deterministic Markdown). One row per generated version; APPROVED_FOR_BUILD versions are never mutated, only superseded by a new version.';
