-- Master Operating Book §8/§22 Governance/Audit contract — admin_audit_log has never carried
-- actor/staff attribution (confirmed by tracing every write call site: every mutation goes
-- through the single shared appendAdminAuditLog() writer in app/admin/_lib/adminAuditLogServer.ts,
-- which only ever wrote action/target_type/target_id/meta/created_at). The owner cannot answer
-- "which staff member did this" from this table today.
--
-- A real, working actor-resolution mechanism already exists and is already proven in production
-- use for the newer admin_roster_audit_log table (see 20260731220000_admin_roster_foundation_and
-- _sales_workspace.sql): resolveActingRosterIdentity() in app/admin/_lib/adminRosterAudit.ts reads
-- the current operator's cookie session and resolves their real admin_team_members row. This
-- migration extends the SAME canonical types (uuid FK to admin_team_members, uuid auth user id,
-- text email/role) to the general-purpose admin_audit_log table so every admin action — not only
-- roster mutations — can carry the same real attribution when the acting operator is resolvable.
--
-- Purely additive:
--   * All four new columns are NULLABLE. Existing rows are untouched (they simply have NULL actor
--     fields, honestly representing "written before attribution existed" — never backfilled with
--     a fabricated identity).
--   * appendAdminAuditLog() is updated (application code, separate change) to best-effort resolve
--     and attach actor identity to NEW writes only, and continues to succeed even when identity
--     cannot be resolved (e.g. bootstrap-only sessions with roster enforcement off) — no existing
--     caller needs to change, and no write becomes newly unable to succeed.
--   * ON DELETE SET NULL (not CASCADE): if a staff roster row is ever deleted, their historical
--     audit rows must remain — deleting audit history because a staff account was removed would
--     itself violate the audit contract.
--
-- NOT applied remotely by this pass. Local file only, pending owner review/approval.

ALTER TABLE public.admin_audit_log ADD COLUMN IF NOT EXISTS actor_roster_id uuid NULL
  REFERENCES public.admin_team_members(id) ON DELETE SET NULL;
ALTER TABLE public.admin_audit_log ADD COLUMN IF NOT EXISTS actor_auth_user_id uuid NULL;
ALTER TABLE public.admin_audit_log ADD COLUMN IF NOT EXISTS actor_email text NULL;
ALTER TABLE public.admin_audit_log ADD COLUMN IF NOT EXISTS actor_role text NULL;

COMMENT ON COLUMN public.admin_audit_log.actor_roster_id IS
  'Acting staff member (admin_team_members.id) when resolvable at write time. NULL for rows written before this column existed, or when the acting operator could not be resolved (e.g. bootstrap-only session) — never fabricated.';

CREATE INDEX IF NOT EXISTS admin_audit_log_actor_roster_idx
  ON public.admin_audit_log (actor_roster_id, created_at DESC)
  WHERE actor_roster_id IS NOT NULL;
