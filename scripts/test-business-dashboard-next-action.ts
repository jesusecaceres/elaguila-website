/**
 * Gate 2 (Business Dashboard Cockpit) — real runtime unit tests for
 * computeBusinessDashboardNextAction (pure, no I/O, no "server-only" marker anywhere in the
 * import chain — imported and executed directly).
 * Run from repo root: npx tsx scripts/test-business-dashboard-next-action.ts
 */
import { strict as assert } from "node:assert";
import { computeBusinessDashboardNextAction, type NextActionInput } from "../app/admin/(dashboard)/businesses/[businessId]/businessDashboardNextAction";

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

console.log("Gate 2 — Business Dashboard next-right-action precedence — real runtime tests\n");

const NOW = new Date("2026-09-10T12:00:00Z").getTime();

function baseInput(overrides: Partial<NextActionInput> = {}): NextActionInput {
  return {
    followUpStatus: null,
    followUpDate: null,
    commitments: [],
    meetings: [],
    missingCriticalContact: false,
    recommendationStatus: null,
    opportunities: [],
    creativeJobs: [],
    proposals: [],
    fallbackHeadlineEn: "fallback headline",
    fallbackEvidenceEn: "fallback evidence",
    ...overrides,
  };
}

check("Overdue follow-up outranks everything else", () => {
  const result = computeBusinessDashboardNextAction(
    baseInput({
      followUpStatus: "overdue",
      followUpDate: "2026-09-01",
      commitments: [{ status: "blocked", dueAt: null, titleEn: "x" }],
    }),
    NOW,
  );
  assert.equal(result.whereHref, "#outreach");
  assert.match(result.what, /overdue/i);
});

check("Due-today follow-up outranks commitments/meetings but not overdue follow-up", () => {
  const result = computeBusinessDashboardNextAction(baseInput({ followUpStatus: "due_today", followUpDate: "2026-09-10" }), NOW);
  assert.equal(result.whereHref, "#outreach");
});

check("Blocked commitment outranks overdue commitment and everything below it", () => {
  const result = computeBusinessDashboardNextAction(
    baseInput({
      commitments: [
        { status: "active", dueAt: "2026-09-01T00:00:00Z", titleEn: "overdue one" },
        { status: "blocked", dueAt: null, titleEn: "blocked one" },
      ],
    }),
    NOW,
  );
  assert.equal(result.whereHref, "#promises");
  assert.match(result.what, /blocked one/);
});

check("Overdue commitment (active + past due date) is detected when nothing is blocked", () => {
  const result = computeBusinessDashboardNextAction(
    baseInput({ commitments: [{ status: "active", dueAt: "2026-09-01T00:00:00Z", titleEn: "late thing" }] }),
    NOW,
  );
  assert.equal(result.whereHref, "#promises");
  assert.match(result.what, /late thing/);
});
check("An active commitment due in the FUTURE is not treated as overdue", () => {
  const result = computeBusinessDashboardNextAction(
    baseInput({ commitments: [{ status: "active", dueAt: "2026-12-01T00:00:00Z", titleEn: "future thing" }] }),
    NOW,
  );
  assert.notEqual(result.whereHref, "#promises");
});

check("A meeting scheduled within 48h surfaces as 'prepare for meeting'", () => {
  const result = computeBusinessDashboardNextAction(
    baseInput({ meetings: [{ status: "planned", scheduledAt: "2026-09-11T12:00:00Z" }] }),
    NOW,
  );
  assert.equal(result.whereHref, "#meetings");
});
check("A meeting scheduled far in the future does NOT trigger the 'soon' signal", () => {
  const result = computeBusinessDashboardNextAction(
    baseInput({ meetings: [{ status: "planned", scheduledAt: "2026-12-01T12:00:00Z" }] }),
    NOW,
  );
  assert.notEqual(result.whereHref, "#meetings");
});
check("A completed meeting is never treated as upcoming", () => {
  const result = computeBusinessDashboardNextAction(
    baseInput({ meetings: [{ status: "completed", scheduledAt: "2026-09-11T12:00:00Z" }] }),
    NOW,
  );
  assert.notEqual(result.whereHref, "#meetings");
});

check("Missing critical contact surfaces when nothing more urgent exists", () => {
  const result = computeBusinessDashboardNextAction(baseInput({ missingCriticalContact: true }), NOW);
  assert.equal(result.whereHref, "#overview");
  assert.match(result.what, /contact/i);
});

check("Recommendation review_required surfaces above opportunity/creative/proposal", () => {
  const result = computeBusinessDashboardNextAction(
    baseInput({
      recommendationStatus: "review_required",
      opportunities: [{ lifecycleState: "suggested" }],
      creativeJobs: [{ status: "in_review" }],
    }),
    NOW,
  );
  assert.equal(result.whereHref, "#recommend");
});

check("Suggested opportunity surfaces above creative/proposal", () => {
  const result = computeBusinessDashboardNextAction(
    baseInput({ opportunities: [{ lifecycleState: "suggested" }], creativeJobs: [{ status: "in_review" }] }),
    NOW,
  );
  assert.equal(result.whereHref, "#opportunity");
});
check("A reviewed/approved opportunity does not trigger the review signal", () => {
  const result = computeBusinessDashboardNextAction(baseInput({ opportunities: [{ lifecycleState: "approved" }] }), NOW);
  assert.notEqual(result.whereHref, "#opportunity");
});

check("Creative job in_review or owner_review surfaces above proposal decision", () => {
  const result = computeBusinessDashboardNextAction(
    baseInput({ creativeJobs: [{ status: "owner_review" }], proposals: [{ isCurrent: true, status: "owner_review" }] }),
    NOW,
  );
  assert.equal(result.whereHref, "#creative");
});

check("Current proposal in owner_review surfaces as 'awaiting client decision'", () => {
  const result = computeBusinessDashboardNextAction(baseInput({ proposals: [{ isCurrent: true, status: "owner_review" }] }), NOW);
  assert.equal(result.whereHref, "#proposals");
  assert.match(result.what, /client/i);
});
check("Current accepted proposal surfaces as 'complete Owner Handoff' — never implies signed/paid/published", () => {
  const result = computeBusinessDashboardNextAction(baseInput({ proposals: [{ isCurrent: true, status: "accepted" }] }), NOW);
  assert.equal(result.whereHref, "#proposals");
  assert.match(result.what, /handoff/i);
  assert.ok(!/signed|paid|published/i.test(result.what), "must never claim signed/paid/published from acceptance alone");
});
check("A non-current (superseded/historical) proposal never drives the next action", () => {
  const result = computeBusinessDashboardNextAction(baseInput({ proposals: [{ isCurrent: false, status: "owner_review" }] }), NOW);
  assert.notEqual(result.whereHref, "#proposals");
});

check("With nothing urgent, falls back to the existing profile-completeness helper's own headline — never a fabricated action", () => {
  const result = computeBusinessDashboardNextAction(baseInput({ fallbackHeadlineEn: "Confirm the website", fallbackEvidenceEn: "no website on file" }), NOW);
  assert.equal(result.what, "Confirm the website");
  assert.equal(result.why, "no website on file");
});

console.log(`\n${passed} check(s) passed.`);
if (process.exitCode) {
  console.error("\nSome checks FAILED.");
} else {
  console.log("\nAll checks passed.");
}
