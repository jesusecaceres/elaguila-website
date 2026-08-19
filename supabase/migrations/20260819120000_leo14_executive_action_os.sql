-- LEO-14.1 Executive Action OS persistence foundation.
-- Additive only: five operational tables. Does not alter Living Book or customer tables.
-- Server/service-role access only. RLS enabled with zero public/anon/authenticated policies.
-- Living Book (leo_memory_records) remains epistemic memory only — not used for sessions,
-- commitments, receipts, or attention acknowledgements.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Conversation sessions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.leo_conversation_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  owner_auth_user_id text NOT NULL
    CHECK (char_length(btrim(owner_auth_user_id)) > 0 AND char_length(owner_auth_user_id) <= 200),

  title text NULL
    CHECK (title IS NULL OR (char_length(btrim(title)) > 0 AND char_length(title) <= 200)),

  ui_language text NOT NULL DEFAULT 'en'
    CHECK (ui_language IN ('en', 'es', 'auto')),
  speech_language text NOT NULL DEFAULT 'auto'
    CHECK (speech_language IN ('en', 'es', 'auto')),
  response_language text NOT NULL DEFAULT 'auto'
    CHECK (response_language IN ('en', 'es', 'auto')),

  mode text NOT NULL DEFAULT 'TEXT'
    CHECK (mode IN ('TEXT', 'HANDS_FREE', 'LOW_ATTENTION')),

  last_active_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz NULL
);

CREATE INDEX IF NOT EXISTS leo_conversation_sessions_owner_active_idx
  ON public.leo_conversation_sessions (owner_auth_user_id, last_active_at DESC)
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS leo_conversation_sessions_owner_archived_idx
  ON public.leo_conversation_sessions (owner_auth_user_id, archived_at DESC)
  WHERE archived_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS leo_conversation_sessions_owner_created_idx
  ON public.leo_conversation_sessions (owner_auth_user_id, created_at DESC);

COMMENT ON TABLE public.leo_conversation_sessions IS
  'LEO-14 conversation sessions — durable owner session identity. Service-role / server-only. No secrets, tokens, or audio.';

ALTER TABLE public.leo_conversation_sessions ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 2. Conversation turns
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.leo_conversation_turns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  session_id uuid NOT NULL
    REFERENCES public.leo_conversation_sessions (id),

  owner_auth_user_id text NOT NULL
    CHECK (char_length(btrim(owner_auth_user_id)) > 0 AND char_length(owner_auth_user_id) <= 200),

  role text NOT NULL
    CHECK (role IN ('USER', 'LEO', 'SYSTEM')),

  -- Bounded conversational text only — never full Gmail bodies, tokens, or audio.
  bounded_text text NOT NULL
    CHECK (char_length(btrim(bounded_text)) > 0 AND char_length(bounded_text) <= 4000),

  intent text NULL
    CHECK (intent IS NULL OR char_length(intent) <= 80),

  result_card_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  selected_entity_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  receipt_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  context_refs jsonb NOT NULL DEFAULT '{}'::jsonb,

  created_at timestamptz NOT NULL DEFAULT now(),
  -- Default 60-day retention for bounded turn text (cleanup jobs are out of scope for 14.1).
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '60 days'),
  archived_at timestamptz NULL
);

CREATE INDEX IF NOT EXISTS leo_conversation_turns_session_created_idx
  ON public.leo_conversation_turns (session_id, created_at ASC);

CREATE INDEX IF NOT EXISTS leo_conversation_turns_owner_created_idx
  ON public.leo_conversation_turns (owner_auth_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS leo_conversation_turns_expires_at_idx
  ON public.leo_conversation_turns (expires_at)
  WHERE archived_at IS NULL;

COMMENT ON TABLE public.leo_conversation_turns IS
  'LEO-14 conversation turns — bounded text + refs only. 60-day default expires_at. No Gmail bodies, secrets, or audio. FK to sessions without ON DELETE CASCADE (preserve auditability).';

ALTER TABLE public.leo_conversation_turns ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 3. Commitments
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.leo_commitments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  owner_auth_user_id text NOT NULL
    CHECK (char_length(btrim(owner_auth_user_id)) > 0 AND char_length(owner_auth_user_id) <= 200),

  title text NOT NULL
    CHECK (char_length(btrim(title)) > 0 AND char_length(title) <= 500),
  normalized_text text NOT NULL
    CHECK (char_length(btrim(normalized_text)) > 0 AND char_length(normalized_text) <= 2000),

  kind text NOT NULL
    CHECK (kind IN ('EXPLICIT_OWNER', 'EXTRACTED_CANDIDATE', 'EXTERNAL_PARTY')),

  -- Canonical status only. DUE_SOON / OVERDUE are derived in the service layer.
  status text NOT NULL DEFAULT 'OPEN'
    CHECK (status IN ('OPEN', 'COMPLETED', 'CANCELLED', 'SUPERSEDED')),

  due_at timestamptz NULL,
  timezone text NULL
    CHECK (timezone IS NULL OR char_length(timezone) <= 80),
  counterparty text NULL
    CHECK (counterparty IS NULL OR char_length(counterparty) <= 300),

  source_type text NOT NULL
    CHECK (char_length(btrim(source_type)) > 0 AND char_length(source_type) <= 120),
  source_ref jsonb NOT NULL DEFAULT '{}'::jsonb,
  provenance jsonb NOT NULL DEFAULT '{}'::jsonb,
  evidence_at timestamptz NULL,

  created_by text NOT NULL
    CHECK (created_by IN ('owner', 'leo', 'system')),
  creation_method text NOT NULL
    CHECK (creation_method IN ('OWNER_UTTERANCE', 'OWNER_CONFIRM', 'EXTRACTED', 'SYSTEM')),

  -- Aligns with LeoAttentionLevel values used elsewhere in LEO.
  priority text NOT NULL DEFAULT 'NORMAL'
    CHECK (priority IN ('CRITICAL', 'HIGH', 'NORMAL', 'INFORMATIONAL')),

  category text NULL
    CHECK (category IS NULL OR char_length(category) <= 120),

  acknowledged_at timestamptz NULL,
  completed_at timestamptz NULL,
  cancelled_at timestamptz NULL,

  superseded_by uuid NULL REFERENCES public.leo_commitments (id),

  confidence text NULL
    CHECK (confidence IS NULL OR confidence IN ('low', 'medium', 'high')),

  notes text NULL
    CHECK (notes IS NULL OR char_length(notes) <= 2000),

  related_refs jsonb NOT NULL DEFAULT '[]'::jsonb,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT leo_commitments_no_self_supersede_chk CHECK (
    superseded_by IS NULL OR superseded_by <> id
  ),
  CONSTRAINT leo_commitments_status_completed_chk CHECK (
    (status = 'COMPLETED' AND completed_at IS NOT NULL)
    OR (status <> 'COMPLETED')
  ),
  CONSTRAINT leo_commitments_status_cancelled_chk CHECK (
    (status = 'CANCELLED' AND cancelled_at IS NOT NULL)
    OR (status <> 'CANCELLED')
  ),
  CONSTRAINT leo_commitments_status_superseded_chk CHECK (
    (status = 'SUPERSEDED' AND superseded_by IS NOT NULL)
    OR (status <> 'SUPERSEDED')
  ),
  -- EXTRACTED_CANDIDATE must be created with EXTRACTED method.
  -- Promotion to EXPLICIT_OWNER requires service-layer OWNER_CONFIRM (never silent).
  CONSTRAINT leo_commitments_candidate_method_chk CHECK (
    kind <> 'EXTRACTED_CANDIDATE' OR creation_method = 'EXTRACTED'
  )
);

CREATE INDEX IF NOT EXISTS leo_commitments_owner_status_idx
  ON public.leo_commitments (owner_auth_user_id, status);

CREATE INDEX IF NOT EXISTS leo_commitments_owner_due_at_idx
  ON public.leo_commitments (owner_auth_user_id, due_at)
  WHERE due_at IS NOT NULL AND status = 'OPEN';

CREATE INDEX IF NOT EXISTS leo_commitments_owner_kind_idx
  ON public.leo_commitments (owner_auth_user_id, kind);

CREATE INDEX IF NOT EXISTS leo_commitments_source_type_idx
  ON public.leo_commitments (owner_auth_user_id, source_type);

CREATE INDEX IF NOT EXISTS leo_commitments_superseded_by_idx
  ON public.leo_commitments (superseded_by)
  WHERE superseded_by IS NOT NULL;

COMMENT ON TABLE public.leo_commitments IS
  'LEO-14 commitments — explicit owner, extracted candidates, and external-party obligations. DUE_SOON/OVERDUE derived. Candidates require OWNER_CONFIRM to become EXPLICIT_OWNER. Service-role only.';

ALTER TABLE public.leo_commitments ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 4. Durable tool / action receipts (audit truth)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.leo_tool_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  correlation_id text NOT NULL
    CHECK (char_length(btrim(correlation_id)) > 0 AND char_length(correlation_id) <= 120),

  tool_id text NOT NULL
    CHECK (char_length(btrim(tool_id)) > 0 AND char_length(tool_id) <= 160),

  action_type text NOT NULL
    CHECK (char_length(btrim(action_type)) > 0 AND char_length(action_type) <= 80),

  actor_auth_user_id text NOT NULL
    CHECK (char_length(btrim(actor_auth_user_id)) > 0 AND char_length(actor_auth_user_id) <= 200),

  governance_level text NOT NULL
    CHECK (governance_level IN ('GREEN', 'YELLOW', 'RED', 'NEVER')),

  -- Bounded summary only — never secrets, tokens, or raw provider bodies.
  requested_payload_summary text NOT NULL
    CHECK (char_length(btrim(requested_payload_summary)) > 0 AND char_length(requested_payload_summary) <= 2000),

  preparation_ref text NULL
    CHECK (preparation_ref IS NULL OR char_length(preparation_ref) <= 200),

  lifecycle_state text NOT NULL DEFAULT 'REQUESTED'
    CHECK (lifecycle_state IN (
      'REQUESTED',
      'AUTHORIZED',
      'PREPARED',
      'AWAITING_APPROVAL',
      'EXECUTED',
      'VERIFIED',
      'FAILED',
      'NOT_EXECUTED',
      'CANCELLED'
    )),

  approval_state text NOT NULL DEFAULT 'NONE'
    CHECK (approval_state IN ('NONE', 'PENDING', 'APPROVED', 'REJECTED')),

  execution_state text NOT NULL DEFAULT 'NONE'
    CHECK (execution_state IN ('NONE', 'NOT_EXECUTED', 'EXECUTED', 'FAILED')),

  verification_state text NOT NULL DEFAULT 'NONE'
    CHECK (verification_state IN ('NONE', 'VERIFIED', 'FAILED')),

  safe_error_class text NULL
    CHECK (safe_error_class IS NULL OR char_length(safe_error_class) <= 120),

  source_refs jsonb NOT NULL DEFAULT '[]'::jsonb,

  session_id uuid NULL REFERENCES public.leo_conversation_sessions (id),
  turn_id uuid NULL REFERENCES public.leo_conversation_turns (id),

  requested_at timestamptz NOT NULL DEFAULT now(),
  authorized_at timestamptz NULL,
  prepared_at timestamptz NULL,
  executed_at timestamptz NULL,
  verified_at timestamptz NULL,
  failed_at timestamptz NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS leo_tool_receipts_actor_created_idx
  ON public.leo_tool_receipts (actor_auth_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS leo_tool_receipts_correlation_idx
  ON public.leo_tool_receipts (correlation_id);

CREATE INDEX IF NOT EXISTS leo_tool_receipts_lifecycle_idx
  ON public.leo_tool_receipts (actor_auth_user_id, lifecycle_state);

CREATE INDEX IF NOT EXISTS leo_tool_receipts_session_idx
  ON public.leo_tool_receipts (session_id)
  WHERE session_id IS NOT NULL;

COMMENT ON TABLE public.leo_tool_receipts IS
  'LEO-14 durable tool/action receipts — audit truth. Monotonic timestamps; executed_at/verified_at must not be cleared once set. No secrets or raw provider payloads. Service-role only.';

ALTER TABLE public.leo_tool_receipts ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 5. Attention acknowledgements
-- ---------------------------------------------------------------------------
-- One active disposition record per owner + source identity.
-- Upsert updates disposition; when source_key changes, a new row may surface again.
-- Does NOT mutate source truth (attention/email/calendar rows remain authoritative).
CREATE TABLE IF NOT EXISTS public.leo_attention_acks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  owner_auth_user_id text NOT NULL
    CHECK (char_length(btrim(owner_auth_user_id)) > 0 AND char_length(owner_auth_user_id) <= 200),

  source_kind text NOT NULL
    CHECK (char_length(btrim(source_kind)) > 0 AND char_length(source_kind) <= 120),
  source_key text NOT NULL
    CHECK (char_length(btrim(source_key)) > 0 AND char_length(source_key) <= 500),

  disposition text NOT NULL
    CHECK (disposition IN ('ACKNOWLEDGED', 'DISMISSED', 'SNOOZED')),

  snooze_until timestamptz NULL,
  note text NULL
    CHECK (note IS NULL OR char_length(note) <= 500),

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NULL,

  CONSTRAINT leo_attention_acks_snooze_chk CHECK (
    (disposition = 'SNOOZED' AND snooze_until IS NOT NULL)
    OR (disposition <> 'SNOOZED')
  ),

  CONSTRAINT leo_attention_acks_owner_source_uq UNIQUE (owner_auth_user_id, source_kind, source_key)
);

CREATE INDEX IF NOT EXISTS leo_attention_acks_owner_disposition_idx
  ON public.leo_attention_acks (owner_auth_user_id, disposition);

CREATE INDEX IF NOT EXISTS leo_attention_acks_snooze_until_idx
  ON public.leo_attention_acks (snooze_until)
  WHERE disposition = 'SNOOZED' AND snooze_until IS NOT NULL;

CREATE INDEX IF NOT EXISTS leo_attention_acks_expires_at_idx
  ON public.leo_attention_acks (expires_at)
  WHERE expires_at IS NOT NULL;

COMMENT ON TABLE public.leo_attention_acks IS
  'LEO-14 attention acknowledgements — owner ACK/DISMISS/SNOOZE without mutating source truth. Unique per owner+source_kind+source_key. Service-role only.';

ALTER TABLE public.leo_attention_acks ENABLE ROW LEVEL SECURITY;

-- Fail closed: no policies for anon or authenticated on any LEO-14 table.
-- Service role bypasses RLS. Do not add public/anon/authenticated SELECT/INSERT/UPDATE/DELETE.

COMMIT;
