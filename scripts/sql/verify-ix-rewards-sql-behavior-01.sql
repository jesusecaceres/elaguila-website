-- =============================================================================
-- LEONIX IX REWARDS — BEHAVIOURAL proof of the SQL money engine.
--
-- WHY THIS FILE EXISTS. Every other check on this migration reads its TEXT. A grep cannot tell
-- whether `leonix_rewards_post_entry` actually refuses an over-redemption, whether the wallet lock
-- actually serializes two callers, or whether `leonix_rewards_recompute_wallet` actually replays to
-- the balance the incremental path produced. Those are the guarantees the money rests on, and they
-- are PL/pgSQL, so only PL/pgSQL can demonstrate them.
--
-- Run against a THROWAWAY local cluster only, via `scripts/verify-ix-rewards-sql-behavior-01.sh`.
-- It creates its own database, applies the migration unmodified, and drops everything afterwards.
-- It never touches a remote project, and the migration is never applied anywhere that matters.
--
-- Every test RAISES on failure, so a non-zero psql exit is the result.
-- =============================================================================
\set ON_ERROR_STOP on
SET client_min_messages = warning;

-- The assertion counter. A harness that silently stops asserting is worse than no harness, so the
-- final line reports how many assertions actually ran and the runner pins a floor under it.
CREATE TABLE pg_temp.assertions (name text NOT NULL, ran_at timestamptz NOT NULL DEFAULT clock_timestamp());

CREATE OR REPLACE FUNCTION pg_temp.ok(p_condition boolean, p_name text) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  IF NOT p_condition THEN RAISE EXCEPTION 'FAILED: %', p_name; END IF;
  INSERT INTO pg_temp.assertions (name) VALUES (p_name);
END $$;

/** Assert that a statement raises, and that the message matches. */
CREATE OR REPLACE FUNCTION pg_temp.raises(p_sql text, p_match text, p_name text) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE v_msg text;
BEGIN
  BEGIN
    EXECUTE p_sql;
  EXCEPTION WHEN OTHERS THEN
    v_msg := SQLERRM;
    IF position(p_match in v_msg) = 0 THEN
      RAISE EXCEPTION 'FAILED: % — raised "%" which does not contain "%"', p_name, v_msg, p_match;
    END IF;
    INSERT INTO pg_temp.assertions (name) VALUES (p_name);
    RETURN;
  END;
  RAISE EXCEPTION 'FAILED: % — the statement was ACCEPTED when it had to be refused', p_name;
END $$;

CREATE OR REPLACE FUNCTION pg_temp.new_payment() RETURNS uuid LANGUAGE sql AS
$$ INSERT INTO public.leonix_payment_records DEFAULT VALUES RETURNING id $$;

/** A real auth user, because a staff correction is never anonymous and the FK says so. */
CREATE OR REPLACE FUNCTION pg_temp.actor() RETURNS uuid LANGUAGE sql AS
$$ INSERT INTO auth.users DEFAULT VALUES RETURNING id $$;

CREATE OR REPLACE FUNCTION pg_temp.new_wallet() RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE v_business uuid; v_wallet uuid;
BEGIN
  INSERT INTO public.businesses DEFAULT VALUES RETURNING id INTO v_business;
  INSERT INTO public.leonix_rewards_wallets (business_id) VALUES (v_business) RETURNING id INTO v_wallet;
  RETURN v_wallet;
END $$;

-- ---------------------------------------------------------------------------
-- S1. IDEMPOTENCY: the same external event moves money exactly once.
-- ---------------------------------------------------------------------------
DO $$
DECLARE w uuid; p uuid; a uuid; b uuid; v public.leonix_rewards_wallets;
BEGIN
  w := pg_temp.new_wallet(); p := pg_temp.new_payment();
  SELECT id INTO a FROM public.leonix_rewards_post_entry(w,'earn_available',900,'stripe_payment','earn:'||p, NULL, p);
  SELECT id INTO b FROM public.leonix_rewards_post_entry(w,'earn_available',900,'stripe_payment','earn:'||p, NULL, p);
  PERFORM pg_temp.ok(a = b, 'S1 a replayed event returns the original ledger row');
  SELECT * INTO v FROM public.leonix_rewards_wallets WHERE id = w;
  PERFORM pg_temp.ok(v.available_cents = 900, 'S1 and moves the credits exactly once');
  PERFORM pg_temp.ok((SELECT count(*) FROM public.leonix_rewards_ledger WHERE wallet_id = w) = 1, 'S1 one row, not two');
END $$;

-- ---------------------------------------------------------------------------
-- S2. NON-NEGATIVE BUCKETS: over-redemption, over-promotion, over-offset are REFUSED.
-- ---------------------------------------------------------------------------
DO $$
DECLARE w uuid; p uuid;
BEGIN
  w := pg_temp.new_wallet(); p := pg_temp.new_payment();
  PERFORM public.leonix_rewards_post_entry(w,'earn_available',500,'stripe_payment','e2:'||p, NULL, p);
  PERFORM pg_temp.raises(
    format('SELECT public.leonix_rewards_post_entry(%L,''redeem_reserve'',600,''checkout_redemption'',''r2'')', w),
    'exceeds available', 'S2 a redemption larger than the balance is refused by name');
  PERFORM pg_temp.raises(
    format('SELECT public.leonix_rewards_post_entry(%L,''earn_promote'',100,''stripe_payment'',''pr2'')', w),
    'exceeds pending', 'S2 a promotion with nothing pending is refused');
  PERFORM pg_temp.raises(
    format('SELECT public.leonix_rewards_post_entry(%L,''recovery_offset'',100,''staff_adjustment'',''ro2'')', w),
    'exceeds recovery', 'S2 repaying a debt that does not exist is refused');
  PERFORM pg_temp.raises(
    format('SELECT public.leonix_rewards_post_entry(%L,''manual_adjustment'',-600,''staff_adjustment'',''ma2'',NULL,NULL,NULL,''correction'',%L)', w, pg_temp.actor()),
    'exceeds available', 'S2 a staff debit larger than the whole balance is refused');
END $$;

-- ---------------------------------------------------------------------------
-- S3. REVERSAL: pending first, then available, and the remainder becomes DEBT — not a refusal.
-- ---------------------------------------------------------------------------
DO $$
DECLARE w uuid; p1 uuid; p2 uuid; v public.leonix_rewards_wallets;
BEGIN
  w := pg_temp.new_wallet(); p1 := pg_temp.new_payment(); p2 := pg_temp.new_payment();
  PERFORM public.leonix_rewards_post_entry(w,'earn_pending',300,'stripe_payment','e3a:'||p1, NULL, p1);
  PERFORM public.leonix_rewards_post_entry(w,'earn_available',700,'manual_payment','e3b:'||p2, NULL, p2);
  -- Reverse p2 in full: 700. Pending (300, belonging to p1) is taken first, then 400 of available.
  PERFORM public.leonix_rewards_post_entry(w,'refund_reversal',700,'stripe_refund','rev3','re_3',p2);
  SELECT * INTO v FROM public.leonix_rewards_wallets WHERE id = w;
  PERFORM pg_temp.ok(v.pending_cents = 0, 'S3 pending is taken first');
  PERFORM pg_temp.ok(v.available_cents = 300, 'S3 then available');
  PERFORM pg_temp.ok(v.lifetime_reversed_cents = 700, 'S3 and the whole clawback is recorded as moved');
  PERFORM pg_temp.ok(v.recovery_cents = 0, 'S3 with no debt, because the wallet could cover it');
END $$;

DO $$
DECLARE w uuid; p uuid; v public.leonix_rewards_wallets;
BEGIN
  w := pg_temp.new_wallet(); p := pg_temp.new_payment();
  PERFORM public.leonix_rewards_post_entry(w,'earn_available',900,'stripe_payment','e3c:'||p, NULL, p);
  -- Spend it all.
  PERFORM public.leonix_rewards_post_entry(w,'manual_adjustment',-900,'staff_adjustment','sp3',NULL,NULL,NULL,'spent',pg_temp.actor());
  PERFORM public.leonix_rewards_post_entry(w,'refund_reversal',900,'stripe_refund','rev3b','re_3b',p);
  SELECT * INTO v FROM public.leonix_rewards_wallets WHERE id = w;
  PERFORM pg_temp.ok(v.available_cents = 0 AND v.pending_cents = 0, 'S3 buckets stay non-negative when the credits were already spent');
  PERFORM pg_temp.ok(v.recovery_cents = 900, 'S3 and the shortfall becomes recovery debt');
  PERFORM pg_temp.ok(v.lifetime_recovery_accrued_cents = 900, 'S3 recorded as accrued');
  -- No spending while a clawback is outstanding.
  PERFORM pg_temp.raises(
    format('SELECT public.leonix_rewards_post_entry(%L,''redeem_reserve'',10,''checkout_redemption'',''rr3'')', w),
    'outstanding recovery balance', 'S3 redemption is blocked while the debt stands');
  -- Future earnings repay it BEFORE becoming spendable.
  PERFORM public.leonix_rewards_post_entry(w,'earn_available',1000,'stripe_payment','e3d', NULL, pg_temp.new_payment());
  SELECT * INTO v FROM public.leonix_rewards_wallets WHERE id = w;
  PERFORM pg_temp.ok(v.recovery_cents = 0, 'S3 the next earnings settle the debt first');
  PERFORM pg_temp.ok(v.available_cents = 100, 'S3 and only the remainder becomes spendable');
END $$;

-- ---------------------------------------------------------------------------
-- S4. THE PAYMENT-SCOPED CEILING — a payment can never give back more than it awarded.
-- ---------------------------------------------------------------------------
DO $$
DECLARE w uuid; p uuid;
BEGIN
  w := pg_temp.new_wallet(); p := pg_temp.new_payment();
  PERFORM public.leonix_rewards_post_entry(w,'earn_available',900,'stripe_payment','e4:'||p, NULL, p);
  PERFORM public.leonix_rewards_post_entry(w,'refund_reversal',450,'stripe_refund','rev4a','re_4a',p);
  PERFORM pg_temp.raises(
    format('SELECT public.leonix_rewards_post_entry(%L,''refund_reversal'',500,''stripe_refund'',''rev4b'',''re_4b'',%L)', w, p),
    'leonix_rewards_position_moved', 'S4 a second reversal beyond the award is refused');
  -- Exactly the remainder is accepted.
  PERFORM public.leonix_rewards_post_entry(w,'refund_reversal',450,'stripe_refund','rev4c','re_4c',p);
  PERFORM pg_temp.ok(
    (SELECT COALESCE(SUM(amount_cents),0) FROM public.leonix_rewards_ledger
      WHERE payment_record_id = p AND entry_type = 'refund_reversal') = 900,
    'S4 and the remainder is');
  PERFORM pg_temp.raises(
    format('SELECT public.leonix_rewards_post_entry(%L,''refund_reversal'',1,''stripe_refund'',''rev4d'',''re_4d'',%L)', w, p),
    'leonix_rewards_position_moved', 'S4 not one cent more');
  -- A reversal with no payment at all cannot dodge the ceiling.
  PERFORM pg_temp.raises(
    format('SELECT public.leonix_rewards_post_entry(%L,''refund_reversal'',100,''stripe_refund'',''rev4e'')', w),
    'requires a payment_record_id', 'S4 the ceiling cannot be skipped by omitting the payment');
END $$;

-- ---------------------------------------------------------------------------
-- S5. RESTORATION BOUNDS — kind, payment and the individual dispute.
-- ---------------------------------------------------------------------------
DO $$
DECLARE w uuid; p uuid; v public.leonix_rewards_wallets;
BEGIN
  w := pg_temp.new_wallet(); p := pg_temp.new_payment();
  PERFORM public.leonix_rewards_post_entry(w,'earn_available',900,'stripe_payment','e5:'||p, NULL, p);
  -- TWO partial disputes, 450 each.
  PERFORM public.leonix_rewards_post_entry(w,'chargeback_reversal',450,'stripe_dispute','cb5a','dp_5a',p);
  PERFORM public.leonix_rewards_post_entry(w,'chargeback_reversal',450,'stripe_dispute','cb5b','dp_5b',p);
  -- Dispute A is won. It may give back 450 — never the 900 the payment lost in total.
  PERFORM pg_temp.raises(
    format('SELECT public.leonix_rewards_post_entry(%L,''reversal_restoration'',900,''stripe_dispute'',''res5a'',''dp_5a'',%L)', w, p),
    'dispute dp_5a took', 'S5 a won dispute cannot restore the OTHER dispute''s clawback');
  PERFORM public.leonix_rewards_post_entry(w,'reversal_restoration',450,'stripe_dispute','res5a','dp_5a',p);
  SELECT * INTO v FROM public.leonix_rewards_wallets WHERE id = w;
  PERFORM pg_temp.ok(v.available_cents = 450, 'S5 it restores exactly its own');
  PERFORM pg_temp.ok(v.lifetime_restored_cents = 450, 'S5 recorded as restored, not as earning');
  PERFORM pg_temp.ok(v.lifetime_earned_cents = 900, 'S5 lifetime earnings are unchanged by a restoration');
  -- A dispute that never took anything restores nothing.
  PERFORM pg_temp.raises(
    format('SELECT public.leonix_rewards_post_entry(%L,''reversal_restoration'',450,''stripe_dispute'',''res5z'',''dp_never'',%L)', w, p),
    'dispute dp_never took', 'S5 an unknown dispute restores nothing');
  -- A restoration with no dispute id cannot dodge the per-dispute bound.
  PERFORM pg_temp.raises(
    format('SELECT public.leonix_rewards_post_entry(%L,''reversal_restoration'',450,''stripe_dispute'',''res5y'',NULL,%L)', w, p),
    'requires the dispute id', 'S5 the per-dispute bound cannot be skipped by omitting the dispute');
  -- A restoration with no payment cannot dodge the payment-scoped bound.
  PERFORM pg_temp.raises(
    format('SELECT public.leonix_rewards_post_entry(%L,''reversal_restoration'',450,''stripe_dispute'',''res5x'',''dp_5b'')', w),
    'requires a payment_record_id', 'S5 nor by omitting the payment');
END $$;

-- A REFUND'S clawback can never be restored by a dispute.
DO $$
DECLARE w uuid; p uuid;
BEGIN
  w := pg_temp.new_wallet(); p := pg_temp.new_payment();
  PERFORM public.leonix_rewards_post_entry(w,'earn_available',900,'stripe_payment','e5b:'||p, NULL, p);
  PERFORM public.leonix_rewards_post_entry(w,'refund_reversal',900,'stripe_refund','rev5b','re_5b',p);
  PERFORM pg_temp.raises(
    format('SELECT public.leonix_rewards_post_entry(%L,''reversal_restoration'',900,''stripe_dispute'',''res5b'',''re_5b'',%L)', w, p),
    'took', 'S5 a refund''s clawback cannot be restored by a dispute');
END $$;

-- ---------------------------------------------------------------------------
-- S6. THE COMPARE-AND-SWAP — a delta computed against a stale position is refused.
-- ---------------------------------------------------------------------------
DO $$
DECLARE w uuid; p uuid;
BEGIN
  w := pg_temp.new_wallet(); p := pg_temp.new_payment();
  PERFORM public.leonix_rewards_post_entry(w,'earn_available',900,'stripe_payment','e6:'||p, NULL, p);
  -- A caller that measured an empty position is correct, and accepted.
  PERFORM public.leonix_rewards_post_entry(w,'refund_reversal',225,'stripe_refund','rev6a','re_6a',p,
    NULL,NULL,NULL,NULL,'{}'::jsonb, 0);
  -- A SECOND caller that also measured an empty position is stale, and refused — even though its
  -- amount is comfortably under the payment's remaining award.
  PERFORM pg_temp.raises(
    format('SELECT public.leonix_rewards_post_entry(%L,''refund_reversal'',225,''stripe_refund'',''rev6b'',''re_6b'',%L,NULL,NULL,NULL,NULL,''{}''::jsonb,0)', w, p),
    'leonix_rewards_position_moved', 'S6 a delta computed against a position that has since moved is refused');
  -- Recomputed against the position that now exists, it is accepted.
  PERFORM public.leonix_rewards_post_entry(w,'refund_reversal',225,'stripe_refund','rev6b','re_6b',p,
    NULL,NULL,NULL,NULL,'{}'::jsonb, 1);
  PERFORM pg_temp.ok(
    (SELECT COALESCE(SUM(amount_cents),0) FROM public.leonix_rewards_ledger
      WHERE payment_record_id = p AND entry_type='refund_reversal') = 450,
    'S6 and the total is exactly what the two events were owed');
END $$;

-- ---------------------------------------------------------------------------
-- S7. THE REDEMPTION LIFECYCLE — the row's status gates the money, atomically.
-- ---------------------------------------------------------------------------
DO $$
DECLARE w uuid; p uuid; r uuid; v public.leonix_rewards_wallets;
BEGIN
  w := pg_temp.new_wallet(); p := pg_temp.new_payment();
  PERFORM public.leonix_rewards_post_entry(w,'earn_available',5000,'stripe_payment','e7:'||p, NULL, p);
  INSERT INTO public.leonix_rewards_redemptions (wallet_id, amount_cents, idempotency_key, expires_at)
    VALUES (w, 2000, 'reserve:ref7', now() + interval '30 minutes') RETURNING id INTO r;
  PERFORM public.leonix_rewards_post_entry(w,'redeem_reserve',2000,'checkout_redemption','reserve:ref7',NULL,NULL,r);
  SELECT * INTO v FROM public.leonix_rewards_wallets WHERE id = w;
  PERFORM pg_temp.ok(v.available_cents = 3000 AND v.reserved_cents = 2000, 'S7 a reserve moves available into reserved');

  PERFORM public.leonix_rewards_post_entry(w,'redeem_commit',2000,'checkout_redemption','commit:ref7',NULL,NULL,r);
  SELECT * INTO v FROM public.leonix_rewards_wallets WHERE id = w;
  PERFORM pg_temp.ok(v.reserved_cents = 0 AND v.lifetime_redeemed_cents = 2000, 'S7 a commit spends it');
  PERFORM pg_temp.ok((SELECT status FROM public.leonix_rewards_redemptions WHERE id = r) = 'committed',
    'S7 and advances the row in the same statement');

  -- A LATE RELEASE CANNOT UNDO A COMMIT. This is the movement that once produced money from
  -- nothing by decrementing a bucket every live hold shares.
  PERFORM pg_temp.raises(
    format('SELECT public.leonix_rewards_post_entry(%L,''redeem_release'',2000,''checkout_redemption'',''release:ref7'',NULL,NULL,%L)', w, r),
    'not reserved', 'S7 a release arriving after the commit is refused by name');
  -- A commit against someone else's reservation, or for the wrong amount, is refused too.
  PERFORM pg_temp.raises(
    format('SELECT public.leonix_rewards_post_entry(%L,''redeem_commit'',1999,''checkout_redemption'',''commit:wrong'',NULL,NULL,%L)', w, r),
    'does not match reservation', 'S7 a commit whose amount disagrees with the hold is refused');
  PERFORM pg_temp.raises(
    format('SELECT public.leonix_rewards_post_entry(%L,''redeem_commit'',2000,''checkout_redemption'',''commit:noref'')', w),
    'requires a redemption id', 'S7 and a commit with no hold at all is refused');
  SELECT * INTO v FROM public.leonix_rewards_wallets WHERE id = w;
  PERFORM pg_temp.ok(v.available_cents = 3000 AND v.reserved_cents = 0, 'S7 none of the refusals moved a cent');
END $$;

-- An EXPIRED hold re-debited at commit is ONE movement out of available.
DO $$
DECLARE w uuid; p uuid; r uuid; v public.leonix_rewards_wallets;
BEGIN
  w := pg_temp.new_wallet(); p := pg_temp.new_payment();
  PERFORM public.leonix_rewards_post_entry(w,'earn_available',5000,'stripe_payment','e7b:'||p, NULL, p);
  INSERT INTO public.leonix_rewards_redemptions (wallet_id, amount_cents, idempotency_key, expires_at)
    VALUES (w, 2000, 'reserve:ref7b', now() - interval '1 minute') RETURNING id INTO r;
  PERFORM public.leonix_rewards_post_entry(w,'redeem_reserve',2000,'checkout_redemption','reserve:ref7b',NULL,NULL,r);
  PERFORM public.leonix_rewards_post_entry(w,'redeem_release',2000,'checkout_redemption','release:ref7b',NULL,NULL,r);
  UPDATE public.leonix_rewards_redemptions SET status='expired' WHERE id = r;
  PERFORM public.leonix_rewards_post_entry(w,'redeem_recommit',2000,'checkout_redemption','recommit:ref7b',NULL,NULL,r);
  SELECT * INTO v FROM public.leonix_rewards_wallets WHERE id = w;
  PERFORM pg_temp.ok(v.available_cents = 3000 AND v.reserved_cents = 0 AND v.lifetime_redeemed_cents = 2000,
    'S7 an expired hold is re-debited out of available, once');
  PERFORM pg_temp.raises(
    format('SELECT public.leonix_rewards_post_entry(%L,''redeem_recommit'',2000,''checkout_redemption'',''recommit:again'',NULL,NULL,%L)', w, r),
    'cannot be re-debited', 'S7 and a committed hold cannot be re-debited again');
END $$;

-- ---------------------------------------------------------------------------
-- S8. REPLAY PARITY — recompute lands on exactly the incremental balances.
-- ---------------------------------------------------------------------------
DO $$
DECLARE w uuid; p1 uuid; p2 uuid; r uuid; live public.leonix_rewards_wallets; replayed public.leonix_rewards_wallets;
BEGIN
  w := pg_temp.new_wallet(); p1 := pg_temp.new_payment(); p2 := pg_temp.new_payment();
  PERFORM public.leonix_rewards_post_entry(w,'earn_pending',900,'stripe_payment','e8a:'||p1,NULL,p1);
  PERFORM public.leonix_rewards_post_entry(w,'earn_available',1800,'manual_payment','e8b:'||p2,NULL,p2);
  PERFORM public.leonix_rewards_post_entry(w,'earn_promote',400,'stripe_payment','e8c:'||p1,NULL,p1);
  INSERT INTO public.leonix_rewards_redemptions (wallet_id, amount_cents, idempotency_key, expires_at)
    VALUES (w, 1000, 'reserve:ref8', now() + interval '30 minutes') RETURNING id INTO r;
  PERFORM public.leonix_rewards_post_entry(w,'redeem_reserve',1000,'checkout_redemption','reserve:ref8',NULL,NULL,r);
  PERFORM public.leonix_rewards_post_entry(w,'redeem_commit',1000,'checkout_redemption','commit:ref8',NULL,NULL,r);
  PERFORM public.leonix_rewards_post_entry(w,'manual_adjustment',-100,'staff_adjustment','ma8',NULL,NULL,NULL,'correction',pg_temp.actor());
  PERFORM public.leonix_rewards_post_entry(w,'chargeback_reversal',1800,'stripe_dispute','cb8','dp_8',p2);
  PERFORM public.leonix_rewards_post_entry(w,'reversal_restoration',900,'stripe_dispute','res8','dp_8',p2);

  SELECT * INTO live FROM public.leonix_rewards_wallets WHERE id = w;
  SELECT * INTO replayed FROM public.leonix_rewards_recompute_wallet(w);
  PERFORM pg_temp.ok(live.pending_cents = replayed.pending_cents, 'S8 replay reproduces pending');
  PERFORM pg_temp.ok(live.available_cents = replayed.available_cents, 'S8 replay reproduces available');
  PERFORM pg_temp.ok(live.reserved_cents = replayed.reserved_cents, 'S8 replay reproduces reserved');
  PERFORM pg_temp.ok(live.recovery_cents = replayed.recovery_cents, 'S8 replay reproduces the recovery debt');
  PERFORM pg_temp.ok(live.lifetime_earned_cents = replayed.lifetime_earned_cents, 'S8 replay reproduces lifetime earned');
  PERFORM pg_temp.ok(live.lifetime_redeemed_cents = replayed.lifetime_redeemed_cents, 'S8 replay reproduces lifetime redeemed');
  PERFORM pg_temp.ok(live.lifetime_reversed_cents = replayed.lifetime_reversed_cents, 'S8 replay reproduces lifetime reversed');
  PERFORM pg_temp.ok(live.lifetime_restored_cents = replayed.lifetime_restored_cents, 'S8 replay reproduces lifetime restored');
  PERFORM pg_temp.ok(live.lifetime_recovery_accrued_cents = replayed.lifetime_recovery_accrued_cents, 'S8 replay reproduces accrued debt');
  PERFORM pg_temp.ok(live.lifetime_recovery_offset_cents = replayed.lifetime_recovery_offset_cents, 'S8 replay reproduces repaid debt');
END $$;

-- AN EARN THAT LANDS ON AN OUTSTANDING DEBT. The posting arm repays the debt BEFORE any of the
-- credits become the customer's, and the replay must do the same. A mutation run proved this case
-- was missing: changing the replay's `earn_pending` arm to credit the full amount while still
-- discharging the debt left every assertion green, and that is not cosmetic — a zero
-- `recovery_cents` also lifts the redemption block, so one reconciliation call would hand the
-- customer back credits they owed and let them spend them.
DO $$
DECLARE w uuid; p uuid; live public.leonix_rewards_wallets; replayed public.leonix_rewards_wallets;
BEGIN
  w := pg_temp.new_wallet(); p := pg_temp.new_payment();
  PERFORM public.leonix_rewards_post_entry(w,'earn_available',900,'stripe_payment','e8d:'||p,NULL,p);
  -- Spend it, then refund the payment: the clawback cannot be covered and becomes debt.
  PERFORM public.leonix_rewards_post_entry(w,'manual_adjustment',-900,'staff_adjustment','ma8d',NULL,NULL,NULL,'spent',pg_temp.actor());
  PERFORM public.leonix_rewards_post_entry(w,'refund_reversal',900,'stripe_refund','rev8d','re_8d',p);
  PERFORM pg_temp.ok((SELECT recovery_cents FROM public.leonix_rewards_wallets WHERE id = w) = 900,
    'S8 a clawback the wallet could not cover is a debt');
  -- Now two further earns land on that debt: one pending, one available.
  PERFORM public.leonix_rewards_post_entry(w,'earn_pending',500,'stripe_payment','e8e',NULL,pg_temp.new_payment());
  PERFORM public.leonix_rewards_post_entry(w,'earn_available',700,'manual_payment','e8f',NULL,pg_temp.new_payment());
  SELECT * INTO live FROM public.leonix_rewards_wallets WHERE id = w;
  PERFORM pg_temp.ok(live.recovery_cents = 0, 'S8 and the next earnings settle it first');
  PERFORM pg_temp.ok(live.pending_cents = 0, 'S8 the pending earn went entirely to the debt');
  PERFORM pg_temp.ok(live.available_cents = 300, 'S8 and only the remainder is spendable');
  SELECT * INTO replayed FROM public.leonix_rewards_recompute_wallet(w);
  PERFORM pg_temp.ok(live.pending_cents = replayed.pending_cents, 'S8 the replay repays the debt from pending too');
  PERFORM pg_temp.ok(live.available_cents = replayed.available_cents, 'S8 and from available');
  PERFORM pg_temp.ok(live.recovery_cents = replayed.recovery_cents, 'S8 landing on the same debt');
  PERFORM pg_temp.ok(live.lifetime_recovery_offset_cents = replayed.lifetime_recovery_offset_cents,
    'S8 and recording the same repayment');
END $$;

-- ORDER IS THE SEQUENCE, NOT THE CLOCK. Every entry below shares one created_at; the replay must
-- still reproduce the incremental balances, which it can only do by following entry_seq.
DO $$
DECLARE w uuid; p uuid; live public.leonix_rewards_wallets; replayed public.leonix_rewards_wallets; n integer;
BEGIN
  w := pg_temp.new_wallet(); p := pg_temp.new_payment();
  PERFORM public.leonix_rewards_post_entry(w,'earn_pending',2000,'stripe_payment','e9a:'||p,NULL,p);
  PERFORM public.leonix_rewards_post_entry(w,'earn_available',2000,'manual_payment','e9b',NULL,pg_temp.new_payment());
  FOR n IN 1..10 LOOP
    PERFORM public.leonix_rewards_post_entry(w,'refund_reversal',200,'stripe_refund','rev9:'||n,'re_9_'||n,p,
      NULL,NULL,NULL,NULL,'{}'::jsonb,NULL);
  END LOOP;
  -- No clock manipulation is needed or possible: the ledger is append-only, and `now()` is fixed
  -- for the whole transaction, so every row this block wrote already carries one timestamp.
  PERFORM pg_temp.ok((SELECT count(DISTINCT created_at) FROM public.leonix_rewards_ledger WHERE wallet_id = w) = 1,
    'S9 every entry shares one timestamp, so only entry_seq can order them');
  PERFORM pg_temp.ok((SELECT count(*) FROM public.leonix_rewards_ledger WHERE wallet_id = w) >= 12,
    'S9 and there are more than nine of them');
  SELECT * INTO live FROM public.leonix_rewards_wallets WHERE id = w;
  SELECT * INTO replayed FROM public.leonix_rewards_recompute_wallet(w);
  PERFORM pg_temp.ok(live.pending_cents = replayed.pending_cents
                 AND live.available_cents = replayed.available_cents
                 AND live.recovery_cents = replayed.recovery_cents
                 AND live.lifetime_reversed_cents = replayed.lifetime_reversed_cents,
    'S9 the replay reproduces the wallet with the clock giving it no help');
  PERFORM pg_temp.ok((SELECT count(*) FROM public.leonix_rewards_ledger WHERE wallet_id = w AND entry_seq IS NULL) = 0,
    'S9 no entry can opt out of the canonical order');
END $$;

-- ---------------------------------------------------------------------------
-- S10. THE LEDGER IS APPEND-ONLY, ENFORCED BY THE DATABASE.
-- ---------------------------------------------------------------------------
DO $$
DECLARE w uuid; p uuid; e uuid;
BEGIN
  w := pg_temp.new_wallet(); p := pg_temp.new_payment();
  SELECT id INTO e FROM public.leonix_rewards_post_entry(w,'earn_available',100,'stripe_payment','e10:'||p,NULL,p);
  PERFORM pg_temp.raises(format('UPDATE public.leonix_rewards_ledger SET amount_cents = 999999 WHERE id = %L', e),
    'append-only', 'S10 a ledger row cannot be edited');
  PERFORM pg_temp.raises(format('DELETE FROM public.leonix_rewards_ledger WHERE id = %L', e),
    'append-only', 'S10 nor deleted');
  PERFORM pg_temp.raises(
    format('INSERT INTO public.leonix_rewards_ledger (wallet_id, entry_type, amount_cents, source_kind, idempotency_key, balance_pending_after, balance_available_after, balance_reserved_after) VALUES (%L,''earn_available'',100,''stripe_payment'',''e10:%s'',0,0,0)', w, p),
    'duplicate key', 'S10 and a duplicate idempotency key cannot be inserted directly either');
  PERFORM pg_temp.raises(
    format('UPDATE public.leonix_rewards_wallets SET available_cents = -1 WHERE id = %L', w),
    'nonneg', 'S10 a wallet bucket cannot be driven negative by a direct write');
END $$;

-- ---------------------------------------------------------------------------
-- S11. AUTHORIZATION — a browser session cannot reach the money engine.
-- ---------------------------------------------------------------------------
DO $$
DECLARE r text;
BEGIN
  FOREACH r IN ARRAY ARRAY['anon','authenticated','public'] LOOP
    PERFORM pg_temp.ok(
      NOT has_function_privilege(r, 'public.leonix_rewards_post_entry(uuid,text,integer,text,text,text,uuid,uuid,text,uuid,uuid,jsonb,integer)', 'EXECUTE'),
      format('S11 %s cannot EXECUTE the posting function', r));
    PERFORM pg_temp.ok(
      NOT has_function_privilege(r, 'public.leonix_rewards_recompute_wallet(uuid)', 'EXECUTE'),
      format('S11 %s cannot EXECUTE the recompute function', r));
    PERFORM pg_temp.ok(
      NOT has_function_privilege(r, 'public.leonix_rewards_claim_redemption(uuid,uuid,integer,text)', 'EXECUTE'),
      format('S11 %s cannot EXECUTE the reservation claim', r));
  END LOOP;
  PERFORM pg_temp.ok(
    has_function_privilege('service_role', 'public.leonix_rewards_post_entry(uuid,text,integer,text,text,text,uuid,uuid,text,uuid,uuid,jsonb,integer)', 'EXECUTE'),
    'S11 and the server role can');

  FOREACH r IN ARRAY ARRAY['leonix_rewards_wallets','leonix_rewards_ledger','leonix_rewards_redemptions'] LOOP
    PERFORM pg_temp.ok(NOT has_table_privilege('anon', 'public.'||r, 'SELECT'), format('S11 anon cannot read %s', r));
    PERFORM pg_temp.ok(has_table_privilege('authenticated', 'public.'||r, 'SELECT'), format('S11 a signed-in customer may read %s under RLS', r));
    PERFORM pg_temp.ok(NOT has_table_privilege('authenticated', 'public.'||r, 'INSERT')
                   AND NOT has_table_privilege('authenticated', 'public.'||r, 'UPDATE')
                   AND NOT has_table_privilege('authenticated', 'public.'||r, 'DELETE'),
      format('S11 and can never write %s', r));
    PERFORM pg_temp.ok(
      (SELECT relrowsecurity FROM pg_class WHERE oid = ('public.'||r)::regclass), format('S11 RLS is enabled on %s', r));
    PERFORM pg_temp.ok(
      (SELECT count(*) FROM pg_policies WHERE schemaname='public' AND tablename=r AND cmd <> 'SELECT') = 0,
      format('S11 and %s has no write policy at all', r));
  END LOOP;
  -- The staff refund queue is not customer-readable in any form.
  PERFORM pg_temp.ok(NOT has_table_privilege('authenticated','public.leonix_rewards_refund_resolutions','SELECT'),
    'S11 the refund resolution queue is staff-only');
  PERFORM pg_temp.ok(NOT has_table_privilege('anon','public.leonix_rewards_refund_resolutions','SELECT'),
    'S11 and unreachable anonymously');
  -- Every SECURITY DEFINER function pins a hardened search path.
  PERFORM pg_temp.ok(
    (SELECT count(*) FROM pg_proc pr JOIN pg_namespace n ON n.oid = pr.pronamespace
      WHERE n.nspname='public' AND pr.proname LIKE 'leonix_rewards%' AND pr.prosecdef
        AND NOT ('search_path=pg_catalog, public, pg_temp' = ANY(COALESCE(pr.proconfig, ARRAY[]::text[])))) = 0,
    'S11 every SECURITY DEFINER function pins search_path = pg_catalog, public, pg_temp');
END $$;

-- ---------------------------------------------------------------------------
-- S12. THE ENTRY-TYPE VOCABULARY IS CLOSED, AND THE FUNCTION HANDLES ALL OF IT.
-- ---------------------------------------------------------------------------
DO $$
DECLARE w uuid; t text;
BEGIN
  w := pg_temp.new_wallet();
  PERFORM pg_temp.raises(
    format('SELECT public.leonix_rewards_post_entry(%L,''free_money'',100,''stripe_payment'',''x12'')', w),
    'unsupported entry_type', 'S12 an entry type the contract does not name is refused');
  PERFORM pg_temp.raises(
    format('SELECT public.leonix_rewards_post_entry(%L,''earn_available'',100,''wire_transfer'',''y12'')', w),
    'source_chk', 'S12 and so is a source kind it does not name');
  -- Every type in the CHECK is reachable through the posting function (it never raises
  -- "unsupported"), so the CHECK and the CASE cannot drift apart.
  FOR t IN SELECT unnest(ARRAY['earn_pending','earn_promote','earn_available','redeem_reserve',
                               'redeem_commit','redeem_release','redeem_recommit','refund_reversal',
                               'chargeback_reversal','reversal_restoration','recovery_accrue',
                               'recovery_offset','manual_adjustment','expire'])
  LOOP
    BEGIN
      PERFORM public.leonix_rewards_post_entry(w, t, 1, 'staff_adjustment', 'probe12:'||t);
    EXCEPTION WHEN OTHERS THEN
      IF position('unsupported entry_type' in SQLERRM) > 0 THEN
        RAISE EXCEPTION 'FAILED: S12 the CHECK allows % but the posting function does not handle it', t;
      END IF;
    END;
  END LOOP;
  PERFORM pg_temp.ok(true, 'S12 every entry type the CHECK allows has a delta arm');
END $$;

-- ---------------------------------------------------------------------------
-- S13. A LIVE HOLD MUST CARRY A DEADLINE.
-- ---------------------------------------------------------------------------
DO $$
DECLARE w uuid;
BEGIN
  w := pg_temp.new_wallet();
  PERFORM pg_temp.raises(
    format('INSERT INTO public.leonix_rewards_redemptions (wallet_id, amount_cents, idempotency_key) VALUES (%L, 100, ''reserve:nodeadline'')', w),
    'live_expiry_chk', 'S13 a reserved hold with no deadline is refused');
END $$;

SELECT format('verify-ix-rewards-sql-behavior-01: OK (%s SQL assertions against a real PostgreSQL %s)',
              (SELECT count(*) FROM pg_temp.assertions),
              current_setting('server_version')) AS result;
