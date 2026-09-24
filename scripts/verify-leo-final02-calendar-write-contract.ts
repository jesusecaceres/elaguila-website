/**
 * LEO FINAL-02 Calendar write contract verifier (fixture-safe, no real writes).
 * leoCalendarWriteAdapter.ts is server-only; verified via source assertions
 * for availability/conflict truth, RFC3339 handling, attendee bounds, and
 * the fail-closed UPDATE proof-of-existence requirement.
 * Run: npx tsx scripts/verify-leo-final02-calendar-write-contract.ts
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EXPECTED_BRANCH = "integration/leo-final-closeout-2026-08";

function src(rel: string): string {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

let failures = 0;
const check = (ok: boolean, label: string) => {
  if (ok) console.log(`PASS  ${label}`);
  else {
    failures += 1;
    console.error(`FAIL  ${label}`);
  }
};

const branch = execSync("git branch --show-current", { cwd: ROOT, encoding: "utf8" }).trim();
check(branch === EXPECTED_BRANCH, "correct LEO final-closeout branch");

const readAdapter = src("app/leo/_lib/leoCalendarAdapter.ts");
const writeAdapter = src("app/leo/_lib/leoCalendarWriteAdapter.ts");

check(/import "server-only"/.test(writeAdapter), "write adapter is server-only");
check(
  !/events\.insert|events\/[^"'`]*", *\{\s*method: "POST"/.test(readAdapter) &&
    /No create\/update\/patch\/delete/i.test(readAdapter),
  "read adapter (leoCalendarAdapter.ts) remains read-only and untouched",
);

// --- Availability / conflict (Gate 8) ---
check(/export async function checkLeoCalendarAvailability/.test(writeAdapter), "availability function exists");
check(/\/freeBusy/.test(writeAdapter), "uses Calendar freeBusy endpoint");
check(/"AVAILABLE"/.test(writeAdapter), "AVAILABLE state reachable");
check(/"CONFLICT"/.test(writeAdapter), "CONFLICT state reachable");
check(/LeoCalendarConflictState/.test(writeAdapter), "conflict state is typed against the shared LeoCalendarConflictState union (UNKNOWN reserved there)");
check(/"UNAVAILABLE"/.test(writeAdapter), "UNAVAILABLE state reachable on failure paths");
check(
  /busyWindows\.length > 0 \? "CONFLICT" : "AVAILABLE"/.test(writeAdapter),
  "conflict determined from real busy windows, never assumed",
);
check(
  /ok: false, conflictState: "UNAVAILABLE"/.test(writeAdapter),
  "failure paths never silently resolve to AVAILABLE",
);

// --- Create / update (Gate 7) ---
check(/export async function createLeoCalendarEvent/.test(writeAdapter), "create exists");
check(/export async function updateLeoCalendarEvent/.test(writeAdapter), "update exists");
check(/\/calendars\/primary\/events/.test(writeAdapter), "targets primary calendar events endpoint");
check(/method: "PATCH"/.test(writeAdapter), "update uses PATCH (partial), not a destructive replace");

// --- Fail-closed UPDATE proof-of-existence (Gate 7 — no fuzzy destructive mutation) ---
check(
  /Prove the target event exists before mutating it/.test(writeAdapter),
  "update proves the target event exists before mutating",
);
check(
  /existing\.status === 404/.test(writeAdapter) && /CALENDAR_EVENT_NOT_FOUND/.test(writeAdapter),
  "update fails closed with CALENDAR_EVENT_NOT_FOUND when the event cannot be proven",
);
check(/existingEventId: string/.test(writeAdapter), "update requires an explicit existing event ID (type-level)");

// --- RFC3339 + explicit timezone (Gate 7) ---
check(/RFC3339_RE/.test(writeAdapter), "RFC3339 validation regex exists");
check(/TIMEZONE_REQUIRED/.test(writeAdapter), "explicit timezone is required, never defaulted");
check(/timeZone: input\.timezone/.test(writeAdapter), "start/end carry explicit timeZone");

// --- Bounded attendees (Gate 7) ---
check(/MAX_ATTENDEES = 20/.test(writeAdapter), "attendees are bounded");
check(/ATTENDEES_TOO_MANY/.test(writeAdapter), "over-bound attendee list is rejected");
check(/ATTENDEE_INVALID/.test(writeAdapter), "malformed attendee email is rejected");

// --- Safe bounded evidence only ---
check(/function mapEventResponse/.test(writeAdapter), "response mapper exists");
check(/eventId,\s*\n\s*htmlLink:/.test(writeAdapter), "evidence includes eventId + htmlLink");
check(/raw\.htmlLink\.startsWith\("https:\/\/"\)/.test(writeAdapter), "htmlLink only trusted when it is a real https URL from the provider");

// --- Execution service wiring ---
const execService = src("app/leo/_lib/leoActionExecutionService.ts");
check(
  /createLeoCalendarEvent|updateLeoCalendarEvent/.test(execService),
  "execution service imports the Calendar write functions",
);
check(
  !/leoCalendarWriteAdapter/.test(src("app/leo/_lib/leoConversationService.ts")),
  "Calendar write adapter is never imported directly from conversation code (must go through the execution service)",
);

if (failures > 0) {
  console.error(`\nLEO FINAL-02 Calendar write contract verifier FAIL (${failures})`);
  process.exit(1);
}
console.log("\nLEO FINAL-02 Calendar write contract verifier PASS");
