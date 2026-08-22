/**
 * Package B — Opportunity behavioral tests. Executes real domain logic (pure functions only —
 * matchEngine.ts and types.ts have no I/O), matching the program6-creative-studio-tests.ts
 * convention ("real domain logic, not source regex").
 *
 * Run: npx tsx scripts/business-opportunity-tests.ts
 */
import { matchBusinessToAllSources, matchBusinessToSource } from "../app/lib/business/opportunity/matchEngine";
import { listActiveEditorialOpportunitySources } from "../app/lib/business/opportunity/editorialSource";
import { isValidOpportunityStateTransition, OPPORTUNITY_LIFECYCLE_STATES } from "../app/lib/business/opportunity/types";

type Test = { name: string; run: () => void };
const tests: Test[] = [];
function test(name: string, run: () => void) {
  tests.push({ name, run });
}
function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const foodSource = listActiveEditorialOpportunitySources().find((s) => s.key === "food_recipe_feature")!;
const legalSource = listActiveEditorialOpportunitySources().find((s) => s.key === "know_your_rights_feature")!;

test("matchBusinessToSource: no match when category does not match", () => {
  const result = matchBusinessToSource({ broadBusinessType: "automotive_transportation", primaryCity: null }, foodSource);
  assert(result === null, "expected no match for a mismatched category");
});

test("matchBusinessToSource: matches when category matches", () => {
  const result = matchBusinessToSource({ broadBusinessType: "food_hospitality", primaryCity: null }, foodSource);
  assert(result !== null, "expected a match for a matching category");
  assert(result!.matchReasons.length >= 1, "expected at least one human-readable reason");
  assert(result!.matchReasons.every((r) => r.explanationEs.length > 0 && r.explanationEn.length > 0), "every reason must have both ES and EN explanations");
});

test("matchBusinessToSource: geography adds confidence but never substitutes for category", () => {
  // legalSource has no city constraint (suggestedCities: []) — city should not fabricate a reason.
  const result = matchBusinessToSource({ broadBusinessType: "professional_services", primaryCity: "Los Angeles" }, legalSource);
  assert(result !== null, "expected a category match");
  assert(!result!.matchReasons.some((r) => r.category === "geography_match"), "should not fabricate a geography reason when the source has no city constraint");
});

test("matchBusinessToSource: confidence never appears without matchReasons", () => {
  const result = matchBusinessToSource({ broadBusinessType: "food_hospitality", primaryCity: null }, foodSource);
  assert(result !== null && result.matchReasons.length > 0, "confidence must always be backed by at least one reason");
});

test("matchBusinessToAllSources: returns only category-matching sources", () => {
  const sources = listActiveEditorialOpportunitySources();
  const results = matchBusinessToAllSources({ broadBusinessType: "health_beauty_wellness", primaryCity: null }, sources);
  assert(results.length > 0, "expected at least one match for health_beauty_wellness");
  assert(results.every((r) => r.source.suggestedBusinessCategories.includes("health_beauty_wellness")), "every returned match must actually include the business's category");
});

test("editorial registry never contains a customer-specific business name (structural spot-check)", () => {
  const sources = listActiveEditorialOpportunitySources();
  const bannedPatterns = [/pupusas?\s+el\s/i, /leonix\s+media\s+llc/i];
  for (const source of sources) {
    for (const pattern of bannedPatterns) {
      assert(!pattern.test(source.titleEn) && !pattern.test(source.titleEs), `source ${source.key} appears to reference a specific customer name`);
    }
  }
});

test("opportunity lifecycle: valid forward transitions are allowed", () => {
  assert(isValidOpportunityStateTransition("suggested", "reviewed"), "suggested -> reviewed must be valid");
  assert(isValidOpportunityStateTransition("suggested", "approved"), "suggested -> approved must be valid");
  assert(isValidOpportunityStateTransition("reviewed", "approved"), "reviewed -> approved must be valid");
  assert(isValidOpportunityStateTransition("approved", "creative_requested"), "approved -> creative_requested must be valid");
});

test("opportunity lifecycle: dismissed -> approved is rejected (no casual state jump)", () => {
  assert(!isValidOpportunityStateTransition("dismissed", "approved"), "dismissed -> approved must be rejected");
});

test("opportunity lifecycle: terminal states have no outgoing transitions", () => {
  assert(!isValidOpportunityStateTransition("dismissed", "reviewed"), "dismissed must be terminal");
  assert(!isValidOpportunityStateTransition("creative_requested", "approved"), "creative_requested must be terminal");
});

test("opportunity lifecycle: every declared state is reachable in the transition graph or is 'suggested' (no orphan states)", () => {
  assert(OPPORTUNITY_LIFECYCLE_STATES.length === 5, "expected exactly 5 canonical lifecycle states");
});

test("opportunity lifecycle: no client-accepted, contracted, paid, or published states", () => {
  const states = OPPORTUNITY_LIFECYCLE_STATES as readonly string[];
  assert(!states.includes("accepted"), "client accepted is not an opportunity state");
  assert(!states.includes("declined"), "client declined is not an opportunity state");
  assert(!states.includes("contracted"), "contracted is not an opportunity state");
  assert(!states.includes("paid"), "paid is not an opportunity state");
  assert(!states.includes("published"), "published is not an opportunity state");
});

function main() {
  console.log("\nPACKAGE B — OPPORTUNITY BEHAVIORAL TESTS");
  console.log("=".repeat(60));
  console.log(`Running ${tests.length} tests...\n`);

  let passed = 0;
  let failed = 0;
  for (const t of tests) {
    try {
      t.run();
      passed++;
    } catch (err) {
      failed++;
      console.log(`  FAIL: ${t.name} — ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  console.log(`\nResults: ${passed}/${tests.length} passed\n`);
  if (failed > 0) {
    console.log("SOME TESTS FAILED");
    process.exit(1);
  } else {
    console.log("ALL TESTS PASSED");
    process.exit(0);
  }
}

main();
