-- Client Discovery & Project Blueprint Engine, Gate 6 — specialized project blueprints (Logo/
-- Brand, Print Collateral, Media Campaign) + execution bridges. Purely additive: one new small
-- table, plus narrow nullable columns on two EXISTING tables (mirroring the exact
-- source_opportunity_id precedent already established on business_creative_jobs). No table is
-- dropped, no column is removed, no existing row's meaning changes.
--
-- Reuse audit (this gate's own first_inspection):
--   - business_project_blueprints (Gate 5) is reused AS-IS for Logo/Brand, Print Collateral, and
--     Media Campaign blueprint versions — blueprint_type was deliberately left free text by Gate 5
--     precisely so this gate could add 'logo_brand_identity'/'business_cards'/'flyer'/
--     'banner_signage'/'referral_materials'/'media_exposure_campaign'/etc. rows without a schema
--     change. NO new blueprint table is created here.
--   - business_creative_jobs (Program 6, Creative Studio) is reused as the execution destination
--     for Logo/Brand and Print Collateral. It gains ONE new nullable source_project_blueprint_id
--     column (mirroring source_opportunity_id exactly) plus a partial unique index so a double-
--     click on the "Create Creative Studio Project" bridge action can never create a duplicate job
--     for the same approved blueprint version.
--   - business_growth_campaigns (Growth Engine) is reused as the execution destination for Media/
--     Exposure Campaign. It gains the SAME shape of column + partial unique index for the same
--     idempotency reason.
--   - business_creative_jobs.asset_type gains exactly ONE new value, 'print_collateral_direction'
--     (mirroring how 'logo_direction' already covers every logo sub-case without needing
--     'logo_new'/'logo_refresh'/etc.) — covering Business Cards/Flyer/Banner/Signage/Referral
--     Materials as ONE generic print-direction output, never five separate asset types.
--   - business_project_discovery_intent_dependencies is genuinely NEW ground: no existing table
--     represents "intent A is blocked on intent B finishing" anywhere in this schema, and
--     ProjectDiscoveryIntent itself carries no metadata/extensibility field this could piggyback
--     on. A minimal dedicated table is the smallest correct solution (MD <dependency_engine>:
--     "Only add persistence if necessary for durable user-confirmed dependency state").
--
-- No CREATE POLICY anywhere (deny-all + explicit service_role grant only, matching every prior
-- migration in this domain). No remote application in this gate.

-- =================================================================================================
-- A. business_project_discovery_intent_dependencies — minimal, deterministic dependency model.
-- =================================================================================================
CREATE TABLE IF NOT EXISTS public.business_project_discovery_intent_dependencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  discovery_id uuid NOT NULL,

  -- The intent that is BLOCKED (dependent) and the intent it depends on finishing first.
  dependent_intent_id uuid NOT NULL,
  depends_on_intent_id uuid NOT NULL,

  dependency_type text NOT NULL CHECK (dependency_type IN ('explicit', 'system_suggested')),
  reason_es text NOT NULL CHECK (char_length(btrim(reason_es)) > 0),
  reason_en text NOT NULL CHECK (char_length(btrim(reason_en)) > 0),

  created_actor_type text NOT NULL CHECK (created_actor_type IN ('staff', 'owner')),
  created_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  created_by_auth_user_id uuid NOT NULL,
  created_by_email text NOT NULL,
  created_by_role text NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_project_discovery_intent_dependencies_no_self_chk CHECK (dependent_intent_id != depends_on_intent_id),

  CONSTRAINT business_project_discovery_intent_dependencies_created_actor_chk CHECK (
    (created_actor_type = 'staff' AND created_by_roster_id IS NOT NULL) OR
    (created_actor_type = 'owner' AND created_by_roster_id IS NULL)
  ),

  -- Both intents must belong to the SAME discovery — a dependency never crosses discoveries.
  CONSTRAINT business_project_discovery_intent_dependencies_dependent_fk
    FOREIGN KEY (dependent_intent_id, business_id)
    REFERENCES public.business_project_discovery_intents(id, business_id) ON DELETE CASCADE,
  CONSTRAINT business_project_discovery_intent_dependencies_depends_on_fk
    FOREIGN KEY (depends_on_intent_id, business_id)
    REFERENCES public.business_project_discovery_intents(id, business_id) ON DELETE CASCADE,

  -- A given ordered pair is recorded at most once — re-accepting the same suggestion is a no-op,
  -- never a duplicate row.
  CONSTRAINT business_project_discovery_intent_dependencies_pair_uk UNIQUE (dependent_intent_id, depends_on_intent_id)
);

CREATE INDEX IF NOT EXISTS business_project_discovery_intent_dependencies_discovery_idx ON public.business_project_discovery_intent_dependencies (discovery_id);
CREATE INDEX IF NOT EXISTS business_project_discovery_intent_dependencies_dependent_idx ON public.business_project_discovery_intent_dependencies (dependent_intent_id);

ALTER TABLE public.business_project_discovery_intent_dependencies ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_project_discovery_intent_dependencies FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_project_discovery_intent_dependencies FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_project_discovery_intent_dependencies FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_project_discovery_intent_dependencies FROM service_role;
GRANT SELECT, INSERT, DELETE ON TABLE public.business_project_discovery_intent_dependencies TO service_role;

COMMENT ON TABLE public.business_project_discovery_intent_dependencies IS
  'Client Discovery & Project Blueprint Engine, Gate 6 — minimal deterministic "intent A is blocked on intent B" dependency model. Never auto-created; a system-suggested row only exists once staff explicitly accepts the suggestion.';

-- =================================================================================================
-- B. business_creative_jobs — extend asset_type with a generic print-collateral direction value,
-- and add a narrow source_project_blueprint_id column (mirrors source_opportunity_id exactly).
-- =================================================================================================
ALTER TABLE public.business_creative_jobs DROP CONSTRAINT IF EXISTS business_creative_jobs_asset_type_check;
ALTER TABLE public.business_creative_jobs ADD CONSTRAINT business_creative_jobs_asset_type_check CHECK (asset_type IN (
  'magazine_ad', 'sponsored_insert', 'business_description', 'social_copy',
  'whatsapp_promo_copy', 'flyer_copy', 'coupon_copy', 'logo_direction',
  'website_strategy', 'campaign_plan_30_day', 'print_collateral_direction'
));

ALTER TABLE public.business_creative_jobs
  ADD COLUMN IF NOT EXISTS source_project_blueprint_id uuid NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'business_creative_jobs_source_blueprint_business_fk'
      AND table_name = 'business_creative_jobs'
  ) THEN
    ALTER TABLE public.business_creative_jobs
      ADD CONSTRAINT business_creative_jobs_source_blueprint_business_fk
      FOREIGN KEY (source_project_blueprint_id, business_id)
      REFERENCES public.business_project_blueprints(id, business_id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- Idempotency at the DB layer: a double-click on "Create Creative Studio Project" for the SAME
-- approved blueprint version can never create a second job (MD <no_duplicate_creation>). The
-- application layer also checks for an existing job first (defense in depth, matching this
-- codebase's own established pattern of never relying on a single idempotency mechanism alone).
CREATE UNIQUE INDEX IF NOT EXISTS business_creative_jobs_source_blueprint_uk
  ON public.business_creative_jobs (source_project_blueprint_id)
  WHERE source_project_blueprint_id IS NOT NULL;

-- =================================================================================================
-- C. business_growth_campaigns — add the same narrow source_project_blueprint_id column.
-- =================================================================================================
ALTER TABLE public.business_growth_campaigns
  ADD COLUMN IF NOT EXISTS source_project_blueprint_id uuid NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'business_growth_campaigns_source_blueprint_business_fk'
      AND table_name = 'business_growth_campaigns'
  ) THEN
    ALTER TABLE public.business_growth_campaigns
      ADD CONSTRAINT business_growth_campaigns_source_blueprint_business_fk
      FOREIGN KEY (source_project_blueprint_id, business_id)
      REFERENCES public.business_project_blueprints(id, business_id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS business_growth_campaigns_source_blueprint_uk
  ON public.business_growth_campaigns (source_project_blueprint_id)
  WHERE source_project_blueprint_id IS NOT NULL;
