/**
 * Business Concierge — Gate 6 (Client Decision -> Owner Handoff -> Commitments -> Outcomes)
 * focused verifier. Same hand-rolled node:assert structural convention as every other
 * verify-*.ts script in this repo.
 * Run from repo root: npx tsx scripts/verify-decision-handoff-commitments-outcomes-gate6-01.ts
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

console.log("Gate 6 — Client Decision -> Owner Handoff -> Commitments -> Outcomes — focused tests\n");

function read(relPath: string): string {
  return readFileSync(path.resolve(__dirname, "..", relPath), "utf8");
}

const page = read("app/admin/(dashboard)/businesses/[businessId]/page.tsx");
const proposalActions = read("app/admin/(dashboard)/businesses/[businessId]/ProposalActions.tsx");
const promiseActions = read("app/admin/(dashboard)/businesses/[businessId]/PromiseKeeperActions.tsx");
const outcomesPanel = read("app/admin/(dashboard)/businesses/[businessId]/OutcomesPanel.tsx");
const advisorPanel = read("app/admin/(dashboard)/businesses/[businessId]/AdvisorPanel.tsx");
const ownershipClaimPanel = read("app/admin/(dashboard)/businesses/[businessId]/OwnershipClaimPanel.tsx");
const commitmentPriority = read("app/admin/(dashboard)/businesses/[businessId]/commitmentPriority.ts");
const proposalTypes = read("app/lib/business/proposals/types.ts");

// --- 1/2/3/4/5. Client decision states ------------------------------------------------------------
check("1. Every canonical proposal status has an understandable label", () => {
  const statuses = proposalTypes.match(/export type ProposalStatus =\s*([\s\S]*?);/)?.[1] ?? "";
  const keys = [...statuses.matchAll(/"([a-z_]+)"/g)].map((m) => m[1]);
  assert.ok(keys.length >= 8, "expected the full canonical status list");
  for (const key of keys) {
    assert.ok(proposalActions.includes(`case "${key}"`), `statusMeaning is missing an explicit case for status: ${key}`);
  }
});
check("2. Accepted semantics explicitly exclude signed/paid/creative-approved/published", () => {
  assert.ok(proposalActions.includes("does not mean opportunity approval, Creative approval, signed contract, payment, or publication"));
  assert.ok(proposalActions.includes("Not signed, not paid, not published."));
});
check("3. Declined state is truthful — history preserved, nothing deleted, no re-archival implied", () => {
  assert.ok(proposalActions.includes("Client declined this proposal. History is preserved."));
  assert.ok(proposalActions.includes("Notes, meetings, creative, and commitments are not deleted."));
});
check("4. Postponed/revisit uses the existing canonical follow-up path, not a fabricated status", () => {
  assert.ok(proposalActions.includes("Follow Up Later does not change proposal status. It uses the canonical sales follow-up."));
});
check("5. Needs-changes state is truthful — returns to staff review, creates no new version, is not Declined/Accepted", () => {
  assert.ok(proposalActions.includes("This returns the current proposal to staff review. It is not Declined, not Follow Up Later, and not Accepted."));
});

// --- 6/7/8. Owner Handoff -----------------------------------------------------------------------------
check("6. Owner Handoff renders only from a real accepted current proposal, never unconditionally", () => {
  const idx = page.indexOf('id="owner-handoff"');
  assert.ok(idx > 0);
  const before = page.slice(Math.max(0, idx - 800), idx);
  assert.ok(before.includes('p.status === "accepted"'));
  assert.ok(before.includes("if (!acceptedProposal) return null;"));
});
check("7. Owner Handoff and Ownership Claim remain visually and conceptually distinct sections", () => {
  assert.ok(page.includes('id="owner-handoff"') && page.includes('id="ownership-claim"'));
  assert.ok(page.includes(">Owner Handoff<"));
  assert.ok(page.includes("Ownership Claim — Owner Account Access"));
  assert.ok(/Distinct\s+from the Ownership Claim account-access mechanism/.test(page));
  assert.ok(page.includes("Separate from the commercial Owner Handoff summary above"));
});
check("8. No duplicate owner tooling was created — Owner Handoff reuses OwnershipClaimPanel and existing loaded data, no new fetch/API call", () => {
  const idx = page.indexOf('id="owner-handoff"');
  const end = page.indexOf("Promise Keeper */}", idx);
  const block = page.slice(idx, end);
  assert.ok(!/fetch\(/.test(block), "Owner Handoff must compose only already-loaded page data, not call a new endpoint");
  assert.ok(ownershipClaimPanel.includes("export function OwnershipClaimPanel"), "must still reuse the one existing OwnershipClaimPanel");
});

// --- 9/10. Contract boundary ---------------------------------------------------------------------------
check("9/10. Contract boundary preserved — no fake signed/paid/published state is claimed", () => {
  assert.ok(page.includes("Not tracked in Business Concierge"));
  assert.ok(page.includes("Contract signature, payment, and publication status are not recorded in this system."));
});

// --- 11/12/13. Commitments -----------------------------------------------------------------------------
check("11. Commitments visually prioritize overdue, blocked, due soon, open, then history", () => {
  assert.ok(commitmentPriority.includes('"overdue"') && commitmentPriority.includes('"blocked"') && commitmentPriority.includes('"due_soon"') && commitmentPriority.includes('"open"') && commitmentPriority.includes('"history"'));
  assert.ok(page.includes("COMMITMENT_PRIORITY_ORDER.map"));
});
check("12. Commitment title/responsible-party/due/status/blocker/event-history remain visible", () => {
  assert.ok(promiseActions.includes("commitment.titleEn") && promiseActions.includes("commitment.responsibleParty"));
  assert.ok(promiseActions.includes("commitment.dueAt") && promiseActions.includes("commitment.status"));
  assert.ok(promiseActions.includes("commitment.blocker") && promiseActions.includes("Event history"));
});
check("13. Gate 4 meeting-sourced commitment provenance remains visible", () => {
  assert.ok(promiseActions.includes("commitment.meetingId") && promiseActions.includes("source: "));
});

// --- 14/15. Postponed/revisit + no duplicate reminders -----------------------------------------------
check("14. Revisit path uses the one canonical follow-up route, not a new one", () => {
  const fn = proposalActions.match(/async function schedule\(\)[\s\S]*?\n {2}\}/)?.[0] ?? "";
  assert.ok(fn.includes('/api/admin/businesses/${businessId}/follow-up'));
});
check("15. No duplicate reminders/commitments system was introduced in this gate's new files", () => {
  assert.ok(!/fetch\(/.test(commitmentPriority), "commitmentPriority.ts must stay pure — no I/O");
  assert.ok(!/CREATE TABLE/i.test(page + commitmentPriority));
});

// --- 16/17/18/19. Outcomes -------------------------------------------------------------------------------
check("16. Outcomes is reachable at a real, stable anchor", () => {
  assert.ok(page.includes('id="outcomes"'));
});
check("17. Outcomes preserve evidence/confidence/causation honesty", () => {
  assert.ok(outcomesPanel.includes("Recorded observation or result — not guaranteed business impact, not ROI, and not automatic attribution."));
  assert.ok(outcomesPanel.includes("o.causationClaim") && outcomesPanel.includes("o.confidence"));
});
check("18. No fabricated ROI value is computed anywhere in Outcomes", () => {
  assert.ok(!/roi\s*=|computeRoi|calculateRoi/i.test(outcomesPanel + page));
});
check("19. Outcomes empty state is truthful and matches the required operational copy", () => {
  assert.ok(outcomesPanel.includes("No outcomes have been recorded yet. Record outcomes after execution or delivery."));
});

// --- 20/21. Outcome -> next action, no duplicate Advisor -----------------------------------------------
check("20. Outcomes can lead back to the existing Next Right Move / Advisor flow", () => {
  const idx = page.indexOf('id="outcomes"');
  const end = page.indexOf('id="advisor"', idx);
  const block = page.slice(idx, end);
  assert.ok(block.includes('href="#recommend"') && block.includes('href="#advisor"'));
});
check("21. No second Advisor/attention engine was created", () => {
  assert.ok(advisorPanel.includes("It cannot create recommendations, rewrite facts, send messages, charge, or publish."));
  assert.ok(!/CREATE TABLE/i.test(advisorPanel));
});

// --- 22/23. Authorization + private data ------------------------------------------------------------------
check("22. Authorization capability gates are unchanged and present on the new sections", () => {
  const idx = page.indexOf('id="owner-handoff"');
  const before = page.slice(Math.max(0, idx - 900), idx);
  assert.ok(before.includes("canViewCommitments"));
  assert.ok(page.includes("canManageCommitments"));
});
check("23. Owner Handoff surfaces no private/raw meeting-note content — only proposal/creative/commitment summary fields", () => {
  const idx = page.indexOf('id="owner-handoff"');
  const end = page.indexOf("Promise Keeper */}", idx);
  const block = page.slice(idx, end);
  assert.ok(!/\.notes\b|meetingNote|noteContent/i.test(block));
});

// --- 24. 390px structural ------------------------------------------------------------------------------------
check("24. New sections stack safely at mobile widths with real touch targets", () => {
  const idx = page.indexOf('id="owner-handoff"');
  const end = page.indexOf("Promise Keeper */}", idx);
  const block = page.slice(idx, end);
  assert.ok(block.includes("grid-cols-1 gap-2 sm:grid-cols-2"));
  assert.ok(block.includes("min-h-[44px]") || block.includes("min-h-[36px]"));
});

console.log(`\n${passed} check(s) passed.`);
if (process.exitCode) {
  console.error("\nSome checks FAILED.");
} else {
  console.log("\nAll checks passed.");
}
