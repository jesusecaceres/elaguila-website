-- LEO FINAL-02 connected action truth foundation.
-- Additive only. No existing LEO table is redefined, dropped, or has a
-- column removed. Does not enable any external provider write by itself.
--
-- Stores the exact prepared Gmail/Calendar action content the owner is shown
-- before confirming, so the execute endpoint (app/api/leo/action/execute)
-- always re-fetches canonical content by ID rather than trusting whatever the
-- client round-trips back — this is what makes "confirm action A, execute
-- action B" structurally impossible rather than merely unlikely.
--
-- Execution lifecycle (REQUESTED -> AUTHORIZED -> EXECUTED -> VERIFIED) and
-- idempotency (unique correlation_id, atomic CAS transition) remain entirely
-- owned by leo_tool_receipts / leoToolReceiptRepository.ts from LEO FINAL-01 —
-- this table is proposal content only, not a second execution/idempotency system.

CREATE TABLE IF NOT EXISTS public.leo_action_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_auth_user_id uuid NOT NULL,
  tool_id text NOT NULL
    CHECK (char_length(tool_id) > 0 AND char_length(tool_id) <= 80),
  -- Bounded serialized LeoConnectedActionProposal (email or calendar variant).
  -- Server-only; never returned to any caller other than the owning actor.
  proposal jsonb NOT NULL
    CHECK (octet_length(proposal::text) <= 32768),
  -- SHA-256 hex digest of the canonical proposal — a content-tamper check the
  -- client echoes back at confirm time, not a secret and not a capability grant.
  fingerprint text NOT NULL
    CHECK (fingerprint ~ '^[0-9a-f]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 minutes')
);

CREATE INDEX IF NOT EXISTS leo_action_proposals_actor_created_idx
  ON public.leo_action_proposals (actor_auth_user_id, created_at DESC);

COMMENT ON TABLE public.leo_action_proposals IS
  'LEO FINAL-02: exact prepared Gmail/Calendar action content the owner confirmed '
  'against. Execution lifecycle and idempotency remain owned by leo_tool_receipts.';

-- Fail closed: no policies for anon or authenticated. Service role bypasses RLS,
-- matching every other LEO table (leo_tool_receipts, leo_conversation_sessions, ...).
ALTER TABLE public.leo_action_proposals ENABLE ROW LEVEL SECURITY;
