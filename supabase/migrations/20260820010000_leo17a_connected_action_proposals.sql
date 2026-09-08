-- LEO-17A Connected Action Persistence Foundation.
-- Durable, governed proposal contract for future provider-side effects.
-- Additive only. Server/service-role only. RLS enabled with no public/anon/auth policies.

BEGIN;

-- ---------------------------------------------------------------------------
-- leo_action_proposals
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.leo_action_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  owner_actor_id text NOT NULL
    CHECK (char_length(btrim(owner_actor_id)) > 0 AND char_length(owner_actor_id) <= 200),

  source_session_id uuid NULL,
  source_turn_id uuid NULL,

  action_family text NOT NULL
    CHECK (action_family IN ('GMAIL_SEND', 'GMAIL_REPLY', 'CALENDAR_CREATE', 'CALENDAR_UPDATE')),

  -- This build only permits RED governed families.
  governance_level text NOT NULL
    CHECK (governance_level IN ('RED')),

  proposal_state text NOT NULL DEFAULT 'DRAFT'
    CHECK (proposal_state IN (
      'DRAFT',
      'PREPARED',
      'AWAITING_APPROVAL',
      'APPROVED',
      'EXECUTION_CLAIMED',
      'EXECUTED',
      'VERIFIED',
      'FAILED',
      'CANCELLED',
      'EXPIRED'
    )),

  approval_state text NOT NULL DEFAULT 'NONE'
    CHECK (approval_state IN ('NONE', 'PENDING', 'APPROVED', 'REJECTED')),

  normalized_target jsonb NOT NULL DEFAULT '{}'::jsonb,
  structured_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  referent_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,

  proposal_fingerprint text NOT NULL
    CHECK (char_length(btrim(proposal_fingerprint)) > 0),

  -- Mandatory stable unique key for atomic execution-claim idempotency.
  execution_claim_key text NOT NULL
    CHECK (char_length(btrim(execution_claim_key)) > 0),
  CONSTRAINT leo_action_proposals_execution_claim_key_uq UNIQUE (execution_claim_key),

  linked_receipt_id uuid NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  approved_at timestamptz NULL,
  execution_claimed_at timestamptz NULL,
  executed_at timestamptz NULL,
  verified_at timestamptz NULL,
  failed_at timestamptz NULL,

  expires_at timestamptz NOT NULL,

  -- Monotonic timestamps / terminal states are enforced in service/repository.
  -- This migration only provides schema-level guardrails.
  CONSTRAINT leo_action_proposals_expires_at_nonnull_chk CHECK (expires_at IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS leo_action_proposals_owner_state_expiry_idx
  ON public.leo_action_proposals (owner_actor_id, proposal_state, expires_at DESC);

ALTER TABLE public.leo_action_proposals ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.leo_action_proposals IS
  'LEO-17A governed connected action proposals. No provider execution in this build. RLS enabled with no client policies.';

COMMIT;

