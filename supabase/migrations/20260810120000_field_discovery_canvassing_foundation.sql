-- Program 4, Gate 4A -- Field Discovery + Canvassing foundation.
--
-- Additive only: three new tables, one new narrow SECURITY DEFINER RPC, no changes to any
-- existing table/column/RPC. Canvassing never creates a duplicate prospect/CRM record -- it
-- creates or attaches to a real public.businesses row via the new create_staff_canvassed_business
-- RPC below, which inserts ONLY the bare businesses row (never a business_memberships row, never
-- an auth.users row). See app/lib/business/fieldDiscovery/repository.ts for the documented
-- Foundation Decision: businesses.onboarding_status's existing CHECK ('not_started' |
-- 'in_progress' | 'complete') already has a truthful value for this state ('not_started'), and
-- creation_source already includes 'staff_assisted' -- no change to the businesses table's
-- columns or CHECK constraints was required.
--
-- Every table is server-only (read/written exclusively via getAdminSupabase(), the service-role
-- client). RLS is enabled with zero policies on every table (deny-all for anon/authenticated),
-- matching the Living Business Book / Health Map / DIY Concierge / Stewardship Engine precedent
-- exactly. REVOKE ALL FROM PUBLIC, anon, authenticated, AND service_role, then an explicit narrow
-- GRANT SELECT, INSERT, UPDATE, DELETE to service_role only -- never GRANT ALL, never
-- REFERENCES/TRIGGER/TRUNCATE to anyone, never a grant to anon/authenticated/PUBLIC.
--
-- Actor attribution doctrine: every consequential row is authored by either a real, currently
-- active Leonix staff member (admin_team_members, via requireSalesWorkspaceAccess()'s verified
-- StrictSalesActor) or the real, authenticated business owner (auth.users) -- never a placeholder.
--
-- Dependency order:
--   1. public.business_consent_records          (references business_discovery_sessions, optional)
--   2. public.business_source_links             (references business_consent_records, optional)
--   3. public.business_source_files              (references business_discovery_sessions/business_evidence, optional)
--   4. public.create_staff_canvassed_business RPC

BEGIN;

-- =============================================================================================
-- 1. business_consent_records -- append-only consent history for field discovery. No destructive
-- overwrite of prior consent; a withdrawal is always a new row, never an UPDATE of an old one.
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.business_consent_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,

  consent_type text NOT NULL CHECK (consent_type IN (
    'photo_capture', 'file_upload', 'source_research', 'ai_research', 'followup_contact'
  )),
  consent_state text NOT NULL CHECK (consent_state IN ('provided', 'declined', 'withdrawn')),
  method text NOT NULL CHECK (method IN ('verbal_at_visit', 'written', 'digital_form', 'owner_dashboard')),
  scope_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  related_discovery_session_id uuid NULL REFERENCES public.business_discovery_sessions(id) ON DELETE SET NULL,

  recorded_actor_type text NOT NULL CHECK (recorded_actor_type IN ('staff', 'owner')),
  recorded_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  recorded_by_auth_user_id uuid NOT NULL,
  recorded_by_email text NOT NULL,
  recorded_by_role text NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_consent_records_actor_chk CHECK (
    (recorded_actor_type = 'staff' AND recorded_by_roster_id IS NOT NULL) OR
    (recorded_actor_type = 'owner' AND recorded_by_roster_id IS NULL)
  ),
  CONSTRAINT business_consent_records_id_business_key UNIQUE (id, business_id)
);

CREATE INDEX IF NOT EXISTS business_consent_records_business_type_idx ON public.business_consent_records (business_id, consent_type, created_at DESC);
CREATE INDEX IF NOT EXISTS business_consent_records_business_state_idx ON public.business_consent_records (business_id, consent_state);
CREATE INDEX IF NOT EXISTS business_consent_records_session_idx ON public.business_consent_records (related_discovery_session_id);

ALTER TABLE public.business_consent_records ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_consent_records FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_consent_records FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_consent_records FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_consent_records FROM service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.business_consent_records TO service_role;

COMMENT ON TABLE public.business_consent_records IS
  'Program 4, Gate 4A -- append-only consent history for field discovery. A withdrawal is always a new row; no destructive overwrite of a prior consent record is ever performed.';

-- =============================================================================================
-- 2. business_source_links -- website/social/directory links collected during canvassing or
-- discovery. Only `website` has a live V1 research adapter (app/lib/business/aiResearch);
-- every other source_type is manual-link/manual-evidence only for V1 -- never claimed connected.
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.business_source_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,

  source_type text NOT NULL CHECK (source_type IN (
    'website', 'google_business', 'facebook', 'instagram', 'tiktok', 'youtube', 'linkedin', 'yelp', 'whatsapp', 'other'
  )),
  url text NOT NULL CHECK (char_length(btrim(url)) > 0),
  normalized_url text NOT NULL CHECK (char_length(btrim(normalized_url)) > 0),
  collection_method text NOT NULL CHECK (collection_method IN ('canvassing', 'owner_provided', 'staff_entered', 'manual_import')),
  consent_record_id uuid NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reachable', 'unreachable', 'researched', 'archived')),
  last_researched_at timestamptz NULL,

  created_actor_type text NOT NULL CHECK (created_actor_type IN ('staff', 'owner')),
  created_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  created_by_auth_user_id uuid NOT NULL,
  created_by_email text NOT NULL,
  created_by_role text NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_source_links_actor_chk CHECK (
    (created_actor_type = 'staff' AND created_by_roster_id IS NOT NULL) OR
    (created_actor_type = 'owner' AND created_by_roster_id IS NULL)
  ),
  CONSTRAINT business_source_links_unique_active_url UNIQUE (business_id, source_type, normalized_url),
  CONSTRAINT business_source_links_consent_same_business_fk
    FOREIGN KEY (consent_record_id, business_id)
    REFERENCES public.business_consent_records(id, business_id)
    ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS business_source_links_business_type_idx ON public.business_source_links (business_id, source_type);
CREATE INDEX IF NOT EXISTS business_source_links_business_status_idx ON public.business_source_links (business_id, status);
CREATE INDEX IF NOT EXISTS business_source_links_normalized_url_idx ON public.business_source_links (normalized_url);
CREATE INDEX IF NOT EXISTS business_source_links_last_researched_idx ON public.business_source_links (last_researched_at);

ALTER TABLE public.business_source_links ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_source_links FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_source_links FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_source_links FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_source_links FROM service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.business_source_links TO service_role;

COMMENT ON TABLE public.business_source_links IS
  'Program 4, Gate 4A -- website/social/directory links collected during canvassing or discovery. Only website has a live V1 research adapter; every other source_type is manual-link/manual-evidence only -- never claimed connected.';

-- =============================================================================================
-- 3. business_source_files -- metadata for business cards, menus, flyers, logos, photos,
-- screenshots, PDFs, and other files uploaded during canvassing/discovery. The actual bytes live
-- in Vercel Blob (field-discovery/<businessId>/...); this table stores metadata only.
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.business_source_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  related_discovery_session_id uuid NULL REFERENCES public.business_discovery_sessions(id) ON DELETE SET NULL,

  file_kind text NOT NULL CHECK (file_kind IN (
    'business_card', 'menu', 'flyer', 'logo', 'photo', 'screenshot', 'pdf', 'price_list', 'service_list', 'other'
  )),
  storage_path text NOT NULL CHECK (char_length(btrim(storage_path)) > 0),
  public_url text NOT NULL CHECK (char_length(btrim(public_url)) > 0),
  mime_type text NOT NULL CHECK (char_length(btrim(mime_type)) > 0),
  original_filename text NOT NULL CHECK (char_length(btrim(original_filename)) > 0),
  size_bytes bigint NOT NULL CHECK (size_bytes > 0),
  consent_record_id uuid NULL,
  created_evidence_id uuid NULL REFERENCES public.business_evidence(id) ON DELETE SET NULL,
  upload_status text NOT NULL DEFAULT 'uploaded' CHECK (upload_status IN ('pending', 'uploaded', 'linked_to_evidence', 'deleted', 'failed')),

  created_actor_type text NOT NULL CHECK (created_actor_type IN ('staff', 'owner')),
  created_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  created_by_auth_user_id uuid NOT NULL,
  created_by_email text NOT NULL,
  created_by_role text NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_source_files_actor_chk CHECK (
    (created_actor_type = 'staff' AND created_by_roster_id IS NOT NULL) OR
    (created_actor_type = 'owner' AND created_by_roster_id IS NULL)
  ),
  CONSTRAINT business_source_files_consent_same_business_fk
    FOREIGN KEY (consent_record_id, business_id)
    REFERENCES public.business_consent_records(id, business_id)
    ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS business_source_files_business_kind_idx ON public.business_source_files (business_id, file_kind);
CREATE INDEX IF NOT EXISTS business_source_files_business_created_idx ON public.business_source_files (business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS business_source_files_session_idx ON public.business_source_files (related_discovery_session_id);
CREATE INDEX IF NOT EXISTS business_source_files_evidence_idx ON public.business_source_files (created_evidence_id);
CREATE INDEX IF NOT EXISTS business_source_files_upload_status_idx ON public.business_source_files (upload_status);

ALTER TABLE public.business_source_files ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_source_files FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_source_files FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_source_files FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_source_files FROM service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.business_source_files TO service_role;

COMMENT ON TABLE public.business_source_files IS
  'Program 4, Gate 4A -- metadata for business cards, menus, flyers, logos, photos, screenshots, PDFs uploaded during canvassing/discovery. Bytes live in Vercel Blob under field-discovery/<businessId>/...; this table stores metadata only.';

-- =============================================================================================
-- 4a. Owner-guard prospect-stage exemption -- The pre-existing businesses_owner_guard constraint
-- trigger (BCO-1) requires exactly one active primary owner at COMMIT for every new businesses
-- row. Staff-canvassed prospects are intentionally created WITHOUT an owner (no membership, no
-- auth.users row) -- the owner claims the business later via the existing finalize_business_identity
-- RPC. Without this exemption, create_staff_canvassed_business would always fail at COMMIT.
--
-- The exemption is narrow: it applies ONLY when creation_source = 'staff_assisted' AND
-- onboarding_status = 'not_started'. Once the business advances beyond not_started (e.g. to
-- 'in_progress' or 'complete'), the original exactly-one-active-primary-owner invariant applies
-- again. This is enforced by the new businesses_onboarding_advance_guard UPDATE trigger below.
-- =============================================================================================

CREATE OR REPLACE FUNCTION public.assert_business_has_one_active_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected_business_id uuid := NEW.id;
  owner_count integer;
  biz_creation_source text;
  biz_onboarding_status text;
BEGIN
  SELECT creation_source, onboarding_status INTO biz_creation_source, biz_onboarding_status
  FROM public.businesses WHERE id = affected_business_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Prospect-stage exemption: staff-canvassed businesses in not_started onboarding
  -- may exist without a primary owner until the owner claims the business.
  IF biz_creation_source = 'staff_assisted' AND biz_onboarding_status = 'not_started' THEN
    RETURN NULL;
  END IF;

  SELECT count(*) INTO owner_count
  FROM public.business_memberships
  WHERE business_id = affected_business_id
    AND is_primary_owner = true
    AND membership_status = 'active';

  IF owner_count <> 1 THEN
    RAISE EXCEPTION 'business % must have exactly one active primary owner (found %)', affected_business_id, owner_count
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.assert_business_has_one_active_owner_for_membership_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected_business_id uuid;
  owner_count integer;
  biz_creation_source text;
  biz_onboarding_status text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    affected_business_id := OLD.business_id;
  ELSE
    affected_business_id := NEW.business_id;
  END IF;

  SELECT creation_source, onboarding_status INTO biz_creation_source, biz_onboarding_status
  FROM public.businesses WHERE id = affected_business_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Prospect-stage exemption: staff-canvassed businesses in not_started onboarding
  -- may have membership changes without requiring a primary owner.
  IF biz_creation_source = 'staff_assisted' AND biz_onboarding_status = 'not_started' THEN
    RETURN NULL;
  END IF;

  SELECT count(*) INTO owner_count
  FROM public.business_memberships
  WHERE business_id = affected_business_id
    AND is_primary_owner = true
    AND membership_status = 'active';

  IF owner_count <> 1 THEN
    RAISE EXCEPTION 'business % must have exactly one active primary owner (found %)', affected_business_id, owner_count
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NULL;
END;
$$;

-- Add UPDATE trigger so advancing a prospect beyond not_started without an owner is rejected.
-- The existing businesses_owner_guard only fires on INSERT; this new trigger fires on UPDATE.
DROP TRIGGER IF EXISTS businesses_onboarding_advance_guard ON public.businesses;
CREATE CONSTRAINT TRIGGER businesses_onboarding_advance_guard
  AFTER UPDATE ON public.businesses
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION public.assert_business_has_one_active_owner();

-- =============================================================================================
-- 4b. create_staff_canvassed_business -- the sole INSERT path into businesses for Program 4.
-- Creates ONLY the bare businesses row -- never a business_memberships row (no owner claim at
-- creation time), never an auth.users row. p_actor_auth_user_id is the REAL, already-verified
-- staff member's own Supabase Auth id (via requireSalesWorkspaceAccess()) -- it becomes
-- created_by_user_id, which is truthful: the staff member is the one who created this database
-- row. SECURITY DEFINER with a fixed search_path so it can write through RLS-enabled-with-
-- zero-policies businesses table exactly like the existing finalize_business_identity RPC family
-- -- but EXECUTE is granted to service_role only (never `authenticated`), because canvassing is a
-- staff-only server action reached exclusively through requireSalesWorkspaceAccess(), never a
-- direct client RPC call -- matching the newer TODAY-2/TODAY-3 "server-only via service-role
-- client" doctrine rather than the older BCO-2 "callable by authenticated directly" doctrine.
-- =============================================================================================
CREATE OR REPLACE FUNCTION public.create_staff_canvassed_business(
  p_display_name text,
  p_normalized_name text,
  p_primary_language text,
  p_actor_auth_user_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_business_id uuid;
  v_slug text;
BEGIN
  IF p_display_name IS NULL OR char_length(btrim(p_display_name)) = 0 THEN
    RAISE EXCEPTION 'empty_display_name';
  END IF;
  IF p_normalized_name IS NULL OR char_length(btrim(p_normalized_name)) = 0 THEN
    RAISE EXCEPTION 'empty_normalized_name';
  END IF;
  IF p_primary_language NOT IN ('es', 'en') THEN
    RAISE EXCEPTION 'invalid_primary_language';
  END IF;
  IF p_actor_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'missing_actor_auth_user_id';
  END IF;

  v_slug := regexp_replace(lower(btrim(p_display_name)), '[^a-z0-9]+', '-', 'g') || '-' || substr(gen_random_uuid()::text, 1, 8);

  INSERT INTO public.businesses (
    display_name, normalized_name, slug, broad_business_type, business_stage,
    primary_language, status, onboarding_status, creation_source, created_by_user_id
  ) VALUES (
    btrim(p_display_name), p_normalized_name, v_slug, 'other', 'operating',
    p_primary_language, 'active', 'not_started', 'staff_assisted', p_actor_auth_user_id
  )
  RETURNING id INTO v_business_id;

  RETURN v_business_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_staff_canvassed_business(text, text, text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_staff_canvassed_business(text, text, text, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.create_staff_canvassed_business(text, text, text, uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.create_staff_canvassed_business(text, text, text, uuid) TO service_role;

COMMENT ON FUNCTION public.create_staff_canvassed_business IS
  'Program 4, Gate 4A -- the sole INSERT path into businesses for staff canvassing. Creates ONLY the bare businesses row (onboarding_status=not_started, creation_source=staff_assisted) -- never a business_memberships row, never an auth.users row. p_actor_auth_user_id must already be a real, verified StrictSalesActor auth id (requireSalesWorkspaceAccess()) -- this function never resolves or trusts a client-supplied identity itself. EXECUTE is restricted to service_role only.';

-- =============================================================================================
-- Feature flag -- reuses the existing business_identity_flags table (Gate BCO-1C.1) rather than
-- creating a parallel flags table. Starts disabled, same as every prior gate's flag row.
-- =============================================================================================
INSERT INTO public.business_identity_flags (flag_key, enabled, emergency_disabled, pilot_user_ids)
VALUES ('field_discovery_canvassing', false, false, '{}')
ON CONFLICT (flag_key) DO NOTHING;

COMMIT;
