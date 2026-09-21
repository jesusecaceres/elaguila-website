# Leonix IX Rewards — Architecture and Invariants

Branch: `claude/leonix-ix-rewards-global-2026-09`
Branched from QUICK_FREEZE_SHA: `4cb34be6d519b541606eecf9ff4afa3d0824814b`

Nothing in this document describes intent. Every invariant listed here is either enforced by a
database constraint or proven by `scripts/verify-ix-rewards-behavior-01.ts` (124 behavioral checks,
no database, no network, no Stripe).

---

## The commercial contract

| Rule | Where it lives |
|---|---|
| Earn 9% back on eligible net settled money | `REWARDS_EARN_RATE_BASIS_POINTS = 900`, `computeEarnCents` |
| $1 credit = $1 toward an eligible purchase | `CREDIT_CENT_VALUE`, `planRedemption` |
| No cash value, not transferable | Product copy only; no code path converts credits to money or moves them between wallets |
| Credits spent do not earn credits | `computeEligibleNetCents` subtracts `creditsAppliedCents` |
| Refunds/reversals/chargebacks reverse credits | `computeTotalReversalTargetCents` + `computeReversalDeltaCents` — a DELTA against a cumulative target, so a sequence of partial refunds lands on the exact proportional total |
| Redeem all, some or none | `planRedemption` honours a partial request exactly |
| One promo code maximum per purchase | Unchanged — the existing `discount_conflict` 409 in `app/api/revenue-os/checkout/route.ts` |
| Credits may be redeemed alongside that one promo | `validateDiscountCombination` |
| Global across print, digital, Quick, Full, upgrades, cash, card, check, Stripe | `EARNING_PAYMENT_SOURCES` |

Rounding is always **down**, so `earn(a) + earn(b) ≤ earn(a+b)`: splitting a payment can never
manufacture credits. Money is integer cents everywhere; there is no floating-point money column and
no float arithmetic in the policy module.

---

## Schema

`supabase/migrations/20260921120000_leonix_ix_rewards_foundation.sql` — **AUTHORED, NOT APPLIED.**

### `leonix_rewards_wallets`
One canonical wallet per paying entity. `business_id` XOR `owner_user_id` (a `num_nonnulls = 1`
CHECK plus two partial unique indexes). Holds cached bucket balances — `pending`, `available`,
`reserved`, and three lifetime totals — each with a `>= 0` CHECK.

**Those CHECKs are the core money invariant.** Over-redemption does not clamp and does not warn: it
aborts the transaction.

### `leonix_rewards_ledger`
Append-only, enforced by `leonix_rewards_ledger_immutable_tg`, which raises on any UPDATE or DELETE.
A correction is a new compensating entry, never an edit.

`UNIQUE (idempotency_key)` is what makes duplicate Stripe deliveries, webhook retries and CSV
re-imports harmless. Keys are derived from the external fact, never random:

```
earn:payment:<paymentRecordId>
promote:payment:<paymentRecordId>
reverse:refund:<stripeRefundId>       reverse:chargeback:<stripeDisputeId>
reserve:<ref>   commit:<ref>   release:<ref>
adjust:<ref>
```

Each row also stores the three bucket balances **after** it, so history can be audited without
replaying it.

### `leonix_rewards_redemptions`
The reserve → commit / release lifecycle. A partial unique index allows at most one `reserved` row
per checkout session, so two browser tabs cannot double-reserve.

### `leonix_rewards_post_entry()`
The only supported way to move credits. `SECURITY DEFINER`, and:

1. returns the existing entry when the idempotency key is already present;
2. locks the wallet row `FOR UPDATE`, so concurrent movements queue instead of racing;
3. derives bucket deltas **in SQL** from the entry type — a buggy or malicious caller cannot invent
   a movement the entry type does not mean;
4. updates the cached balances and appends the ledger row in one statement.

`leonix_rewards_recompute_wallet()` rebuilds cached balances from history for reconciliation.

### RLS
Follows the money-table doctrine already used by `leonix_stripe_webhook_events`: **RLS enabled, no
write policies at all.** Customers may SELECT their own wallet, ledger and redemptions; nobody may
write from a browser session. Both SECURITY DEFINER functions are `REVOKE`d from `anon` and
`authenticated`.

---

## Migration order

1. Apply `20260921120000_leonix_ix_rewards_foundation.sql`.
2. Deploy the application code (it fails soft until the tables exist: `isRewardsConfigured()`
   gates every hook, and each hook returns `skipped` rather than throwing).
3. Optionally backfill historical earnings via the CSV importer path — **not** by writing balances
   directly. Import posts canonical transactions.

Rollback: the three tables and two functions can be dropped; no existing table is altered, and no
existing column is modified, so nothing else depends on them.

---

## Code layers

```
rewardsPolicy.ts        pure, IO-free   the contract: 9%, eligibility, reversal, redemption caps
rewardsLedgerCore.ts    port-injected   earn / reverse / reserve / commit / release / adjust
rewardsLedger.ts        server-only     the real Supabase port; calls the RPC, never the tables
rewardsFulfillment.ts   server-only     what the payment pipeline calls; best-effort, audited
```

The split exists so the contract is testable. `rewardsLedgerCore.ts` deliberately has no
`server-only` import, which is what lets the verifier drive the real code paths against an
in-memory store that reproduces `UNIQUE(idempotency_key)` and the non-negative CHECKs.

---

## Stripe event flow

| Event | Hook | Effect |
|---|---|---|
| `checkout.session.completed` → payment marked paid | `awardCreditsForSettledPayment` | `earn_pending` (card money can still be refunded) |
| settlement window passes | `promoteSettledCredits` | `earn_promote`: pending → available |
| `charge.refunded` | `reverseCreditsForRefundOrDispute`, fanned out over `charge.refunds` | `refund_reversal` per REFUND OBJECT id — never the charge id, which repeats on every delivery |
| `charge.dispute.created` | same | `chargeback_reversal`, keyed on dispute id |
| manual payment verified cleared | `awardCreditsForSettledPayment` | `earn_available` — cash is final on clearance, so it is spendable at once |

**Idempotency has two layers.** The existing `leonix_stripe_webhook_events` claim already prevents
an event from being processed twice at all. Underneath it, `UNIQUE(idempotency_key)` means that
even if an event *were* reprocessed — a manual replay, a code path that bypasses the claim — no
credit moves twice.

**Ordering.** Earning runs only after the payment record is marked paid. A failed or abandoned
checkout therefore never earns, which is the same authoritative-settlement rule the Quick→Full
convergence uses.

**Failure posture.** Every hook is best-effort and never throws: a rewards problem must not make a
settled payment look failed. A failure is written to the audit log with `retryable: true` rather
than swallowed, which is what an operator queries to find customers still owed credits.

---

## Redemption flow

1. **Plan**, read-only: `planRedemption` caps the customer's request against the live balance, the
   50% ceiling, the amount actually owed and the rail's floor. A browser figure is never applied
   as-is.
2. **Reserve** once the payment record exists — the hold is keyed on that record's id, which is
   minted per attempt and never reused. The reserve re-plans under a row lock and is
   authoritative; if it disagrees with the plan, the checkout aborts rather than charging a price
   no hold backs.
3. **Commit** only after the payment succeeds. If the 30-minute hold expired first (a Stripe
   session outlives it), the credits are RE-DEBITED here rather than reported as already settled —
   otherwise the customer keeps both the discount and the credits.
4. **Release** on a stale attempt, a Stripe failure, an expired session, or the 30-minute sweep.

Committing twice and releasing after a commit are no-ops — duplicate webhook deliveries must not
corrupt entitlement state. Re-submitting a reference reports `deduplicated` with the amount STILL
HELD, which is zero for a committed, released or expired hold: a spent hold is never re-served as
a fresh discount.

An invoice can never go negative: redemption is capped at the amount due, and `minimumChargeCents`
keeps a payable remainder on rails that cannot settle zero.

---

## Staff / manual-payment workflow

`/admin/workspace/rewards`, behind the same authorization as the existing payment tracker:
`requirePaymentTrackerAccess` to read, `requireRevenueProtectedWriteAccess()` (super-admin) for
every write.

1. Search the customer. **Name is a search key only** — the wallet is keyed on the canonical
   business id the search resolves to, never on a name or a phone number.
2. Review available / pending / reserved / lifetime earned.
3. Enter the amount due and how many credits the customer wants to use.
4. The screen shows original amount, credits applied, remaining due, method, and change due for
   cash. **After posting, those figures are the server's answer, not a local sum.**
5. Confirm. An office payment settles in person, so the API reserves and commits in one step.
6. The ledger entry is the immutable receipt.

Adjustments require an authorized role, a reason of at least three characters, and an actor — the
database refuses a `manual_adjustment` lacking either. Historical rows are never edited or deleted.

---

## Security expectations

- No service-role key and no Stripe secret in any browser bundle. The customer panel talks only to
  `/api/rewards/wallet`, which resolves the wallet from the bearer token.
- A wallet is never addressable by id from the browser, so one customer cannot request another's
  balance.
- All ledger writes are service-role or SECURITY DEFINER; there is no authenticated write policy.
- Staff writes are attributed (`actor_auth_user_id`, `actor_roster_id`) and audited.

---

## Locked launch policy

Every number below is a constant in `rewardsPolicy.ts`, asserted by
`scripts/verify-ix-rewards-behavior-01.ts`, and read by every surface rather than re-typed.

| Rule | Value | Constant |
|---|---|---|
| Earn rate on eligible net settled money | 9% | `REWARDS_EARN_RATE_BASIS_POINTS = 900` |
| Money representation | integer cents, rounded DOWN | `computeEarnCents` |
| Credits spent earn nothing | enforced | `computeEligibleNetCents` |
| Card settlement window before credits are spendable | 30 calendar days | `CARD_SETTLEMENT_PENDING_DAYS` |
| Cleared cash / manual money | immediately spendable | `pendingUntilSettlementFinal: false` |
| Minimum redemption | $1.00 | `REDEMPTION_MINIMUM_CENTS` |
| Maximum redemption | 50% of the eligible purchase | `REDEMPTION_MAX_FRACTION_BASIS_POINTS` |
| Payment-rail floor preserved | 50c default; a stricter value wins | `resolveRailMinimumChargeCents` |
| Checkout reservation hold | 30 minutes, auto-released | `REDEMPTION_RESERVATION_MINUTES` |
| Credit expiration | **none at launch** | `CREDITS_EXPIRE_AT_LAUNCH = false` |
| Wallet merge | never automatic | see *Deferred* |
| Reversal target wallet | the wallet originally credited | `findEarnForPayment().walletId` |

---

## What is BUILT

Each item is reachable from real application code and covered by the behavioural verifier.

1. **Earning** — Stripe checkout (`revenueFulfillment`), cleared manual/office payments
   (`manualClearedPayments`) and **recurring subscription renewals**
   (`revenueSubscriptionEvents.handleInvoicePaid`) all award 9% under
   `earn:payment:<paymentRecordId>`. The renewal payment record now carries `owner_user_id`, which
   is what makes a renewal attributable to a wallet at all.
2. **Refund and chargeback reversal** — keyed on each **refund object's** id (and each dispute's),
   never on the charge, and computed as a DELTA against a cumulative target so a sequence of
   partial refunds converges on the exact proportional total instead of losing a cent per event.
   The debit always lands on the wallet the payment originally credited; ownership is never
   re-resolved at reversal time. A duplicate delivery is recorded and reports **zero movement**
   rather than the amount it would have moved on a first delivery.
3. **Settlement promotion** — `runRewardsSettlementPromotionSweep` promotes card credits after 30
   calendar days, only for payments not refunded, disputed, reversed or otherwise invalidated.
   Idempotent per payment; the eligibility question fails **closed**.
4. **Checkout redemption** — `rewardsCheckoutRedemption.ts` reserves against the live balance
   through the one `planRedemption` policy, threads the reduced amount through the SAME
   `finalAmountCents` seam the promo and verified-intro discounts use, commits only after
   `checkout.session.completed`, and releases on a stale attempt, a payment-record failure, a
   synchronous Stripe failure and an expired session. The reference is the existing
   `checkoutAttemptKey`, so a retry reuses the hold instead of stacking a second one, and a reused
   reference reports `deduplicated` rather than a fresh discount.
5. **Reservation expiry** — `expires_at` is written on reserve (a live hold without one is refused
   by a CHECK), and `runRewardsReservationExpirySweep` releases anything past 30 minutes.
6. **The scheduler seam** — `POST/GET /api/revenue-os/admin/rewards-sweep`, modelled on the
   existing subscription sweep: `CRON_SECRET` bearer for GET, super-admin or
   `LEONIX_REWARDS_SWEEP_KEY` for POST, constant-time comparison, and **fail-closed when the secret
   is unset**. Authored in `vercel.json` as configuration; nothing here activates a schedule.
7. **Customer wallet UI** — `LeonixCreditsPanel` is **mounted** in the canonical owner dashboard
   (`app/(site)/dashboard/page.tsx`). It shows pending, available, reserved, lifetime
   earned/redeemed/reversed, the ledger history, and the pending availability date when the server
   can compute one. It offers no redeem control, because the dashboard cannot spend credits.
8. **Staff CSV reconciliation** — `POST /api/admin/rewards/reconciliation` with a mandatory
   `preview` → `commit` flow bound by a batch fingerprint, an exact required header, bounded file
   size and row count, per-row rejection reasons, a derived `csv:<reference>` idempotency key, an
   attributed audit entry and a downloadable report. Formula-leading cells are **refused** on
   import and **neutralized** on export.
9. **Wallet recomputation** — `leonix_rewards_recompute_wallet()` replays the ledger in posting
   order through the same delta rules as `leonix_rewards_post_entry()`, rebuilding the buckets AND
   the lifetime totals, and refusing rather than clamping if the history replays negative. Parity
   with the incremental balances is asserted, including for the path-dependent cases no aggregate
   could reproduce.

---

## Deferred / not done

These are named because they are genuinely open, not because they were forgotten.

1. **The migration is not applied anywhere.** Until it is, every hook returns `skipped` and no
   credits accrue. This is deliberate: the mission forbids remote Supabase mutation. Nothing in
   this repository has been run against a remote project.
2. **No checkout redemption *widget*.** The server path is complete and proven — a request
   carrying `requestedCreditsCents` is planned against the live balance, held, charged and
   committed correctly, and the response returns the exact available / applied / remaining-due
   figures plus a refusal reason when credits could not be applied. What does not exist is a
   rendered control in the checkout page that lets a customer type that number;
   `checkoutCreditsCopy()` supplies the ES/EN strings such a control would use. Stated plainly:
   the capability is real, the on-page affordance is not yet drawn.
3. **Wallet merge is not implemented.** A customer who earns as an individual and later gains a
   business holds two wallets, and they are never merged automatically — a locked decision, not an
   oversight. The safe manual path is a pair of compensating `manual_adjustment` entries.
4. **Unattributed / guest payments earn nothing.** A payment with no resolvable business or user
   returns `skipped: no_wallet_owner`. There is no backfill that awards credits once such a payment
   is later linked canonically; that is a reconciliation CSV batch today, not an automatic sweep.
5. **`earn_adjustment` CSV rows post as attributed `manual_adjustment` entries.** They are
   validated as earn-shaped (a payment record is required, a negative amount is refused), but the
   ledger records them under `manual_adjustment` with the kind carried in the reason — not as a
   second earn against the payment. This keeps one import path and one idempotency scheme; it does
   mean a CSV row never produces an `earn_pending` or `earn_available` entry.
6. **A WON dispute does not restore the credits it reversed.** `charge.dispute.created` reverses
   immediately; `charge.dispute.closed` with `status = "won"` restores the listing and the
   subscription but posts no compensating rewards entry, and the ledger is append-only so nothing
   else can. That payment also stays permanently unpromotable, because `isPaymentStillPromotable`
   withholds promotion on the existence of any reversal row. Net effect: Leonix wins the dispute
   and keeps the money, but the customer does not get their credits back. Restoring them needs a
   compensating entry type — the `manual_adjustment` CHECK requires a human actor and a webhook has
   none — which is a schema change this mission may not apply. **Not built, and not claimed.**

7. **Reversal arithmetic assumes refund events are processed SERIALLY.** The cumulative position
   (`sumReversalBasisForPayment` + `sumReversedForPayment`) is read outside the wallet lock; only
   the final post takes `FOR UPDATE`. Two `charge.refunded` deliveries for one charge handled in
   parallel can each read the same prior total and under-reverse by a rounding cent. The
   `leonix_stripe_webhook_events` claim serializes event processing in practice, which is why this
   is a residual rather than a live defect — but it is an assumption, not a guarantee this module
   makes on its own.

8. **`leonix_rewards_recompute_wallet()` replays by `created_at`, which is transaction START time,
   not the serialization point.** Two overlapping transactions can commit in the opposite order to
   their `created_at` values, in which case the replay reconstructs a different — possibly
   negative — intermediate state and refuses. That refusal is safe (it never writes a wrong
   balance) but it can be a false alarm on a genuinely consistent ledger. A monotonic sequence
   column assigned inside the lock would fix it, and is a schema change this mission may not apply.

9. **No Vercel deployment, no live Stripe call, no remote Supabase mutation, no live data import**
   occurred at any point. Every CSV fixture in the verifier is invented.

---

## Future promo readiness

The seams required later are present, and nothing was launched:

- `validateDiscountCombination` is the one place the promo-stacking rule is expressed, so a future
  partner code (e.g. `KALIENTE15`), a temporary monthly promo that *replaces* the standing one, or
  a one-time appreciation discount changes that function rather than every call site.
- `source_kind` and `entry_type` are CHECK-constrained vocabularies, so a milestone reward
  (3/6/9/12 months) is an additive value plus a `manual_adjustment`-shaped entry with a reason —
  no schema redesign.
- `meta jsonb` on every ledger row carries campaign attribution without new columns.

No campaign was created, no customer was emailed, no live Stripe coupon exists, and no schedule was
invented.
