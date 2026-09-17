/**
 * Gate 2 (Owner-Safe Bridge Reconciliation) — real runtime unit tests for the new
 * shapeProposalForOwner / isOwnerVisibleProposalStatus pure logic added to
 * app/lib/business/proposals/logic.ts. Pure functions, no I/O, no "server-only" marker anywhere
 * in the import chain — imported and executed directly, no stripping tricks needed.
 * Run from repo root: npx tsx scripts/test-business-home-owner-safe-shaping.ts
 */
import { strict as assert } from "node:assert";
import { isOwnerVisibleProposalStatus, shapeProposalForOwner } from "../app/lib/business/proposals/logic";
import type { BusinessProposal } from "../app/lib/business/proposals/types";

let passed = 0;
function check(name: string, fn: () => void): void {
  try {
    fn();
    passed += 1;
    console.log(`  PASS  ${name}`);
  } catch (e) {
    console.error(`  FAIL  ${name}`);
    console.error(e);
    process.exitCode = 1;
  }
}

console.log("Gate 2 — Business Home owner-safe shaping — real runtime tests\n");

function fakeProposal(overrides: Partial<BusinessProposal> = {}): BusinessProposal {
  return {
    id: "prop-1",
    businessId: "biz-1",
    sourceRecommendationId: null,
    status: "owner_review",
    version: 1,
    isCurrent: true,
    ownerGoalEn: "Grow leads",
    ownerGoalEs: "Crecer leads",
    verifiedNeedEn: "need",
    verifiedNeedEs: "necesidad",
    recommendedIntervention: "ad_package",
    freeOptionEn: null,
    freeOptionEs: null,
    scopeEn: "scope",
    scopeEs: "alcance",
    deliverablesEn: "deliverables",
    deliverablesEs: "entregables",
    exclusionsEn: null,
    exclusionsEs: null,
    responsibilitiesEn: "resp",
    responsibilitiesEs: "resp-es",
    timelineEn: "2 weeks",
    timelineEs: "2 semanas",
    reviewDate: "2026-10-01",
    pricingSnapshot: { packageKey: "restaurantes_base_monthly", packageLabel: "Base", priceCents: 39900, billingMode: "monthly", durationDays: 30, pricingSource: "revenue_pricing_matrix", pricingConfirmed: true },
    entitlementReference: "internal-ref-xyz",
    successMetricEn: "metric",
    successMetricEs: "metrica",
    createdActorType: "staff",
    createdByRosterId: "roster-secret-123",
    createdByAuthUserId: "auth-staff-uuid",
    createdByEmail: "staff@leonix.internal",
    createdByRole: "sales_rep",
    acceptedActorType: null,
    acceptedByRosterId: null,
    acceptedByAuthUserId: null,
    acceptedByEmail: null,
    acceptedByRole: null,
    acceptedAt: null,
    declinedAt: null,
    createdAt: "2026-09-01T00:00:00Z",
    updatedAt: "2026-09-01T00:00:00Z",
    ...overrides,
  };
}

check("isOwnerVisibleProposalStatus: draft and staff_review are staff-only, never owner-visible", () => {
  assert.equal(isOwnerVisibleProposalStatus("draft"), false);
  assert.equal(isOwnerVisibleProposalStatus("staff_review"), false);
});
check("isOwnerVisibleProposalStatus: owner_review/accepted/declined/expired/superseded/cancelled are all visible", () => {
  for (const s of ["owner_review", "accepted", "declined", "expired", "superseded", "cancelled"] as const) {
    assert.equal(isOwnerVisibleProposalStatus(s), true, `expected ${s} to be owner-visible`);
  }
});

check("shapeProposalForOwner strips every staff/owner actor-attribution field (roster id, auth user id, email, role — created AND accepted)", () => {
  const shaped = shapeProposalForOwner(fakeProposal());
  const shapedKeys = Object.keys(shaped);
  for (const forbidden of [
    "createdByRosterId", "createdByAuthUserId", "createdByEmail", "createdByRole",
    "acceptedByRosterId", "acceptedByAuthUserId", "acceptedByEmail", "acceptedByRole",
    "createdActorType", "entitlementReference",
  ]) {
    assert.ok(!shapedKeys.includes(forbidden), `owner-safe shape leaked forbidden field: ${forbidden}`);
  }
});
check("shapeProposalForOwner preserves every genuinely owner-relevant field", () => {
  const raw = fakeProposal();
  const shaped = shapeProposalForOwner(raw);
  assert.equal(shaped.id, raw.id);
  assert.equal(shaped.status, raw.status);
  assert.equal(shaped.verifiedNeedEn, raw.verifiedNeedEn);
  assert.equal(shaped.scopeEn, raw.scopeEn);
  assert.equal(shaped.reviewDate, raw.reviewDate);
  assert.deepEqual(shaped.pricingSnapshot, raw.pricingSnapshot);
  assert.equal(shaped.acceptedActorType, raw.acceptedActorType);
});
check("shapeProposalForOwner never leaks a staff roster id/email even on an accepted-by-staff proposal", () => {
  const raw = fakeProposal({
    status: "accepted",
    acceptedActorType: "staff",
    acceptedByRosterId: "roster-secret-999",
    acceptedByAuthUserId: "auth-staff-uuid-2",
    acceptedByEmail: "closer@leonix.internal",
    acceptedByRole: "sales_manager",
    acceptedAt: "2026-09-05T00:00:00Z",
  });
  const shaped = shapeProposalForOwner(raw);
  const serialized = JSON.stringify(shaped);
  assert.ok(!serialized.includes("roster-secret"), "serialized owner-safe shape must never contain a roster id");
  assert.ok(!serialized.includes("leonix.internal"), "serialized owner-safe shape must never contain a staff email");
  assert.equal(shaped.acceptedActorType, "staff", "the non-identifying actor TYPE is fine to keep — only identity fields are stripped");
});

console.log(`\n${passed} check(s) passed.`);
if (process.exitCode) {
  console.error("\nSome checks FAILED.");
} else {
  console.log("\nAll checks passed.");
}
