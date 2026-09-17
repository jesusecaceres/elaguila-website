-- LEO-22C owner response feedback + governed fact-correction proposals.
-- Additive. Service-role / server-only. RLS on, no public/anon/authenticated policies.
-- Do not apply in this construction gate. Staging apply is a later operational step.

BEGIN;

CREATE TABLE IF NOT EXISTS public.leo_response_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  polarity text NOT NULL CHECK (polarity IN ('POSITIVE', 'NEGATIVE')),
  failure_category text NULL,
  failure_class text NULL,
  session_id text NULL CHECK (session_id IS NULL OR char_length(session_id) <= 80),
  leo_turn_id text NULL CHECK (leo_turn_id IS NULL OR char_length(leo_turn_id) <= 80),
  user_turn_id text NULL CHECK (user_turn_id IS NULL OR char_length(user_turn_id) <= 80),
  local_response_id text NOT NULL CHECK (char_length(btrim(local_response_id)) > 0 AND char_length(local_response_id) <= 120),
  owner_key text NULL CHECK (owner_key IS NULL OR char_length(owner_key) <= 200),
  request_snapshot text NULL CHECK (request_snapshot IS NULL OR char_length(request_snapshot) <= 2000),
  response_snapshot text NULL CHECK (response_snapshot IS NULL OR char_length(response_snapshot) <= 2000),
  active_workspace text NULL CHECK (active_workspace IS NULL OR char_length(active_workspace) <= 64),
  selected_card_id text NULL CHECK (selected_card_id IS NULL OR char_length(selected_card_id) <= 200),
  selected_entity_ref text NULL CHECK (selected_entity_ref IS NULL OR char_length(selected_entity_ref) <= 400),
  presentation_intent_kind text NULL CHECK (presentation_intent_kind IS NULL OR char_length(presentation_intent_kind) <= 64),
  owner_note text NULL CHECK (owner_note IS NULL OR char_length(owner_note) <= 2000),
  expected_destination text NULL CHECK (expected_destination IS NULL OR char_length(expected_destination) <= 64),
  source_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS leo_response_feedback_owner_local_uidx
  ON public.leo_response_feedback (owner_key, local_response_id);

CREATE UNIQUE INDEX IF NOT EXISTS leo_response_feedback_owner_turn_uidx
  ON public.leo_response_feedback (owner_key, leo_turn_id)
  WHERE leo_turn_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS leo_response_feedback_created_at_idx
  ON public.leo_response_feedback (created_at DESC);

COMMENT ON TABLE public.leo_response_feedback IS
  'LEO-22C owner ratings of LEO responses. Quality evidence only. Never canonical truth. Service-role only.';

ALTER TABLE public.leo_response_feedback ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.leo_fact_correction_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id uuid NULL REFERENCES public.leo_response_feedback (id),
  current_statement text NULL CHECK (current_statement IS NULL OR char_length(current_statement) <= 4000),
  proposed_statement text NOT NULL CHECK (char_length(btrim(proposed_statement)) > 0 AND char_length(proposed_statement) <= 4000),
  source_context text NULL CHECK (source_context IS NULL OR char_length(source_context) <= 2000),
  status text NOT NULL DEFAULT 'PROPOSED' CHECK (status IN ('PROPOSED', 'ACCEPTED', 'REJECTED')),
  owner_key text NULL CHECK (owner_key IS NULL OR char_length(owner_key) <= 200),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS leo_fact_correction_proposals_status_idx
  ON public.leo_fact_correction_proposals (status);

COMMENT ON TABLE public.leo_fact_correction_proposals IS
  'LEO-22C governed fact-correction proposals. Never auto-accepted. Does not rewrite Living Book rows.';

ALTER TABLE public.leo_fact_correction_proposals ENABLE ROW LEVEL SECURITY;

-- Fail closed: no policies for anon or authenticated. Service role bypasses RLS.

COMMIT;
