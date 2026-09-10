-- ADMIN-OS-01 GATE F — Business Identity Gate, minimum-change additive option, owner-approved.
--
-- Closes part of the confirmed gap: businesses.id has no join to listing_analytics,
-- leonix_payment_records, leonix_leads, or support_tickets (see
-- docs/admin-os/ADMIN_OS_CABLE_MAP.md, PEOPLE domain). The owner approved the additive
-- junction-table pattern already proven by business_listing_links (20260715120000), but
-- explicitly asked for a SEPARATE, clearly-named table for non-listing record types rather
-- than overloading business_listing_links's listing_source/listing_id with payments/leads/
-- support rows — those are a materially different kind of thing (transactions and
-- conversations, not category listings), and conflating them would blur what
-- "listing_source" means on that table.
--
-- Same doctrine as business_listing_links:
-- - Purely additive. Touches no existing table, column, or row. leonix_payment_records,
--   leonix_leads, support_tickets, and listing_analytics are read-only from this table's
--   point of view — nothing here mutates them or their existing writers.
-- - record_type is an open string validated at the application layer (see
--   app/lib/business/repositories/businessExternalLinksRepo.ts), not a SQL CHECK, exactly
--   like business_listing_links.listing_source — so new record types (contracts, analytics
--   sessions, ...) never require a migration to become linkable.
-- - No auto-linking, ever. Nothing in this schema or its RLS infers a business_id from a
--   free-text business_name match — every row is an explicit, staff-created link, mirroring
--   business_listing_links' verification model.
-- - RLS enabled, member-only SELECT via the existing is_active_business_member() helper
--   (20260715120000) — no new RLS recursion surface introduced. No authenticated mutation
--   policy: link creation is server/admin-only, exactly like business_listing_links.
-- - Inert on arrival, real write path added same day (Gate 2): no rows exist until this
--   migration is applied AND a staff member uses the explicit linking workflow
--   (POST /api/admin/businesses/[businessId]/external-links, gated by
--   requireStaffWorkspaceWriteAccess("create_internal_note")). Every write re-verifies the
--   target record's existence server-side before inserting — never a guess, never inferred
--   from business_name. Reads (businessExternalLinksRepo.ts) power the Business 360
--   "Connected records" section; Global Search consumption remains unbuilt.

CREATE TABLE IF NOT EXISTS public.business_external_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  record_type text NOT NULL,
  record_id text NOT NULL,
  relationship_role text NOT NULL DEFAULT 'primary',
  linked_by uuid NOT NULL REFERENCES auth.users (id) ON DELETE RESTRICT,
  linked_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz NULL,
  status text NOT NULL DEFAULT 'pending',
  notes text NULL,
  CONSTRAINT business_external_links_role_chk CHECK (relationship_role IN ('primary', 'secondary')),
  CONSTRAINT business_external_links_status_chk CHECK (status IN ('pending', 'verified', 'rejected', 'removed'))
);

COMMENT ON TABLE public.business_external_links IS
  'Additive link from a business to a non-listing external/internal record — payments (leonix_payment_records), leads (leonix_leads), support tickets (support_tickets), analytics sessions (listing_analytics), contracts, etc. (ADMIN-OS-01 Gate F). record_type is validated at the application layer against a registry in app/lib/business/repositories/businessExternalLinksRepo.ts, not by a SQL CHECK, so the two never drift out of sync. Never mutates the linked record. Deliberately separate from business_listing_links (which is for category listings only) per explicit owner direction.';

CREATE UNIQUE INDEX IF NOT EXISTS business_external_links_verified_identity_idx
  ON public.business_external_links (record_type, record_id)
  WHERE status = 'verified';

CREATE INDEX IF NOT EXISTS business_external_links_business_id_idx ON public.business_external_links (business_id);
CREATE INDEX IF NOT EXISTS business_external_links_type_id_idx ON public.business_external_links (record_type, record_id);

ALTER TABLE public.business_external_links ENABLE ROW LEVEL SECURITY;

-- Member SELECT only, reusing the existing is_active_business_member() helper from
-- 20260715120000 — no new function, no new RLS recursion surface.
DROP POLICY IF EXISTS business_external_links_select_active_member ON public.business_external_links;
CREATE POLICY business_external_links_select_active_member
  ON public.business_external_links
  FOR SELECT
  TO authenticated
  USING (public.is_active_business_member(business_id));

-- No authenticated INSERT/UPDATE/DELETE policy — link creation/verification is
-- server/admin-only (service-role client), exactly like business_listing_links.
