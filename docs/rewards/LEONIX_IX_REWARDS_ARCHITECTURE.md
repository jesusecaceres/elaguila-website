# Leonix IX Rewards — Architecture and Invariants

Branch: `claude/leonix-ix-rewards-global-2026-09`
Branched from QUICK_FREEZE_SHA: `4cb34be6d519b541606eecf9ff4afa3d0824814b`

Nothing in this document describes intent. Every invariant listed here is either enforced by a
database constraint or proven by `scripts/verify-ix-rewards-behavior-01.ts` (35 behavioral checks,
no database, no network, no Stripe).

---

## The commercial contract

| Rule | Where it lives |
|---|---|
| Earn 9% back on eligible net settled money | `REWARDS_EARN_RATE_BASIS_POINTS = 900`, `computeEarnCents` |
| $1 credit = $1 toward an eligible purchase | `CREDIT_CENT_VALUE`, `planRedemption` |
| No cash value, not transferable | Product copy only; no code path converts credits to money or moves them between wallets |
| Credits spent do not earn credits | `computeEligibleNetCents` subtracts `creditsAppliedCents` |
| Refunds/reversals/chargebacks reverse credits | `computeReversalCents`, proportional and clamped |
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
reverse:refund:<stripeChargeId>       reverse:chargeback:<stripeDisputeId>
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
| `charge.refunded` | `reverseCreditsForRefundOrDispute` | `refund_reversal`, proportional, keyed on charge id |
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

1. **Reserve** before creating the payment. The server calls `planRedemption`, which caps the
   customer's request against the live balance, the amount actually owed, and any rail minimum. A
   browser-supplied figure is never applied as-is.
2. **Commit** only after the payment succeeds.
3. **Release** when it fails or expires, returning the hold to `available`.

Committing twice, releasing after a commit, or re-submitting the same reservation are all no-ops
rather than errors — duplicate webhook deliveries must not corrupt entitlement state.

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

## Deferred / not done

These are named because they are genuinely open, not because they were forgotten.

1. **The migration is not applied anywhere.** Until it is, every hook returns `skipped` and no
   credits accrue. This is deliberate: the mission forbade remote Supabase mutation.
2. **Checkout redemption UI is not wired.** The reserve/commit/release engine, its policy and its
   tests are complete, and the office/manual path uses them end to end, but the customer-facing
   Stripe checkout does not yet offer "apply my credits". Wiring it means threading
   `creditsAppliedCents` through `app/api/revenue-os/checkout/route.ts` and writing it to
   `leonix_payment_records.metadata.leonix_credits_applied_cents`, which the earn hook already
   reads.
3. **Pending → available promotion has no scheduler.** `promoteSettledCredits` is implemented and
   idempotent; nothing calls it yet. It needs a cron job and an owner decision on the settlement
   window length.
4. **CSV export / import-preview / reconciliation is not implemented.** The ledger is designed for
   it (`source_kind = 'csv_import'` is already a valid source and the idempotency key scheme
   extends to a row hash), but the importer, the dry-run preview and the reconciliation report are
   not written.
5. **Wallet merge is not implemented.** A customer who earns as an individual and later gains a
   business would hold two wallets. The safe path is a pair of compensating `manual_adjustment`
   entries; an automated merge was not built.
6. **No Vercel deployment, no live Stripe call, no remote Supabase mutation** occurred at any point.

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
