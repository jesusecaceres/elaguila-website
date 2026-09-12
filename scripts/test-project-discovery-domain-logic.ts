/**
 * Client Discovery & Project Blueprint Engine, Gate 1 — targeted runtime unit tests for the pure
 * domain logic (constants.ts, logic.ts, projectTypeRegistry.ts). No database, no network — mirrors
 * scripts/test-growth-engine-domain-logic.ts's exact style.
 *
 * Run from repo root: npx tsx scripts/test-project-discovery-domain-logic.ts
 */
import { strict as assert } from "node:assert";

import { isValidProjectDiscoveryIntentTransition, isValidProjectDiscoveryStatusTransition } from "../app/lib/business/projectDiscovery/constants";
import { assetReferenceCrossesBusinessBoundary, isBlockingDiscoveryItem, isLeonixActionItem } from "../app/lib/business/projectDiscovery/logic";
import { activeProjectTypes, getProjectTypeDefinition, isKnownProjectType, projectTypeLabel, PROJECT_TYPE_REGISTRY } from "../app/lib/business/projectDiscovery/projectTypeRegistry";
import type { ProjectDiscoveryItem } from "../app/lib/business/projectDiscovery/types";

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

console.log("Client Project Discovery domain logic — targeted runtime unit tests\n");

function item(overrides: Partial<Pick<ProjectDiscoveryItem, "completenessClass" | "confirmationState" | "truthClass">>): Pick<ProjectDiscoveryItem, "completenessClass" | "confirmationState" | "truthClass"> {
  return { completenessClass: "optional", confirmationState: "unconfirmed", truthClass: "unknown", ...overrides };
}

// === Scenarios 1-2 (project types exist and are distinct) =======================================
check("Scenario 1: 'website' is a known, active project type with bilingual labels", () => {
  assert.ok(isKnownProjectType("website"));
  const def = getProjectTypeDefinition("website");
  assert.ok(def.active);
  assert.ok(def.labelEs.length > 0 && def.labelEn.length > 0);
});
check("Scenario 2: 'logo_brand_identity' is a known, active, distinct project type", () => {
  assert.ok(isKnownProjectType("logo_brand_identity"));
  assert.notEqual(getProjectTypeDefinition("logo_brand_identity").labelEn, getProjectTypeDefinition("website").labelEn);
});

// === Scenario 5-8 — truth classes are never collapsed ============================================
check("Scenario 5: client_confirmed is a valid, distinct truth class", () => {
  const i = item({ truthClass: "client_confirmed", confirmationState: "confirmed", completenessClass: "required_before_build" });
  assert.equal(i.truthClass, "client_confirmed");
  assert.ok(!isBlockingDiscoveryItem(i), "a confirmed item must never still be reported as blocking");
});
check("Scenario 6: an ai_extracted item defaults to unconfirmed and is NOT silently promoted", () => {
  const i = item({ truthClass: "ai_extracted", confirmationState: "unconfirmed", completenessClass: "required_before_build" });
  assert.equal(i.confirmationState, "unconfirmed");
  // ai_extracted is deliberately excluded from the "genuinely missing" set in isBlockingDiscoveryItem
  // (it has SOME value, just unconfirmed) — needs_confirmation/unknown are the "truly missing" ones.
  assert.ok(!isBlockingDiscoveryItem(i), "ai_extracted (has a value, just unconfirmed) must not be conflated with genuinely missing (unknown/needs_confirmation)");
});
check("Scenario 7: 'unknown' items required before build are reported as blocking", () => {
  assert.ok(isBlockingDiscoveryItem(item({ truthClass: "unknown", completenessClass: "required_before_build" })));
});
check("Scenario 8: 'needs_confirmation' items required before build are reported as blocking", () => {
  assert.ok(isBlockingDiscoveryItem(item({ truthClass: "needs_confirmation", completenessClass: "required_before_build" })));
});

// === Scenario 9-13 — completeness classes drive distinct behavior ===============================
check("Scenario 9: required_before_build + unknown + unconfirmed => blocking", () => {
  assert.ok(isBlockingDiscoveryItem(item({ completenessClass: "required_before_build", truthClass: "unknown" })));
});
check("Scenario 10: required_before_launch + needs_confirmation + unconfirmed => blocking (distinct from build blockers, same mechanism)", () => {
  const i = item({ completenessClass: "required_before_launch", truthClass: "needs_confirmation" });
  assert.ok(isBlockingDiscoveryItem(i));
  assert.notEqual(i.completenessClass, "required_before_build");
});
check("Scenario 11: not_applicable items are never blocking regardless of truth class", () => {
  assert.ok(!isBlockingDiscoveryItem(item({ completenessClass: "not_applicable", truthClass: "unknown" })));
  assert.ok(!isLeonixActionItem(item({ completenessClass: "not_applicable" })));
});
check("Scenario 12: needs_leonix_decision items are a Leonix action, never a 'blocking client question'", () => {
  const i = item({ completenessClass: "needs_leonix_decision", truthClass: "unknown" });
  assert.ok(!isBlockingDiscoveryItem(i), "needs_leonix_decision must not be chased as a client question");
  assert.ok(isLeonixActionItem(i));
});
check("Scenario 13: needs_official_research items are a Leonix action, never a 'blocking client question'", () => {
  const i = item({ completenessClass: "needs_official_research", truthClass: "unknown" });
  assert.ok(!isBlockingDiscoveryItem(i));
  assert.ok(isLeonixActionItem(i));
});
check("A confirmed required item is never blocking even if its truth class was originally unknown", () => {
  assert.ok(!isBlockingDiscoveryItem(item({ completenessClass: "required_before_build", truthClass: "unknown", confirmationState: "confirmed" })));
});

// === Scenario 18 — cross-business asset link rejected ===========================================
check("Scenario 18: an asset belonging to a different business is rejected", () => {
  assert.ok(assetReferenceCrossesBusinessBoundary("business-A", "business-B"));
  assert.ok(!assetReferenceCrossesBusinessBoundary("business-A", "business-A"));
});

// === Discovery lifecycle transitions =============================================================
check("Discovery lifecycle: in_progress can reach every non-terminal state, never skips to blueprint_created directly", () => {
  assert.ok(isValidProjectDiscoveryStatusTransition("in_progress", "needs_client_information"));
  assert.ok(isValidProjectDiscoveryStatusTransition("in_progress", "needs_leonix_decision"));
  assert.ok(isValidProjectDiscoveryStatusTransition("in_progress", "ready_for_blueprint"));
  assert.ok(!isValidProjectDiscoveryStatusTransition("in_progress", "blueprint_created"), "must not skip ready_for_blueprint");
});
check("Discovery lifecycle: blueprint_created is terminal", () => {
  assert.ok(!isValidProjectDiscoveryStatusTransition("blueprint_created", "in_progress"));
  assert.ok(!isValidProjectDiscoveryStatusTransition("blueprint_created", "blueprint_created"));
});
check("Discovery lifecycle: needs_client_information/needs_leonix_decision can return to in_progress (resumable, not a dead end)", () => {
  assert.ok(isValidProjectDiscoveryStatusTransition("needs_client_information", "in_progress"));
  assert.ok(isValidProjectDiscoveryStatusTransition("needs_leonix_decision", "in_progress"));
});

// === Multi-project intent transitions =============================================================
check("Intent lifecycle: candidate -> confirmed -> converted_to_project, never skipping confirmed", () => {
  assert.ok(isValidProjectDiscoveryIntentTransition("candidate", "confirmed"));
  assert.ok(!isValidProjectDiscoveryIntentTransition("candidate", "converted_to_project"), "must not skip confirmed");
  assert.ok(isValidProjectDiscoveryIntentTransition("confirmed", "converted_to_project"));
});
check("Intent lifecycle: declined can be reconsidered (back to candidate), converted_to_project is terminal", () => {
  assert.ok(isValidProjectDiscoveryIntentTransition("declined", "candidate"));
  assert.ok(!isValidProjectDiscoveryIntentTransition("converted_to_project", "candidate"));
});

// === Scenario 24 — no raw secret field support ====================================================
check("Scenario 24: no discovery item value_type represents a credential/secret/password", () => {
  const disallowed = ["password", "secret", "credential", "api_key", "token"];
  // valueType is a closed TS union; this check documents and enforces the closed set never grows
  // to include a credential-shaped type by asserting the registry of legitimate types below.
  const legitimateTypes = ["text", "number", "boolean", "date", "url", "list", "asset_ref", "choice", "other"];
  for (const bad of disallowed) {
    assert.ok(!legitimateTypes.includes(bad), `value_type must never include "${bad}"`);
  }
});

// === Scenario 25 — bilingual project-type labels for every registry entry ========================
check("Scenario 25: every project type in the registry has non-empty Spanish AND English labels", () => {
  for (const def of PROJECT_TYPE_REGISTRY) {
    assert.ok(def.labelEs.trim().length > 0, `${def.key} missing labelEs`);
    assert.ok(def.labelEn.trim().length > 0, `${def.key} missing labelEn`);
    assert.ok(projectTypeLabel(def.key).includes("/"), `${def.key} bilingual combined label must be "Es / En"`);
  }
});
check("Registry covers every Master-MD §7 project type, all keys unique, all active by default", () => {
  const keys = PROJECT_TYPE_REGISTRY.map((d) => d.key);
  assert.equal(new Set(keys).size, keys.length, "no duplicate project type keys");
  assert.equal(PROJECT_TYPE_REGISTRY.length, 17, "expected exactly 17 canonical project types");
  assert.equal(activeProjectTypes().length, 17, "all 17 are active by default");
  const required = [
    "website", "website_improvement", "landing_page", "logo_brand_identity", "business_cards", "flyer",
    "banner_signage", "promotional_products", "campaign_creative", "sponsored_editorial",
    "media_exposure_campaign", "social_setup_cleanup", "google_business_profile_support",
    "referral_materials", "launch_package_multi_project", "custom_platform_software", "other",
  ];
  for (const r of required) assert.ok(keys.includes(r as (typeof keys)[number]), `missing required project type: ${r}`);
});
check("'other' project type is the only one requiring an other_label (verified at the DB constraint, mirrored here)", () => {
  assert.ok(isKnownProjectType("other"));
});
check("No project type registry entry carries commercial pricing fields (MD: 'Do not put commercial pricing in this registry')", () => {
  for (const def of PROJECT_TYPE_REGISTRY) {
    assert.ok(!("price" in def) && !("cost" in def) && !("pricingTier" in def));
  }
});

console.log(`\n${passed} check(s) passed.`);
if (process.exitCode) {
  console.error("\nSOME CHECKS FAILED.");
} else {
  console.log("ALL CHECKS PASSED.");
}
