-- Globalization Build 03 — Leonix Community Trust: native category-aware endorsement votes.
--
-- NOT a 1-5 star clone. A vote is a (user, target, endorsement_key) fact row; counts are always
-- derived by counting real rows, never a browser-writable aggregate column. Endorsement label
-- definitions (ES/EN copy, category applicability, display order) live in a TypeScript code
-- registry (app/lib/leonixCommunityTrust/leonixEndorsementRegistry.ts), never on the vote row
-- itself — so copy can evolve without rewriting historical votes.
--
-- Additive only. No existing table touched except a safe, additive widening of the existing
-- `listing_analytics.event_type` CHECK constraint (mirrors the exact drop/recreate pattern already
-- used by 20260602120000_g2a_global_analytics_identity.sql and
-- 20260801003000_ofertas_locales_partner_analytics_asset_lifecycle.sql — preserves every existing
-- value, adds two new ones).

-- ---------------------------------------------------------------------------
-- 1) VOTE TABLE
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.leonix_endorsement_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Durable public-business identity being endorsed (Gate 13) — NEVER a disposable ad/listing
  -- UUID when a durable business profile exists. V1 targets, both durable one-row-per-business
  -- tables (confirmed by direct schema read, not guessed):
  --   servicios_profile   -> servicios_public_listings.id
  --   restaurantes_listing -> restaurantes_public_listings.id
  target_type text NOT NULL CHECK (target_type IN ('servicios_profile', 'restaurantes_listing')),
  target_id uuid NOT NULL,
  category text NOT NULL CHECK (category IN ('servicios', 'restaurantes')),
  -- The FULL semantic vocabulary (which specific keys are valid for which category) is validated
  -- against the code registry at the application layer, not here — widening it must never require
  -- a migration, only a registry edit. This CHECK is deliberately narrower: a defense-in-depth
  -- FORMAT guard (lowercase snake_case, bounded length) so even a bypass of the app-layer registry
  -- check can never write a malformed/oversized/non-ASCII value — final hardening gate, Gate 6.
  endorsement_key text NOT NULL CHECK (endorsement_key ~ '^[a-z][a-z0-9_]{1,39}$'),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ONE USER + ONE TARGET + ONE ENDORSEMENT KEY = AT MOST ONE ACTIVE VOTE (Gate 14). This is the
-- real dedupe boundary, not an application-side check — mirrors the proven composite-key shape
-- already used by saved_listings/user_liked_listings (PRIMARY KEY (user_id, listing_id)),
-- extended with target_type/endorsement_key since one user can hold multiple simultaneous votes
-- for the same target (different qualities) and the same key could theoretically apply to
-- different target_types in the future.
CREATE UNIQUE INDEX IF NOT EXISTS leonix_endorsement_votes_dedupe_uidx
  ON public.leonix_endorsement_votes (user_id, target_type, target_id, endorsement_key);

CREATE INDEX IF NOT EXISTS leonix_endorsement_votes_target_idx
  ON public.leonix_endorsement_votes (target_type, target_id, endorsement_key);

-- Server-only: no browser role may insert/update/delete a vote row directly. All writes go
-- through the atomic toggle RPC below (called only from the authenticated API route, which
-- resolves user_id server-side via the bearer token — never trusts a request-body user_id).
-- Mirrors the exact "RLS enabled, zero policies" posture established by
-- saved_search_match_events (20260818120000) and every server-only table since.
ALTER TABLE public.leonix_endorsement_votes ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.leonix_endorsement_votes IS
  'Globalization Build 03 — Leonix Community Trust. One row = one user''s vote for one '
  'endorsement quality on one durable business target. Counts are always COUNT(*) over real rows '
  '— never a writable aggregate. Endorsement label copy lives in a code registry, not here. '
  'Service-role write access only (via the toggle RPC); public read only via the aggregate RPC.';

-- ---------------------------------------------------------------------------
-- 2) ATOMIC TOGGLE RPC (write) — service-role only
-- ---------------------------------------------------------------------------
-- Single statement per branch: DELETE first (if a vote exists, remove it), otherwise INSERT with
-- ON CONFLICT DO NOTHING. Two concurrent calls for the same (user, target, key) serialize on the
-- unique index / row lock — the result is a deterministic, correct toggle (matching real rapid
-- double-tap UX), never a duplicate row (the unique index is the actual guarantee, not this
-- function's own logic). p_user_id is a parameter, never trusted from an untrusted source — the
-- ONLY caller is the authenticated API route, which resolves it from a verified bearer token
-- before invoking this function; this function itself is never reachable from the browser.
--
-- Final hardening gate (Gate 6) — target existence is verified INSIDE this same atomic statement
-- set, not only at the application layer: a vote can never be created for a target_id that does
-- not actually exist as a real row in that category's own durable business table, even a
-- syntactically-valid random UUID. This closes the gap where the RPC alone (if ever reached by a
-- future caller that skipped the app-layer check) could otherwise accept an arbitrary target.
CREATE OR REPLACE FUNCTION public.toggle_leonix_endorsement_vote(
  p_target_type text,
  p_target_id uuid,
  p_category text,
  p_endorsement_key text,
  p_user_id uuid
)
RETURNS TABLE(active boolean, vote_count integer)
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_deleted integer;
  v_target_exists boolean;
BEGIN
  IF p_target_type = 'servicios_profile' THEN
    SELECT EXISTS (SELECT 1 FROM public.servicios_public_listings WHERE id = p_target_id) INTO v_target_exists;
  ELSIF p_target_type = 'restaurantes_listing' THEN
    SELECT EXISTS (SELECT 1 FROM public.restaurantes_public_listings WHERE id = p_target_id) INTO v_target_exists;
  ELSE
    v_target_exists := false;
  END IF;

  IF NOT v_target_exists THEN
    RAISE EXCEPTION 'leonix_endorsement_target_not_found' USING ERRCODE = 'foreign_key_violation';
  END IF;

  DELETE FROM public.leonix_endorsement_votes
  WHERE user_id = p_user_id
    AND target_type = p_target_type
    AND target_id = p_target_id
    AND endorsement_key = p_endorsement_key;
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  IF v_deleted = 0 THEN
    INSERT INTO public.leonix_endorsement_votes (target_type, target_id, category, endorsement_key, user_id)
    VALUES (p_target_type, p_target_id, p_category, p_endorsement_key, p_user_id)
    ON CONFLICT (user_id, target_type, target_id, endorsement_key) DO NOTHING;
  END IF;

  RETURN QUERY
  SELECT
    EXISTS (
      SELECT 1 FROM public.leonix_endorsement_votes
      WHERE user_id = p_user_id
        AND target_type = p_target_type
        AND target_id = p_target_id
        AND endorsement_key = p_endorsement_key
    ) AS active,
    (
      SELECT COUNT(*)::integer FROM public.leonix_endorsement_votes
      WHERE target_type = p_target_type AND target_id = p_target_id AND endorsement_key = p_endorsement_key
    ) AS vote_count;
END;
$$;

REVOKE ALL ON FUNCTION public.toggle_leonix_endorsement_vote(text, uuid, text, text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.toggle_leonix_endorsement_vote(text, uuid, text, text, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.toggle_leonix_endorsement_vote(text, uuid, text, text, uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_leonix_endorsement_vote(text, uuid, text, text, uuid) TO service_role;

COMMENT ON FUNCTION public.toggle_leonix_endorsement_vote(text, uuid, text, text, uuid) IS
  'Leonix Community Trust — atomic vote toggle. service_role execute only; the API route resolves '
  'p_user_id from a verified bearer token before calling this, never from request input.';

-- ---------------------------------------------------------------------------
-- 3) AGGREGATE READ RPC — service-role only (Final hardening gate, Gate 7)
-- ---------------------------------------------------------------------------
-- Returns real vote counts per endorsement_key for one target, plus whether p_user_id (nullable —
-- null for a signed-out viewer) has voted each key.
--
-- SECURITY CORRECTION (Gate 7): this function was originally granted directly to anon/authenticated
-- so a signed-out visitor could see public counts without an access token. That was unsafe: because
-- `p_user_id` is a caller-supplied parameter (not derived from `auth.uid()`), any authenticated
-- browser session could have called this RPC DIRECTLY via PostgREST — bypassing
-- `/api/leonix-endorsements` entirely — with an ARBITRARY other user's UUID as `p_user_id` and
-- received back that other user's own vote selections. Aggregate counts are genuinely public;
-- per-user vote state is not, and nothing here can safely tell those two apart at the grant level
-- (the count columns and the user_voted column come from the same function signature). The fix is
-- to make this service-role only, exactly like the toggle RPC — the ONLY caller is
-- `/api/leonix-endorsements` (GET), which already correctly resolves `p_user_id` from the
-- requester's OWN verified bearer token before calling this (never from a query parameter), so a
-- browser can only ever learn its own vote state, never another user's. No behavior change for
-- real users; only the direct-RPC bypass path is closed.
CREATE OR REPLACE FUNCTION public.get_leonix_endorsement_summary(
  p_target_type text,
  p_target_id uuid,
  p_user_id uuid DEFAULT NULL
)
RETURNS TABLE(endorsement_key text, vote_count integer, user_voted boolean)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT
    endorsement_key,
    COUNT(*)::integer AS vote_count,
    BOOL_OR(p_user_id IS NOT NULL AND user_id = p_user_id) AS user_voted
  FROM public.leonix_endorsement_votes
  WHERE target_type = p_target_type AND target_id = p_target_id
  GROUP BY endorsement_key;
$$;

REVOKE ALL ON FUNCTION public.get_leonix_endorsement_summary(text, uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_leonix_endorsement_summary(text, uuid, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.get_leonix_endorsement_summary(text, uuid, uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_leonix_endorsement_summary(text, uuid, uuid) TO service_role;

COMMENT ON FUNCTION public.get_leonix_endorsement_summary(text, uuid, uuid) IS
  'Leonix Community Trust — aggregate read, service_role execute only (Gate 7 hardening — was '
  'previously anon/authenticated-callable, which would have let a browser query an arbitrary other '
  'user''s vote selections by passing their id as p_user_id via direct PostgREST access). The only '
  'caller is app/api/leonix-endorsements (GET), which resolves p_user_id from the requester''s own '
  'verified bearer token. One bounded query for every endorsement key''s real vote count on one '
  'target, no N+1. Never exposes voter identity beyond the caller''s own vote state.';

-- ---------------------------------------------------------------------------
-- 4) ANALYTICS EVENT-TYPE WIDENING — additive, preserves every existing value
-- ---------------------------------------------------------------------------
ALTER TABLE public.listing_analytics DROP CONSTRAINT IF EXISTS listing_analytics_event_type_check;

ALTER TABLE public.listing_analytics
  ADD CONSTRAINT listing_analytics_event_type_check
  CHECK (event_type IN (
    'listing_view',
    'listing_save',
    'listing_unsave',
    'listing_share',
    'message_sent',
    'profile_view',
    'listing_open',
    'listing_like',
    'listing_unlike',
    'cta_click',
    'phone_click',
    'whatsapp_click',
    'website_click',
    'directions_click',
    'lead_created',
    'apply_started',
    'apply_submitted',
    'contact_click',
    'outbound_click',
    'listing_impression',
    'result_card_click',
    'email_click',
    'message_click',
    'flyer_page_view',
    'product_impression',
    'product_open',
    'product_search',
    'product_search_result_click',
    'shopping_list_add',
    'shopping_list_remove',
    'coupon_open',
    'leonix_endorsement_add',
    'leonix_endorsement_remove'
  ));
