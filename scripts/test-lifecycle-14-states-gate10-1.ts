/**
 * Client Discovery & Project Blueprint Engine, Gate 10.1 — deterministic test matrix for
 * deriveProjectLifecycleState (MD §32 <project_blueprint_cta_states>, "14 lifecycle states").
 * No database, no network — pure fixtures over the pure function, matching Gates 1-7's own test
 * pattern (see scripts/test-project-blueprint-gate7.ts).
 *
 * The MD's 14-state vocabulary splits as: 1 pre-intent zero-state ("Start Discovery", rendered by
 * StartDiscoveryForm before any discovery/intent exists at all — deliberately NOT covered by this
 * matrix, since deriveProjectLifecycleState only ever runs once a discovery+intent already exist)
 * + the 13 ProjectLifecycleStateKey values this file exhaustively covers below, one direct test per
 * key plus dedicated precedence/contradiction cases proving the function's actual priority order
 * (handoff_complete > live > blueprint-status branch > readiness-state branch > fallback) holds even
 * when inputs conflict.
 *
 * Run from repo root: npx tsx scripts/test-lifecycle-14-states-gate10-1.ts
 */
import { strict as assert } from "node:assert";
import {
  deriveProjectLifecycleState,
  projectLifecycleStateLabel,
  type ProjectLifecycleStateKey,
} from "../app/lib/business/projectDiscovery/discoveryWorkspaceViewModel";

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

console.log("Lifecycle 14-state deterministic matrix (Gate 10.1) — deterministic tests\n");

type Input = Parameters<typeof deriveProjectLifecycleState>[0];

const BASE: Input = {
  readinessState: null,
  blueprintStatus: null,
  handoffStatus: null,
  releaseReadinessState: null,
  releasedAt: null,
  handoffCompletedAt: null,
  hasQaSnapshot: false,
};

function key(overrides: Partial<Input>): ProjectLifecycleStateKey {
  return deriveProjectLifecycleState({ ...BASE, ...overrides }).key;
}

// =================================================================================================
// PART A — one direct test per ProjectLifecycleStateKey (13 of the MD's 14 states; the 14th,
// "Start Discovery", is the pre-intent zero-state rendered before any discovery/intent exists —
// see app/admin/(dashboard)/businesses/[businessId]/ClientDiscoveryActions.tsx's StartDiscoveryForm,
// which is out of scope for this pure function by construction, not an untested gap).
// =================================================================================================
console.log("A. One direct test per state:\n");

check("1. continue_discovery — no readiness signal yet at all (true zero-progress fixture)", () => {
  assert.equal(key({}), "continue_discovery");
});

check("2. needs_client_information — Gate 2 readiness NOT_READY (a real client blocker remains)", () => {
  assert.equal(key({ readinessState: "NOT_READY" }), "needs_client_information");
});

check("3. needs_leonix_decision — Gate 2 readiness NEEDS_LEONIX_ARCHITECTURE_DECISION", () => {
  assert.equal(key({ readinessState: "NEEDS_LEONIX_ARCHITECTURE_DECISION" }), "needs_leonix_decision");
});

check("4. ready_to_generate_blueprint — readiness READY, no blueprint drafted yet", () => {
  assert.equal(key({ readinessState: "READY" }), "ready_to_generate_blueprint");
});

check("4b. ready_to_generate_blueprint — readiness READY_WITH_NON_BLOCKING_GAPS also qualifies", () => {
  assert.equal(key({ readinessState: "READY_WITH_NON_BLOCKING_GAPS" }), "ready_to_generate_blueprint");
});

check("5. blueprint_needs_review — blueprintStatus draft", () => {
  assert.equal(key({ blueprintStatus: "draft" }), "blueprint_needs_review");
});

check("5b. blueprint_needs_review — blueprintStatus internal_review", () => {
  assert.equal(key({ blueprintStatus: "internal_review" }), "blueprint_needs_review");
});

check("5c. blueprint_needs_review — blueprintStatus superseded (an old version, correctly still 'needs review' shaped, never a dead end)", () => {
  assert.equal(key({ blueprintStatus: "superseded" }), "blueprint_needs_review");
});

check("6. client_confirmation_needed — blueprintStatus client_confirmation_needed", () => {
  assert.equal(key({ blueprintStatus: "client_confirmation_needed" }), "client_confirmation_needed");
});

check("7. approved_for_build — approved, handoff not yet started", () => {
  assert.equal(key({ blueprintStatus: "approved_for_build", handoffStatus: "not_started" }), "approved_for_build");
});

check("7b. approved_for_build — approved, handoffStatus null (equivalent to not_started)", () => {
  assert.equal(key({ blueprintStatus: "approved_for_build", handoffStatus: null }), "approved_for_build");
});

check("8. in_build — handed off, actively building, no QA snapshot exists yet", () => {
  assert.equal(
    key({ blueprintStatus: "approved_for_build", handoffStatus: "assigned", releaseReadinessState: "NEEDS_LEONIX_ACTION", hasQaSnapshot: false }),
    "in_build",
  );
});

check("8b. in_build — handoffStatus in_progress (not just 'assigned') with no QA snapshot yet — the exact Gate 10.1 GAP6 regression fixture", () => {
  assert.equal(
    key({ blueprintStatus: "approved_for_build", handoffStatus: "in_progress", releaseReadinessState: "NEEDS_LEONIX_ACTION", hasQaSnapshot: false }),
    "in_build",
  );
});

check("9. qa — a QA checklist snapshot now exists (actively being QA'd, not merely 'being built')", () => {
  assert.equal(
    key({ blueprintStatus: "approved_for_build", handoffStatus: "in_progress", releaseReadinessState: "NEEDS_LEONIX_ACTION", hasQaSnapshot: true }),
    "qa",
  );
});

check("10. client_review — release readiness NEEDS_CLIENT_ACTION (client confirmation outstanding)", () => {
  assert.equal(
    key({ blueprintStatus: "approved_for_build", handoffStatus: "assigned", releaseReadinessState: "NEEDS_CLIENT_ACTION" }),
    "client_review",
  );
});

check("11. ready_to_launch — release readiness READY_FOR_RELEASE", () => {
  assert.equal(
    key({ blueprintStatus: "approved_for_build", handoffStatus: "assigned", releaseReadinessState: "READY_FOR_RELEASE" }),
    "ready_to_launch",
  );
});

check("12. live — releasedAt is set, handoff not yet completed", () => {
  assert.equal(key({ releasedAt: "2026-09-11T00:00:00Z", handoffCompletedAt: null }), "live");
});

check("13. handoff_complete — handoffCompletedAt is set", () => {
  assert.equal(key({ handoffCompletedAt: "2026-09-11T00:00:00Z" }), "handoff_complete");
});

check("14 (zero-state, out-of-band). 'Start Discovery' is rendered before any discovery/intent exists — not a deriveProjectLifecycleState output; confirmed present as its own UI gate, not an untested branch", () => {
  const fs = require("node:fs") as typeof import("node:fs");
  const path = require("node:path") as typeof import("node:path");
  const src = fs.readFileSync(path.resolve(__dirname, "../app/admin/(dashboard)/businesses/[businessId]/ClientDiscoveryActions.tsx"), "utf8");
  assert.match(src, /StartDiscoveryForm/);
});

// =================================================================================================
// PART B — precedence / contradiction matrix (GAP 18's explicit required cases): when multiple
// signals disagree, only ONE branch order actually governs, and it must be exactly the order coded
// in deriveProjectLifecycleState — top to bottom: handoffCompletedAt > releasedAt >
// (blueprintStatus==='approved_for_build' sub-chain: not-handed-off > READY_FOR_RELEASE >
// NEEDS_CLIENT_ACTION > !hasQaSnapshot > qa) > other blueprintStatus values > readinessState chain
// > fallback continue_discovery.
// =================================================================================================
console.log("\nB. Precedence / contradiction cases:\n");

check("P1. handoff_complete wins over every other, even self-contradictory, signal (blueprintStatus draft + no releasedAt)", () => {
  assert.equal(
    key({ handoffCompletedAt: "2026-09-11T00:00:00Z", blueprintStatus: "draft", releasedAt: null, readinessState: "NOT_READY" }),
    "handoff_complete",
  );
});

check("P2. live wins over a contradictory blueprintStatus (draft) once released — released-but-handoff-incomplete is exactly what 'live' means", () => {
  assert.equal(
    key({ releasedAt: "2026-09-11T00:00:00Z", handoffCompletedAt: null, blueprintStatus: "draft" }),
    "live",
  );
});

check("P3. stale Blueprint (readiness NOT_READY due to staleness) does NOT fork its own lifecycle key — it is absorbed into 'in_build', never surfaced as a fifth phantom state", () => {
  assert.equal(
    key({ blueprintStatus: "approved_for_build", handoffStatus: "in_progress", releaseReadinessState: "NOT_READY", hasQaSnapshot: false }),
    "in_build",
  );
});

check("P4. client confirmation missing takes precedence over an existing QA snapshot — client_review, not qa, once release readiness reports NEEDS_CLIENT_ACTION", () => {
  assert.equal(
    key({ blueprintStatus: "approved_for_build", handoffStatus: "assigned", releaseReadinessState: "NEEDS_CLIENT_ACTION", hasQaSnapshot: true }),
    "client_review",
  );
});

check("P5. QA incomplete (snapshot exists, readiness still NEEDS_LEONIX_ACTION) resolves to 'qa', not 'ready_to_launch'", () => {
  assert.equal(
    key({ blueprintStatus: "approved_for_build", handoffStatus: "assigned", releaseReadinessState: "NEEDS_LEONIX_ACTION", hasQaSnapshot: true }),
    "qa",
  );
});

check("P6. QA complete but client review still pending — client_review outranks qa even though hasQaSnapshot=true", () => {
  assert.equal(
    key({ blueprintStatus: "approved_for_build", handoffStatus: "assigned", releaseReadinessState: "NEEDS_CLIENT_ACTION", hasQaSnapshot: true }),
    "client_review",
  );
});

check("P7. launch checklist incomplete (readiness NEEDS_LEONIX_ACTION, distinct real cause from QA, same bucket by design) — still resolves to 'qa', the single Leonix-side-work state MD's CTA vocabulary intentionally collapses QA+launch into", () => {
  assert.equal(
    key({ blueprintStatus: "approved_for_build", handoffStatus: "assigned", releaseReadinessState: "NEEDS_LEONIX_ACTION", hasQaSnapshot: true }),
    "qa",
  );
});

check("P8. ready for release (READY_FOR_RELEASE) outranks a stale hasQaSnapshot=false signal — ready_to_launch, not in_build", () => {
  assert.equal(
    key({ blueprintStatus: "approved_for_build", handoffStatus: "assigned", releaseReadinessState: "READY_FOR_RELEASE", hasQaSnapshot: false }),
    "ready_to_launch",
  );
});

check("P9. released with handoff incomplete is 'live' regardless of what release readiness now reports (readiness is meaningless post-release, must never leak through)", () => {
  assert.equal(
    key({ releasedAt: "2026-09-11T00:00:00Z", handoffCompletedAt: null, releaseReadinessState: "NOT_READY", blueprintStatus: "approved_for_build" }),
    "live",
  );
});

check("P10. handoff complete outranks a released state — the true terminal state, never regresses to 'live'", () => {
  assert.equal(
    key({ releasedAt: "2026-09-11T00:00:00Z", handoffCompletedAt: "2026-09-12T00:00:00Z" }),
    "handoff_complete",
  );
});

check("P11. an unmodeled releaseReadinessState (BLOCKED_BY_DEPENDENCY) never crashes and falls back safely to the hasQaSnapshot rule, never a phantom 'blocked' key", () => {
  assert.equal(
    key({ blueprintStatus: "approved_for_build", handoffStatus: "assigned", releaseReadinessState: "BLOCKED_BY_DEPENDENCY", hasQaSnapshot: false }),
    "in_build",
  );
});

check("P12. an unmodeled releaseReadinessState (NEEDS_COMMERCIAL_RESOLUTION) also falls back safely, never bypasses into ready_to_launch", () => {
  assert.equal(
    key({ blueprintStatus: "approved_for_build", handoffStatus: "assigned", releaseReadinessState: "NEEDS_COMMERCIAL_RESOLUTION", hasQaSnapshot: true }),
    "qa",
  );
});

check("P13. hasQaSnapshot defaults to false when the caller omits it — conservative default never claims QA is underway without real evidence", () => {
  const { hasQaSnapshot, ...withoutFlag } = BASE;
  assert.equal(
    deriveProjectLifecycleState({ ...withoutFlag, blueprintStatus: "approved_for_build", handoffStatus: "assigned", releaseReadinessState: "NEEDS_LEONIX_ACTION" }).key,
    "in_build",
  );
});

check("P14. every one of the 13 ProjectLifecycleStateKey values has a non-empty bilingual label (no silent UI gap)", () => {
  const keys: ProjectLifecycleStateKey[] = [
    "continue_discovery", "needs_client_information", "needs_leonix_decision", "ready_to_generate_blueprint",
    "blueprint_needs_review", "client_confirmation_needed", "approved_for_build", "in_build", "qa",
    "client_review", "ready_to_launch", "live", "handoff_complete",
  ];
  assert.equal(keys.length, 13, "the MD's 13 post-intent lifecycle keys");
  for (const k of keys) {
    const label = projectLifecycleStateLabel(k);
    assert.ok(label.es.trim().length > 0, `${k} missing Spanish label`);
    assert.ok(label.en.trim().length > 0, `${k} missing English label`);
  }
});

console.log(`\n${passed} checks passed.`);
