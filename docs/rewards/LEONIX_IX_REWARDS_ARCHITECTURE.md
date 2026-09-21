# Leonix IX Rewards — Architecture and Invariants

Branch: `claude/leonix-ix-rewards-global-2026-09`
Branched from QUICK_FREEZE_SHA: `4cb34be6d519b541606eecf9ff4afa3d0824814b`

Nothing in this document describes intent. Every invariant listed here is either enforced by a
database constraint or proven by `scripts/verify-ix-rewards-behavior-01.ts` (150 behavioral checks,
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
recommit:<ref>
adjust:<ref>
csv:<reference>
```

`<ref>` is the payment record's id. `recommit:<ref>` exists because a hold can expire before the
payment lands: the credits are taken AGAIN, as ONE `redeem_recommit` entry moving available →
spent. It was briefly a reserve+commit pair with a compensating unwind; that was wrong, because
every key is permanent, so after an unwind a redelivery found the reserve key spent and the commit
key fresh and posted anyway — spending a neighbouring reservation's credits. One movement, one
key.

```
```

Each row also stores the three bucket balances **after** it, so history can be audited without
replaying it.

### `leonix_rewards_redemptions`
The reserve → commit / release lifecycle.

**The reservation is the unit, not the bucket.** `reserved_cents` is one fungible number shared by
every live hold on a wallet, so `leonix_rewards_post_entry` locks the redemption ROW for
`redeem_commit`, `redeem_release` and `redeem_recommit`, refuses unless its status permits the
movement, and advances that status in the same statement. The money movement and the state
transition are one atomic act. Before that, a commit could consume a different reservation's
credits, and a commit racing the expiry sweep could see both movements land before either learned
it had lost.

A partial unique index on `stripe_checkout_session_id` exists for a future caller that has a
session id at reservation time. **It does not currently apply**: the hold is taken before the
Stripe session exists, so that column is always NULL and the index never matches. What actually
stops one purchase holding twice is `checkout_attempt_key` uniqueness on the payment record.

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
| `charge.refunded` | `reverseCreditsForRefundOrDispute`, fanned out over `charge.refunds` | `refund_reversal` per REFUND OBJECT id — never the charge id, which repeats on every delivery. A payload carrying NO refund objects reverses **nothing** and audits a retryable skip: a second, cumulative-keyed scheme used to cover that case, and because basis contributions from both schemes are summed, the same refunded dollars were counted once under each and the customer was over-charged |
| `charge.dispute.created` | same | `chargeback_reversal`, keyed on dispute id |
| `invoice.paid` (a renewal) | `decideInvoiceRenewalEarn` -> `awardCreditsForSettledPayment` | `earn_pending` on the renewal's own payment record. The subscription's FIRST invoice earns nothing here — checkout already awarded it — and an ABSENT `billing_reason` fails CLOSED with an audited, retryable skip |
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
   calendar days. A payment that is **disputed**, failed, canceled or unreadable promotes nothing
   and the eligibility question fails **closed**. A **partially refunded** payment promotes its
   RESIDUAL — `earned − reversed` — because the refunded share has already been clawed back
   proportionally and what remains is credits for money the customer really paid. Refusing
   outright stranded that remainder in `pending` forever, on every sweep, while the customer is
   told in both languages that their credits do not expire. Idempotent per payment.
4. **Checkout redemption** — `rewardsCheckoutRedemption.ts` reserves against the live balance
   through the one `planRedemption` policy, threads the reduced amount through the SAME
   `finalAmountCents` seam the promo and verified-intro discounts use, commits only after
   `checkout.session.completed`, and releases on a stale attempt, a payment-record failure, a
   synchronous Stripe failure and an expired session. The reference is the PAYMENT RECORD's id,
   not the reusable `checkoutAttemptKey`: an attempt key is reused across retries and across a
   later renewal, which would have re-served a spent hold as a fresh discount. A reused reference
   reports `deduplicated` with the amount STILL HELD — zero for a committed, released or expired
   hold. A hold that expired before the payment landed is RE-DEBITED at commit under its own
   `recommit:*` keys, the redemption row is finalised as `committed`, and a failed re-commit is
   unwound so credits are never stranded in `reserved`.
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
9. **Checkout redemption UI** — `LeonixCheckoutCreditsPanel`, mounted inside the shared
   `PublishCheckoutCheckpoint`, so one component reaches every category surface. Opt-in per
   category via `creditsEligible`. Shows available balance, the maximum for this purchase, the
   applied amount and the exact remaining due, the 30-minute hold and the redemption rules, in
   ES/EN, mobile-first. Every figure is a PREVIEW: the server re-plans under a row lock and its
   answer wins, the caller reads back `creditsAppliedCents` / `remainingDueCents` /
   `creditsRefusedReason`, and a request that applied nothing STOPS the checkout rather than
   redirecting to a full-price Stripe page.
10. **Recovery balance** — a clawback the wallet cannot cover is recorded as `recovery_cents`
   rather than refused. Buckets never go negative, future EARNINGS repay the debt before becoming
   spendable, no new hold may be taken while it stands, and the customer is told why in their own
   language (`recoveryBalanceCopy`). A staff goodwill credit is not an earning and does not repay
   it.
11. **Won-dispute restoration** — `charge.dispute.closed` with `status = "won"` posts a
   `reversal_restoration`, bounded by `reversed - already restored`, keyed on the dispute id,
   landing on the wallet the reversal debited, repaying any recovery debt before handing anything
   back as spendable. It can never restore more than was taken, and a redelivery moves nothing.
12. **Unattributable refund queue** — `leonix_rewards_refund_resolutions`, written by the webhook
   and worked at `/admin/workspace/rewards-refunds`. One row per problem with an attempt counter,
   not one per delivery; settled only with a canonical refund id, attributed, noted, and the
   movement happens BEFORE the row closes so "resolved" always describes real money.
13. **Canonical wallet identity** — `bound_user_id`, pinned at first use and never reassigned. The
   membership rules decide only the first answer; afterwards earning, promotion, redemption,
   reversal, release and restoration all resolve to the same wallet.
14. **Wallet recomputation** — `leonix_rewards_recompute_wallet()` replays the ledger in posting
   order through the same delta rules as `leonix_rewards_post_entry()`, rebuilding the buckets AND
   the lifetime totals, and refusing rather than clamping if the history replays negative. Parity
   with the incremental balances is asserted, including for the path-dependent cases no aggregate
   could reproduce.

---

## Intentionally excluded at launch

These are OWNER DECISIONS, not missing work. They are listed separately from anything unbuilt so
the two are never confused again.

1. **No automatic wallet merge.** A customer who earns as an individual and later gains a business
   keeps whichever wallet was bound to them first; the two are never merged automatically. The
   binding (`leonix_rewards_wallets.bound_user_id`) is what makes that a stable identity rather
   than a race: earning, promotion, redemption, reversal, release and restoration all resolve
   through it, and a membership change can no longer move a balance. The safe manual path remains
   a pair of compensating `manual_adjustment` entries.
2. **Guest and unattributed payments earn nothing, and there is no automatic backfill.** A payment
   with no resolvable business or user returns `skipped: no_wallet_owner`. Linking it canonically
   later does not retroactively award credits; that is a staff reconciliation CSV batch, by
   decision.
3. **The migration is applied at the staging certification gate, not before.** Until then every
   hook returns `skipped` and no credits accrue. Nothing in this repository has been run against a
   remote project.
4. **No credit expiration.** `CREDITS_EXPIRE_AT_LAUNCH = false`. The `expire` entry type exists so
   expiry could be introduced later without a schema change; nothing writes it and no surface
   claims it.
5. **`earn_adjustment` CSV rows post as attributed `manual_adjustment` entries.** They are
   validated as earn-shaped, but recorded under `manual_adjustment` with the kind in the reason —
   one import path, one idempotency scheme. A CSV row never produces an `earn_pending` entry.

---

## Remaining residuals

Genuine limits, each with its blast radius stated. None blocks launch.

1. **A refund payload with no refund objects reverses nothing automatically.** It cannot be
   attributed to a canonical refund id, and inventing a charge-derived key is what once
   double-counted the same refunded dollars. The event is now recorded in
   `leonix_rewards_refund_resolutions` — durable, retryable, staff-visible at
   `/admin/workspace/rewards-refunds` — and settled by a person against the real refund id, under
   the ordinary `reverse:refund:<id>` key so a later correct webhook is a no-op. What remains
   residual is only that it needs a human, not that anything is lost.
2. **Reversal arithmetic reads the cumulative position outside the wallet lock.** Only the final
   post takes `FOR UPDATE`. Two `charge.refunded` deliveries for one charge handled in true
   parallel can each read the same prior total; the `leonix_stripe_webhook_events` claim
   serializes event processing in practice, and the `reverse:<kind>:<externalId>` key means a
   duplicate delivery still cannot double-move. The exposure is a rounding cent under a race the
   claim already prevents.
3. **An out-of-order dispute pair needs a person.** If `dispute.closed(won)` is processed before
   `dispute.created`, there is no clawback to undo yet; the restoration finds nothing, the event is
   queued for staff, and the clawback that lands afterwards stands until someone resolves it.
4. **A reversed or failed refund leaves its clawback standing.** When `amount_refunded` returns to
   zero, nothing restores the credits automatically. A WON DISPUTE now does restore them
   (`reversal_restoration`); the refund-reversal case needs a staff `manual_adjustment`.
5. **No Vercel deployment, no live Stripe call, no remote Supabase mutation, no live data import**
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
