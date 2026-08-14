/**
 * Package C Build 1 — Gates 6/8/9 (decision 11): capacity + grace write-path enforcement,
 * manual cleared payments, refund/dispute foundations, commercial-state badges.
 *
 * Behavioral tests on the pure guard policy cover the full adversarial matrix; source pins
 * prove the guard is wired into every convergence-touched mutation route.
 *
 * Run from repo root: npx tsx scripts/gate-pkgC-capacity-grace-writeguard-selftest.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";

import { decideCommercialWrite } from "../app/lib/listingPlans/commercialWriteGuardPolicy";
import {
  AUTOS_DEALER_BASE_INCLUDED_VEHICLES,
  AUTOS_DEALER_TOTAL_WITH_INVENTORY_PACK_LIMIT,
  BR_BASE_INCLUDED_PROPERTIES,
  BR_INVENTORY_PACK_MAX_CHILDREN,
  BR_TOTAL_ACTIVE_PROPERTY_LIMIT,
} from "../app/lib/listingPlans/publishCheckoutCheckpoint";
import { canTransitionManualState } from "../app/lib/listingPlans/refundDisputePolicy";
import {
  assessRefundPolicy,
  DESIGN_SETUP_RETENTION_PERCENT,
} from "../app/lib/listingPlans/refundDisputePolicy";
import { resolveCommercialStateBadges } from "../app/lib/listingPlans/commercialStateBadges";

const REPO_ROOT = path.resolve(__dirname, "..");
const read = (p: string) => readFileSync(path.join(REPO_ROOT, p), "utf8");

/* 1 — locked capacity constants: Autos 10/20; Bienes 1 base + 3 pack = 4 max. */
{
  assert.equal(AUTOS_DEALER_BASE_INCLUDED_VEHICLES, 10);
  assert.equal(AUTOS_DEALER_TOTAL_WITH_INVENTORY_PACK_LIMIT, 20);
  assert.equal(BR_BASE_INCLUDED_PROPERTIES, 1);
  assert.equal(BR_INVENTORY_PACK_MAX_CHILDREN, 3, "owner-locked: the pack adds THREE properties");
  assert.equal(BR_TOTAL_ACTIVE_PROPERTY_LIMIT, 4, "owner-locked: 1 base + 3 pack = 4 max");
}

/* 2 — pure guard policy: the adversarial matrix. */
{
  const base = { operation: "child_create" as const, capacityDelta: 1 };
  // Within capacity, healthy subscription → allowed.
  assert.equal(decideCommercialWrite({ ...base, activeCount: 9, limit: 10, subscriptionStatus: "active" }).allowed, true);
  // Capacity 10/10 without boost → rejected.
  const atLimit = decideCommercialWrite({ ...base, activeCount: 10, limit: 10, subscriptionStatus: "active" });
  assert.equal(atLimit.allowed, false);
  assert.equal(!atLimit.allowed && atLimit.code, "capacity_reached");
  // Boost raises the limit to 20.
  assert.equal(decideCommercialWrite({ ...base, activeCount: 19, limit: 20, subscriptionStatus: "active" }).allowed, true);
  assert.equal(decideCommercialWrite({ ...base, activeCount: 20, limit: 20, subscriptionStatus: "active" }).allowed, false);
  // Bienes: capacity 1 (no pack) → second property rejected; 4 with pack; 5th rejected.
  assert.equal(decideCommercialWrite({ ...base, activeCount: 1, limit: 1, subscriptionStatus: "active" }).allowed, false);
  assert.equal(decideCommercialWrite({ ...base, activeCount: 3, limit: 4, subscriptionStatus: "active" }).allowed, true);
  assert.equal(decideCommercialWrite({ ...base, activeCount: 4, limit: 4, subscriptionStatus: "active" }).allowed, false);
  // GRACE blocks every capacity increase (create/restore/republish)…
  for (const operation of ["child_create", "child_restore", "child_republish", "publish_increase"] as const) {
    const blocked = decideCommercialWrite({ operation, capacityDelta: 1, activeCount: 0, limit: 10, subscriptionStatus: "grace" });
    assert.equal(blocked.allowed, false, `${operation} blocked during grace`);
    assert.equal(!blocked.allowed && blocked.code, "grace_blocks_new_capacity");
  }
  // …but ordinary edits to existing paid inventory stay allowed during grace.
  const editInGrace = decideCommercialWrite({ operation: "child_edit", capacityDelta: 0, activeCount: 10, limit: 10, subscriptionStatus: "grace" });
  assert.equal(editInGrace.allowed, true);
  assert.equal(editInGrace.allowed && editInGrace.graceActive, true);
  // Content edits remain possible even suspended (content preserved doctrine).
  assert.equal(decideCommercialWrite({ operation: "child_edit", capacityDelta: 0, activeCount: 10, limit: 10, subscriptionStatus: "suspended" }).allowed, true);
  // Suspended/canceled block capacity increases.
  assert.equal(decideCommercialWrite({ ...base, activeCount: 0, limit: 10, subscriptionStatus: "suspended" }).allowed, false);
  assert.equal(decideCommercialWrite({ ...base, activeCount: 0, limit: 10, subscriptionStatus: "canceled" }).allowed, false);
  // Add-on purchase: state-gated but never count-blocked (a full dealer NEEDS the boost)…
  assert.equal(decideCommercialWrite({ operation: "addon_checkout", capacityDelta: 1, activeCount: 10, limit: 10, subscriptionStatus: "active" }).allowed, true);
  // …and still blocked during grace (no new add-on activation with unresolved payment).
  assert.equal(decideCommercialWrite({ operation: "addon_checkout", capacityDelta: 1, activeCount: 0, limit: 10, subscriptionStatus: "grace" }).allowed, false);
  // No subscription record (legacy/one-time context) → count-only enforcement.
  assert.equal(decideCommercialWrite({ ...base, activeCount: 0, limit: 10, subscriptionStatus: "none" }).allowed, true);
}

/* 3 — guard wiring pins (server mutation paths; adversarial API access has no UI to bypass). */
{
  const autosCreate = read("app/api/clasificados/autos/listings/route.ts");
  assert.ok(autosCreate.includes("assertCommercialCapacityForWrite"), "autos child create guarded");
  assert.ok(autosCreate.includes('operation: "child_create"'), "child_create semantics");
  const autosRestore = read("app/api/clasificados/autos/listings/[id]/restore/route.ts");
  assert.ok(autosRestore.includes("assertCommercialCapacityForWrite"), "autos restore guarded (restore increases active inventory)");
  const checkout = read("app/api/revenue-os/checkout/route.ts");
  assert.ok((checkout.match(/assertCommercialCapacityForWrite/g) ?? []).length >= 2, "both add-on checkout gates guarded (autos + bienes)");
  const brEdit = read("app/api/clasificados/bienes-raices/listing-edit/route.ts");
  assert.ok(brEdit.includes("assertCommercialCapacityForWrite"), "BR listing-edit guarded (delta-0 semantics)");
  // BR paid activation clamps children to the pack capacity server-side.
  const brActivation = read("app/lib/clasificados/bienes-raices/brListingPaymentService.ts");
  assert.ok(brActivation.includes(".limit(BR_INVENTORY_PACK_MAX_CHILDREN)"), "BR sibling activation clamped to pack capacity (now 3 → max 4 active)");
  // The guard verifies client-supplied parent ids (ownership + role) — trusted-parent gap closed.
  const guard = read("app/lib/listingPlans/commercialWriteGuard.ts");
  assert.ok(guard.includes("parent_not_owned") && guard.includes("parent_wrong_role"), "parent ownership + role verified server-side");
  assert.ok(guard.includes("reconcileSubscriptionRow"), "grace expiry reconciled INLINE at write time (never dashboard-dependent)");
}

/* 4 — manual cleared payments: clearing sub-machine (checks must reach FINAL clearance). */
{
  assert.equal(canTransitionManualState("pending_verification", "cleared"), true);
  assert.equal(canTransitionManualState("pending_verification", "rejected"), true);
  assert.equal(canTransitionManualState("pending_verification", "reversed"), false, "cannot reverse an unverified payment");
  assert.equal(canTransitionManualState("cleared", "reversed"), true);
  assert.equal(canTransitionManualState("cleared", "cleared"), false, "re-clearing is idempotent at the caller, not a transition");
  assert.equal(canTransitionManualState("rejected", "cleared"), false, "rejected is terminal");
  assert.equal(canTransitionManualState("reversed", "cleared"), false, "reversed is terminal");
  const manual = read("app/lib/listingPlans/manualClearedPayments.ts");
  assert.ok(manual.includes('.eq("manual_state", "pending_verification")'), "clearance is a CAS — concurrent double-clear collapses");
  assert.ok(manual.includes('grantSource: "manual_cleared_payment"'), "manual fulfillment carries its provenance");
  assert.ok(!manual.includes("stripe.checkout"), "no fake Stripe artifacts for manual payments");
}

/* 5 — refund/dispute foundations: contractual 25% design/setup preserved (NOT the promo). */
{
  assert.equal(DESIGN_SETUP_RETENTION_PERCENT, 25, "Agreement v1.2 clause 12 retention — contract policy, never a promo");
  assert.equal(assessRefundPolicy("pre_work").refundEligible, "full_minus_processor_costs");
  const designSetup = assessRefundPolicy("design_setup");
  assert.equal(designSetup.refundEligible, "partial_design_setup_retention");
  assert.equal(designSetup.retentionPercent, 25);
  assert.equal(designSetup.requiresAdminReview, true, "never auto-charged/auto-retained");
  for (const stage of ["proof_approved", "reserved", "committed", "published", "activated"] as const) {
    assert.equal(assessRefundPolicy(stage).refundEligible, "non_refundable");
  }
  const foundations = read("app/lib/listingPlans/refundDisputeFoundations.ts");
  assert.ok(foundations.includes("DO NOT CONFUSE WITH THE RETIRED PROMOTIONAL CAMPAIGN"), "contract-vs-promo 25% distinction documented at the constant");
  assert.ok(foundations.includes("original_payment_preserved"), "refunds preserve original payment history");
  assert.ok(foundations.includes("not separately refundable"), "integrated print+digital rule surfaced");
}

/* 6 — commercial-state badges: independent truthful states. */
{
  const grace = resolveCommercialStateBadges({ subscriptionStatus: "grace", graceEndsAt: "2026-08-12T12:00:00Z" });
  assert.equal(grace[0]?.key, "grace");
  assert.ok(grace[0]?.labelEn.includes("2026-08-12"), "grace end date shown");
  assert.equal(resolveCommercialStateBadges({ subscriptionStatus: "suspended", suspensionReason: "payment_failure" })[0]?.key, "suspended_nonpayment");
  assert.equal(resolveCommercialStateBadges({ subscriptionStatus: "suspended", suspensionReason: "chargeback" })[0]?.key, "disputed");
  assert.equal(resolveCommercialStateBadges({ subscriptionStatus: "active", cancelAtPeriodEnd: true })[0]?.key, "cancels_at_period_end");
  assert.ok(resolveCommercialStateBadges({ subscriptionStatus: "active", recoveredAt: "2026-08-05T00:00:00Z" }).some((b) => b.key === "payment_recovered"));
  assert.ok(resolveCommercialStateBadges({ paymentStatus: "refunded" }).some((b) => b.key === "refunded"));
  assert.ok(resolveCommercialStateBadges({ manualState: "cleared" }).some((b) => b.key === "manual_cleared_payment"));
  assert.ok(resolveCommercialStateBadges({ grantSource: "print_included" }).some((b) => b.key === "included_with_print"));
  assert.deepEqual(resolveCommercialStateBadges({}), [], "no state = no fabricated badges");
}

/* 7 — sweep endpoint: secured, machine-executable, never unauthenticated. */
{
  const sweep = read("app/api/revenue-os/admin/subscription-sweep/route.ts");
  assert.ok(sweep.includes("requireLeonixAdminPermission"), "admin-session authorization path");
  assert.ok(sweep.includes("timingSafeEqual"), "machine secret uses constant-time comparison");
  assert.ok(sweep.includes('{ status: 401 }'), "unauthenticated requests rejected");
  assert.ok(sweep.includes("dryRun"), "dry-run supported");
  assert.ok(!/LEONIX_SUBSCRIPTION_SWEEP_KEY\s*[^?]?=/.test(sweep), "the secret value is never assigned/echoed in code");
}

console.log("gate-pkgC-capacity-grace-writeguard-selftest: all assertions passed.");
