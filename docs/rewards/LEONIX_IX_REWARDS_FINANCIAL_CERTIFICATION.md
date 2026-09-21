# LEONIX QUICK + IX REWARDS — definitive financial certification

**Starting SHA:** `fe5df09f08d1e3f90362d55e2a06199c15cb4ed2`
**Branch:** `integration/quick-rewards-final-convergence-2026-09-21` (identical content on
`claude/leonix-rewards-final-certification-hxfl0w`)
**Date:** 2026-09-21

This document is evidence, not narration. Every claim below names the command that produced it and
the exit code it produced. Where something could not be executed, it says so and says why; nothing
unverified is called complete.

---

## 1. What this round set out to do, and what it found

The previous round repeatedly discovered real money defects, so nothing was inherited: every
financial assertion was treated as untrusted and re-derived by running the code.

The first pass found **twenty defects that move money incorrectly or expose it** (§3): six
BLOCKER, nine HIGH, five launch-impacting MEDIUM. Four of the six create or destroy credits
outright and one lets an unauthenticated caller spend another customer's balance. Round 1's five
independent reviewers then found **nineteen more** (§3b), six of which the §3 repairs had
introduced. All thirty-nine are repaired, and each repair is pinned by a test that has been shown
to fail when the defect is put back — 45 of them mechanically, by
`scripts/verify-ix-rewards-mutation-01.ts`.

The single most important structural change is that **the SQL money engine is now proven by
execution** rather than by grep. The migration is applied to a throwaway local PostgreSQL 16, and
142 in-session assertions plus two genuinely concurrent sessions exercise the posting function, the
replay, the locks, the constraints and the grants. Before this round, every statement about
PL/pgSQL in this repository rested on reading the file.

---

## 2. Threat model

Who can try to move money incorrectly, and through what.

| Actor | Reaches | What they control |
|---|---|---|
| Anonymous HTTP caller | `POST /api/revenue-os/checkout`, `GET /api/admin/rewards` | Whole request body; cookies, including any unsigned marker |
| Authenticated customer | Checkout, `GET /api/rewards/wallet`, the checkout credits panel | Their bearer token, the body, timing (two tabs, a stale session) |
| Stripe (or anyone who can replay a signed event) | The webhook | Delivery order, duplicates, truncated payloads, event redelivery |
| Staff | `POST /api/admin/rewards`, the two workspace screens, the CSV importer | Resolution outcome, refund/dispute ids, notes, adjustment amounts |
| A second concurrent request | Every wallet operation | Interleaving |
| The operator applying migrations | The schema | Apply order, a database whose constraint names differ from the file's |

Three of these were under-modelled before this round: the anonymous caller (who could name any
wallet), Stripe's *ordering* (two deliveries for one payment racing), and the operator whose
constraint names differ from what a migration assumes.

---

## 3. Findings and disposition

Severity is by money impact. "Demonstrated" means a runnable reproduction produced the wrong number
before the repair and the right number after it.

### BLOCKER

| # | Finding | Demonstrated | Disposition |
|---|---|---|---|
| B1 | **Concurrent reversals over-reverse.** The cumulative position a reversal computes against is read in its own round trip. Two deliveries for one payment each computed a delta against a position the other had not moved, and both posted. | A $100.00 payment awarding 900 credits had **1350** clawed back by two concurrent partial refunds (cumulative 5000 then 10000), **1800** by two concurrent per-event full refunds, and **1800** by a concurrent refund and dispute. The excess became `recovery_cents` the customer never owed, which also froze their redemptions and confiscated their next earnings. | **Repaired.** The posting statement now takes a compare-and-swap on the payment's reversal-row count and enforces a payment-scoped ceiling, both under the wallet lock. Losing the race raises SQLSTATE `LX001` with a distinct message, which the core recomputes against and re-posts. All three races now land on exactly the sequential answer (900). |
| B2 | **Concurrent won-dispute restorations create credits.** Two deliveries both read "already restored = 0"; the wallet-level guard could not see it because a *separate* refunded payment had inflated `lifetime_reversed_cents`. | A 900-cent chargeback gave back **1800**; the customer's spendable balance doubled. 900 credits from nothing. | **Repaired.** Same compare-and-swap, plus a payment-scoped restoration bound. The loser now correctly reports `nothing_to_restore`. |
| B3 | **A won dispute restored another dispute's clawback.** The bound was the payment's whole chargeback sum, not the dispute's own. | A $100.00 payment disputed twice at $50.00 reversed 450 each. Dispute 1 WON, dispute 2 lost: **900** restored where 450 was owed. The customer kept full rewards on $50.00 that had been permanently charged back. Reproduces with perfectly ordered deliveries — it is not a race. | **Repaired.** The restoration is bounded by the `reverse:chargeback:<disputeId>` row's own amount, in the core and again in SQL. A dispute with no clawback restores zero. |
| B4 | **Credits spendable from any wallet named in the request body.** With no `Authorization` header, `ownerUserId` fell back to `body.ownerUserId`, and that value selected the wallet credits were planned, held and spent from. | An attacker knowing a victim's auth uuid (these appear in ordinary owner-scoped payloads) POSTs a checkout for their own listing with the victim's id and `requestedCreditsCents`. The victim's balance funds it, up to 50% of the purchase, repeatable per listing — and the victim is recorded as the actor in the audit log. | **Repaired.** A new `creditsOwnerUserId` resolves only from `serverVerifiedOwnerUserId ?? bearerUserId`. Guest checkout is unaffected: it simply cannot apply credits, which is already an ordinary explained outcome. |
| B5 | **Credits reduced a RECURRING price.** In `subscription` mode the discount is applied by lowering the line item's `unit_amount`, and that line item carries `recurring: { interval: "month" }`. | $199.50 of credits against `servicios_base_monthly` ($399.00/month) sets the subscription's price to **$199.50 a month, indefinitely**, for a single one-time credit debit — and each renewal then earns 9% of the reduced figure, funding further redemptions. The repository already knows this is wrong: the verified-intro discount uses a `duration: "once"` coupon precisely so "the subscription's own price stays full and renewals bill full price". | **Repaired by refusal.** Credits are refused on a recurring plan, by name (`not_available_on_recurring_plan`); the customer keeps their balance and pays full price. **See §9 — enabling credits on recurring plans needs the once-coupon path and is an owner decision.** |
| B6 | **A queue row was CLOSED before its inputs were validated.** `closeRefundResolution` ran before the refund-id and dispute-id checks, and both returned 400 without re-filing. | Staff open a $60.00 unattributable refund, type the note, leave the refund-id box empty. Response: `400 refund_external_id_required`. The row is now `resolved` with nothing moved, it leaves the open queue, and the customer keeps $60.00 of credits for money they got back. Unrecoverable without direct database access. | **Repaired.** Every refusal now runs before the claim. Pinned by an ordering assertion that guards both sides (see F5). |

### HIGH

| # | Finding | Demonstrated | Disposition |
|---|---|---|---|
| H1 | **Won-dispute work was unreachable in the UI**, and two disputes collapsed into one queue row. Restoration work is filed with `kind: "chargeback"` and a cumulative position of **zero** — a constant — so the dedupe key `(payment, kind, cumulative)` made a second dispute merely increment `attempts` and discard its id. The screen offered only "reverse" and "no action", and rendered the row as "$0.00 · Chargeback". | A customer wins a dispute; the only safe-looking button closes the row with nothing moved, and they stay charged their rewards for a dispute they won. With two disputes, one is never restored and nothing records that it was owed. | **Repaired.** `external_ref` joins the dedupe key; the queue screen gains a restore control, a dispute-id field, the external ref, the Stripe event id, and a status filter so resolved rows can be reviewed; `resolution_outcome` admits `'restored'` so the audit record no longer states the opposite of the movement. |
| H2 | **A failed reversal of an ATTRIBUTABLE refund was discarded.** The per-refund loop and the dispute-created path both threw the result away. | A $200.00 refund arrives with `refunds.data`; the database is briefly unavailable during posting; the reversal returns `ok: false`; the handler still reports `completed`, so Stripe never retries. $18.00 of credits stay spendable with nothing queued. The queue only ever covered payloads with no refund object at all. | **Repaired.** Both sites read their result and file durable work named by the refund or dispute id. |
| H3 | **A won dispute stranded the un-disputed remainder in `pending` for ever.** `payment_status = 'disputed'` never cleared, and the promotion predicate refused on the mere existence of a `chargeback_reversal` row — which is append-only. | A $399.00 payment earns 3591. A $100.00 dispute reverses 900. The dispute is WON. The remaining **2691 cents** never promote, on any run, while the product tells the customer in both languages that credits do not expire. | **Repaired.** The dispute records the status to return to and a won dispute returns to it (compare-and-set); the promotion rule now measures the **outstanding** clawback (reversals minus restorations) and was extracted into a pure, directly-tested function. |
| H4 | **A settled purchase the balance could no longer fund left Leonix short, silently.** A hold lives 30 minutes; a Stripe Checkout session lives up to 24 hours. | Balance $200.00. Start checkout A ($399.00) holding $199.50. Wait 31 minutes — the sweep returns the credits. Spend them on checkout B. Then pay session A, still priced at $199.50. The re-debit is refused, logged, and fulfillment proceeds: **$399.00 of credit value consumed from a $199.50 balance.** No race, just a wait. | **Repaired.** The shortfall is recorded as recovery debt through the mechanism that already exists for an uncoverable clawback: the customer owes it, their redemptions pause, and their next earnings settle it. The hold is finalised so a retry cannot take it twice. |
| H5 | **Credits could be released by the expiry sweep after a settled payment, because the commit was the LAST step of fulfillment** — behind roughly fifteen early returns that all run after the payment is marked paid. | A permanent activation failure exhausts Stripe's retries with the hold uncommitted; thirty minutes later the sweep hands the credits back. The customer paid the reduced price and kept the credits. | **Repaired.** The commit now runs immediately after `markPaymentRecordPaid` succeeds. Settling the money a payment was made with does not depend on whether a listing activated. |
| H6 | **A removed member kept the business wallet for ever.** The binding short-circuits before any membership is read, and there is no unbind path. | Ana owns business B and is bound to its wallet. Staff transfer B to Beto. Beto's payments earn into the wallet bound to Ana; Ana, with a revoked membership, can still read it and still spend it at checkout — both through the service-role client, so the RLS member check never runs. | **Repaired.** A *business* binding is re-checked against an active membership on every resolution; a *personal* binding stays unconditional. The check fails OPEN on a read error, so a transient failure never re-routes anyone's money. |
| H7 | **A duplicate `stripe_payment_intent_id` row made a refund or dispute vanish.** The column carries an ordinary index, not a unique one, so `.maybeSingle()` returned an ERROR, `data` read as null, and the handler reported "not a Leonix payment". | Two rows for one intent — a retried checkout, a backfill — and a $399.00 refund settles as handled with nothing reversed, no queue row and no retry. Fails silently, in the direction that costs Leonix. | **Repaired.** All three lookups are ordered-limit-1 and a read FAILURE returns `failed_retryable` rather than "not ours". |
| H8 | **Reading any customer's balance needed only a settable cookie.** `requireAdminCookie` is `leonix_admin === "1"`, unsigned, and `getCurrentAdminAccessContext` defaults an unresolved roster to `owner_admin`, which `hasPaymentTrackerAccess` grants unconditionally. | `curl -H 'Cookie: leonix_admin=1' '…/api/admin/rewards?businessId=<uuid>'` returns any business's wallet balances and its last 100 ledger rows. | **Repaired.** The GET is gated by `requireRevenueProtectedWriteAccess`, which re-verifies the session against live Supabase Auth, cross-checks the cookie email against the real auth email, looks the roster up by `auth_user_id` and requires `super_admin`. The role check still applies afterwards, so this only narrows access. |
| H9 | **The refund queue was reachable only by typing its URL.** Neither rewards screen appeared in `getAllowedWorkspaceNavHrefs` or the nav component. | A backlog nobody can navigate to is, operationally, the silent drop the queue exists to prevent. | **Repaired.** Both screens are in the allowlist and the nav, behind the same `hasPaymentTrackerAccess` permission the payment tracker uses. |

### MEDIUM (launch-impacting, repaired)

| # | Finding | Disposition |
|---|---|---|
| M1 | Counter credits applied to a payment record already flagged `leonix_amount_is_net_of_credits` were written and then ignored by the earn base, so a $100.00 record with $50.00 of counter credits still earned 9% of $100.00 — credits earning credits. | Refused by name (`payment_record_already_net_of_credits`). |
| M2 | Staff addressing a customer by `ownerUserId` bypassed the canonical binding: a customer bound to a business wallet was un-adjustable (a raw duplicate-key string surfaced as a 400), and a correction that did land would have gone into a wallet their own surfaces never read. | `ownerFromBody` resolves through `resolveWalletOwnerForUser`. |
| M3 | `requeued: true` was asserted unconditionally while the re-file's own `{ ok: false }` was discarded — an operator could be told the work was preserved at the moment it was lost. | Reports the actual result. |
| M4 | A queue row resolved between a failed insert and the dedupe lookup made `bump()` return `not_found`, and the event was lost. | The insert is retried once; a second unique violation is reported as a deduplicated success. |
| M5 | `20260920120000_quick_business_lifecycle_capability_parity.sql` widens two CHECK constraints by `DROP CONSTRAINT IF EXISTS <one exact name>`. If a deployed constraint carries a different name, the drop matches nothing, the old constraint survives alongside the new one, **the migration exits 0**, and the first customer to use the new value gets a check violation. Verified both ways against PostgreSQL 16. | A post-condition block now reads the constraint definitions and refuses to commit if any CHECK on the status column would still reject the new value. Confirmed: exit 0 with the documented names, exit 3 with a differently-named constraint. |

### MEDIUM / LOW (accepted, with reasons)

| # | Finding | Why it is accepted |
|---|---|---|
| A1 | The 50% ceiling is measured against the pre-promo **subtotal**, so with a 50%-off promo a $399.00 purchase can take $199.00 of credits against $199.50 due — 99.75% of the money actually owed, leaving $0.50. | This is a deliberate, documented product decision (*"a promo code must not shrink how much loyalty value the customer may spend"*), and the locked policy says at most half of **the purchase**, which is satisfied. Changing it is a product-policy decision — **see §9.** Its worst case narrowed sharply once B5 closed: recurring plans no longer take credits at all. |
| A2 | The office/manual staff redeem takes `amountDueCents` on trust and hard-codes `allowZeroCharge: true`, so a mistyped figure can commit more credits than a counter sale is worth. | Insider-only behind the strong write gate, fully attributed and audited. Bounding it against a payment record is a behaviour change to a staff tool — **see §9.** |
| A3 | A "preview" (`planCheckoutCredits`) creates a wallet row and pins `bound_user_id`. | No ledger entry and no redemption row is written. The anonymous vector closed with B4: the identity is now server-verified, so the binding is pinned for the person it belongs to. |
| A4 | `invoice.paid` with an absent `billing_reason` fails closed and skips the earn, audited as retryable but not queued. | Failing closed is correct (it prevents a double earn at signup). The customer loses 9% on a replayed or older-API-version renewal with only a log line. The refund queue is the wrong home for an earn gap; an earn-gap queue is unbuilt — **see §10.** |
| A5 | `promoteSettledCredits` in `rewardsFulfillment.ts` has no production caller. | Harmless while unreachable; it takes a caller-supplied `walletId` with no verification, so it is named here as a foot-gun if ever wired up. |
| A6 | The `earn_promote` idempotency key can be burned on a PARTIAL promotion, leaving that payment's remainder permanently unpromotable. | Demonstrated, and demonstrated to be **value-neutral**: `pending` is one fungible bucket, so a later payment's promotion moves the same credits. The wallet total is right; the per-payment attribution is not. Independently confirmed by the round-1 financial reviewer, which could not make the wallet total wrong. Recorded as a known modelling limit — **see §8.** |
| A7 | `basisNeutralizedCents` withdraws `floor(restored × eligibleNet / earned)`, the floor of the inverse of a figure that was already floored, so a won dispute can leave up to a cent of money-returned position behind. | Measured across 1,200 randomised sequences by the round-1 financial reviewer: the error was **never larger than one cent**, appeared only in sequences containing a win, and provably does not accumulate (twelve dispute/win cycles at five different bases all land on exactly the right final position). Correcting it exactly would require storing the withdrawal alongside the reversal rather than re-deriving it, which is a schema change for a one-cent bound. |
| A8 | `deduplicated` is derived from a read taken before the RPC, so two genuinely racing deliveries of one event can each report the full amount as moved. | Reporting only: the ledger holds one row and the wallet moves once, which `Q5` asserts. It affects an audit line and an operator-facing figure, not money. Fixing it means having the posting function return whether it inserted, which is a signature change to the one function everything goes through. |
| A9 | `lifetime_recovery_accrued_cents` no longer means only "clawbacks that could not be covered": `accrueUnfundedRedemption` adds unfunded REDEMPTIONS to the same counter, which loosens the wallet-level restoration guard that reads it. | Safe because that guard is now a backstop rather than a load-bearing bound: the payment-scoped and per-dispute bounds are strictly tighter and, since R1-13, each stands alone — mutations #36 and #37 delete one of them each and `S5` catches both. The counter has to include unfunded redemptions for the debt to be repayable out of earnings at all. Named here because the field's comment is now narrower than its contents. |

---

## 3b. Round 1 — five independent reviewers, and what they found

Five fresh read-only reviewers were given the complete diff and no hint of what to expect, divided
by specialty: financial arithmetic and event ordering; SQL, concurrency and database security;
wallet identity, authorization, API and UI; Quick product-boundary regression; and test vacuity and
mutation quality. Three had a throwaway PostgreSQL and drove the real code against the real
migration; one built a `RewardsStorePort` over it so the production functions executed against real
PL/pgSQL; one ran its own mutation campaign against a HEAD-identical copy of the tree.

**They found nineteen further defects, six of them introduced by the repairs in §3.** That is the
point of the round, and it is recorded plainly rather than summarised away.

### Introduced by the §3 repairs, and now fixed

| # | Finding | Disposition |
|---|---|---|
| R1-1 | **The staff `redeem` refusal ran after the money moved.** The new `payment_record_already_net_of_credits` guard sat *after* `reserveCreditsForPurchase` AND `commitReservedCredits`: by the time it returned 409 the customer's balance was $50.00 lighter and the hold said `committed`, while staff saw "not applied" and charged the counter price in full. The same error this change set fixed for the refund queue, repeated one file away. | Moved above the reserve. Pinned by an ordering assertion against the reserve *and* the metadata write. |
| R1-2 | **A transient commit failure charged the customer twice.** `accrueUnfundedRedemption` fired on ANY commit failure, including one where the hold was still `reserved` and the credits had never left `reserved_cents`. It then accrued a debt for the full amount AND force-finalised the hold — taking it out of the expiry sweep's reach. $399.00 taken for a $199.50 obligation, self-correcting never. | The function now refuses a hold that is still live (`hold_still_live`), and the caller reports a retryable failure. A debt is recorded only for a hold that has already gone back and cannot be re-taken. |
| R1-3 | **The membership check orphaned customers who never had a membership.** `resolveWalletOwnerForPayment` binds a payer to a business wallet through a staff-verified `business_external_links` row with no membership involved. Asking "is there an ACTIVE membership" severed those bindings: the customer's own wallet read returned **$0.00** while their balance sat in the business wallet, their checkout could not resolve a wallet at all, and a staff correction failed with a raw duplicate-key 400 — while their earnings kept landing in the business wallet. Earn and spend split across two wallets, which is exactly what the binding exists to prevent. | The question is now "was it REVOKED": the binding ends only when a membership row exists for that exact pair and none of its rows is active. No row at all means nothing was revoked. |
| R1-4 | **Credits were refused on 100% of the surface that offers them**, and the control still showed a discount. `servicios_base_monthly` is the only package that mounts the credits panel and it is a monthly subscription, so every request the panel could produce was refused — after the customer had read a green "Credits applied $199.50 · Remaining to pay $199.50". | The panel no longer mounts on a recurring plan and says so in its place; the server's `not_available_on_recurring_plan` now reaches the customer instead of a generic failure. **The feature is therefore off at launch for the web checkout — see §9.1.** |
| R1-5 | **A re-filed restoration lost the control that could settle it.** The screen classified restoration work by a reason-string prefix, and the re-file after a failed staff attempt used a different reason. The row then rendered as an ordinary chargeback whose every button closes it having moved nothing. | The classification is computed on the SERVER and sent to the screen; the API refuses an outcome that contradicts the row; every re-file keeps the prefix. |
| R1-6 | **A restoration that moved nothing was reported as success.** `nothing_was_reversed` — the ORDERING case the row was filed for — returned 200 with `movedCents: 0` on an already-claimed row. The screen printed a green "Restored $0.00"; the clawback landed minutes later and no key would ever restore it. | A restoration that moved nothing re-files the work and returns a refusal. `already_restored` remains the genuine no-op. |

### Pre-existing, found by the round, and now fixed

| # | Finding | Disposition |
|---|---|---|
| R1-7 | **The queue filed a per-event amount into a cumulative field.** The resolver reads that column as the rail's cumulative position, so a second $50.00 refund of a $100.00 payment computed `max(0, 5000 − 5000) = 0`, moved nothing, returned 200, closed the row as `reversed`, and burned `reverse:refund:<id>` with a zero-amount row so the real delivery could never fix it. 450 credits written off with an audit row saying the opposite. | The row's `external_ref` says which it is: present → one event's own amount; absent → the rail's cumulative position. |
| R1-8 | **One transient error burned a refund's idempotency key permanently.** The basis-recording branch wrote a zero-amount row under the event's own key for ANY failure. Its justification — "the customer already spent the credits" — is no longer reachable, because a clawback that outruns the wallet now becomes debt rather than a refusal. So the branch fired only on infrastructure errors, which is precisely where burning the key is fatal: a fully refunded $100.00 payment kept its entire 900-credit award, and the queue could not settle it either. | Reached only for a named balance refusal. Everything else returns retryably with nothing written. |
| R1-9 | **The migration could not be applied over its own previous version.** `external_ref` was added inside `CREATE TABLE IF NOT EXISTS` (a no-op on an existing table), and `CREATE OR REPLACE` with a new parameter creates a SECOND function rather than replacing the first — leaving two `leonix_rewards_post_entry` overloads, where a twelve-argument call silently resolves to the one WITHOUT the compare-and-swap and the payment ceiling. | Upgrade-safe `ALTER`s for the column, the outcome CHECK and the dedupe index; the previous 12-argument signature is explicitly dropped; `COMMENT ON FUNCTION` names its signature. Proven by applying the committed previous version and then this one over it. |
| R1-10 | **`entry_seq` was backfilled in HEAP order.** `ADD COLUMN ... DEFAULT nextval(...)` has a volatile default, so PostgreSQL rewrites the table and assigns the sequence in physical order — and the replay sorts by `entry_seq` FIRST. A ledger stored in a different order from the one it was written in replayed to `pending -600` and the recompute refused a wallet that was perfectly consistent. The `UPDATE` that was supposed to fix this was also dead code the append-only trigger would have refused. | The column is added empty, filled in `ORDER BY created_at, id` with the trigger stood down for that one statement, and only then given the default and the NOT NULL. |
| R1-11 | **`redeem_reserve` was the one movement that never claimed its redemption row.** Reserving 3000 against a row that says 500 stranded 2500 cents for ever: commit and release both demand the row's amount, so neither could free them, and the replay agreed with the cache so no reconciliation would surface it. | It now claims the row exactly as a commit or a release does — same lock, same wallet check, same exact-amount check — after the two policy refusals, so a customer paused by a debt still gets told that. |
| R1-12 | **The payment-scoped ceiling was not wallet-scoped.** A reversal aimed at the wrong wallet was accepted: it invented recovery debt on a wallet that had earned nothing and burned the payment's budget so the correct reversal could never be posted. | `AND l.wallet_id = p_wallet_id` on all three sums. |
| R1-13 | **The two restoration bounds each depended on the other.** The per-dispute bound never subtracted what that dispute had already given back, so the payment-wide bound was the only thing stopping a double restoration — and deleting it created 450 credits from nothing with every other guard intact. | The per-dispute bound nets off its own restorations and stands alone. Both are now separately exercised by the SQL suite, and a mutation of either is caught. |
| R1-14 | **The compare-and-swap was opt-out by default.** `DEFAULT NULL` disabled it, making the safe value the one a future caller has to remember to pass — and without it the original over-reversal reproduces exactly. | Mandatory for all three position-dependent types with a non-zero amount. Zero-amount basis rows remain exempt. |
| R1-15 | **`TRUNCATE` emptied the append-only ledger**, cascading to the redemptions and the staff queue. The row-level trigger sees neither `TRUNCATE` nor its cascade. | A `BEFORE TRUNCATE` statement trigger, and the privilege revoked from `service_role`. |
| R1-16 | **The replay's negative-bucket refusal only fired after the loop**, so a bucket that dipped below zero and was brought back up by a later entry — the actual signature of an out-of-order ledger — was invisible. | Checked inside the loop, naming the `entry_seq` and entry type it broke on. The TS mirror gained the same refusal, which it did not have at all. |
| R1-17 | **The Quick lifecycle migration's new post-condition had a false positive and a false negative.** It matched constraint TEXT: `payment_status = ANY (...)` contains the substring `status = ANY`, so an unrelated column aborted a migration that had in fact succeeded; and a surviving constraint written as `status = 'a' OR status = 'b'` was invisible — the dead-control outcome the block exists to prevent. | It now EVALUATES rather than parses: each single-column CHECK on the status column is recreated on a one-column temporary table and the candidate value inserted under a savepoint. Verified against seven schema shapes — IN, OR, single-value, unrelated `payment_status`, multi-column conditional, a differently-named survivor, and the happy path. |
| R1-18 | **The redelivery path never settled the credits.** The already-paid branch, taken on every Stripe redelivery, did not commit; a first delivery whose commit threw was never retried and the expiry sweep handed the credits back to a customer who had paid the reduced price. | It commits there too, idempotently through `commit:<ref>`. |
| R1-19 | **The CSV importer kept the resolver bug the admin route had just lost** — `{ kind: "user" }` verbatim, bypassing the canonical binding. | Routed through `resolveWalletOwnerForUser`, like every other staff surface. |

Also fixed from the same round, at MEDIUM: a staff-typed refund id already spent on a *different*
payment is refused before the claim (it poisoned a globally unique key and silently cancelled
another customer's clawback); `requeued` reports the actual result of the re-file; a queue row
resolved between a failed insert and the dedupe lookup is re-filed rather than lost; the two rewards
screens now require the same authority their API does, instead of being a visible dead end for
`can_view_payments` staff; and non-finite money inputs are coerced before they reach the arithmetic.

### What the round found in the TESTS, which mattered as much

The vacuity reviewer ran its own mutation campaign and defeated several checks **without changing
behaviour** — a reformat turned them red, and a genuine defect left them green. Every one is closed:

- **The "two concurrent sessions" proof was vacuous.** The racing session's output was captured
  inside a background subshell (so the parent never saw it), then overwritten by a second,
  *sequential* call; the holding session's exit code was written to a file nobody read. Deleting the
  hold entirely still printed "refused after queueing on the wallet lock". It now writes every
  result to a file, reads every exit code, and **times** the racing call — a reserve and a recompute
  each measurably queue ~3s on the lock. Verified to FAIL under the exact mutation that defeated it.
- **`Q12`'s generator was broken by floating-point precision.** `state * 1103515245` reaches ~2^62
  as a double, so the low bits were rounded away: `rnd(4)` returned 0 forty times running. The
  randomised replay test reached **two of thirteen** replay arms — while being the sole
  justification for writing the replay mirror separately from the posting mirror. Fixed with
  `Math.imul`, given a deterministic debt-and-repayment fixture, and now censused: it asserts by
  name that each of eight arms was actually posted.
- **The mutation harness's own matcher was a substring search.** `expect: ["C"]` is one character,
  and one mutation's output satisfied the `expect` of seven others. It now anchors on `✗ <check>:`
  and `FAILED: <assertion> `, validates that every expected name exists before running, and
  verifies the tree in the `finally` rather than on a path three `continue`s could skip.
- **Six SQL replay arms and the staff-debit draw order were only textually covered**, and a
  consistent change to both SQL CASE blocks defeats the textual comparison outright. All are now
  executed.
- **`R1`, `R7`, `P8` and `R6` asserted literals, not guards** — `if (false)` left them green. They
  now assert the conditions, and the four bypasses the reviewer used are mutations in the harness.

The harness grew from 22 mutations to **45**, and two of the original 22 revealed genuine holes on
their first run (the promotion rule was unreachable from any test because the sweep is driven with
an injected predicate; the SQL replay's debt-repayment arm had no covering case). Both are closed.

---

## 4. Multi-payment proof (adversarial area A)

The documented residual — "a reversal takes pending first, and pending is one bucket shared by every
payment" — was reproduced and then bounded.

**What is true:** a clawback on payment C does consume payments A and B's pending credits, `recovery_cents`
is understated as a result, and A's promotion can be skipped or partially burned. Reproduced with
$100.00 + $100.00 pending and a $200.00 spent-and-refunded third payment: A and B's 1800 pending
absorbed C's clawback and `recovery_cents` stayed 0 where 1800 was owed.

**What is also true, and is what certification rests on:** the outcome is value-neutral for both
parties, in every sequence tested. The bucket model is a single pool, so the credits C's clawback
took from A and B are the same credits the correct model would have frozen behind a recovery debt.
`Q11` asserts this as a **property over randomised event streams** — 40 trials, half delivered
concurrently — in the form that actually matters:

> for every payment, `Σ(refund_reversal + chargeback_reversal) − Σ(reversal_restoration) ≤ that payment's award`

That per-payment invariant is the one B1, B2 and B3 each violated, and it is now enforced by the
database rather than asserted by the application. `Q12` separately replays 25 randomised streams and
requires the replay to reproduce the live wallet on all ten money fields.

**What is not claimed:** per-payment attribution inside the buckets is not exact, and the system does
not pretend otherwise. §8 records the limit and its blast radius.

---

## 4b. Financial scenario matrix

Every row is exercised by a named check. `Q*`/`R*`/`S*`/letter codes are check names in
`scripts/verify-ix-rewards-behavior-01.ts` and `scripts/sql/verify-ix-rewards-sql-behavior-01.sql`.

### Earning

| Scenario | Expected | Proven by |
|---|---|---|
| Eligible settled card payment | 9% of net, PENDING | `A1`, `A7` |
| Eligible cleared manual payment | 9% of net, AVAILABLE | `A6`, `A8` |
| Payment part-funded by credits | earns on the NET only; credits never earn credits | `A3`, `A5` |
| A record already net of credits | not double-subtracted | `A7`, `R8` |
| Unsettled, wrong source, excluded category, zero net | earns nothing, by name | `A4`, `A5` |
| Guest / unattributed payment | no wallet, no credits, no backfill | traced in §3, `P15` |
| Earn landing on an outstanding debt | repays the debt FIRST; only the remainder is spendable | `S3`, `S8`, `Q12` |
| Split payment | `earn(a) + earn(b) ≤ earn(a+b)` — splitting cannot manufacture credits | `A2` |

### Reversal

| Scenario | Expected | Proven by |
|---|---|---|
| Full refund | the whole award comes back | `B1`, `S4` |
| Partial refund | exactly proportional, rounded down | `B2`, `B3` |
| Sequence of partial refunds | converges on the exact total, no per-step rounding drift | `B4`, `B5` |
| Out-of-order delivery | same total whatever the order | `B5` |
| Duplicate delivery of one refund | moves money once; the replay reports zero moved | `D1`, `Q5` |
| Refund + dispute on one payment | the money returned is accounted for once | `Q3`, `S4` |
| Clawback the wallet cannot cover | becomes recovery debt; no bucket goes negative | `B12`, `S3` |
| Reversal beyond the payment's award | refused at the database | `S4` |
| Reversal aimed at the wrong wallet | refused; no debt invented; the payment's budget survives | `S5` |
| Two concurrent reversals | land on exactly the sequential answer | `Q1`–`Q3`, `Q6` |
| A reversal that cannot be posted | nothing written, key not burned, work queued | `Q15`, `R6` |

### Dispute and restoration

| Scenario | Expected | Proven by |
|---|---|---|
| Dispute created | claws back like a refund, keyed on the DISPUTE | `B9`, `S5` |
| Dispute lost | the clawback stands; nothing further moves | traced in §3 |
| Dispute WON | restores exactly what THAT dispute took | `Q4`, `S5` |
| Payment with two disputes, one won | restores only the won one's clawback | `Q4`, `S5` |
| A dispute restored twice | refused, by the per-dispute bound alone | `S5` |
| Two won disputes delivered concurrently | each gives back its own, once | `Q4b` |
| Duplicate `dispute.closed` | restores zero and says so | `P19`, `Q4` |
| A refund's clawback restored by a dispute | refused | `S5` |
| Restoration beyond the wallet's whole clawback history | refused | `S5` |
| A debt repaid out of earnings, then the dispute won | the restoration is still honoured | `S5` |
| Won dispute, then a legitimate refund | the refund basis is correct; only what was lost is taken | `S5` |
| `closed(won)` before `created` | restores nothing and files staff work | `P19`, `R6` |
| A won dispute's residual | promotes; nothing is stranded | `R4` |

### Redemption

| Scenario | Expected | Proven by |
|---|---|---|
| Preview | writes no ledger entry and no redemption row | `N2`, `F1` |
| Reserve | available → reserved, under the row lock | `C8`, `S7` |
| Commit after payment | reserved → spent, in one statement | `C8`, `S7` |
| Release / 30-minute expiry | the hold returns to available | `I1`–`I3`, `S7` |
| Commit after the hold expired | ONE re-debit out of available | `S7`, `R3` |
| Re-debit the balance cannot cover | recorded as recovery debt; the hold finalised | `R3` |
| Transient commit failure with the hold still live | retryable; NO debt, nothing finalised | `R3` (`hold_still_live`) |
| Duplicate `checkout.session.completed` | commits once | `D4`, `S7` |
| Commit vs release, commit vs expiry sweep | exactly one settlement | `Q8`, `Q9`, `S7` |
| Two checkouts racing one balance | one wins; timed on the real lock | `Q7`, runner |
| Below $1.00 / above 50% / below the rail floor | refused or capped, server-side | `C2`, `C3`, `C5`, `Q3b` |
| Purchase larger than what is still due | the residual cap binds, leaving the rail's floor | `Q3b` |
| Redemption while a debt is outstanding | refused by name | `S3`, `R3` |
| Credits on a recurring plan | refused, explained, control not shown | `R2`, `P9` |

### Identity, staff and replay

| Scenario | Expected | Proven by |
|---|---|---|
| Reversal or restoration after ownership would resolve elsewhere | lands on the wallet the earn credited | `Q16` |
| Membership revoked after binding | the business binding ends; a personal one never does | `R7` |
| Bound through a staff-verified payment link, no membership | the binding STANDS | `R7` |
| Staff correction by user id | resolves through the canonical binding | `R8` |
| Staff adjustment reference reused on another wallet | refused by name | `B16` |
| Staff outcome contradicting the queue row | refused | `P8` |
| Refund id already spent on another payment | refused before the row closes | `P8` |
| Recompute after any sequence | reproduces the live wallet on all ten fields | `Q12`, `S8` |
| Recompute of an inconsistent ledger | refused, naming the entry | `Q12b`, `S8` |
| Twelve entries in one millisecond | replay follows `entry_seq` | `Q13`, `S9` |

---

## 4c. Where each mandated adversarial area is answered

The mission named nine areas. This is the index; each cell points at executable evidence, not prose.

| Area | Question asked | Answered in | Executable evidence |
|---|---|---|---|
| A | Multi-payment reversal attribution | §4, §10 | `Q11` (40 randomised streams, per-payment ceiling), `Q6`, `S4`, `S5` |
| B | Concurrency and locking; the cumulative read outside the lock | §5 | `Q1`–`Q3`, `Q6`–`Q9`, `Q10`; runner's two timed cross-session races |
| C | Replay and deterministic recomputation; not `created_at` alone | §6 | `Q12`, `Q12b`, `Q13`, `S8`, `S9` (`entry_seq`) |
| D | Restoration bounds | §4b "Dispute and restoration" | `Q4`, `Q4b`, `S5` (per-dispute bound standing alone: mutations #36, #37) |
| E | Canonical wallet identity | §4b "Identity, staff and replay" | `Q16`, `R7`, `R8`, `B16` |
| F | Refund / dispute resolution queue | §3b, §4b | `R6`, `P8`, `P19`, `R5` |
| G | Redemption 30-minute lifecycle | §4b "Redemption" | `C8`, `I1`–`I3`, `R3`, `Q7`–`Q9`, `S7` |
| H | Quick boundary regression | §12 regression sweep | five Quick/revenue verifiers re-run at both SHAs, byte-identical outcomes |
| I | Migration safety, without applying either migration to any hosted database | §8 | both migrations executed twice against a throwaway local PostgreSQL 16; `verify-ix-rewards-sql-behavior-01.sh` (142 assertions), seven synthetic schema shapes for the Quick parity block |

Area A is the one place where the answer is a bound rather than an exactness claim, and §10 states the
residual in the same words used here rather than softer ones.

---

## 5. Concurrency and lock analysis (adversarial area B)

Every financial decision is now either taken under the wallet row lock or protected by an atomic
database constraint evaluated under it.

| Operation | What serializes it | Proven by |
|---|---|---|
| Two reserves for one balance | `SELECT … FOR UPDATE` on the wallet, then an explicit over-redemption refusal | `Q7` (in-process) and the runner's **two real psql sessions**: the second queues on the lock and is refused by name; the wallet ends `400/600` |
| Commit vs release of one hold | `leonix_rewards_claim_redemption` locks the redemption row and advances its status in the same statement | `Q8`, SQL `S7` |
| Expiry sweep vs commit | same row lock; a late release finds a status that no longer permits it | `Q9`, SQL `S7` |
| Two reversals on one payment | compare-and-swap on the payment's reversal-row count **plus** the payment-scoped ceiling, both computed inside the wallet lock | `Q1`–`Q3`, `Q6`, SQL `S4`, `S6` |
| Refund vs dispute on one payment | same | `Q3` |
| Two restorations | same, plus the per-dispute bound | `Q4`, `Q4b`, SQL `S5` |
| Promotion vs reversal | the `earn_promote` idempotency key, and the promotion's clamp to live pending | `Q11`'s randomised streams |
| Earn vs a clawback that creates debt | the wallet lock; the debt is folded into the same statement that writes the reversal row | `Q10` |
| Two staff resolutions | `UPDATE … WHERE id = $1 AND status = 'open' RETURNING id` — one row-locked compare-and-set | `P8` ordering assertions |
| Duplicate ledger insert | `UNIQUE(idempotency_key)`, with the posting function unwinding and returning the winner's row | SQL `S1` |

**Why a compare-and-swap rather than a longer lock.** The Supabase client cannot hold a transaction
across round trips, so a session-level advisory lock would not actually lock. The ledger is
append-only, so the count of a payment's reversal-family rows only ever grows: equality between what
the caller measured and what the posting statement sees means nothing about that payment changed in
between. The token is read **before** the sums it vouches for, which is what makes it safe — a
competitor that commits afterwards changes the count and the post is refused; one that committed
before is reflected in both.

**Why the ceiling alone was not enough.** It was tried first and the suite caught it: two concurrent
partial refunds at cumulative 2500 and 5000 of a $100.00 payment both stay under the 900-credit
award and still sum to **675** where 450 is owed, because the smaller delta was computed against a
position the larger had already advanced. Both layers are kept — the CAS for correctness, the ceiling
as the bound that holds even if a caller omits the token.

**Deadlock.** The lock order is always wallet → redemption, in one function, so two callers cannot
take them in opposite orders.

---

## 6. Recomputation and replay (adversarial area C)

- **Ordering is `entry_seq`, drawn from a sequence inside the wallet lock**, not `created_at`. The
  column is `NOT NULL` with a `nextval` default, so no writer can opt out of the canonical order.
- **The in-memory store's replay used to disagree with SQL on all three sort keys.** It ordered by
  `createdAtMs` with the synthetic id as tie-break, and the ids are strings: `e10` sorts before `e9`.
  Past nine entries sharing a millisecond — which most fixtures produce, since the clock is frozen —
  the mirror replayed a history that never happened. Fixed: the store now records an `entrySeq` and
  sorts on it. `Q13` pins it with twelve entries sharing one timestamp.
- **The replay mirror is now written independently of the posting mirror.** `recompute()` used to call
  the same `deltasFor` that `postEntry` calls, so every "parity" check asserted `f(x) === f(x)` and
  could not fail. `replayInto` is a separate transcription, in the replay's own running-total shape.
- **The real SQL replay is executed.** `S8` builds a history with promotion, reserve, commit,
  chargeback, negative adjustment and restoration and requires `leonix_rewards_recompute_wallet` to
  reproduce the live wallet on all ten fields; a second `S8` case does the same for an earn landing
  on an outstanding debt — the case a mutation proved was missing. `S9` does it again with every row
  sharing one `created_at`, so only `entry_seq` can order them.
- **Legacy/pre-sequence rows cannot exist**: this migration creates the table and the column is
  `NOT NULL` from the start. The `NULLS FIRST` in the replay's ORDER BY is therefore dead but
  harmless, and is kept because the migration is written to be re-appliable.

---

## 7. Parity: SQL, TypeScript, adapter, store

| Rule | SQL posting | SQL replay | TS core | Adapter | In-memory store |
|---|---|---|---|---|---|
| Bucket deltas per entry type | `leonix_rewards_post_entry` CASE | `leonix_rewards_recompute_wallet` CASE | (derives none — SQL decides) | passes through | `deltasFor` |
| Replay arithmetic | — | as above | — | — | `replayInto` (independent) |
| Payment-scoped reversal ceiling | ✅ | n/a (replay) | computes a conforming delta | maps `LX001` | ✅ |
| Per-dispute restoration bound | ✅ | n/a | ✅ `thisDisputeTookCents` | — | ✅ |
| Compare-and-swap token | ✅ `p_expected_position_rows` | n/a | reads the count first | `countPaymentPositionRows` (returns **-1** on a read failure, which can never equal a real count, so a failed read always refuses) | ✅ |
| Entry-type vocabulary | CHECK + CASE | CASE | union type | — | `deltasFor` + `replayInto` |
| Non-negative buckets | CHECK + named refusals | refuses on a negative replay | — | maps to `negative_balance_refused` | modelled |
| Redemption status gate | `leonix_rewards_claim_redemption` | n/a | — | `fromAnyStatus` honoured | modelled |

Enforced structurally by `J4` (SQL posting vs SQL replay, arm by arm, comparing the assigned
expression and not merely the presence of a name), `P4c` (entry-type vocabulary across CHECK, CASE
and store), `Q14`/`Q15` (the new bounds in SQL, the store mirror and the adapter's error mapping),
and `S12` (every type the CHECK admits is reachable through the posting function, executed).

---

## 8. Migration safety

Neither migration has been applied to any remote Supabase project. Both were applied to a
**throwaway local PostgreSQL 16 cluster created for this review and destroyed afterwards**, which is
the only way the statements below could be established.

`20260921120000_leonix_ix_rewards_foundation.sql`

- Applies cleanly, and applies **twice** cleanly (the runner does this every time).
- Additive: it creates its own four tables and touches no existing one.
- Function security: every `SECURITY DEFINER` function pins `search_path = pg_catalog, public, pg_temp`
  and schema-qualifies its identifiers — asserted by executing a catalog query (`S11`), not by grep.
- Grants: `anon` cannot read any table; `authenticated` may `SELECT` under RLS and can never write;
  `PUBLIC`, `anon` and `authenticated` cannot `EXECUTE` the posting, recompute or claim functions;
  `service_role` can. The staff refund queue is revoked from every browser role. All executed.
- RLS enabled on all four tables with **no write policy of any kind**.
- The ledger is append-only, enforced by trigger; a direct `UPDATE`, `DELETE`, duplicate
  idempotency key, or negative bucket write is refused (`S10`). `TRUNCATE` — which no row trigger
  sees — is refused by a statement trigger *and* revoked from `service_role`, so the one command
  that could erase the whole financial history in a single statement now fails twice over.
- Lock order is wallet → redemption, in one function.
- Entry-type vocabulary is closed and complete: every value the CHECK admits has a delta arm, proven
  by calling the function once per type.
- **Signature change:** `leonix_rewards_post_entry` gained a thirteenth parameter with a default.
  The `REVOKE`/`GRANT` statements name the new argument list. Re-applying replaces the function
  rather than creating an overload, and the executed grant assertions run after two applies.

`20260920120000_quick_business_lifecycle_capability_parity.sql`

- Applies cleanly and twice cleanly; both changes are pure CHECK widenings; no table is created.
- **Repaired this round** — see M5. It now proves its own post-condition and fails loudly, before
  commit, if a differently-named constraint survived the drop.

---

## 9. Owner decisions required

These are product-policy choices, not defects, and they were not made unilaterally.

1. **Credits on recurring plans.** B5 is closed by refusing credits on `subscription` mode. Enabling
   them properly needs a per-checkout Stripe `amount_off`, `duration: "once"` coupon — the mechanism
   the verified-intro discount already uses — plus a rule for what happens when a server-attached
   coupon is already present (Stripe permits one coupon per session). That is new live-payment-rail
   integration code, which this round would not have been able to validate without live Stripe
   calls, so it is recorded as unbuilt rather than half-built.
2. **The 50% ceiling's base.** A1: half of the pre-promo subtotal, or half of what is actually due?
   The current behaviour is deliberate and documented; with a 50% promo it leaves the customer paying
   $0.50 cash.
3. **The office/manual redeem's purchase amount.** A2: should it be bounded by the payment record
   when one is supplied, rather than typed?

---

## 10. Remaining limitations and blast radius

| Limitation | Blast radius |
|---|---|
| Per-payment attribution inside the shared buckets is approximate (A6). | Wallet totals are correct and the per-payment ceiling is enforced; what is imprecise is which payment a promotion or a clawback consumed. Visible only in a per-payment reconciliation, never in a customer's balance. |
| Credits do not apply to recurring plans (§9.1). | A customer on a monthly plan cannot spend credits on it. They keep the balance and are told why. |
| An `invoice.paid` with no `billing_reason` skips the earn without queueing (A4). | The customer loses 9% of one renewal, recorded in the audit log as retryable. Needs an earn-gap queue. |
| No automatic wallet merge (locked policy). | A customer with two identities keeps two balances. Staff correction is the path. |
| Guest payments do not earn and get no backfill (locked policy). | Confirmed by tracing the code: no wallet is created and no credits are minted. |
| The production build was not run. | See §12 — the required public Supabase variables are not available in this environment. Recorded once, not looped. |
| No PL/pgSQL has run against the real project. | By design and by instruction. Everything in §8 is from a local throwaway cluster; the schema of the real project is not known to this review. |

---

## 11. Mutation table — which test catches which defect

`npx tsx scripts/verify-ix-rewards-mutation-01.ts` reintroduces each defect into the real source
file, runs the suite, requires a NAMED check to fail, restores the file byte-for-byte, and requires
the suite to pass again. It refuses to report success if any mutation survives.

The harness carries **45** mutations. They fall into four groups, and the groups matter more than
the individual rows:

1. **The original repairs** (#1–15) — each money defect from §3, put back.
2. **Defects a mutation review proved were uncovered** (#16–22) — the rail-minimum residual cap, a
   rejected manual payment, the replay mirror's refusal and three of its arms, the position token
   read out of order, and the key-burning branch.
3. **The bypasses that defeated the textual checks** (#23–28) — each keeps every literal and every
   ordering the old assertion matched and removes the effect anyway.
4. **The SQL engine** (#29–45) — executed against real PL/pgSQL.

| # | Defect reintroduced | Caught by |
|---|---|---|
| 1 | A stale reversal delta is posted without recomputing | `Q1`, `Q2`, `Q3` |
| 2 | The compare-and-swap token is not sent | `Q6` |
| 3 | A won dispute restores the payment's whole clawback | `Q4` |
| 4 | A reversal is posted to the wallet ownership resolves to today | `Q16` |
| 5 | An unfunded settled purchase leaves the hold re-debitable | `R3` |
| 6 | The earn rate drifts from 9% | `A1` |
| 7 | The $1.00 redemption floor is removed | SECTION C |
| 8 | The 50% ceiling is raised to 90% | SECTION C |
| 9 | A won dispute never lets the payment promote again | `R4`, `H8` |
| 10 | An unreadable ledger is treated as a clean payment | `H8` |
| 11 | The checkout wallet comes from the request body | `R1` |
| 12 | Credits reduce a recurring line item | `R2` |
| 13 | A queue row is closed before the refund id is validated | `P8` |
| 14 | A failed reversal of an attributable refund is discarded | `R6` |
| 15 | A removed member keeps the business wallet | `R7` |
| 16 | SQL: a payment gives back more than it awarded | `S4` |
| 17 | SQL: a won dispute restores another dispute's clawback | `S5` |
| 18 | SQL: the compare-and-swap is not enforced | `S6` |
| 19 | SQL: redemption is allowed while a debt is outstanding | `S3` |
| 20 | SQL: the replay credits the full earn and discharges the debt | `S8` |
| 21 | SQL: a late release can undo a commit | `S7` |
| 22 | SQL: the posting function becomes callable from a browser session | `S11` |
| 23 | The rail-minimum residual cap is removed | `Q3b` |
| 24 | A payment a person REJECTED still promotes | `R4` |
| 25 | The replay mirror accepts a ledger the database would refuse | `Q12b` |
| 26 | The replay mirror's earn arm credits the full amount and discharges the debt | `Q12`, `J1`–`J3`, `P6` |
| 27 | The replay mirror does not return a released hold | `Q12`, `J1` |
| 28 | The position token is read after the sums it vouches for | `Q1`, `Q6` |
| 29 | An infrastructure error burns the refund's key | `Q15` |
| 30 | The checkout's verified identity is poisoned at its SOURCE | `R1` |
| 31 | The binding revocation check is called and its result discarded | `R7` |
| 32 | The queue's refund-id guard is disabled, message and ordering intact | `P8` |
| 33 | A restoration that moved nothing is reported as a success | `P8` |
| 34 | The queue accepts an outcome that contradicts the row | `P8` |
| 35 | A per-event amount is passed back as a cumulative position | `P8` |
| 36 | SQL: the payment-wide dispute-restoration bound is deleted | `S5` |
| 37 | SQL: the per-dispute bound stops netting its own restorations | `S5` |
| 38 | SQL: the staff-debit draw order flips to pending-first | `S8` |
| 39 | SQL: the replay does not return a released hold | `S8` |
| 40 | SQL: the replay forgets a standalone recovery debt | `S8` |
| 41 | SQL: the reversal ceiling stops being wallet-scoped | `S5` |
| 42 | SQL: a reserve stops claiming its redemption row | `S2` |
| 43 | SQL: the ledger becomes truncatable | `S10` |
| 44 | SQL: the compare-and-swap becomes opt-out again | `S10` |
| 45 | SQL: the replay's refusal moves back to the end of the loop | `S8` |

Two mutations **survived** on the first run and both were real holes in the tests, now closed:

- the promotion rule was unreachable from any test, because the sweep is driven with an *injected*
  eligibility predicate and never called the real one. The decision was extracted into a pure
  `isPaymentPromotableFromFacts` and is asserted directly (#9, #10).
- the SQL replay's debt-repayment arm had no covering case, because every existing scenario had
  `recovery_cents = 0` at the time of the earn. `S8` gained the missing case (#20).

A further **five survived** when the harness was expanded after Round 1 — a stale anchor, two
mirror mutations the checks were too weak to catch, an SQL failure the matcher could not attribute
to its section, and a mis-targeted edit. Each was fixed by strengthening the check rather than by
softening the mutation, and the final run catches all 45.

---

## 12. Commands and exit codes

Run at the final committed state. `PGHOST`/`PGPORT`/`PGUSER` point at a throwaway local cluster.

| Command | Exit |
|---|---|
| `npx tsx scripts/verify-ix-rewards-behavior-01.ts` — 182 behavioural checks | 0 |
| `bash scripts/verify-ix-rewards-sql-behavior-01.sh` — 142 in-session assertions + 2 **timed** cross-session concurrency proofs, against real PostgreSQL 16.13 | 0 |
| `npx tsx scripts/verify-ix-rewards-mutation-01.ts` — 45 defects reintroduced, each caught by a named check | 0 |
| `npx tsx scripts/verify-quick-product-boundary-01.ts` — 52 checks | 0 |
| `npx tsx scripts/verify-quick-business-core-01.ts` | 0 |
| `npx tsx scripts/verify-quick-lifecycle-media-behavior-01.ts` — 35 checks | 0 |
| `npx tsx scripts/verify-revenue-os-stripe-golden-contract.ts` | 0 |
| `npx tsx scripts/verify-revenue-write-security-hardening-01.ts` — 11 checks | 0 |
| `npx tsc --noEmit --incremental false` (with the generated `next-env.d.ts`) | 0 |
| `npx tsc --noEmit --incremental false` (fresh clone, no `next-env.d.ts`) | 2 — see below |

**TypeScript.** `npx tsc --noEmit --incremental false` exits **0** with `next-env.d.ts` present,
and **2** without it. That file is generated by `next dev`/`next build`, is gitignored, and does not
exist in a fresh clone of this repository; its absence produces exactly twelve `TS2307` errors for
image imports (`…/logo.png` and one branding asset), identical at the starting SHA and unrelated to
any file in this change. Writing the three-line standard file — which is what any `next build`
produces — makes the check exit 0. **Zero diagnostics anywhere in the certified code, in either
case.** Both numbers are stated rather than the flattering one alone.

**Production build:** NOT RUN. It requires public Supabase environment variables that are not
present in this environment. Recorded once as an environmental limitation; it is not claimed to
have passed.

### Regression sweep vs the starting SHA

Nineteen verifiers were run in a pristine worktree at `fe5df09f0` and again at the final SHA, and
their exit codes compared. **No verifier that passes at the starting SHA fails at the final one,
and none that fails at the starting SHA was made to pass by weakening it.**

| Verifier | Start | Final |
|---|---|---|
| quick-classifieds-interaction-02, quick-classifieds-proof-matrix-03, quick-business-core-01, quick-business-proof-matrix-02, quick-product-boundary-01, quick-lifecycle-media-behavior-01, quick-convergence-behavior-01, quick-print-bundle-access-02, quick-assisted-operations-01, quick-full-gates-04, quick-final-all-program-proof-01, quick-final-ofertas-sweep-01, revenue-os-stripe-golden-contract, revenue-write-security-hardening-01 | 0 | 0 |
| quick-classifieds-onramp-01 | 1 | 1 |
| quick-business-access-level-01 | 1 | 1 |
| quick-remaining-families-01 | 1 | 1 |
| quick-upgrade-contract-05 | 1 | 1 |
| quick-simple-dashboard-03 | 1 | 1 |

**An earlier draft of this document said one verifier failed at both SHAs. Five do.** The correction
is recorded rather than quietly fixed, because a certification that rounds its own failures down is
not one. What they are:

- **onramp-01, business-access-level-01, upgrade-contract-05** — `git merge-base HEAD origin/main`
  and `git diff origin/main...HEAD` fail. This integration branch has **no merge base with `main`**
  (confirmed: `git diff fd9094994…HEAD` reports *no merge base*), and these verifiers compute a diff
  against it. A branch-topology limitation of this environment, not a product defect.
- **remaining-families-01** — asserts that only one Quick lifecycle migration may appear, and names
  `20260921120000_leonix_ix_rewards_foundation.sql` as the extra. That migration already existed at
  the starting SHA; the assertion is about the *set of migrations on the branch*, which this change
  does not alter.
- **simple-dashboard-03** — three assertions about the Quick doorway ("must not use supabase",
  "wording too", "routes; never renders a bare button"). Genuine, pre-existing, and entirely within
  Quick, which this change does not touch (the Quick regression review measured zero changed files
  under every Quick tree).

None was "repaired" here: fixing a Quick doorway assertion or teaching a verifier to tolerate a
missing merge base is outside this mission's scope and would be indistinguishable from weakening a
verifier to make a report green.

---

## 13. Prohibitions observed

- No migration applied to any remote Supabase project. Both migrations were applied only to a
  local throwaway PostgreSQL cluster created for this review and destroyed afterwards.
- No remote Supabase mutations. No Supabase MCP tool was called.
- No live Stripe calls. No Stripe MCP tool was called.
- No deployment and no Preview.
- No pull request created, changed or merged.
- The Quick, Rewards and `main` branches are untouched.
- No destructive git operation, no force-push, no history rewrite.
- No fabricated evidence: every number above came from a command run in this environment.
