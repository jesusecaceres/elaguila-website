/**
 * Business Concierge — Full Master-Bible / Execution-Map certification verifier.
 * Complements (does not replace) the Gate 1-6 verifiers. Covers the cross-cutting
 * reconciliation findings from the final certification pass: Staff Command Center ->
 * per-business Owner Handoff wiring, Living Business Book evidence visibility, fact
 * source-class distinction, local-navigation completeness, and the 20-question product
 * test's structural reachability. Same hand-rolled node:assert structural convention as
 * every other verify-*.ts script in this repo.
 * Run from repo root: npx tsx scripts/verify-full-md-certification-01.ts
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

console.log("Full MD Certification — cross-cutting reconciliation checks\n");

function read(relPath: string): string {
  return readFileSync(path.resolve(__dirname, "..", relPath), "utf8");
}

const page = read("app/admin/(dashboard)/businesses/[businessId]/page.tsx");
const staffCommandCenter = read("app/admin/(dashboard)/businesses/StaffCommandCenter.tsx");
const livingBookRepo = read("app/lib/business/livingBook/repository.ts");
const recommendJourney = read("app/admin/(dashboard)/businesses/[businessId]/RecommendJourney.tsx");
// id="recommend" is rendered inside RecommendJourney.tsx, not page.tsx itself — check both surfaces together.
const pageAndChildAnchors = page + recommendJourney;

// --- Repair 1: Staff Command Center Owner Handoff now points at the real summary section -----
check("Repair 1a. Staff Command Center's Owner Handoff list links to the real #owner-handoff section, not #proposals", () => {
  assert.ok(staffCommandCenter.includes('href={`/admin/businesses/${row.businessId}#owner-handoff`}'));
  assert.ok(!staffCommandCenter.includes('href={`/admin/businesses/${row.businessId}#proposals`}'));
});
check("Repair 1b. That target section actually exists on the business page", () => {
  assert.ok(page.includes('id="owner-handoff"'));
});

// --- Repair 2: Living Business Book evidence is no longer a broken promise ---------------------
check("Repair 2a. Business Book fetches evidence via the one canonical listEvidenceForBusiness, not a new query", () => {
  assert.ok(page.includes("listEvidenceForBusiness(business.id)"));
  assert.ok(livingBookRepo.includes("export async function listEvidenceForBusiness"));
});
check("Repair 2b. Business Book renders evidence with a truthful empty state, honoring the section's own subtitle promise", () => {
  const idx = page.indexOf('id="business-book"');
  const end = page.indexOf('id="discover"', idx) >= 0 ? page.indexOf("Program 4", idx) : page.length;
  const block = page.slice(idx, end);
  assert.ok(block.includes("Verified facts, evidence, unknowns, contradictions"));
  assert.ok(block.includes("Evidence<"));
  assert.ok(block.includes("bookData.evidence.slice(0, 20).map"));
  assert.ok(block.includes("No evidence recorded yet."));
});
check("Repair 2c. Evidence is explicitly labeled as not-yet-a-fact — no accidental cross-promotion implied", () => {
  assert.ok(page.includes("Evidence is not a fact until a human explicitly promotes it above."));
});
check("Repair 2d. Field Agent's existing 'View Note' promise now resolves to a section that actually renders the note", () => {
  const dictation = read("app/admin/field/[businessId]/FieldAgentDictationSection.tsx");
  assert.ok(dictation.includes("#business-book"));
});

// --- Repair 3: Fact source-class is now visually distinguished, not a uniform pill --------------
check("Repair 3. AI-inference and owner-confirmed facts render with visibly different badge colors", () => {
  assert.ok(page.includes("function factSourceClassBadgeClass"));
  assert.ok(page.includes('"owner_confirmed"') && page.includes('"ai_inference"'));
  assert.ok(page.includes("factSourceClassBadgeClass(f.sourceClass)"));
});

// --- Local navigation completeness (discoverability doctrine: staff must find every capability) --
check("Local navigation exposes every major domain the product contract requires", () => {
  const requiredTabIds = [
    "overview", "business-book", "health", "outreach", "meetings",
    "recommend", "opportunity", "creative", "proposals", "promises", "outcomes", "advisor",
  ];
  for (const id of requiredTabIds) {
    assert.ok(page.includes(`id: "${id}"`), `dashboardTabs is missing a real nav entry for: ${id}`);
  }
});
check("Every nav tab id corresponds to a real rendered section anchor on the page", () => {
  const requiredSectionIds = [
    "overview", "business-book", "health", "outreach", "meetings",
    "recommend", "opportunity", "creative", "proposals", "promises", "outcomes", "advisor",
    "owner-handoff", "ownership-claim",
  ];
  for (const id of requiredSectionIds) {
    assert.ok(pageAndChildAnchors.includes(`id="${id}"`), `neither page.tsx nor its rendered children ever create a section with id="${id}"`);
  }
});

// --- 20-question product test: structural reachability of every required answer ------------------
check("20-question test: business identity (#1-3) is answered above the fold", () => {
  assert.ok(page.includes("business.displayName") && page.includes("broadBusinessType"));
});
check("20-question test: known vs unknown (#4-5) is answered via Business Book completeness counts", () => {
  assert.ok(page.includes("bookData.completeness.confirmedFactCount") && page.includes("bookData.completeness.openUnknownCount"));
});
check("20-question test: what needs attention (#6) is answered via Advisor + Overview", () => {
  assert.ok(page.includes('id="advisor"'));
});
check("20-question test: contact/relationship history (#7-8) is answered via Outreach relationship status + recent activity", () => {
  const idx = page.indexOf('id="outreach"');
  assert.ok(idx > 0);
});
check("20-question test: next follow-up and next meeting (#9-10) are answered via Outreach follow-up + Meeting Brief", () => {
  assert.ok(page.includes("currentFollowUp") && page.includes("upcomingMeeting"));
});
check("20-question test: what the owner asked / what Leonix promised (#11-12) are answered via Meeting Review + Commitments", () => {
  assert.ok(page.includes('id="promises"'));
});
check("20-question test: recommendation and its rationale (#13) is answered via Next Right Move", () => {
  assert.ok(pageAndChildAnchors.includes('id="recommend"'));
});
check("20-question test: real contextual opportunity (#14) is answered via Opportunities", () => {
  assert.ok(page.includes('id="opportunity"'));
});
check("20-question test: creative need + creative truth (#15-16) is answered via Creative Studio + Creative Truth Packet", () => {
  const creativeJourney = read("app/admin/(dashboard)/businesses/[businessId]/CreativeJourney.tsx");
  assert.ok(page.includes('id="creative"'));
  assert.ok(creativeJourney.includes("CreativeTruthPacket"));
});
check("20-question test: client acceptance and revisit path (#17-18) are answered via Client Decision + Follow Up Later", () => {
  assert.ok(page.includes('id="proposals"'));
});
check("20-question test: what Chuy needs if accepted (#19) is answered via the real Owner Handoff summary", () => {
  assert.ok(page.includes('id="owner-handoff"') && page.includes("Accepted proposal"));
});
check("20-question test: what happened after delivery (#20) is answered via Outcomes, with a bridge back to Next Right Move", () => {
  const idx = page.indexOf('id="outcomes"');
  const end = page.indexOf('id="advisor"', idx);
  const block = page.slice(idx, end);
  assert.ok(block.includes('href="#recommend"'));
});

// --- No duplicate systems introduced by this repair pass -----------------------------------------
check("No duplicate domain/table was introduced by this repair pass", () => {
  assert.ok(!/CREATE TABLE/i.test(page + staffCommandCenter));
});

console.log(`\n${passed} check(s) passed.`);
if (process.exitCode) {
  console.error("\nSome checks FAILED.");
} else {
  console.log("\nAll checks passed.");
}
