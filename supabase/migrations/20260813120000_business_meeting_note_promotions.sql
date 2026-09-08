-- =============================================================================================
-- Program 5 — Meeting Note Promotion History
-- Migration: 20260813120000_business_meeting_note_promotions.sql
--
-- Closes the remaining workflow-completeness gap:
--   Meeting Note → Human Review → Explicit Promotion → Living Business Book
--
-- Creates: public.business_meeting_note_promotions
--
-- Doctrine:
-- - Meeting notes NEVER silently or automatically mutate business_facts.
-- - Only an explicit authorized staff action may create/update Living Book truth.
-- - This table is APPEND-ONLY — one promotion per note, no updates.
-- - UNIQUE(meeting_note_id) blocks accidental double-promotion.
-- - Composite FKs enforce exact-business isolation.
-- - RLS enabled, zero user policies, revoke PUBLIC/anon/authenticated,
--   narrow service_role SELECT + INSERT only (append-only).
-- - Actor attribution required: promoted_by_auth_user_id, promoted_by_email, promoted_by_role.
-- =============================================================================================

BEGIN;

-- =============================================================================================
-- Step 1: Add UNIQUE(id, business_id) to business_meeting_notes so child tables can use
-- a composite FK for same-business enforcement. This is additive and does not alter
-- any existing column or data.
-- =============================================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'business_meeting_notes_id_business_id_uk'
      AND conrelid = 'public.business_meeting_notes'::regclass
  ) THEN
    ALTER TABLE public.business_meeting_notes
      ADD CONSTRAINT business_meeting_notes_id_business_id_uk UNIQUE (id, business_id);
  END IF;
END
$$;

-- =============================================================================================
-- Step 2: public.business_meeting_note_promotions — durable source→destination linkage.
-- Records every explicit staff decision to promote a meeting note to the Living Business Book.
-- The source meeting note is NEVER mutated or deleted by promotion.
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.business_meeting_note_promotions (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Exact business isolation — every row tied to one canonical business.
  business_id             uuid        NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,

  -- Same-business composite FK: meeting_id must belong to the same business.
  meeting_id              uuid        NOT NULL,

  -- Same-business composite FK: meeting_note_id must belong to the same business.
  meeting_note_id         uuid        NOT NULL,

  -- Where this note was promoted to.
  destination_type        text        NOT NULL CHECK (destination_type IN (
    'fact', 'unknown', 'contradiction', 'correction'
  )),

  -- The UUID of the record created in the Living Business Book.
  destination_record_id   uuid        NOT NULL,

  -- Actor attribution — staff only; owner cannot perform promotions.
  promoted_by_roster_id   uuid        NULL REFERENCES public.admin_team_members(id),
  promoted_by_auth_user_id uuid       NOT NULL,
  promoted_by_email       text        NOT NULL CHECK (char_length(btrim(promoted_by_email)) > 0),
  promoted_by_role        text        NOT NULL CHECK (char_length(btrim(promoted_by_role)) > 0),

  created_at              timestamptz NOT NULL DEFAULT now(),

  -- One note may be promoted exactly once. Prevents accidental duplicate promotion.
  CONSTRAINT business_meeting_note_promotions_note_uk UNIQUE (meeting_note_id),

  -- Same-business composite FK: meeting must belong to this business.
  CONSTRAINT business_meeting_note_promotions_meeting_business_fk
    FOREIGN KEY (meeting_id, business_id)
    REFERENCES public.business_meetings(id, business_id)
    ON DELETE RESTRICT,

  -- Same-business composite FK: note must belong to this business.
  CONSTRAINT business_meeting_note_promotions_note_business_fk
    FOREIGN KEY (meeting_note_id, business_id)
    REFERENCES public.business_meeting_notes(id, business_id)
    ON DELETE RESTRICT,

  -- Promoted_by_roster_id required (staff-only promotion).
  CONSTRAINT business_meeting_note_promotions_actor_chk CHECK (
    promoted_by_roster_id IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS business_meeting_note_promotions_meeting_note_id_idx
  ON public.business_meeting_note_promotions (meeting_note_id);
CREATE INDEX IF NOT EXISTS business_meeting_note_promotions_meeting_id_idx
  ON public.business_meeting_note_promotions (meeting_id);
CREATE INDEX IF NOT EXISTS business_meeting_note_promotions_business_id_idx
  ON public.business_meeting_note_promotions (business_id);

ALTER TABLE public.business_meeting_note_promotions ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_meeting_note_promotions FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_meeting_note_promotions FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_meeting_note_promotions FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_meeting_note_promotions FROM service_role;
-- APPEND-ONLY: SELECT + INSERT only. No UPDATE, no DELETE.
GRANT SELECT, INSERT ON TABLE public.business_meeting_note_promotions TO service_role;

COMMENT ON TABLE public.business_meeting_note_promotions IS
  'Program 5 — Durable source→destination linkage for meeting note → Living Business Book promotions. '
  'APPEND-ONLY: no UPDATE or DELETE grant. UNIQUE(meeting_note_id) prevents double-promotion. '
  'Source meeting note is never mutated. Composite FKs enforce exact-business isolation.';

COMMIT;
