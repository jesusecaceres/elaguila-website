/**
 * LEONIX IX REWARDS — DO THE TESTS ACTUALLY CATCH THE DEFECTS?
 * Run: npx tsx scripts/verify-ix-rewards-mutation-01.ts
 *
 * WHY THIS EXISTS
 * ---------------
 * A green suite proves that the code passes the suite. It does not prove that the suite would go
 * red if the code were wrong — and every defect this system has shipped passed a green suite
 * first. A check that cannot fail is a certification hole whatever it asserts.
 *
 * So this REINTRODUCES each repaired defect, one at a time, into the real source file, runs the
 * behavioural suite, and requires that a NAMED check fails. Then it puts the file back and
 * requires the suite to pass again. A mutation that leaves the suite green is reported as a hole
 * in the tests, not as a success.
 *
 * SAFETY — AND WHY IT IS NO LONGER "RESTORED IN A `finally`".
 *
 * It used to mutate the LIVE WORKING TREE. An independent reviewer interrupted a run and found
 * `rewardsPolicy.ts`, the admin route and the behavioural suite left MUTATED on disk: the `finally`
 * is only reached on a clean exit, so any SIGKILL, CI timeout, OOM or container stop left
 * money-moving source files silently defective in a tree somebody could then commit. A test harness
 * that can corrupt the thing it certifies is not a safety property.
 *
 * So every mutation is now applied to a DISPOSABLE COPY of the tree and every suite runs with that
 * copy as its working directory. The real repository is opened read-only, and the run ends by
 * asserting that each source file it read is still byte-identical. A kill at any moment leaves the
 * repository untouched and at worst a directory behind in the scratch space.
 *
 * Nothing here touches the database, the network, Stripe, or git.
 */
import { strict as assert } from "node:assert";
import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

type Suite = "behavior" | "sql" | "route";

type Mutation = {
  /** What the defect was, in the terms a reader of the report needs. */
  readonly defect: string;
  readonly file: string;
  /** Exact source to replace. Must appear exactly once, which is itself asserted. */
  readonly find: string;
  readonly replace: string;
  /** The suite that must go red, and a fragment of the check name that must appear in its output. */
  readonly suite: Suite;
  readonly expect: readonly string[];
};

const BEHAVIOR = "scripts/verify-ix-rewards-behavior-01.ts";
const ROUTE = "scripts/verify-ix-rewards-route-behavior-01.ts";
const WALLET_API = "app/api/rewards/wallet/route.ts";
const QUEUE = "app/lib/rewards/rewardsRefundResolutionQueue.ts";
const RECONCILIATION = "app/api/admin/rewards/reconciliation/route.ts";
const LEDGER_ROW = "app/lib/rewards/rewardsLedgerRow.ts";
const CORE = "app/lib/rewards/rewardsLedgerCore.ts";
const POLICY = "app/lib/rewards/rewardsPolicy.ts";
const ADAPTER = "app/lib/rewards/rewardsLedger.ts";
const FULFILLMENT = "app/lib/rewards/rewardsFulfillment.ts";
const CHECKOUT = "app/api/revenue-os/checkout/route.ts";
const ADMIN = "app/api/admin/rewards/route.ts";
const EVENTS = "app/lib/listingPlans/revenueSubscriptionEvents.ts";
const MIGRATION = "supabase/migrations/20260921120000_leonix_ix_rewards_foundation.sql";

const MUTATIONS: readonly Mutation[] = [
  {
    defect:
      "A reversal whose delta was computed against a stale position posts it anyway. Two concurrent " +
      "partial refunds clawed back 1350 of a 900-credit award; a concurrent refund and dispute took 1800.",
    file: CORE,
    find: "    if (posted.error === REVERSAL_POSITION_MOVED) return POSITION_RETRY;",
    replace: "    // MUTATED: no recompute after losing a race.",
    suite: "behavior",
    expect: ["Q1", "Q2", "Q3"],
  },
  {
    defect: "The compare-and-swap token is not sent, so the posting statement cannot tell a stale delta from a fresh one.",
    file: CORE,
    find: "    expectedPositionRows: positionRows,\n    meta: {\n      basis_contribution_cents: basisContributionCents,",
    replace: "    expectedPositionRows: null,\n    meta: {\n      basis_contribution_cents: basisContributionCents,",
    suite: "behavior",
    expect: ["Q6"],
  },
  {
    defect:
      "A won dispute restores the payment's WHOLE clawback instead of its own. A $100 payment disputed " +
      "twice at $50 gave back all 900 credits when the first dispute was won and the second stayed lost.",
    file: CORE,
    find: "    Math.min(thisDisputeTookCents, Math.floor(reversedCents) - Math.floor(restoredCents)),",
    replace: "    Math.floor(reversedCents) - Math.floor(restoredCents),",
    suite: "behavior",
    expect: ["Q4"],
  },
  {
    defect: "A reversal is posted to the wallet ownership resolves to TODAY, not the wallet the earn credited.",
    file: CORE,
    find: "    // THE WALLET THAT WAS DEBITED, read from the earn entry — never re-resolved from the payer.\n    walletId: original.walletId,",
    replace: "    walletId: (await input.ports.resolveWallet({ kind: \"user\", ownerUserId: \"mutant\" }) as { ok: true; wallet: { id: string } }).wallet.id,",
    suite: "behavior",
    expect: ["Q16"],
  },
  {
    defect:
      "An unfunded settled purchase leaves the hold re-debitable, so a retry takes the credits again " +
      "on top of the debt the first attempt recorded.",
    file: CORE,
    find: "  await input.ports.setRedemptionStatus({\n    redemptionId: reservation.id,\n    status: \"committed\",\n    settleLedgerId: posted.entry.id,\n    fromAnyStatus: true,\n  });\n\n  return {\n    ok: true,\n    outcome: posted.entry.deduplicated ? \"already_recorded\" : \"accrued\",",
    replace: "  return {\n    ok: true,\n    outcome: posted.entry.deduplicated ? \"already_recorded\" : \"accrued\",",
    suite: "behavior",
    expect: ["R3"],
  },
  {
    defect: "The earn rate drifts from the 9% the contract fixes.",
    file: POLICY,
    find: "export const REWARDS_EARN_RATE_BASIS_POINTS = 900;",
    replace: "export const REWARDS_EARN_RATE_BASIS_POINTS = 1000;",
    suite: "behavior",
    expect: ["A1"],
  },
  {
    defect: "A sub-$1 redemption is silently rounded away instead of refused — the phantom-discount failure.",
    file: POLICY,
    find: "  if (redeem < REDEMPTION_MINIMUM_CENTS) {\n    return { ok: false, reason: \"below_minimum\", maxRedeemableCents };\n  }",
    replace: "  // MUTATED: the $1 floor is gone.",
    suite: "behavior",
    expect: ["C2", "C5"],
  },
  {
    defect: "Credits may fund more than half of an eligible purchase.",
    file: POLICY,
    find: "export const REDEMPTION_MAX_FRACTION_BASIS_POINTS = 5_000;",
    replace: "export const REDEMPTION_MAX_FRACTION_BASIS_POINTS = 9_000;",
    suite: "behavior",
    expect: ["C3", "C5"],
  },
  {
    defect:
      "A payment whose dispute was WON never promotes again, because the rule asks whether a " +
      "chargeback row EXISTS rather than whether a clawback is still outstanding.",
    file: POLICY,
    find: "    if (row.entryType === \"reversal_restoration\") return sum - amount;",
    replace: "    if (row.entryType === \"reversal_restoration\") return sum;",
    suite: "behavior",
    expect: ["R4", "H8"],
  },
  {
    defect: "A ledger the promotion sweep cannot read is treated as a clean payment rather than failing closed.",
    file: FULFILLMENT,
    find: "  if (disputeError) return false;",
    replace: "  if (disputeError) return true;",
    suite: "behavior",
    expect: ["H8"],
  },
  {
    defect:
      "The wallet a checkout spends from is taken from the request body, so an unauthenticated caller " +
      "naming any customer's auth id spends that customer's balance.",
    file: CHECKOUT,
    find: "  const creditsOwnerUserId = serverVerifiedOwnerUserId ?? bearerUserId ?? null;",
    replace: "  const creditsOwnerUserId = serverVerifiedOwnerUserId ?? bearerUserId ?? body.ownerUserId?.trim() ?? null;",
    suite: "route",
    expect: ["V1"],
  },
  {
    defect:
      "Credits reduce a RECURRING line item, so a one-time debit sets the subscription's price for " +
      "every renewal, for ever.",
    file: CHECKOUT,
    find: "  const creditsBlockedByRecurringPrice = stripeMode === \"subscription\";",
    replace: "  const creditsBlockedByRecurringPrice = false;",
    suite: "route",
    expect: ["V4"],
  },
  {
    defect:
      "A queue row is CLOSED before the refund id is validated, so an operator who leaves the box " +
      "empty destroys the obligation: the row reads resolved and nothing moved.",
    file: ADMIN,
    find: "    if (!wantsRestore && outcome === \"reversed\" && (!refundExternalId || refundExternalId.length < 4)) {\n      // Without a canonical refund id there is no stable idempotency anchor, and the whole reason\n      // this row exists is that the payload did not carry one.\n      return NextResponse.json({ ok: false, error: \"refund_external_id_required\" }, { status: 400 });\n    }",
    replace: "    // MUTATED: the refund id is validated after the claim instead.",
    suite: "route",
    expect: ["Y1"],
  },
  {
    defect:
      "A failed reversal of an ATTRIBUTABLE refund is discarded: the handler reports success, Stripe " +
      "never retries, and nothing records that the credits are still spendable.",
    file: EVENTS,
    find: "    if (!reversed.ok) {\n      await enqueueUnattributableRefund({",
    replace: "    if (false) {\n      await enqueueUnattributableRefund({",
    suite: "behavior",
    expect: ["R6"],
  },
  {
    defect:
      "A member removed from a business keeps its wallet for ever, reading and spending their " +
      "successor's earnings.",
    file: ADAPTER,
    find: "    if (await businessBindingRevoked(businessId, ownerUserId)) {\n      await releaseRevokedBusinessBinding(businessId, ownerUserId);\n      return null;\n    }",
    replace: "    // MUTATED: the binding outlives the membership.",
    suite: "behavior",
    expect: ["R7"],
  },

  // ----- DEFECTS THAT SURVIVED AN ADVERSARIAL REVIEW OF THIS VERY HARNESS.
  //
  // Each of these was demonstrated to pass the whole certification before the check that now
  // catches it existed. They are kept here because a coverage hole, once closed, is exactly the
  // kind of thing that reopens silently.
  {
    defect:
      "The rail-minimum / amount-due residual cap is removed. Credits wipe an invoice below the " +
      "payment rail's floor whenever the eligible purchase is larger than what is still due.",
    file: POLICY,
    find: "  if (redeem > byResidual) {",
    replace: "  if (false) {",
    suite: "behavior",
    expect: ["Q3b"],
  },
  {
    defect: "A payment a person REJECTED by hand still promotes its credits.",
    file: POLICY,
    find: "  if (facts.manualState === \"reversed\" || facts.manualState === \"rejected\") return false;",
    replace: "  if (facts.manualState === \"reversed\") return false;",
    suite: "behavior",
    expect: ["R4"],
  },
  {
    defect:
      "The replay mirror accepts a ledger the database would refuse to reconcile — a history that " +
      "passed through a state which cannot exist.",
    file: BEHAVIOR,
    find: "        acc.pendingCents < 0 ||\n        acc.availableCents < 0 ||\n        acc.reservedCents < 0 ||\n        (acc.recoveryCents ?? 0) < 0",
    replace: "        false",
    suite: "behavior",
    expect: ["Q12b"],
  },
  {
    defect:
      "The replay mirror's earn arm credits the full amount AND discharges the debt, so one " +
      "reconciliation hands back credits the customer owed and lets them spend them.",
    file: BEHAVIOR,
    find: "        acc.pendingCents += amount - off;\n        acc.lifetimeEarnedCents += amount;",
    replace: "        acc.pendingCents += amount;\n        acc.lifetimeEarnedCents += amount;",
    suite: "behavior",
    expect: ["Q12", "J1", "J2", "J3", "P6"],
  },
  {
    defect: "The replay mirror does not return a released hold to available.",
    file: BEHAVIOR,
    find: "      case \"redeem_release\":\n        acc.reservedCents -= amount;\n        acc.availableCents += amount;\n        return;",
    replace: "      case \"redeem_release\":\n        acc.reservedCents -= amount;\n        return;",
    suite: "behavior",
    expect: ["Q12", "J1", "J2", "J3", "P6"],
  },
  {
    defect: "The reversal's position token is read AFTER the sums it vouches for, so it vouches for nothing.",
    file: CORE,
    find: "  const positionRows = await input.ports.countPaymentPositionRows(input.paymentRecordId);\n\n  const [priorBasisSameKind",
    replace: "  const positionRows = 0 * (await input.ports.countPaymentPositionRows(input.paymentRecordId));\n\n  const [priorBasisSameKind",
    suite: "behavior",
    expect: ["Q1", "Q6"],
  },
  {
    defect: "An infrastructure error burns the refund's idempotency key with a zero-amount basis row.",
    file: CORE,
    find: "    if (posted.error !== \"negative_balance_refused\") {",
    replace: "    if (false) {",
    suite: "behavior",
    expect: ["Q15"],
  },

  // ----- THE BYPASSES AN ADVERSARIAL REVIEW USED TO DEFEAT THE TEXTUAL CHECKS.
  //
  // Each of these keeps every literal and every ordering the old assertions matched, and removes
  // the effect anyway. They are the reason those checks now assert conditions.
  {
    defect:
      "The checkout's verified identity is poisoned at its SOURCE: an ownership gate is handed the " +
      "request body's user id, so the line that reads it is untouched and an attacker-named wallet " +
      "is still planned, held and spent.",
    file: CHECKOUT,
    find: "    serverVerifiedOwnerUserId = ownerGate.ownerUserId;\n  }\n\n  // Gate 12",
    replace: "    serverVerifiedOwnerUserId = body.ownerUserId?.trim() || ownerGate.ownerUserId;\n  }\n\n  // Gate 12",
    suite: "behavior",
    expect: ["R1"],
  },
  {
    defect:
      "The business-binding revocation check is CALLED and its result discarded, so a removed " +
      "member keeps reading and spending the business wallet.",
    file: ADAPTER,
    find: "    if (await businessBindingRevoked(businessId, ownerUserId)) {\n      await releaseRevokedBusinessBinding(businessId, ownerUserId);\n      return null;\n    }",
    replace: "    const revoked = await businessBindingRevoked(businessId, ownerUserId);\n    void revoked;",
    suite: "behavior",
    expect: ["R7"],
  },
  {
    defect:
      "The queue's refund-id guard is disabled while its message and its position stay put, so an " +
      "operator who leaves the box empty closes the obligation with nothing moved.",
    file: ADMIN,
    find: "    if (!wantsRestore && outcome === \"reversed\" && (!refundExternalId || refundExternalId.length < 4)) {",
    replace: "    if (false) {",
    suite: "route",
    expect: ["Y1"],
  },
  {
    defect:
      "A restoration that moved NOTHING is reported as a success and the row stays closed, so the " +
      "clawback that lands minutes later stands for ever.",
    file: ADMIN,
    find: "      const movedNothing = restored.outcome !== \"restored\" && !quietSkip;",
    replace: "      const movedNothing = false && !quietSkip;",
    suite: "route",
    expect: ["Y14"],
  },
  {
    defect:
      "The queue accepts an outcome that contradicts the row: a won-dispute row settled as a " +
      "reversal, which moves nothing and destroys the obligation.",
    file: ADMIN,
    find: "    if (row.isRestorationWork && !wantsRestore && outcome !== \"no_action_required\") {",
    replace: "    if (false) {",
    suite: "route",
    expect: ["Y2"],
  },
  {
    defect:
      "A per-event refund amount is passed back as the rail's CUMULATIVE position, so the staff " +
      "resolution computes a delta of zero, moves nothing, and closes the row as reversed.",
    file: ADMIN,
    find: "        cumulativeRefundedCents: perEvent ? null : row.cumulativeRefundedCents,",
    replace: "        cumulativeRefundedCents: row.cumulativeRefundedCents,",
    suite: "route",
    expect: ["Y13"],
  },

  // ----- SQL. These require a local PostgreSQL; the runner reports them as skipped without one.
  {
    defect: "The posting function lets a payment give back more credits than it awarded.",
    file: MIGRATION,
    find: "        IF p_amount_cents > v_payment_earned - v_payment_claimed THEN",
    replace: "        IF FALSE THEN",
    suite: "sql",
    expect: ["S4"],
  },
  {
    defect: "The posting function lets a won dispute restore what a DIFFERENT dispute took.",
    file: MIGRATION,
    find: "        IF p_amount_cents > v_dispute_claimed THEN",
    replace: "        IF FALSE THEN",
    suite: "sql",
    expect: ["S5"],
  },
  {
    defect: "The compare-and-swap is not enforced, so a stale delta posts.",
    file: MIGRATION,
    find: "      IF p_expected_position_rows IS NOT NULL AND p_expected_position_rows <> v_position_rows THEN\n        RAISE EXCEPTION 'leonix_rewards_position_moved: payment % now has % reversal rows, not the % this delta was computed against',",
    replace: "      IF FALSE THEN\n        RAISE EXCEPTION 'leonix_rewards_position_moved: payment % now has % reversal rows, not the % this delta was computed against',",
    suite: "sql",
    expect: ["S6"],
  },
  {
    defect: "A redemption is allowed while a recovery debt is outstanding, handing out the same value twice.",
    file: MIGRATION,
    find: "      IF v_wallet.recovery_cents > 0 THEN\n        RAISE EXCEPTION 'leonix_rewards_post_entry: wallet % has an outstanding recovery balance of %',",
    replace: "      IF FALSE THEN\n        RAISE EXCEPTION 'leonix_rewards_post_entry: wallet % has an outstanding recovery balance of %',",
    suite: "sql",
    expect: ["S3"],
  },
  {
    defect:
      "The replay credits the full earn AND discharges the debt, so one reconciliation call hands back " +
      "credits the customer owed and lets them spend them.",
    file: MIGRATION,
    find: "        v_pending := v_pending + (v_entry.amount_cents - v_offset);\n        v_earned := v_earned + v_entry.amount_cents;",
    replace: "        v_pending := v_pending + v_entry.amount_cents;\n        v_earned := v_earned + v_entry.amount_cents;",
    suite: "sql",
    expect: ["S8"],
  },
  {
    defect: "A late release can undo a commit, consuming a neighbouring reservation's credits.",
    file: MIGRATION,
    find: "  IF v_redemption.status <> 'reserved' THEN\n    RAISE EXCEPTION 'leonix_rewards_claim_redemption: redemption % is %, not reserved',",
    replace: "  IF FALSE THEN\n    RAISE EXCEPTION 'leonix_rewards_claim_redemption: redemption % is %, not reserved',",
    suite: "sql",
    expect: ["S7"],
  },
  {
    defect:
      "The payment-wide dispute-restoration bound is deleted. A second payment's refund inflates " +
      "the wallet's lifetime clawback enough for a won dispute to be restored twice: 450 credits " +
      "from nothing, with every other guard intact.",
    file: MIGRATION,
    find: "        IF p_amount_cents > v_payment_claimed THEN\n          RAISE EXCEPTION 'leonix_rewards_position_moved: restoration of % exceeds the % a dispute took on payment %',",
    replace: "        IF FALSE THEN\n          RAISE EXCEPTION 'leonix_rewards_position_moved: restoration of % exceeds the % a dispute took on payment %',",
    suite: "sql",
    expect: ["S5"],
  },
  {
    defect:
      "The per-dispute restoration bound stops subtracting what that dispute already gave back, " +
      "so one dispute can be restored twice whenever the payment has another.",
    file: MIGRATION,
    find: "             - COALESCE(SUM(CASE WHEN l.entry_type = 'reversal_restoration' THEN l.amount_cents ELSE 0 END), 0)\n          INTO v_dispute_claimed",
    replace: "             - 0\n          INTO v_dispute_claimed",
    suite: "sql",
    expect: ["S5"],
  },
  {
    defect: "The staff-debit draw order flips to pending-first, letting a customer race the correction.",
    file: MIGRATION,
    find: "        IF v_wallet.available_cents >= v_draw THEN\n          v_available_delta := -v_draw;",
    replace: "        IF v_wallet.pending_cents >= v_draw THEN\n          v_pending_delta := -v_draw;",
    suite: "sql",
    expect: ["S8"],
  },
  {
    defect: "The replay does not return a released hold to available.",
    file: MIGRATION,
    find: "      WHEN 'redeem_release' THEN\n        v_reserved := v_reserved - v_entry.amount_cents;\n        v_available := v_available + v_entry.amount_cents;",
    replace: "      WHEN 'redeem_release' THEN\n        v_reserved := v_reserved - v_entry.amount_cents;",
    suite: "sql",
    expect: ["S8"],
  },
  {
    defect: "The replay forgets a standalone recovery debt, so a reconciliation lifts the redemption block.",
    file: MIGRATION,
    find: "      WHEN 'recovery_accrue' THEN\n        v_recovery := v_recovery + v_entry.amount_cents;",
    replace: "      WHEN 'recovery_accrue' THEN\n        v_recovery := v_recovery + 0;",
    suite: "sql",
    expect: ["S8"],
  },
  {
    defect: "The reversal ceiling stops being scoped to the wallet, so a misaimed clawback invents debt.",
    file: MIGRATION,
    find: "           AND l.wallet_id = p_wallet_id\n           AND l.entry_type IN ('earn_pending', 'earn_available');",
    replace: "           AND l.entry_type IN ('earn_pending', 'earn_available');",
    suite: "sql",
    expect: ["S5"],
  },
  {
    defect: "A reserve stops claiming its redemption row, so a hold can strand credits nothing can free.",
    file: MIGRATION,
    find: "      PERFORM public.leonix_rewards_claim_redemption(p_redemption_id, p_wallet_id, p_amount_cents, 'redeem_reserve');",
    replace: "      -- MUTATED: the reserve claims nothing.",
    suite: "sql",
    expect: ["S2"],
  },
  {
    defect: "The ledger becomes truncatable, taking the redemptions and the staff queue with it.",
    file: MIGRATION,
    find: "CREATE TRIGGER leonix_rewards_ledger_no_truncate_tg\n  BEFORE TRUNCATE ON public.leonix_rewards_ledger\n  FOR EACH STATEMENT EXECUTE FUNCTION public.leonix_rewards_ledger_reject_mutation();",
    replace: "-- MUTATED: no truncate guard.",
    suite: "sql",
    expect: ["S10"],
  },
  {
    defect: "The compare-and-swap becomes opt-out again, so a new caller silently gets the old defect.",
    file: MIGRATION,
    find: "      IF p_expected_position_rows IS NULL AND p_amount_cents > 0 THEN\n        RAISE EXCEPTION 'leonix_rewards_post_entry: % of % against payment % requires p_expected_position_rows',",
    replace: "      IF FALSE THEN\n        RAISE EXCEPTION 'leonix_rewards_post_entry: % of % against payment % requires p_expected_position_rows',",
    suite: "sql",
    expect: ["S10"],
  },
  {
    defect: "The replay's negative-bucket refusal moves back to the end of the loop, hiding an impossible state.",
    file: MIGRATION,
    find: "    IF v_pending < 0 OR v_available < 0 OR v_reserved < 0 OR v_recovery < 0 THEN\n      RAISE EXCEPTION 'leonix_rewards_recompute_wallet: wallet % replays to a negative bucket at entry_seq %",
    replace: "    IF FALSE THEN\n      RAISE EXCEPTION 'leonix_rewards_recompute_wallet: wallet % replays to a negative bucket at entry_seq %",
    suite: "sql",
    expect: ["S8"],
  },
  {
    defect: "The posting function becomes callable from a browser session.",
    file: MIGRATION,
    find: ") FROM PUBLIC, anon, authenticated;\nREVOKE ALL ON FUNCTION public.leonix_rewards_recompute_wallet(uuid) FROM PUBLIC, anon, authenticated;",
    replace: ") FROM PUBLIC;\nREVOKE ALL ON FUNCTION public.leonix_rewards_recompute_wallet(uuid) FROM PUBLIC, anon, authenticated;\nGRANT EXECUTE ON FUNCTION public.leonix_rewards_post_entry(uuid, text, integer, text, text, text, uuid, uuid, text, uuid, uuid, jsonb, integer) TO authenticated;",
    suite: "sql",
    expect: ["S11"],
  },
  // -------------------------------------------------------------------------
  // ROUND 2 — the nineteen defects that passed the whole certification, and the
  // three repairs that round produced. Every one of these is measured by a suite
  // that EXECUTES the code; none of them can be caught by reading it.
  // -------------------------------------------------------------------------
  {
    defect:
      "The staff rewards API's authorization gate is present but inert, so a forged `leonix_admin=1` " +
      "cookie reads any customer's balance and their last 100 ledger rows again.",
    file: ADMIN,
    find: "  const readAccess = await requireRevenueProtectedWriteAccess();\n  if (!readAccess.ok) {",
    replace: "  const readAccess = await requireRevenueProtectedWriteAccess();\n  if (!readAccess.ok && false) {",
    suite: "route",
    expect: ["X1", "X2"],
  },
  {
    defect:
      "The customer wallet read takes its identity from a query parameter when one is present — an " +
      "unauthenticated IDOR on any customer's balance and activity.",
    file: WALLET_API,
    find: "  const userId = await getBearerUserId(request);",
    replace:
      "  const userId = request.nextUrl.searchParams.get(\"as\") ?? (await getBearerUserId(request));",
    suite: "route",
    expect: ["W2"],
  },
  {
    defect:
      "The queue claim's compare-and-set result is ignored, so two staff resolving one row both move money.",
    file: ADMIN,
    find: "    if (!claimed.ok) {\n      return NextResponse.json({ ok: false, error: claimed.error }, { status: 409 });",
    replace: "    if (!claimed.ok && false) {\n      return NextResponse.json({ ok: false, error: claimed.error }, { status: 409 });",
    suite: "route",
    expect: ["Y6"],
  },
  {
    defect: "Closing a queue row stops being exclusive, so the claim no longer serialises two staff.",
    file: QUEUE,
    find: "    .eq(\"id\", input.id)\n    .eq(\"status\", \"open\")\n    .select(\"id\");",
    replace: "    .eq(\"id\", input.id)\n    .select(\"id\");",
    suite: "route",
    expect: ["Y6"],
  },
  {
    defect:
      "A re-filed truncated-payload row is stamped with the staff-typed refund id, turning a CUMULATIVE " +
      "amount into a per-event one: 675 clawed back where 450 was owed.",
    file: ADMIN,
    find: "          reason: `staff_resolution_reversal_failed${refiledRefundResolution(row, refundExternalId).evidenceSuffix}: ${reversed.reason ?? \"unknown\"}`,\n          stripeChargeId: row.stripeChargeId,\n          externalRef: refiledRefundResolution(row, refundExternalId).externalRef,",
    replace: "          reason: `staff_resolution_reversal_failed${refiledRefundResolution(row, refundExternalId).evidenceSuffix}: ${reversed.reason ?? \"unknown\"}`,\n          stripeChargeId: row.stripeChargeId,\n          externalRef: row.externalRef ?? refundExternalId,",
    suite: "route",
    expect: ["Y7"],
  },
  {
    defect: "A re-filed restoration row loses the dispute it is about, collapsing two obligations into one.",
    file: ADMIN,
    find: "          externalRef: refiledRefundResolution(row, disputeId).externalRef,\n        }).catch(() => ({ ok: false as const, error: \"enqueue_threw\" }));\n        return NextResponse.json(\n          { ok: false, error: restored.reason ?? \"restoration_failed\", requeued: refiled.ok },",
    replace: "          externalRef: null,\n        }).catch(() => ({ ok: false as const, error: \"enqueue_threw\" }));\n        return NextResponse.json(\n          { ok: false, error: restored.reason ?? \"restoration_failed\", requeued: refiled.ok },",
    suite: "route",
    expect: ["Y8"],
  },
  {
    defect:
      "The idempotency anchor comes from the keyboard again, so one wrong character writes a reversal " +
      "under another customer's future refund id and their genuine clawback silently deduplicates.",
    file: POLICY,
    find: "  if (row.externalRef) {\n    if (supplied && supplied !== row.externalRef) {\n      return { ok: false, error: \"supplied_id_does_not_match_row\" };\n    }\n    return { ok: true, anchor: row.externalRef };\n  }",
    replace: "  if (supplied) return { ok: true, anchor: supplied };\n  if (row.externalRef) return { ok: true, anchor: row.externalRef };",
    suite: "route",
    expect: ["Y4", "Y5"],
  },
  {
    defect:
      "A won-dispute row can no longer be closed at all: Restore moves nothing and No-action is refused, " +
      "so the row stays open for ever and the operator only ever reads an error code.",
    file: ADMIN,
    find: "    if (row.isRestorationWork && !wantsRestore && outcome !== \"no_action_required\") {",
    replace: "    if (row.isRestorationWork && !wantsRestore) {",
    suite: "route",
    expect: ["Y3"],
  },
  {
    defect: "A queue row stops naming its dispute, so a payment with two unresolved disputes files one row.",
    file: QUEUE,
    find: "        cumulative_refunded_cents: cumulative,\n        external_ref: externalRef,\n        reason: input.reason.slice(0, 300),\n        stripe_charge_id: input.stripeChargeId ?? null,\n        stripe_event_id: input.stripeEventId ?? null,\n        last_attempt_at: nowIso,\n      })\n      .select(\"id\")",
    replace: "        cumulative_refunded_cents: cumulative,\n        external_ref: null,\n        reason: input.reason.slice(0, 300),\n        stripe_charge_id: input.stripeChargeId ?? null,\n        stripe_event_id: input.stripeEventId ?? null,\n        last_attempt_at: nowIso,\n      })\n      .select(\"id\")",
    suite: "route",
    expect: ["Y9"],
  },
  {
    defect:
      "The staff redeem ignores a failed commit: the hold is stranded in `reserved` and staff are told " +
      "the discount applied.",
    file: ADMIN,
    find: "    if (!committed.ok) {\n      return NextResponse.json({ ok: false, error: committed.error, redemptionId: reserved.redemptionId }, { status: 500 });",
    replace: "    if (!committed.ok && false) {\n      return NextResponse.json({ ok: false, error: committed.error, redemptionId: reserved.redemptionId }, { status: 500 });",
    suite: "route",
    expect: ["Y10"],
  },
  {
    defect:
      "The record-already-net-of-credits refusal runs AFTER the reserve and the commit, so it refuses a " +
      "customer whose balance is already lighter.",
    file: ADMIN,
    find: "      if (preRow && preMeta.leonix_amount_is_net_of_credits === true) {",
    replace: "      if (preRow && preMeta.leonix_amount_is_net_of_credits === true && false) {",
    suite: "route",
    expect: ["Y12"],
  },
  {
    defect: "The compare-and-swap token becomes a constant, so the posting statement cannot detect a moved position.",
    file: ADAPTER,
    find: "      if (error) return -1;\n      return Number(count ?? 0);",
    replace: "      return 0;",
    suite: "route",
    expect: ["Z10"],
  },
  {
    defect:
      "`postEntry` echoes the request instead of the row that exists, so the cross-wallet guard becomes " +
      "`x !== x` and a correction code reused on a second customer silently moves nothing.",
    file: LEDGER_ROW,
    find: "  const walletId = row.wallet_id ? String(row.wallet_id) : request.walletId;",
    replace: "  const walletId = request.walletId;",
    suite: "route",
    expect: ["Z1"],
  },
  {
    defect:
      "`deduplicated` comes from a pre-read again, so the loser of a same-key race reports that it moved " +
      "money the ledger shows it did not move.",
    file: "app/lib/rewards/rewardsLedgerRow.ts",
    find: "  const deduplicated = nonceSaysCreated\n    ? false\n    : typeof returnedNonce === \"string\" || Boolean(request.priorEntryId) || disagreesWithRequest;",
    replace: "  const deduplicated = Boolean(request.priorEntryId);",
    suite: "route",
    expect: ["Z2"],
  },
  {
    defect:
      "A revoked business binding is left in place, so the customer's personal wallet collides on the " +
      "global `bound_user_id` index and they silently stop earning, spending and being correctable.",
    file: ADAPTER,
    find: "    await releaseRevokedBusinessBinding(businessId, ownerUserId);\n  } else if (boundRow?.owner_user_id) {",
    replace: "  } else if (boundRow?.owner_user_id) {",
    suite: "route",
    expect: ["Z6"],
  },
  {
    defect: "A CSV reconciliation row bypasses the canonical binding and credits a wallet nothing reads.",
    file: RECONCILIATION,
    find: "    return { ok: true, owner: bound ?? { kind: \"user\", ownerUserId: row.ownerUserId } };",
    replace: "    return { ok: true, owner: { kind: \"user\", ownerUserId: row.ownerUserId } };",
    suite: "route",
    expect: ["Z11"],
  },
  {
    defect: "The `LX001` race stops being recognised, so a losing reversal is reported as an unexplained error.",
    file: ADAPTER,
    find: "          (error as { code?: string }).code === PG_POSITION_MOVED ||\n          error.message.includes(\"leonix_rewards_position_moved\")",
    replace: "          false",
    suite: "route",
    expect: ["Z4"],
  },
  {
    defect:
      "The concurrency proof's timing floor is set to zero, so 'the racing session queued on the wallet " +
      "lock' becomes a caption over a number nothing checks.",
    file: "scripts/verify-ix-rewards-sql-behavior-01.sh",
    find: 'if [ "$HOLD_SECONDS" -lt 2 ] || [ "$MIN_MS" -lt 1000 ]; then',
    replace: 'if false; then',
    suite: "behavior",
    expect: ["R9"],
  },
  {
    defect:
      "The bearer identity is poisoned UPSTREAM of the assignment — `getBearerUserId(request) ?? " +
      "body.ownerUserId` — so an anonymous caller spends any customer's balance again, with the line " +
      "that was asserted about left untouched.",
    file: CHECKOUT,
    find: "  const bearerUserId = await getBearerUserId(request);",
    replace: "  const bearerUserId = (await getBearerUserId(request)) ?? (typeof body.ownerUserId === \"string\" ? body.ownerUserId.trim() : null);",
    suite: "route",
    expect: ["V1"],
  },
  {
    defect: "Twice the discount is taken off what Stripe is asked to charge, so the customer pays less than agreed.",
    file: CHECKOUT,
    find: "  const chargeableAmountCents = Math.max(0, amountCents - creditsAppliedCents);",
    replace: "  const chargeableAmountCents = Math.max(0, amountCents - creditsAppliedCents * 2);",
    suite: "route",
    expect: ["V2"],
  },
  {
    defect:
      "The 50% ceiling is quadrupled, so a customer applies far more loyalty value to one purchase " +
      "than the policy allows and the rail is charged correspondingly less.",
    file: CHECKOUT,
    find: "      eligiblePurchaseCents: subtotalCents,\n    });\n    if (planned.plannedCents > 0) {",
    replace: "      eligiblePurchaseCents: subtotalCents * 4,\n    });\n    if (planned.plannedCents > 0) {",
    suite: "route",
    expect: ["V3"],
  },
  {
    defect:
      "The recurring-plan refusal stops being exclusive: the branch and its reason survive, and credits " +
      "are applied to a subscription anyway — a one-time debit that sets the price of every renewal.",
    file: CHECKOUT,
    find: "  } else if (requestedCreditsCents > 0) {\n    const planned = await planCheckoutCredits({",
    replace: "  }\n  if (requestedCreditsCents > 0) {\n    const planned = await planCheckoutCredits({",
    suite: "route",
    expect: ["V4"],
  },
  // -------------------------------------------------------------------------
  // ROUND 3 — a final reviewer found a BLOCKER this round had INTRODUCED, plus
  // five more. Each is pinned here.
  // -------------------------------------------------------------------------
  {
    defect:
      "A truncated-payload queue row is keyed on the ROW rather than the rail's own refund id, so the " +
      "staff resolution and the rail's later delivery are two keys for one refund and their bases ADD: " +
      "900 clawed back where 450 was owed, and on a spent balance 450 cents of debt never owed.",
    file: POLICY,
    find: "  if (!supplied) return { ok: false, error: \"refund_external_id_required\" };\n  return { ok: true, anchor: supplied };",
    replace: "  return { ok: true, anchor: `queue:${row.id}` };",
    suite: "route",
    expect: ["Y5"],
  },
  {
    defect:
      "The adapter stops writing its nonce into `p_meta`, so the duplicate signal silently reverts to a " +
      "pre-read: eight concurrent deliveries of one won dispute report 2700 restored against 900 moved.",
    file: ADAPTER,
    find: "        p_meta: { ...(input.meta ?? {}), post_nonce: postNonce },",
    replace: "        p_meta: input.meta ?? {},",
    suite: "route",
    expect: ["Z3"],
  },
  {
    defect:
      "A PENDING INVITATION is treated as a revocation, so a customer invited to a business has their " +
      "wallet binding released by a mere READ — irreversibly, because accepting the invitation cannot " +
      "put it back once a personal wallet exists.",
    file: ADAPTER,
    find: "    return rows.every((r) => String(r.membership_status ?? \"\") === \"revoked\");",
    replace: "    return !rows.some((r) => String(r.membership_status ?? \"\") === \"active\");",
    suite: "route",
    expect: ["Z12", "Z13"],
  },
  {
    defect:
      "`no_action_required` can close a won-dispute row whose clawback is still outstanding, writing off " +
      "the customer's restoration with no ledger row, no dispute id, and nothing able to reopen it.",
    file: ADMIN,
    find: "      if (outstandingCents > 0) {",
    replace: "      if (outstandingCents > 0 && false) {",
    suite: "route",
    expect: ["Y3b"],
  },
  {
    defect:
      "A reversal key already held by ANOTHER wallet is reported as a duplicate delivery, so the webhook " +
      "believes the clawback was applied: the money went back, the credits stayed, nothing was queued.",
    file: CORE,
    find: "    if (posted.entry.walletId !== original.walletId) {",
    replace: "    if (false) {",
    suite: "route",
    expect: ["Z14"],
  },
  {
    defect:
      "A failed position read is reported as a position of ZERO, so a first reversal proceeds on a read " +
      "that never succeeded while the code's comment claims the sentinel is load-bearing.",
    file: ADAPTER,
    find: "      if (error) return -1;\n      return Number(count ?? 0);",
    replace: "      if (error) return 0;\n      return Number(count ?? 0);",
    suite: "route",
    expect: ["Z15"],
  },
  {
    defect:
      "`maybeSingle()` in the route harness accepts more than one row, making the harness kinder than " +
      "PostgREST in exactly the way this change was once burned by.",
    file: "scripts/lib/stubs/supabaseServer.mjs",
    find: "    if (rows.length > 1) {",
    replace: "    if (false) {",
    suite: "route",
    expect: ["Z17"],
  },
  {
    defect:
      "The restoration-outstanding guard stops checking the `-1` sentinel, so `-1 - -1` reads as " +
      "\"nothing outstanding\" from two queries that never ran and the dismissal button works again.",
    file: ADMIN,
    find: "      if (clawedBack < 0 || givenBack < 0) {",
    replace: "      if (false) {",
    suite: "route",
    expect: ["Y3b"],
  },
  {
    defect:
      "A failed restoration-sum read is reported as a sum of ZERO, so the per-dispute bound becomes as " +
      "permissive as the entire clawback and a reversal is sized from a position that was never read.",
    file: ADAPTER,
    find: "      if (error) return -1;\n      return ((data ?? []) as { amount_cents: number }[]).reduce((a, r) => a + Number(r.amount_cents ?? 0), 0);\n    },\n\n    async sumReversedForPaymentByKind",
    replace: "      return ((data ?? []) as { amount_cents: number }[]).reduce((a, r) => a + Number(r.amount_cents ?? 0), 0);\n    },\n\n    async sumReversedForPaymentByKind",
    suite: "route",
    expect: ["Z18"],
  },
  {
    defect:
      "A failed earn lookup reads as \"this payment earned nothing\", so a clawback does nothing, reports " +
      "success, and is never queued: the customer gets their money back and keeps the credits.",
    file: ADAPTER,
    find: "      if (error) throw new Error(`leonix_rewards_earn_lookup_failed: ${error.message.slice(0, 200)}`);",
    replace: "      void error;",
    suite: "route",
    expect: ["Z18"],
  },
  {
    defect:
      "The dismissal guard measures the PAYMENT's chargeback total instead of THIS dispute's, so a row " +
      "filed because the dispute was won before its clawback landed reads as settled and one click " +
      "writes off the customer's restoration.",
    file: ADMIN,
    find: "      if (!thisDispute) {",
    replace: "      if (false) {",
    suite: "route",
    expect: ["Y3c"],
  },
  {
    defect:
      "The idempotency anchor is derived for EVERY outcome again, so every truncated-payload row — the " +
      "whole reason this queue exists — becomes unclosable through the screen.",
    file: ADMIN,
    find: "    if (wantsRestore || outcome === \"reversed\") {",
    replace: "    if (true) {",
    suite: "route",
    expect: ["Y3d"],
  },
  {
    defect:
      "A DEDUPLICATED reversal closes the queue row as resolved with nothing moved, so two truncated rows " +
      "resolved under one refund id reverse 225 where 450 is owed and the second obligation vanishes.",
    file: ADMIN,
    find: "      } else if (reversalDeduplicated) {",
    replace: "      } else if (false) {",
    suite: "route",
    expect: ["Y16"],
  },
  {
    defect:
      "The staff resolution is keyed on the row again for a production-length refund id, restoring the " +
      "double clawback for every real Stripe refund while leaving short-id fixtures green.",
    file: ADMIN,
    find: "      resolutionExternalId = anchor.anchor;",
    replace: "      resolutionExternalId = refundExternalId.length > 20 && !row.externalRef ? `queue:${row.id}` : anchor.anchor;",
    suite: "route",
    expect: ["Y5"],
  },
  {
    defect:
      "Releasing a revoked binding drops its USER scope, so one customer's revocation clears the identity " +
      "of a successor bound to the same business wallet.",
    file: ADAPTER,
    find: "      .eq(\"business_id\", businessId)\n      .eq(\"bound_user_id\", userId);",
    replace: "      .eq(\"business_id\", businessId)\n      .not(\"bound_user_id\", \"is\", null);",
    suite: "route",
    expect: ["Z16"],
  },
  {
    defect:
      "The harness's multi-row `maybeSingle` fidelity is scoped to one table, so every other route read " +
      "over a non-unique column passes in the harness and errors in production.",
    file: "scripts/lib/stubs/supabaseServer.mjs",
    find: "    if (rows.length > 1) {",
    replace: "    if (rows.length > 1 && this.table === \"leonix_payment_records\") {",
    suite: "route",
    expect: ["Z17"],
  },
];

function runBehavior(): { ok: boolean; output: string } {
  try {
    const out = execFileSync("npx", ["tsx", BEHAVIOR], {
      cwd: TREE,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { ok: true, output: out };
  } catch (e) {
    const err = e as { stdout?: string; stderr?: string };
    return { ok: false, output: `${err.stdout ?? ""}${err.stderr ?? ""}` };
  }
}

/**
 * A DISPOSABLE COPY OF THE TREE. Mutations are applied here and every suite runs here, so the real
 * repository is never written to at all. `node_modules` and `public` are symlinked rather than
 * copied: nothing under either is ever mutated, and copying 470MB of images per run is pure waste.
 */
const TREE = mkdtempSync(join(tmpdir(), "leonix-mutation-"));
const REPO = process.cwd();

function buildDisposableTree(): void {
  cpSync(REPO, TREE, {
    recursive: true,
    dereference: false,
    filter: (src) => {
      const rel = src.slice(REPO.length + 1);
      if (!rel) return true;
      const top = rel.split("/")[0]!;
      return !["node_modules", ".git", ".next", "public", "coverage"].includes(top);
    },
  });
  for (const shared of ["node_modules", "public"]) {
    try {
      symlinkSync(join(REPO, shared), join(TREE, shared));
    } catch {
      /* Already present, or unavailable — the suites that need it will say so. */
    }
  }
}

function destroyDisposableTree(): void {
  try {
    rmSync(TREE, { recursive: true, force: true });
  } catch {
    /* A leftover scratch directory is harmless; a corrupted repository is not. */
  }
}

/**
 * The route suite. It EXECUTES the handlers rather than reading them, which is the only reason a
 * mutation to an authorization gate or to an argument a route passes can be caught at all.
 */
function runRoute(): { ok: boolean; output: string } {
  try {
    const out = execFileSync(
      "npx",
      ["tsx", "--tsconfig", "scripts/lib/tsconfig.harness.json", ROUTE],
      { cwd: TREE, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    );
    return { ok: true, output: out };
  } catch (e) {
    const err = e as { stdout?: string; stderr?: string };
    return { ok: false, output: `${err.stdout ?? ""}${err.stderr ?? ""}` };
  }
}

function runSql(): { ok: boolean; skipped: boolean; output: string } {
  try {
    const out = execFileSync("bash", ["scripts/verify-ix-rewards-sql-behavior-01.sh"], {
      cwd: TREE,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { ok: true, skipped: false, output: out };
  } catch (e) {
    const err = e as { status?: number; stdout?: string; stderr?: string };
    const output = `${err.stdout ?? ""}${err.stderr ?? ""}`;
    return { ok: false, skipped: err.status === 77, output };
  }
}

async function main() {
  buildDisposableTree();
  const failures: string[] = [];
  const rows: string[] = [];
  const restored = new Map<string, string>();
  let sqlAvailable = true;

  // EVERY `expect` MUST NAME A CHECK THAT EXISTS. A typo, or a check renamed out from under a
  // mutation, would otherwise be reported as "the suite went red but not on the expected check" —
  // or, with the old substring matcher, as a pass.
  const behaviourSource = readFileSync(BEHAVIOR, "utf8");
  const routeSource = readFileSync(ROUTE, "utf8");
  const sqlSource = readFileSync("scripts/sql/verify-ix-rewards-sql-behavior-01.sql", "utf8");
  for (const m of MUTATIONS) {
    for (const name of m.expect) {
      const exists =
        m.suite === "behavior"
          ? behaviourSource.includes(`await check("${name}`) || behaviourSource.includes(`check("${name}:`)
          : m.suite === "route"
            ? routeSource.includes(`await check("${name}`)
            : sqlSource.includes(`'${name} `);
      assert.ok(exists, `the mutation for "${m.defect.slice(0, 60)}" expects a check named ${name}, which does not exist`);
    }
  }

  // BASELINE. A mutation run against an already-red suite proves nothing.
  const baseline = runBehavior();
  assert.ok(baseline.ok, `the behavioural suite must be GREEN before mutating: ${baseline.output.slice(-500)}`);
  const routeBaseline = runRoute();
  assert.ok(routeBaseline.ok, `the route suite must be GREEN before mutating: ${routeBaseline.output.slice(-800)}`);
  const sqlBaseline = runSql();
  if (sqlBaseline.skipped) {
    sqlAvailable = false;
    console.log("— no local PostgreSQL: SQL mutations are SKIPPED, not passed");
  } else {
    assert.ok(sqlBaseline.ok, `the SQL suite must be GREEN before mutating: ${sqlBaseline.output.slice(-500)}`);
  }

  for (const m of MUTATIONS) {
    if (m.suite === "sql" && !sqlAvailable) {
      rows.push(`SKIP  ${m.file}: ${m.defect.slice(0, 70)}…`);
      continue;
    }
    // READ FROM THE REPOSITORY, WRITTEN ONLY TO THE COPY.
    const before = readFileSync(m.file, "utf8");
    const target = join(TREE, m.file);
    const occurrences = before.split(m.find).length - 1;
    if (occurrences !== 1) {
      failures.push(
        `${m.file}: the mutation anchor appears ${occurrences} times, so the mutation is not what it claims to be — ${m.defect.slice(0, 80)}`,
      );
      continue;
    }
    try {
      writeFileSync(target, before.replace(m.find, m.replace));
      const run = m.suite === "behavior" ? runBehavior() : m.suite === "route" ? runRoute() : runSql();
      if (run.ok) {
        failures.push(`NO TEST CATCHES IT — ${m.defect}`);
        rows.push(`HOLE  ${m.file}: ${m.defect.slice(0, 70)}…`);
        continue;
      }
      // MATCHED ON THE CHECK, NOT ON A SUBSTRING OF THE WHOLE FAILURE TEXT.
      //
      // This was `output.includes(name)`, and `expect: ["C"]` is one character: the earn-rate
      // mutation's failure text contains "C", so a mutation that broke something else entirely
      // would still have been reported as "ok, C catches it". Measured, one mutation's output
      // satisfied the `expect` of seven others. The behavioural suite prints `  ✗ <check name>: `
      // and the SQL suite raises `FAILED: <assertion name> `, so both are anchored.
      const caught = m.expect.filter((name) =>
        run.output.includes(`✗ ${name}:`) || run.output.includes(`FAILED: ${name} `),
      );
      if (caught.length === 0) {
        failures.push(
          `the suite went red but not on the expected check (${m.expect.join(", ")}) — ${m.defect.slice(0, 80)}\n${run.output.slice(-600)}`,
        );
        rows.push(`WRONG ${m.file}: ${m.defect.slice(0, 70)}…`);
        continue;
      }
      rows.push(`ok    ${caught.join("/")} catches: ${m.defect.slice(0, 68)}…`);
    } finally {
      // The COPY is put back so the next mutation is measured against a clean tree, and the
      // REPOSITORY is checked — it should never have changed, because nothing here writes to it.
      writeFileSync(target, before);
      assert.equal(readFileSync(target, "utf8"), before, `${m.file} was not restored in the working copy`);
      assert.equal(readFileSync(m.file, "utf8"), before, `${m.file} changed in the REPOSITORY, which nothing here may write to`);
      restored.set(m.file, before);
    }
  }

  // The suite is green again at the end, which is the other half of every mutation.
  const after = runBehavior();
  assert.ok(after.ok, `the behavioural suite must be GREEN after restoring every file:\n${after.output.slice(-800)}`);
  const routeAfter = runRoute();
  assert.ok(routeAfter.ok, `the route suite must be GREEN after restoring every file:\n${routeAfter.output.slice(-800)}`);
  if (sqlAvailable) {
    const sqlAfter = runSql();
    assert.ok(sqlAfter.ok, `the SQL suite must be GREEN after restoring every file:\n${sqlAfter.output.slice(-800)}`);
  }

  // AND THE TREE IS VERIFIED AT THE END, not only per iteration. The header used to claim this
  // and the code did not do it.
  for (const [file, original] of restored) {
    assert.equal(readFileSync(file, "utf8"), original, `${file} is not what it was before this run`);
  }
  destroyDisposableTree();

  for (const r of rows) console.log(r);
  if (failures.length) {
    console.error(`\nverify-ix-rewards-mutation-01: ${failures.length} MUTATION(S) SURVIVED`);
    for (const f of failures) console.error("  ✗ " + f);
    process.exit(1);
  }
  const ran = rows.filter((r) => r.startsWith("ok")).length;
  const skipped = rows.filter((r) => r.startsWith("SKIP")).length;
  console.log(
    `\nverify-ix-rewards-mutation-01: OK (${ran} defects reintroduced, each caught by a named check${
      skipped ? `; ${skipped} SQL mutation(s) skipped for want of a local PostgreSQL` : ""
    })`,
  );
}

void main();
