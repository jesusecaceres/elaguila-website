-- Gate BCO-4A/Gate B/Gate B.1/Gate B.2 — canonical staff roster foundation + Sales Team Business
-- Workspace, in one corrected, dependency-ordered, additive migration.
--
-- REPLACES the withdrawn 20260719120000_business_sales_workspace_foundation.sql, which was never
-- applied to staging (confirmed via live read-only introspection of the staging REST API's
-- exposed-table list before this migration was written) and is deleted rather than superseded, so
-- there is exactly one pending migration file for this package, not two.
--
-- Gate B.2 root cause: staging diagnostics (owner-run) showed public.admin_team_members does not
-- exist on staging at all. A migration file defining it (20260408183000_control_center_extensions.sql)
-- exists in this repo, but was evidently never applied there — this migration does not assume
-- that file ran first. Every statement below is written to produce the correct final shape whether
-- admin_team_members does not exist yet (fresh CREATE) or already exists with the OLD, narrower
-- shape from that 2026-04-08 migration (defensive ALTER/guarded-constraint statements). No
-- statement in this file is destructive and no statement here touches
-- 20260408183000_control_center_extensions.sql itself.
--
-- Dependency order (matters for the foreign keys below):
--   1. public.admin_team_members       (canonical staff roster — new/corrected)
--   2. public.business_sales_profiles  (references admin_team_members)
--   3. public.business_sales_notes     (references admin_team_members)
--   4. public.business_follow_ups      (references admin_team_members)
--   5. public.business_sales_audit_log (references admin_team_members)
--   6. public.admin_roster_audit_log   (references admin_team_members — new)

-- =============================================================================================
-- 1. public.admin_team_members — canonical staff roster.
--
-- Preserves every column the already-shipped legacy admin system reads/writes today
-- (email, display_name, role, is_active, permissions, notes, created_at, updated_at — see
-- app/admin/_lib/adminUserProvisioning.ts, app/admin/adminTeamActions.ts,
-- app/admin/_lib/leonixAdminGate.ts, app/admin/(dashboard)/team/roster/page.tsx), and adds the
-- columns required for Sales Workspace actor attribution and staff-roster audit attribution:
-- auth_user_id (links a roster row to its Supabase Auth identity), created_by_auth_user_id /
-- updated_by_auth_user_id (who provisioned/last changed this row — nullable, because the very
-- first super_admin row has no prior administrator to attribute to).
--
-- Role values are locked to the exact 9 strings actually used across this repo today — confirmed
-- by grep across app/admin/_lib/adminUserProvisioning.ts (ADMIN_STAFF_ROLES, the authoritative
-- staff-creation allow-list), app/admin/_lib/teamTypes.ts (AdminTeamRole), and
-- app/admin/_lib/adminAuthBoundary.ts (canAccessStaffAdminFromMember). "owner_admin" is
-- deliberately NOT in this list: it is a normalized/derived access level computed in
-- app/admin/_lib/adminAccessControl.ts (normalizeAdminRole), never a raw value stored in this
-- column by any existing code path.
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.admin_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid NULL,
  email text NOT NULL,
  display_name text,
  role text NOT NULL DEFAULT 'read_only',
  is_active boolean NOT NULL DEFAULT true,
  permissions jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  created_by_auth_user_id uuid NULL,
  updated_by_auth_user_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Defensive patch path: if admin_team_members already exists on this database with the OLD
-- (2026-04-08) shape, these add the new columns without disturbing existing rows or existing
-- application code, which never reads/writes these three columns today.
ALTER TABLE public.admin_team_members ADD COLUMN IF NOT EXISTS auth_user_id uuid;
ALTER TABLE public.admin_team_members ADD COLUMN IF NOT EXISTS created_by_auth_user_id uuid;
ALTER TABLE public.admin_team_members ADD COLUMN IF NOT EXISTS updated_by_auth_user_id uuid;

-- Case-insensitive uniqueness, matching the exact index name and semantics the legacy migration
-- already used — idempotent regardless of which migration creates the table first.
CREATE UNIQUE INDEX IF NOT EXISTS admin_team_members_email_lower_idx ON public.admin_team_members (lower(email));

-- One auth user per roster row. A plain UNIQUE index on a nullable column allows any number of
-- rows with auth_user_id IS NULL (roster rows not yet linked to a Supabase Auth login), which is
-- the correct "unique when present" semantics — not a partial-index workaround.
CREATE UNIQUE INDEX IF NOT EXISTS admin_team_members_auth_user_id_key ON public.admin_team_members (auth_user_id);

CREATE INDEX IF NOT EXISTS admin_team_members_role_idx ON public.admin_team_members (role);

-- Guarded CHECK additions: Postgres has no "ADD CONSTRAINT IF NOT EXISTS" for CHECK constraints,
-- so existence is tested against pg_constraint first. Safe to run against a fresh table (created
-- above in this same statement batch, so the constraint is simply absent yet) or an
-- already-existing table from a prior partial run of this same migration.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'admin_team_members_role_check'
  ) THEN
    ALTER TABLE public.admin_team_members
      ADD CONSTRAINT admin_team_members_role_check CHECK (role IN (
        'super_admin', 'sales_manager', 'sales_rep', 'billing_support', 'content_manager',
        'ads_moderator', 'support_agent', 'magazine_editor', 'read_only'
      ));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'admin_team_members_email_not_empty_check'
  ) THEN
    ALTER TABLE public.admin_team_members
      ADD CONSTRAINT admin_team_members_email_not_empty_check CHECK (char_length(btrim(email)) > 0);
  END IF;
END $$;

-- Defense-in-depth: application code already normalizes to trim().toLowerCase() before every
-- write (adminUserProvisioning.ts's normalizeEmail(), adminTeamActions.ts's str()+toLowerCase()),
-- and admin_team_members_email_lower_idx already enforces uniqueness case-insensitively — this
-- constraint additionally guarantees the STORED value itself is always already lowercase, so a
-- direct SQL write that bypasses application code cannot silently create a mixed-case row that
-- only differs from an existing row by case (which the unique index would catch) or, more subtly,
-- a single un-normalized row with no conflicting duplicate to catch it.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'admin_team_members_email_lowercase_check'
  ) THEN
    ALTER TABLE public.admin_team_members
      ADD CONSTRAINT admin_team_members_email_lowercase_check CHECK (email = lower(email));
  END IF;
END $$;

ALTER TABLE public.admin_team_members ENABLE ROW LEVEL SECURITY;

-- Explicit grant hardening (Gate BCO-4A.5/4A.6, owner-proven on staging). Do not rely on RLS
-- alone. REVOKE ... FROM PUBLIC is required to actually strip the blanket grant anon/authenticated
-- inherit on this project (their access was never a role-specific GRANT, only the PUBLIC
-- pseudo-role default privilege). The table owner (whichever role runs this migration, typically
-- postgres via the SQL Editor) is unaffected by REVOKE FROM PUBLIC -- ownership privileges are
-- granted implicitly and are not part of the revocable GRANT/REVOKE system, so no separate GRANT
-- to postgres is needed. service_role (getAdminSupabase(), the only backend that ever touches
-- these tables) is NOT the owner and DOES need an explicit grant -- confirmed live on staging that
-- the exact DML verbs actually used by the application (SELECT, INSERT, UPDATE, DELETE) must be
-- granted explicitly; this migration matches that proven-working statement exactly rather than
-- GRANT ALL PRIVILEGES, so the migration and live staging state cannot drift apart.
REVOKE ALL PRIVILEGES ON TABLE public.admin_team_members FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.admin_team_members TO service_role;

COMMENT ON TABLE public.admin_team_members IS
  'Gate BCO-4A.3 — canonical Leonix staff roster. Never exposed to entrepreneur-facing code; read/written exclusively via the service-role admin client (getAdminSupabase()), gated server-side by role/capability checks (leonixAdminGate.ts, businessWorkspaceAccess.ts). The shared bootstrap password never grants a roster identity — an active row here, resolved by real per-person login, is required for Sales Workspace access and for staff-roster management.';

-- =============================================================================================
-- 2. business_sales_profiles — one row per business, sales-workspace status only.
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.business_sales_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL UNIQUE REFERENCES public.businesses(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'new' CHECK (status IN (
    'new', 'needs_review', 'ready_to_contact', 'contacted', 'follow_up_due',
    'waiting_on_owner', 'not_a_fit_right_now', 'active_client', 'archived'
  )),
  last_contacted_at timestamptz NULL,
  created_by_roster_id uuid NOT NULL REFERENCES public.admin_team_members(id),
  created_by_auth_user_id uuid NOT NULL,
  created_by_email text NOT NULL,
  created_by_role text NOT NULL,
  updated_by_roster_id uuid NOT NULL REFERENCES public.admin_team_members(id),
  updated_by_auth_user_id uuid NOT NULL,
  updated_by_email text NOT NULL,
  updated_by_role text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS business_sales_profiles_status_idx ON public.business_sales_profiles (status);

ALTER TABLE public.business_sales_profiles ENABLE ROW LEVEL SECURITY;

-- Explicit grant hardening (Gate BCO-4A.5/4A.6, owner-proven on staging). Do not rely on RLS
-- alone. REVOKE ... FROM PUBLIC is required to actually strip the blanket grant anon/authenticated
-- inherit on this project (their access was never a role-specific GRANT, only the PUBLIC
-- pseudo-role default privilege). The table owner (whichever role runs this migration, typically
-- postgres via the SQL Editor) is unaffected by REVOKE FROM PUBLIC -- ownership privileges are
-- granted implicitly and are not part of the revocable GRANT/REVOKE system, so no separate GRANT
-- to postgres is needed. service_role (getAdminSupabase(), the only backend that ever touches
-- these tables) is NOT the owner and DOES need an explicit grant -- confirmed live on staging that
-- the exact DML verbs actually used by the application (SELECT, INSERT, UPDATE, DELETE) must be
-- granted explicitly; this migration matches that proven-working statement exactly rather than
-- GRANT ALL PRIVILEGES, so the migration and live staging state cannot drift apart.
REVOKE ALL PRIVILEGES ON TABLE public.business_sales_profiles FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.business_sales_profiles TO service_role;

COMMENT ON TABLE public.business_sales_profiles IS
  'Gate BCO-4A — internal sales-workspace status for a business. Owner never sees this table; app/admin/(dashboard)/businesses/** only, gated by requireSalesWorkspaceAccess(). Read/written exclusively via the service-role admin client. Every actor column is a real, currently-active admin_team_members row — no shared-password or placeholder identity can write here.';

-- =============================================================================================
-- 3. business_sales_notes — structured notes, never shown to the business owner.
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.business_sales_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  note_type text NOT NULL CHECK (note_type IN (
    'call_attempt', 'conversation', 'follow_up', 'owner_request', 'missing_information',
    'concern', 'opportunity', 'not_a_fit', 'internal_note', 'other'
  )),
  body text NOT NULL CHECK (char_length(body) > 0 AND char_length(body) <= 4000),
  visibility text NOT NULL DEFAULT 'internal' CHECK (visibility IN ('internal', 'private')),
  contact_method text NULL CHECK (contact_method IS NULL OR contact_method IN ('phone', 'sms', 'whatsapp', 'email', 'in_person', 'other')),
  outcome text NULL CHECK (outcome IS NULL OR outcome IN ('reached', 'no_answer', 'left_message', 'scheduled_follow_up', 'not_interested', 'interested', 'other')),
  follow_up_date date NULL,
  author_roster_id uuid NOT NULL REFERENCES public.admin_team_members(id),
  author_auth_user_id uuid NOT NULL,
  author_email text NOT NULL,
  author_role text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS business_sales_notes_business_id_idx ON public.business_sales_notes (business_id, created_at DESC);

ALTER TABLE public.business_sales_notes ENABLE ROW LEVEL SECURITY;

-- Explicit grant hardening (Gate BCO-4A.5/4A.6, owner-proven on staging). Do not rely on RLS
-- alone. REVOKE ... FROM PUBLIC is required to actually strip the blanket grant anon/authenticated
-- inherit on this project (their access was never a role-specific GRANT, only the PUBLIC
-- pseudo-role default privilege). The table owner (whichever role runs this migration, typically
-- postgres via the SQL Editor) is unaffected by REVOKE FROM PUBLIC -- ownership privileges are
-- granted implicitly and are not part of the revocable GRANT/REVOKE system, so no separate GRANT
-- to postgres is needed. service_role (getAdminSupabase(), the only backend that ever touches
-- these tables) is NOT the owner and DOES need an explicit grant -- confirmed live on staging that
-- the exact DML verbs actually used by the application (SELECT, INSERT, UPDATE, DELETE) must be
-- granted explicitly; this migration matches that proven-working statement exactly rather than
-- GRANT ALL PRIVILEGES, so the migration and live staging state cannot drift apart.
REVOKE ALL PRIVILEGES ON TABLE public.business_sales_notes FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.business_sales_notes TO service_role;

COMMENT ON TABLE public.business_sales_notes IS
  'Gate BCO-4A — structured internal sales notes. Staff opinions/observations, never converted into confirmed business facts. Never visible to the business owner. author_roster_id/author_auth_user_id/author_email/author_role are all required and reference a real, currently-active admin_team_members row.';

-- =============================================================================================
-- 4. business_follow_ups — at most one CURRENT (non-terminal) follow-up per business.
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.business_follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  scheduled_date date NOT NULL,
  scheduled_time time NULL,
  contact_method text NULL CHECK (contact_method IS NULL OR contact_method IN ('phone', 'sms', 'whatsapp', 'email', 'in_person', 'other')),
  purpose text NOT NULL CHECK (char_length(purpose) > 0 AND char_length(purpose) <= 500),
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN (
    'scheduled', 'due_today', 'overdue', 'completed', 'cancelled', 'waiting_on_owner'
  )),
  outcome text NULL CHECK (outcome IS NULL OR char_length(outcome) <= 1000),
  completed_at timestamptz NULL,
  assigned_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  created_by_roster_id uuid NOT NULL REFERENCES public.admin_team_members(id),
  created_by_auth_user_id uuid NOT NULL,
  created_by_email text NOT NULL,
  created_by_role text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS business_follow_ups_one_current_per_business
  ON public.business_follow_ups (business_id)
  WHERE status IN ('scheduled', 'due_today', 'overdue', 'waiting_on_owner');

CREATE INDEX IF NOT EXISTS business_follow_ups_business_id_idx ON public.business_follow_ups (business_id);
CREATE INDEX IF NOT EXISTS business_follow_ups_scheduled_date_idx ON public.business_follow_ups (scheduled_date);

ALTER TABLE public.business_follow_ups ENABLE ROW LEVEL SECURITY;

-- Explicit grant hardening (Gate BCO-4A.5/4A.6, owner-proven on staging). Do not rely on RLS
-- alone. REVOKE ... FROM PUBLIC is required to actually strip the blanket grant anon/authenticated
-- inherit on this project (their access was never a role-specific GRANT, only the PUBLIC
-- pseudo-role default privilege). The table owner (whichever role runs this migration, typically
-- postgres via the SQL Editor) is unaffected by REVOKE FROM PUBLIC -- ownership privileges are
-- granted implicitly and are not part of the revocable GRANT/REVOKE system, so no separate GRANT
-- to postgres is needed. service_role (getAdminSupabase(), the only backend that ever touches
-- these tables) is NOT the owner and DOES need an explicit grant -- confirmed live on staging that
-- the exact DML verbs actually used by the application (SELECT, INSERT, UPDATE, DELETE) must be
-- granted explicitly; this migration matches that proven-working statement exactly rather than
-- GRANT ALL PRIVILEGES, so the migration and live staging state cannot drift apart.
REVOKE ALL PRIVILEGES ON TABLE public.business_follow_ups FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.business_follow_ups TO service_role;

COMMENT ON TABLE public.business_follow_ups IS
  'Gate BCO-4A — at most one current (non-terminal) follow-up per business; enforced by business_follow_ups_one_current_per_business. No email/SMS automation in this package — quick actions only. created_by_* columns are required and reference a real, currently-active admin_team_members row.';

-- =============================================================================================
-- 5. business_sales_audit_log — attributable audit trail for Sales Workspace mutations.
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.business_sales_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL CHECK (action IN (
    'note_created', 'note_updated', 'follow_up_created', 'follow_up_completed',
    'follow_up_cancelled', 'follow_up_waiting_on_owner', 'sales_status_changed', 'archived'
  )),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  record_type text NOT NULL CHECK (record_type IN ('sales_profile', 'sales_note', 'follow_up')),
  record_id uuid NULL,
  actor_roster_id uuid NOT NULL REFERENCES public.admin_team_members(id),
  actor_auth_user_id uuid NOT NULL,
  actor_email text NOT NULL,
  actor_role text NOT NULL,
  -- Safe, bounded metadata only (e.g. {"from_status":"new","to_status":"contacted"}) — never the
  -- raw note body duplicated here; the note body already lives, once, in business_sales_notes.
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS business_sales_audit_log_business_id_idx ON public.business_sales_audit_log (business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS business_sales_audit_log_actor_idx ON public.business_sales_audit_log (actor_roster_id, created_at DESC);

ALTER TABLE public.business_sales_audit_log ENABLE ROW LEVEL SECURITY;

-- Explicit grant hardening (Gate BCO-4A.5/4A.6, owner-proven on staging). Do not rely on RLS
-- alone. REVOKE ... FROM PUBLIC is required to actually strip the blanket grant anon/authenticated
-- inherit on this project (their access was never a role-specific GRANT, only the PUBLIC
-- pseudo-role default privilege). The table owner (whichever role runs this migration, typically
-- postgres via the SQL Editor) is unaffected by REVOKE FROM PUBLIC -- ownership privileges are
-- granted implicitly and are not part of the revocable GRANT/REVOKE system, so no separate GRANT
-- to postgres is needed. service_role (getAdminSupabase(), the only backend that ever touches
-- these tables) is NOT the owner and DOES need an explicit grant -- confirmed live on staging that
-- the exact DML verbs actually used by the application (SELECT, INSERT, UPDATE, DELETE) must be
-- granted explicitly; this migration matches that proven-working statement exactly rather than
-- GRANT ALL PRIVILEGES, so the migration and live staging state cannot drift apart.
REVOKE ALL PRIVILEGES ON TABLE public.business_sales_audit_log FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.business_sales_audit_log TO service_role;

COMMENT ON TABLE public.business_sales_audit_log IS
  'Gate BCO-4A.1 — attributable audit trail for every Sales Workspace mutation (note/follow-up/status changes). actor_roster_id is a real, currently-active admin_team_members row, never a placeholder. metadata never duplicates a note body or any secret value.';

-- =============================================================================================
-- 6. admin_roster_audit_log (Gate BCO-4A.3) — attributable audit trail for staff-roster
-- management itself. Not the legacy admin_audit_log table (confirmed to have no actor column at
-- all — app/admin/_lib/adminAuditLogServer.ts's appendAdminAuditLog() only ever writes action/
-- target_type/target_id/meta). Not business_sales_audit_log either — that table's action/
-- record_type CHECK values are about businesses, not staff, and keeping the two domains in
-- separate tables avoids overloading one CHECK constraint with unrelated concerns.
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.admin_roster_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL CHECK (action IN (
    'staff_row_created', 'role_changed', 'activated', 'deactivated',
    'auth_user_linked', 'display_name_changed', 'permissions_changed'
  )),
  target_roster_id uuid NOT NULL REFERENCES public.admin_team_members(id) ON DELETE CASCADE,
  actor_roster_id uuid NOT NULL REFERENCES public.admin_team_members(id),
  actor_auth_user_id uuid NOT NULL,
  actor_email text NOT NULL,
  actor_role text NOT NULL,
  -- Safe, bounded metadata only (e.g. {"from_role":"sales_rep","to_role":"sales_manager"}) —
  -- never a password, token, or other secret value.
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_roster_audit_log_target_idx ON public.admin_roster_audit_log (target_roster_id, created_at DESC);
CREATE INDEX IF NOT EXISTS admin_roster_audit_log_actor_idx ON public.admin_roster_audit_log (actor_roster_id, created_at DESC);

ALTER TABLE public.admin_roster_audit_log ENABLE ROW LEVEL SECURITY;

-- Explicit grant hardening (Gate BCO-4A.5/4A.6, owner-proven on staging). Do not rely on RLS
-- alone. REVOKE ... FROM PUBLIC is required to actually strip the blanket grant anon/authenticated
-- inherit on this project (their access was never a role-specific GRANT, only the PUBLIC
-- pseudo-role default privilege). The table owner (whichever role runs this migration, typically
-- postgres via the SQL Editor) is unaffected by REVOKE FROM PUBLIC -- ownership privileges are
-- granted implicitly and are not part of the revocable GRANT/REVOKE system, so no separate GRANT
-- to postgres is needed. service_role (getAdminSupabase(), the only backend that ever touches
-- these tables) is NOT the owner and DOES need an explicit grant -- confirmed live on staging that
-- the exact DML verbs actually used by the application (SELECT, INSERT, UPDATE, DELETE) must be
-- granted explicitly; this migration matches that proven-working statement exactly rather than
-- GRANT ALL PRIVILEGES, so the migration and live staging state cannot drift apart.
REVOKE ALL PRIVILEGES ON TABLE public.admin_roster_audit_log FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.admin_roster_audit_log TO service_role;

COMMENT ON TABLE public.admin_roster_audit_log IS
  'Gate BCO-4A.3 — attributable audit trail for staff-roster management (admin_team_members mutations). actor_roster_id is a real, currently-active admin_team_members row. The very first super_admin row bootstrapped by the owner directly in SQL has no actor row to reference yet, so no audit row is written for that one bootstrap insert — every roster mutation made through the application afterward is audited normally.';
