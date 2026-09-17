/**
 * Focused tests for the entrepreneur experience (Package BCO-3). Repo-level, no-DB tests only —
 * same convention and same "server-only" import constraint as
 * scripts/verify-business-identity-core-01.ts (see that file's header comment for the full
 * rationale). Only imports from files without `import "server-only"`.
 * Run from repo root: npx tsx scripts/verify-business-concierge-entrepreneur-experience-01.ts
 */
import { strict as assert } from "node:assert";

import { shouldApplyTestOverride } from "../app/lib/business/featureFlagLogic";
import { buildTestOverrideEligibilityResult } from "../app/lib/business/eligibilityLogic";
import { emptyWizardPayload, newContactDraft } from "../app/(site)/dashboard/business-tools/onboarding/wizardTypes";

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

console.log("Entrepreneur experience (BCO-3) — focused tests\n");

// --- feature-flag test-override safety (critical: must be inert in production) -------------
check("shouldApplyTestOverride: FALSE when vercelEnv=production, even with a matching override id", () => {
  assert.equal(shouldApplyTestOverride({ userId: "user-1", vercelEnv: "production", overrideUserId: "user-1" }), false);
});
check("shouldApplyTestOverride: FALSE when no override id is configured", () => {
  assert.equal(shouldApplyTestOverride({ userId: "user-1", vercelEnv: "preview", overrideUserId: undefined }), false);
});
check("shouldApplyTestOverride: FALSE when the override id doesn't match the requesting user", () => {
  assert.equal(shouldApplyTestOverride({ userId: "user-1", vercelEnv: "preview", overrideUserId: "user-2" }), false);
});
check("shouldApplyTestOverride: FALSE when userId is null (signed out)", () => {
  assert.equal(shouldApplyTestOverride({ userId: null, vercelEnv: "preview", overrideUserId: "user-2" }), false);
});
check("shouldApplyTestOverride: TRUE only when non-production AND override id matches", () => {
  assert.equal(shouldApplyTestOverride({ userId: "user-1", vercelEnv: "preview", overrideUserId: "user-1" }), true);
  assert.equal(shouldApplyTestOverride({ userId: "user-1", vercelEnv: undefined, overrideUserId: "user-1" }), true);
});

// --- wizard draft payload pure helpers -------------------------------------------------------
check("emptyWizardPayload: schemaVersion is 1 and language is preserved", () => {
  const p = emptyWizardPayload("en");
  assert.equal(p.schemaVersion, 1);
  assert.equal(p.basics.primaryLanguage, "en");
  assert.deepEqual(p.contacts, []);
  assert.equal(p.listingCandidate, null);
});
check("newContactDraft: generates a fresh, empty, non-primary contact each time", () => {
  const a = newContactDraft();
  const b = newContactDraft();
  assert.notEqual(a.id, b.id);
  assert.equal(a.contactType, "");
  assert.equal(a.isPrimary, false);
  assert.equal(a.preferredChannel, false);
});

// --- BCO-3Q: test-override eligibility result must be clearly labeled, never disguised -------
check("buildTestOverrideEligibilityResult: status is eligible but every field marks it as a test override, not real evidence", () => {
  const result = buildTestOverrideEligibilityResult("2026-01-01T00:00:00.000Z");
  assert.equal(result.status, "eligible");
  assert.equal(result.evidence.length, 1);
  assert.equal(result.evidence[0].source, "non_production_test_override");
  assert.equal(result.evidence[0].reasonCode, "non_production_test_override");
  assert.ok(result.humanExplanation.toLowerCase().includes("test") || result.humanExplanation.toLowerCase().includes("prueba"));
  assert.equal(result.contradictions.length, 0);
});

console.log(`\n${passed} check(s) passed.`);
if (process.exitCode) {
  console.error("\nSome checks FAILED.");
  process.exit(1);
}
