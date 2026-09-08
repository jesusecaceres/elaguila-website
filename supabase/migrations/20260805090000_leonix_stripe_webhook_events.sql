-- Package C Build 1 (C2) — M1: durable Stripe webhook event ledger.
-- Purpose: effectively-once fulfillment. Every delivered Stripe event is recorded once by
-- event id; the INSERT doubles as the processing claim (ON CONFLICT DO NOTHING via upsert
-- ignoreDuplicates). Row-state guards in fulfillment code remain the second idempotency layer.
-- Additive only. No existing table touched. Service-role writes only (RLS enabled, no policies —
-- same posture as leonix_payment_records / listing_package_entitlements).

CREATE TABLE IF NOT EXISTS public.leonix_stripe_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id text NOT NULL,
  event_type text NOT NULL,
  api_version text,
  livemode boolean,
  stripe_created_at timestamptz,
  received_at timestamptz NOT NULL DEFAULT now(),
  -- Claim/processing state machine. HTTP semantics drive Stripe's own redelivery as the retry
  -- scheduler: completed/ignored/failed_terminal => 200; failed_retryable => 500 (Stripe retries).
  status text NOT NULL DEFAULT 'processing'
    CHECK (status IN ('received','processing','completed','failed_retryable','failed_terminal','ignored')),
  attempt_count integer NOT NULL DEFAULT 1 CHECK (attempt_count >= 1),
  processing_started_at timestamptz,
  completed_at timestamptz,
  result_code text,
  last_error text,
  -- Lookup helpers (never authoritative business truth):
  object_id text,
  stripe_subscription_id text,
  payment_record_id uuid REFERENCES public.leonix_payment_records(id) ON DELETE SET NULL,
  -- event.data.object snapshot only — never the full event envelope, never secrets.
  payload jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE UNIQUE INDEX IF NOT EXISTS leonix_stripe_webhook_events_event_id_key
  ON public.leonix_stripe_webhook_events (stripe_event_id);
CREATE INDEX IF NOT EXISTS leonix_stripe_webhook_events_event_type_idx
  ON public.leonix_stripe_webhook_events (event_type);
CREATE INDEX IF NOT EXISTS leonix_stripe_webhook_events_status_idx
  ON public.leonix_stripe_webhook_events (status);
CREATE INDEX IF NOT EXISTS leonix_stripe_webhook_events_subscription_idx
  ON public.leonix_stripe_webhook_events (stripe_subscription_id);
CREATE INDEX IF NOT EXISTS leonix_stripe_webhook_events_received_at_idx
  ON public.leonix_stripe_webhook_events (received_at DESC);

ALTER TABLE public.leonix_stripe_webhook_events ENABLE ROW LEVEL SECURITY;
-- No anon/authenticated policies: access via service role only.

COMMENT ON TABLE public.leonix_stripe_webhook_events IS
  'Stripe webhook event ledger (Package C Build 1). One row per stripe event id; INSERT-claim + conditional UPDATE-claim give effectively-once fulfillment. failed_retryable rows are retried via Stripe redelivery (HTTP 500); a processing row older than 10 minutes may be re-claimed (crash self-heal).';
