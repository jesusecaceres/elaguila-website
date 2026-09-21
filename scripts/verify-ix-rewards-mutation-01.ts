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
 * SAFETY. Every file is restored in a `finally`, and the run ends by re-reading each mutated file
 * and refusing to report success unless it is byte-identical to what it was before. Nothing here
 * touches the database, the network, Stripe, or git.
 */
import { strict as assert } from "node:assert";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

type Suite = "behavior" | "sql";

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
    expect: ["C"],
  },
  {
    defect: "Credits may fund more than half of an eligible purchase.",
    file: POLICY,
    find: "export const REDEMPTION_MAX_FRACTION_BASIS_POINTS = 5_000;",
    replace: "export const REDEMPTION_MAX_FRACTION_BASIS_POINTS = 9_000;",
    suite: "behavior",
    expect: ["C"],
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
    suite: "behavior",
    expect: ["R1"],
  },
  {
    defect:
      "Credits reduce a RECURRING line item, so a one-time debit sets the subscription's price for " +
      "every renewal, for ever.",
    file: CHECKOUT,
    find: "  const creditsBlockedByRecurringPrice = stripeMode === \"subscription\";",
    replace: "  const creditsBlockedByRecurringPrice = false;",
    suite: "behavior",
    expect: ["R2"],
  },
  {
    defect:
      "A queue row is CLOSED before the refund id is validated, so an operator who leaves the box " +
      "empty destroys the obligation: the row reads resolved and nothing moved.",
    file: ADMIN,
    find: "    if (!wantsRestore && outcome === \"reversed\" && (!refundExternalId || refundExternalId.length < 4)) {\n      // Without a canonical refund id there is no stable idempotency anchor, and the whole reason\n      // this row exists is that the payload did not carry one.\n      return NextResponse.json({ ok: false, error: \"refund_external_id_required\" }, { status: 400 });\n    }",
    replace: "    // MUTATED: the refund id is validated after the claim instead.",
    suite: "behavior",
    expect: ["P8"],
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
    find: "    if (!(await businessBindingStillActive(businessId, ownerUserId))) return null;",
    replace: "    // MUTATED: the binding outlives the membership.",
    suite: "behavior",
    expect: ["R7"],
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
    defect: "The posting function becomes callable from a browser session.",
    file: MIGRATION,
    find: ") FROM PUBLIC, anon, authenticated;\nREVOKE ALL ON FUNCTION public.leonix_rewards_recompute_wallet(uuid) FROM PUBLIC, anon, authenticated;",
    replace: ") FROM PUBLIC;\nREVOKE ALL ON FUNCTION public.leonix_rewards_recompute_wallet(uuid) FROM PUBLIC, anon, authenticated;\nGRANT EXECUTE ON FUNCTION public.leonix_rewards_post_entry(uuid, text, integer, text, text, text, uuid, uuid, text, uuid, uuid, jsonb, integer) TO authenticated;",
    suite: "sql",
    expect: ["S11"],
  },
];

function runBehavior(): { ok: boolean; output: string } {
  try {
    const out = execFileSync("npx", ["tsx", BEHAVIOR], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    return { ok: true, output: out };
  } catch (e) {
    const err = e as { stdout?: string; stderr?: string };
    return { ok: false, output: `${err.stdout ?? ""}${err.stderr ?? ""}` };
  }
}

function runSql(): { ok: boolean; skipped: boolean; output: string } {
  try {
    const out = execFileSync("bash", ["scripts/verify-ix-rewards-sql-behavior-01.sh"], {
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
  const failures: string[] = [];
  const rows: string[] = [];
  let sqlAvailable = true;

  // BASELINE. A mutation run against an already-red suite proves nothing.
  const baseline = runBehavior();
  assert.ok(baseline.ok, `the behavioural suite must be GREEN before mutating: ${baseline.output.slice(-500)}`);
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
    const before = readFileSync(m.file, "utf8");
    const occurrences = before.split(m.find).length - 1;
    if (occurrences !== 1) {
      failures.push(
        `${m.file}: the mutation anchor appears ${occurrences} times, so the mutation is not what it claims to be — ${m.defect.slice(0, 80)}`,
      );
      continue;
    }
    try {
      writeFileSync(m.file, before.replace(m.find, m.replace));
      const run = m.suite === "behavior" ? runBehavior() : runSql();
      if (run.ok) {
        failures.push(`NO TEST CATCHES IT — ${m.defect}`);
        rows.push(`HOLE  ${m.file}: ${m.defect.slice(0, 70)}…`);
        continue;
      }
      const caught = m.expect.filter((name) => run.output.includes(name));
      if (caught.length === 0) {
        failures.push(
          `the suite went red but not on the expected check (${m.expect.join(", ")}) — ${m.defect.slice(0, 80)}\n${run.output.slice(-600)}`,
        );
        rows.push(`WRONG ${m.file}: ${m.defect.slice(0, 70)}…`);
        continue;
      }
      rows.push(`ok    ${caught.join("/")} catches: ${m.defect.slice(0, 68)}…`);
    } finally {
      writeFileSync(m.file, before);
    }
    // AND THE RESTORE HAS TO BE EXACT, or a later mutation is measured against a changed file.
    assert.equal(readFileSync(m.file, "utf8"), before, `${m.file} was not restored byte-for-byte`);
  }

  // The suite is green again at the end, which is the other half of every mutation.
  const after = runBehavior();
  assert.ok(after.ok, `the behavioural suite must be GREEN after restoring every file:\n${after.output.slice(-800)}`);
  if (sqlAvailable) {
    const sqlAfter = runSql();
    assert.ok(sqlAfter.ok, `the SQL suite must be GREEN after restoring every file:\n${sqlAfter.output.slice(-800)}`);
  }

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
