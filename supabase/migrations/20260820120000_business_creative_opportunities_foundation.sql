-- =================================================================================================
-- Package B — Contextual Opportunity / Sponsorship Bridge foundation.
--
-- Adds exactly one new table (business_creative_opportunities) plus one narrow, nullable,
-- backward-compatible column on the existing business_creative_jobs table so an approved
-- opportunity can traceably seed a Creative Studio job. No other Program 6/7 table is touched.
--
-- Doctrine enforced structurally:
-- - Human-reviewed only: lifecycle_state is a bounded enum with no "auto" state.
-- - No automated execution fields exist anywhere on this table (no outreach/pricing/contract
--   columns) — enforced by omission, not by a runtime check.
-- - Business-scoped, RLS-locked, staff/system-only writes — mirrors the exact conventions in
--   20260810160000_business_creative_studio_foundation.sql and 20260811170000_business_program7_foundation.sql.
-- - Append-only history is NOT required here (unlike provider_runs/reviews) because an
--   opportunity's lifecycle_state legitimately mutates in place (suggested -> reviewed ->
--   approved/dismissed -> creative_requested) — this mirrors business_creative_jobs' own mutable
--   status column, not the append-only tables.
-- =================================================================================================

-- =================================================================================================
-- A. business_creative_opportunities
-- =================================================================================================
CREATE TABLE IF NOT EXISTS public.business_creative_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,

  opportunity_type text NOT NULL CHECK (opportunity_type IN (
    'editorial_match', 'sponsored_feature', 'seasonal_campaign', 'category_feature', 'business_campaign'
  )),

  title_es text NOT NULL CHECK (char_length(btrim(title_es)) > 0),
  title_en text NOT NULL CHECK (char_length(btrim(title_en)) > 0),
  summary_es text NOT NULL CHECK (char_length(btrim(summary_es)) > 0),
  summary_en text NOT NULL CHECK (char_length(btrim(summary_en)) > 0),

  -- Array of { category, explanationEs, explanationEn } — human-readable reasons, never a bare score.
  match_reasons jsonb NOT NULL DEFAULT '[]',
  confidence text NOT NULL DEFAULT 'low' CHECK (confidence IN ('low', 'medium', 'high')),

  readiness_recommended boolean NOT NULL DEFAULT false,
  readiness_explanation_es text NOT NULL,
  readiness_explanation_en text NOT NULL,

  source_type text NOT NULL CHECK (source_type IN ('editorial_registry', 'seasonal_registry')),
  source_key text NOT NULL,
  source_title text NOT NULL,
  active_from timestamptz NULL,
  active_until timestamptz NULL,

  lifecycle_state text NOT NULL DEFAULT 'suggested' CHECK (lifecycle_state IN (
    'suggested', 'reviewed', 'approved', 'dismissed', 'creative_requested'
  )),

  created_actor_type text NOT NULL CHECK (created_actor_type IN ('staff', 'owner', 'system')),
  created_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  created_by_auth_user_id uuid NULL,
  created_by_role text NOT NULL,

  reviewed_at timestamptz NULL,
  reviewed_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  reviewed_by_auth_user_id uuid NULL,
  reviewed_by_role text NULL,
  review_note text NULL,

  -- Set only once lifecycle_state reaches 'creative_requested'. Composite FK added below, once
  -- business_creative_jobs' new column exists, to prevent cross-business linkage.
  source_opportunity_creative_job_id uuid NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_creative_opportunities_id_business_id_uk UNIQUE (id, business_id),

  -- Same actor-integrity convention as Program 6/7: staff rows carry a roster id, system rows never do.
  CONSTRAINT business_creative_opportunities_created_actor_chk CHECK (
    (created_actor_type = 'staff' AND created_by_roster_id IS NOT NULL) OR
    (created_actor_type = 'owner' AND created_by_roster_id IS NULL) OR
    (created_actor_type = 'system' AND created_by_roster_id IS NULL AND created_by_auth_user_id IS NULL)
  ),

  -- reviewed_* fields are only ever set together (never a partial review record).
  CONSTRAINT business_creative_opportunities_reviewed_atomic_chk CHECK (
    (reviewed_at IS NULL AND reviewed_by_roster_id IS NULL AND reviewed_by_auth_user_id IS NULL AND reviewed_by_role IS NULL) OR
    (reviewed_at IS NOT NULL AND reviewed_by_auth_user_id IS NOT NULL AND reviewed_by_role IS NOT NULL)
  ),

  -- creative_requested state requires the traceability link to actually be set, and vice versa.
  CONSTRAINT business_creative_opportunities_creative_requested_chk CHECK (
    (lifecycle_state = 'creative_requested') = (source_opportunity_creative_job_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS business_creative_opportunities_business_id_idx ON public.business_creative_opportunities (business_id);
CREATE INDEX IF NOT EXISTS business_creative_opportunities_lifecycle_state_idx ON public.business_creative_opportunities (lifecycle_state);

ALTER TABLE public.business_creative_opportunities ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_creative_opportunities FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_creative_opportunities FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_creative_opportunities FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_creative_opportunities FROM service_role;
-- Mutable (not append-only): lifecycle_state legitimately transitions in place, same as business_creative_jobs.status.
GRANT SELECT, INSERT, UPDATE ON TABLE public.business_creative_opportunities TO service_role;

COMMENT ON TABLE public.business_creative_opportunities IS
  'Package B — human-reviewed contextual editorial/sponsorship opportunity matches. No automated outreach, pricing, contract, or publish fields exist on this table by design. Approved != confirmed sponsor.';

-- =================================================================================================
-- B. business_creative_jobs.source_opportunity_id — narrow, nullable, backward-compatible.
-- Mirrors the existing source_recommendation_id / source_proposal_id columns exactly.
-- =================================================================================================
ALTER TABLE public.business_creative_jobs
  ADD COLUMN IF NOT EXISTS source_opportunity_id uuid NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'business_creative_jobs_source_opportunity_business_fk'
      AND table_name = 'business_creative_jobs'
  ) THEN
    ALTER TABLE public.business_creative_jobs
      ADD CONSTRAINT business_creative_jobs_source_opportunity_business_fk
      FOREIGN KEY (source_opportunity_id, business_id)
      REFERENCES public.business_creative_opportunities(id, business_id)
      ON DELETE RESTRICT;
  END IF;
END $$;

-- Now that business_creative_jobs.source_opportunity_id exists, add the reverse composite FK from
-- business_creative_opportunities.source_opportunity_creative_job_id back to it — this must match
-- the SAME business, preventing an opportunity from ever being marked as fulfilled by a Creative
-- Studio job belonging to a different business.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'business_creative_opportunities_creative_job_business_fk'
      AND table_name = 'business_creative_opportunities'
  ) THEN
    ALTER TABLE public.business_creative_opportunities
      ADD CONSTRAINT business_creative_opportunities_creative_job_business_fk
      FOREIGN KEY (source_opportunity_creative_job_id, business_id)
      REFERENCES public.business_creative_jobs(id, business_id)
      ON DELETE RESTRICT;
  END IF;
END $$;

-- =================================================================================================
-- C. Feature flag — reuses the existing business_identity_flags table/convention.
-- Default disabled, no pilot users, matching every prior Program 6/7 flag insert exactly.
-- =================================================================================================
INSERT INTO public.business_identity_flags (flag_key, enabled, emergency_disabled, pilot_user_ids)
VALUES ('business_creative_opportunities', false, false, '{}')
ON CONFLICT (flag_key) DO NOTHING;
