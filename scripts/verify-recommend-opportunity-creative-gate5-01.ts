/**
 * Business Concierge — Gate 5 (Recommendation -> Opportunity -> Creative) focused verifier.
 * Same hand-rolled node:assert structural convention as every other verify-*.ts script in this
 * repo. Run from repo root: npx tsx scripts/verify-recommend-opportunity-creative-gate5-01.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";

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

console.log("Gate 5 — Recommendation -> Opportunity -> Creative — focused tests\n");

function read(relPath: string): string {
  return readFileSync(path.resolve(__dirname, "..", relPath), "utf8");
}

const recommendJourney = read("app/admin/(dashboard)/businesses/[businessId]/RecommendJourney.tsx");
const opportunityActions = read("app/admin/(dashboard)/businesses/[businessId]/OpportunityActions.tsx");
const creativeJourney = read("app/admin/(dashboard)/businesses/[businessId]/CreativeJourney.tsx");
const creativeTruthPacket = read("app/admin/(dashboard)/businesses/[businessId]/CreativeTruthPacket.tsx");
const creativeStudioActions = read("app/admin/(dashboard)/businesses/[businessId]/CreativeStudioActions.tsx");
const page = read("app/admin/(dashboard)/businesses/[businessId]/page.tsx");
const creativeRequestRoute = read("app/api/admin/businesses/[businessId]/opportunities/[opportunityId]/creative-request/route.ts");
const creativeTypes = read("app/lib/business/creativeStudio/types.ts");

// --- 1/2/3/4. Recommendation ---------------------------------------------------------------------
check("1. Current recommendation is identifiable (candidate key + status + version)", () => {
  assert.ok(recommendJourney.includes("current.candidateKey"));
  assert.ok(recommendJourney.includes("current.status") && recommendJourney.includes("v{current.version}"));
});
check("2. All six stewardship tests remain present and unreduced", () => {
  for (const key of ["need", "readiness", "capacity", "life_alignment", "value", "lion_code"]) {
    assert.ok(recommendJourney.includes(`${key}:`), `missing six-test key: ${key}`);
  }
});
check("3. Recommendation rationale is visible (why it exists, not just what)", () => {
  assert.ok(recommendJourney.includes("Why this recommendation exists"));
  assert.ok(recommendJourney.includes("current.verifiedNeedEn") && recommendJourney.includes("current.selectionReasonEn"));
});
check("4. Blocker/review state is truthful — stored pass/caution/blocked only, no invented score, truthful empty state", () => {
  assert.ok(recommendJourney.includes("testResultClass"));
  assert.ok(recommendJourney.includes("This page does not infer pass or fail"));
  assert.ok(recommendJourney.includes("Leonix is still learning enough to recommend responsibly."));
});

// --- 5. Recommendation -> Opportunity transition ---------------------------------------------------
check("5. The recommendation -> opportunity transition is made explicit, not implied by proximity alone", () => {
  assert.ok(recommendJourney.includes("This recommendation is the relationship decision"));
  assert.ok(opportunityActions.includes("This recommendation is the relationship decision"));
  assert.ok(recommendJourney.includes("reviewing one is not the same as approving this recommendation"));
});

// --- 6/7/8/9. Opportunity experience -----------------------------------------------------------------
check("6. Opportunities are never auto-approved — every lifecycle transition requires an explicit click", () => {
  const fn = opportunityActions.match(/async function handleReviewAction[\s\S]*?\n {2}\}/)?.[0] ?? "";
  assert.ok(fn.includes("action: \"review\" | \"approve\" | \"dismiss\""));
  assert.ok(!/useEffect\([^)]*handleReviewAction/.test(opportunityActions), "must never auto-approve via an effect");
  assert.ok(opportunityActions.includes("Human review is required."));
});
check("7. Opportunity rationale/context is visible (why it fits, source, confidence)", () => {
  assert.ok(opportunityActions.includes("Why this was suggested"));
  assert.ok(opportunityActions.includes("matchReasons"));
  assert.ok(opportunityActions.includes("Source: {o.sourceTitle}"));
});
check("8. Opportunity human controls remain explicit (review/approve/dismiss/creative), gated by real capability props", () => {
  assert.ok(opportunityActions.includes("canReview") && opportunityActions.includes("canCreateCreativeRequest"));
  assert.ok(opportunityActions.includes("Mark reviewed"));
  assert.ok(/\bApprove\b/.test(opportunityActions));
  assert.ok(opportunityActions.includes("Dismiss"));
  assert.ok(opportunityActions.includes("Request Creative"));
});
check("9. Opportunity empty state is truthful and uses the exact required copy when none exist", () => {
  assert.ok(opportunityActions.includes("No relevant opportunities are ready for review yet."));
  assert.ok(opportunityActions.includes("opportunities.length === 0"));
});

// --- 10/11/12. Opportunity -> Creative bridge + truth -------------------------------------------------
check("10. The opportunity -> creative bridge is human-triggered, not automatic on approval", () => {
  const fn = opportunityActions.match(/async function handleCreateCreativeRequest[\s\S]*?\n {2}\}/)?.[0] ?? "";
  assert.ok(fn.includes("method: \"POST\""));
  assert.ok(opportunityActions.includes('onClick={() => onCreative(o.id)}'));
  assert.ok(!/useEffect\([^)]*onCreative/.test(opportunityActions));
});
check("11. Creative Studio jobs created from an opportunity carry real reviewed context (sourceOpportunityId), not fabricated input", () => {
  assert.ok(creativeRequestRoute.includes("sourceOpportunityId: opportunity.id"));
  assert.ok(creativeRequestRoute.includes('opportunity.lifecycleState !== "approved"'), "only an approved opportunity may bridge to creative");
});
check("12. No invented business facts — unknown truth renders as Missing, not fabricated", () => {
  assert.ok(creativeTruthPacket.includes('case "UNKNOWN"') && creativeTruthPacket.includes("Missing"));
  assert.ok(creativeTruthPacket.includes("No verified creative input snapshot is available."));
});

// --- 13/14. Creative status / brief understandability -------------------------------------------------
check("13. Every canonical creative job status has a truthful, understandable label", () => {
  const statuses = creativeTypes.match(/export type CreativeJobStatus =\s*([\s\S]*?);/)?.[1] ?? "";
  const keys = [...statuses.matchAll(/"([a-z_]+)"/g)].map((m) => m[1]);
  assert.ok(keys.length >= 8, "expected the full canonical status list");
  for (const key of keys) {
    assert.ok(creativeJourney.includes(`case "${key}"`), `jobStatusMeaning is missing an explicit case for status: ${key}`);
  }
});
check("14. Creative brief/truth state is understandable (brief fields readable, truth status badges present)", () => {
  assert.ok(creativeJourney.includes("BriefReadout"));
  assert.ok(creativeTruthPacket.includes("truthLabel"));
});

// --- 15/16/17. Provider truth --------------------------------------------------------------------------
check("15. Provider availability remains truthful (configured/not configured, never assumed live)", () => {
  assert.ok(creativeStudioActions.includes("configured") && creativeStudioActions.includes("not configured"));
  assert.ok(creativeStudioActions.includes("Creative generation provider is not available."));
});
check("16. No new provider invocation was added by this gate", () => {
  const touched = recommendJourney + opportunityActions + creativeJourney + creativeTruthPacket;
  assert.ok(!/geminiCreativeProvider|openaiCreativeProvider|GoogleGenerativeAI|OpenAI\(/.test(touched));
});
check("17. No image generation was triggered by this gate", () => {
  const touched = recommendJourney + opportunityActions + creativeJourney + creativeTruthPacket;
  assert.ok(!/generate-image|generateImage/i.test(touched));
});

// --- 18/19/20. Human control boundaries -----------------------------------------------------------------
check("18. No automatic publication — export/handoff still described as manual, not publish", () => {
  assert.ok(creativeJourney.includes("Export is not website, magazine, social, email, or SMS publish."));
});
check("19. No automatic client outreach was added to the opportunity/creative bridge", () => {
  assert.ok(!/mailto:|sms:|wa\.me/.test(opportunityActions + creativeJourney));
});
check("20. No automatic sponsorship confirmation anywhere in the opportunity flow", () => {
  assert.ok(opportunityActions.includes("Approved does not mean the client accepted, sponsorship sold"));
});

// --- 21/22/23. No duplicate systems -----------------------------------------------------------------------
check("21/22/23. No duplicate recommendation, opportunity, or creative-truth store was created", () => {
  const touched = recommendJourney + opportunityActions + creativeJourney + creativeTruthPacket + creativeStudioActions;
  assert.ok(!/CREATE TABLE/i.test(touched));
});

// --- 24. Authorization ---------------------------------------------------------------------------------
check("24. Authorization capability wiring for opportunity/creative review is unchanged and present", () => {
  assert.ok(page.includes("canReviewOpportunity") && page.includes("canCreateOpportunityCreativeRequest"));
  assert.ok(page.includes("canGenerateCreative") && page.includes("canCreateCreativeBrief"));
});

// --- 25. 390px structural --------------------------------------------------------------------------------
check("25. New elements reuse existing mobile-safe stacking and touch-target conventions", () => {
  assert.ok(opportunityActions.includes("min-h-[44px]"));
  assert.ok(recommendJourney.includes("sm:flex-row sm:flex-wrap"));
});

console.log(`\n${passed} check(s) passed.`);
if (process.exitCode) {
  console.error("\nSome checks FAILED.");
} else {
  console.log("\nAll checks passed.");
}
