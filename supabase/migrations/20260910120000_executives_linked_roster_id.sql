-- Master Operating Book V2 §0G Staff Contact Identity — the smallest durable canonical link
-- needed for a staff member to safely self-edit THEIR OWN Executive Hub contact profile.
--
-- Confirmed before writing this migration: `public.executives` has no trustworthy relationship
-- to any staff identity today — `email` is a plain, non-unique free-text column, not a foreign
-- key, and could not be used to authorize a write (a staff member editing their own email field
-- would silently detach any future email-based matching, and two rows could share the same text
-- by coincidence or typo). Per this gate's own identity_rule, an email-only runtime authorization
-- shortcut was correctly rejected in favor of this real, additive FK.
--
-- Purely additive:
--   * The new column is NULLABLE. Every existing executives row is untouched — an unlinked
--     profile simply has no self-service owner yet, which is the honest, correct default (the
--     owner must explicitly link a profile to a roster row; nothing here infers a link from name
--     or email matching).
--   * ON DELETE SET NULL (not CASCADE): if a staff roster row is ever deleted, their public
--     contact profile must not be deleted or orphaned into a broken state — it simply becomes
--     unlinked (falls back to owner-only management), matching the same non-destructive pattern
--     already used for `admin_audit_log.actor_roster_id` (20260909140000).
--   * The partial unique index prevents the same roster member from ever being linked to two
--     different executive profiles at once (an ambiguous self-service target), without blocking
--     multiple executives from all having a NULL link.
--
-- NOT applied remotely by this pass. Local file only, pending owner review/approval.

ALTER TABLE public.executives ADD COLUMN IF NOT EXISTS linked_roster_id uuid NULL
  REFERENCES public.admin_team_members(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.executives.linked_roster_id IS
  'Staff roster member (admin_team_members.id) authorized to self-edit this contact profile''s safe personal fields. NULL means owner-only management (the default) — never inferred from name/email matching, only set explicitly by an owner_admin.';

CREATE UNIQUE INDEX IF NOT EXISTS executives_linked_roster_id_uidx
  ON public.executives (linked_roster_id)
  WHERE linked_roster_id IS NOT NULL;
