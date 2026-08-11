-- =============================================================================================
-- Program 5 — Meeting Studio Foundation
-- Migration: 20260810140000_business_meeting_studio_foundation.sql
--
-- Creates 5 new tables for the Meeting Studio domain:
--   A. business_meetings
--   B. business_meeting_attendees
--   C. business_meeting_consents (append-only)
--   D. business_meeting_notes
--   E. business_meeting_transcript_imports (V1 manual import only)
--
-- Doctrine:
-- - One canonical business: public.businesses.id
-- - No fake recording/transcription state
-- - Meeting notes never directly mutate business_facts
-- - Consent is append-only
-- - RLS enabled, zero user policies, revoke PUBLIC/anon/authenticated, narrow service_role grants
-- - Actor attribution CHECK on every table
-- - Same-business composite integrity where appropriate
-- - Feature flag default disabled
-- =============================================================================================

BEGIN;

-- =============================================================================================
-- A. business_meetings — one prepared/live/completed meeting tied to a real business.
-- Exposes UNIQUE(id, business_id) so child tables can enforce same-business composite FKs.
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.business_meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  meeting_type text NOT NULL CHECK (meeting_type IN (
    'discovery', 'check_in', 'proposal_review', 'follow_up', 'intake'
  )),
  status text NOT NULL DEFAULT 'planned' CHECK (status IN (
    'planned', 'prepared', 'in_progress', 'completed', 'cancelled'
  )),
  language text NOT NULL DEFAULT 'es' CHECK (language IN ('es', 'en')),
  scheduled_at timestamptz NULL,
  started_at timestamptz NULL,
  completed_at timestamptz NULL,
  agenda_snapshot jsonb NULL,
  briefing_snapshot jsonb NULL,
  recap_es text NULL,
  recap_en text NULL,

  created_actor_type text NOT NULL CHECK (created_actor_type IN ('staff', 'owner')),
  created_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  created_by_auth_user_id uuid NOT NULL,
  created_by_email text NOT NULL,
  created_by_role text NOT NULL,

  completed_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  completed_by_auth_user_id uuid NULL,
  completed_by_email text NULL,
  completed_by_role text NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_meetings_id_business_id_uk UNIQUE (id, business_id),

  -- Actor integrity: staff must carry roster_id; owner must NOT carry roster_id.
  CONSTRAINT business_meetings_created_actor_chk CHECK (
    (created_actor_type = 'staff' AND created_by_roster_id IS NOT NULL) OR
    (created_actor_type = 'owner' AND created_by_roster_id IS NULL)
  ),

  -- Lifecycle integrity: completed status requires completed_at and atomic completion attribution.
  CONSTRAINT business_meetings_completed_requires_at_chk CHECK (
    status != 'completed' OR completed_at IS NOT NULL
  ),
  CONSTRAINT business_meetings_completed_atomic_chk CHECK (
    status != 'completed' OR (
      completed_by_roster_id IS NOT NULL AND completed_by_auth_user_id IS NOT NULL AND
      completed_by_email IS NOT NULL AND char_length(btrim(completed_by_email)) > 0 AND
      completed_by_role IS NOT NULL AND char_length(btrim(completed_by_role)) > 0 AND
      completed_at IS NOT NULL
    )
  ),
  -- in_progress requires started_at; cancelled must not masquerade as completed.
  CONSTRAINT business_meetings_in_progress_requires_started_chk CHECK (
    status != 'in_progress' OR started_at IS NOT NULL
  ),
  CONSTRAINT business_meetings_cancelled_no_completed_at_chk CHECK (
    status != 'cancelled' OR completed_at IS NULL
  )
);

CREATE INDEX IF NOT EXISTS business_meetings_business_id_idx ON public.business_meetings (business_id);
CREATE INDEX IF NOT EXISTS business_meetings_status_idx ON public.business_meetings (status);
CREATE INDEX IF NOT EXISTS business_meetings_scheduled_at_idx ON public.business_meetings (scheduled_at);

ALTER TABLE public.business_meetings ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_meetings FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_meetings FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_meetings FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_meetings FROM service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.business_meetings TO service_role;

COMMENT ON TABLE public.business_meetings IS
  'Program 5 — Meeting Studio. One prepared/live/completed meeting tied to a real business. No fake recording state. Actor attribution required. UNIQUE(id, business_id) for composite same-business FKs.';

-- =============================================================================================
-- B. business_meeting_attendees — attendees for a meeting.
-- Composite FK (meeting_id, business_id) → business_meetings(id, business_id) prevents
-- cross-business linkage.
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.business_meeting_attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  attendee_type text NOT NULL CHECK (attendee_type IN ('owner', 'staff', 'external')),
  display_name text NOT NULL CHECK (char_length(display_name) > 0 AND char_length(display_name) <= 200),
  contact_reference text NULL,
  staff_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  staff_auth_user_id uuid NULL,
  language text NULL CHECK (language IS NULL OR language IN ('es', 'en')),
  attendance_state text NOT NULL DEFAULT 'tentative' CHECK (attendance_state IN (
    'confirmed', 'tentative', 'declined', 'attended', 'no_show'
  )),
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_meeting_attendees_meeting_business_fk
    FOREIGN KEY (meeting_id, business_id)
    REFERENCES public.business_meetings(id, business_id)
    ON DELETE CASCADE,

  CHECK (
    (attendee_type = 'staff' AND staff_roster_id IS NOT NULL) OR
    (attendee_type != 'staff')
  )
);

CREATE INDEX IF NOT EXISTS business_meeting_attendees_meeting_id_idx ON public.business_meeting_attendees (meeting_id);
CREATE INDEX IF NOT EXISTS business_meeting_attendees_business_id_idx ON public.business_meeting_attendees (business_id);

ALTER TABLE public.business_meeting_attendees ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_meeting_attendees FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_meeting_attendees FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_meeting_attendees FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_meeting_attendees FROM service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.business_meeting_attendees TO service_role;

COMMENT ON TABLE public.business_meeting_attendees IS
  'Program 5 — Meeting attendees. Staff attendees require a real roster_id. Same-business integrity via composite FK to business_meetings(id, business_id).';

-- =============================================================================================
-- C. business_meeting_consents — APPEND-ONLY consent records.
-- Exposes UNIQUE(id, business_id) so transcript imports can enforce same-business consent FK.
-- Composite FK (meeting_id, business_id) → business_meetings(id, business_id).
-- Consent types are separate: notes, audio_recording, transcription, connected_account_review,
-- file_photo_review, followup_messages.
-- No audio/transcription feature becomes live merely because consent exists.
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.business_meeting_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  consent_type text NOT NULL CHECK (consent_type IN (
    'notes', 'audio_recording', 'transcription',
    'connected_account_review', 'file_photo_review', 'followup_messages'
  )),
  state text NOT NULL CHECK (state IN ('provided', 'declined', 'withdrawn')),
  method text NOT NULL CHECK (method IN ('verbal', 'written', 'digital_acknowledgment')),
  language text NOT NULL CHECK (language IN ('es', 'en')),

  recorded_actor_type text NOT NULL CHECK (recorded_actor_type IN ('staff', 'owner')),
  recorded_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  recorded_by_auth_user_id uuid NOT NULL,
  recorded_by_email text NOT NULL,
  recorded_by_role text NOT NULL,

  scope_details jsonb NULL,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_meeting_consents_id_business_id_uk UNIQUE (id, business_id),

  CONSTRAINT business_meeting_consents_meeting_business_fk
    FOREIGN KEY (meeting_id, business_id)
    REFERENCES public.business_meetings(id, business_id)
    ON DELETE CASCADE,

  CONSTRAINT business_meeting_consents_recorded_actor_chk CHECK (
    (recorded_actor_type = 'staff' AND recorded_by_roster_id IS NOT NULL) OR
    (recorded_actor_type = 'owner' AND recorded_by_roster_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS business_meeting_consents_meeting_id_idx ON public.business_meeting_consents (meeting_id);
CREATE INDEX IF NOT EXISTS business_meeting_consents_business_id_idx ON public.business_meeting_consents (business_id);

ALTER TABLE public.business_meeting_consents ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_meeting_consents FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_meeting_consents FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_meeting_consents FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_meeting_consents FROM service_role;
GRANT SELECT, INSERT ON TABLE public.business_meeting_consents TO service_role;

COMMENT ON TABLE public.business_meeting_consents IS
  'Program 5 — Meeting consent records. APPEND-ONLY — no UPDATE or DELETE grant. Consent types are separate. No audio/transcription feature becomes live merely because consent exists. UNIQUE(id, business_id) for composite same-business consent FK.';

-- =============================================================================================
-- D. business_meeting_notes — structured observations/owner statements.
-- Composite FK (meeting_id, business_id) → business_meetings(id, business_id).
-- Notes are NOT facts. They must NOT directly mutate business_facts.
-- Promotion to Living Book requires explicit staff review via existing workflows.
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.business_meeting_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  note_type text NOT NULL CHECK (note_type IN (
    'owner_statement', 'staff_observation', 'potential_fact',
    'unknown', 'contradiction', 'decision', 'action_item'
  )),
  content text NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 8000),
  source_class text NOT NULL CHECK (source_class IN (
    'owner_stated', 'staff_observed', 'system_derived', 'ai_inference'
  )),
  visibility text NOT NULL DEFAULT 'staff_only' CHECK (visibility IN ('staff_only', 'shared_with_owner')),
  sensitivity text NOT NULL DEFAULT 'normal' CHECK (sensitivity IN ('normal', 'sensitive')),
  potential_fact_key text NULL,
  requires_confirmation boolean NOT NULL DEFAULT false,

  recorded_actor_type text NOT NULL CHECK (recorded_actor_type IN ('staff', 'owner')),
  recorded_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  recorded_by_auth_user_id uuid NOT NULL,
  recorded_by_email text NOT NULL,
  recorded_by_role text NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT business_meeting_notes_meeting_business_fk
    FOREIGN KEY (meeting_id, business_id)
    REFERENCES public.business_meetings(id, business_id)
    ON DELETE CASCADE,

  CONSTRAINT business_meeting_notes_recorded_actor_chk CHECK (
    (recorded_actor_type = 'staff' AND recorded_by_roster_id IS NOT NULL) OR
    (recorded_actor_type = 'owner' AND recorded_by_roster_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS business_meeting_notes_meeting_id_idx ON public.business_meeting_notes (meeting_id);
CREATE INDEX IF NOT EXISTS business_meeting_notes_business_id_idx ON public.business_meeting_notes (business_id);

ALTER TABLE public.business_meeting_notes ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_meeting_notes FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_meeting_notes FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_meeting_notes FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_meeting_notes FROM service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.business_meeting_notes TO service_role;

COMMENT ON TABLE public.business_meeting_notes IS
  'Program 5 — Meeting notes. Observations/owner statements, NOT facts. Never directly mutate business_facts. Promotion to Living Book requires explicit staff review via existing workflows. Same-business integrity via composite FK.';

-- =============================================================================================
-- E. business_meeting_transcript_imports — V1 MANUAL IMPORT ONLY.
-- Composite FK (meeting_id, business_id) → business_meetings(id, business_id).
-- Composite FK (consent_record_id, business_id) → business_meeting_consents(id, business_id)
--   — only enforced when consent_record_id is non-NULL (PostgreSQL skips FK check on NULL).
-- No live microphone recording. No transcription provider calls.
-- =============================================================================================
CREATE TABLE IF NOT EXISTS public.business_meeting_transcript_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  import_method text NOT NULL DEFAULT 'manual_import' CHECK (import_method = 'manual_import'),
  language text NOT NULL CHECK (language IN ('es', 'en')),
  transcript_text text NULL,
  storage_path text NULL,
  consent_record_id uuid NULL,
  status text NOT NULL DEFAULT 'imported' CHECK (status IN ('imported', 'reviewed', 'rejected')),

  imported_actor_type text NOT NULL CHECK (imported_actor_type IN ('staff', 'owner')),
  imported_by_roster_id uuid NULL REFERENCES public.admin_team_members(id),
  imported_by_auth_user_id uuid NOT NULL,
  imported_by_email text NOT NULL,
  imported_by_role text NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz NULL,

  CONSTRAINT business_meeting_transcript_imports_meeting_business_fk
    FOREIGN KEY (meeting_id, business_id)
    REFERENCES public.business_meetings(id, business_id)
    ON DELETE CASCADE,

  -- Same-business consent FK: only enforced when consent_record_id is non-NULL.
  -- ON DELETE RESTRICT: deleting a consent record referenced by a transcript import is
  -- blocked to preserve transcript audit history. business_id is NOT NULL and must never
  -- be nulled by a SET NULL action on a composite FK.
  CONSTRAINT business_meeting_transcript_imports_consent_business_fk
    FOREIGN KEY (consent_record_id, business_id)
    REFERENCES public.business_meeting_consents(id, business_id)
    ON DELETE RESTRICT,

  CONSTRAINT business_meeting_transcript_imports_imported_actor_chk CHECK (
    (imported_actor_type = 'staff' AND imported_by_roster_id IS NOT NULL) OR
    (imported_actor_type = 'owner' AND imported_by_roster_id IS NULL)
  ),
  CHECK (transcript_text IS NOT NULL OR storage_path IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS business_meeting_transcript_imports_meeting_id_idx ON public.business_meeting_transcript_imports (meeting_id);
CREATE INDEX IF NOT EXISTS business_meeting_transcript_imports_business_id_idx ON public.business_meeting_transcript_imports (business_id);

ALTER TABLE public.business_meeting_transcript_imports ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.business_meeting_transcript_imports FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.business_meeting_transcript_imports FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.business_meeting_transcript_imports FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_meeting_transcript_imports FROM service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.business_meeting_transcript_imports TO service_role;

COMMENT ON TABLE public.business_meeting_transcript_imports IS
  'Program 5 — Manual transcript import only. No live recording, no transcription provider. import_method is always manual_import. Same-business meeting + consent integrity via composite FKs.';

-- =============================================================================================
-- Feature flag — reuses the existing business_identity_flags table.
-- Starts disabled, same as every prior gate's flag row.
-- =============================================================================================
INSERT INTO public.business_identity_flags (flag_key, enabled, emergency_disabled, pilot_user_ids)
VALUES ('business_meeting_studio', false, false, '{}')
ON CONFLICT (flag_key) DO NOTHING;

COMMIT;
