/**
 * Business Concierge — Gate 4 (Meeting Journey: Prep -> Meeting -> Human Review -> Promote /
 * Classify -> Recommend) focused verifier. Same hand-rolled node:assert structural convention as
 * every other verify-*.ts script in this repo.
 * Run from repo root: npx tsx scripts/verify-meeting-review-recommend-gate4-01.ts
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

console.log("Gate 4 — Meeting Journey (Prep -> Meeting -> Review -> Recommend) — focused tests\n");

function read(relPath: string): string {
  return readFileSync(path.resolve(__dirname, "..", relPath), "utf8");
}

const page = read("app/admin/(dashboard)/businesses/[businessId]/page.tsx");
const journey = read("app/admin/(dashboard)/businesses/[businessId]/MeetingJourney.tsx");
const studioActions = read("app/admin/(dashboard)/businesses/[businessId]/MeetingStudioActions.tsx");
const promiseActions = read("app/admin/(dashboard)/businesses/[businessId]/PromiseKeeperActions.tsx");
const recommendJourney = read("app/admin/(dashboard)/businesses/[businessId]/RecommendJourney.tsx");
const cockpitBriefing = read("app/lib/business/meetingStudio/cockpitBriefing.ts");
const meetingRepository = read("app/lib/business/meetingStudio/repository.ts");
const commitmentsRoute = read("app/api/admin/businesses/[businessId]/commitments/route.ts");
const meetingRoute = read("app/api/admin/businesses/[businessId]/meetings/[meetingId]/route.ts");

// --- 1/2/3/4. Meeting Brief / Prep -------------------------------------------------------------
check("1. Meeting Brief (Lion's Cockpit) is visible/reachable under the real #meetings anchor", () => {
  assert.ok(page.includes('id="meetings"'));
  assert.ok(journey.includes("Lion&apos;s Cockpit") || journey.includes("Lion's Cockpit"));
});
check("2. Meeting Brief composes existing business truth via assembleCockpitBriefing, not a parallel composer", () => {
  assert.ok(journey.includes("briefing.truthClasses.confirmed"));
  assert.ok(cockpitBriefing.includes("listFactsForBusiness") && cockpitBriefing.includes("listUnknownsForBusiness"));
});
check("3. Known vs unknown/missing information is visible before the meeting", () => {
  assert.ok(journey.includes("What we know"));
  assert.ok(journey.includes("What we don't know"));
  assert.ok(journey.includes("openUnknowns"));
});
check("4. Health Map context is surfaced in the brief where a run exists", () => {
  assert.ok(journey.includes("briefing.healthMap"));
  assert.ok(journey.includes("Business health context"));
});

// --- 5/6. Meeting Studio reachability + consent --------------------------------------------------
check("5. Meeting Studio (create/open a meeting, attendees, notes, transcript import) is reachable from the brief", () => {
  assert.ok(journey.includes("Meeting Studio"));
  assert.ok(journey.includes("<CreateMeetingForm"));
});
check("6. Consent state is visible and never implies a live recorder", () => {
  assert.ok(studioActions.includes("<ConsentButtons") || studioActions.includes("export function ConsentButtons"));
  assert.ok(studioActions.includes("Live meeting recording is not currently available"));
});

// --- 7/8. Notes explicit save / no auto-promotion --------------------------------------------------
check("7. Meeting notes remain an explicit, deliberate save action", () => {
  const fn = studioActions.match(/export function NoteForm[\s\S]*?\n}\n/)?.[0] ?? "";
  assert.ok(fn.includes('type="submit"'));
  assert.ok(!/onChange=\{[^}]*submit\(/.test(fn), "must never submit on keystroke");
});
check("8. Meeting notes never auto-promote to canonical Living Book truth", () => {
  assert.ok(studioActions.includes("Meeting notes remain meeting notes"));
  const noteCard = studioActions.match(/function NoteCard[\s\S]*?\n}\n/)?.[0] ?? "";
  assert.ok(!/useEffect\([^)]*submitPromotion/.test(noteCard), "must never auto-promote via an effect");
  assert.ok(noteCard.includes("onClick={() => setShowForm(true)}"), "promotion requires an explicit click to even open the form");
});

// --- 9/10. Post-meeting review transition + category distinction ------------------------------------
check("9. A real, reachable post-meeting Review action is visible once a meeting completes", () => {
  assert.ok(journey.includes('id="meeting-review"'));
  assert.ok(journey.includes('href="#meeting-review"'));
  assert.ok(journey.includes('meeting.status === "completed"'));
});
check("10. Meeting Review visually distinguishes Fact / Evidence / Unknown / Contradiction / Meeting note", () => {
  const idx = journey.indexOf("3. Meeting Review");
  const block = journey.slice(idx, idx + 2000);
  assert.ok(block.includes("Fact<") || block.includes("Hecho / Fact<"));
  assert.ok(block.includes("Unknown<") || block.includes("Incógnita / Unknown<"));
  assert.ok(block.includes("Contradiction<") || block.includes("Contradicción / Contradiction<"));
  assert.ok(block.includes("Meeting note<") || block.includes("Nota de reunión / Meeting note<"));
});

// --- 11/12/13/14. Candidate facts / promotion / unknowns / contradictions -----------------------------
check("11. Candidate fact promotion is explicit — a human must click Promote, then confirm", () => {
  assert.ok(studioActions.includes("Promote to Living Book"));
  assert.ok(studioActions.includes("Confirm promotion"));
});
check("12. Promoted facts use the one canonical Living Book path (upsertFact), not a second fact store", () => {
  assert.ok(meetingRepository.includes("upsertFact") && meetingRepository.includes("from \"@/app/lib/business/livingBook/repository\""));
});
check("13. Unknown handling uses the existing Living Book unknown path", () => {
  assert.ok(meetingRepository.includes("createUnknown"));
  assert.ok(studioActions.includes("This note will become an open unknown in the Living Book"));
});
check("14. Contradiction handling is truthful — both claims are required, nothing is inferred", () => {
  assert.ok(meetingRepository.includes("createContradiction"));
  assert.ok(studioActions.includes("Enter both sides of the contradiction explicitly"));
});

// --- 15/16/17. Commitment bridge -----------------------------------------------------------------------
check("15. Commitment creation from a reviewed meeting is explicit and human-triggered", () => {
  assert.ok(studioActions.includes('surface === "review" && canCreateCommitment'));
  assert.ok(studioActions.includes("Record a commitment from this meeting"));
  assert.ok(studioActions.includes("does not happen automatically"));
});
check("16. Meeting-sourced commitments use the one canonical Promise Keeper path (business_commitments via meetingId), not a new table", () => {
  assert.ok(promiseActions.includes("meetingId") && promiseActions.includes('/api/admin/businesses/${businessId}/commitments'));
  assert.ok(commitmentsRoute.includes("meetingId: body.meetingId"));
});
check("17. Assignee/business scoping and the canonical staff-write actor guard are preserved on the commitment write path", () => {
  assert.ok(commitmentsRoute.includes("toStaffWriteActor"));
  assert.ok(commitmentsRoute.includes('actorHasCapability(access.actor, "manage_own_commitments")'));
});

// --- 18/19/20. Creative requirements bridge ----------------------------------------------------------
check("18. A creative-requirement bridge from the meeting journey exists as an explicit, human-clicked link", () => {
  assert.ok(journey.includes('href="#creative"'));
  assert.ok(journey.includes("Meetings do not auto-create") && journey.includes("creative jobs"));
});
check("19. No automatic creative generation was wired into the meeting journey", () => {
  assert.ok(!/\/generate(?!DraftButton)/.test(journey));
  assert.ok(!journey.includes("GenerateDraftButton"));
});
check("20. No image generation was triggered from the meeting journey", () => {
  assert.ok(!/generate-image|generateImage/i.test(journey + studioActions));
});

// --- 21/22. Opportunity review ------------------------------------------------------------------------
check("21. Opportunity review from the meeting journey remains a human-controlled navigation link, not an action", () => {
  assert.ok(journey.includes('href="#opportunity"'));
  assert.ok(journey.includes("meetings do not auto-create") || journey.includes("Navigation only"));
});
check("22. No automatic sponsorship confirmation is implied anywhere in the opportunity bridge", () => {
  const oppIdx = page.indexOf('id="opportunity"');
  const block = page.slice(oppIdx, oppIdx + 800);
  assert.ok(block.includes("never confirms sponsorship"));
});

// --- 23/24/25. Recommendation transition + six tests + blocked reason -------------------------------
check("23. Recommendations render after Meetings in the canonical page order", () => {
  const meetingsIdx = page.indexOf('id="meetings"');
  const recommendIdx = page.indexOf("<RecommendJourney");
  assert.ok(meetingsIdx >= 0 && recommendIdx >= 0 && meetingsIdx < recommendIdx);
});
check("24. All six stewardship tests remain present and unreduced (need, readiness, capacity, life_alignment, value, lion_code)", () => {
  for (const key of ["need", "readiness", "capacity", "life_alignment", "value", "lion_code"]) {
    assert.ok(recommendJourney.includes(`${key}:`), `missing six-test key: ${key}`);
  }
});
check("25. A blocked/absent recommendation shows a truthful reason, not a blank panel", () => {
  assert.ok(recommendJourney.includes("Leonix is still learning enough to recommend responsibly."));
  assert.ok(recommendJourney.includes("No six-test results are stored for this recommendation."));
});

// --- 26/27/28. No duplicate systems --------------------------------------------------------------------
check("26. No duplicate fact store was created — commitment/meeting review changes touch no new tables", () => {
  assert.ok(!/CREATE TABLE/i.test(journey + studioActions + promiseActions));
});
check("27. No duplicate reminders/commitments system — the meeting-sourced form still posts to the one canonical commitments route", () => {
  const formFn = promiseActions.slice(
    promiseActions.indexOf("export function CreateCommitmentForm"),
    promiseActions.indexOf("export function CommitmentActions"),
  );
  assert.ok((formFn.match(/fetch\(/g) ?? []).length === 1, "must call exactly one endpoint");
});
check("28. No new meeting recorder was introduced", () => {
  assert.ok(!/MediaRecorder|getUserMedia|whisper|assemblyai|deepgram/i.test(journey + studioActions));
  assert.ok(studioActions.includes("Live meeting recording is not currently available"));
});

// --- 29/30. Authorization + private data --------------------------------------------------------------
check("29. Authorization capability checks are preserved (view_meeting_studio, review_meeting_notes, manage commitments)", () => {
  assert.ok(meetingRoute.includes('actorHasCapability(access.actor, "view_meeting_studio")'));
  assert.ok(page.includes('actorHasCapability(access.actor, "review_meeting_notes")'));
  assert.ok(page.includes("canManageCommitments"));
});
check("30. Private meeting-note promotion UI stays gated behind canReviewNotes; the commitment bridge stays gated behind canCreateCommitment", () => {
  assert.ok(studioActions.includes("isEligible && !showForm && canReviewNotes"));
  assert.ok(studioActions.includes("canCreateCommitment = false"));
});

console.log(`\n${passed} check(s) passed.`);
if (process.exitCode) {
  console.error("\nSome checks FAILED.");
} else {
  console.log("\nAll checks passed.");
}
