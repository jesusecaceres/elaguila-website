-- Program 4, Gate 4C -- AI Research Engine foundation.
--
-- Additive only: two new tables, no changes to any existing table/column/RPC. This package reads
-- its input exclusively from existing Program 4 Gate 4A tables (business_source_links,
-- business_source_files, business_consent_records) and the existing Living Business Book /
-- Health Map tables -- it never duplicates a business fact, a health assessment, or a source
-- link into a second copy. AI output is always draft/inference, persisted here as a briefing
-- draft only -- this migration creates no path that writes directly to business_facts.
--
-- Every table is server-only (read/written exclusively via getAdminSupabase(), the service-role
-- client). RLS is enabled with zero policies on every table (deny-all for anon/authenticated),
-- matching the Gate 4A / Living Business Book / Health Map / Stewardship Engine precedent
-- exactly. REVOKE ALL FROM PUBLIC, anon, authenticated, AND service_role, then an explicit narrow
-- GRANT SELECT, INSERT, UPDATE, DELETE to service_role only.
--
-- Provider doctrine (LOCKED V1): Gemini is the only live AI provider. provider_key/model_key are
-- persisted as plain text for audit purposes only -- no API key or other secret is ever written
-- to input_snapshot or cost_metadata (enforced at the application layer in
-- app/lib/business/aiResearch/geminiProvider.ts; never logged, never persisted here).
--
-- Dependency order:
--   1. public.business_ai_research_runs
--   2. public.business_ai_briefing_drafts   (references business_ai_research_runs)

BEGIN;

-- =============================================================================================
-- 1. business_ai_research_runs -- one bounded AI research/synthesis invocation. Terminal rows
-- (completed/failed/cancelled) are never mutated after creation by the application layer -- a
-- re-run always creates a new run row (see app/lib/business/aiResearch/repository.ts).
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.business_ai_research_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,

  provider_key text NOT NULL CHECK (char_length(btrim(provider_key)) > 0),
  model_key text NOT NULL CHECK (char_length(btrim(model_key)) > 0),
  template_version text NOT NULL CHECK (char_length(btrim(template_version)) > 0),
  input_snapshot jsonb NOT NULL,
  input_hash text NOT NULL CHECK (char_length(btrim(input_hash)) > 0),
  source_link_ids uuid[] NOT NULL DEFAULT '{}',
  source_file_ids uuid[] NOT NULL DEFAULT '{}',

  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
  failure_code text NULL,
  failure_reason text NULL,
  cost_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

  triggered_actor_type text NOT NULL CHECK (triggered_actor_type IN ('staff', 'owner')),
  triggered_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  triggered_by_auth_user_id uuid NOT NULL,
  triggered_by_email text NOT NULL,
  triggered_by_role text NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz NULL,
  completed_at timestamptz NULL,

  CONSTRAINT business_ai_research_runs_actor_chk CHECK (
    (triggered_actor_type = 'staff' AND triggered_by_roster_id IS NOT NULL) OR
    (triggered_actor_type = 'owner' AND triggered_by_roster_id IS NULL)
  ),
  CONSTRAINT business_ai_research_runs_completed_chk CHECK (status <> 'completed' OR completed_at IS NOT NULL),
  CONSTRAINT business_ai_research_runs_failed_chk CHECK (status <> 'failed' OR (failure_code IS NOT NULL AND completed_at IS NOT NULL)),
  CONSTRAINT business_ai_research_runs_running_chk CHECK (status NOT IN ('running', 'completed', 'failed') OR started_at IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS business_ai_research_runs_business_created_idx ON public.business_ai_research_runs (business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS business_ai_research_runs_status_idx ON public.business_ai_research_runs (status);
CREATE INDEX IF NOT EXISTS business_ai_research_runs_provider_model_idx ON public.business_ai_research_runs (provider_key, model_key);
CREATE INDEX IF NOT EXISTS business_ai_research_runs_input_hash_idx ON public.business_ai_research_runs (input_hash);

ALTER TABLE public.business_ai_research_runs ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_ai_research_runs FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_ai_research_runs FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_ai_research_runs FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_ai_research_runs FROM service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.business_ai_research_runs TO service_role;

COMMENT ON TABLE public.business_ai_research_runs IS
  'Program 4, Gate 4C -- one bounded AI research/synthesis invocation. Terminal rows (completed/failed/cancelled) are never mutated after creation by the application layer -- a re-run always creates a new row. Never persists a secret in input_snapshot or cost_metadata.';

-- =============================================================================================
-- 2. business_ai_briefing_drafts -- the structured briefing output. Draft/inference only --
-- never a confirmed fact. Promotion into business_facts/business_evidence/business_unknowns/
-- business_contradictions happens exclusively through the existing Living Business Book
-- repository functions, called from the Gate 4D briefing-review API -- this table is never
-- itself the source of a confirmed fact.
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.business_ai_briefing_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  research_run_id uuid NOT NULL REFERENCES public.business_ai_research_runs(id) ON DELETE CASCADE,

  schema_version text NOT NULL CHECK (char_length(btrim(schema_version)) > 0),
  summary_es text NOT NULL CHECK (char_length(btrim(summary_es)) > 0),
  summary_en text NOT NULL CHECK (char_length(btrim(summary_en)) > 0),
  strengths jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(strengths) = 'array'),
  opportunities jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(opportunities) = 'array'),
  contradictions jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(contradictions) = 'array'),
  unknowns jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(unknowns) = 'array'),
  limitations jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(limitations) = 'array'),

  review_status text NOT NULL DEFAULT 'draft' CHECK (review_status IN (
    'draft', 'staff_reviewed', 'partially_promoted', 'fully_promoted', 'rejected', 'superseded'
  )),
  reviewed_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  reviewed_by_auth_user_id uuid NULL,
  reviewed_by_email text NULL,
  reviewed_by_role text NULL,
  reviewed_at timestamptz NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Atomic review attribution: either every reviewed_* column is NULL (still draft) or every one
  -- is a real, nonblank value. Draft can never carry partial/complete review attribution.
  CONSTRAINT business_ai_briefing_drafts_review_atomic_chk CHECK (
    (
      reviewed_by_roster_id IS NULL AND reviewed_by_auth_user_id IS NULL AND
      reviewed_by_email IS NULL AND reviewed_by_role IS NULL AND reviewed_at IS NULL
    ) OR (
      reviewed_by_roster_id IS NOT NULL AND reviewed_by_auth_user_id IS NOT NULL AND
      reviewed_by_email IS NOT NULL AND char_length(btrim(reviewed_by_email)) > 0 AND
      reviewed_by_role IS NOT NULL AND char_length(btrim(reviewed_by_role)) > 0 AND
      reviewed_at IS NOT NULL
    )
  ),
  CONSTRAINT business_ai_briefing_drafts_draft_no_review_chk CHECK (
    review_status <> 'draft' OR (
      reviewed_by_roster_id IS NULL AND reviewed_by_auth_user_id IS NULL AND
      reviewed_by_email IS NULL AND reviewed_by_role IS NULL AND reviewed_at IS NULL
    )
  ),
  CONSTRAINT business_ai_briefing_drafts_reviewed_requires_attribution_chk CHECK (
    review_status = 'draft' OR (
      reviewed_by_roster_id IS NOT NULL AND reviewed_by_auth_user_id IS NOT NULL AND
      reviewed_by_email IS NOT NULL AND reviewed_by_role IS NOT NULL AND reviewed_at IS NOT NULL
    )
  )
);

-- One current (non-superseded) briefing draft per research run.
CREATE UNIQUE INDEX IF NOT EXISTS business_ai_briefing_drafts_one_per_run_idx
  ON public.business_ai_briefing_drafts (research_run_id)
  WHERE review_status <> 'superseded';

CREATE INDEX IF NOT EXISTS business_ai_briefing_drafts_business_created_idx ON public.business_ai_briefing_drafts (business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS business_ai_briefing_drafts_review_status_idx ON public.business_ai_briefing_drafts (review_status);

ALTER TABLE public.business_ai_briefing_drafts ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_ai_briefing_drafts FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_ai_briefing_drafts FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_ai_briefing_drafts FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_ai_briefing_drafts FROM service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.business_ai_briefing_drafts TO service_role;

COMMENT ON TABLE public.business_ai_briefing_drafts IS
  'Program 4, Gate 4C/4D -- structured AI briefing output. Draft/inference only -- never a confirmed fact. Promotion into the Living Business Book happens exclusively through the existing Living Book repository functions, called from the Gate 4D briefing-review API.';

-- =============================================================================================
-- Feature flag -- reuses the existing business_identity_flags table (Gate BCO-1C.1) rather than
-- creating a parallel flags table. Starts disabled, same as every prior gate's flag row.
-- =============================================================================================
INSERT INTO public.business_identity_flags (flag_key, enabled, emergency_disabled, pilot_user_ids)
VALUES ('field_discovery_ai_research', false, false, '{}')
ON CONFLICT (flag_key) DO NOTHING;

COMMIT;
