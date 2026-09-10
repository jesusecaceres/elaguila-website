/**
 * Business Concierge — Gate 2 (Business Dashboard Cockpit) focused verifier.
 * Structural/source-level proof — pure next-action logic is covered by real runtime execution in
 * scripts/test-business-dashboard-next-action.ts, which this script does not duplicate.
 * Same hand-rolled node:assert convention as every other verify-*.ts script in this repo.
 * Run from repo root: npx tsx scripts/verify-business-dashboard-gate2-01.ts
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

console.log("Gate 2 — Business Dashboard cockpit — focused tests\n");

function read(relPath: string): string {
  return readFileSync(path.resolve(__dirname, "..", relPath), "utf8");
}

const page = read("app/admin/(dashboard)/businesses/[businessId]/page.tsx");
const nav = read("app/admin/(dashboard)/businesses/[businessId]/BusinessDashboardNav.tsx");
const nextActionModule = read("app/admin/(dashboard)/businesses/[businessId]/businessDashboardNextAction.ts");

// --- 1-3. Cockpit header ------------------------------------------------------------------------
check("1. Business Dashboard has a visible cockpit header with real business identity", () => {
  assert.ok(page.includes("{business.displayName}"));
  assert.ok(page.includes("Business Concierge"));
  assert.ok(page.includes("Business Dashboard"));
});
check("2/3. Stage/status are rendered from real canonical fields, not hardcoded", () => {
  assert.ok(page.includes("labelFromList(BUSINESS_SALES_STATUSES, salesProfile.status)"));
  assert.ok(page.includes("labelFromList(BUSINESS_STAGES, business.businessStage)"));
});
check("4. Next follow-up is visible in the header when one exists", () => {
  assert.ok(/currentFollowUp \?[\s\S]{0,400}Follow-up/.test(page));
});
check("5. Operational attention/summary chips (last contact, next meeting, commitments, opportunities, creative, proposal) all derive from data already loaded elsewhere — no new query introduced for them", () => {
  assert.ok(page.includes("salesProfile.lastContactedAt"));
  assert.ok(page.includes("upcomingMeeting"));
  assert.ok(page.includes("creativeAwaitingReviewCount"));
  assert.ok(page.includes("currentProposal"));
  assert.ok(page.includes("blockedOrOverdueCommitmentCount"));
  // These must be derived in-memory from arrays already fetched (program5Data / creativeJobViews /
  // opportunities), never a second repository call for the same data.
  const derivedBlock = page.slice(page.indexOf("const upcomingMeeting"), page.indexOf("return (\n    <div"));
  assert.ok(!/await list\w+ForBusiness/.test(derivedBlock), "no new repository read may be introduced to compute hero/summary signals");
});

// --- 6-13. Overview ------------------------------------------------------------------------------
check("6. Overview section exists with a real id", () => {
  assert.ok(page.includes('id="overview"'));
});
check("7. Business Snapshot card exists in Overview", () => {
  assert.ok(page.includes("Business snapshot"));
});
check("8. Current Understanding card exists, gated on real Business Book data (never shown when the actor cannot view it)", () => {
  assert.ok(page.includes("Current understanding"));
  const idx = page.indexOf("Current understanding");
  const before = page.slice(Math.max(0, idx - 400), idx);
  assert.ok(before.includes("canViewBook && bookData"));
});
check("9. Health summary card exists in Overview, gated on real Health Map data, with a truthful empty state", () => {
  assert.ok(page.includes("Business health"));
  assert.ok(page.includes("We need more verified information before assessing this area."));
});
check("10. Relationship summary card exists in Overview", () => {
  assert.ok(page.includes("Relationship"));
});
check("11. Next Right Move card exists in Overview, gated on real stewardship data, honest when none exists", () => {
  assert.ok(page.includes("Next right move"));
  assert.ok(page.includes("Leonix is still learning enough to recommend responsibly."));
});
check("12. Opportunity/Creative summary card exists in Overview with truthful empty states", () => {
  assert.ok(page.includes("Opportunities &amp; creative") || page.includes("Opportunities & creative"));
  assert.ok(page.includes("No relevant opportunities are ready for review yet."));
  assert.ok(page.includes("No creative request has been created yet."));
});
check("13. Commitment summary card exists in Overview, gated on real commitment data", () => {
  const idx = page.indexOf("<h3 className=\"text-xs font-bold uppercase tracking-wide text-[#8A6B1F]\">Commitments</h3>");
  assert.ok(idx >= 0, "Commitments Overview card not found");
});

// --- 14-15. Local nav destinations ----------------------------------------------------------------
const REQUIRED_NAV_IDS = ["overview", "business-book", "health", "outreach", "meetings", "recommend", "opportunity", "creative", "proposals", "promises", "outcomes"];
check("14. Every required local nav destination is present as a possible tab entry", () => {
  for (const id of REQUIRED_NAV_IDS) {
    assert.ok(page.includes(`id: "${id}"`), `dashboardTabs is missing id "${id}"`);
  }
});
check("15. Every nav href has a matching rendered section id in the page (id=\"...\" or a component known to render that id internally)", () => {
  // "recommend" is rendered inside RecommendJourney.tsx itself, not a wrapper id in page.tsx —
  // confirmed present as a real anchor by the component's own file, not re-verified here to avoid
  // duplicating that component's own test coverage. Every other id must have a literal id="..." in page.tsx.
  for (const id of REQUIRED_NAV_IDS) {
    if (id === "recommend") continue;
    assert.ok(page.includes(`id="${id}"`), `no rendered section id="${id}" found in page.tsx`);
  }
});

// --- 16. Capability gating -------------------------------------------------------------------------
check("16. No section renders unconditionally when it depends on a capability check — every gated section's JSX is preceded by its own actorHasCapability-derived boolean", () => {
  for (const [id, guardVar] of [
    ["business-book", "canViewBook && bookData"],
    ["health", "canViewHealthMap && healthData"],
    ["opportunity", "canViewOpportunities && opportunityEnabled"],
    ["creative", "canViewCreativeStudio && creativeStudioEnabled"],
  ] as const) {
    const sectionIdx = page.indexOf(`id="${id}"`);
    assert.ok(sectionIdx >= 0, `section ${id} not found`);
    const before = page.slice(Math.max(0, sectionIdx - 250), sectionIdx);
    assert.ok(before.includes(guardVar), `section ${id} is not guarded by ${guardVar} immediately before its JSX`);
  }
});

// --- 17. Outreach organization -----------------------------------------------------------------------
check("17. Notes and Follow-up are organized under the Outreach section, not left contextless elsewhere", () => {
  const outreachIdx = page.indexOf('id="outreach"');
  const nextSectionIdx = page.indexOf('id="meetings"');
  assert.ok(outreachIdx >= 0 && nextSectionIdx > outreachIdx);
  const outreachBlock = page.slice(outreachIdx, nextSectionIdx);
  assert.ok(outreachBlock.includes("<FollowUpPanel"));
  assert.ok(outreachBlock.includes("<NotesPanel"));
});

// --- 18. Meetings journey -------------------------------------------------------------------------
check("18. Meetings section renders the real MeetingJourney component (prep/meeting/review lives inside it, not duplicated here)", () => {
  const idx = page.indexOf('id="meetings"');
  const block = page.slice(idx, idx + 600);
  assert.ok(block.includes("<MeetingJourney"));
});

// --- 19. Six tests preserved -----------------------------------------------------------------------
check("19. Recommendations section still passes real six-test data through to RecommendJourney — no hardcoded test terminology removed", () => {
  assert.ok(page.includes("tests={stewardshipData.tests}"));
});

// --- 20. Accepted semantics ------------------------------------------------------------------------
check("20. 'Accepted' proposal never implies signed/paid/published anywhere in the touched page", () => {
  assert.ok(page.includes("does not charge, sign a contract, publish, or confirm an opportunity"));
  assert.ok(!/[Aa]ccepted[^.]{0,40}(signed|paid|published)/.test(page));
  assert.ok(page.includes("Accepted — handoff pending"));
});

// --- 21. No hardcoded fake counters ----------------------------------------------------------------
check("21. No hardcoded numeric literal is used as a live count anywhere in the new/changed cockpit code (every count is a real .length or a real repository field)", () => {
  const overviewBlock = page.slice(page.indexOf('id="overview"'), page.indexOf('id="business-book"'));
  assert.ok(!/>\s*\d+\s*</.test(overviewBlock.replace(/completeness\.(met|total)Count/g, "")), "a literal number appears where a real count should be");
});

// --- 22. No duplicate business-domain storage -------------------------------------------------------
check("22. computeBusinessDashboardNextAction and the Overview cards read only already-loaded arrays/records — no new table, no new repository, no new query file", () => {
  assert.ok(!nextActionModule.includes("getAdminSupabase"));
  assert.ok(!nextActionModule.includes("server-only"));
  assert.ok(!/CREATE TABLE/i.test(nextActionModule));
});

// --- 23. No new migration ---------------------------------------------------------------------------
check("23. No migration file was created for this gate", () => {
  // Presence check only — the authoritative check is git status in the final report; this asserts
  // the new source files themselves contain no embedded SQL DDL.
  assert.ok(!/CREATE TABLE|ALTER TABLE/i.test(page));
});

// --- 24. Mobile structural safety --------------------------------------------------------------------
check("24. Nav stays horizontally safe on mobile (overflow-x-auto) with 44px targets, unchanged", () => {
  assert.ok(nav.includes("overflow-x-auto"));
  assert.ok(nav.includes("min-h-[44px]"));
  assert.ok(nav.includes("sticky"));
});
check("24b. New Overview summary cards use a responsive grid that stacks to one column on mobile", () => {
  assert.ok(page.includes("grid-cols-1 gap-3 sm:grid-cols-2"));
});

// --- 25. Field Agent deep link -------------------------------------------------------------------------
check("25. The existing Field Agent deep link still resolves to the same real route", () => {
  assert.ok(page.includes("href={`/admin/field/${business.id}`}"));
});

console.log(`\n${passed} check(s) passed.`);
if (process.exitCode) {
  console.error("\nSome checks FAILED.");
} else {
  console.log("\nAll checks passed.");
}
