-- LEO-3 Living Leonix Book foundation.
-- Additive only: one executive-memory table. No changes to canonical Leonix tables.
-- Server/service-role access only. RLS enabled with zero public/anon/authenticated policies.
-- Normal LEO helpers must not delete rows; history is retained via supersession.

BEGIN;

CREATE TABLE IF NOT EXISTS public.leo_memory_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Canonical subject reference (reference only — never a full entity dump).
  subject_type text NOT NULL
    CHECK (char_length(btrim(subject_type)) > 0 AND char_length(subject_type) <= 120),
  subject_key text NOT NULL
    CHECK (char_length(btrim(subject_key)) > 0 AND char_length(subject_key) <= 500),
  -- Optional structured refs: [{ "system": "leonix", "table": "listings", "id": "..." }, ...]
  subject_refs jsonb NOT NULL DEFAULT '[]'::jsonb,

  epistemic_type text NOT NULL
    CHECK (epistemic_type IN (
      'system_fact',
      'observation',
      'owner_statement',
      'staff_statement',
      'inference',
      'unknown',
      'contradiction',
      'historical_decision',
      'active_decision',
      'draft_idea'
    )),

  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'superseded', 'draft')),

  statement text NOT NULL
    CHECK (char_length(btrim(statement)) > 0 AND char_length(statement) <= 8000),

  -- Provenance (required at application layer; DB enforces non-empty source_system + actor type).
  source_actor_type text NOT NULL
    CHECK (source_actor_type IN ('owner', 'staff', 'system', 'leo')),
  source_actor_id text NULL
    CHECK (source_actor_id IS NULL OR char_length(source_actor_id) <= 200),
  source_system text NOT NULL
    CHECK (char_length(btrim(source_system)) > 0 AND char_length(source_system) <= 120),
  source_reference jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- Evidence references only (ids/paths/summaries) — not full emails/API dumps.
  evidence jsonb NOT NULL DEFAULT '[]'::jsonb,

  confidence text NULL
    CHECK (confidence IS NULL OR confidence IN ('low', 'medium', 'high')),

  -- New corrected record points at the old record it supersedes.
  supersedes_id uuid NULL REFERENCES public.leo_memory_records (id),

  -- Contradiction links preserve both statements; neither is overwritten.
  contradicts_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],

  valid_from timestamptz NULL,
  valid_to timestamptz NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  superseded_at timestamptz NULL,

  created_by_roster_id text NULL
    CHECK (created_by_roster_id IS NULL OR char_length(created_by_roster_id) <= 200),
  created_by_auth_user_id text NULL
    CHECK (created_by_auth_user_id IS NULL OR char_length(created_by_auth_user_id) <= 200),

  CONSTRAINT leo_memory_records_supersede_status_chk CHECK (
    (status = 'superseded' AND superseded_at IS NOT NULL)
    OR (status <> 'superseded' AND superseded_at IS NULL)
  ),
  CONSTRAINT leo_memory_records_no_self_supersede_chk CHECK (
    supersedes_id IS NULL OR supersedes_id <> id
  )
);

CREATE INDEX IF NOT EXISTS leo_memory_records_subject_active_idx
  ON public.leo_memory_records (subject_type, subject_key)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS leo_memory_records_epistemic_type_idx
  ON public.leo_memory_records (epistemic_type);

CREATE INDEX IF NOT EXISTS leo_memory_records_created_at_idx
  ON public.leo_memory_records (created_at DESC);

CREATE INDEX IF NOT EXISTS leo_memory_records_supersedes_id_idx
  ON public.leo_memory_records (supersedes_id)
  WHERE supersedes_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS leo_memory_records_status_idx
  ON public.leo_memory_records (status);

COMMENT ON TABLE public.leo_memory_records IS
  'LEO Living Leonix Book — durable executive memory with provenance and supersession. Service-role / server-only. Not chat history. Does not duplicate canonical Leonix entity rows.';

ALTER TABLE public.leo_memory_records ENABLE ROW LEVEL SECURITY;

-- Fail closed: no policies for anon or authenticated. Service role bypasses RLS.
-- Do not add public/anon/authenticated SELECT/INSERT/UPDATE/DELETE policies in this foundation.

COMMIT;
