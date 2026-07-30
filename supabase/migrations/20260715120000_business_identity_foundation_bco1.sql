-- Gate BCO-1C.1 — canonical Business Identity foundation (Leonix Business Concierge).
-- Purely additive: seven new tables, their trigger functions, and RLS policies.
-- Touches no existing table, function, or row. Inert while
-- business_identity_flags.business_identity_foundation.enabled = false (no application
-- code reads or writes any of these tables yet).

-- =============================================================================
-- 1. businesses — canonical business identity record.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL,
  legal_name text NULL,
  public_name text NULL,
  normalized_name text NOT NULL,
  slug text NOT NULL,
  broad_business_type text NOT NULL,
  business_stage text NOT NULL,
  primary_language text NOT NULL DEFAULT 'es',
  status text NOT NULL DEFAULT 'active',
  onboarding_status text NOT NULL DEFAULT 'not_started',
  creation_source text NOT NULL,
  created_by_user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz NULL,
  CONSTRAINT businesses_primary_language_chk CHECK (primary_language IN ('es', 'en')),
  CONSTRAINT businesses_status_chk CHECK (status IN ('active', 'archived', 'suspended')),
  CONSTRAINT businesses_onboarding_status_chk CHECK (onboarding_status IN ('not_started', 'in_progress', 'complete'))
);

COMMENT ON TABLE public.businesses IS
  'Canonical Business Identity record (Leonix Business Concierge, Gate BCO-1C.1). Identity only — no Living Business Book, budget, or recommendation data belongs here.';

CREATE UNIQUE INDEX IF NOT EXISTS businesses_slug_idx ON public.businesses (slug);
CREATE INDEX IF NOT EXISTS businesses_normalized_name_idx ON public.businesses (normalized_name);
CREATE INDEX IF NOT EXISTS businesses_created_by_user_id_idx ON public.businesses (created_by_user_id);
CREATE INDEX IF NOT EXISTS businesses_status_onboarding_status_idx ON public.businesses (status, onboarding_status);

CREATE OR REPLACE FUNCTION public.businesses_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS businesses_updated_at ON public.businesses;
CREATE TRIGGER businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW
  EXECUTE PROCEDURE public.businesses_set_updated_at();

-- =============================================================================
-- 2. business_memberships — owner/member relationship between users and businesses.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.business_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE RESTRICT,
  membership_role text NOT NULL DEFAULT 'member',
  membership_status text NOT NULL DEFAULT 'active',
  is_primary_owner boolean NOT NULL DEFAULT false,
  invited_by_user_id uuid NULL REFERENCES auth.users (id) ON DELETE SET NULL,
  accepted_at timestamptz NULL,
  revoked_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT business_memberships_role_chk CHECK (membership_role IN ('owner', 'member')),
  CONSTRAINT business_memberships_status_chk CHECK (membership_status IN ('invited', 'active', 'revoked')),
  CONSTRAINT business_memberships_business_user_unique UNIQUE (business_id, user_id)
);

COMMENT ON TABLE public.business_memberships IS
  'Owner/member relationship between auth.users and businesses (Gate BCO-1C.1). Distinct from Leonix staff roles in admin_team_members.';

CREATE UNIQUE INDEX IF NOT EXISTS business_memberships_one_active_primary_owner_idx
  ON public.business_memberships (business_id)
  WHERE is_primary_owner = true AND membership_status = 'active';

CREATE INDEX IF NOT EXISTS business_memberships_user_id_idx ON public.business_memberships (user_id);
CREATE INDEX IF NOT EXISTS business_memberships_business_status_idx ON public.business_memberships (business_id, membership_status);

CREATE OR REPLACE FUNCTION public.business_memberships_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS business_memberships_updated_at ON public.business_memberships;
CREATE TRIGGER business_memberships_updated_at
  BEFORE UPDATE ON public.business_memberships
  FOR EACH ROW
  EXECUTE PROCEDURE public.business_memberships_set_updated_at();

-- =============================================================================
-- Exactly-one-active-primary-owner invariant.
--
-- The partial unique index above only proves "at most one" active primary owner.
-- These two deferred constraint triggers (fired by writes on `businesses` AND on
-- `business_memberships`) prove "at least one" as well, checked once at COMMIT
-- (DEFERRABLE INITIALLY DEFERRED), so a multi-statement transaction that creates a
-- business and its founding membership row is only validated after both statements
-- have run. Both functions are SECURITY DEFINER with a hardened search_path,
-- following the repository's existing precedent for hardened trigger functions
-- (see 20260423180000_listing_audit_events.sql's log_listing_lifecycle_audit()).
-- Being SECURITY DEFINER also means these guards apply to every writer, including
-- service-role writes, which are not subject to RLS and would otherwise be able to
-- bypass an application-only check.
--
-- Parent-delete guard: if the affected `businesses` row no longer exists (because
-- the business itself is being deleted, cascading its memberships away in the same
-- statement), the guard returns without enforcing the owner count — deleting a
-- business is expected to take its memberships with it. Without this guard, deleting
-- any businesses row would be permanently blocked, since after the cascade the owner
-- count is always zero.
--
-- Both functions only read businesses/business_memberships; neither writes to either
-- table, so there is no trigger recursion risk.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.assert_business_has_one_active_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected_business_id uuid := NEW.id;
  owner_count integer;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.businesses WHERE id = affected_business_id) THEN
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
BEGIN
  IF TG_OP = 'DELETE' THEN
    affected_business_id := OLD.business_id;
  ELSE
    affected_business_id := NEW.business_id;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.businesses WHERE id = affected_business_id) THEN
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

DROP TRIGGER IF EXISTS businesses_owner_guard ON public.businesses;
CREATE CONSTRAINT TRIGGER businesses_owner_guard
  AFTER INSERT ON public.businesses
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION public.assert_business_has_one_active_owner();

DROP TRIGGER IF EXISTS business_memberships_owner_guard ON public.business_memberships;
CREATE CONSTRAINT TRIGGER business_memberships_owner_guard
  AFTER INSERT OR UPDATE OR DELETE ON public.business_memberships
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION public.assert_business_has_one_active_owner_for_membership_change();

-- =============================================================================
-- 3. business_contacts — phone/email/website contact methods for a business.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.business_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  contact_type text NOT NULL,
  value text NOT NULL,
  normalized_value text NOT NULL,
  preferred_channel boolean NOT NULL DEFAULT false,
  channel_kind text NULL,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT business_contacts_type_chk CHECK (contact_type IN ('phone', 'email', 'website')),
  CONSTRAINT business_contacts_channel_kind_chk CHECK (channel_kind IS NULL OR channel_kind IN ('whatsapp', 'call', 'email')),
  -- Preferred phone may be whatsapp/call; preferred email must be email; website can never be preferred.
  CONSTRAINT business_contacts_preferred_combination_chk CHECK (
    preferred_channel = false
    OR (contact_type = 'phone' AND channel_kind IN ('whatsapp', 'call'))
    OR (contact_type = 'email' AND channel_kind = 'email')
  ),
  -- Non-preferred rows never carry a channel_kind value.
  CONSTRAINT business_contacts_non_preferred_channel_null_chk CHECK (
    preferred_channel = true OR channel_kind IS NULL
  )
);

COMMENT ON TABLE public.business_contacts IS
  'Phone/email/website contact methods for a business (Gate BCO-1C.1). No public SELECT policy — not shown on any public profile yet.';

CREATE UNIQUE INDEX IF NOT EXISTS business_contacts_one_primary_idx
  ON public.business_contacts (business_id)
  WHERE is_primary = true;

CREATE UNIQUE INDEX IF NOT EXISTS business_contacts_one_preferred_channel_idx
  ON public.business_contacts (business_id)
  WHERE preferred_channel = true;

CREATE INDEX IF NOT EXISTS business_contacts_business_id_idx ON public.business_contacts (business_id);

CREATE OR REPLACE FUNCTION public.business_contacts_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS business_contacts_updated_at ON public.business_contacts;
CREATE TRIGGER business_contacts_updated_at
  BEFORE UPDATE ON public.business_contacts
  FOR EACH ROW
  EXECUTE PROCEDURE public.business_contacts_set_updated_at();

-- =============================================================================
-- 4. business_service_areas — physical address or free-text service area.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.business_service_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  area_kind text NOT NULL,
  raw_text text NOT NULL,
  normalized_text text NOT NULL,
  city_hint text NULL,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT business_service_areas_kind_chk CHECK (area_kind IN ('physical_address', 'service_area_text'))
);

COMMENT ON TABLE public.business_service_areas IS
  'Physical address or free-text service area for a business (Gate BCO-1C.1). Multi-row shape supports future multi-location expansion without redesign.';

CREATE UNIQUE INDEX IF NOT EXISTS business_service_areas_one_primary_idx
  ON public.business_service_areas (business_id)
  WHERE is_primary = true;

CREATE INDEX IF NOT EXISTS business_service_areas_business_id_idx ON public.business_service_areas (business_id);

CREATE OR REPLACE FUNCTION public.business_service_areas_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS business_service_areas_updated_at ON public.business_service_areas;
CREATE TRIGGER business_service_areas_updated_at
  BEFORE UPDATE ON public.business_service_areas
  FOR EACH ROW
  EXECUTE PROCEDURE public.business_service_areas_set_updated_at();

-- =============================================================================
-- 5. business_listing_links — additive link from a business to an existing
-- category listing. Never mutates the linked listing row or its ownership.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.business_listing_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  listing_source text NOT NULL,
  listing_id text NOT NULL,
  relationship_role text NOT NULL DEFAULT 'primary',
  linked_by uuid NOT NULL REFERENCES auth.users (id) ON DELETE RESTRICT,
  linked_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz NULL,
  status text NOT NULL DEFAULT 'pending',
  CONSTRAINT business_listing_links_role_chk CHECK (relationship_role IN ('primary', 'secondary')),
  CONSTRAINT business_listing_links_status_chk CHECK (status IN ('pending', 'verified', 'rejected', 'removed'))
);

COMMENT ON TABLE public.business_listing_links IS
  'Additive link from a business to an existing category listing (Gate BCO-1C.1). listing_source is validated at the application layer against LISTING_SOURCE_OWNERSHIP_CONTRACT (app/lib/listingPlans/listingEntitlementOwnership.ts), not by a SQL CHECK, so the two never drift out of sync. Never mutates the linked listing row.';

CREATE UNIQUE INDEX IF NOT EXISTS business_listing_links_verified_identity_idx
  ON public.business_listing_links (listing_source, listing_id)
  WHERE status = 'verified';

CREATE INDEX IF NOT EXISTS business_listing_links_business_id_idx ON public.business_listing_links (business_id);
CREATE INDEX IF NOT EXISTS business_listing_links_source_id_idx ON public.business_listing_links (listing_source, listing_id);

-- =============================================================================
-- 6. business_onboarding_drafts — server-side save-and-resume for the future
-- onboarding wizard. Supports multiple simultaneous in-progress businesses per
-- user via (user_id, intent_key).
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.business_onboarding_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  intent_key text NOT NULL,
  business_id uuid NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  current_step integer NOT NULL DEFAULT 1,
  draft_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  CONSTRAINT business_onboarding_drafts_current_step_chk CHECK (current_step >= 1),
  CONSTRAINT business_onboarding_drafts_user_intent_unique UNIQUE (user_id, intent_key)
);

COMMENT ON TABLE public.business_onboarding_drafts IS
  'Server-side save-and-resume draft for the future Business Identity onboarding wizard (Gate BCO-1C.1). Disposable — deleted on successful onboarding completion, swept on expires_at.';

CREATE INDEX IF NOT EXISTS business_onboarding_drafts_user_id_idx ON public.business_onboarding_drafts (user_id);
CREATE INDEX IF NOT EXISTS business_onboarding_drafts_expires_at_idx ON public.business_onboarding_drafts (expires_at);

CREATE OR REPLACE FUNCTION public.business_onboarding_drafts_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS business_onboarding_drafts_updated_at ON public.business_onboarding_drafts;
CREATE TRIGGER business_onboarding_drafts_updated_at
  BEFORE UPDATE ON public.business_onboarding_drafts
  FOR EACH ROW
  EXECUTE PROCEDURE public.business_onboarding_drafts_set_updated_at();

-- =============================================================================
-- 7. business_identity_flags — server-only feature flag + pilot allowlist +
-- emergency disable for the whole Business Concierge foundation.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.business_identity_flags (
  flag_key text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT false,
  pilot_user_ids uuid[] NOT NULL DEFAULT '{}',
  emergency_disabled boolean NOT NULL DEFAULT false,
  notes text NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid NULL REFERENCES auth.users (id) ON DELETE SET NULL
);

COMMENT ON TABLE public.business_identity_flags IS
  'Server-only feature flag, pilot allowlist, and emergency disable for the Business Concierge foundation (Gate BCO-1C.1). No client SELECT policy — read only via a server-side service-role helper.';

CREATE OR REPLACE FUNCTION public.business_identity_flags_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS business_identity_flags_updated_at ON public.business_identity_flags;
CREATE TRIGGER business_identity_flags_updated_at
  BEFORE UPDATE ON public.business_identity_flags
  FOR EACH ROW
  EXECUTE PROCEDURE public.business_identity_flags_set_updated_at();

INSERT INTO public.business_identity_flags (flag_key, enabled, emergency_disabled, pilot_user_ids)
VALUES ('business_identity_foundation', false, false, '{}')
ON CONFLICT (flag_key) DO NOTHING;

-- =============================================================================
-- Membership-check helper (RLS recursion avoidance).
--
-- businesses/business_contacts/business_service_areas/business_listing_links all
-- need a "does auth.uid() have an active membership in this business" SELECT
-- predicate. business_memberships needs the same predicate against ITSELF, which
-- would otherwise make its own SELECT policy self-referential.
--
-- This function is SECURITY DEFINER with a hardened search_path, so its internal
-- SELECT against business_memberships runs under the function owner's privilege
-- (the migration-owning role, which is exempt from RLS by default since this table
-- is not created with FORCE ROW LEVEL SECURITY) rather than being re-filtered by the
-- caller's RLS policy. That is what avoids recursive RLS evaluation: the inner query
-- is a plain, RLS-bypassed row count, not another RLS-filtered application of the
-- same policy. EXECUTE is restricted to `authenticated` only (revoked from PUBLIC),
-- and the function only ever returns a boolean for a single business_id the caller
-- already supplied — it grants no broader read access than "is a member of this one
-- business," matching the least-privilege intent of every SELECT policy that uses it.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_active_business_member(target_business_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.business_memberships
    WHERE business_id = target_business_id
      AND user_id = auth.uid()
      AND membership_status = 'active'
  );
$$;

REVOKE ALL ON FUNCTION public.is_active_business_member(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_active_business_member(uuid) TO authenticated;

-- =============================================================================
-- RLS
-- =============================================================================

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_service_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_listing_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_onboarding_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_identity_flags ENABLE ROW LEVEL SECURITY;

-- businesses: member SELECT only. No authenticated INSERT/UPDATE/DELETE policy in
-- this schema gate — creation and mutation are server-controlled in a later gate.
DROP POLICY IF EXISTS businesses_select_active_member ON public.businesses;
CREATE POLICY businesses_select_active_member
  ON public.businesses
  FOR SELECT
  TO authenticated
  USING (public.is_active_business_member(id));

-- business_memberships: a member may see the full roster of businesses they
-- themselves are an active member of. No authenticated mutation policy.
DROP POLICY IF EXISTS business_memberships_select_active_member ON public.business_memberships;
CREATE POLICY business_memberships_select_active_member
  ON public.business_memberships
  FOR SELECT
  TO authenticated
  USING (public.is_active_business_member(business_id));

-- business_contacts: member SELECT only.
DROP POLICY IF EXISTS business_contacts_select_active_member ON public.business_contacts;
CREATE POLICY business_contacts_select_active_member
  ON public.business_contacts
  FOR SELECT
  TO authenticated
  USING (public.is_active_business_member(business_id));

-- business_service_areas: member SELECT only.
DROP POLICY IF EXISTS business_service_areas_select_active_member ON public.business_service_areas;
CREATE POLICY business_service_areas_select_active_member
  ON public.business_service_areas
  FOR SELECT
  TO authenticated
  USING (public.is_active_business_member(business_id));

-- business_listing_links: member SELECT only.
DROP POLICY IF EXISTS business_listing_links_select_active_member ON public.business_listing_links;
CREATE POLICY business_listing_links_select_active_member
  ON public.business_listing_links
  FOR SELECT
  TO authenticated
  USING (public.is_active_business_member(business_id));

-- business_onboarding_drafts: the one direct client-write exception in this schema
-- gate. A user may only ever see/create/update/delete their own draft rows.
DROP POLICY IF EXISTS business_onboarding_drafts_select_own ON public.business_onboarding_drafts;
CREATE POLICY business_onboarding_drafts_select_own
  ON public.business_onboarding_drafts
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS business_onboarding_drafts_insert_own ON public.business_onboarding_drafts;
CREATE POLICY business_onboarding_drafts_insert_own
  ON public.business_onboarding_drafts
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS business_onboarding_drafts_update_own ON public.business_onboarding_drafts;
CREATE POLICY business_onboarding_drafts_update_own
  ON public.business_onboarding_drafts
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS business_onboarding_drafts_delete_own ON public.business_onboarding_drafts;
CREATE POLICY business_onboarding_drafts_delete_own
  ON public.business_onboarding_drafts
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- business_identity_flags: no anon/authenticated policies at all — server-only
-- access via the service-role client, matching the admin_team_members /
-- listing_package_entitlements convention.
