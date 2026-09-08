-- Gate BCO-TODAY-1A — Privilege hardening parity patch for the six TODAY-1 Learning Center
-- tables. Records the exact, already-certified staging posture the owner applied directly
-- after a system-catalog audit found that Supabase default grants had left REFERENCES,
-- TRIGGER, and TRUNCATE privileges on these tables for anon and authenticated.
--
-- This migration is idempotent and safe to re-run: every statement is a REVOKE (no-op if the
-- privilege is already absent) followed by a narrow GRANT of exactly SELECT, INSERT, UPDATE,
-- DELETE to service_role only. It never grants REFERENCES, TRIGGER, or TRUNCATE to anyone,
-- never uses GRANT ALL PRIVILEGES, and never grants anything to PUBLIC, anon, or authenticated.
--
-- No Production reference, no secret literal, no destructive statement. Additive to the
-- existing privilege posture only -- no schema, table, column, RLS, or policy change.

BEGIN;

-- =============================================================================================
-- 1. business_learning_categories
-- =============================================================================================
REVOKE ALL PRIVILEGES ON TABLE public.business_learning_categories FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_learning_categories FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_learning_categories FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_learning_categories FROM service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.business_learning_categories TO service_role;

-- =============================================================================================
-- 2. business_learning_lessons
-- =============================================================================================
REVOKE ALL PRIVILEGES ON TABLE public.business_learning_lessons FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_learning_lessons FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_learning_lessons FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_learning_lessons FROM service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.business_learning_lessons TO service_role;

-- =============================================================================================
-- 3. business_learning_resources
-- =============================================================================================
REVOKE ALL PRIVILEGES ON TABLE public.business_learning_resources FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_learning_resources FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_learning_resources FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_learning_resources FROM service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.business_learning_resources TO service_role;

-- =============================================================================================
-- 4. business_learning_progress
-- =============================================================================================
REVOKE ALL PRIVILEGES ON TABLE public.business_learning_progress FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_learning_progress FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_learning_progress FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_learning_progress FROM service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.business_learning_progress TO service_role;

-- =============================================================================================
-- 5. business_capability_records
-- =============================================================================================
REVOKE ALL PRIVILEGES ON TABLE public.business_capability_records FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_capability_records FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_capability_records FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_capability_records FROM service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.business_capability_records TO service_role;

-- =============================================================================================
-- 6. business_idea_drafts
-- =============================================================================================
REVOKE ALL PRIVILEGES ON TABLE public.business_idea_drafts FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_idea_drafts FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_idea_drafts FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_idea_drafts FROM service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.business_idea_drafts TO service_role;

COMMIT;
