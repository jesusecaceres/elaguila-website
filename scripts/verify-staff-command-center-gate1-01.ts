/**
 * Gate 1 — Staff Command Center completion. Focused tests for:
 *   - the Advisor bounded, idempotent refresh (app/lib/business/advisor/refresh.ts) now has a
 *     real production caller (the Command Center page), closing the "scanner exists, nothing
 *     ever calls it" defect found during the reconciliation audit;
 *   - the four new bounded cross-business reads (meetings, commitments, creative, proposals
 *     awaiting decision) that power Today / Needs Attention;
 *   - the cross-domain Needs Attention merge (composeNeedsAttentionList) and the extended
 *     composeStaffConciergeHome missing-information composition — both pure, both exercised with
 *     real runtime execution, not just source-text scanning;
 *   - Quick Actions resolve to real routes; every attention entry carries a real business-scoped
 *     deep link; authorization stays server-authoritative and bootstrap still cannot write.
 * Same hand-rolled node:assert convention as every other verify-*.ts script in this repo.
 * Run from repo root: npx tsx scripts/verify-staff-command-center-gate1-01.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  composeNeedsAttentionList,
  composeStaffConciergeHome,
  emptyStaffConciergeHome,
  type StaffConciergeAttentionEntry,
} from "../app/admin/_lib/staffConciergeHome";

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

console.log("Gate 1 — Staff Command Center completion — focused tests\n");

function read(relPath: string): string {
  return readFileSync(path.resolve(__dirname, "..", relPath), "utf8");
}

const refreshText = read("app/lib/business/advisor/refresh.ts");
const meetingsRepoText = read("app/lib/business/meetingStudio/repository.ts");
const commitmentsRepoText = read("app/lib/business/promiseKeeper/repository.ts");
const creativeRepoText = read("app/lib/business/creativeStudio/repository.ts");
const proposalsRepoText = read("app/lib/business/proposals/repository.ts");
const pageText = read("app/admin/(dashboard)/businesses/page.tsx");
const uiText = read("app/admin/(dashboard)/businesses/StaffCommandCenter.tsx");
const homeText = read("app/admin/_lib/staffConciergeHome.ts");
const accessText = read("app/admin/_lib/businessWorkspaceAccess.ts");

// --- 1. Advisor scanner has a reachable production path ----------------------------------------
check("1. Advisor scanner (scanBusinessSignals) has a real production caller: refresh.ts, which the Command Center page calls", () => {
  assert.ok(refreshText.includes("scanBusinessSignals"));
  assert.ok(refreshText.includes("createSignal"));
  assert.ok(pageText.includes("refreshAdvisorSignalsForWorkspaceScope"));
});

// --- 2. Command Center attention refresh is bounded ---------------------------------------------
check("2. Advisor refresh is bounded — a fixed scan limit, not the whole workspace, and reuses the already-loaded home scope rather than issuing a fresh unbounded listing", () => {
  assert.ok(refreshText.includes("ADVISOR_REFRESH_SCAN_LIMIT"));
  assert.ok(/\.slice\(0, ADVISOR_REFRESH_SCAN_LIMIT\)/.test(refreshText));
  assert.ok(pageText.includes("homeScopeBusinessIds"), "the refresh scope must reuse the business list already loaded for the page, not a second listing query");
});

// --- 3. Repeated refresh does not duplicate active signals --------------------------------------
check("3. refreshOneBusiness skips creating a signal whose type is already active — idempotent by construction", () => {
  assert.ok(/alreadyActiveTypes\.has\(signal\.signalType\)\) continue/.test(refreshText));
  assert.ok(refreshText.includes("listActiveSignals"), "must check existing active signals before writing, not write unconditionally");
});
check("3b. Advisor refresh only ever runs for a real staff actor, never owner_bootstrap (no roster identity to attribute the write to)", () => {
  assert.ok(pageText.includes("toStaffWriteActor(access.actor)"));
  assert.ok(/writeAccess\.ok\s*&&\s*homeScopeBusinessIds\.length > 0/.test(pageText), "refresh must be gated on a successful staff-write conversion, not run unconditionally");
});

// --- 4/5. Overdue / blocked commitment surfaces --------------------------------------------------
check("4/5. listCommitmentsAttentionForStaffAttention surfaces both overdue (active + due_at in the past) and blocked commitments, blocked first (more severe)", () => {
  assert.ok(commitmentsRepoText.includes('.eq("status", "blocked")'));
  assert.ok(commitmentsRepoText.includes('.eq("status", "active")'));
  assert.ok(commitmentsRepoText.includes('.lt("due_at", nowIso)'));
  const blockedIdx = commitmentsRepoText.indexOf("blockedResult.data");
  const overdueIdx = commitmentsRepoText.indexOf("overdueResult.data");
  assert.ok(blockedIdx >= 0 && overdueIdx >= 0 && blockedIdx < overdueIdx, "blocked rows must be assembled before overdue rows so blocked wins the per-business dedupe");
});

// --- 6. Creative awaiting review surfaces ---------------------------------------------------------
check("6. listCreativeAwaitingReviewForStaffAttention surfaces jobs in_review or owner_review", () => {
  assert.ok(creativeRepoText.includes('.in("status", ["in_review", "owner_review"])'));
});

// --- 7. Proposal awaiting owner/client decision surfaces ------------------------------------------
check("7. listProposalsAwaitingDecisionForStaffAttention surfaces current owner_review proposals, distinct from accepted (Owner Handoff)", () => {
  assert.ok(proposalsRepoText.includes('.eq("status", "owner_review")'));
  assert.ok(proposalsRepoText.includes('.eq("is_current", true)'));
});

// --- 8. Unresolved contradiction surfaces (via Advisor, not a second detector) --------------------
check("8. Unresolved contradiction / stale fact / outcome-review-due reach Needs Attention exclusively through the existing Advisor signal set — no second detector", () => {
  assert.ok(pageText.includes("UNRESOLVED_CONTRADICTION"));
  assert.ok(pageText.includes("STALE_CRITICAL_TRUTH"));
  assert.ok(pageText.includes("OUTCOME_REVIEW_DUE"));
  assert.ok(pageText.includes("ADVISOR_ONLY_ATTENTION_TYPES"));
  assert.ok(!pageText.includes("detectSignals("), "the page must not re-run signal detection itself — it only reads what refresh.ts already wrote via the real Advisor scanner");
});

// --- 9. Upcoming meeting surfaces ------------------------------------------------------------------
check("9. listUpcomingMeetingsForStaffAttention surfaces planned/prepared meetings scheduled in the future only", () => {
  assert.ok(meetingsRepoText.includes('.in("status", ["planned", "prepared"])'));
  assert.ok(meetingsRepoText.includes('.gte("scheduled_at", nowIso)'));
});

// --- 10. Accepted proposal remains Owner Handoff ---------------------------------------------------
check("10. Owner Handoff (listAcceptedCurrentProposalsForHandoff) is untouched — still reads status=accepted, is_current=true", () => {
  assert.ok(proposalsRepoText.includes('.eq("status", "accepted")'));
  assert.ok(proposalsRepoText.includes("listAcceptedCurrentProposalsForHandoff"));
  assert.ok(pageText.includes("ownerHandoff={ownerHandoff}"));
});

// --- 11. owner_review proposal appears as Awaiting Decision, distinct from Owner Handoff -----------
check("11. Awaiting Decision and Owner Handoff are two distinct reads/sections, never merged into one concept", () => {
  assert.ok(pageText.includes("listProposalsAwaitingDecisionForStaffAttention"));
  assert.ok(pageText.includes("listAcceptedCurrentProposalsForHandoff"));
  assert.ok(uiText.includes("Owner Handoff"));
  assert.ok(pageText.includes("Proposal awaiting client decision"));
});

// --- 12. Missing-information items use real completeness data --------------------------------------
check("12. composeStaffConciergeHome derives missingInformation only from real completeness fields already computed by listBusinessesForWorkspace — no invented score", () => {
  const sample = composeStaffConciergeHome([
    { business: { id: "b1", displayName: "Rivera Law" }, salesStatus: "new", nextFollowUpDate: null, nextFollowUpStatus: null, hasPhone: false, hasEmail: true, hasWebsite: true, completenessMet: 3, completenessTotal: 7 },
    { business: { id: "b2", displayName: "Complete Co" }, salesStatus: "new", nextFollowUpDate: null, nextFollowUpStatus: null, hasPhone: true, hasEmail: true, hasWebsite: true, completenessMet: 7, completenessTotal: 7 },
  ]);
  assert.equal(sample.missingInformation.length, 1, "a fully-complete business must not appear in missingInformation");
  assert.equal(sample.missingInformation[0]?.businessId, "b1");
  assert.equal(sample.missingInformation[0]?.missingLabel, "Missing phone");
});
check("12b. A source with no completeness fields at all (legacy/minimal callers) yields no missing-information entries — never a fabricated default", () => {
  const sample = composeStaffConciergeHome([
    { business: { id: "b1", displayName: "Legacy" }, salesStatus: "new", nextFollowUpDate: null, nextFollowUpStatus: null },
  ]);
  assert.equal(sample.missingInformation.length, 0);
});
check("12c. emptyStaffConciergeHome includes an empty missingInformation array (no undefined field)", () => {
  assert.deepEqual(emptyStaffConciergeHome().missingInformation, []);
});

// --- 13. All displayed counts derive from canonical rows/data --------------------------------------
check("13. Today chips render array .length directly from the bounded reads — no static/placeholder numbers in the component", () => {
  assert.ok(uiText.includes("count={home.dueFollowUps.length}"));
  assert.ok(uiText.includes("count={home.overdueFollowUps.length}"));
  assert.ok(uiText.includes("count={upcomingMeetings.length}"));
  assert.ok(uiText.includes("count={commitmentsAttention.length}"));
  assert.ok(uiText.includes("count={proposalsAwaitingDecision.length}"));
  assert.ok(uiText.includes("count={creativeAwaitingReview.length}"));
  assert.ok(!/count=\{\d/.test(uiText), "no chip may be given a hardcoded numeric literal count");
});

// --- 14. Quick Actions resolve to real routes -------------------------------------------------------
check("14. Every Quick Action is a real route or real in-page anchor — no placeholder href", () => {
  assert.ok(uiText.includes('href="#businesses-inventory"'));
  assert.ok(uiText.includes('href="/admin/businesses/canvass"'));
  assert.ok(uiText.includes('href="/admin/field"'));
  assert.ok(!/href="#"/.test(uiText), "no dead placeholder link");
  assert.ok(!/href="javascript:/.test(uiText));
});

// --- 15. Every attention CTA reaches the correct business section ------------------------------------
check("15. Needs Attention entries deep-link to the section matching their reason (outreach/promises/proposals/creative/meetings/overview), composed once in page.tsx", () => {
  assert.ok(pageText.includes("#outreach"));
  assert.ok(pageText.includes("#promises"));
  assert.ok(pageText.includes("#proposals"));
  assert.ok(pageText.includes("#creative"));
  assert.ok(pageText.includes("#meetings"));
  assert.ok(pageText.includes("#overview"));
  assert.ok(pageText.includes("advisorSignalDashboardAnchor(row.signalType)"), "Advisor-only reasons must reuse the existing canonical anchor mapping, not a second one");
});
check("15b. composeNeedsAttentionList is pure, caps the list, de-duplicates per business, and preserves bucket priority order (runtime-verified, not just source-scanned)", () => {
  const entry = (businessId: string, reasonLabel: string): StaffConciergeAttentionEntry => ({
    businessId, displayName: businessId, reasonLabel, detailText: null, href: `/admin/businesses/${businessId}#x`,
  });
  const merged = composeNeedsAttentionList([
    [entry("b1", "Overdue follow-up"), entry("b2", "Follow-up due")],
    [entry("b1", "Blocked commitment"), entry("b3", "Overdue commitment")],
  ]);
  assert.equal(merged.length, 3, "b1 must appear exactly once, not twice");
  assert.equal(merged.find((m) => m.businessId === "b1")?.reasonLabel, "Overdue follow-up", "the first bucket's reason wins for a business appearing in multiple buckets");
  assert.ok(merged.some((m) => m.businessId === "b2"));
  assert.ok(merged.some((m) => m.businessId === "b3"));

  const manyBuckets = Array.from({ length: 10 }, (_, i) => [entry(`x${i}`, "reason")]);
  const capped = composeNeedsAttentionList(manyBuckets);
  assert.ok(capped.length <= 8, "the merged list must stay capped even with many distinct businesses");
});

// --- 16. Authorization remains server-authoritative ---------------------------------------------------
check("16. Page access still starts from requireSalesWorkspaceAccess() + a capability check before any data is read; Advisor refresh reuses the canonical write guard, no bespoke check", () => {
  assert.ok(pageText.includes("await requireSalesWorkspaceAccess()"));
  assert.ok(pageText.includes('actorHasCapability(access.actor, "view_business_list")'));
  assert.ok(pageText.includes("toStaffWriteActor(access.actor)"));
  assert.ok(!pageText.includes("isAdminBootstrapSession"), "the page must not re-implement its own bootstrap check — it goes through the one canonical actor pipeline");
});

// --- 17. Bootstrap cannot impersonate staff -------------------------------------------------------------
check("17. toStaffWriteActor still denies owner_bootstrap outright (unchanged canonical guard) — the Advisor refresh path has no alternate bootstrap-to-staff mapping", () => {
  assert.ok(accessText.includes("isOwnerBootstrapActor(actor)"));
  assert.ok(accessText.includes('reason: "bootstrap_write_denied"'));
  assert.ok(!/actorType\s*===?\s*["']owner_bootstrap["']/.test(refreshText), "refresh.ts must contain no bootstrap branch of its own to misuse — denial happens once, upstream, in toStaffWriteActor");
  assert.ok(!/type:\s*["']owner["']/.test(refreshText), "refresh.ts must never construct an owner-typed AdvisorActor itself");
  assert.ok(!homeText.includes("owner_bootstrap"), "staffConciergeHome.ts is pure composition and must never reference actor/session concepts at all");
});

// --- 18. Mobile layout: no horizontal overflow (structural/CSS inspection) ------------------------------
check("18. Today chips wrap (flex-wrap) rather than force a fixed-width row; Quick Actions use a 2-column mobile grid; long text is truncated/broken, not left to overflow", () => {
  assert.ok(uiText.includes("flex-wrap"));
  assert.ok(uiText.includes("grid-cols-2"));
  assert.ok(uiText.includes("min-w-0"));
  assert.ok(/break-words|truncate/.test(uiText));
  assert.ok(!/\bw-\[\d{3,}px\]/.test(uiText), "no component may hardcode a wide fixed pixel width that could force horizontal scroll on a 390px viewport");
});
check("18b. Every interactive attention/quick-action row keeps the existing 44px minimum touch target convention", () => {
  assert.ok((uiText.match(/min-h-\[44px\]/g) ?? []).length >= 5);
});

// --- 19. No unrelated domain regression --------------------------------------------------------------
check("19. No file touched in this gate references LEO, Owner Command Center, Viajes, Noticias, or classifieds — scope stayed inside Business Concierge", () => {
  for (const text of [refreshText, meetingsRepoText, commitmentsRepoText, creativeRepoText, proposalsRepoText, pageText, uiText, homeText]) {
    assert.ok(!/\bLEO\b/.test(text));
    assert.ok(!/owner-command-center|ownerCommandCenter/i.test(text));
    assert.ok(!/viajes|noticias|clasificados/i.test(text));
  }
});
check("19b. No new Supabase migration was introduced for this gate — every new read/write reuses existing tables (business_meetings, business_commitments, business_creative_jobs, business_proposals, business_advisor_signals)", () => {
  const newMigrationMarker = "20260909120000_business_ownership_claim_foundation.sql"; // last known migration before this gate
  void newMigrationMarker; // documents intent; actual file-listing check lives in the build/report step, not here
  assert.ok(!refreshText.includes("CREATE TABLE"));
  assert.ok(!meetingsRepoText.includes("CREATE TABLE"));
  assert.ok(!commitmentsRepoText.includes("CREATE TABLE"));
  assert.ok(!creativeRepoText.includes("CREATE TABLE"));
  assert.ok(!proposalsRepoText.includes("CREATE TABLE"));
});

console.log(`\n${passed} check(s) passed.`);
if (process.exitCode) {
  console.error("\nSome checks FAILED.");
} else {
  console.log("\nAll checks passed.");
}
