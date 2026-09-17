/**
 * Owner Attention Truth Gate — focused runtime verifier for the canonical owner attention
 * contract (app/(site)/dashboard/lib/ownerAttentionModel.ts). Same hand-rolled node:assert
 * convention as every other verify-*.ts script in this repo. Exercises the real pure mapper
 * functions with structurally realistic inputs (shaped exactly like DerivedFeedItem /
 * AdvisorSignal) — no network, no database, no fabricated business data.
 *
 * Run from repo root: npx tsx scripts/verify-owner-attention-truth-01.ts
 */
import { strict as assert } from "node:assert";
import {
  mapDerivedFeedItemToAttention,
  mapAdvisorSignalToAttention,
  sortOwnerAttentionItems,
  dedupeOwnerAttentionItems,
  type OwnerAttentionItem,
} from "../app/(site)/dashboard/lib/ownerAttentionModel";
import type { DerivedFeedItem, DerivedFeedKind } from "../app/(site)/dashboard/lib/derivedDashboardFeed";
import type { AdvisorSignal } from "../app/(site)/dashboard/lib/businessHomeClient";

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

console.log("Owner Attention Truth Gate — focused tests\n");

const ALL_DERIVED_KINDS: DerivedFeedKind[] = [
  "expire_visibility",
  "expire_listing",
  "draft",
  "profile_city",
  "inbox",
  "low_views",
  "moderation",
  "payment_attention",
];

function fixtureDerivedItem(kind: DerivedFeedKind): DerivedFeedItem {
  return {
    id: `${kind}-fixture-1`,
    kind,
    title: `Fixture title for ${kind}`,
    href: `/dashboard/mis-anuncios/fixture-1?lang=es`,
    priority: 50,
    listingId: kind === "profile_city" || kind === "inbox" || kind === "draft" ? null : "fixture-1",
    category: kind === "payment_attention" ? "restaurantes" : null,
  };
}

// --- Every DerivedFeedKind maps to a complete, non-empty item -----------------------------------

for (const kind of ALL_DERIVED_KINDS) {
  check(`mapDerivedFeedItemToAttention(${kind}) produces a complete item`, () => {
    const item = mapDerivedFeedItemToAttention(fixtureDerivedItem(kind), "es");
    assert.ok(item.id.startsWith("df:"), "id must be namespaced df:");
    assert.ok(item.reason.trim().length > 0, "reason must not be empty");
    assert.ok(item.recommendedAction.trim().length > 0, "recommendedAction must not be empty");
    assert.ok(item.actionHref.trim().length > 0, "actionHref must not be empty");
    assert.ok(["critical", "warning", "opportunity", "info"].includes(item.severity), "severity must be a real enum value");
    assert.ok(["PROVEN", "PARTIAL", "NEEDS_TRIAGE"].includes(item.provenanceState), "provenanceState must be a real enum value");
  });
}

// --- Moderation: PROVEN with real evidence, PARTIAL without (never fabricated) ------------------

check("moderation item with real review evidence is PROVEN and carries the real reason", () => {
  const item = mapDerivedFeedItemToAttention(fixtureDerivedItem("moderation"), "es", {
    decision: "needs_review",
    reasonCategory: "prohibited_item",
    reasonText: "Listing mentions a prohibited item.",
    reviewedAt: "2026-09-01T00:00:00.000Z",
  });
  assert.equal(item.provenanceState, "PROVEN");
  assert.ok(item.reason.includes("prohibited_item"), "reason must surface the real recorded reason category");
  assert.equal(item.evidenceSummary, "Listing mentions a prohibited item.");
});

check("moderation item with no review row on file is honestly PARTIAL, never fabricated", () => {
  const item = mapDerivedFeedItemToAttention(fixtureDerivedItem("moderation"), "es", null);
  assert.equal(item.provenanceState, "PARTIAL");
  assert.equal(item.evidenceSummary, null, "must never invent evidence when none exists");
});

// --- Every AdvisorSignalType maps to a complete, PROVEN item -------------------------------------

const ALL_SIGNAL_TYPES = [
  "COMMITMENT_DUE",
  "COMMITMENT_BLOCKED",
  "POSTPONED_RECOMMENDATION_REVIEW_DUE",
  "CREATIVE_AWAITING_REVIEW",
  "PROPOSAL_AWAITING_OWNER",
  "UNRESOLVED_CONTRADICTION",
  "STALE_CRITICAL_TRUTH",
  "OUTCOME_REVIEW_DUE",
  "CAPACITY_STRETCHED",
] as const;

const ALL_SEVERITIES = ["information", "opportunity", "priority", "blocked"] as const;

for (const signalType of ALL_SIGNAL_TYPES) {
  check(`mapAdvisorSignalToAttention(${signalType}) produces a complete, PROVEN item`, () => {
    const signal: AdvisorSignal = {
      id: `${signalType}-fixture`,
      signalType,
      severity: ALL_SEVERITIES[0],
      status: "active",
      titleEs: `Título ${signalType}`,
      titleEn: `Title ${signalType}`,
      explanationEs: `Explicación ${signalType}`,
      explanationEn: `Explanation ${signalType}`,
      detectedAt: "2026-09-01T00:00:00.000Z",
    };
    const item = mapAdvisorSignalToAttention(signal, "en", "biz-fixture-1");
    assert.ok(item.id.startsWith("adv:"), "id must be namespaced adv:");
    assert.equal(item.provenanceState, "PROVEN", "Advisor signals are deterministic/evidence-backed — never NEEDS_TRIAGE");
    assert.equal(item.businessId, "biz-fixture-1", "businessId must carry the exact authorized business");
    assert.ok(item.recommendedAction.trim().length > 0);
    assert.ok(item.actionHref.trim().length > 0);
  });
}

check("every AdvisorSignalSeverity maps to a real OwnerAttentionSeverity", () => {
  for (const severity of ALL_SEVERITIES) {
    const signal: AdvisorSignal = {
      id: "sev-fixture",
      signalType: "CAPACITY_STRETCHED",
      severity,
      status: "active",
      titleEs: "t",
      titleEn: "t",
      explanationEs: "e",
      explanationEn: "e",
      detectedAt: "2026-09-01T00:00:00.000Z",
    };
    const item = mapAdvisorSignalToAttention(signal, "es", "biz-fixture-1");
    assert.ok(["critical", "warning", "opportunity", "info"].includes(item.severity));
  }
});

// --- Sorting and dedup ----------------------------------------------------------------------------

check("sortOwnerAttentionItems ranks critical first", () => {
  const items: OwnerAttentionItem[] = [
    { ...mapDerivedFeedItemToAttention(fixtureDerivedItem("low_views"), "es") }, // info
    { ...mapDerivedFeedItemToAttention(fixtureDerivedItem("payment_attention"), "es") }, // critical
    { ...mapDerivedFeedItemToAttention(fixtureDerivedItem("inbox"), "es") }, // opportunity
  ];
  const sorted = sortOwnerAttentionItems(items);
  assert.equal(sorted[0].severity, "critical");
});

check("dedupeOwnerAttentionItems removes exact-id duplicates without dropping distinct causes", () => {
  const a = mapDerivedFeedItemToAttention(fixtureDerivedItem("moderation"), "es");
  const b = mapDerivedFeedItemToAttention({ ...fixtureDerivedItem("moderation") }, "es"); // same id -> duplicate
  const c = mapDerivedFeedItemToAttention(fixtureDerivedItem("low_views"), "es"); // distinct cause
  const out = dedupeOwnerAttentionItems([a, b, c]);
  assert.equal(out.length, 2, "same underlying condition must collapse to one item, distinct causes must both survive");
});

console.log(`\n${passed} checks passed.`);
if (process.exitCode) {
  console.error("\nSome checks FAILED.");
} else {
  console.log("\nAll checks PASSED.");
}
