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
independent reviewers found **nineteen more** (§3b), six of which the §3 repairs had introduced.
Round 2's two reviewers found **ten more** (§3c), three of them HIGH. Round 3's final reviewer —
who drove the real core against real PL/pgSQL, which neither suite did — found **eight more**
(§3d), including **a BLOCKER that Round 2's own repair had introduced**: a double clawback on a
real customer, in the one workflow the refund queue exists to make safe, which not one of the 426
checks then in place could see in either direction. Round 4 then verified Round 3 and found
**nine more** (§3e), including **two BLOCKERs that Round 3's own repairs had introduced** — a staff
write-off that creates credits when a dispute is later won, and a fixture so much shorter than a
real Stripe refund id that the double clawback could be put straight back with all four suites
green. Every one is repaired or, where repairing it would ship money-creating code, **removed**. Round 5
verified Round 4 and found **nine more** (§3f), two of them blind spots rather than defects: places
where a change that CREATES MONEY passed the entire certification, one of them in the authoritative
SQL engine, hidden behind test fixtures shorter than a real Stripe id.

That is the shape of this whole mission, said once: **every round's repairs introduced defects that
the round's own tests could not see — without exception, in five rounds.** Six of Round 1's
nineteen findings were mine; Round 3's BLOCKER was mine; both of Round 4's were mine; and Round 5
found two more of mine, one of which creates money inside the database function everything else
defers to. The only
reason none of them is in the shipped code is that each round's reviewers were given the complete
diff and told nothing had been fixed.

The honest conclusion to draw from that is not that the code is now finally correct. It is that
**a repair is not evidence, and the round that makes one cannot be the round that certifies it.**
Every claim in this document is therefore tied to a named check that an independent reviewer has
tried to defeat, and the two places where a check could not be built are said plainly (§3e, U10
and U11) rather than counted.

**The most important finding of the whole mission was about the tests.** Round 2's second reviewer
reintroduced nineteen defects — including two straight authorization bypasses, a doubled discount
charged to the rail and a quadrupled redemption ceiling — and every one of them passed the complete
certification, because the checks covering the HTTP layer read it as text. The same reviewer showed
nine pure renames turning checks red. §3c records what that cost and what replaced it.

Two structural changes carry this certification:

1. **The SQL money engine is proven by execution**, not by grep. The migration is applied to a
   throwaway local PostgreSQL 16, and 142 in-session assertions plus two genuinely concurrent,
   *timed* sessions exercise the posting function, the replay, the locks, the constraints and the
   grants.
2. **The HTTP layer is proven by execution too.** The route handlers are CALLED — the customer
   wallet read, the staff API, the CSV reconciliation and the customer checkout — against stubs the
   test drives, with a Stripe recorder in place of any call. 50 checks, no text matching.

The mutation harness reintroduces **87 defects** and requires a NAMED check to fail for each. Every
one of the nineteen that previously survived is now caught.

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

## 3c. Round 2 — two independent reviewers, and the worst finding of the round

Two fresh read-only reviewers were given the complete diff, the previous rounds' findings without
any suggestion that they had been addressed, and a throwaway PostgreSQL. One attacked money and
concurrency by driving the real `rewardsLedgerCore` against real PL/pgSQL; one attacked
authorization, the UI and — decisively — **the tests themselves**.

### The finding that mattered most

The second reviewer reintroduced **nineteen defects** into a verified copy of the tree and ran each
one through the complete certification: the behavioural suite, the SQL suite against real
PostgreSQL, and the mutation harness. **All nineteen passed.** The harness printed
`OK (45 defects reintroduced, each caught by a named check)` while, among others, these sat in the
tree:

| Reintroduced defect | Old result |
|---|---|
| The staff rewards API's authorization gate present but inert — a forged `leonix_admin=1` cookie reads any customer's balance and last 100 ledger rows | **survived everything** |
| `?as=<uuid>` on the customer wallet read — an unauthenticated IDOR on any balance and activity | **survived everything** |
| Twice the discount taken off what Stripe is asked to charge | **survived everything** |
| The 50% redemption ceiling quadrupled | **survived everything** |
| The queue claim's compare-and-set result ignored — two staff both move money on one row | **survived everything** |
| The compare-and-swap token pinned to a constant 0 | **survived everything** |
| The `hold_still_live` guard removed — a live hold becomes debt *and* a force-commit | **survived everything** |
| A CSV reconciliation bypassing the canonical binding | **survived everything** |

They also demonstrated the other half of it: **nine behaviour-preserving refactors** — pure renames
and reformats — turned checks RED. `Boolean(row.externalRef)` rewritten as
`row.externalRef !== null && row.externalRef !== ""` broke `P8`. Renaming a PL/pgSQL local broke
`Q14` while the SQL suite stayed green.

**Green for a hole, red for a rename.** Every one of those checks read the route files as text. A
certification resting on them certifies the spelling.

### What was done about it

The routes are now **executed**. `scripts/lib/tsconfig.harness.json` redirects exactly four
specifiers — `server-only`, `next/headers`, `@supabase/supabase-js` and
`@/app/lib/supabase/server` — onto stubs the test drives, plus `stripe` onto a recorder that
captures what the route asked Stripe to charge without making a call. Every module under
certification is the real one.

`scripts/verify-ix-rewards-route-behavior-01.ts` (35 checks) calls `GET /api/rewards/wallet`,
`GET`/`POST /api/admin/rewards`, `POST /api/admin/rewards/reconciliation` and
`POST /api/revenue-os/checkout`, and asserts the answers and the writes. The mutation harness now
carries **87 mutations, up from 45**, and **every one of the nineteen survivors is caught**, each by
a named check that fails for the defect and passes for the rename.

The one exception is recorded rather than quietly dropped: quadrupling the ceiling passed to
`reserveCheckoutCredits` alone was **measured to change no amount at all**, because
`planCheckoutCredits` has already capped the figure that reserve is asked for. It is defence in
depth, not an undetected defect, and the mutation that proves the 50% ceiling attacks the planning
call instead. The comment at that call site now says so.

### Money and authorization defects found, and repaired

Both reviewers independently found the first two.

| # | Finding | Severity | Demonstrated | Disposition |
|---|---|---|---|---|
| N1 | **A revoked business binding orphans the customer for ever.** `bound_user_id` is a GLOBAL partial unique index. Deciding the binding is revoked was not enough: while the business wallet still named the customer, their personal wallet could not be created, and the `23505` recovery re-read by `owner_user_id` — which finds nothing, because the collision was on the *binding* index. | **HIGH** | `INSERT` refused by `leonix_rewards_wallets_bound_user_idx` against the real migration. Every rewards path then failed: the earn is best-effort, so purchases succeeded and the 9% was never granted, on that payment and every future one; checkout could not resolve a wallet; a staff correction returned the raw duplicate-key string. The population hit is exactly the one the revocation rule was written for. | **Repaired.** Revocation now RELEASES the binding (compare-and-set on wallet and user), and `resolveWallet` survives a stale binding by creating the wallet unbound rather than returning a raw error. `Z6` proves it; `Z7` and `Z8` prove an active binding and a membership-less binding are untouched. |
| N2 | **A staff re-file turns a cumulative amount into a per-event one.** A failed resolution re-filed the row with `row.externalRef ?? refundExternalId`, attaching the typed id to a number it did not change — and `external_ref`'s presence is precisely what says the amount is per-event. | **HIGH** | $100.00 payment, 900 earned, first $25.00 refund reversed 225. A second $25.00 refund filed as cumulative 5000 and re-filed with an external ref reversed **675 instead of 450** — 225 credits clawed back that the customer still owned. On a spent balance the excess lands as `recovery_cents` never owed, which also freezes redemption. | **Repaired.** `refiledRefundResolution` carries the row's own ref through unchanged and puts the typed id in the reason. `Y7` and `Y8` prove it for both the reversal and the restoration path. |
| N9 | **The idempotency anchor came from the keyboard.** `reverse:<kind>:<id>` is globally unique; checking the typed id against ids already on the ledger cannot catch the attack it was written for, because the defining property of that attack is that the key is still FREE when it is typed. One wrong character writes a reversal under another customer's *future* refund id; their genuine clawback then deduplicates and never happens. | **HIGH** | Traced end to end; the guard is unambiguous about what it checks. | **Repaired.** `resolutionIdempotencyAnchor` takes the anchor from the ROW: a row that names an event is resolved under that id and a disagreeing typed id is refused by name; a row that names none is keyed on the row itself. Staff no longer control the key at all. `Y4` and `Y5` prove it. |
| N3 | **The cross-wallet guard was `x !== x`.** `postEntry` reported `walletId: input.walletId` — the wallet that was *asked for* — so `posted.entry.walletId !== wallet.id` could never fire. A correction code reused on a second customer returned `ok: true` with an amount while that wallet never moved; for a NEGATIVE adjustment the clawback silently never happened. The in-memory test store returned the real row, so the covering assertion passed while production could not enforce it. | **MEDIUM (launch-impacting)** | `CORRECTION-777` applied to customer 1, then customer 2: `{ok: true, deduplicated: true}`, wallet 1 = 5000, wallet 2 = 0. | **Repaired.** `readPostedEntry` reports the row that exists. `Z1` proves it. |
| N3b | **`deduplicated` came from a pre-read**, which loses the race it exists to detect: the posting function short-circuits on `idempotency_key` before it takes the wallet lock. Two concurrent won-dispute deliveries each reported restoring 900 against one 900-cent row. No money moved twice; the audit log and the staff API simply claimed it did. | **MEDIUM** | Two concurrent `restoreReversedCredits` for one dispute: both `{restoredCents: 900, deduplicated: false}`, ledger holds one row. | **Repaired.** Every post carries a nonce written into `meta`; a returned nonce that is not this call's is proof this call created nothing. Exact, no schema change, no second round trip. `Z2` proves it. |
| N6 | **A won-dispute row that needed nothing could never be closed.** Restore 409s `restoration_moved_nothing`, No-action 409s `row_requires_restoration_outcome`, and the operator reads a raw error code either way. | **MEDIUM** | Traced through the API's own refusals. | **Repaired.** `reversed` is still refused on a restoration row — it files a clawback as the resolution of an obligation to give credits back — but an audited, noted `no_action_required` closes it. `Y2` and `Y3` prove both halves. |
| N11 | **The rewards navigation rode the wrong permission.** Both screens demand a roster `super_admin`; the shell listed them under `hasPaymentTrackerAccess`. A billing-support member saw both links and was bounced every time. | **MEDIUM** | Traced: the two gates are different predicates over the same context. | **Repaired.** `hasRewardsWorkspaceAccess` is the necessary condition of the real gate, and the nav uses it. |
| N-B2 | **The customer read raw machine tokens.** Four of the ledger's fourteen entry types had no label — `recovery_accrue`, `recovery_offset`, `reversal_restoration`, `redeem_recommit` — and they are precisely the ones this change makes reachable. A Spanish-speaking customer with a won dispute read `reversal_restoration` in their activity list. | **MEDIUM (customer-visible)** | The label map covered 10 of 14; the fallback renders `r.entry_type`. | **Repaired.** All fourteen are labelled in both languages, and `W3` asserts it by rendering every type through the real route and refusing any raw token. |
| N-R9 | **The concurrency proof's timing floor was unprotected.** `MIN_MS=0` left both suites green, and "the racing session queued on the wallet lock" reverted to a caption over a number nothing checked. An empty `B_MS` also made the comparison return 2, which `if` treats as false — a silent pass. | **MEDIUM (evidence integrity)** | Measured by the reviewer. | **Repaired.** The floor is derived, guarded before anything else runs, and the guard is itself EXECUTED by `R9` with a degenerate value. `B_MS`/`D_MS` default to 0. |
| N-MUT | **The mutation harness mutated the LIVE working tree.** An interrupted run left `rewardsPolicy.ts`, the admin route and the behavioural suite mutated on disk. The `finally` is only reached on a clean exit, so any SIGKILL, timeout, OOM or container stop left money-moving source files silently defective in a tree somebody could commit. | **MEDIUM (evidence integrity)** | Reproduced by the reviewer by interrupting a run. | **Repaired.** Every mutation is applied to a disposable copy and every suite runs there. The repository is opened read-only and asserted byte-identical at the end. |

### The one thing the code could not fix

| # | Finding | Severity | Disposition |
|---|---|---|---|
| N-3 | **Credits cannot be spent online anywhere.** The only surface that passes `creditsEligible` to the checkout is the servicios preview, and both of its packages are `monthly_subscription`, which the server refuses by name. So the credits panel never mounts, every online checkout refuses credits, and the only redemption path is the staff counter — while the wallet panel told the customer they could "apply up to 50% of an eligible purchase". | **HIGH (customer-facing)** | **Partly repaired, and escalated.** The copy now says where credits can actually be applied today, so nothing promises what cannot be kept. Enabling online redemption needs a per-checkout `duration: "once"` Stripe coupon — new live-payment-rail integration this mission is forbidden to validate — so it is recorded as an **owner decision** (§9.1) and as genuinely unbuilt (§10), not papered over. The earn side is complete and correct; the spend side is staff-only at launch. |

### Accepted, with reasons

| # | Finding | Why it is not repaired |
|---|---|---|
| N4 | A released hold does not offset an outstanding recovery debt, so a customer can hold spendable credits they cannot spend until an unrelated future earning clears the debt. | The arithmetic is **value-neutral** — confirmed across the reviewer's 265 randomised trials — and the behaviour follows the LOCKED policy exactly: debt is repaid by *future eligible earnings*, and redemption is prohibited while debt exists. Making a release repay debt is a new product-policy decision, so it is recorded in §9 rather than taken unilaterally. |
| N14 | `basisNeutralizedCents` floors the withdrawal, leaving up to 11 cents of residual money-returned basis on a won dispute, which can over-reverse a later goodwill refund by **1 cent**. | Bounded at one cent per won dispute, non-accumulating, always in the direction that costs the customer rather than Leonix. Measured across 1,200 randomised sequences. Recorded rather than silently rounded away. |
| N4b | `leonix_amount_is_net_of_credits` is written on every Revenue OS record, even one with zero credits applied, so the counter-credits pre-flight refuses a few records where nothing was ever netted. | Fails CLOSED, on a staff path, with a named reason and the maximum-redeemable figure returned so staff can act. Testing `leonix_credits_applied_cents > 0` as well would be exact; it is a precision improvement, not a money defect. |
| N7 | The queue claims a row before the movement, so a row that reads `resolved` with `movedCents: 0` is possible when the movement then fails. | Deliberate, and the safer of the two orders: claiming first is the mutual exclusion that stops two staff both moving money on one row. Every failure re-files the obligation as a fresh open row (`Y7`, `Y8`, `Y14`), so nothing is destroyed — but the file's own comment claiming a resolved row always describes money that moved is now false, and is corrected here rather than in the comment alone. |
| N-admin | `body.paymentRecordId` is not checked to belong to the named owner, so a super_admin can annotate the wrong payment record. | Staff-only, audited, moves no money on the wrong wallet (the wallet comes from the canonical binding, proven by `Z9`). Recorded. |

---

## 3d. Round 3 — the reviewer who found what this round had broken

One final reviewer, who wrote none of this code, was given the complete diff, the running suites and
a throwaway PostgreSQL, and was told to treat every financial assertion as untrusted. They built a
`RewardsStorePort` over real PostgreSQL 16.13 mirroring `rewardsLedger.ts` statement for statement —
including the `LX001` mapping, the `-1` sentinel and the nonce — and drove the **real** exported core
functions through it. That is the one thing neither suite did: the TypeScript suite drives an
in-memory store and the SQL suite drives `psql`.

**They found a BLOCKER that this round had introduced, and no check on either side could see it.**

| # | Finding | Severity | Demonstrated | Disposition |
|---|---|---|---|---|
| T1 | **The `queue:<rowid>` anchor makes the same refunded dollars count twice.** Round 2 keyed a truncated-payload row on the ROW, reasoning it names no event. But the route DEMANDS the canonical refund id precisely so the staff resolution and the rail's own later delivery share one key. Two keys do not deduplicate, and `sumReversalBasisForPayment` ADDS their `basis_contribution_cents`. It was the second accounting scheme `revenueSubscriptionEvents` had already been repaired to remove, reintroduced through the staff queue. | **BLOCKER** | $100.00 payment, 900 earned, one $50.00 refund: staff resolve the truncated row (450 moved), Stripe redelivers `charge.refunded` with `re_REAL123` (450 moved again). **900 clawed back where 450 was owed.** A second shape gave 675. On a spent balance, **450 cents of `recovery_cents` the customer never owed**, which freezes every redemption. Verified as a REGRESSION: the same sequence at the starting SHA gives 450, then `deduplicated: true`. | **Repaired.** The anchor is the rail's own event id. A row that names one is resolved under it and a disagreeing typed id is refused; a row that names none uses the id the route already demands, and is refused outright without one. There is one accounting scheme again. `Y5` drives the staff resolution and then the rail's delivery and requires 450. |
| T2 | **The round's central repair could be deleted with all 426 checks green.** Removing `post_nonce: postNonce` from `p_meta` left the behavioural, route, SQL and mutation suites all green — while eight concurrent won-dispute deliveries collectively reported **2700 restored against 900 moved**. `Z2` tests the pure rule; nothing asserted the adapter SENDS a nonce. | **HIGH** | Clean A/B on two fresh databases, N = 8. | **Repaired.** `Z3` now asserts the recorded RPC call carries a `post_nonce` of real length, and that two posts do not share one. |
| T3 | **A pending INVITATION silently and irreversibly severs a wallet binding.** `businessBindingRevoked` asked "is none of them active". `business_memberships_status_chk` admits `invited`, which is a pending invitation — the opposite of a revocation. A wallet READ was enough to release the binding; the customer's own wallet then read $0.00 while their credits sat in the business wallet, and **accepting the invitation did not put it back**, because once a personal wallet exists the resolver takes the `owner_user_id` branch for ever. | **HIGH** | Executed against the real resolver across every status combination. Wrong number $0.00; correct $9.00. Latent rather than live — nothing in today's app writes `invited` — but it is a legal schema state the type system already models. | **Repaired.** Only a row that says `revoked` ends a binding. `Z12` and `Z13` execute the resolver across `invited`, `active`, `revoked` and mixtures. The check that blocked this fix — `R7`, a regex over the exact source line — was **replaced**, because it went green for the defect and red for a pure extract-variable refactor. |
| T4 | **`no_action_required` on a restoration row destroys the obligation.** Round 2 allowed it to fix a row that could never be closed. On its own it opened a worse hole: one click closed a won-dispute row whose clawback was still outstanding — no ledger row, no dispute id recorded, no route action able to reopen it — while the `restored` path carefully refuses to close a row that moved nothing. | **MEDIUM (launch-impacting)** | Traced through the route, the queue module and the UI, which renders the button unconditionally. For a fully disputed and won $100.00 payment that is 900 credits the customer is owed, gone. | **Repaired.** The outcome now asks the ledger the same question the restore path answers with money: it is refused with `restoration_still_outstanding` and the exact figure unless the payment's chargeback is fully restored. `Y3b` proves the refusal; `Y3` proves the legitimate close still works. |
| T5 | **Recovery debt had no staff exit.** `redeem_reserve` refuses while a debt stands, and a positive `manual_adjustment` does not repay one — the posting function's adjustment arm credits `available` with no offset, unlike the earn arms. So a staff "correction" of +900 to a customer owing 900 handed them 900 credits they still could not spend. The only exit was an unrelated future purchase. | **MEDIUM (launch-impacting)** | Traced through the SQL arms and the route's action list. | **Repaired.** A `forgive_recovery` action behind the same `super_admin` gate posts `recovery_offset`, bounded by the debt (a larger figure is refused with the real one, never clamped), keyed on the staff reference, and refused outright on a wallet with no debt. `Y15` proves all four. |
| T6 | **A reversal key held by ANOTHER wallet was reported as a duplicate delivery.** `postManualAdjustment` has refused this since the staff path was repaired; `attemptReversal` did not. The webhook then believed the clawback was applied: the money went back, the credits stayed, nothing was queued, and Stripe never retried. | **MEDIUM (launch-impacting)** | Observed by execution, via a key collision in the reviewer's own harness. | **Repaired.** `attemptReversal` refuses with `reversal_key_belongs_to_another_wallet` so the caller queues it. `Z14` proves it. |
| T7 | **The route harness's `maybeSingle()` was kinder than PostgREST**, returning the first of several rows where the real call errors — the exact behaviour this diff contains a repair for. `.lte()` compared as strings, and `.not()` degraded every unknown operator to `!==`. | **MEDIUM (evidence integrity)** | Read against the code under test. | **Repaired.** `maybeSingle` raises `PGRST116` on more than one row, `lte` compares numerically where both sides are numeric, and `not()` refuses an operator it was not taught rather than guessing. `Z17` proves the first, and a mutation pins it. |
| T8 | A failed position read reported as `0` rather than `-1` is caught by nothing, though the code's own comment calls the sentinel load-bearing. | **LOW** | Mutation; both suites stayed green. | **Repaired.** The harness gained a way to make a read fail, and `Z15` asserts the sentinel. |

### Accepted, with reasons

| # | Finding | Why |
|---|---|---|
| T9 | The `bound_user_id` compare-and-set in `releaseRevokedBusinessBinding` is not covered by any test. | Unreachable by construction in a single resolution: the function is only called from a branch that has just read `bound_user_id = userId`, so both scopes select the same row and no test can distinguish them. It defends a concurrent window that cannot be staged from outside the module. The predicate stays — the failure it prevents is somebody else's wallet identity — and the code says at the site that it is unproven rather than counting it as evidence. The business scope IS proven, by `Z16`. |
| T10 | 202 of the behavioural suite's 961 assertions are still regexes over source. | Every one whose defect the reviewers demonstrated could survive a text-preserving reintroduction has been replaced by an executable check (`P8`, `R7`, `R9`, and the whole HTTP layer). The remainder assert structural facts about files the route harness does not reach — the webhook event handlers, the UI components and the migration's text. Named here rather than left implicit, and the honest reading is that they are *corroboration*, not proof. |

### What the reviewer could not break

Reported because negative results are evidence: **300 randomised event streams** across five seeds,
8–21 events each, ~40% of reversals delivered concurrently, driving the real core against real
PL/pgSQL, with four invariants asserted after every step — no negative bucket, the per-payment
reversal ceiling, ten-field replay parity, and `lifetime_earned` equal to the ledger's earns plus
staff adjustments. **Zero violations.** Plus: 12 trials of a simultaneous full refund and full
dispute on one payment (900 every time); N = 2/4/8 simultaneous won-dispute deliveries (900 restored
and 900 *reported*, at every N, because of the nonce); K = 3/5/8 simultaneous distinct partial
refunds (losers write nothing and burn no key, and retried serially land on the exact proportional
total); the full 30-minute hold lifecycle through expiry, re-debit and unfunded accrual; and the
migration applied **four times with live data present**, leaving exactly one `post_entry` overload.

---

## 3e. Round 4 — verifying Round 3's repairs, which had introduced two BLOCKERs

A verification reviewer was given Round 3's diff and told what its predecessors had found: that
**every round's repairs introduced defects the round's own tests could not see.** They assumed the
same of Round 3, built a `RewardsStorePort` over real PostgreSQL 16.13, and were right.

| # | Finding | Severity | Demonstrated | Disposition |
|---|---|---|---|---|
| U1 | **The staff recovery write-off creates credits.** `forgive_recovery` (added in Round 3 to close T5) posts a `recovery_offset` with no `payment_record_id` and no `source_id`, so it is invisible to the SQL restoration bound, which is scoped by both. A staff write-off and a won-dispute restoration discharge the SAME clawback, and nothing linked them. | **BLOCKER** | $100.00 payment, 900 earned and spent, full chargeback → debt 900. Forgive the 900, then win the dispute: **`available_cents` 900, correct 0.** $9.00 created per $100.00, scaling with payment size. `leonix_rewards_recompute_wallet` **agrees** with the wrong number, so reconciliation cannot find it. | **REMOVED.** The action, its core function and its key were deleted in the same round that added them. Doing it properly needs four changes together — attribution on the offset, a per-payment read, a tightened TypeScript bound and **the same subtraction inside the SQL restoration arm**, because the database bound is the authoritative one. A partial fix here would be a money defect with a clean replay. `Y15` now asserts the ABSENCE behaviourally: no action on this route may post a `recovery_offset`. The gap returns to §9 as an owner decision. |
| U2 | **The BLOCKER Round 3 repaired could be reintroduced with all four suites green.** `Y5`'s fixture refund id was `re_REAL123` — ten characters. Every genuine Stripe refund id is twenty-seven. A reintroduction conditioned on `refundExternalId.length > 20` passed the behavioural, route, SQL and mutation suites while the double clawback was live for **every real customer**. | **BLOCKER (evidence)** | Same construction against real PL/pgSQL: with the 10-character fixture id, 450 reversed (correct); with a real 27-character id, **900 reversed**. | **Repaired.** Every refund and dispute fixture in the suite is now a production-length `re_`/`dp_` id, and `Y5` asserts the reversal key is **byte-equal** to `reverse:refund:<supplied>` rather than merely free of `queue:`. A fixture shorter than production is a fixture the defect hides behind. |
| U3 | **A dismissal guard that is vacuous in the case the row exists for.** The Round 3 guard measured the PAYMENT's chargeback total. A row filed for the ORDERING case — the dispute won before its clawback landed — has a chargeback sum of **zero**, so "outstanding" came out 0 and one click dismissed it. | **HIGH** | Driven through the route: `200 {ok:true, outcome:"no_action_required"}`, row `resolved`. 900 credits the customer is owed, gone. | **Repaired.** The guard asks about THIS dispute, using the same fact `attemptRestoration` uses: a dispute whose own `chargeback_reversal` row does not exist yet is outstanding, not settled. `Y3c` proves it. |
| U4 | **Two truncated rows on one payment under-reverse by half, and both close 200 OK.** Under the rail's key they share one anchor, so the second resolution deduplicates and the route closed the row having moved nothing. | **HIGH** | Rows at cumulative 2500 and 5000 on a $100.00 payment: **225 reversed where 450 was owed**, obligation closed, no trace. | **Repaired.** A DEDUPLICATED reversal re-files and returns 409, exactly as the restore path already did. Narrowed deliberately to the deduplicated case: `skipped / payment_earned_nothing` is a truthful resolution and must still close, or the row becomes unclosable — the defect in the other direction. `Y16` proves the refusal; `Y6` proves the truthful close still works. |
| U5 | **`no_action_required` on a truncated-payload row became impossible.** Round 3 derived the anchor for every outcome, and the anchor demands a canonical refund id, which the screen sends only for a reversal. Every `charge_refunds_absent_from_payload` row — the whole reason the queue exists — was unclosable unless staff invented an id. | **MEDIUM (launch-impacting)** | `409 {"error":"refund_external_id_required"}`, row stays open for ever. | **Repaired.** The anchor is computed only on the paths that use it. `Y3d` proves a truncated row still closes. |
| U6 | **`Z17` proved one table, not the harness rule.** Scoping the multi-row `maybeSingle` fidelity to the single table the check seeded left every other route read over a non-unique column passing in the harness and erroring in production. `not(col, "in", "(a,b)")` — the string form this repository actually uses — threw an unnamed `TypeError`. | **MEDIUM (evidence integrity)** | Mutation; both suites green. | **Repaired.** `Z17` loops over three tables and asserts both the refusal and that one row is still one row, and the `in` operator accepts both PostgREST forms. |
| U7 | **`Z16` proved neither predicate it was cited for.** Its two wallets differed in business AND in bound user, so either scope alone isolated them — including the dangerous direction, which releases a successor bound to the same business wallet. | **LOW** | Two mutations, both green. | **Repaired.** A third wallet shares the business and differs in the user. The code comment claiming the user scope was "unproven" is now false in the right direction — it is proven, by `Z16`. |
| U8 | `__failReadsOn` survived `__reset()`, so a check that threw mid-body would poison every later check. | **LOW** | Executed. | **Repaired.** One line in `__reset()`. |
| U12 | **Two more reads of the same class, found by tracing the fix rather than by a reviewer.** `sumReversedForPayment` and `sumReversalBasisForPayment` also discarded their error and returned 0. This direction is worse than the ones already repaired: a prior basis read as zero makes THIS event's contribution look like the entire money-returned position, so a second partial refund claws back what the first one already took — **675 where 450 is owed** — and the SQL payment ceiling does not catch it, because the inflated figure is still under the payment's award. | **HIGH** | `Z18` drives both reads failing, one at a time, against the real fulfillment path. | **Repaired.** Both report the `-1` sentinel; the reversal refuses when any of the four inputs is unknown, and the promotion sweep SKIPS rather than promoting the full award from a position it could not read. Two mutations pin them. |
| U9 | A doc comment still described the `<chargeId>:cum<N>` fallback that had been removed, twenty lines above code saying there is exactly one scheme. | **LOW** | Read. | **Repaired**, and it now names both times that idea came back — the removed fallback and Round 2's `queue:<rowid>` anchor — because in a certification that reads comments as evidence, a comment describing a removed accounting scheme is its own defect. |

### Accepted, with reasons

| # | Finding | Why |
|---|---|---|
| U10 | A staff typo of a refund id that is still FREE burns that key, and the customer whose refund it really belongs to then has an obligation no route action can settle (`reversal_key_belongs_to_another_wallet`, for ever). | Reproduced. The cost is bounded and LOUD: the clawback fails by name, the row stays open, and nothing is silently lost or double-taken. The alternative on the table — a derived repair key — is a second accounting scheme in the one place this system has now been burned by that idea three times. It is recorded as an owner decision (§9) with the shape of the real fix: a staff control that re-anchors a row whose canonical key is provably spent on another payment. |
| U11 | `Z13` asserts mixed membership statuses, which `UNIQUE (business_id, user_id)` makes unreachable. | Harmless and deliberately defensive: the rule is `every(r => revoked)`, and the check pins it for a schema that gains a second row per pair. The single-status cases — `invited`, `active`, `revoked` — are the ones that matter, and they are real. |

### Negative results

240 concurrent forgiveness calls across 40 trials (before the feature was removed) never drove
`recovery_cents` negative and never double-forgave. 60 randomised differential trials of 14
operations each found **0 replay mismatches, 0 negative buckets, 0 replay refusals**. Five
behaviour-preserving refactors produced **0 false reds** — the suites are no longer spelling-shaped
in the places the earlier rounds' reviewers broke. No path was found where
`reversal_key_belongs_to_another_wallet` refuses a legitimate retry: `findEarnForPayment` returns
the earn's own `wallet_id`, which is stable across binding changes.

---

## 3f. Round 5 — verifying Round 4, and the fixture that hid money creation in the SQL engine

The fifth reviewer was given Round 4's diff and the same warning its predecessors had earned: that
every round's repairs introduce defects its own tests cannot see. Two of their findings were about
**blind spots rather than defects** — places where a money-creating change passes the entire
certification — which is the harder and more important kind.

| # | Finding | Severity | Demonstrated | Disposition |
|---|---|---|---|---|
| V1 | **Two failed-read sentinels were declared and never applied.** Round 4's comment made `-1` the rule; `sumReversedForPayment` and `sumReversalBasisForPayment` still returned `0`, and the promotion sweep used `.catch(() => 0)`. | **BLOCKER** | With one read failing: a second $25.00 refund reversed 450 instead of 225, **675 total where 450 is owed**; and the sweep promoted **900 where 450 is correct**, under the idempotent `promote:payment:<id>` key, so no later sweep corrects it. | **Already repaired** in the commit that landed during the review — found by tracing the fix to its neighbours rather than by the reviewer, and recorded here as confirmation, not as a catch. |
| V2 | **The SQL suite's Stripe ids are 4–8 characters.** Round 4 fixed fixture length in the ROUTE suite and left the authoritative engine's fixtures untouched. Conditioning the per-dispute restoration bound on `length(p_source_id) < 12` — so it applies only to test-shaped ids — left **all 373 assertions green**. | **HIGH** | Against real PostgreSQL with a 27-character dispute id: a payment disputed twice at $50.00, one won, restored **900 instead of 450**. **450 credits from nothing**, in the bound the migration's own comment says exists to prevent exactly that. | **Repaired.** Every `dp_*`/`re_*` fixture in the SQL suite is now a deterministic 27-character production-shaped id, and a mutation conditions that bound on `length(p_source_id)` and requires `S5` to fail. |
| V3 | **The over-clawback direction of the queue's amount semantics had no check at all.** `cumulativeRefundedCents: perEvent ? null : …` → `cumulativeRefundedCents: null` is one token and left every suite green; the mutation suite covered only the mirror (under-reversal, `Y13`), and `Y16` is blind because it resolves both rows with the SAME refund id, so the second call deduplicates before any arithmetic runs. | **HIGH** | Two truncated rows on one $100.00 payment, each with its own real refund id: **675 clawed back where 450 is owed.** | **Repaired.** `Y16b` resolves them with two distinct production-length ids and requires 450, and the mirror mutation is added. |
| V4 | **A won-dispute row whose clawback never arrives can be closed by nothing.** A dispute whose `dispute.created` was lost to a webhook outage produces no `chargeback_reversal` ever, and Round 4's guard refused every control on the screen — the third appearance of the "row nobody can close" defect. | **MEDIUM** | All three outcomes 409 against the real route; the row stays open for ever. | **Repaired, without weakening the guard.** "The clawback is in flight" and "it will never come" are indistinguishable from the ledger, and the mistakes are not symmetric, so `no_action_required` still refuses. The exit is a new, explicitly audited `dismissed` outcome: it lands as `dismissed` rather than `resolved`, so an auditor can tell a judgement call from a settlement, and it demands a longer note than any other outcome. `Y3e` proves both halves. |
| V5 | **The deduplicated re-file cycles for ever when the rail settled it first.** A truncated row whose refund the rail later delivered properly was re-filed on every attempt — the obligation WAS discharged, so refusing was wrong. | **MEDIUM** | Three attempts, three fresh open rows, attempts reset each time. | **Repaired.** The row closes when the entry holding the key is on THIS payment and the money-returned position it recorded already covers the row's figure; otherwise it still re-files. `Y17` proves both branches, including that a key spent by a DIFFERENT payment is refused before the claim, so that row is never closed at all. |
| V6 | **A closed row claimed an outcome it did not achieve.** The claim precedes the movement — that is the mutual exclusion — so a movement that then deduplicated left `resolution_outcome = 'reversed'` with a null ledger id. An auditor reading the table alone counted a reversal that never happened. | **LOW** | Read back from the table after a re-file. | **Repaired.** `recordResolutionMovedNothing` rewrites the outcome and appends what actually happened to the note. Asserted inside `Y16`. |
| V7 | **`Z18` was coupled to the SPELLING of a select string.** Widening `.select("amount_cents")` to `.select("id, amount_cents")` — behaviour-identical — turned it RED. The same mechanism is what hid V1: injecting on one exact column list made the check structurally unable to reach two reads whose lists merely differed. | **LOW (evidence integrity)** | Executed. | **Repaired.** Failure injection targets a query by the columns it ASKS FOR (`{requires, excludes}`), which is insensitive to order, whitespace and additions and still specific enough to break one read without breaking the lookup before it. The widening now leaves the suite green, and the two reads V1 was about are reachable. |
| V8 | **`Z16`'s fixture proved neither predicate, and the comment beside the code stated the opposite of the truth.** | **LOW** | Two mutations, both green at the time. | **Repaired, and the comment corrected in both directions.** `Z16` now seeds a successor bound to the SAME business, so dropping the user scope is caught. The `business_id` predicate is **redundant while `bound_user_id` is globally unique** — one wallet per bound user means the user scope already selects at most one row — so no test can distinguish dropping it, and the comment now says that instead of claiming coverage it does not have. |
| V9 | **The harness generated non-UUID row ids**, so no check could drive a route action against a row the SYSTEM created — every route gate starts with `isUuid`. A whole class of follow-through was untestable. | **LOW** | Executed. | **Repaired.** `__nextId` emits UUID-shaped ids. |

### One incident worth recording, because it is the same lesson

While repairing V7, a `git checkout --` used to undo an experiment silently discarded **uncommitted
work in the same file** — an adapter method added minutes earlier. Nothing announced it. The route
suite caught it on the next run, by failing the one check that needed that method.

That is the argument for the mutation harness working on a disposable copy rather than the live
tree (§3c), made again from the other direction: a tool that reaches into the working tree to undo
something is a tool that can undo something else.

### Negative results

**500 trials × 12 random operations = 6000 posts** against real PostgreSQL 16.13, covering all
eleven entry types and the full redemption lifecycle, with 2489 refusals by the engine: **0 replay
mismatches** across all ten balance fields, **0 negative buckets**, **0 payments where the net
clawback exceeded that payment's earn**, and `recovery = accrued − offset` in all 500. **12 trials
× 6 genuinely concurrent psql sessions** reversing one payment at six cumulative positions with a
CAS-retry loop: all twelve converged on **exactly 900**, six rows each, no over- or under-reversal.
Ten independently written text-preserving mutations of this round's new checks: **10/10 caught.**
Four behaviour-preserving refactors: three green, one false red (V7, now repaired).

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
`scripts/verify-ix-rewards-behavior-01.ts` and `scripts/sql/verify-ix-rewards-sql-behavior-01.sql`;
`W*`/`X*`/`Y*`/`Z*`/`V*` are checks in `scripts/verify-ix-rewards-route-behavior-01.ts`, which
EXECUTES the route handlers and the production adapter rather than reading them.

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
| A staff resolution FOLLOWED by the rail's own delivery of the same refund | moves money once, because both use the rail's key | `Y5` |
| A reversal key already held by another wallet | refused and queued, never reported as a duplicate | `Z14` |
| Refund + dispute on one payment | the money returned is accounted for once | `Q3`, `S4` |
| Clawback the wallet cannot cover | becomes recovery debt; no bucket goes negative | `B12`, `S3` |
| Reversal beyond the payment's award | refused at the database | `S4` |
| Reversal aimed at the wrong wallet | refused; no debt invented; the payment's budget survives | `S5` |
| Two concurrent reversals | land on exactly the sequential answer | `Q1`–`Q3`, `Q6` |
| A reversal that cannot be posted | nothing written, key not burned, work queued | `Q15`, `R6`, `Z4` |
| A staff resolution keyed on a typed id | refused; the anchor comes from the ROW | `Y4`, `Y5` |
| A re-filed queue row | keeps what its amount MEANS, and which event it is about | `Y7`, `Y8`, `Y13` |

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
| Credits on a recurring plan | refused, explained, control not shown, nothing held | `R2`, `P9`, `V4` |
| The browser names another customer as the credits owner | ignored; the hold lands on the bearer's wallet | `V1` |
| An UNAUTHENTICATED checkout naming a customer | holds nothing at all | `V1` |
| What Stripe is asked to charge | the amount minus the credits, exactly once | `V2` |
| A browser asking for more than half the purchase | capped server-side at the reserve | `V3`, `Y11` |

### Identity, staff and replay

| Scenario | Expected | Proven by |
|---|---|---|
| Reversal or restoration after ownership would resolve elsewhere | lands on the wallet the earn credited | `Q16` |
| Membership revoked after binding | the business binding ends; a personal one never does | `R7` |
| Bound through a staff-verified payment link, no membership | the binding STANDS | `R7` |
| Staff correction by user id | resolves through the canonical binding | `R8`, `Z9` |
| A CSV reconciliation row | lands on the bound wallet, not a fresh personal one | `Z11` |
| A customer whose business binding was REVOKED | the binding is released; they can still be given a wallet | `Z6` |
| An ACTIVE binding, or one with no membership behind it | untouched | `Z7`, `Z8` |
| A forged `leonix_admin=1` cookie on the staff API | reads nothing | `X1`, `X2` |
| A query parameter naming another customer's wallet | ignored; the bearer's balance is returned | `W2` |
| Any entry type in the customer's activity list | rendered as language, never as a machine token | `W3` |
| A staff adjustment reference reused on another wallet | the posted row's OWN wallet is reported, so the refusal can fire | `Z1` |
| Two identical deliveries of one movement | the loser reports zero moved, by nonce | `Z2` |
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
| E | Canonical wallet identity | §4b "Identity, staff and replay" | `Q16`, `R7`, `R8`, `B16`, and executed: `Z6`–`Z9`, `Z11` |
| F | Refund / dispute resolution queue | §3b, §3c, §4b | `R6`, `P19`, `R5`, and executed: `Y1`–`Y9`, `Y13`, `Y14` |
| G | Redemption 30-minute lifecycle | §4b "Redemption" | `C8`, `I1`–`I3`, `R3`, `Q7`–`Q9`, `S7`, and executed: `Y10`–`Y12`, `V1`–`V4` |
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

### The HTTP layer, added in Round 2

| Layer | What proves it | What it cannot prove |
|---|---|---|
| Route handlers (`wallet`, `admin/rewards`, `admin/rewards/reconciliation`, `revenue-os/checkout`) | `verify-ix-rewards-route-behavior-01.ts` CALLS them: 35 checks over the auth gates, the order of refusals, the arguments passed to the ledger, and the answers returned | Anything about PL/pgSQL — the store is an in-memory PostgREST model |
| Production adapter (`rewardsLedger.ts`) | The same suite drives the REAL `buildRewardsStorePort()` through that model: the posted-row contract, the `LX001` mapping, the position count, wallet resolution and binding release | The same |
| Posted-row contract (`rewardsLedgerRow.ts`) | Called directly with crafted rows, and used by the adapter, so the test and production cannot disagree about it | — |
| Stripe | A recorder captures the session parameters; what the route ASKED to charge is asserted | Stripe's own behaviour. No call is made, by instruction |

Before Round 2 this row of the table did not exist, and that is exactly where nineteen
reintroduced defects hid.

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

1. **ONLINE REDEMPTION DOES NOT EXIST AT LAUNCH, AND THIS IS THE DECISION THAT MATTERS.**
   B5 is closed by refusing credits on `subscription` mode. Round 2 then established the real scope
   of that refusal: the only surface in the site that offers the credits control is the servicios
   preview, and **both** of its packages are `monthly_subscription`. So the panel mounts nowhere,
   every online checkout refuses credits by name, and the only path that spends a credit is a staff
   member applying it to a payment in the office.

   The earn side is complete: customers accrue 9% correctly, see their balance, and it does not
   expire. The spend side is staff-only. The customer copy has been corrected to say exactly that,
   so nothing promises what cannot be kept — but **the owner must decide whether to launch with a
   staff-only spend path.**

   Enabling online redemption needs a per-checkout Stripe `amount_off`, `duration: "once"` coupon —
   the mechanism the verified-intro discount already uses — plus a rule for what happens when a
   server-attached coupon is already present (Stripe permits one coupon per session). That is new
   live-payment-rail integration code, which this mission is forbidden to validate, so it is
   recorded as unbuilt rather than half-built. The alternative, which needs no rail work, is to
   offer the control on the one-time packages that already exist (empleos, autos privado, rentas,
   bienes FSBO, ofertas) — the server already accepts credits there; only the previews do not pass
   `creditsEligible`.
2. **Is there to be a staff exit from recovery debt at all?** One was built in Round 3 and removed
   in Round 4, because it creates money: a staff `recovery_offset` and a won-dispute restoration
   discharge the same clawback and nothing linked them, so forgiving a debt and then winning the
   dispute hands back credits the customer already spent — with a replay that agrees. Doing it
   safely needs the offset attributed to its payment and dispute AND the subtraction added to the
   SQL restoration arm, because the database bound is the authoritative one. Until then the debt is
   discharged only by future earnings, exactly as the locked policy says. §3e, U1.
3. **How should a poisoned refund key be repaired?** A staff typo of a refund id that is still free
   burns that key; the customer whose refund it really is then has an obligation no route action
   can settle. It fails loudly and loses nothing, but it needs a control — a re-anchor for a row
   whose canonical key is provably spent on another payment. Deliberately not built here, because
   every version of "a second key scheme" this system has tried has cost real money. §3e, U10.
4. **Does a RELEASED hold repay an outstanding recovery debt?** Today it does not: a clawback that
   landed while credits were reserved becomes a debt, and when the abandoned checkout's hold is
   released those credits return to `available` while the debt stands — so the customer holds
   spendable credits they cannot spend until an unrelated future earning clears it. The arithmetic
   is value-neutral and follows the locked policy exactly ("future eligible earnings repay recovery
   debt"; "redemption prohibited while recovery debt exists"), which is why it was not changed
   unilaterally. Making a release repay the debt would need a new entry type that moves `available`
   and `recovery` together, across SQL, replay, the CHECK vocabulary, the TypeScript union, the
   adapter and the test store.
5. **The 50% ceiling's base.** A1: half of the pre-promo subtotal, or half of what is actually due?
   The current behaviour is deliberate and documented; with a 50% promo it leaves the customer paying
   $0.50 cash.
6. **The office/manual redeem's purchase amount.** A2: should it be bounded by the payment record
   when one is supplied, rather than typed?

---

## 10. Remaining limitations and blast radius

| Limitation | Blast radius |
|---|---|
| Per-payment attribution inside the shared buckets is approximate (A6). | Wallet totals are correct and the per-payment ceiling is enforced; what is imprecise is which payment a promotion or a clawback consumed. Visible only in a per-payment reconciliation, never in a customer's balance. |
| **Credits cannot be spent online anywhere** (§9.1). | Every online checkout refuses them; the only spend path is the staff counter. Customers earn correctly and see a balance they cannot spend by themselves. The copy now says so. This is the largest functional gap in the change and it is a product decision, not a defect. |
| A released hold does not repay an outstanding recovery debt (§9.2). | Value-neutral, and policy-conformant. A customer in that state holds spendable credits they cannot spend until a future earning clears the debt. Reachable only when a clawback lands while credits are reserved. |
| A staff typo of a still-free refund id burns that key, leaving the real owner's obligation unsettleable by any route action (§3e, U10). | Bounded and LOUD: the clawback fails by name, the row stays open, nothing is silently lost or double-taken. Needs a re-anchor control, which is an owner decision (§9.3). |
| There is no staff exit from recovery debt (§3e, U1, §9.2). | A customer whose clawback exceeded their balance waits for a future purchase to clear it. The write-off that would have fixed it creates credits, so it was removed rather than shipped. |
| 202 of the behavioural suite's 961 assertions are still regexes over source (§3d, T10). | Every one whose defect a reviewer demonstrated could survive a text-preserving reintroduction has been replaced by an executable check. The rest assert structural facts about the webhook handlers, the UI and the migration text, which the route harness does not reach. Corroboration, not proof. |
| The route harness models PostgREST, not PostgreSQL. | `scripts/lib/stubs/supabaseServer.mjs` implements the query surface the routes use plus the unique indexes that matter. It proves what a route DOES — its gate, its ordering, its arguments, its answer. It proves nothing about PL/pgSQL, which is why the SQL suite exists and runs against a real server. |
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

It runs on a **disposable copy of the tree**, never on the repository — an earlier version mutated
the live working tree, and an interrupted run was shown to leave money-moving source files
defective on disk.

The harness carries **87** mutations. They fall into five groups, and the groups matter more than
the individual rows:

1. **The original repairs** (#1–15) — each money defect from §3, put back.
2. **Defects a mutation review proved were uncovered** (#16–22) — the rail-minimum residual cap, a
   rejected manual payment, the replay mirror's refusal and three of its arms, the position token
   read out of order, and the key-burning branch.
3. **The bypasses that defeated the textual checks** (#23–28) — each keeps every literal and every
   ordering the old assertion matched and removes the effect anyway.
4. **The SQL engine** (#29–45) — executed against real PL/pgSQL.
5. **The nineteen that passed the entire certification** (#46–67) — reintroduced by Round 2's
   reviewers and, at that time, caught by nothing. Each is now caught by a check that EXECUTES the
   route or the adapter. This group is the reason §3c exists.

| # | Round 2 defect reintroduced | Caught by |
|---|---|---|
| 46 | The staff rewards API's auth gate present but inert | `X1`, `X2` |
| 47 | `?as=<uuid>` IDOR on any customer's wallet | `W2` |
| 48 | The queue claim's compare-and-set result ignored | `Y6` |
| 49 | Closing a queue row stops being exclusive | `Y6` |
| 50 | A cumulative re-file stamped with the typed refund id | `Y7` |
| 51 | A restoration re-file loses its dispute | `Y8` |
| 52 | The idempotency anchor comes from the keyboard | `Y4`, `Y5` |
| 53 | A won-dispute row becomes impossible to close | `Y3` |
| 54 | A queue row stops naming its dispute | `Y9` |
| 55 | The staff redeem ignores a failed commit | `Y10` |
| 56 | The net-of-credits refusal runs after the money moves | `Y12` |
| 57 | The compare-and-swap token is a constant 0 | `Z10` |
| 58 | `postEntry` echoes the request instead of the row | `Z1` |
| 59 | `deduplicated` comes from a pre-read again | `Z2` |
| 60 | A revoked business binding is left in place | `Z6` |
| 61 | The CSV reconciliation bypasses the binding | `Z11` |
| 62 | The `LX001` race stops being recognised | `Z4` |
| 63 | The concurrency timing floor is set to zero | `R9` |
| 64 | The bearer identity is poisoned UPSTREAM of the assertion | `V1` |
| 65 | Twice the discount is taken off what Stripe is charged | `V2` |
| 66 | The 50% ceiling is quadrupled | `V3` |
| 67 | The recurring-plan refusal stops being exclusive | `V4` |

One reintroduction was investigated and **reclassified rather than caught**: quadrupling the ceiling
passed to `reserveCheckoutCredits` changes no amount, because `planCheckoutCredits` has already
capped the figure reserve is asked for. Measured, not assumed — the hold is identical. It is
defence in depth, and #66 attacks the planning call, which is the one that binds.

The original forty-five follow.

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
| `npx tsx --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-ix-rewards-route-behavior-01.ts` — 50 checks that EXECUTE the route handlers and the production adapter | 0 |
| `bash scripts/verify-ix-rewards-sql-behavior-01.sh` — 142 in-session assertions + 2 **timed** cross-session concurrency proofs, against real PostgreSQL 16.13 | 0 |
| `npx tsx scripts/verify-ix-rewards-mutation-01.ts` — 87 defects reintroduced, each caught by a named check, on a disposable copy of the tree | 0 |
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

## 12b. Certification result

Filled at the final committed state, after the last reviewer's findings were resolved. See the
report that accompanies this document for the per-item verdict.

---

## 13. Prohibitions observed

- No migration applied to any remote Supabase project. Both migrations were applied only to a
  local throwaway PostgreSQL cluster created for this review and destroyed afterwards.
- No remote Supabase mutations. No Supabase MCP tool was called.
- No live Stripe calls. No Stripe MCP tool was called. The route suite imports a RECORDER in place
  of the Stripe SDK (`scripts/lib/stubs/stripe.mjs`): it captures the session parameters the route
  would have sent, so what a customer would be charged is asserted without anything leaving this
  machine.
- No deployment and no Preview.
- No pull request created, changed or merged.
- The Quick, Rewards and `main` branches are untouched.
- No destructive git operation, no force-push, no history rewrite.
- No fabricated evidence: every number above came from a command run in this environment. Where a
  reviewer's claim was reclassified rather than accepted — the reserve-side ceiling in §11 — the
  reclassification was MEASURED, not argued.
- No verifier was weakened to make a report green. Three were REPLACED by stronger evidence and the
  replacement is named at the site: `P8`'s source-text assertions by executable route checks, `R9`'s
  timing-floor claim by executing the guard, and the whole textual layer over the HTTP routes by a
  suite that calls them. The five verifiers that fail at the starting SHA still fail (§12).
