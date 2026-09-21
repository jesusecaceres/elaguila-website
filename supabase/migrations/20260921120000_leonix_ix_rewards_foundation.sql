-- =============================================================================
-- LEONIX IX REWARDS — canonical wallet + immutable ledger foundation.
--
-- STATUS: AUTHORED, NOT APPLIED. This migration has NOT been run against any remote Supabase
-- project. Apply order and the readers that depend on it are documented in
-- docs/rewards/LEONIX_IX_REWARDS_ARCHITECTURE.md.
--
-- SECURITY AND CONCURRENCY POSTURE (repaired in place, still unapplied)
--   * Every SECURITY DEFINER function pins `search_path = pg_catalog, public, pg_temp` and
--     schema-qualify every identifier, so a temporary object cannot shadow anything they call.
--   * EXECUTE is revoked from PUBLIC/anon/authenticated and granted EXPLICITLY to service_role,
--     rather than left to Postgres's default grant-to-PUBLIC.
--   * Table privileges are stated the same way: SELECT to authenticated (under the RLS policies
--     below), everything to service_role, nothing at all to anon.
--   * A concurrent insert on the same idempotency_key unwinds the wallet update and the ledger
--     append together and returns the winner's row, instead of aborting the caller's transaction.
--   * Over-redemption, over-reversal, over-promotion and an over-large staff debit each RAISE a
--     named error before the balance is touched; the non-negative CHECKs remain as the backstop.
--   * leonix_rewards_recompute_wallet() REPLAYS history in posting order, because reversals and
--     negative adjustments are path-dependent and no aggregate can reproduce them.
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

  -- RECOVERY BALANCE — what the customer OWES back, never a negative wallet.
  --
  -- A refund or chargeback claws back the credits its payment earned. When the customer has
  -- already SPENT them the wallet cannot go negative, so the shortfall is recorded here instead.
  -- Recovery is not a balance the customer holds; it is a balance they owe. Future earnings repay
  -- it before becoming spendable, which is what makes the clawback real without ever producing a
  -- negative number a customer could see or a redemption could draw on.
  recovery_cents integer NOT NULL DEFAULT 0,
  lifetime_recovery_accrued_cents integer NOT NULL DEFAULT 0,
  lifetime_recovery_offset_cents integer NOT NULL DEFAULT 0,
  -- Credits given BACK after a dispute was won. Tracked separately from `lifetime_earned` so a
  -- restoration never reads as new earning, and separately from `lifetime_reversed` because the
  -- ledger is append-only and the original reversal row stands.
  lifetime_restored_cents integer NOT NULL DEFAULT 0,

  -- THE CANONICAL BINDING. The auth user this wallet serves, pinned at first use and never
  -- reassigned. Without it, wallet identity was a live query over `business_memberships`: a
  -- customer who earned as an individual and later became primary owner of a business silently
  -- started resolving to the BUSINESS wallet, and their own balance vanished from every surface.
  -- Earn, promotion, redemption, reversal, release and restoration all resolve through this, so
  -- one customer has exactly one wallet identity for the whole lifecycle. It effects no merge:
  -- a wallet that already exists for another binding is never taken over.
  bound_user_id uuid NULL REFERENCES auth.users (id) ON DELETE RESTRICT,

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
    CHECK (lifetime_earned_cents >= 0 AND lifetime_redeemed_cents >= 0 AND lifetime_reversed_cents >= 0),
  -- Recovery is an amount OWED. It is non-negative for the same reason the buckets are: an
  -- over-repayment would mean the customer paid back more than was ever clawed back.
  CONSTRAINT leonix_rewards_wallets_recovery_nonneg_chk CHECK (recovery_cents >= 0),
  CONSTRAINT leonix_rewards_wallets_recovery_lifetime_nonneg_chk
    CHECK (lifetime_recovery_accrued_cents >= 0 AND lifetime_recovery_offset_cents >= 0),
  CONSTRAINT leonix_rewards_wallets_restored_nonneg_chk CHECK (lifetime_restored_cents >= 0)
);

-- One wallet per entity. Partial uniques because exactly one owner column is populated.
CREATE UNIQUE INDEX IF NOT EXISTS leonix_rewards_wallets_business_idx
  ON public.leonix_rewards_wallets (business_id) WHERE business_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS leonix_rewards_wallets_user_idx
  ON public.leonix_rewards_wallets (owner_user_id) WHERE owner_user_id IS NOT NULL;
-- One customer, one wallet. The partial unique is what makes the binding an identity rather than
-- a hint: a second wallet can never claim a user who is already bound.
CREATE UNIQUE INDEX IF NOT EXISTS leonix_rewards_wallets_bound_user_idx
  ON public.leonix_rewards_wallets (bound_user_id) WHERE bound_user_id IS NOT NULL;

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
    'redeem_recommit',     -- an EXPIRED hold re-debited in ONE movement: available -> spent
    'reversal_restoration',-- a WON dispute gives back exactly what its reversal took
    'recovery_accrue',     -- a clawback the wallet could not cover, recorded as owed
    'recovery_offset',     -- future earnings repaying that debt before becoming spendable
    'refund_reversal',     -- a refund claws back the credits that payment earned
    'chargeback_reversal', -- a dispute claws back the credits that payment earned
    'manual_adjustment',   -- authorized staff correction, signed, always with a reason
    'expire'               -- only if expiry is ever enabled; no policy enables it today
  )),
  CONSTRAINT leonix_rewards_ledger_source_chk CHECK (source_kind IN (
    'stripe_payment', 'stripe_refund', 'stripe_dispute',
    'manual_payment', 'staff_adjustment', 'csv_import', 'checkout_redemption'
  )),
  -- A manual adjustment is signed and may be negative. A reversal may be ZERO: a refund event that
  -- lands on a payment already reversed to its proportional target still has to be RECORDED,
  -- because its idempotency key is what makes the next delivery of that same refund a no-op, and
  -- its meta carries the refunded basis the cumulative arithmetic depends on. Dropping it would
  -- leave a silent gap in the audit trail and lose the basis. Everything else moves a positive
  -- magnitude, and the entry_type says which direction.
  CONSTRAINT leonix_rewards_ledger_amount_chk CHECK (
    (entry_type = 'manual_adjustment' AND amount_cents <> 0)
    -- A reversal, a restoration and a recovery movement may all be ZERO for the same reason: the
    -- event still has to be RECORDED under its idempotency key so the next delivery is a no-op
    -- and the cumulative position keeps its basis, even when nothing moved.
    OR (entry_type IN (
          'refund_reversal', 'chargeback_reversal', 'reversal_restoration',
          'recovery_accrue', 'recovery_offset'
        ) AND amount_cents >= 0)
    OR (entry_type NOT IN (
          'manual_adjustment', 'refund_reversal', 'chargeback_reversal',
          'reversal_restoration', 'recovery_accrue', 'recovery_offset'
        ) AND amount_cents > 0)
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

-- DETERMINISTIC REPLAY ORDER.
--
-- `created_at` is transaction START time, not the serialization point: two overlapping
-- transactions can commit in the opposite order to their timestamps, and a replay ordered by
-- `created_at` then reconstructs an intermediate state that never existed — possibly negative, in
-- which case recomputation refuses a ledger that is in fact perfectly consistent.
--
-- `entry_seq` is drawn from a sequence INSIDE the wallet lock, so it is assigned in the exact
-- order movements actually serialized on that wallet. It is the canonical replay order and the
-- tie-breaker nothing else can supply.
CREATE SEQUENCE IF NOT EXISTS public.leonix_rewards_ledger_seq AS bigint;
ALTER TABLE public.leonix_rewards_ledger
  ADD COLUMN IF NOT EXISTS entry_seq bigint;
CREATE UNIQUE INDEX IF NOT EXISTS leonix_rewards_ledger_entry_seq_idx
  ON public.leonix_rewards_ledger (entry_seq) WHERE entry_seq IS NOT NULL;
CREATE INDEX IF NOT EXISTS leonix_rewards_ledger_wallet_seq_idx
  ON public.leonix_rewards_ledger (wallet_id, entry_seq);

-- Duplicate external events cannot produce a second balance movement.
CREATE UNIQUE INDEX IF NOT EXISTS leonix_rewards_ledger_idempotency_idx
  ON public.leonix_rewards_ledger (idempotency_key);
CREATE INDEX IF NOT EXISTS leonix_rewards_ledger_wallet_created_idx
  ON public.leonix_rewards_ledger (wallet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS leonix_rewards_ledger_payment_idx
  ON public.leonix_rewards_ledger (payment_record_id) WHERE payment_record_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS leonix_rewards_ledger_source_idx
  ON public.leonix_rewards_ledger (source_kind, source_id);
-- The 30-day promotion sweep reads exactly this: pending card earns, oldest first.
CREATE INDEX IF NOT EXISTS leonix_rewards_ledger_pending_earn_age_idx
  ON public.leonix_rewards_ledger (created_at)
  WHERE entry_type = 'earn_pending';
-- ...and checks whether each one was already promoted.
CREATE INDEX IF NOT EXISTS leonix_rewards_ledger_promote_lookup_idx
  ON public.leonix_rewards_ledger (payment_record_id)
  WHERE entry_type = 'earn_promote';

COMMENT ON TABLE public.leonix_rewards_ledger IS
  'LEONIX IX REWARDS — append-only credit ledger. Rows are NEVER updated or deleted (enforced by leonix_rewards_ledger_immutable_tg). UNIQUE(idempotency_key) is what makes duplicate Stripe deliveries, webhook retries and CSV re-imports harmless.';

-- Append-only, enforced by the database rather than by convention.
CREATE OR REPLACE FUNCTION public.leonix_rewards_ledger_reject_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public, pg_temp
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
  -- THE hold's deadline, written on RESERVE. Nullable only so a committed historical row is not
  -- forced to carry one; a row that is still `reserved` must have it, because the release job
  -- reads this column rather than re-deriving a deadline from created_at and a constant it might
  -- not share with the code that made the hold.
  expires_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  actor_auth_user_id uuid NULL REFERENCES auth.users (id) ON DELETE SET NULL,

  CONSTRAINT leonix_rewards_redemptions_status_chk
    CHECK (status IN ('reserved', 'committed', 'released', 'expired')),
  CONSTRAINT leonix_rewards_redemptions_context_chk
    CHECK (context_kind IN ('stripe_checkout', 'manual_payment', 'subscription_invoice')),
  -- A live hold without a deadline is a hold that never expires. Refuse it at the database.
  CONSTRAINT leonix_rewards_redemptions_live_expiry_chk
    CHECK (status <> 'reserved' OR expires_at IS NOT NULL)
);

-- The expiry sweep reads exactly this: live holds whose deadline has passed, oldest first.
CREATE INDEX IF NOT EXISTS leonix_rewards_redemptions_expiry_sweep_idx
  ON public.leonix_rewards_redemptions (expires_at)
  WHERE status = 'reserved';

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
-- 3b. UNATTRIBUTABLE REFUND RESOLUTION QUEUE
-- -----------------------------------------------------------------------------
--
-- A refund is identified by its own refund object. When a `charge.refunded` payload arrives with
-- no `charge.refunds.data` — a truncated delivery, an older API version, a manual replay — the
-- refund cannot be attributed, and reversing it under a charge-derived key was the defect that
-- once double-counted the same refunded dollars and over-charged a customer.
--
-- Refusing to reverse is correct. SILENTLY refusing is not: money went back to the customer and
-- the credits it earned are still spendable. Every such event lands here instead — durable,
-- retryable, staff-visible, and resolvable exactly once.
CREATE TABLE IF NOT EXISTS public.leonix_rewards_refund_resolutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- WHAT THE RAIL TOLD US. Kept verbatim so a human can reconcile against Stripe without
  -- trusting anything this application derived.
  payment_record_id uuid NOT NULL REFERENCES public.leonix_payment_records (id) ON DELETE RESTRICT,
  stripe_charge_id text NULL,
  stripe_event_id text NULL,
  kind text NOT NULL,
  cumulative_refunded_cents integer NOT NULL DEFAULT 0,

  status text NOT NULL DEFAULT 'open',
  attempts integer NOT NULL DEFAULT 1,
  last_attempt_at timestamptz NOT NULL DEFAULT now(),
  reason text NOT NULL,

  -- HOW IT ENDED. A resolution is an authorized staff act, so it is attributed like every other
  -- money write in this system.
  resolved_at timestamptz NULL,
  resolved_by_auth_user_id uuid NULL REFERENCES auth.users (id) ON DELETE RESTRICT,
  resolved_by_roster_id uuid NULL,
  resolution_outcome text NULL,
  resolution_note text NULL,
  -- The refund object id a human supplied, which is what makes the eventual reversal idempotent
  -- under the SAME `reverse:refund:<id>` key any later webhook would use.
  resolved_refund_external_id text NULL,
  resolved_ledger_id uuid NULL REFERENCES public.leonix_rewards_ledger (id) ON DELETE RESTRICT,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT leonix_rewards_refund_resolutions_kind_chk CHECK (kind IN ('refund', 'chargeback')),
  CONSTRAINT leonix_rewards_refund_resolutions_status_chk
    CHECK (status IN ('open', 'resolved', 'dismissed')),
  CONSTRAINT leonix_rewards_refund_resolutions_outcome_chk
    CHECK (resolution_outcome IS NULL OR resolution_outcome IN ('reversed', 'no_action_required')),
  -- A resolved row is never anonymous and never unexplained, exactly like a manual adjustment.
  CONSTRAINT leonix_rewards_refund_resolutions_resolved_chk CHECK (
    status = 'open'
    OR (resolved_at IS NOT NULL AND resolved_by_auth_user_id IS NOT NULL
        AND resolution_outcome IS NOT NULL
        AND resolution_note IS NOT NULL AND length(btrim(resolution_note)) >= 3)
  ),
  CONSTRAINT leonix_rewards_refund_resolutions_nonneg_chk
    CHECK (cumulative_refunded_cents >= 0 AND attempts >= 1)
);

-- ONE OPEN ROW PER (payment, kind, cumulative position). A redelivered webhook bumps `attempts`
-- on the existing row instead of filling the queue with duplicates of one problem.
CREATE UNIQUE INDEX IF NOT EXISTS leonix_rewards_refund_resolutions_open_idx
  ON public.leonix_rewards_refund_resolutions (payment_record_id, kind, cumulative_refunded_cents)
  WHERE status = 'open';
CREATE INDEX IF NOT EXISTS leonix_rewards_refund_resolutions_status_idx
  ON public.leonix_rewards_refund_resolutions (status, created_at DESC);

COMMENT ON TABLE public.leonix_rewards_refund_resolutions IS
  'LEONIX IX REWARDS — refund and dispute events that could not be attributed to a canonical refund object. Durable and retryable: money went back to the customer, so the credits it earned must be dealt with by a person rather than silently left spendable.';

ALTER TABLE public.leonix_rewards_refund_resolutions ENABLE ROW LEVEL SECURITY;

-- THE RESERVATION IS THE UNIT, NOT THE BUCKET.
--
-- `reserved_cents` is a single fungible number shared by every live hold on a wallet, so a commit
-- or release that merely decremented it could consume a DIFFERENT reservation's credits. An
-- adversarial review turned that into money from nothing: a commit posted against a hold that had
-- already been released took its 2000 cents out of an unrelated checkout's 3000, that checkout's
-- own commit was then refused forever, and its credits were stranded in `reserved` with no
-- operation able to free them.
--
-- The same read-then-post shape also raced the expiry sweep: commit and release each read the
-- redemption row, each posted, and only afterwards did a compare-and-set decide which had "won" —
-- after both movements had already landed.
--
-- So this locks the redemption row inside the caller's transaction, refuses unless its status
-- permits the movement, and ADVANCES that status in the same step. The money movement and the
-- state transition are one atomic act; a second delivery finds a status that no longer permits it
-- and is refused by name.
CREATE OR REPLACE FUNCTION public.leonix_rewards_claim_redemption(
  p_redemption_id uuid,
  p_wallet_id uuid,
  p_amount_cents integer,
  p_entry_type text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_redemption public.leonix_rewards_redemptions;
BEGIN
  IF p_redemption_id IS NULL THEN
    RAISE EXCEPTION 'leonix_rewards_claim_redemption: % requires a redemption id', p_entry_type
      USING ERRCODE = 'check_violation';
  END IF;
  SELECT * INTO v_redemption FROM public.leonix_rewards_redemptions
    WHERE id = p_redemption_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'leonix_rewards_claim_redemption: redemption % not found', p_redemption_id
      USING ERRCODE = 'no_data_found';
  END IF;
  IF v_redemption.wallet_id <> p_wallet_id THEN
    RAISE EXCEPTION 'leonix_rewards_claim_redemption: redemption % belongs to another wallet', p_redemption_id
      USING ERRCODE = 'check_violation';
  END IF;
  IF v_redemption.amount_cents <> p_amount_cents THEN
    RAISE EXCEPTION 'leonix_rewards_claim_redemption: % of % does not match reservation % of %',
      p_entry_type, p_amount_cents, p_redemption_id, v_redemption.amount_cents
      USING ERRCODE = 'check_violation';
  END IF;

  IF p_entry_type = 'redeem_recommit' THEN
    IF v_redemption.status NOT IN ('released', 'expired') THEN
      RAISE EXCEPTION 'leonix_rewards_claim_redemption: redemption % is % and cannot be re-debited',
        p_redemption_id, v_redemption.status
        USING ERRCODE = 'check_violation';
    END IF;
    UPDATE public.leonix_rewards_redemptions
      SET status = 'committed', updated_at = now() WHERE id = p_redemption_id;
    RETURN;
  END IF;

  IF v_redemption.status <> 'reserved' THEN
    RAISE EXCEPTION 'leonix_rewards_claim_redemption: redemption % is %, not reserved',
      p_redemption_id, v_redemption.status
      USING ERRCODE = 'check_violation';
  END IF;
  UPDATE public.leonix_rewards_redemptions
    SET status = CASE WHEN p_entry_type = 'redeem_release' THEN 'released' ELSE 'committed' END,
        updated_at = now()
    WHERE id = p_redemption_id;
END;
$$;

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
-- HARDENED SEARCH PATH. `pg_catalog` first and `pg_temp` LAST is the point: a SECURITY DEFINER
-- function that lets pg_temp be searched ahead of the catalog can be hijacked by any caller who
-- creates a temporary object shadowing a function this body calls. Every identifier below is also
-- schema-qualified, so the path is a second line of defence rather than the only one.
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_existing public.leonix_rewards_ledger;
  v_pending_delta integer := 0;
  v_available_delta integer := 0;
  v_reserved_delta integer := 0;
  v_earned_delta integer := 0;
  v_redeemed_delta integer := 0;
  v_reversed_delta integer := 0;
  v_recovery_delta integer := 0;
  v_recovery_accrued_delta integer := 0;
  v_recovery_offset_delta integer := 0;
  v_restored_delta integer := 0;
  v_offset integer := 0;
  v_cover integer := 0;
  v_draw integer := 0;
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
    RAISE EXCEPTION 'leonix_rewards_post_entry: wallet % not found', p_wallet_id
      USING ERRCODE = 'no_data_found';
  END IF;

  CASE p_entry_type
    WHEN 'earn_pending' THEN
      -- RECOVERY IS REPAID FIRST. A clawback the wallet could not cover is a debt, and the next
      -- credits this customer earns settle it before any of them become theirs to spend. Doing it
      -- here, in the same statement that posts the earn, is what makes the debt real without ever
      -- showing a negative balance or letting a redemption draw on value that is owed back.
      v_offset := LEAST(p_amount_cents, v_wallet.recovery_cents);
      v_pending_delta := p_amount_cents - v_offset;
      v_earned_delta := p_amount_cents;
      v_recovery_delta := -v_offset;
      v_recovery_offset_delta := v_offset;
    WHEN 'earn_available' THEN
      v_offset := LEAST(p_amount_cents, v_wallet.recovery_cents);
      v_available_delta := p_amount_cents - v_offset;
      v_earned_delta := p_amount_cents;
      v_recovery_delta := -v_offset;
      v_recovery_offset_delta := v_offset;
    WHEN 'earn_promote' THEN
      -- Promotion may only move credits that are actually still pending. A payment reversed
      -- between the earn and the settlement window has nothing left to promote.
      IF v_wallet.pending_cents < p_amount_cents THEN
        RAISE EXCEPTION 'leonix_rewards_post_entry: promotion of % exceeds pending % on wallet %',
          p_amount_cents, v_wallet.pending_cents, p_wallet_id
          USING ERRCODE = 'check_violation';
      END IF;
      v_pending_delta := -p_amount_cents;
      v_available_delta := p_amount_cents;
    WHEN 'redeem_reserve' THEN
      -- NO SPENDING WHILE A CLAWBACK IS OUTSTANDING. Recovery means money went back to the
      -- customer for credits they had already spent. Letting them hold a fresh discount while
      -- that debt stands would hand out the same value twice. Their next earnings repay it
      -- automatically, so this is a pause, not a penalty, and it is stated by name.
      IF v_wallet.recovery_cents > 0 THEN
        RAISE EXCEPTION 'leonix_rewards_post_entry: wallet % has an outstanding recovery balance of %',
          p_wallet_id, v_wallet.recovery_cents
          USING ERRCODE = 'check_violation';
      END IF;
      -- THE over-redemption refusal, stated explicitly rather than left to the CHECK, so the
      -- caller gets a named error instead of a generic constraint message.
      IF v_wallet.available_cents < p_amount_cents THEN
        RAISE EXCEPTION 'leonix_rewards_post_entry: redemption of % exceeds available % on wallet %',
          p_amount_cents, v_wallet.available_cents, p_wallet_id
          USING ERRCODE = 'check_violation';
      END IF;
      v_available_delta := -p_amount_cents;
      v_reserved_delta := p_amount_cents;
    WHEN 'redeem_commit' THEN
      PERFORM public.leonix_rewards_claim_redemption(p_redemption_id, p_wallet_id, p_amount_cents, 'redeem_commit');
      IF v_wallet.reserved_cents < p_amount_cents THEN
        RAISE EXCEPTION 'leonix_rewards_post_entry: commit of % exceeds reserved % on wallet %',
          p_amount_cents, v_wallet.reserved_cents, p_wallet_id
          USING ERRCODE = 'check_violation';
      END IF;
      v_reserved_delta := -p_amount_cents;
      v_redeemed_delta := p_amount_cents;
    WHEN 'redeem_release' THEN
      PERFORM public.leonix_rewards_claim_redemption(p_redemption_id, p_wallet_id, p_amount_cents, 'redeem_release');
      IF v_wallet.reserved_cents < p_amount_cents THEN
        RAISE EXCEPTION 'leonix_rewards_post_entry: release of % exceeds reserved % on wallet %',
          p_amount_cents, v_wallet.reserved_cents, p_wallet_id
          USING ERRCODE = 'check_violation';
      END IF;
      v_reserved_delta := -p_amount_cents;
      v_available_delta := p_amount_cents;
    WHEN 'redeem_recommit' THEN
      -- An EXPIRED hold, re-debited in ONE movement because the payment landed anyway. The
      -- credits are back in `available`, so that is where they come from.
      PERFORM public.leonix_rewards_claim_redemption(p_redemption_id, p_wallet_id, p_amount_cents, 'redeem_recommit');
      IF v_wallet.available_cents < p_amount_cents THEN
        RAISE EXCEPTION 'leonix_rewards_post_entry: re-debit of % exceeds available % on wallet %',
          p_amount_cents, v_wallet.available_cents, p_wallet_id
          USING ERRCODE = 'check_violation';
      END IF;
      v_available_delta := -p_amount_cents;
      v_redeemed_delta := p_amount_cents;
    WHEN 'refund_reversal', 'chargeback_reversal' THEN
      -- PENDING FIRST: take the clawback from credits that were never spendable, then from
      -- available. Reversing against pending first is what keeps a refund from consuming a
      -- balance the customer could already have spent.
      --
      -- WHAT THE WALLET CANNOT COVER BECOMES A DEBT, NOT A REFUSAL.
      --
      -- This used to refuse outright when the customer had already spent the credits. Refusing is
      -- safe for the wallet and terrible for the books: money went back to the customer and the
      -- clawback simply never happened, with no record that anything was owed. Leonix was out
      -- those credits until a human noticed.
      --
      -- Now the reversal takes everything the wallet holds — pending first, then available, the
      -- same order as before — and records the remainder as `recovery_cents`. Buckets stay
      -- non-negative, `lifetime_reversed` counts only what actually moved, and the shortfall is
      -- repaid out of future earnings before they become spendable.
      v_cover := LEAST(p_amount_cents, v_wallet.pending_cents + v_wallet.available_cents);
      IF v_wallet.pending_cents >= v_cover THEN
        v_pending_delta := -v_cover;
      ELSE
        v_pending_delta := -v_wallet.pending_cents;
        v_available_delta := -(v_cover - v_wallet.pending_cents);
      END IF;
      v_reversed_delta := v_cover;
      v_recovery_delta := p_amount_cents - v_cover;
      v_recovery_accrued_delta := p_amount_cents - v_cover;
    WHEN 'manual_adjustment' THEN
      IF p_amount_cents > 0 THEN
        -- A positive correction is spendable at once; staff have already authorized it.
        v_available_delta := p_amount_cents;
        v_earned_delta := p_amount_cents;
      ELSE
        -- EXPLICIT NEGATIVE-DRAW POLICY. A staff debit draws from AVAILABLE first and then from
        -- PENDING — the opposite order to a reversal, and deliberately so: a correction is about
        -- value the customer should not keep, and taking it from spendable value first is what
        -- stops them racing the correction by spending the balance. It can never take more than
        -- the wallet holds, so it cannot bypass the non-negative constraints; a debit larger than
        -- the whole balance is refused, and the remainder is a conversation, not a negative wallet.
        v_draw := -p_amount_cents;
        IF v_wallet.available_cents + v_wallet.pending_cents < v_draw THEN
          RAISE EXCEPTION 'leonix_rewards_post_entry: adjustment of % exceeds available % plus pending % on wallet %',
            p_amount_cents, v_wallet.available_cents, v_wallet.pending_cents, p_wallet_id
            USING ERRCODE = 'check_violation';
        END IF;
        IF v_wallet.available_cents >= v_draw THEN
          v_available_delta := -v_draw;
        ELSE
          v_available_delta := -v_wallet.available_cents;
          v_pending_delta := -(v_draw - v_wallet.available_cents);
        END IF;
        v_reversed_delta := v_draw;
      END IF;
    WHEN 'reversal_restoration' THEN
      -- A WON DISPUTE GIVES BACK EXACTLY WHAT ITS REVERSAL TOOK.
      --
      -- The ledger is append-only, so the original clawback row stands and this is a compensating
      -- movement rather than an edit. The caller has already clamped the amount to
      -- (reversed - already restored) for this payment, so restoring more than was taken is
      -- impossible before we get here; the guard below is the database saying so too.
      --
      -- A restoration repays the customer's RECOVERY DEBT first. Handing back spendable credits
      -- while they still owe the shortfall from the same clawback would give the value twice.
      IF p_amount_cents > v_wallet.lifetime_reversed_cents + v_wallet.recovery_cents
                          - v_wallet.lifetime_restored_cents THEN
        RAISE EXCEPTION 'leonix_rewards_post_entry: restoration of % exceeds what was reversed on wallet %',
          p_amount_cents, p_wallet_id
          USING ERRCODE = 'check_violation';
      END IF;
      v_offset := LEAST(p_amount_cents, v_wallet.recovery_cents);
      v_recovery_delta := -v_offset;
      v_recovery_offset_delta := v_offset;
      -- Restored credits are SPENDABLE. The money is final: the dispute is closed and won, so
      -- there is no settlement window left to wait out.
      v_available_delta := p_amount_cents - v_offset;
      v_restored_delta := p_amount_cents;
    WHEN 'recovery_accrue' THEN
      -- A debt recorded on its own, outside a reversal — a staff correction of an under-recovered
      -- position. Never touches a spendable bucket.
      v_recovery_delta := p_amount_cents;
      v_recovery_accrued_delta := p_amount_cents;
    WHEN 'recovery_offset' THEN
      -- A debt forgiven or settled outside the earnings path (staff write-off, cash repayment).
      IF v_wallet.recovery_cents < p_amount_cents THEN
        RAISE EXCEPTION 'leonix_rewards_post_entry: offset of % exceeds recovery % on wallet %',
          p_amount_cents, v_wallet.recovery_cents, p_wallet_id
          USING ERRCODE = 'check_violation';
      END IF;
      v_recovery_delta := -p_amount_cents;
      v_recovery_offset_delta := p_amount_cents;
    WHEN 'expire' THEN
      -- No launch policy emits this. It exists so expiry could be introduced later without a
      -- schema change; nothing in the application writes it, and no surface claims expiry.
      IF v_wallet.available_cents < p_amount_cents THEN
        RAISE EXCEPTION 'leonix_rewards_post_entry: expiry of % exceeds available % on wallet %',
          p_amount_cents, v_wallet.available_cents, p_wallet_id
          USING ERRCODE = 'check_violation';
      END IF;
      v_available_delta := -p_amount_cents;
      v_reversed_delta := p_amount_cents;
    ELSE
      RAISE EXCEPTION 'leonix_rewards_post_entry: unsupported entry_type %', p_entry_type
        USING ERRCODE = 'check_violation';
  END CASE;

  -- The wallet update and the ledger append are ONE unit. The sub-block exists so that a
  -- concurrent transaction which inserted this same idempotency_key between our SELECT above and
  -- our INSERT below unwinds BOTH of them and returns the winner's row, instead of aborting the
  -- caller's whole transaction with a raw 23505. Graceful recovery, not a swallowed error: the
  -- row returned is the real entry, and the balances are the winner's.
  BEGIN
    UPDATE public.leonix_rewards_wallets
    SET pending_cents = pending_cents + v_pending_delta,
        available_cents = available_cents + v_available_delta,
        reserved_cents = reserved_cents + v_reserved_delta,
        lifetime_earned_cents = lifetime_earned_cents + v_earned_delta,
        lifetime_redeemed_cents = lifetime_redeemed_cents + v_redeemed_delta,
        lifetime_reversed_cents = lifetime_reversed_cents + v_reversed_delta,
        recovery_cents = recovery_cents + v_recovery_delta,
        lifetime_recovery_accrued_cents = lifetime_recovery_accrued_cents + v_recovery_accrued_delta,
        lifetime_recovery_offset_cents = lifetime_recovery_offset_cents + v_recovery_offset_delta,
        lifetime_restored_cents = lifetime_restored_cents + v_restored_delta,
        updated_at = now()
    WHERE id = p_wallet_id
    RETURNING * INTO v_wallet;

    INSERT INTO public.leonix_rewards_ledger (
      wallet_id, entry_type, amount_cents, source_kind, source_id, payment_record_id,
      redemption_id, idempotency_key, balance_pending_after, balance_available_after,
      balance_reserved_after, reason, actor_auth_user_id, actor_roster_id, meta, entry_seq
    ) VALUES (
      p_wallet_id, p_entry_type, p_amount_cents, p_source_kind, p_source_id, p_payment_record_id,
      p_redemption_id, p_idempotency_key, v_wallet.pending_cents, v_wallet.available_cents,
      v_wallet.reserved_cents, p_reason, p_actor_auth_user_id, p_actor_roster_id, COALESCE(p_meta, '{}'::jsonb),
      -- Drawn INSIDE the wallet lock, so it records the order movements actually serialized on
      -- this wallet rather than the order their transactions started.
      nextval('public.leonix_rewards_ledger_seq')
    )
    RETURNING * INTO v_row;
  EXCEPTION
    WHEN unique_violation THEN
      SELECT * INTO v_existing
      FROM public.leonix_rewards_ledger
      WHERE idempotency_key = p_idempotency_key;
      IF FOUND THEN
        RETURN v_existing;
      END IF;
      RAISE;
  END;

  RETURN v_row;
END;
$$;

COMMENT ON FUNCTION public.leonix_rewards_post_entry IS
  'The ONLY supported way to move Leonix Credits. Idempotent on p_idempotency_key, locks the wallet row, derives bucket deltas from the entry type in SQL (so a caller cannot invent a movement), and appends the ledger row and updates the cached balances in one statement.';

-- -----------------------------------------------------------------------------
-- Rebuild a wallet's cached balances from ledger history. Reconciliation / repair only.
--
-- THIS IS A REPLAY, NOT AN AGGREGATE, AND IT HAS TO BE.
-- Two entry types are PATH-DEPENDENT: a reversal takes from pending first and only then from
-- available, and a negative manual adjustment takes from available first and only then from
-- pending. How much each one takes from which bucket depends on the balances AT THE MOMENT it was
-- posted, which no SUM(CASE ...) over the whole history can recover. An aggregate that treats a
-- reversal as a flat debit against one bucket produces a different answer from the incremental
-- path for any wallet that ever held both pending and available credits — which is every wallet
-- with a card payment and a refund.
--
-- So this function replays the entries in posting order through the SAME delta rules as
-- leonix_rewards_post_entry(), and the lifetime totals are rebuilt alongside the buckets rather
-- than left untouched at whatever the cache happened to hold.
--
-- `scripts/verify-ix-rewards-behavior-01.ts` asserts parity between the incremental balances and
-- this replay for every lifecycle it exercises.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.leonix_rewards_recompute_wallet(p_wallet_id uuid)
RETURNS public.leonix_rewards_wallets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_wallet public.leonix_rewards_wallets;
  v_entry public.leonix_rewards_ledger;
  v_pending integer := 0;
  v_available integer := 0;
  v_reserved integer := 0;
  v_earned integer := 0;
  v_redeemed integer := 0;
  v_reversed integer := 0;
  v_recovery integer := 0;
  v_recovery_accrued integer := 0;
  v_recovery_offset integer := 0;
  v_restored integer := 0;
  v_offset integer := 0;
  v_cover integer := 0;
  v_take integer := 0;
BEGIN
  SELECT * INTO v_wallet FROM public.leonix_rewards_wallets WHERE id = p_wallet_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'leonix_rewards_recompute_wallet: wallet % not found', p_wallet_id
      USING ERRCODE = 'no_data_found';
  END IF;

  -- CANONICAL POSTING ORDER.
  --
  -- `created_at` is transaction START time. Two overlapping transactions can commit in the
  -- opposite order to their timestamps, so a replay ordered by it reconstructs an intermediate
  -- state that never existed — possibly negative, in which case this function refused a ledger
  -- that was in fact consistent.
  --
  -- `entry_seq` is drawn from a sequence inside the wallet lock, so it IS the serialization order
  -- on this wallet. It sorts first; `created_at` and `id` remain only as the tie-break for rows
  -- written before the sequence existed, which keeps the order total in every case.
  FOR v_entry IN
    SELECT *
    FROM public.leonix_rewards_ledger
    WHERE wallet_id = p_wallet_id
    ORDER BY entry_seq ASC NULLS LAST, created_at ASC, id ASC
  LOOP
    CASE v_entry.entry_type
      WHEN 'reversal_restoration' THEN
        v_offset := LEAST(v_entry.amount_cents, v_recovery);
        v_recovery := v_recovery - v_offset;
        v_recovery_offset := v_recovery_offset + v_offset;
        v_available := v_available + (v_entry.amount_cents - v_offset);
        v_restored := v_restored + v_entry.amount_cents;
      WHEN 'recovery_accrue' THEN
        v_recovery := v_recovery + v_entry.amount_cents;
        v_recovery_accrued := v_recovery_accrued + v_entry.amount_cents;
      WHEN 'recovery_offset' THEN
        v_recovery := v_recovery - v_entry.amount_cents;
        v_recovery_offset := v_recovery_offset + v_entry.amount_cents;
      WHEN 'earn_pending' THEN
        -- Recovery is repaid before anything becomes the customer's to spend, exactly as the
        -- posting rule does it. Replaying without this would rebuild a wallet that never existed.
        v_offset := LEAST(v_entry.amount_cents, v_recovery);
        v_recovery := v_recovery - v_offset;
        v_recovery_offset := v_recovery_offset + v_offset;
        v_pending := v_pending + (v_entry.amount_cents - v_offset);
        v_earned := v_earned + v_entry.amount_cents;
      WHEN 'earn_promote' THEN
        v_pending := v_pending - v_entry.amount_cents;
        v_available := v_available + v_entry.amount_cents;
      WHEN 'earn_available' THEN
        v_offset := LEAST(v_entry.amount_cents, v_recovery);
        v_recovery := v_recovery - v_offset;
        v_recovery_offset := v_recovery_offset + v_offset;
        v_available := v_available + (v_entry.amount_cents - v_offset);
        v_earned := v_earned + v_entry.amount_cents;
      WHEN 'redeem_reserve' THEN
        v_available := v_available - v_entry.amount_cents;
        v_reserved := v_reserved + v_entry.amount_cents;
      WHEN 'redeem_commit' THEN
        v_reserved := v_reserved - v_entry.amount_cents;
        v_redeemed := v_redeemed + v_entry.amount_cents;
      WHEN 'redeem_release' THEN
        v_reserved := v_reserved - v_entry.amount_cents;
        v_available := v_available + v_entry.amount_cents;
      WHEN 'redeem_recommit' THEN
        -- One movement, available -> spent. The replay has to mirror the posting rule exactly or
        -- reconciliation would report a false drift on every re-debited hold.
        v_available := v_available - v_entry.amount_cents;
        v_redeemed := v_redeemed + v_entry.amount_cents;
      WHEN 'refund_reversal', 'chargeback_reversal' THEN
        -- Pending first, then available — the posting rule, replayed against the balances as they
        -- stood at this point in the history. `amount_cents` is what the reversal ACTUALLY moved,
        -- so a clawback that outran the wallet is replayed as the partial movement it was; the
        -- shortfall it recorded is carried by its own `recovery_accrue` entry, not re-derived
        -- here. Deriving it twice would double the debt on every recomputation.
        v_cover := LEAST(v_entry.amount_cents, v_pending + v_available);
        IF v_pending >= v_cover THEN
          v_pending := v_pending - v_cover;
        ELSE
          v_available := v_available - (v_cover - v_pending);
          v_pending := 0;
        END IF;
        v_reversed := v_reversed + v_cover;
      WHEN 'manual_adjustment' THEN
        IF v_entry.amount_cents > 0 THEN
          v_available := v_available + v_entry.amount_cents;
          v_earned := v_earned + v_entry.amount_cents;
        ELSE
          -- Available first, then pending — again the posting rule, not a guess.
          v_take := -v_entry.amount_cents;
          IF v_available >= v_take THEN
            v_available := v_available - v_take;
          ELSE
            v_pending := v_pending - (v_take - v_available);
            v_available := 0;
          END IF;
          v_reversed := v_reversed + v_take;
        END IF;
      WHEN 'expire' THEN
        v_available := v_available - v_entry.amount_cents;
        v_reversed := v_reversed + v_entry.amount_cents;
      ELSE
        RAISE EXCEPTION 'leonix_rewards_recompute_wallet: unsupported entry_type % on entry %',
          v_entry.entry_type, v_entry.id
          USING ERRCODE = 'check_violation';
    END CASE;
  END LOOP;

  -- A replay that lands on a negative bucket means the LEDGER is inconsistent, not the cache.
  -- Refusing here is the point: writing a negative balance would violate the wallet CHECKs anyway,
  -- and silently clamping would hide a real accounting defect behind a plausible number.
  IF v_pending < 0 OR v_available < 0 OR v_reserved < 0 OR v_recovery < 0 THEN
    RAISE EXCEPTION 'leonix_rewards_recompute_wallet: wallet % replays to a negative bucket (pending %, available %, reserved %, recovery %); the ledger is inconsistent',
      p_wallet_id, v_pending, v_available, v_reserved, v_recovery
      USING ERRCODE = 'check_violation';
  END IF;

  UPDATE public.leonix_rewards_wallets
  SET pending_cents = v_pending,
      available_cents = v_available,
      reserved_cents = v_reserved,
      lifetime_earned_cents = v_earned,
      lifetime_redeemed_cents = v_redeemed,
      lifetime_reversed_cents = v_reversed,
      recovery_cents = v_recovery,
      lifetime_recovery_accrued_cents = v_recovery_accrued,
      lifetime_recovery_offset_cents = v_recovery_offset,
      lifetime_restored_cents = v_restored,
      updated_at = now()
  WHERE id = p_wallet_id
  RETURNING * INTO v_wallet;

  RETURN v_wallet;
END;
$$;

COMMENT ON FUNCTION public.leonix_rewards_recompute_wallet IS
  'Rebuilds a wallet''s cached buckets and lifetime totals by REPLAYING leonix_rewards_ledger in posting order through the same delta rules as leonix_rewards_post_entry(). A replay, not an aggregate, because reversals (pending-first) and negative manual adjustments (available-first) are path-dependent. Refuses rather than clamps if the history replays to a negative bucket.';

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
--
-- REVOKE FIRST, THEN GRANT EXPLICITLY. Postgres grants EXECUTE to PUBLIC on a new function by
-- default, so the revoke is what actually closes the door; the grant that follows names the one
-- role allowed through it. Leaving the grant implicit would mean the function's reachability
-- depended on a default nobody in this file stated.
REVOKE ALL ON FUNCTION public.leonix_rewards_post_entry(
  uuid, text, integer, text, text, text, uuid, uuid, text, uuid, uuid, jsonb
) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.leonix_rewards_recompute_wallet(uuid) FROM PUBLIC, anon, authenticated;
-- The reservation claim is a money-adjacent state transition (it commits or releases a hold), so
-- it is locked down exactly like the posting function. It is only ever called from inside
-- `leonix_rewards_post_entry`, which runs as its owner, so no role needs EXECUTE on it directly.
REVOKE ALL ON FUNCTION public.leonix_rewards_claim_redemption(uuid, uuid, integer, text)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.leonix_rewards_post_entry(
  uuid, text, integer, text, text, text, uuid, uuid, text, uuid, uuid, jsonb
) TO service_role;
GRANT EXECUTE ON FUNCTION public.leonix_rewards_recompute_wallet(uuid) TO service_role;

-- The tables themselves: readable under the SELECT policies above, never writable from a browser
-- session. service_role bypasses RLS, so this grant is what the server writes through.
REVOKE ALL ON TABLE public.leonix_rewards_wallets FROM anon;
REVOKE ALL ON TABLE public.leonix_rewards_ledger FROM anon;
REVOKE ALL ON TABLE public.leonix_rewards_redemptions FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.leonix_rewards_wallets FROM authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.leonix_rewards_ledger FROM authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.leonix_rewards_redemptions FROM authenticated;
GRANT SELECT ON TABLE public.leonix_rewards_wallets TO authenticated;
GRANT SELECT ON TABLE public.leonix_rewards_ledger TO authenticated;
GRANT SELECT ON TABLE public.leonix_rewards_redemptions TO authenticated;
GRANT ALL ON TABLE public.leonix_rewards_wallets TO service_role;
GRANT ALL ON TABLE public.leonix_rewards_ledger TO service_role;
GRANT ALL ON TABLE public.leonix_rewards_redemptions TO service_role;

-- The refund resolution queue is STAFF-ONLY. It names payment records, charge ids and refunded
-- amounts for customers other than the reader, so unlike the wallet tables there is no
-- customer-facing SELECT policy and no `authenticated` grant of any kind: it is reached solely
-- through the service-role staff API, behind the same authorization as every other money screen.
REVOKE ALL ON TABLE public.leonix_rewards_refund_resolutions FROM anon, authenticated;
GRANT ALL ON TABLE public.leonix_rewards_refund_resolutions TO service_role;

-- The ledger sequence must not be advanced from a browser session either: burning sequence values
-- is not a money movement, but it is not a browser's business.
REVOKE ALL ON SEQUENCE public.leonix_rewards_ledger_seq FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SEQUENCE public.leonix_rewards_ledger_seq TO service_role;

COMMIT;
