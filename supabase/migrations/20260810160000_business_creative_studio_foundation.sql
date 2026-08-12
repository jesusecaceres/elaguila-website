-- =============================================================================================
-- Program 6 — AI Creative + Execution Studio Foundation
-- Migration: 20260810160000_business_creative_studio_foundation.sql
--
-- Creates 9 new tables for the Creative Studio domain:
--   A. business_creative_jobs
--   B. business_creative_input_snapshots (append-only)
--   C. business_creative_job_versions (append-only)
--   D. business_creative_assets
--   E. business_creative_briefs
--   F. business_creative_compositions
--   G. business_creative_reviews (append-only)
--   H. business_creative_exports (append-only)
--   I. business_creative_provider_runs (append-only)
--
-- Doctrine:
-- - One canonical business: public.businesses.id
-- - Never invent business facts, services, prices, offers, reviews, awards
-- - Never auto-publish, auto-charge, or grant entitlements
-- - Image generation is NOT live
-- - Canva integration defaults to manual_handoff
-- - RLS enabled, zero user policies, revoke PUBLIC/anon/authenticated, narrow service_role grants
-- - Actor attribution CHECK on every human-authored table; provider_runs uses initiated_actor_type
-- - Same-business composite integrity on every cross-table relationship
-- - Append-only for snapshots, versions, reviews, exports, provider runs
-- - Feature flags default disabled
-- =============================================================================================

BEGIN;

-- =============================================================================================
-- A. business_creative_jobs — one creative production job tied to a real business.
-- Exposes UNIQUE(id, business_id) so child tables can enforce same-business composite FKs.
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.business_creative_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  source_recommendation_id uuid NULL,
  source_proposal_id uuid NULL,
  asset_type text NOT NULL CHECK (asset_type IN (
    'magazine_ad', 'sponsored_insert', 'business_description', 'social_copy',
    'whatsapp_promo_copy', 'flyer_copy', 'coupon_copy', 'logo_direction',
    'website_strategy', 'campaign_plan_30_day'
  )),
  language text NOT NULL CHECK (language IN (
    'es', 'en', 'bilingual', 'es_primary_en_support', 'en_primary_es_support'
  )),
  format text NOT NULL CHECK (format IN (
    'FULL_BLEED', 'FULL_PAGE', 'HALF_HORIZONTAL', 'HALF_VERTICAL', 'QUARTER',
    'SPREAD_TRIM', 'SPREAD_BLEED'
  )),
  archetype text NOT NULL CHECK (archetype IN (
    'AUTHORITY_TRADITIONAL_UPGRADED', 'PREMIUM_PHOTO_HERO', 'OFFER_PROMO_BLAST',
    'MULTI_PANEL_SERVICE_GRID', 'RECRUITMENT_HIRING', 'EVENT_VENUE_SHOWCASE',
    'SPONSORED_EDITORIAL', 'BUSINESS_PROFILE_STORY', 'PREMIUM_INSTITUTIONAL',
    'LEGACY_DIRECTORY_BASIC'
  )),
  layout_variant text NOT NULL DEFAULT 'A' CHECK (layout_variant IN ('A', 'B', 'C')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'ready_for_generation', 'generated', 'in_review',
    'changes_requested', 'owner_review', 'approved', 'archived'
  )),
  input_snapshot_id uuid NULL,
  doctrine_version text NOT NULL DEFAULT 'v1',
  template_version text NOT NULL DEFAULT 'v1',
  provider_key text NOT NULL DEFAULT 'gemini',
  model_key text NOT NULL DEFAULT 'gemini-2.5-flash',
  creative_lane text NOT NULL CHECK (creative_lane IN (
    'LANE_A_TRADITIONAL_UPGRADED', 'LANE_B_PREMIUM_CREATIVE', 'LANE_C_SPONSORED_EDITORIAL'
  )),
  risk_class text NOT NULL DEFAULT 'NORMAL' CHECK (risk_class IN (
    'NORMAL', 'LEGAL', 'MEDICAL', 'FINANCIAL', 'INSURANCE', 'IMMIGRATION',
    'TAX', 'SAFETY', 'EMPLOYMENT', 'HOUSING'
  )),

  created_actor_type text NOT NULL CHECK (created_actor_type IN ('staff', 'owner')),
  created_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  created_by_auth_user_id uuid NOT NULL,
  created_by_email text NOT NULL,
  created_by_role text NOT NULL,

  approved_actor_type text NULL CHECK (approved_actor_type IS NULL OR approved_actor_type IN ('staff', 'owner')),
  approved_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  approved_by_auth_user_id uuid NULL,
  approved_by_email text NULL,
  approved_by_role text NULL,
  approved_at timestamptz NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_creative_jobs_id_business_id_uk UNIQUE (id, business_id),

  -- Actor integrity: staff must carry roster_id; owner must NOT carry roster_id.
  CONSTRAINT business_creative_jobs_created_actor_chk CHECK (
    (created_actor_type = 'staff' AND created_by_roster_id IS NOT NULL) OR
    (created_actor_type = 'owner' AND created_by_roster_id IS NULL)
  ),

  -- Blocker 1: Non-draft lifecycle requires input_snapshot_id.
  -- A draft may temporarily have no snapshot while being assembled.
  CONSTRAINT business_creative_jobs_snapshot_lifecycle_chk CHECK (
    status = 'draft' OR input_snapshot_id IS NOT NULL
  ),

  -- Blocker 9: Approved atomic CHECK — if approved, must have full attribution.
  CONSTRAINT business_creative_jobs_approved_atomic_chk CHECK (
    status != 'approved' OR (
      approved_actor_type IS NOT NULL AND
      approved_by_auth_user_id IS NOT NULL AND
      approved_by_email IS NOT NULL AND char_length(btrim(approved_by_email)) > 0 AND
      approved_by_role IS NOT NULL AND char_length(btrim(approved_by_role)) > 0 AND
      approved_at IS NOT NULL
    )
  ),

  -- Blocker 9: Non-approved active states must NOT carry approval attribution.
  -- Archived preserves historical approval state.
  CONSTRAINT business_creative_jobs_no_stale_approval_chk CHECK (
    status IN ('approved', 'archived') OR (
      approved_actor_type IS NULL AND
      approved_by_auth_user_id IS NULL AND
      approved_by_email IS NULL AND
      approved_by_role IS NULL AND
      approved_at IS NULL
    )
  ),

  -- Approved actor roster integrity.
  CONSTRAINT business_creative_jobs_approved_actor_chk CHECK (
    approved_actor_type IS NULL OR
    (approved_actor_type = 'staff' AND approved_by_roster_id IS NOT NULL) OR
    (approved_actor_type = 'owner' AND approved_by_roster_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS business_creative_jobs_business_id_idx ON public.business_creative_jobs (business_id);
CREATE INDEX IF NOT EXISTS business_creative_jobs_status_idx ON public.business_creative_jobs (status);

ALTER TABLE public.business_creative_jobs ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_creative_jobs FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_creative_jobs FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_creative_jobs FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_creative_jobs FROM service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.business_creative_jobs TO service_role;

COMMENT ON TABLE public.business_creative_jobs IS
  'Program 6 — Creative production jobs. Never auto-publish, auto-charge, or grant entitlements. Approval != Publication.';

-- Blocker 3: Same-business composite FKs for source recommendation and proposal.
-- Prevents cross-business linkage. ON DELETE RESTRICT — must clear the reference before deleting the source.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'business_creative_jobs_recommendation_business_fk'
      AND table_name = 'business_creative_jobs'
  ) THEN
    ALTER TABLE public.business_creative_jobs
      ADD CONSTRAINT business_creative_jobs_recommendation_business_fk
      FOREIGN KEY (source_recommendation_id, business_id)
      REFERENCES public.business_recommendations(id, business_id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'business_creative_jobs_proposal_business_fk'
      AND table_name = 'business_creative_jobs'
  ) THEN
    ALTER TABLE public.business_creative_jobs
      ADD CONSTRAINT business_creative_jobs_proposal_business_fk
      FOREIGN KEY (source_proposal_id, business_id)
      REFERENCES public.business_proposals(id, business_id)
      ON DELETE RESTRICT;
  END IF;
END $$;

-- =============================================================================================
-- B. business_creative_input_snapshots — immutable verified input snapshots (append-only).
-- Composite FK (job_id, business_id) → business_creative_jobs(id, business_id).
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.business_creative_input_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  version int NOT NULL DEFAULT 1 CHECK (version > 0),
  categories jsonb NOT NULL DEFAULT '[]',
  snapshot_timestamp timestamptz NOT NULL DEFAULT now(),

  created_actor_type text NOT NULL CHECK (created_actor_type IN ('staff', 'owner')),
  created_by_auth_user_id uuid NOT NULL,
  created_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),

  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_creative_input_snapshots_job_business_fk
    FOREIGN KEY (job_id, business_id)
    REFERENCES public.business_creative_jobs(id, business_id)
    ON DELETE CASCADE,

  CONSTRAINT business_creative_input_snapshots_id_business_id_uk UNIQUE (id, business_id),

  CONSTRAINT business_creative_input_snapshots_created_actor_chk CHECK (
    (created_actor_type = 'staff' AND created_by_roster_id IS NOT NULL) OR
    (created_actor_type = 'owner' AND created_by_roster_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS business_creative_input_snapshots_job_id_idx ON public.business_creative_input_snapshots (job_id);
CREATE INDEX IF NOT EXISTS business_creative_input_snapshots_business_id_idx ON public.business_creative_input_snapshots (business_id);

ALTER TABLE public.business_creative_input_snapshots ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_creative_input_snapshots FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_creative_input_snapshots FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_creative_input_snapshots FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_creative_input_snapshots FROM service_role;
GRANT SELECT, INSERT ON TABLE public.business_creative_input_snapshots TO service_role;

COMMENT ON TABLE public.business_creative_input_snapshots IS
  'Program 6 — Immutable verified input snapshots. Append-only. Never silently regenerate against newer business truth.';

-- Add composite same-business FK from jobs to snapshots (deferred to after snapshot table exists).
-- Blocker 1: Uses (input_snapshot_id, business_id) -> snapshots(id, business_id) to prevent cross-business linkage.
-- input_snapshot_id is nullable for draft construction; FK only enforced when non-NULL.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'business_creative_jobs_input_snapshot_business_fk'
      AND table_name = 'business_creative_jobs'
  ) THEN
    ALTER TABLE public.business_creative_jobs
      ADD CONSTRAINT business_creative_jobs_input_snapshot_business_fk
      FOREIGN KEY (input_snapshot_id, business_id)
      REFERENCES public.business_creative_input_snapshots(id, business_id)
      ON DELETE RESTRICT;
  END IF;
END $$;

-- =============================================================================================
-- C. business_creative_job_versions — creative version history (append-only).
-- Composite FK (job_id, business_id) → business_creative_jobs(id, business_id).
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.business_creative_job_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  version_number int NOT NULL CHECK (version_number > 0),
  snapshot_id uuid NOT NULL,
  brief_id uuid NULL,
  generated_copy jsonb NOT NULL DEFAULT '{}',
  generated_headlines text[] NOT NULL DEFAULT '{}',
  generated_body_copy text[] NOT NULL DEFAULT '{}',
  generated_cta text NULL,
  generated_disclaimer text NULL,
  is_current boolean NOT NULL DEFAULT true,

  created_actor_type text NOT NULL CHECK (created_actor_type IN ('staff', 'owner')),
  created_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  created_by_auth_user_id uuid NOT NULL,
  created_by_email text NOT NULL,
  created_by_role text NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_creative_job_versions_id_business_id_uk UNIQUE (id, business_id),

  CONSTRAINT business_creative_job_versions_job_business_fk
    FOREIGN KEY (job_id, business_id)
    REFERENCES public.business_creative_jobs(id, business_id)
    ON DELETE CASCADE,

  -- Blocker 5: Composite same-business FK for snapshot reference.
  CONSTRAINT business_creative_job_versions_snapshot_business_fk
    FOREIGN KEY (snapshot_id, business_id)
    REFERENCES public.business_creative_input_snapshots(id, business_id)
    ON DELETE RESTRICT,

  CONSTRAINT business_creative_job_versions_created_actor_chk CHECK (
    (created_actor_type = 'staff' AND created_by_roster_id IS NOT NULL) OR
    (created_actor_type = 'owner' AND created_by_roster_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS business_creative_job_versions_job_id_idx ON public.business_creative_job_versions (job_id);
CREATE INDEX IF NOT EXISTS business_creative_job_versions_business_id_idx ON public.business_creative_job_versions (business_id);

ALTER TABLE public.business_creative_job_versions ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_creative_job_versions FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_creative_job_versions FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_creative_job_versions FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_creative_job_versions FROM service_role;
GRANT SELECT, INSERT ON TABLE public.business_creative_job_versions TO service_role;

COMMENT ON TABLE public.business_creative_job_versions IS
  'Program 6 — Creative version history. Append-only. Never silently overwrite approved copy.';

-- =============================================================================================
-- D. business_creative_assets — image asset + rights model.
-- Composite FK (job_id, business_id) → business_creative_jobs(id, business_id) — optional,
-- only enforced when job_id is non-NULL.
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.business_creative_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  job_id uuid NULL,

  asset_kind text NOT NULL CHECK (asset_kind IN (
    'client_logo', 'client_photo', 'staff_portrait', 'product', 'food',
    'building', 'service_work', 'licensed_stock', 'leonix_owned',
    'creator_supplied', 'public_domain', 'ai_illustrative', 'other'
  )),
  storage_ref text NOT NULL,
  original_filename text NOT NULL,
  mime_type text NOT NULL,
  pixel_width int NULL CHECK (pixel_width IS NULL OR pixel_width > 0),
  pixel_height int NULL CHECK (pixel_height IS NULL OR pixel_height > 0),
  aspect_ratio numeric NULL,
  file_size_bytes bigint NULL CHECK (file_size_bytes IS NULL OR file_size_bytes > 0),
  source_url text NULL,

  rights_source text NOT NULL CHECK (rights_source IN (
    'client_provided', 'licensed_stock', 'leonix_owned', 'creator_supplied',
    'public_domain', 'ai_generated', 'unknown'
  )),
  rights_status text NOT NULL DEFAULT 'pending_review' CHECK (rights_status IN (
    'verified', 'pending_review', 'unknown_rights', 'restricted', 'expired'
  )),
  permission_date timestamptz NULL,
  permission_actor_auth_user_id uuid NULL,
  model_release_state text NOT NULL DEFAULT 'unknown' CHECK (model_release_state IN (
    'not_required', 'obtained', 'not_obtained', 'unknown'
  )),
  property_release_state text NOT NULL DEFAULT 'unknown' CHECK (property_release_state IN (
    'not_required', 'obtained', 'not_obtained', 'unknown'
  )),
  allowed_uses text[] NOT NULL DEFAULT '{}',
  expiration_restriction text NULL,

  authenticity_classification text NOT NULL DEFAULT 'UNKNOWN' CHECK (authenticity_classification IN (
    'REAL_CLIENT', 'LICENSED_STOCK', 'AI_ILLUSTRATIVE', 'UNKNOWN'
  )),
  approval_state text NOT NULL DEFAULT 'pending' CHECK (approval_state IN (
    'pending', 'approved', 'rejected'
  )),

  created_actor_type text NOT NULL CHECK (created_actor_type IN ('staff', 'owner')),
  created_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  created_by_auth_user_id uuid NOT NULL,
  created_by_email text NOT NULL,
  created_by_role text NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_creative_assets_created_actor_chk CHECK (
    (created_actor_type = 'staff' AND created_by_roster_id IS NOT NULL) OR
    (created_actor_type = 'owner' AND created_by_roster_id IS NULL)
  ),

  -- UNKNOWN_RIGHTS cannot reach APPROVED_FINAL.
  CONSTRAINT business_creative_assets_rights_approval_chk CHECK (
    approval_state != 'approved' OR rights_status NOT IN ('unknown_rights', 'expired', 'restricted')
  ),

  -- Blocker 7: AI illustrative asset_kind must have matching authenticity and rights.
  CONSTRAINT business_creative_assets_ai_kind_classification_chk CHECK (
    asset_kind != 'ai_illustrative' OR (
      authenticity_classification = 'AI_ILLUSTRATIVE' AND
      rights_source = 'ai_generated'
    )
  ),

  -- Blocker 7: AI_ILLUSTRATIVE authenticity must have matching asset_kind and rights.
  CONSTRAINT business_creative_assets_ai_classification_kind_chk CHECK (
    authenticity_classification != 'AI_ILLUSTRATIVE' OR (
      asset_kind = 'ai_illustrative' AND
      rights_source = 'ai_generated'
    )
  ),

  -- Blocker 7: REAL_CLIENT must not be AI kind or AI-generated rights.
  CONSTRAINT business_creative_assets_real_client_not_ai_chk CHECK (
    authenticity_classification != 'REAL_CLIENT' OR (
      asset_kind != 'ai_illustrative' AND
      rights_source != 'ai_generated'
    )
  ),

  -- Blocker 4: Same-business composite FK to jobs (only when job_id is non-NULL).
  -- Fix 1: ON DELETE RESTRICT — composite SET NULL is unsafe because business_id is NOT NULL.
  -- Application must explicitly detach asset from job before deleting the job.
  CONSTRAINT business_creative_assets_job_business_fk
    FOREIGN KEY (job_id, business_id)
    REFERENCES public.business_creative_jobs(id, business_id)
    ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS business_creative_assets_business_id_idx ON public.business_creative_assets (business_id);
CREATE INDEX IF NOT EXISTS business_creative_assets_job_id_idx ON public.business_creative_assets (job_id);

ALTER TABLE public.business_creative_assets ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_creative_assets FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_creative_assets FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_creative_assets FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_creative_assets FROM service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.business_creative_assets TO service_role;

COMMENT ON TABLE public.business_creative_assets IS
  'Program 6 — Image asset + rights model. No URL string as sufficient image truth. AI_ILLUSTRATIVE must never be REAL_CLIENT. UNKNOWN_RIGHTS cannot reach approved.';

-- =============================================================================================
-- E. business_creative_briefs — structured creative briefs.
-- Composite FK (job_id, business_id) → business_creative_jobs(id, business_id).
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.business_creative_briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,

  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'STAFF_APPROVED')),

  business_goal text NOT NULL CHECK (char_length(btrim(business_goal)) > 0),
  campaign_objective text NOT NULL CHECK (char_length(btrim(campaign_objective)) > 0),
  reader_need text NOT NULL CHECK (char_length(btrim(reader_need)) > 0),
  target_audience text NOT NULL CHECK (char_length(btrim(target_audience)) > 0),
  primary_language text NOT NULL CHECK (primary_language IN (
    'es', 'en', 'bilingual', 'es_primary_en_support', 'en_primary_es_support'
  )),
  secondary_language text NULL CHECK (secondary_language IS NULL OR secondary_language IN ('es', 'en')),
  primary_message text NOT NULL CHECK (char_length(btrim(primary_message)) > 0),
  supporting_message text NULL,
  offer text NULL,
  cta text NOT NULL CHECK (char_length(btrim(cta)) > 0),
  contact_path text NOT NULL CHECK (char_length(btrim(contact_path)) > 0),
  qr_target text NULL,
  key_services text[] NOT NULL DEFAULT '{}',
  trust_evidence text[] NOT NULL DEFAULT '{}',
  required_disclaimers text[] NOT NULL DEFAULT '{}',
  prohibited_claims text[] NOT NULL DEFAULT '{}',
  creative_lane text NOT NULL CHECK (creative_lane IN (
    'LANE_A_TRADITIONAL_UPGRADED', 'LANE_B_PREMIUM_CREATIVE', 'LANE_C_SPONSORED_EDITORIAL'
  )),
  archetype text NOT NULL CHECK (archetype IN (
    'AUTHORITY_TRADITIONAL_UPGRADED', 'PREMIUM_PHOTO_HERO', 'OFFER_PROMO_BLAST',
    'MULTI_PANEL_SERVICE_GRID', 'RECRUITMENT_HIRING', 'EVENT_VENUE_SHOWCASE',
    'SPONSORED_EDITORIAL', 'BUSINESS_PROFILE_STORY', 'PREMIUM_INSTITUTIONAL',
    'LEGACY_DIRECTORY_BASIC'
  )),
  format text NOT NULL CHECK (format IN (
    'FULL_BLEED', 'FULL_PAGE', 'HALF_HORIZONTAL', 'HALF_VERTICAL', 'QUARTER',
    'SPREAD_TRIM', 'SPREAD_BLEED'
  )),
  layout_options text[] NOT NULL DEFAULT '{"A"}',
  image_strategy text NOT NULL,
  must_use_asset_ids uuid[] NOT NULL DEFAULT '{}',
  optional_asset_ids uuid[] NOT NULL DEFAULT '{}',
  missing_asset_descriptions text[] NOT NULL DEFAULT '{}',
  source_recommendation_id uuid NULL,
  desired_action text NOT NULL,
  risk_class text NOT NULL DEFAULT 'NORMAL' CHECK (risk_class IN (
    'NORMAL', 'LEGAL', 'MEDICAL', 'FINANCIAL', 'INSURANCE', 'IMMIGRATION',
    'TAX', 'SAFETY', 'EMPLOYMENT', 'HOUSING'
  )),
  review_requirements text[] NOT NULL DEFAULT '{}',

  created_actor_type text NOT NULL CHECK (created_actor_type IN ('staff', 'owner')),
  created_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  created_by_auth_user_id uuid NOT NULL,
  created_by_email text NOT NULL,
  created_by_role text NOT NULL,

  approved_by_auth_user_id uuid NULL,
  approved_at timestamptz NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_creative_briefs_job_business_fk
    FOREIGN KEY (job_id, business_id)
    REFERENCES public.business_creative_jobs(id, business_id)
    ON DELETE CASCADE,

  CONSTRAINT business_creative_briefs_id_business_id_uk UNIQUE (id, business_id),

  CONSTRAINT business_creative_briefs_created_actor_chk CHECK (
    (created_actor_type = 'staff' AND created_by_roster_id IS NOT NULL) OR
    (created_actor_type = 'owner' AND created_by_roster_id IS NULL)
  ),

  -- STAFF_APPROVED requires approved_by_auth_user_id and approved_at.
  CONSTRAINT business_creative_briefs_approved_atomic_chk CHECK (
    status != 'STAFF_APPROVED' OR (
      approved_by_auth_user_id IS NOT NULL AND approved_at IS NOT NULL
    )
  )
);

CREATE INDEX IF NOT EXISTS business_creative_briefs_business_id_idx ON public.business_creative_briefs (business_id);
CREATE INDEX IF NOT EXISTS business_creative_briefs_job_id_idx ON public.business_creative_briefs (job_id);

ALTER TABLE public.business_creative_briefs ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_creative_briefs FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_creative_briefs FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_creative_briefs FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_creative_briefs FROM service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.business_creative_briefs TO service_role;

COMMENT ON TABLE public.business_creative_briefs IS
  'Program 6 — Structured creative briefs. No creative generation from an unapproved brief unless explicitly marked staff preview.';

-- Blocker 6: Same-business composite FK from briefs to business_recommendations.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'business_creative_briefs_recommendation_business_fk'
      AND table_name = 'business_creative_briefs'
  ) THEN
    ALTER TABLE public.business_creative_briefs
      ADD CONSTRAINT business_creative_briefs_recommendation_business_fk
      FOREIGN KEY (source_recommendation_id, business_id)
      REFERENCES public.business_recommendations(id, business_id)
      ON DELETE RESTRICT;
  END IF;
END $$;

-- Blocker 6: Same-business composite FK from job_versions.brief_id to briefs(id, business_id).
-- Ensures a version's brief belongs to the same job/business. Added after both tables exist.
-- Fix 2: ON DELETE RESTRICT — composite SET NULL is unsafe because business_id is NOT NULL.
-- Append-only versions must preserve the brief relationship they were generated from.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'business_creative_job_versions_brief_business_fk'
      AND table_name = 'business_creative_job_versions'
  ) THEN
    ALTER TABLE public.business_creative_job_versions
      ADD CONSTRAINT business_creative_job_versions_brief_business_fk
      FOREIGN KEY (brief_id, business_id)
      REFERENCES public.business_creative_briefs(id, business_id)
      ON DELETE RESTRICT;
  END IF;
END $$;

-- =============================================================================================
-- F. business_creative_compositions — composition zone assignments per version.
-- Composite FK (job_id, business_id) → business_creative_jobs(id, business_id).
-- Composite FK (version_id, business_id) → business_creative_job_versions(id, business_id).
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.business_creative_compositions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  version_id uuid NOT NULL,
  format text NOT NULL CHECK (format IN (
    'FULL_BLEED', 'FULL_PAGE', 'HALF_HORIZONTAL', 'HALF_VERTICAL', 'QUARTER',
    'SPREAD_TRIM', 'SPREAD_BLEED'
  )),
  archetype text NOT NULL,
  layout_variant text NOT NULL DEFAULT 'A' CHECK (layout_variant IN ('A', 'B', 'C')),
  zone_assignments jsonb NOT NULL DEFAULT '{}',
  zone_content jsonb NOT NULL DEFAULT '{}',

  -- Blocker 8: Composition provenance — who created this composition record.
  created_actor_type text NOT NULL CHECK (created_actor_type IN ('staff', 'owner')),
  created_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  created_by_auth_user_id uuid NOT NULL,
  created_by_email text NOT NULL,
  created_by_role text NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_creative_compositions_job_business_fk
    FOREIGN KEY (job_id, business_id)
    REFERENCES public.business_creative_jobs(id, business_id)
    ON DELETE CASCADE,

  CONSTRAINT business_creative_compositions_version_business_fk
    FOREIGN KEY (version_id, business_id)
    REFERENCES public.business_creative_job_versions(id, business_id)
    ON DELETE CASCADE,

  CONSTRAINT business_creative_compositions_created_actor_chk CHECK (
    (created_actor_type = 'staff' AND created_by_roster_id IS NOT NULL) OR
    (created_actor_type = 'owner' AND created_by_roster_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS business_creative_compositions_job_id_idx ON public.business_creative_compositions (job_id);
CREATE INDEX IF NOT EXISTS business_creative_compositions_business_id_idx ON public.business_creative_compositions (business_id);

ALTER TABLE public.business_creative_compositions ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_creative_compositions FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_creative_compositions FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_creative_compositions FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_creative_compositions FROM service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.business_creative_compositions TO service_role;

COMMENT ON TABLE public.business_creative_compositions IS
  'Program 6 — Composition zone assignments. Structured zones, never "put an image somewhere."';

-- =============================================================================================
-- G. business_creative_reviews — review history (append-only).
-- Composite FK (job_id, business_id) → business_creative_jobs(id, business_id).
-- Composite FK (version_id, business_id) → business_creative_job_versions(id, business_id).
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.business_creative_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  version_id uuid NOT NULL,
  issue_type text NOT NULL CHECK (issue_type IN (
    'FACT_ERROR', 'CONTACT_ERROR', 'OFFER_ERROR', 'SPELLING', 'TRANSLATION',
    'BRAND', 'IMAGE', 'RIGHTS', 'LAYOUT', 'READABILITY', 'QR', 'DISCLAIMER',
    'COMPLIANCE', 'RESOLUTION', 'OTHER'
  )),
  issue_description text NOT NULL CHECK (char_length(btrim(issue_description)) > 0),
  severity text NOT NULL CHECK (severity IN ('blocker', 'warning', 'minor', 'resolved')),
  -- Blocker 10: Append-only reviews — no UPDATEable resolved/resolved_at fields.
  -- Resolution is a new review record with issue_type='RESOLUTION' referencing the original.
  resolution_of_id uuid NULL,

  reviewer_actor_type text NOT NULL CHECK (reviewer_actor_type IN ('staff', 'owner')),
  reviewer_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  reviewer_auth_user_id uuid NOT NULL,
  reviewer_email text NOT NULL,
  reviewer_role text NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_creative_reviews_job_business_fk
    FOREIGN KEY (job_id, business_id)
    REFERENCES public.business_creative_jobs(id, business_id)
    ON DELETE CASCADE,

  CONSTRAINT business_creative_reviews_version_business_fk
    FOREIGN KEY (version_id, business_id)
    REFERENCES public.business_creative_job_versions(id, business_id)
    ON DELETE RESTRICT,

  -- Blocker 10: RESOLUTION records must reference the original issue.
  CONSTRAINT business_creative_reviews_resolution_ref_chk CHECK (
    issue_type != 'RESOLUTION' OR resolution_of_id IS NOT NULL
  ),

  -- Blocker 10: Non-RESOLUTION records must not carry resolution_of_id.
  CONSTRAINT business_creative_reviews_non_resolution_no_ref_chk CHECK (
    issue_type = 'RESOLUTION' OR resolution_of_id IS NULL
  ),

  -- Fix 4: Resolution severity semantics — deterministic mapping.
  -- RESOLUTION must have severity 'resolved'; all other issue types must use blocker/warning/minor.
  CONSTRAINT business_creative_reviews_resolution_severity_chk CHECK (
    (issue_type = 'RESOLUTION' AND severity = 'resolved') OR
    (issue_type != 'RESOLUTION' AND severity IN ('blocker', 'warning', 'minor'))
  ),

  CONSTRAINT business_creative_reviews_reviewer_actor_chk CHECK (
    (reviewer_actor_type = 'staff' AND reviewer_roster_id IS NOT NULL) OR
    (reviewer_actor_type = 'owner' AND reviewer_roster_id IS NULL)
  ),

  -- Fix 3: Composite unique identity for self-referential resolution FK.
  -- Allows (resolution_of_id, business_id, job_id, version_id) → reviews(id, business_id, job_id, version_id).
  CONSTRAINT business_creative_reviews_context_identity_uk UNIQUE (id, business_id, job_id, version_id)
);

CREATE INDEX IF NOT EXISTS business_creative_reviews_job_id_idx ON public.business_creative_reviews (job_id);
CREATE INDEX IF NOT EXISTS business_creative_reviews_business_id_idx ON public.business_creative_reviews (business_id);

ALTER TABLE public.business_creative_reviews ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_creative_reviews FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_creative_reviews FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_creative_reviews FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_creative_reviews FROM service_role;
GRANT SELECT, INSERT ON TABLE public.business_creative_reviews TO service_role;

COMMENT ON TABLE public.business_creative_reviews IS
  'Program 6 — Review history. Append-only. Reviewer actor + timestamp required.';

-- Fix 3: Self-referential composite FK for resolution_of_id.
-- Ensures a RESOLUTION record references a real original review in the same business, job, and version.
-- Guarded ALTER TABLE because self-referential FK requires the UNIQUE constraint to exist first.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'business_creative_reviews_resolution_of_business_fk'
      AND table_name = 'business_creative_reviews'
  ) THEN
    ALTER TABLE public.business_creative_reviews
      ADD CONSTRAINT business_creative_reviews_resolution_of_business_fk
      FOREIGN KEY (resolution_of_id, business_id, job_id, version_id)
      REFERENCES public.business_creative_reviews(id, business_id, job_id, version_id)
      ON DELETE RESTRICT;
  END IF;
END $$;

-- =============================================================================================
-- H. business_creative_exports — export history (append-only).
-- Composite FK (job_id, business_id) → business_creative_jobs(id, business_id).
-- Composite FK (version_id, business_id) → business_creative_job_versions(id, business_id).
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.business_creative_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  version_id uuid NOT NULL,
  export_type text NOT NULL CHECK (export_type IN (
    'CANVA_PRODUCTION_PACK_JSON', 'CANVA_PRODUCTION_BRIEF_TEXT', 'COPY_DECK',
    'IMAGE_BRIEF', 'PRINT_SPEC_SHEET', 'REVIEW_CHECKLIST', 'APPROVAL_SNAPSHOT',
    'CREATIVE_PROOF_PDF'
  )),
  content text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generated', 'failed')),
  generated_at timestamptz NULL,

  created_actor_type text NOT NULL CHECK (created_actor_type IN ('staff', 'owner')),
  created_by_auth_user_id uuid NOT NULL,
  created_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),

  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_creative_exports_job_business_fk
    FOREIGN KEY (job_id, business_id)
    REFERENCES public.business_creative_jobs(id, business_id)
    ON DELETE CASCADE,

  CONSTRAINT business_creative_exports_version_business_fk
    FOREIGN KEY (version_id, business_id)
    REFERENCES public.business_creative_job_versions(id, business_id)
    ON DELETE RESTRICT,

  CONSTRAINT business_creative_exports_created_actor_chk CHECK (
    (created_actor_type = 'staff' AND created_by_roster_id IS NOT NULL) OR
    (created_actor_type = 'owner' AND created_by_roster_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS business_creative_exports_job_id_idx ON public.business_creative_exports (job_id);
CREATE INDEX IF NOT EXISTS business_creative_exports_business_id_idx ON public.business_creative_exports (business_id);

ALTER TABLE public.business_creative_exports ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_creative_exports FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_creative_exports FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_creative_exports FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_creative_exports FROM service_role;
GRANT SELECT, INSERT ON TABLE public.business_creative_exports TO service_role;

COMMENT ON TABLE public.business_creative_exports IS
  'Program 6 — Export history. Append-only. V1: JSON, text, copy deck, image brief, print spec, review checklist, approval snapshot.';

-- =============================================================================================
-- I. business_creative_provider_runs — provider run history (append-only).
-- Composite FK (job_id, business_id) → business_creative_jobs(id, business_id).
-- Composite FK (version_id, business_id) → business_creative_job_versions(id, business_id)
--   — only enforced when version_id is non-NULL.
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.business_creative_provider_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  version_id uuid NULL,

  provider_key text NOT NULL,
  model_key text NOT NULL,
  template_version text NOT NULL DEFAULT 'v1',
  schema_version text NOT NULL DEFAULT 'v1',
  input_snapshot_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'fallback')),
  error_state text NULL,
  latency_ms int NULL CHECK (latency_ms IS NULL OR latency_ms >= 0),
  cost_metadata jsonb NULL,

  -- Blocker 8: Provider run provenance — who/what initiated this run.
  initiated_actor_type text NOT NULL CHECK (initiated_actor_type IN ('staff', 'owner', 'system')),
  initiated_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  initiated_by_auth_user_id uuid NULL,
  initiated_by_role text NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_creative_provider_runs_job_business_fk
    FOREIGN KEY (job_id, business_id)
    REFERENCES public.business_creative_jobs(id, business_id)
    ON DELETE CASCADE,

  -- Same-business version FK: only enforced when version_id is non-NULL.
  -- Blocker 6: version_id on provider_runs is the canonical relationship direction.
  CONSTRAINT business_creative_provider_runs_version_business_fk
    FOREIGN KEY (version_id, business_id)
    REFERENCES public.business_creative_job_versions(id, business_id)
    ON DELETE RESTRICT,

  -- Blocker 5: Composite same-business FK for snapshot reference.
  CONSTRAINT business_creative_provider_runs_snapshot_business_fk
    FOREIGN KEY (input_snapshot_id, business_id)
    REFERENCES public.business_creative_input_snapshots(id, business_id)
    ON DELETE RESTRICT,

  -- Blocker 8: Actor integrity for staff and owner; system has no human actor.
  CONSTRAINT business_creative_provider_runs_initiated_actor_chk CHECK (
    (initiated_actor_type = 'staff' AND initiated_by_roster_id IS NOT NULL AND initiated_by_auth_user_id IS NOT NULL) OR
    (initiated_actor_type = 'owner' AND initiated_by_roster_id IS NULL AND initiated_by_auth_user_id IS NOT NULL) OR
    (initiated_actor_type = 'system' AND initiated_by_roster_id IS NULL AND initiated_by_auth_user_id IS NULL AND char_length(btrim(initiated_by_role)) > 0)
  )
);

CREATE INDEX IF NOT EXISTS business_creative_provider_runs_job_id_idx ON public.business_creative_provider_runs (job_id);
CREATE INDEX IF NOT EXISTS business_creative_provider_runs_business_id_idx ON public.business_creative_provider_runs (business_id);

ALTER TABLE public.business_creative_provider_runs ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_creative_provider_runs FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_creative_provider_runs FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_creative_provider_runs FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_creative_provider_runs FROM service_role;
GRANT SELECT, INSERT ON TABLE public.business_creative_provider_runs TO service_role;

COMMENT ON TABLE public.business_creative_provider_runs IS
  'Program 6 — Provider run history. Append-only. Never store secret keys. Privacy-safe metadata only.';

-- =============================================================================================
-- Feature flags — reuses the existing business_identity_flags table.
-- All three default disabled, same as every prior gate's flag row.
-- =============================================================================================
INSERT INTO public.business_identity_flags (flag_key, enabled, emergency_disabled, pilot_user_ids)
VALUES
  ('business_creative_studio', false, false, '{}'),
  ('business_magazine_ad_studio', false, false, '{}'),
  ('business_sponsored_insert_studio', false, false, '{}')
ON CONFLICT (flag_key) DO NOTHING;

COMMIT;
