-- Saved Search 04 — durable match/outbox truth for future alert delivery (Autos V1 only).
--
-- Mirrors this repo's proven "effectively-once" ledger pattern from
-- `leonix_stripe_webhook_events` (supabase/migrations/20260805090000_leonix_stripe_webhook_events.sql)
-- and its app-layer counterpart `app/lib/listingPlans/stripeEventLedger.ts`: the INSERT itself is
-- the dedupe boundary (unique index + `upsert(..., ignoreDuplicates: true)`), not an
-- application-side check. Unlike the Stripe ledger, a match event has no external caller waiting
-- on an HTTP retry code and no multi-step "processing" window — matching is a fast, synchronous,
-- in-process computation, so there is no `processing`/stale-reclaim state machine here. `status`
-- exists only for the FUTURE delivery worker (Saved Search 05+) to claim/settle against; this
-- build only ever writes `status = 'pending'`.
--
-- Additive only. No existing table touched. Service-role writes only (RLS enabled, no policies —
-- same posture as leonix_stripe_webhook_events / leonix_phone_verification_challenges): a
-- match-event ledger is server-computed only and must never be directly writable by an
-- authenticated browser client.

CREATE TABLE IF NOT EXISTS public.saved_search_match_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_search_id uuid NOT NULL REFERENCES public.saved_searches (id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES public.autos_classifieds_listings (id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'autos' CHECK (category = 'autos'),
  -- V1 can only truthfully prove "this active listing now matches this active saved search" at
  -- the moment it was newly published/activated — it cannot yet distinguish a genuine relist from
  -- a first-time publish, nor compare prior vs. new price to prove a real price drop. Do not add
  -- 'relisted' / 'price_drop' / 'availability_change' values until a write path exists that can
  -- prove them from real prior-state comparison, not inference.
  event_type text NOT NULL DEFAULT 'listing_activated_match'
    CHECK (event_type IN ('listing_activated_match')),
  -- Match-time snapshot (Gate 12): only stable, non-sensitive, display-safe fields. No exact
  -- hidden address, no contact details, no full listing_payload blob, no secrets.
  matched_fingerprint text NOT NULL,
  leonix_ad_id text,
  listing_title text NOT NULL,
  listing_price integer,
  listing_city text,
  listing_state text,
  seller_lane text CHECK (seller_lane IS NULL OR seller_lane IN ('negocios', 'privado')),
  -- Reserved for the future delivery worker (Saved Search 05+). Only 'pending' is ever written by
  -- this build; the other values are declared now so a future delivery migration doesn't need to
  -- widen this CHECK.
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'delivered', 'failed', 'skipped')),
  attempt_count integer NOT NULL DEFAULT 1 CHECK (attempt_count >= 1),
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  delivered_at timestamptz
);

-- Hard database-level dedupe boundary (Gate 4) — one logical match can never produce duplicate
-- rows from a retried/re-triggered hook. The INSERT-with-ignoreDuplicates IS the dedupe check.
CREATE UNIQUE INDEX IF NOT EXISTS saved_search_match_events_dedupe_uidx
  ON public.saved_search_match_events (saved_search_id, listing_id, event_type);

CREATE INDEX IF NOT EXISTS saved_search_match_events_owner_idx
  ON public.saved_search_match_events (owner_user_id);
CREATE INDEX IF NOT EXISTS saved_search_match_events_listing_idx
  ON public.saved_search_match_events (listing_id);
CREATE INDEX IF NOT EXISTS saved_search_match_events_status_idx
  ON public.saved_search_match_events (status);
CREATE INDEX IF NOT EXISTS saved_search_match_events_created_at_idx
  ON public.saved_search_match_events (created_at DESC);

ALTER TABLE public.saved_search_match_events ENABLE ROW LEVEL SECURITY;
-- No anon/authenticated policies: access via service role only. No public route may create,
-- read, or forge a match event directly — the only writer is the server-side match orchestrator
-- (app/lib/saved-search/autos/autosSavedSearchMatchOrchestrator.ts), itself only ever invoked
-- from an already-successful, server-side listing-activation write path.

COMMENT ON TABLE public.saved_search_match_events IS
  'Saved Search 04 — durable, deduped record that an active Autos listing newly matched an '
  'active saved search. Best-effort side effect of listing activation; never blocks or fails '
  'listing publication. No delivery (email/SMS/push) happens from this table yet — Saved Search '
  '05+ reads status=''pending'' rows to deliver later. Never contains hidden address, contact '
  'details, secrets, or the full listing payload.';

-- Saved Search 04 — durable capture of orchestration-level failures that occur BEFORE a match
-- event row could even be produced (e.g. eligibility certification threw, the active-search read
-- failed, or the matcher itself raised). Distinct from a future per-row delivery `last_error` on
-- saved_search_match_events — this table is for failures that have no specific saved_search_id to
-- attach to yet. Same server-only posture as above.
CREATE TABLE IF NOT EXISTS public.saved_search_processing_failures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES public.autos_classifieds_listings (id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'autos' CHECK (category = 'autos'),
  source_event text NOT NULL,
  stage text NOT NULL,
  error_code text,
  -- Normalized/truncated message only — never a raw stack trace, never secrets.
  error_message text,
  attempts integer NOT NULL DEFAULT 1 CHECK (attempts >= 1),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE INDEX IF NOT EXISTS saved_search_processing_failures_listing_idx
  ON public.saved_search_processing_failures (listing_id);
CREATE INDEX IF NOT EXISTS saved_search_processing_failures_unresolved_idx
  ON public.saved_search_processing_failures (created_at DESC)
  WHERE resolved_at IS NULL;

ALTER TABLE public.saved_search_processing_failures ENABLE ROW LEVEL SECURITY;
-- No anon/authenticated policies: access via service role only.

COMMENT ON TABLE public.saved_search_processing_failures IS
  'Saved Search 04 — durable capture of match-orchestration failures with no specific match row '
  'to attach to. Diagnostic/audit only; never blocks listing publication. Service-role access '
  'only.';

-- Truthful updated_at (repo precedent: magazine_visual_assets_set_updated_at /
-- saved_searches_set_updated_at) — dedicated per-table trigger, not a shared generic function.
CREATE OR REPLACE FUNCTION public.saved_search_match_events_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS saved_search_match_events_updated_at ON public.saved_search_match_events;
CREATE TRIGGER saved_search_match_events_updated_at
  BEFORE UPDATE ON public.saved_search_match_events
  FOR EACH ROW
  EXECUTE PROCEDURE public.saved_search_match_events_set_updated_at();

CREATE OR REPLACE FUNCTION public.saved_search_processing_failures_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS saved_search_processing_failures_updated_at ON public.saved_search_processing_failures;
CREATE TRIGGER saved_search_processing_failures_updated_at
  BEFORE UPDATE ON public.saved_search_processing_failures
  FOR EACH ROW
  EXECUTE PROCEDURE public.saved_search_processing_failures_set_updated_at();
