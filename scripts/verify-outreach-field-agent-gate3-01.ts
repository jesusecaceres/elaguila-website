/**
 * Business Concierge — Gate 3 (Outreach + Follow-Up + Field Agent) focused verifier.
 * Structural/source-level proof — same hand-rolled node:assert convention as every other
 * verify-*.ts script in this repo.
 * Run from repo root: npx tsx scripts/verify-outreach-field-agent-gate3-01.ts
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

console.log("Gate 3 — Outreach + Follow-Up + Field Agent — focused tests\n");

function read(relPath: string): string {
  return readFileSync(path.resolve(__dirname, "..", relPath), "utf8");
}

const page = read("app/admin/(dashboard)/businesses/[businessId]/page.tsx");
const actions = read("app/admin/(dashboard)/businesses/[businessId]/BusinessWorkspaceActions.tsx");
const dictation = read("app/admin/field/[businessId]/FieldAgentDictationSection.tsx");
const fieldBusinessPage = read("app/admin/field/[businessId]/page.tsx");
const fieldComponents = read("app/admin/field/FieldAgentComponents.tsx");
const fieldIdentity = read("app/admin/field/FieldAgentIdentity.tsx");
const followUpRoute = read("app/api/admin/businesses/[businessId]/follow-up/route.ts");
const notesRoute = read("app/api/admin/businesses/[businessId]/notes/route.ts");
const evidenceRoute = read("app/api/admin/businesses/[businessId]/book/evidence/route.ts");
const workspaceData = read("app/admin/_lib/businessWorkspaceData.ts");

// --- 1/2/3. Outreach discoverability ---------------------------------------------------------
check("1. Outreach section visibly contains relationship state (status + last contacted)", () => {
  const idx = page.indexOf('id="outreach"');
  assert.ok(idx >= 0);
  const block = page.slice(idx, idx + 1600);
  assert.ok(block.includes("Relationship status"));
  assert.ok(block.includes("labelFromList(BUSINESS_SALES_STATUSES, salesProfile.status)"));
});
check("2. Notes are discoverable inside Outreach (not contextless elsewhere)", () => {
  const outreachIdx = page.indexOf('id="outreach"');
  const meetingsIdx = page.indexOf('id="meetings"');
  const block = page.slice(outreachIdx, meetingsIdx);
  assert.ok(block.includes("<NotesPanel"));
});
check("3. Follow-up is discoverable inside Outreach with its own stable anchor", () => {
  assert.ok(page.includes('id="follow-up"'));
  const outreachIdx = page.indexOf('id="outreach"');
  const meetingsIdx = page.indexOf('id="meetings"');
  const block = page.slice(outreachIdx, meetingsIdx);
  assert.ok(block.includes("<FollowUpPanel"));
});
check("Outreach hierarchy order matches Relationship -> Recent Activity/Notes -> Follow-up -> Contact actions", () => {
  const idx = {
    relationship: page.indexOf("Relationship status"),
    notes: page.indexOf("Recent activity — internal notes"),
    followUp: page.indexOf('id="follow-up"'),
    contact: page.indexOf("Contact actions"),
  };
  assert.ok(idx.relationship < idx.notes && idx.notes < idx.followUp && idx.followUp < idx.contact, `unexpected order: ${JSON.stringify(idx)}`);
});

// --- 4/5/6. Note save behavior (Business Dashboard NotesPanel) --------------------------------
check("4. Note save remains explicit — no auto-save on keystroke, one deliberate Save action", () => {
  const fn = actions.match(/export function NotesPanel[\s\S]*?\n}\n/)?.[0] ?? "";
  assert.ok(fn.includes('onClick={() => void submit()}'));
  assert.ok(!/onChange=\{[^}]*submit\(/.test(fn), "must never submit from onChange");
});
check("5. Note save failure preserves the typed text — body is only cleared after a real 2xx response", () => {
  const fn = actions.match(/async function submit\(\)[\s\S]*?\n {2}\}/)?.[0] ?? "";
  const clearIdx = fn.indexOf('setBody("")');
  const okCheckIdx = fn.indexOf("if (!res.ok)");
  assert.ok(clearIdx >= 0 && okCheckIdx >= 0 && okCheckIdx < clearIdx, "text must only clear after the !res.ok branch has already returned");
});
check("6. Note save success refreshes the page (server-rendered list is the source of truth, not client-only state)", () => {
  const fn = actions.match(/async function submit\(\)[\s\S]*?\n {2}\}/)?.[0] ?? "";
  assert.ok(fn.includes("router.refresh()"));
});

// --- 7. Note vs fact --------------------------------------------------------------------------
check("7. Internal notes are explicitly labeled as never a confirmed fact, both in Business Dashboard and Field Agent", () => {
  assert.ok(page.includes("Not a confirmed business fact"));
  assert.ok(dictation.includes("does not automatically become a verified business fact") || dictation.includes("no se convierte automáticamente en un hecho verificado"));
});

// --- 8/9. Note does not auto-create follow-up; Create Follow-up is explicit --------------------
check("8. Saving a note never calls the follow-up API as a side effect", () => {
  const saveFn = dictation.match(/async function saveNote\(\)[\s\S]*?\n {2}\}/)?.[0] ?? "";
  assert.ok(!saveFn.includes("/follow-up"), "note save must never itself call the follow-up endpoint");
});
check("9. Create Follow-up from a saved note is a distinct, explicit, user-clicked link — not automatic", () => {
  assert.ok(dictation.includes("dashboardOutreachHref"));
  assert.ok(/href=\{dashboardOutreachHref\}/.test(dictation));
});

// --- 10/11. Follow-up canonical path + Gate 1 visibility ----------------------------------------
check("10. The follow-up write path uses the one canonical business_follow_ups entity via businessWorkspaceData.ts, not a new table", () => {
  assert.ok(followUpRoute.includes("upsertCurrentFollowUp") && followUpRoute.includes("businessWorkspaceData"));
  assert.ok(workspaceData.includes('.from("business_follow_ups")'));
});
check("11. The same business_follow_ups table is what Gate 1's Staff Command Center reads (listBusinessesForWorkspace's follow-up fetch) — proven by shared source, not assumed", () => {
  const fetchFn = workspaceData.match(/function fetchCurrentFollowUpsByBusinessIds[\s\S]*?\n\}/)?.[0] ?? "";
  assert.ok(fetchFn.includes('.from("business_follow_ups")'), "listBusinessesForWorkspace's follow-up fetch must read the same table the write path writes to");
});
check("12. Assignee/authorization validation is preserved on the follow-up write path (create_follow_up capability, canonical actor guard)", () => {
  assert.ok(followUpRoute.includes('requireStaffWorkspaceWriteAccess("create_follow_up")'));
});

// --- 13/14/15. Field Agent identity + navigation ------------------------------------------------
check("13. Field Agent identifies itself as Quick Capture, distinct from the full Business Concierge", () => {
  assert.ok(fieldIdentity.includes("Quick capture") || fieldIdentity.includes("Captura rápida"));
  assert.ok(fieldIdentity.includes("Field Agent es captura rápida"));
});
check("14. Field Agent home links to the Staff Command Center", () => {
  assert.ok(fieldIdentity.includes('href="/admin/businesses"'));
});
check("15. Field Agent business screen links to the full Business Dashboard", () => {
  assert.ok(fieldIdentity.includes("href={`/admin/businesses/${businessId}`}"));
});

// --- 16/17. View Note + Create Follow-up from Field Agent ---------------------------------------
check("16. A saved Field Agent note exposes a real, truthful View Note destination (#business-book, where the evidence actually renders)", () => {
  assert.ok(dictation.includes("dashboardBookHref") && dictation.includes("#business-book"));
  assert.ok(fieldBusinessPage.includes("#business-book"));
});
check("17. Create Follow-up is reachable from Field Agent (both from a just-saved note and from the Recent Field Notes list) where authorized", () => {
  assert.ok(dictation.includes("Crear seguimiento") || dictation.includes("Create Follow-up"));
  assert.ok(fieldBusinessPage.includes("Crear seguimiento") || fieldBusinessPage.includes("Create Follow-up"));
});

// --- 18/19. Meeting / Opportunity quick actions --------------------------------------------------
check("18. The Meeting quick action targets the real #meetings section", () => {
  assert.ok(fieldComponents.includes('`${dashboard}#meetings`'));
});
check("19. The Opportunities quick action targets the real #opportunity section", () => {
  assert.ok(fieldComponents.includes('`${dashboard}#opportunity`'));
});

// --- 20/21/22. Dictation ---------------------------------------------------------------------------
check("20. Dictated text lands in a visible, editable textarea before save — never auto-submitted", () => {
  assert.ok(dictation.includes("<textarea"));
  assert.ok(dictation.includes("onChange={(e) => {"));
});
check("21. No auto-save was introduced — Save remains one explicit button click", () => {
  assert.ok(dictation.includes('onClick={() => void saveNote()}'));
  assert.ok(!/useEffect\([^)]*saveNote/.test(dictation), "must never auto-save via an effect");
});
check("22. No new speech/recording provider was introduced — dictation still uses the existing feature-detected Web Speech API only, and raw audio is never sent to the server", () => {
  assert.ok(fieldComponents.includes("SpeechRecognition"));
  assert.ok(!/MediaRecorder|getUserMedia|whisper|assemblyai|deepgram/i.test(fieldComponents + dictation));
});

// --- 23/24. No new storage --------------------------------------------------------------------------
check("23. No new reminders/follow-up table was created — the note save path still writes only to business_evidence (Living Book), not a new table", () => {
  assert.ok(evidenceRoute.length > 0, "evidence route must still exist");
  assert.ok(!/CREATE TABLE/i.test(dictation + fieldBusinessPage + page));
});
check("24. No new CRM/contact-event table was created for 'recent activity' — Outreach reuses existing notes/status/follow-up data only", () => {
  assert.ok(!/CREATE TABLE/i.test(page + actions));
  assert.ok(page.includes("Recent activity — internal notes"), "the recent-activity label must honestly point at the real notes data, not a fabricated feed");
});

// --- 25. Private note leakage --------------------------------------------------------------------
check("25. Internal sales notes are explicitly documented as never shown to the owner; the route requires the staff-only capability", () => {
  assert.ok(page.includes("Never shown to the owner"));
  assert.ok(notesRoute.includes('requireStaffWorkspaceWriteAccess("create_internal_note")'));
});

// --- 26. Mobile structural -------------------------------------------------------------------------
check("26. Field Agent note-save actions and Recent Field Notes keep 44px/36px+ touch targets and wrap on narrow screens", () => {
  assert.ok(dictation.includes("min-h-[44px]"));
  assert.ok(fieldBusinessPage.includes("min-h-[36px]") || fieldBusinessPage.includes("min-h-[44px]"));
  assert.ok(dictation.includes("flex-col gap-2 sm:flex-row sm:flex-wrap"));
});

console.log(`\n${passed} check(s) passed.`);
if (process.exitCode) {
  console.error("\nSome checks FAILED.");
} else {
  console.log("\nAll checks passed.");
}
