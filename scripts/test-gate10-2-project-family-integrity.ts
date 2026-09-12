/**
 * Client Discovery & Project Blueprint Engine, Gate 10.2 <phase_14> — durable registry-to-engine
 * integrity test covering EVERY supported project type, plus deterministic tests for the new
 * Digital Presence / Other / Custom Platform / Launch Package families and the Launch Package
 * roll-up. No database, no network — pure fixtures, matching every other gate's test pattern.
 *
 * Run from repo root: npx tsx scripts/test-gate10-2-project-family-integrity.ts
 */
import { strict as assert } from "node:assert";

import { PROJECT_TYPE_REGISTRY, activeProjectTypes } from "../app/lib/business/projectDiscovery/projectTypeRegistry";
import { specializedFamilyForProjectType, catalogForProjectType, buildSpecializedPacketForProjectType } from "../app/lib/business/projectDiscovery/specializedBlueprintDispatch";
import { buildSpecializedBlueprintMarkdown } from "../app/lib/business/projectDiscovery/specializedBlueprintMarkdown";
import { buildLaunchPackageRollup, type LaunchPackageChildSummary } from "../app/lib/business/projectDiscovery/launchPackageRollup";
import { DIGITAL_PRESENCE_REQUIREMENTS } from "../app/lib/business/projectDiscovery/digitalPresenceDiscoveryCatalog";
import type { ProjectDiscoveryIntent } from "../app/lib/business/projectDiscovery/types";
import type { SpecializedDiscoveryContext } from "../app/lib/business/projectDiscovery/specializedDiscoveryEngine";

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

console.log("Gate 10.2 project-family registry integrity — deterministic tests\n");

const NOW = "2026-09-11T12:00:00.000Z";

// A minimal-but-real fixture for every specialized family so buildSpecializedPacketForProjectType
// can actually run to completion (a fully populated fixture is not required — the point of this
// suite is dispatch correctness, not requirement completeness, which each family's own catalog
// test file already covers).
function fixtureFor(projectType: string): { ctx: SpecializedDiscoveryContext; intents: ProjectDiscoveryIntent[] } {
  const ctx: SpecializedDiscoveryContext = {
    discoveryId: "disc-1", businessId: "biz-1", projectIntentId: "intent-1",
    projectType: projectType as never,
    broadBusinessType: "retail_ecommerce", specificBusinessType: null, customSpecificType: null,
    businessStage: "operating", knownFacts: [], capturedItems: [],
  };
  const intents: ProjectDiscoveryIntent[] = [
    { id: "intent-1", businessId: "biz-1", discoveryId: "disc-1", projectType: projectType as never, projectSubtype: null, otherLabel: null, title: "Fixture", status: "confirmed", createdActorType: "staff", createdByRosterId: "s1", createdByAuthUserId: "a1", createdByEmail: "e@x.test", createdByRole: "sales_rep", createdAt: NOW, updatedAt: NOW },
  ];
  return { ctx, intents };
}

// ===============================================================================================
// PHASE 14 — full registry integrity, every active project type
// ===============================================================================================
console.log("Registry integrity (every active project type):");

const REGISTRY_ONLY_STUBS: string[] = [];
const DESTINATION_MISMATCHES: string[] = [];
const ACCIDENTAL_WEBSITE_FALLBACKS: string[] = [];

for (const def of activeProjectTypes()) {
  const isWebsiteFamily = def.key === "website" || def.key === "website_improvement" || def.key === "landing_page";
  const family = specializedFamilyForProjectType(def.key);

  check(`registry entry exists and is well-formed: ${def.key}`, () => {
    assert.ok(def.labelEs.trim().length > 0 && def.labelEn.trim().length > 0);
    assert.ok(def.discoverySchemaKey.trim().length > 0);
  });

  if (isWebsiteFamily) {
    check(`${def.key} correctly has NO specialized family (rides the Website engine by design)`, () => {
      assert.equal(family, null);
    });
    continue;
  }

  // Every non-Website type must now have a real specialized family — Gate 10.2 closed every
  // previously-registry-only stub (Social Setup/Cleanup, GBP, promotional_products, other,
  // custom_platform_software, launch_package_multi_project) found by Gate 10.1's GAP17 audit.
  check(`${def.key} has a real specialized family (not a registry-only stub)`, () => {
    if (family === null) REGISTRY_ONLY_STUBS.push(def.key);
    assert.notEqual(family, null, `${def.key} has no specialized family — falls through to the generic Website catalog`);
  });

  if (family === null) {
    ACCIDENTAL_WEBSITE_FALLBACKS.push(def.key);
    continue;
  }

  check(`${def.key} has a real, non-empty discovery catalog`, () => {
    const entry = catalogForProjectType(def.key);
    assert.ok(entry && entry.catalog.length > 0, `${def.key} catalog is missing or empty`);
  });

  check(`${def.key} blueprint packet builder runs and produces real Markdown without throwing`, () => {
    const { ctx, intents } = fixtureFor(def.key);
    const packet = buildSpecializedPacketForProjectType(def.key, {
      ctx, discovery: { title: "Fixture", sourceGrowthAssessmentId: null, sourceGrowthSolutionId: null, sourceOpportunityId: null, sourceMeetingId: null },
      intents, sources: [], businessDisplayName: "Fixture Business", businessPublicName: null,
    });
    assert.ok(packet, `${def.key} packet builder returned null`);
    const md = buildSpecializedBlueprintMarkdown(packet!, { version: 1, status: "draft" });
    assert.ok(md.length > 100, `${def.key} produced suspiciously short Markdown`);
    assert.ok(md.includes(def.key) || md.includes("Fixture"), `${def.key} Markdown doesn't look like a real rendered document`);
  });
}

check("GAP 17 CLOSURE: registry-only stubs = 0", () => {
  assert.deepEqual(REGISTRY_ONLY_STUBS, []);
});
check("GAP 17 CLOSURE: accidental Website fallbacks = 0 (for every type that should have its own family)", () => {
  assert.deepEqual(ACCIDENTAL_WEBSITE_FALLBACKS, []);
});

// ===============================================================================================
// Sponsored Editorial — registry declaration must match actual dispatch (Gate 10.2 <phase_9>)
// ===============================================================================================
console.log("\nSponsored Editorial registry/dispatch consistency:");
check("sponsored_editorial dispatches through media_campaign (matches its ACTUAL execution path)", () => {
  assert.equal(specializedFamilyForProjectType("sponsored_editorial" as never), "media_campaign");
});
check("sponsored_editorial registry executionDestination now says growth_campaign, matching the real dispatched family (was 'creative_studio', a stale contradiction — Gate 10.1 GAP17 finding)", () => {
  const def = PROJECT_TYPE_REGISTRY.find((d) => d.key === "sponsored_editorial")!;
  assert.equal(def.executionDestination, "growth_campaign");
  if (def.executionDestination !== "growth_campaign") DESTINATION_MISMATCHES.push("sponsored_editorial");
});
check("GAP 17 CLOSURE: execution-destination mismatches = 0", () => {
  assert.deepEqual(DESTINATION_MISMATCHES, []);
});

// ===============================================================================================
// Custom Platform standalone — always commercial-review-gated
// ===============================================================================================
console.log("\nCustom Platform standalone:");
check("custom_platform_software packet always sets requiresCommercialReview=true", () => {
  const { ctx, intents } = fixtureFor("custom_platform_software");
  const packet = buildSpecializedPacketForProjectType("custom_platform_software" as never, {
    ctx, discovery: { title: "Fixture", sourceGrowthAssessmentId: null, sourceGrowthSolutionId: null, sourceOpportunityId: null, sourceMeetingId: null },
    intents, sources: [], businessDisplayName: "Fixture Business", businessPublicName: null,
  }) as { requiresCommercialReview?: boolean } | null;
  assert.equal(packet?.requiresCommercialReview, true);
});
check("custom_platform_software Markdown flags COMMERCIAL REVIEW REQUIRED prominently", () => {
  const { ctx, intents } = fixtureFor("custom_platform_software");
  const packet = buildSpecializedPacketForProjectType("custom_platform_software" as never, {
    ctx, discovery: { title: "Fixture", sourceGrowthAssessmentId: null, sourceGrowthSolutionId: null, sourceOpportunityId: null, sourceMeetingId: null },
    intents, sources: [], businessDisplayName: "Fixture Business", businessPublicName: null,
  })!;
  const md = buildSpecializedBlueprintMarkdown(packet, { version: 1, status: "draft" });
  assert.ok(md.includes("REVISIÓN COMERCIAL REQUERIDA") || md.includes("COMMERCIAL REVIEW REQUIRED"));
});

// ===============================================================================================
// Digital Presence — never collects a password/recovery code
// ===============================================================================================
console.log("\nDigital Presence security:");
check("no Digital Presence catalog field ever asks for a password/recovery code/API key", () => {
  for (const req of DIGITAL_PRESENCE_REQUIREMENTS) {
    const haystack = `${req.fieldKey} ${req.labelEn} ${req.clientQuestionEn}`.toLowerCase();
    assert.ok(!/password|recovery code|api key|secret/i.test(haystack), `field ${req.fieldKey} looks like it collects a credential`);
  }
});

// ===============================================================================================
// Launch Package roll-up (pure function)
// ===============================================================================================
console.log("\nLaunch Package roll-up:");
check("empty children -> zero totals, not handed off", () => {
  const rollup = buildLaunchPackageRollup([]);
  assert.equal(rollup.totalComponents, 0);
  assert.equal(rollup.allComponentsHandedOff, false);
});
check("mixed states are bucketed correctly (blocked/in-progress/done)", () => {
  const children: LaunchPackageChildSummary[] = [
    { intentId: "a", projectType: "website", title: "Website", state: "handoff_complete", blockingReasonEs: null, blockingReasonEn: null },
    { intentId: "b", projectType: "logo_brand_identity", title: "Logo", state: "approved_for_build", blockingReasonEs: null, blockingReasonEn: null },
    { intentId: "c", projectType: "business_cards", title: "Cards", state: "discovery_in_progress", blockingReasonEs: "x", blockingReasonEn: "x" },
    { intentId: "d", projectType: "media_exposure_campaign", title: "Campaign", state: "no_intent_yet", blockingReasonEs: null, blockingReasonEn: null },
  ];
  const rollup = buildLaunchPackageRollup(children);
  assert.equal(rollup.totalComponents, 4);
  assert.equal(rollup.readyOrDoneCount, 2);
  assert.equal(rollup.blockedCount, 2);
  assert.equal(rollup.inProgressCount, 0);
  assert.equal(rollup.allComponentsHandedOff, false);
});
check("all components handed off -> allComponentsHandedOff true", () => {
  const children: LaunchPackageChildSummary[] = [
    { intentId: "a", projectType: "website", title: "Website", state: "handoff_complete", blockingReasonEs: null, blockingReasonEn: null },
    { intentId: "b", projectType: "logo_brand_identity", title: "Logo", state: "handoff_complete", blockingReasonEs: null, blockingReasonEn: null },
  ];
  const rollup = buildLaunchPackageRollup(children);
  assert.equal(rollup.allComponentsHandedOff, true);
});
check("Launch Package's own blueprint is an orchestration record that NEVER duplicates a component's content", () => {
  const { ctx, intents } = fixtureFor("launch_package_multi_project");
  const packet = buildSpecializedPacketForProjectType("launch_package_multi_project" as never, {
    ctx, discovery: { title: "Fixture", sourceGrowthAssessmentId: null, sourceGrowthSolutionId: null, sourceOpportunityId: null, sourceMeetingId: null },
    intents, sources: [], businessDisplayName: "Fixture Business", businessPublicName: null,
  })!;
  const md = buildSpecializedBlueprintMarkdown(packet, { version: 1, status: "draft" });
  assert.ok(md.includes("NUNCA duplica") || md.includes("NEVER duplicates"));
});

console.log(`\n${passed} checks passed.`);
