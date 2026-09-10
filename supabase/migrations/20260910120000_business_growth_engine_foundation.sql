-- =================================================================================================
-- Business Development & Growth Engine — Gate A: domain foundation.
--
-- Extends (does not replace) the existing Business Concierge domains: Living Business Book,
-- Health Map, Outreach/CRM, Meetings, Recommendations (business_recommendations), Opportunities
-- (business_creative_opportunities), Creative Studio (business_creative_jobs), Promise Keeper
-- (business_commitments), Advisor, Outcomes. No table in this migration duplicates any of those —
-- every cross-domain reference is a composite same-business foreign key to the existing table,
-- mirroring the exact precedent in 20260820120000_business_creative_opportunities_foundation.sql
-- (business_creative_jobs.source_opportunity_id <-> business_creative_opportunities
-- .source_opportunity_creative_job_id) and 20260810150000_business_proposal_promise_keeper_foundation.sql
-- (business_commitments.meeting_id/recommendation_id/proposal_id).
--
-- Business life-stage (idea/startup vs established) is deliberately NOT a new column anywhere —
-- the existing businesses.business_stage enum (planning_prelaunch, newly_opened, operating,
-- growing, established_mature, paused_restructuring) already distinguishes this; the application
-- layer (app/lib/business/growthEngine/lifeStage.ts) classifies it with a pure function. No second
-- business identity table or field was created.
--
-- Every table follows the established Program 4/5/6/7/Package B convention exactly: RLS enabled
-- with zero policies (deny-all for anon/authenticated), REVOKE ALL FROM PUBLIC/anon/authenticated/
-- service_role then an explicit narrow GRANT to service_role only (server-only access via
-- getAdminSupabase()). Mutable-lifecycle tables get UPDATE; append-only event tables get
-- SELECT/INSERT only.
--
-- No AI call happens anywhere in this migration or the repository layer it supports — this is
-- Gate A (data model foundation) only. provider_key/model_key/cost_metadata columns exist so
-- Gate B/D (OpenAI intelligence engine) can populate them later without a schema change; no secret
-- value is ever persisted in any column here (enforced at the application layer, matching the
-- business_ai_research_runs precedent).
--
-- Dependency order:
--   1. business_growth_media_channels        (global catalog, no business_id)
--   2. business_growth_assessments           (-> businesses)
--   3. business_growth_roadmap_steps         (-> businesses, business_growth_assessments)
--   4. business_growth_official_requirements (-> businesses)
--   5. business_growth_solutions             (-> businesses, business_growth_assessments)
--   6. business_growth_campaigns             (-> businesses, business_growth_solutions)
--   7. business_growth_campaign_channels     (-> business_growth_campaigns, business_growth_media_channels)
--   8. ALTER business_growth_solutions       -- add the remaining execution-bridge links, now that
--                                               campaigns/creative_jobs/commitments/official_requirements
--                                               all exist (resolves the solutions<->campaigns circularity)
--   9. business_growth_events                (-> businesses; polymorphic entity_type/entity_id, append-only)
--  10. Feature flag (reuses business_identity_flags — no parallel flags table)
-- =================================================================================================

BEGIN;

-- =================================================================================================
-- 1. business_growth_media_channels — global channel catalog (Section D). Not business-scoped.
-- config jsonb is intentionally freeform so future station/market/language/audience/spot-length/
-- rotation/pricing/inventory/production-requirement/partner-term detail can be added without a
-- schema replacement (Section D's explicit requirement). Seeded below with the Leonix-owned
-- channels plus radio as an honest "available partner channel, terms require confirmation" row —
-- never hardcoded pricing/inventory/rotation guarantees, per Section 9.
-- =================================================================================================
CREATE TABLE IF NOT EXISTS public.business_growth_media_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_key text NOT NULL UNIQUE CHECK (char_length(btrim(channel_key)) > 0),
  channel_class text NOT NULL CHECK (channel_class IN ('leonix_owned', 'partner')),
  label_es text NOT NULL CHECK (char_length(btrim(label_es)) > 0),
  label_en text NOT NULL CHECK (char_length(btrim(label_en)) > 0),
  availability_state text NOT NULL DEFAULT 'available' CHECK (availability_state IN (
    'available', 'available_partner_terms_required', 'coming_soon', 'not_available'
  )),
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes_es text NULL,
  notes_en text NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- A partner channel may never silently present as fully available with confirmed terms — it
  -- must carry one of the honest non-'available' states until commercial terms are actually set.
  CONSTRAINT business_growth_media_channels_partner_terms_chk CHECK (
    channel_class = 'leonix_owned' OR availability_state <> 'available'
  )
);

CREATE INDEX IF NOT EXISTS business_growth_media_channels_class_idx ON public.business_growth_media_channels (channel_class);
CREATE INDEX IF NOT EXISTS business_growth_media_channels_active_idx ON public.business_growth_media_channels (is_active);

ALTER TABLE public.business_growth_media_channels ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_growth_media_channels FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_growth_media_channels FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_growth_media_channels FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_growth_media_channels FROM service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.business_growth_media_channels TO service_role;

COMMENT ON TABLE public.business_growth_media_channels IS
  'Business Development & Growth Engine — global media/channel catalog (Leonix-owned + partner). Radio and future partner channels are honest "terms require confirmation" placeholders, never hardcoded pricing/inventory/rotation guarantees.';

-- =================================================================================================
-- 2. business_growth_assessments — versioned Business Development Assessment (Section A, MD §19).
-- Terminal rows are never mutated after creation except for the review_status/reviewed_* transition
-- and the one automatic supersede-on-new-current-version write — mirrors business_ai_research_runs'
-- "a re-run always creates a new row" doctrine. Exactly one non-superseded ("current") assessment
-- may exist per business at a time (enforced by the partial unique index below), making the
-- versioning/superseding semantics deterministic.
-- =================================================================================================
CREATE TABLE IF NOT EXISTS public.business_growth_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,

  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'needs_review', 'reviewed', 'superseded')),

  -- Cost/provider architecture readiness (Gate B/D will populate; never called from Gate A).
  provider_key text NULL,
  model_key text NULL,
  input_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  input_hash text NULL,
  cost_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- Section 3.1 required output, typed/structured rather than free prose so the progressive Growth
  -- Plan UI (Gate C) never has to parse a text blob. Each *_items column is a JSON array of
  -- { textEs, textEn, evidenceRefs?, ... } shaped objects — validated at the application layer,
  -- matching the exact convention business_ai_briefing_drafts already uses for strengths/
  -- opportunities/contradictions/unknowns/limitations.
  summary_es text NULL,
  summary_en text NULL,
  what_found jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(what_found) = 'array'),
  what_known jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(what_known) = 'array'),
  what_unknown jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(what_unknown) = 'array'),
  needs_verification jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(needs_verification) = 'array'),
  weak_or_missing jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(weak_or_missing) = 'array'),
  client_questions jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(client_questions) = 'array'),
  risks_constraints jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(risks_constraints) = 'array'),
  growth_opportunities jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(growth_opportunities) = 'array'),
  -- AI-suggested candidate solutions, tagged provider_class each — NOT yet canonical. A canonical
  -- business_growth_solutions row is only ever created through explicit staff promotion (or direct
  -- staff authorship), mirroring the AI-inference-never-becomes-fact-silently doctrine used by
  -- business_ai_briefing_drafts -> business_facts.
  suggested_solutions jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(suggested_solutions) = 'array'),
  recommended_media_mix jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(recommended_media_mix) = 'array'),
  priority_order jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(priority_order) = 'array'),
  measurement_plan jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(measurement_plan) = 'array'),
  next_right_move_es text NULL,
  next_right_move_en text NULL,

  created_actor_type text NOT NULL CHECK (created_actor_type IN ('staff', 'owner', 'system')),
  created_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  created_by_auth_user_id uuid NULL,
  created_by_role text NOT NULL,

  reviewed_at timestamptz NULL,
  reviewed_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  reviewed_by_auth_user_id uuid NULL,
  reviewed_by_role text NULL,
  operator_review_notes text NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_growth_assessments_id_business_id_uk UNIQUE (id, business_id),

  CONSTRAINT business_growth_assessments_created_actor_chk CHECK (
    (created_actor_type = 'staff' AND created_by_roster_id IS NOT NULL) OR
    (created_actor_type = 'owner' AND created_by_roster_id IS NULL AND created_by_auth_user_id IS NOT NULL) OR
    (created_actor_type = 'system' AND created_by_roster_id IS NULL AND created_by_auth_user_id IS NULL)
  ),

  -- Reviewed_* fields are only ever set together (never a partial review record), and only once
  -- status has actually left 'draft'/'needs_review'.
  CONSTRAINT business_growth_assessments_reviewed_atomic_chk CHECK (
    (reviewed_at IS NULL AND reviewed_by_roster_id IS NULL AND reviewed_by_auth_user_id IS NULL AND reviewed_by_role IS NULL) OR
    (reviewed_at IS NOT NULL AND reviewed_by_auth_user_id IS NOT NULL AND reviewed_by_role IS NOT NULL)
  ),
  CONSTRAINT business_growth_assessments_reviewed_requires_status_chk CHECK (
    status IN ('reviewed', 'superseded') OR reviewed_at IS NULL
  )
);

-- Deterministic versioning: at most one non-superseded assessment per business at any time.
CREATE UNIQUE INDEX IF NOT EXISTS business_growth_assessments_one_current_per_business_idx
  ON public.business_growth_assessments (business_id)
  WHERE status <> 'superseded';

CREATE INDEX IF NOT EXISTS business_growth_assessments_business_created_idx ON public.business_growth_assessments (business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS business_growth_assessments_status_idx ON public.business_growth_assessments (status);

ALTER TABLE public.business_growth_assessments ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_growth_assessments FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_growth_assessments FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_growth_assessments FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_growth_assessments FROM service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.business_growth_assessments TO service_role;

COMMENT ON TABLE public.business_growth_assessments IS
  'Business Development & Growth Engine — versioned Business Development Assessment. Exactly one non-superseded row per business. AI-generated content is always draft/inference; suggested_solutions never becomes a canonical business_growth_solutions row without explicit staff action.';

-- =================================================================================================
-- 3. business_growth_roadmap_steps — one row per (business, roadmap_type, step_key). The step
-- catalog itself (labels, sequence, required/optional-by-default) lives in application code
-- (app/lib/business/growthEngine/roadmapCatalog.ts), matching the MD's own "conceptual" framing —
-- rows are created lazily per business rather than pre-seeding every business in this migration.
-- =================================================================================================
CREATE TABLE IF NOT EXISTS public.business_growth_roadmap_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,

  roadmap_type text NOT NULL CHECK (roadmap_type IN ('established', 'startup')),
  step_key text NOT NULL CHECK (char_length(btrim(step_key)) > 0),
  sequence int NOT NULL CHECK (sequence >= 0),

  state text NOT NULL DEFAULT 'not_started' CHECK (state IN (
    'not_started', 'in_progress', 'needs_client_input', 'needs_official_research', 'blocked', 'complete', 'not_applicable'
  )),
  requirement text NOT NULL DEFAULT 'required' CHECK (requirement IN ('required', 'optional')),
  depends_on_step_key text NULL,

  source_assessment_id uuid NULL,
  notes text NULL,

  updated_by_actor_type text NULL CHECK (updated_by_actor_type IS NULL OR updated_by_actor_type IN ('staff', 'owner', 'system')),
  updated_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  updated_by_auth_user_id uuid NULL,
  updated_by_role text NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_growth_roadmap_steps_unique UNIQUE (business_id, roadmap_type, step_key),

  CONSTRAINT business_growth_roadmap_steps_assessment_business_fk
    FOREIGN KEY (source_assessment_id, business_id)
    REFERENCES public.business_growth_assessments(id, business_id)
    ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS business_growth_roadmap_steps_business_idx ON public.business_growth_roadmap_steps (business_id, roadmap_type, sequence);
CREATE INDEX IF NOT EXISTS business_growth_roadmap_steps_state_idx ON public.business_growth_roadmap_steps (state);

ALTER TABLE public.business_growth_roadmap_steps ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_growth_roadmap_steps FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_growth_roadmap_steps FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_growth_roadmap_steps FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_growth_roadmap_steps FROM service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.business_growth_roadmap_steps TO service_role;

COMMENT ON TABLE public.business_growth_roadmap_steps IS
  'Business Development & Growth Engine — per-business Growth Roadmap step state (established or startup track). Step catalog/order lives in application code, not this table.';

-- =================================================================================================
-- 4. business_growth_official_requirements — compliance/licensing research (Section G). NEVER a
-- legal conclusion. human_verified is structurally unreachable while needs_human_verification is
-- still true, so an AI-populated row can never silently present as confirmed.
-- =================================================================================================
CREATE TABLE IF NOT EXISTS public.business_growth_official_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,

  jurisdiction text NOT NULL CHECK (char_length(btrim(jurisdiction)) > 0),
  requirement_topic_es text NOT NULL CHECK (char_length(btrim(requirement_topic_es)) > 0),
  requirement_topic_en text NOT NULL CHECK (char_length(btrim(requirement_topic_en)) > 0),
  business_category_context text NULL,

  source_url text NULL,
  source_agency text NULL,
  last_verified_at timestamptz NULL,

  state text NOT NULL DEFAULT 'needs_research' CHECK (state IN (
    'needs_research', 'researched_unverified', 'human_verified', 'not_applicable'
  )),
  needs_human_verification boolean NOT NULL DEFAULT true,
  notes text NULL,

  created_actor_type text NOT NULL CHECK (created_actor_type IN ('staff', 'owner', 'system')),
  created_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  created_by_auth_user_id uuid NULL,
  created_by_role text NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_growth_official_requirements_id_business_id_uk UNIQUE (id, business_id),

  CONSTRAINT business_growth_official_requirements_created_actor_chk CHECK (
    (created_actor_type = 'staff' AND created_by_roster_id IS NOT NULL) OR
    (created_actor_type = 'owner' AND created_by_roster_id IS NULL AND created_by_auth_user_id IS NOT NULL) OR
    (created_actor_type = 'system' AND created_by_roster_id IS NULL AND created_by_auth_user_id IS NULL)
  ),

  -- The core safety rule: a requirement can never be marked human_verified while
  -- needs_human_verification is still true, and human_verified always carries a real timestamp.
  CONSTRAINT business_growth_official_requirements_verification_chk CHECK (
    (state = 'human_verified' AND needs_human_verification = false AND last_verified_at IS NOT NULL) OR
    (state <> 'human_verified')
  )
);

CREATE INDEX IF NOT EXISTS business_growth_official_requirements_business_idx ON public.business_growth_official_requirements (business_id);
CREATE INDEX IF NOT EXISTS business_growth_official_requirements_state_idx ON public.business_growth_official_requirements (state);

ALTER TABLE public.business_growth_official_requirements ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_growth_official_requirements FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_growth_official_requirements FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_growth_official_requirements FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_growth_official_requirements FROM service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.business_growth_official_requirements TO service_role;

COMMENT ON TABLE public.business_growth_official_requirements IS
  'Business Development & Growth Engine — official/regulatory requirement research. Never a legal conclusion. state cannot be human_verified while needs_human_verification is true — enforced structurally, not just by convention.';

-- =================================================================================================
-- 5. business_growth_solutions — canonical Leonix/partner/external solution classification
-- (Section C, MD §7). linked_campaign_id is added later (step 8) once business_growth_campaigns
-- exists, resolving the solutions<->campaigns circular reference the same way the Package B
-- migration resolved business_creative_jobs<->business_creative_opportunities.
-- =================================================================================================
CREATE TABLE IF NOT EXISTS public.business_growth_solutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  source_assessment_id uuid NULL,

  -- Deliberately NOT an exhaustive hardcoded category enum — MD §7 examples are guidance, not a
  -- closed list ("Do not hardcode marketing names yet"). provider_class is the one closed,
  -- doctrine-critical distinction; category is a bounded free string validated at the app layer.
  provider_class text NOT NULL CHECK (provider_class IN (
    'leonix_provides', 'leonix_coordinates_partner', 'external_professional_required'
  )),
  category text NOT NULL CHECK (char_length(btrim(category)) > 0),

  title_es text NOT NULL CHECK (char_length(btrim(title_es)) > 0),
  title_en text NOT NULL CHECK (char_length(btrim(title_en)) > 0),
  rationale_es text NULL,
  rationale_en text NULL,
  evidence_refs jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(evidence_refs) = 'array'),

  readiness text NOT NULL DEFAULT 'needs_more_information' CHECK (readiness IN (
    'ready', 'needs_preparation', 'blocked', 'needs_more_information'
  )),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),

  state text NOT NULL DEFAULT 'suggested' CHECK (state IN (
    'suggested', 'reviewed', 'approved', 'dismissed', 'in_progress', 'complete'
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

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_growth_solutions_id_business_id_uk UNIQUE (id, business_id),

  CONSTRAINT business_growth_solutions_assessment_business_fk
    FOREIGN KEY (source_assessment_id, business_id)
    REFERENCES public.business_growth_assessments(id, business_id)
    ON DELETE SET NULL,

  CONSTRAINT business_growth_solutions_created_actor_chk CHECK (
    (created_actor_type = 'staff' AND created_by_roster_id IS NOT NULL) OR
    (created_actor_type = 'owner' AND created_by_roster_id IS NULL AND created_by_auth_user_id IS NOT NULL) OR
    (created_actor_type = 'system' AND created_by_roster_id IS NULL AND created_by_auth_user_id IS NULL)
  ),

  CONSTRAINT business_growth_solutions_reviewed_atomic_chk CHECK (
    (reviewed_at IS NULL AND reviewed_by_roster_id IS NULL AND reviewed_by_auth_user_id IS NULL AND reviewed_by_role IS NULL) OR
    (reviewed_at IS NOT NULL AND reviewed_by_auth_user_id IS NOT NULL AND reviewed_by_role IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS business_growth_solutions_business_idx ON public.business_growth_solutions (business_id);
CREATE INDEX IF NOT EXISTS business_growth_solutions_state_idx ON public.business_growth_solutions (state);
CREATE INDEX IF NOT EXISTS business_growth_solutions_provider_class_idx ON public.business_growth_solutions (provider_class);
CREATE INDEX IF NOT EXISTS business_growth_solutions_assessment_idx ON public.business_growth_solutions (source_assessment_id);

ALTER TABLE public.business_growth_solutions ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_growth_solutions FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_growth_solutions FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_growth_solutions FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_growth_solutions FROM service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.business_growth_solutions TO service_role;

COMMENT ON TABLE public.business_growth_solutions IS
  'Business Development & Growth Engine — canonical Leonix/partner/external solution records. provider_class is closed and doctrine-critical; category is app-validated, not a hardcoded exhaustive enum. Execution links (creative job/campaign/commitment/official requirement) reference existing domain tables — never a duplicate execution state.';

-- =================================================================================================
-- 6. business_growth_campaigns — campaign object (Section E, MD §11).
-- =================================================================================================
CREATE TABLE IF NOT EXISTS public.business_growth_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  source_solution_id uuid NULL,
  linked_opportunity_id uuid NULL,

  objective_es text NOT NULL CHECK (char_length(btrim(objective_es)) > 0),
  objective_en text NOT NULL CHECK (char_length(btrim(objective_en)) > 0),
  target_audience_es text NULL,
  target_audience_en text NULL,
  offer_es text NULL,
  offer_en text NULL,
  primary_cta_es text NULL,
  primary_cta_en text NULL,
  capacity_assumption text NULL,

  campaign_start date NULL,
  campaign_end date NULL,
  budget_amount numeric NULL CHECK (budget_amount IS NULL OR budget_amount >= 0),
  budget_currency text NOT NULL DEFAULT 'USD',

  creative_requirements jsonb NOT NULL DEFAULT '{}'::jsonb,
  tracking_plan jsonb NOT NULL DEFAULT '{}'::jsonb,

  status text NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'needs_client_input', 'ready_for_review', 'approved', 'in_production',
    'live', 'measuring', 'complete', 'paused', 'cancelled'
  )),

  client_approved_at timestamptz NULL,
  client_approval_note text NULL,
  staff_approved_at timestamptz NULL,
  staff_approved_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  staff_approved_by_auth_user_id uuid NULL,
  staff_approved_by_role text NULL,

  created_actor_type text NOT NULL CHECK (created_actor_type IN ('staff', 'owner', 'system')),
  created_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  created_by_auth_user_id uuid NULL,
  created_by_role text NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_growth_campaigns_id_business_id_uk UNIQUE (id, business_id),

  CONSTRAINT business_growth_campaigns_solution_business_fk
    FOREIGN KEY (source_solution_id, business_id)
    REFERENCES public.business_growth_solutions(id, business_id)
    ON DELETE SET NULL,

  CONSTRAINT business_growth_campaigns_opportunity_business_fk
    FOREIGN KEY (linked_opportunity_id, business_id)
    REFERENCES public.business_creative_opportunities(id, business_id)
    ON DELETE SET NULL,

  CONSTRAINT business_growth_campaigns_created_actor_chk CHECK (
    (created_actor_type = 'staff' AND created_by_roster_id IS NOT NULL) OR
    (created_actor_type = 'owner' AND created_by_roster_id IS NULL AND created_by_auth_user_id IS NOT NULL) OR
    (created_actor_type = 'system' AND created_by_roster_id IS NULL AND created_by_auth_user_id IS NULL)
  ),

  CONSTRAINT business_growth_campaigns_staff_approval_atomic_chk CHECK (
    (staff_approved_at IS NULL AND staff_approved_by_roster_id IS NULL AND staff_approved_by_auth_user_id IS NULL AND staff_approved_by_role IS NULL) OR
    (staff_approved_at IS NOT NULL AND staff_approved_by_auth_user_id IS NOT NULL AND staff_approved_by_role IS NOT NULL)
  ),

  CONSTRAINT business_growth_campaigns_dates_chk CHECK (campaign_end IS NULL OR campaign_start IS NULL OR campaign_end >= campaign_start)
);

CREATE INDEX IF NOT EXISTS business_growth_campaigns_business_idx ON public.business_growth_campaigns (business_id);
CREATE INDEX IF NOT EXISTS business_growth_campaigns_status_idx ON public.business_growth_campaigns (status);
CREATE INDEX IF NOT EXISTS business_growth_campaigns_solution_idx ON public.business_growth_campaigns (source_solution_id);

ALTER TABLE public.business_growth_campaigns ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_growth_campaigns FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_growth_campaigns FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_growth_campaigns FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_growth_campaigns FROM service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.business_growth_campaigns TO service_role;

COMMENT ON TABLE public.business_growth_campaigns IS
  'Business Development & Growth Engine — campaign object. Does not duplicate Creative Studio job state or Opportunity lifecycle state — references them via composite same-business foreign keys (linked_opportunity_id; linked creative jobs/commitments are recorded on business_growth_solutions, not here).';

-- =================================================================================================
-- 7. business_growth_campaign_channels — campaign <-> media channel junction, business-safe.
-- =================================================================================================
CREATE TABLE IF NOT EXISTS public.business_growth_campaign_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  media_channel_id uuid NOT NULL REFERENCES public.business_growth_media_channels(id) ON DELETE RESTRICT,

  channel_notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_growth_campaign_channels_campaign_business_fk
    FOREIGN KEY (campaign_id, business_id)
    REFERENCES public.business_growth_campaigns(id, business_id)
    ON DELETE CASCADE,

  CONSTRAINT business_growth_campaign_channels_unique UNIQUE (campaign_id, media_channel_id)
);

CREATE INDEX IF NOT EXISTS business_growth_campaign_channels_campaign_idx ON public.business_growth_campaign_channels (campaign_id);
CREATE INDEX IF NOT EXISTS business_growth_campaign_channels_business_idx ON public.business_growth_campaign_channels (business_id);

ALTER TABLE public.business_growth_campaign_channels ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_growth_campaign_channels FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_growth_campaign_channels FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_growth_campaign_channels FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_growth_campaign_channels FROM service_role;
GRANT SELECT, INSERT, DELETE ON TABLE public.business_growth_campaign_channels TO service_role;

COMMENT ON TABLE public.business_growth_campaign_channels IS
  'Business Development & Growth Engine — which media channels a campaign uses. Business-safe composite FK to the campaign; media_channel_id points at the global catalog.';

-- =================================================================================================
-- 8. business_growth_solutions — remaining execution-bridge links (Section F), added now that
-- campaigns/creative jobs/commitments/official requirements all exist. Every one is a narrow,
-- nullable, composite same-business foreign key — mirrors business_creative_jobs.
-- source_recommendation_id / source_proposal_id exactly. A solution may point at AT MOST one
-- execution target at a time (the application layer sets exactly one when linking); the table does
-- not force mutual exclusivity by CHECK because a solution may legitimately move from "linked a
-- research task" to "linked a campaign" over its lifecycle, same as business_creative_opportunities
-- allows lifecycle_state to progress without an exclusivity constraint.
-- =================================================================================================
ALTER TABLE public.business_growth_solutions
  ADD COLUMN IF NOT EXISTS linked_campaign_id uuid NULL,
  ADD COLUMN IF NOT EXISTS linked_creative_job_id uuid NULL,
  ADD COLUMN IF NOT EXISTS linked_commitment_id uuid NULL,
  ADD COLUMN IF NOT EXISTS linked_official_requirement_id uuid NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'business_growth_solutions_campaign_business_fk' AND table_name = 'business_growth_solutions'
  ) THEN
    ALTER TABLE public.business_growth_solutions
      ADD CONSTRAINT business_growth_solutions_campaign_business_fk
      FOREIGN KEY (linked_campaign_id, business_id)
      REFERENCES public.business_growth_campaigns(id, business_id)
      ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'business_growth_solutions_creative_job_business_fk' AND table_name = 'business_growth_solutions'
  ) THEN
    ALTER TABLE public.business_growth_solutions
      ADD CONSTRAINT business_growth_solutions_creative_job_business_fk
      FOREIGN KEY (linked_creative_job_id, business_id)
      REFERENCES public.business_creative_jobs(id, business_id)
      ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'business_growth_solutions_commitment_business_fk' AND table_name = 'business_growth_solutions'
  ) THEN
    ALTER TABLE public.business_growth_solutions
      ADD CONSTRAINT business_growth_solutions_commitment_business_fk
      FOREIGN KEY (linked_commitment_id, business_id)
      REFERENCES public.business_commitments(id, business_id)
      ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'business_growth_solutions_official_requirement_business_fk' AND table_name = 'business_growth_solutions'
  ) THEN
    ALTER TABLE public.business_growth_solutions
      ADD CONSTRAINT business_growth_solutions_official_requirement_business_fk
      FOREIGN KEY (linked_official_requirement_id, business_id)
      REFERENCES public.business_growth_official_requirements(id, business_id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS business_growth_solutions_linked_campaign_idx ON public.business_growth_solutions (linked_campaign_id);
CREATE INDEX IF NOT EXISTS business_growth_solutions_linked_creative_job_idx ON public.business_growth_solutions (linked_creative_job_id);
CREATE INDEX IF NOT EXISTS business_growth_solutions_linked_commitment_idx ON public.business_growth_solutions (linked_commitment_id);

-- =================================================================================================
-- 9. business_growth_events — event/history for meaningful Growth Engine transitions (Section I).
-- Polymorphic entity_type/entity_id (assessment/roadmap_step/solution/campaign/official_requirement)
-- rather than five separate event tables — entity_id is intentionally not FK-constrained (it can
-- reference any of five different tables), matching the existing precedent of the generic
-- admin_audit_log table, which also carries an unconstrained target_id. Append-only.
-- =================================================================================================
CREATE TABLE IF NOT EXISTS public.business_growth_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,

  entity_type text NOT NULL CHECK (entity_type IN ('assessment', 'roadmap_step', 'solution', 'campaign', 'official_requirement')),
  entity_id uuid NOT NULL,
  event_type text NOT NULL CHECK (char_length(btrim(event_type)) > 0),
  previous_state text NULL,
  new_state text NULL,
  source text NULL,
  note text NULL,

  event_actor_type text NOT NULL CHECK (event_actor_type IN ('staff', 'owner', 'system')),
  event_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  event_by_auth_user_id uuid NULL,
  event_by_role text NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_growth_events_actor_chk CHECK (
    (event_actor_type = 'staff' AND event_by_roster_id IS NOT NULL) OR
    (event_actor_type = 'owner' AND event_by_roster_id IS NULL AND event_by_auth_user_id IS NOT NULL) OR
    (event_actor_type = 'system' AND event_by_roster_id IS NULL AND event_by_auth_user_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS business_growth_events_business_idx ON public.business_growth_events (business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS business_growth_events_entity_idx ON public.business_growth_events (entity_type, entity_id);

ALTER TABLE public.business_growth_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_growth_events FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_growth_events FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_growth_events FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_growth_events FROM service_role;
GRANT SELECT, INSERT ON TABLE public.business_growth_events TO service_role;

COMMENT ON TABLE public.business_growth_events IS
  'Business Development & Growth Engine — append-only event/history across assessments, roadmap steps, solutions, campaigns, and official requirements. entity_id is polymorphic (not FK-constrained), matching the existing admin_audit_log precedent.';

-- =================================================================================================
-- 10. Seed the media channel catalog — Leonix-owned channels available now; radio as an honest
-- partner-terms-required placeholder (MD §9 — never hardcoded pricing/inventory/rotation).
-- =================================================================================================
INSERT INTO public.business_growth_media_channels (channel_key, channel_class, label_es, label_en, availability_state, notes_es, notes_en)
VALUES
  ('business_hub', 'leonix_owned', 'Business Hub / Negocios Locales', 'Business Hub / Negocios Locales', 'available', NULL, NULL),
  ('website_digital', 'leonix_owned', 'Presencia digital / sitio web', 'Website / digital presence', 'available', NULL, NULL),
  ('monthly_print', 'leonix_owned', 'Impreso mensual', 'Monthly print', 'available', NULL, NULL),
  ('weekly_digital', 'leonix_owned', 'Digital semanal', 'Weekly digital', 'available', NULL, NULL),
  ('newsletter', 'leonix_owned', 'Boletín semanal', 'Weekly newsletter', 'available', NULL, NULL),
  ('leonix_social', 'leonix_owned', 'Redes sociales de Leonix', 'Leonix social', 'available', NULL, NULL),
  ('qr_cta_ecosystem', 'leonix_owned', 'Ecosistema QR / CTA', 'QR / CTA ecosystem', 'available', NULL, NULL),
  ('radio', 'partner', 'Radio (socio)', 'Radio (partner)', 'available_partner_terms_required',
    'La exposición en radio puede encajar en esta campaña. Confirme el inventario actual de la estación, audiencia, horario, precio, requisitos de producción y términos de campaña antes de presentar un paquete final.',
    'Radio exposure may fit this campaign. Confirm current station inventory, audience, schedule, pricing, production requirements, and campaign terms before final package presentation.')
ON CONFLICT (channel_key) DO NOTHING;

-- =================================================================================================
-- 11. Feature flag — reuses the existing business_identity_flags table/convention. Default
-- disabled, no pilot users, matching every prior Program 4/5/6/7/Package B flag insert exactly.
-- =================================================================================================
INSERT INTO public.business_identity_flags (flag_key, enabled, emergency_disabled, pilot_user_ids)
VALUES ('business_growth_engine', false, false, '{}')
ON CONFLICT (flag_key) DO NOTHING;

COMMIT;
