/**
 * Business Development & Growth Engine, Gate A — targeted runtime unit tests for the pure logic:
 * life-stage classification, roadmap catalog integrity, and solution/campaign state-transition
 * graphs. These files have no "server-only" marker and no Supabase dependency, so they run
 * directly under plain tsx — no scratch-copy technique needed (unlike adminSession.ts).
 *
 * Run from repo root: npx tsx scripts/test-growth-engine-domain-logic.ts
 */
import { strict as assert } from "node:assert";
import { growthRoadmapTypeForBusinessStage } from "../app/lib/business/growthEngine/lifeStage";
import { ESTABLISHED_ROADMAP_STEPS, STARTUP_ROADMAP_STEPS, roadmapStepCatalog } from "../app/lib/business/growthEngine/roadmapCatalog";
import { isValidGrowthCampaignTransition, isValidGrowthSolutionTransition } from "../app/lib/business/growthEngine/constants";
import type { BusinessStage } from "../app/lib/business/types";

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

console.log("Growth Engine domain logic — targeted runtime unit tests\n");

// --- Life-stage classification (Section H) ------------------------------------------------------
check("planning_prelaunch classifies as startup", () => {
  assert.equal(growthRoadmapTypeForBusinessStage("planning_prelaunch"), "startup");
});
check("newly_opened classifies as startup", () => {
  assert.equal(growthRoadmapTypeForBusinessStage("newly_opened"), "startup");
});
check("operating classifies as established", () => {
  assert.equal(growthRoadmapTypeForBusinessStage("operating"), "established");
});
check("growing classifies as established", () => {
  assert.equal(growthRoadmapTypeForBusinessStage("growing"), "established");
});
check("established_mature classifies as established", () => {
  assert.equal(growthRoadmapTypeForBusinessStage("established_mature"), "established");
});
check("paused_restructuring classifies as established (still an existing business, not an idea)", () => {
  assert.equal(growthRoadmapTypeForBusinessStage("paused_restructuring"), "established");
});
check("every real BusinessStage value classifies to exactly one roadmap type (no throw, no undefined)", () => {
  const allStages: BusinessStage[] = ["planning_prelaunch", "newly_opened", "operating", "growing", "established_mature", "paused_restructuring"];
  for (const stage of allStages) {
    const result = growthRoadmapTypeForBusinessStage(stage);
    assert.ok(result === "startup" || result === "established");
  }
});

// --- Roadmap catalog integrity -------------------------------------------------------------------
function checkCatalogIntegrity(name: string, catalog: typeof ESTABLISHED_ROADMAP_STEPS, expectedLength: number) {
  check(`${name}: has exactly ${expectedLength} steps (matches the MD's own numbered list)`, () => {
    assert.equal(catalog.length, expectedLength);
  });
  check(`${name}: every stepKey is unique`, () => {
    const keys = catalog.map((s) => s.stepKey);
    assert.equal(new Set(keys).size, keys.length);
  });
  check(`${name}: sequence numbers are exactly 1..N with no gaps or duplicates`, () => {
    const sequences = catalog.map((s) => s.sequence).sort((a, b) => a - b);
    assert.deepEqual(sequences, Array.from({ length: catalog.length }, (_, i) => i + 1));
  });
  check(`${name}: every non-null dependsOnStepKey references a real step in the same catalog`, () => {
    const keys = new Set(catalog.map((s) => s.stepKey));
    for (const step of catalog) {
      if (step.dependsOnStepKey !== null) {
        assert.ok(keys.has(step.dependsOnStepKey), `${step.stepKey} depends on unknown step ${step.dependsOnStepKey}`);
      }
    }
  });
  check(`${name}: no step depends on itself, and dependency sequence is always earlier`, () => {
    const bySequence = new Map(catalog.map((s) => [s.stepKey, s.sequence]));
    for (const step of catalog) {
      if (step.dependsOnStepKey !== null) {
        assert.notEqual(step.dependsOnStepKey, step.stepKey);
        const depSeq = bySequence.get(step.dependsOnStepKey)!;
        assert.ok(depSeq < step.sequence, `${step.stepKey} (seq ${step.sequence}) depends on ${step.dependsOnStepKey} (seq ${depSeq}), which is not earlier`);
      }
    }
  });
}

checkCatalogIntegrity("Established roadmap (MD §13.1)", ESTABLISHED_ROADMAP_STEPS, 12);
checkCatalogIntegrity("Startup roadmap (MD §13.2)", STARTUP_ROADMAP_STEPS, 14);

check("roadmapStepCatalog('startup') returns the startup catalog, not established", () => {
  assert.equal(roadmapStepCatalog("startup"), STARTUP_ROADMAP_STEPS);
});
check("roadmapStepCatalog('established') returns the established catalog", () => {
  assert.equal(roadmapStepCatalog("established"), ESTABLISHED_ROADMAP_STEPS);
});

// --- Solution state transitions -------------------------------------------------------------------
check("solution: suggested -> reviewed is valid", () => {
  assert.equal(isValidGrowthSolutionTransition("suggested", "reviewed"), true);
});
check("solution: suggested -> approved is INVALID (must pass through reviewed)", () => {
  assert.equal(isValidGrowthSolutionTransition("suggested", "approved"), false);
});
check("solution: approved -> in_progress is valid", () => {
  assert.equal(isValidGrowthSolutionTransition("approved", "in_progress"), true);
});
check("solution: complete -> anything is invalid (terminal state)", () => {
  assert.equal(isValidGrowthSolutionTransition("complete", "in_progress"), false);
  assert.equal(isValidGrowthSolutionTransition("complete", "dismissed"), false);
});
check("solution: dismissed -> anything is invalid (terminal state)", () => {
  assert.equal(isValidGrowthSolutionTransition("dismissed", "suggested"), false);
});
check("solution: no state may transition to itself", () => {
  const states: Array<Parameters<typeof isValidGrowthSolutionTransition>[0]> = ["suggested", "reviewed", "approved", "in_progress", "complete", "dismissed"];
  for (const s of states) assert.equal(isValidGrowthSolutionTransition(s, s), false);
});

// --- Campaign status transitions -------------------------------------------------------------------
check("campaign: draft -> ready_for_review is valid", () => {
  assert.equal(isValidGrowthCampaignTransition("draft", "ready_for_review"), true);
});
check("campaign: draft -> live is INVALID (must go through production states)", () => {
  assert.equal(isValidGrowthCampaignTransition("draft", "live"), false);
});
check("campaign: complete -> anything is invalid (terminal state)", () => {
  assert.equal(isValidGrowthCampaignTransition("complete", "live"), false);
});
check("campaign: cancelled -> anything is invalid (terminal state)", () => {
  assert.equal(isValidGrowthCampaignTransition("cancelled", "draft"), false);
});
check("campaign: live -> paused -> live is a valid round trip (campaigns can pause and resume)", () => {
  assert.equal(isValidGrowthCampaignTransition("live", "paused"), true);
  assert.equal(isValidGrowthCampaignTransition("paused", "live"), true);
});

console.log(`\n${passed} check(s) passed.`);
if (process.exitCode) {
  console.error("\nSome checks FAILED.");
} else {
  console.log("\nAll checks passed.");
}
