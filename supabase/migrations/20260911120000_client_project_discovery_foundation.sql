-- Client Discovery & Project Blueprint Engine, Gate 1 — canonical "Client Project Discovery"
-- data model. Purely additive: 6 new tables, no existing table/column/policy touched.
--
-- Reuse audit (see this gate's final report for the full inspection): this migration
-- deliberately does NOT duplicate any existing canonical system —
--   - business truth stays in business_facts/business_unknowns/business_contradictions
--     (Living Business Book, 20260804180000). A discovery item is never a fact; promotion
--     remains a separate, existing, human-gated pathway (upsertFact/confirmFact).
--   - business_discovery_sessions/business_discovery_answers (also in the Living Business Book
--     migration) are a DIFFERENT, pre-existing, generic business-profile-questionnaire concept
--     ("owner_questionnaire", "staff_interview", etc.) — NOT the same as this gate's PROJECT-scoped
--     discovery (website/logo/print/campaign leading to a project blueprint). Named
--     "business_project_discovery_*" throughout, specifically to avoid confusion with the
--     pre-existing "business_discovery_*" tables.
--   - meetings stay in business_meetings/business_meeting_notes (20260810140000) — referenced by
--     an optional same-business composite FK, never copied.
--   - files/assets stay in business_source_files (20260810120000) — referenced by a plain FK (that
--     table has no UNIQUE(id, business_id) to compose against; same-business is verified at the
--     repository layer instead, matching the accepted fallback tier already used elsewhere in this
--     codebase for evidence-style references), never a second blob store.
--   - Growth Engine assessments/solutions and the Opportunity domain are referenced by real
--     same-business composite FKs (all three already carry UNIQUE(id, business_id) from their own
--     foundations), matching the exact pattern Growth Engine Gate A established.

-- =================================================================================================
-- 1. business_project_discoveries — the shared-truth parent container for one client engagement.
-- =================================================================================================
CREATE TABLE IF NOT EXISTS public.business_project_discoveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,

  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN (
    'in_progress', 'needs_client_information', 'needs_leonix_decision', 'ready_for_blueprint', 'blueprint_created'
  )),
  title text NOT NULL CHECK (char_length(btrim(title)) > 0),
  -- The dominant/initial project type for this engagement. Individual deliverables (which may
  -- differ from this) live in business_project_discovery_intents below — most discoveries have
  -- exactly one intent matching this value; a multi-project engagement has several.
  primary_project_type text NOT NULL,
  language text NOT NULL DEFAULT 'es' CHECK (language IN ('es', 'en')),

  -- Upstream provenance (MD <growth_engine_relationship>) — at most one is normally populated,
  -- never a fabricated cross-business link. All four already carry UNIQUE(id, business_id) on
  -- their own foundation tables, so these are real same-business composite FKs, not bare ids.
  source_growth_assessment_id uuid NULL,
  source_growth_solution_id uuid NULL,
  source_opportunity_id uuid NULL,
  source_meeting_id uuid NULL,

  assigned_staff_roster_id uuid NULL REFERENCES public.admin_team_members(id),

  created_actor_type text NOT NULL CHECK (created_actor_type IN ('staff', 'owner')),
  created_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  created_by_auth_user_id uuid NOT NULL,
  created_by_email text NOT NULL,
  created_by_role text NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz NULL,

  CONSTRAINT business_project_discoveries_id_business_id_uk UNIQUE (id, business_id),

  CONSTRAINT business_project_discoveries_actor_chk CHECK (
    (created_actor_type = 'staff' AND created_by_roster_id IS NOT NULL) OR
    (created_actor_type = 'owner' AND created_by_roster_id IS NULL)
  ),
  CONSTRAINT business_project_discoveries_completed_requires_status_chk CHECK (
    status IN ('ready_for_blueprint', 'blueprint_created') OR completed_at IS NULL
  ),

  CONSTRAINT business_project_discoveries_growth_assessment_same_business_fk
    FOREIGN KEY (source_growth_assessment_id, business_id)
    REFERENCES public.business_growth_assessments(id, business_id) ON DELETE SET NULL,
  CONSTRAINT business_project_discoveries_growth_solution_same_business_fk
    FOREIGN KEY (source_growth_solution_id, business_id)
    REFERENCES public.business_growth_solutions(id, business_id) ON DELETE SET NULL,
  CONSTRAINT business_project_discoveries_opportunity_same_business_fk
    FOREIGN KEY (source_opportunity_id, business_id)
    REFERENCES public.business_creative_opportunities(id, business_id) ON DELETE SET NULL,
  CONSTRAINT business_project_discoveries_meeting_same_business_fk
    FOREIGN KEY (source_meeting_id, business_id)
    REFERENCES public.business_meetings(id, business_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS business_project_discoveries_business_created_idx ON public.business_project_discoveries (business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS business_project_discoveries_status_idx ON public.business_project_discoveries (status);
CREATE INDEX IF NOT EXISTS business_project_discoveries_primary_type_idx ON public.business_project_discoveries (primary_project_type);

ALTER TABLE public.business_project_discoveries ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_project_discoveries FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_project_discoveries FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_project_discoveries FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_project_discoveries FROM service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.business_project_discoveries TO service_role;

COMMENT ON TABLE public.business_project_discoveries IS
  'Client Discovery & Project Blueprint Engine, Gate 1 — one client engagement''s shared truth container. Distinct from (and never confused with) the pre-existing generic business_discovery_sessions.';

-- =================================================================================================
-- 2. business_project_discovery_intents — multi-project foundation (MD <multi_project_foundation>).
-- One discovery may identify several deliverables (logo + website + cards); each intent is a
-- candidate project sharing the parent discovery's truth, with its own type/status.
-- =================================================================================================
CREATE TABLE IF NOT EXISTS public.business_project_discovery_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  discovery_id uuid NOT NULL,

  project_type text NOT NULL,
  project_subtype text NULL,
  other_label text NULL,
  title text NOT NULL CHECK (char_length(btrim(title)) > 0),
  status text NOT NULL DEFAULT 'candidate' CHECK (status IN ('candidate', 'confirmed', 'declined', 'converted_to_project')),

  -- Gate 2 cleanup: every other table in this domain (discoveries, items, sources, consents)
  -- carries real creator attribution on the row itself, not only in the append-only event log.
  -- Intents were the one exception at Gate 1 — closed here for consistency, same shape as
  -- business_project_discoveries' own actor columns (never 'system': an intent, like a discovery,
  -- is always something a real person identified, not an automated process).
  created_actor_type text NOT NULL CHECK (created_actor_type IN ('staff', 'owner')),
  created_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  created_by_auth_user_id uuid NOT NULL,
  created_by_email text NOT NULL,
  created_by_role text NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_project_discovery_intents_id_business_id_uk UNIQUE (id, business_id),
  CONSTRAINT business_project_discovery_intents_discovery_same_business_fk
    FOREIGN KEY (discovery_id, business_id)
    REFERENCES public.business_project_discoveries(id, business_id) ON DELETE CASCADE,
  CONSTRAINT business_project_discovery_intents_other_label_chk CHECK (
    project_type <> 'other' OR other_label IS NOT NULL
  ),
  CONSTRAINT business_project_discovery_intents_actor_chk CHECK (
    (created_actor_type = 'staff' AND created_by_roster_id IS NOT NULL) OR
    (created_actor_type = 'owner' AND created_by_roster_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS business_project_discovery_intents_discovery_idx ON public.business_project_discovery_intents (discovery_id);
CREATE INDEX IF NOT EXISTS business_project_discovery_intents_business_idx ON public.business_project_discovery_intents (business_id);

ALTER TABLE public.business_project_discovery_intents ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_project_discovery_intents FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_project_discovery_intents FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_project_discovery_intents FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_project_discovery_intents FROM service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.business_project_discovery_intents TO service_role;

COMMENT ON TABLE public.business_project_discovery_intents IS
  'Gate 1 — candidate deliverables identified within one discovery (e.g. logo + website + cards from one client conversation). Project execution objects (Creative Studio jobs, Growth campaigns) are created later, in a future gate, from a confirmed intent — never built here.';

-- =================================================================================================
-- 3. business_project_discovery_items — extensible structured answers (MD <data_model> B).
-- Never one column per question — a principled key/value/classification model instead. May attach
-- to the whole discovery (project_intent_id NULL, shared truth) or to one specific intent
-- (project-specific requirement).
-- =================================================================================================
CREATE TABLE IF NOT EXISTS public.business_project_discovery_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  discovery_id uuid NOT NULL,
  project_intent_id uuid NULL,

  section text NOT NULL CHECK (char_length(btrim(section)) > 0),
  field_key text NOT NULL CHECK (char_length(btrim(field_key)) > 0),
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  display_value text NULL,
  value_type text NOT NULL DEFAULT 'text' CHECK (value_type IN (
    'text', 'number', 'boolean', 'date', 'url', 'list', 'asset_ref', 'choice', 'other'
  )),

  -- MD <truth_contract> — never silently collapsed, exactly these 9 classes.
  truth_class text NOT NULL CHECK (truth_class IN (
    'client_confirmed', 'public_verified', 'staff_observation', 'ai_extracted',
    'needs_confirmation', 'unknown', 'client_preference', 'leonix_recommendation', 'technical_decision'
  )),
  -- MD <completeness_contract> — exactly these 7 classes.
  completeness_class text NOT NULL CHECK (completeness_class IN (
    'required_before_build', 'required_before_launch', 'helpful', 'optional',
    'not_applicable', 'needs_leonix_decision', 'needs_official_research'
  )),

  confirmation_state text NOT NULL DEFAULT 'unconfirmed' CHECK (confirmation_state IN ('unconfirmed', 'confirmed', 'rejected')),
  client_confirmed_at timestamptz NULL,

  captured_actor_type text NOT NULL CHECK (captured_actor_type IN ('staff', 'owner', 'system')),
  captured_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  captured_by_auth_user_id uuid NULL,
  captured_by_email text NULL,
  captured_by_role text NOT NULL,

  notes text NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_project_discovery_items_id_business_id_uk UNIQUE (id, business_id),
  CONSTRAINT business_project_discovery_items_discovery_same_business_fk
    FOREIGN KEY (discovery_id, business_id)
    REFERENCES public.business_project_discoveries(id, business_id) ON DELETE CASCADE,
  CONSTRAINT business_project_discovery_items_intent_same_business_fk
    FOREIGN KEY (project_intent_id, business_id)
    REFERENCES public.business_project_discovery_intents(id, business_id) ON DELETE CASCADE,
  -- One (discovery, intent-or-shared, field) slot may exist only once — re-capturing overwrites
  -- via application-level upsert, never a silent duplicate row. NULLS NOT DISTINCT keeps this true
  -- for the shared (project_intent_id IS NULL) case too.
  CONSTRAINT business_project_discovery_items_unique_field UNIQUE NULLS NOT DISTINCT (discovery_id, project_intent_id, field_key),
  CONSTRAINT business_project_discovery_items_confirmed_atomic_chk CHECK (
    (confirmation_state = 'confirmed' AND client_confirmed_at IS NOT NULL) OR
    (confirmation_state <> 'confirmed' AND client_confirmed_at IS NULL)
  ),
  CONSTRAINT business_project_discovery_items_captured_actor_chk CHECK (
    (captured_actor_type = 'staff' AND captured_by_roster_id IS NOT NULL) OR
    (captured_actor_type = 'owner' AND captured_by_roster_id IS NULL) OR
    (captured_actor_type = 'system' AND captured_by_roster_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS business_project_discovery_items_discovery_idx ON public.business_project_discovery_items (discovery_id);
CREATE INDEX IF NOT EXISTS business_project_discovery_items_intent_idx ON public.business_project_discovery_items (project_intent_id);
CREATE INDEX IF NOT EXISTS business_project_discovery_items_completeness_idx ON public.business_project_discovery_items (discovery_id, completeness_class);
CREATE INDEX IF NOT EXISTS business_project_discovery_items_truth_class_idx ON public.business_project_discovery_items (truth_class);

ALTER TABLE public.business_project_discovery_items ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_project_discovery_items FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_project_discovery_items FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_project_discovery_items FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_project_discovery_items FROM service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.business_project_discovery_items TO service_role;

COMMENT ON TABLE public.business_project_discovery_items IS
  'Gate 1 — extensible discovery answers. NEVER a canonical Business Book fact: promotion to business_facts remains a separate, existing, human-gated action (upsertFact/confirmFact) performed after review, exactly like the existing Meeting Studio -> Living Book promotion path.';

-- =================================================================================================
-- 4. business_project_discovery_sources — evidence AND asset references (MD <data_model> C, E).
-- Combines "where did this come from" (a meeting, a research run, a growth assessment, a manual
-- claim) and "which canonical asset does this point at" (business_source_files) in one table,
-- since an asset reference is just one more kind of evidence — this avoids a second near-duplicate
-- table. Heterogeneous source_record_id has NO real FK (cannot compose one FK across many possible
-- target tables) — matches the exact, already-accepted business_growth_events entity_type/
-- entity_id precedent. business_source_file_id DOES get a real FK since it always points at one
-- specific table; business_source_files has no UNIQUE(id, business_id) to compose a same-business
-- FK against (untouched, unrelated-domain table), so same-business is verified at the repository
-- layer before insert, matching how business_evidence itself already references business_facts /
-- business_unknowns without a composite FK.
-- =================================================================================================
CREATE TABLE IF NOT EXISTS public.business_project_discovery_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  discovery_id uuid NOT NULL,
  item_id uuid NULL,

  source_type text NOT NULL CHECK (source_type IN (
    'business_fact', 'business_unknown', 'meeting', 'meeting_note', 'transcript_import',
    'research_run', 'growth_assessment', 'growth_solution', 'opportunity', 'asset', 'website_url', 'manual'
  )),
  source_record_id uuid NULL,
  business_source_file_id uuid NULL REFERENCES public.business_source_files(id) ON DELETE SET NULL,
  external_url text NULL,
  label text NULL,
  notes text NULL,

  created_actor_type text NOT NULL CHECK (created_actor_type IN ('staff', 'owner', 'system')),
  created_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  created_by_auth_user_id uuid NULL,
  created_by_email text NULL,
  created_by_role text NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_project_discovery_sources_discovery_same_business_fk
    FOREIGN KEY (discovery_id, business_id)
    REFERENCES public.business_project_discoveries(id, business_id) ON DELETE CASCADE,
  CONSTRAINT business_project_discovery_sources_item_same_business_fk
    FOREIGN KEY (item_id, business_id)
    REFERENCES public.business_project_discovery_items(id, business_id) ON DELETE CASCADE,
  CONSTRAINT business_project_discovery_sources_asset_requires_file_chk CHECK (
    source_type <> 'asset' OR business_source_file_id IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS business_project_discovery_sources_discovery_idx ON public.business_project_discovery_sources (discovery_id);
CREATE INDEX IF NOT EXISTS business_project_discovery_sources_item_idx ON public.business_project_discovery_sources (item_id);
CREATE INDEX IF NOT EXISTS business_project_discovery_sources_type_idx ON public.business_project_discovery_sources (source_type);

ALTER TABLE public.business_project_discovery_sources ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_project_discovery_sources FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_project_discovery_sources FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_project_discovery_sources FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_project_discovery_sources FROM service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.business_project_discovery_sources TO service_role;

COMMENT ON TABLE public.business_project_discovery_sources IS
  'Gate 1 — provenance references (evidence AND canonical asset links). Never duplicates the underlying record; source_record_id points at an existing canonical row by convention only (no cross-table FK possible), business_source_file_id is a real FK to the one canonical asset store.';

-- =================================================================================================
-- 5. business_project_discovery_consents — minimal consent/reference model (MD <data_model> F).
-- NOT a recording/transcription implementation — no recording or transcript reference column
-- exists yet. Reuses the exact same three-part consent vocabulary (type/state/method) Meeting
-- Studio's business_meeting_consents already established, applied to the new discovery parent
-- entity (a discovery is not always tied to a formal Meeting Studio meeting).
-- =================================================================================================
CREATE TABLE IF NOT EXISTS public.business_project_discovery_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  discovery_id uuid NOT NULL,

  consent_type text NOT NULL CHECK (consent_type IN ('notes', 'audio_recording', 'transcription', 'file_photo_review', 'followup_messages')),
  state text NOT NULL CHECK (state IN ('provided', 'declined', 'withdrawn')),
  method text NOT NULL CHECK (method IN ('verbal', 'written', 'digital_acknowledgment')),
  language text NOT NULL CHECK (language IN ('es', 'en')),
  scope_details jsonb NULL,

  recorded_actor_type text NOT NULL CHECK (recorded_actor_type IN ('staff', 'owner')),
  recorded_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  recorded_by_auth_user_id uuid NOT NULL,
  recorded_by_email text NOT NULL,
  recorded_by_role text NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_project_discovery_consents_discovery_same_business_fk
    FOREIGN KEY (discovery_id, business_id)
    REFERENCES public.business_project_discoveries(id, business_id) ON DELETE CASCADE,
  CONSTRAINT business_project_discovery_consents_actor_chk CHECK (
    (recorded_actor_type = 'staff' AND recorded_by_roster_id IS NOT NULL) OR
    (recorded_actor_type = 'owner' AND recorded_by_roster_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS business_project_discovery_consents_discovery_idx ON public.business_project_discovery_consents (discovery_id);

ALTER TABLE public.business_project_discovery_consents ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_project_discovery_consents FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_project_discovery_consents FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_project_discovery_consents FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_project_discovery_consents FROM service_role;
GRANT SELECT, INSERT ON TABLE public.business_project_discovery_consents TO service_role;

COMMENT ON TABLE public.business_project_discovery_consents IS
  'Gate 1 — append-only consent record for a discovery session. No recording/transcript reference column exists yet — that lands only when recording/transcription is actually implemented in a future gate.';

-- =================================================================================================
-- 6. business_project_discovery_events — append-only audit trail, matching business_growth_events.
-- =================================================================================================
CREATE TABLE IF NOT EXISTS public.business_project_discovery_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  discovery_id uuid NOT NULL,

  entity_type text NOT NULL CHECK (entity_type IN ('discovery', 'intent', 'item', 'consent', 'source')),
  entity_id uuid NOT NULL,
  event_type text NOT NULL,
  previous_state text NULL,
  new_state text NULL,
  source text NULL,
  note text NULL,

  event_actor_type text NOT NULL CHECK (event_actor_type IN ('staff', 'owner', 'system')),
  event_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  event_by_auth_user_id uuid NULL,
  event_by_role text NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_project_discovery_events_discovery_same_business_fk
    FOREIGN KEY (discovery_id, business_id)
    REFERENCES public.business_project_discoveries(id, business_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS business_project_discovery_events_discovery_idx ON public.business_project_discovery_events (discovery_id, created_at DESC);

ALTER TABLE public.business_project_discovery_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_project_discovery_events FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_project_discovery_events FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_project_discovery_events FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_project_discovery_events FROM service_role;
GRANT SELECT, INSERT ON TABLE public.business_project_discovery_events TO service_role;

COMMENT ON TABLE public.business_project_discovery_events IS
  'Gate 1 — append-only audit trail for the discovery domain, mirroring business_growth_events exactly (same entity_type/entity_id polymorphic convention, no real FK on entity_id since it spans 5 different parent kinds).';
