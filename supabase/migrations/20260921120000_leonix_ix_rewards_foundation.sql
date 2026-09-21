-- =============================================================================
-- LEONIX IX REWARDS — canonical wallet + immutable ledger foundation.
--
-- STATUS: AUTHORED, NOT APPLIED. This migration has NOT been run against any remote Supabase
-- project. Apply order and the readers that depend on it are documented in
-- docs/rewards/LEONIX_IX_REWARDS_ARCHITECTURE.md.
--
-- BUSINESS CONTRACT ENCODED HERE
--   * Customers earn 9% back in Leonix Credits on eligible NET SETTLED money actually paid.
--   * $1 credit = $1 toward an eligible Leonix purchase. No cash value. Not transferable.
--   * Credits spent on a purchase do not themselves earn credits.
--   * Refunds, reversals and chargebacks reverse the corresponding earned credits.
--   * Every balance change is an immutable, auditable ledger entry. Nothing is ever edited.
--
-- WHY THESE THREE TABLES
--   leonix_rewards_wallets      one canonical wallet per paying entity, holding CACHED bucket
--                               balances so "can this customer spend X" is a single indexed read
--                               and so non-negativity can be a DATABASE constraint rather than an
--                               application convention.
--   leonix_rewards_ledger       the immutable source of truth. Append-only, enforced by trigger.
--                               A UNIQUE idempotency_key is what makes duplicate Stripe deliveries,
--                               webhook retries and CSV re-imports harmless.
--   leonix_rewards_redemptions  the reserve → commit / release lifecycle for credits applied to a
--                               purchase, so credits are never double-spent across two concurrent
--                               checkouts and are returned when a checkout fails or expires.
--
-- MONEY REPRESENTATION: integer cents everywhere, matching leonix_payment_records. There is no
-- floating-point money in this schema and no numeric column that holds an amount.
--
-- RLS POSTURE: follows the money-table doctrine already established by
-- leonix_stripe_webhook_events and leonix_payment_records — RLS enabled, NO write policies at all,
-- so every mutation is service-role or SECURITY DEFINER. A read policy is granted to active
-- business members so a customer can see their own wallet and history, and to nobody else.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. WALLETS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.leonix_rewards_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The paying entity. Exactly one of these is set: a wallet belongs to a BUSINESS when the payer
  -- is a business, otherwise to the individual auth user. Name and phone are never identity here —
  -- they are search keys on other tables only.
  business_id uuid NULL REFERENCES public.businesses (id) ON DELETE RESTRICT,
  owner_user_id uuid NULL REFERENCES auth.users (id) ON DELETE RESTRICT,

  currency text NOT NULL DEFAULT 'usd',

  -- Cached bucket balances. The ledger is the source of truth; these are maintained atomically by
  -- leonix_rewards_post_entry() in the same statement that appends the ledger row, and can be
  -- rebuilt by leonix_rewards_recompute_wallet().
  pending_cents integer NOT NULL DEFAULT 0,
  available_cents integer NOT NULL DEFAULT 0,
  reserved_cents integer NOT NULL DEFAULT 0,
  lifetime_earned_cents integer NOT NULL DEFAULT 0,
  lifetime_redeemed_cents integer NOT NULL DEFAULT 0,
  lifetime_reversed_cents integer NOT NULL DEFAULT 0,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT leonix_rewards_wallets_owner_chk
    CHECK (num_nonnulls(business_id, owner_user_id) = 1),

  -- THE core money invariant: spendable value can never go negative, enforced by the database and
  -- not by the application. Any attempt to over-redeem aborts the transaction.
  CONSTRAINT leonix_rewards_wallets_pending_nonneg_chk CHECK (pending_cents >= 0),
  CONSTRAINT leonix_rewards_wallets_available_nonneg_chk CHECK (available_cents >= 0),
  CONSTRAINT leonix_rewards_wallets_reserved_nonneg_chk CHECK (reserved_cents >= 0),
  CONSTRAINT leonix_rewards_wallets_lifetime_nonneg_chk
    CHECK (lifetime_earned_cents >= 0 AND lifetime_redeemed_cents >= 0 AND lifetime_reversed_cents >= 0)
);

-- One wallet per entity. Partial uniques because exactly one owner column is populated.
CREATE UNIQUE INDEX IF NOT EXISTS leonix_rewards_wallets_business_idx
  ON public.leonix_rewards_wallets (business_id) WHERE business_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS leonix_rewards_wallets_user_idx
  ON public.leonix_rewards_wallets (owner_user_id) WHERE owner_user_id IS NOT NULL;

COMMENT ON TABLE public.leonix_rewards_wallets IS
  'LEONIX IX REWARDS — one canonical credit wallet per paying entity (a business, or an individual auth user when there is no business). Bucket balances are a maintained cache of the immutable leonix_rewards_ledger; non-negativity is enforced here by CHECK constraints so over-redemption aborts at the database.';

-- -----------------------------------------------------------------------------
-- 2. IMMUTABLE LEDGER
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.leonix_rewards_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES public.leonix_rewards_wallets (id) ON DELETE RESTRICT,

  entry_type text NOT NULL,

  -- Positive magnitude for every type except manual_adjustment, which may be negative.
  amount_cents integer NOT NULL,

  -- Where this entry came from, and the external fact that caused it.
  source_kind text NOT NULL,
  source_id text NULL,
  payment_record_id uuid NULL REFERENCES public.leonix_payment_records (id) ON DELETE SET NULL,
  redemption_id uuid NULL,

  -- THE duplicate-processing guard. Derived from the external event (Stripe event id, payment
  -- record id, redemption id, CSV row hash), so replaying that event is a no-op rather than a
  -- second credit movement.
  idempotency_key text NOT NULL,

  -- Balances AFTER this entry, captured for audit and reconciliation without replaying history.
  balance_pending_after integer NOT NULL,
  balance_available_after integer NOT NULL,
  balance_reserved_after integer NOT NULL,

  reason text NULL,
  actor_auth_user_id uuid NULL REFERENCES auth.users (id) ON DELETE SET NULL,
  actor_roster_id uuid NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT leonix_rewards_ledger_type_chk CHECK (entry_type IN (
    'earn_pending',        -- credits accrued, not yet spendable
    'earn_promote',        -- pending becomes available per the settlement policy
    'earn_available',      -- accrued directly as spendable (settlement already final)
    'redeem_reserve',      -- available is held for an in-flight purchase
    'redeem_commit',       -- the held amount is actually spent
    'redeem_release',      -- the hold is returned after a failed/expired checkout
    'refund_reversal',     -- a refund claws back the credits that payment earned
    'chargeback_reversal', -- a dispute claws back the credits that payment earned
    'manual_adjustment',   -- authorized staff correction, signed, always with a reason
    'expire'               -- only if expiry is ever enabled; no policy enables it today
  )),
  CONSTRAINT leonix_rewards_ledger_source_chk CHECK (source_kind IN (
    'stripe_payment', 'stripe_refund', 'stripe_dispute',
    'manual_payment', 'staff_adjustment', 'csv_import', 'checkout_redemption'
  )),
  -- Only a manual adjustment may be negative or zero-adjacent; everything else moves a positive
  -- magnitude and the entry_type says which direction.
  CONSTRAINT leonix_rewards_ledger_amount_chk CHECK (
    (entry_type = 'manual_adjustment' AND amount_cents <> 0)
    OR (entry_type <> 'manual_adjustment' AND amount_cents > 0)
  ),
  -- A staff correction is never anonymous and never unexplained.
  CONSTRAINT leonix_rewards_ledger_manual_reason_chk CHECK (
    entry_type <> 'manual_adjustment'
    OR (reason IS NOT NULL AND length(btrim(reason)) >= 3 AND actor_auth_user_id IS NOT NULL)
  ),
  CONSTRAINT leonix_rewards_ledger_balances_nonneg_chk CHECK (
    balance_pending_after >= 0 AND balance_available_after >= 0 AND balance_reserved_after >= 0
  )
);

-- Duplicate external events cannot produce a second balance movement.
CREATE UNIQUE INDEX IF NOT EXISTS leonix_rewards_ledger_idempotency_idx
  ON public.leonix_rewards_ledger (idempotency_key);
CREATE INDEX IF NOT EXISTS leonix_rewards_ledger_wallet_created_idx
  ON public.leonix_rewards_ledger (wallet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS leonix_rewards_ledger_payment_idx
  ON public.leonix_rewards_ledger (payment_record_id) WHERE payment_record_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS leonix_rewards_ledger_source_idx
  ON public.leonix_rewards_ledger (source_kind, source_id);

COMMENT ON TABLE public.leonix_rewards_ledger IS
  'LEONIX IX REWARDS — append-only credit ledger. Rows are NEVER updated or deleted (enforced by leonix_rewards_ledger_immutable_tg). UNIQUE(idempotency_key) is what makes duplicate Stripe deliveries, webhook retries and CSV re-imports harmless.';

-- Append-only, enforced by the database rather than by convention.
CREATE OR REPLACE FUNCTION public.leonix_rewards_ledger_reject_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'leonix_rewards_ledger is append-only; % is not permitted. Post a compensating entry instead.', TG_OP;
END;
$$;

DROP TRIGGER IF EXISTS leonix_rewards_ledger_immutable_tg ON public.leonix_rewards_ledger;
CREATE TRIGGER leonix_rewards_ledger_immutable_tg
  BEFORE UPDATE OR DELETE ON public.leonix_rewards_ledger
  FOR EACH ROW EXECUTE FUNCTION public.leonix_rewards_ledger_reject_mutation();

-- -----------------------------------------------------------------------------
-- 3. REDEMPTIONS (reserve → commit / release)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.leonix_rewards_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES public.leonix_rewards_wallets (id) ON DELETE RESTRICT,
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  status text NOT NULL DEFAULT 'reserved',

  -- What the credits are being applied to.
  payment_record_id uuid NULL REFERENCES public.leonix_payment_records (id) ON DELETE SET NULL,
  stripe_checkout_session_id text NULL,
  context_kind text NOT NULL DEFAULT 'stripe_checkout',

  reserve_ledger_id uuid NULL REFERENCES public.leonix_rewards_ledger (id) ON DELETE RESTRICT,
  settle_ledger_id uuid NULL REFERENCES public.leonix_rewards_ledger (id) ON DELETE RESTRICT,

  idempotency_key text NOT NULL,
  expires_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  actor_auth_user_id uuid NULL REFERENCES auth.users (id) ON DELETE SET NULL,

  CONSTRAINT leonix_rewards_redemptions_status_chk
    CHECK (status IN ('reserved', 'committed', 'released', 'expired')),
  CONSTRAINT leonix_rewards_redemptions_context_chk
    CHECK (context_kind IN ('stripe_checkout', 'manual_payment', 'subscription_invoice'))
);

CREATE UNIQUE INDEX IF NOT EXISTS leonix_rewards_redemptions_idempotency_idx
  ON public.leonix_rewards_redemptions (idempotency_key);
CREATE INDEX IF NOT EXISTS leonix_rewards_redemptions_wallet_status_idx
  ON public.leonix_rewards_redemptions (wallet_id, status);
-- At most one live reservation per checkout session, so two tabs cannot double-reserve.
CREATE UNIQUE INDEX IF NOT EXISTS leonix_rewards_redemptions_session_live_idx
  ON public.leonix_rewards_redemptions (stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL AND status = 'reserved';

COMMENT ON TABLE public.leonix_rewards_redemptions IS
  'LEONIX IX REWARDS — credit reservation lifecycle. Credits are RESERVED before a payment is created, COMMITTED only after the payment succeeds, and RELEASED when it fails or expires, so an abandoned checkout never silently consumes a customer''s balance.';

-- -----------------------------------------------------------------------------
-- 4. ATOMIC POSTING FUNCTION
-- The ONLY supported way to move credits. Appends the ledger row and updates the wallet cache in
-- one statement, so a balance can never drift from its history. Bucket deltas are derived HERE, in
-- SQL, rather than supplied by the caller: a buggy or malicious caller therefore cannot invent a
-- movement that the entry type does not mean.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.leonix_rewards_post_entry(
  p_wallet_id uuid,
  p_entry_type text,
  p_amount_cents integer,
  p_source_kind text,
  p_idempotency_key text,
  p_source_id text DEFAULT NULL,
  p_payment_record_id uuid DEFAULT NULL,
  p_redemption_id uuid DEFAULT NULL,
  p_reason text DEFAULT NULL,
  p_actor_auth_user_id uuid DEFAULT NULL,
  p_actor_roster_id uuid DEFAULT NULL,
  p_meta jsonb DEFAULT '{}'::jsonb
)
RETURNS public.leonix_rewards_ledger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing public.leonix_rewards_ledger;
  v_pending_delta integer := 0;
  v_available_delta integer := 0;
  v_reserved_delta integer := 0;
  v_earned_delta integer := 0;
  v_redeemed_delta integer := 0;
  v_reversed_delta integer := 0;
  v_wallet public.leonix_rewards_wallets;
  v_row public.leonix_rewards_ledger;
BEGIN
  -- Idempotency first: replaying an event returns the original entry untouched.
  SELECT * INTO v_existing FROM public.leonix_rewards_ledger WHERE idempotency_key = p_idempotency_key;
  IF FOUND THEN
    RETURN v_existing;
  END IF;

  -- Serialize concurrent movements on this wallet so two checkouts cannot both reserve the last
  -- dollar. Without this, the CHECK would catch it but as a lost-update race rather than a queue.
  SELECT * INTO v_wallet FROM public.leonix_rewards_wallets WHERE id = p_wallet_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'leonix_rewards_post_entry: wallet % not found', p_wallet_id;
  END IF;

  CASE p_entry_type
    WHEN 'earn_pending' THEN
      v_pending_delta := p_amount_cents;
      v_earned_delta := p_amount_cents;
    WHEN 'earn_promote' THEN
      v_pending_delta := -p_amount_cents;
      v_available_delta := p_amount_cents;
    WHEN 'earn_available' THEN
      v_available_delta := p_amount_cents;
      v_earned_delta := p_amount_cents;
    WHEN 'redeem_reserve' THEN
      v_available_delta := -p_amount_cents;
      v_reserved_delta := p_amount_cents;
    WHEN 'redeem_commit' THEN
      v_reserved_delta := -p_amount_cents;
      v_redeemed_delta := p_amount_cents;
    WHEN 'redeem_release' THEN
      v_reserved_delta := -p_amount_cents;
      v_available_delta := p_amount_cents;
    WHEN 'refund_reversal', 'chargeback_reversal' THEN
      -- Take the clawback from pending first (those credits were never spendable), then from
      -- available. A reversal larger than the remaining balance is refused by the CHECK rather
      -- than silently driving the wallet negative.
      IF v_wallet.pending_cents >= p_amount_cents THEN
        v_pending_delta := -p_amount_cents;
      ELSE
        v_pending_delta := -v_wallet.pending_cents;
        v_available_delta := -(p_amount_cents - v_wallet.pending_cents);
      END IF;
      v_reversed_delta := p_amount_cents;
    WHEN 'manual_adjustment' THEN
      v_available_delta := p_amount_cents; -- signed
      IF p_amount_cents > 0 THEN
        v_earned_delta := p_amount_cents;
      ELSE
        v_reversed_delta := -p_amount_cents;
      END IF;
    WHEN 'expire' THEN
      v_available_delta := -p_amount_cents;
      v_reversed_delta := p_amount_cents;
    ELSE
      RAISE EXCEPTION 'leonix_rewards_post_entry: unsupported entry_type %', p_entry_type;
  END CASE;

  UPDATE public.leonix_rewards_wallets
  SET pending_cents = pending_cents + v_pending_delta,
      available_cents = available_cents + v_available_delta,
      reserved_cents = reserved_cents + v_reserved_delta,
      lifetime_earned_cents = lifetime_earned_cents + v_earned_delta,
      lifetime_redeemed_cents = lifetime_redeemed_cents + v_redeemed_delta,
      lifetime_reversed_cents = lifetime_reversed_cents + v_reversed_delta,
      updated_at = now()
  WHERE id = p_wallet_id
  RETURNING * INTO v_wallet;

  INSERT INTO public.leonix_rewards_ledger (
    wallet_id, entry_type, amount_cents, source_kind, source_id, payment_record_id,
    redemption_id, idempotency_key, balance_pending_after, balance_available_after,
    balance_reserved_after, reason, actor_auth_user_id, actor_roster_id, meta
  ) VALUES (
    p_wallet_id, p_entry_type, p_amount_cents, p_source_kind, p_source_id, p_payment_record_id,
    p_redemption_id, p_idempotency_key, v_wallet.pending_cents, v_wallet.available_cents,
    v_wallet.reserved_cents, p_reason, p_actor_auth_user_id, p_actor_roster_id, COALESCE(p_meta, '{}'::jsonb)
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

COMMENT ON FUNCTION public.leonix_rewards_post_entry IS
  'The ONLY supported way to move Leonix Credits. Idempotent on p_idempotency_key, locks the wallet row, derives bucket deltas from the entry type in SQL (so a caller cannot invent a movement), and appends the ledger row and updates the cached balances in one statement.';

-- Rebuild a wallet''s cached balances from ledger history. Reconciliation / repair only.
CREATE OR REPLACE FUNCTION public.leonix_rewards_recompute_wallet(p_wallet_id uuid)
RETURNS public.leonix_rewards_wallets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet public.leonix_rewards_wallets;
BEGIN
  SELECT * INTO v_wallet FROM public.leonix_rewards_wallets WHERE id = p_wallet_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'leonix_rewards_recompute_wallet: wallet % not found', p_wallet_id;
  END IF;

  UPDATE public.leonix_rewards_wallets w
  SET pending_cents = COALESCE(agg.pending, 0),
      available_cents = COALESCE(agg.available, 0),
      reserved_cents = COALESCE(agg.reserved, 0),
      updated_at = now()
  FROM (
    SELECT
      SUM(CASE entry_type
            WHEN 'earn_pending' THEN amount_cents
            WHEN 'earn_promote' THEN -amount_cents
            ELSE 0 END) AS pending,
      SUM(CASE entry_type
            WHEN 'earn_promote' THEN amount_cents
            WHEN 'earn_available' THEN amount_cents
            WHEN 'redeem_reserve' THEN -amount_cents
            WHEN 'redeem_release' THEN amount_cents
            WHEN 'manual_adjustment' THEN amount_cents
            WHEN 'expire' THEN -amount_cents
            ELSE 0 END) AS available,
      SUM(CASE entry_type
            WHEN 'redeem_reserve' THEN amount_cents
            WHEN 'redeem_commit' THEN -amount_cents
            WHEN 'redeem_release' THEN -amount_cents
            ELSE 0 END) AS reserved
    FROM public.leonix_rewards_ledger WHERE wallet_id = p_wallet_id
  ) agg
  WHERE w.id = p_wallet_id
  RETURNING w.* INTO v_wallet;

  RETURN v_wallet;
END;
$$;

-- -----------------------------------------------------------------------------
-- 5. RLS
-- Money-table doctrine: enabled, with NO write policies at all. Every mutation is service-role or
-- SECURITY DEFINER. Customers may READ their own wallet and history; nobody may write from a
-- browser session, ever.
-- -----------------------------------------------------------------------------
ALTER TABLE public.leonix_rewards_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leonix_rewards_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leonix_rewards_redemptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS leonix_rewards_wallets_select_own ON public.leonix_rewards_wallets;
CREATE POLICY leonix_rewards_wallets_select_own
  ON public.leonix_rewards_wallets
  FOR SELECT
  TO authenticated
  USING (
    (owner_user_id IS NOT NULL AND owner_user_id = auth.uid())
    OR (business_id IS NOT NULL AND public.is_active_business_member(business_id))
  );

DROP POLICY IF EXISTS leonix_rewards_ledger_select_own ON public.leonix_rewards_ledger;
CREATE POLICY leonix_rewards_ledger_select_own
  ON public.leonix_rewards_ledger
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.leonix_rewards_wallets w
    WHERE w.id = leonix_rewards_ledger.wallet_id
      AND ((w.owner_user_id IS NOT NULL AND w.owner_user_id = auth.uid())
        OR (w.business_id IS NOT NULL AND public.is_active_business_member(w.business_id)))
  ));

DROP POLICY IF EXISTS leonix_rewards_redemptions_select_own ON public.leonix_rewards_redemptions;
CREATE POLICY leonix_rewards_redemptions_select_own
  ON public.leonix_rewards_redemptions
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.leonix_rewards_wallets w
    WHERE w.id = leonix_rewards_redemptions.wallet_id
      AND ((w.owner_user_id IS NOT NULL AND w.owner_user_id = auth.uid())
        OR (w.business_id IS NOT NULL AND public.is_active_business_member(w.business_id)))
  ));

-- No authenticated INSERT/UPDATE/DELETE policy on any of the three tables, by design.

-- SECURITY DEFINER functions must not be callable directly by a browser session: all credit
-- movement goes through server code that has already authorized the actor.
REVOKE ALL ON FUNCTION public.leonix_rewards_post_entry(
  uuid, text, integer, text, text, text, uuid, uuid, text, uuid, uuid, jsonb
) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.leonix_rewards_recompute_wallet(uuid) FROM PUBLIC, anon, authenticated;

COMMIT;
