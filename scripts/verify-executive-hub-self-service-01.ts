/**
 * Focused, source-level security proof for Executive Hub staff self-service (Master Operating
 * Book V2 §0G). Same hand-rolled node:assert convention as every other verify-*.ts script in
 * this repo (e.g. verify-admin-roster-foundation-01.ts) — structural/source-level proof only,
 * this sandbox has no live database to run an actual multi-user attack scenario against.
 * Run from repo root: npx tsx scripts/verify-executive-hub-self-service-01.ts
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

function read(relPath: string): string {
  return readFileSync(path.resolve(__dirname, "..", relPath), "utf8");
}

console.log("Executive Hub Staff Self-Service (Master Operating Book V2 §0G) — focused tests\n");

const selfServiceAction = read("app/admin/executiveHubSelfServiceActions.ts");
const ownerActions = read("app/admin/executiveHubActions.ts");
const rosterAudit = read("app/admin/_lib/adminRosterAudit.ts");
const adminSession = read("app/lib/supabase/adminSession.ts");
const loginAuthRoute = read("app/admin/login/auth/route.ts");
const loginSubmitRoute = read("app/admin/login/submit/route.ts");
const executivesDb = read("app/lib/digitalContact/digitalContactExecutivesDb.ts");
const migrationPath = "supabase/migrations/20260911030000_executives_linked_roster_id.sql";
const migrationText = read(migrationPath);
const formComponent = read("app/admin/_components/executiveHub/ExecutiveHubForm.tsx");

// --- 1 & 2: Staff A cannot edit Staff B's profile; caller cannot select another executive by ID ---
check("self-service action never reads a client-supplied slug/id/executiveId to select the target row", () => {
  const codeOnly = selfServiceAction.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  assert.ok(!/formData\.get\(\s*["'](slug|id|executiveId|targetId|profileId)["']\s*\)/.test(codeOnly));
  assert.ok(!/str\(\s*formData\s*,\s*["'](slug|id|executiveId|targetId|profileId)["']\s*\)/.test(codeOnly));
});
check("self-service action resolves its ONLY write target via getExecutiveHubRecordByRosterId(actor.rosterId) — a value the caller cannot set", () => {
  assert.ok(selfServiceAction.includes("getExecutiveHubRecordByRosterId(actor.rosterId)"));
  assert.ok(selfServiceAction.includes("updateExecutiveHubRecord(profile.slug, patch)"));
});
check("dbGetExecutiveHubRecordByRosterId filters by linked_roster_id, a real FK column, not by any client-suppliable value", () => {
  assert.ok(executivesDb.includes('.eq("linked_roster_id", rosterId)'));
});
check("linked_roster_id can only be written by the owner-only action file, never by the self-service action", () => {
  assert.ok(ownerActions.includes("linkedRosterId"), "owner action must read linkedRosterId from its own form");
  // Strip comments first — this file's own doc comment names "linkedRosterId" as an example of
  // what must never be read, which would otherwise false-positive this check.
  const codeOnly = selfServiceAction.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  assert.ok(!/linkedRosterId/i.test(codeOnly), "self-service action must never read or write linkedRosterId in real code");
});

// --- 3: Caller cannot change owner-only security/governance fields ---
check("self-service action never reads status/slug/company/legalEntity/address/website/businessHubLink/connectionHubLink/workingHoursJson/notes/metaDescription/trustChips/languages from FormData", () => {
  const forbidden = [
    "status", "slug", "company", "legalEntity", "addressLine1", "addressLine2", "city", "state",
    "postalCode", "website", "businessHubLink", "connectionHubLink", "workingHoursJson", "notes",
    "metaDescription", "trustChips", "languages", "logoPath", "coverPath",
  ];
  for (const field of forbidden) {
    assert.ok(
      !new RegExp(`str\\(\\s*formData\\s*,\\s*["']${field}["']\\s*\\)`).test(selfServiceAction),
      `self-service action must never read forbidden field: ${field}`,
    );
  }
});
check("self-service action's readSelfServiceFields() only returns the explicit allow-listed safe fields", () => {
  const allowed = ["preferredName", "title", "bio", "phoneDisplay", "phoneDigits", "whatsappDigits", "email", "photoPath", "socials", "theme"];
  const fnMatch = selfServiceAction.match(/function readSelfServiceFields[\s\S]*?\n}/);
  assert.ok(fnMatch, "readSelfServiceFields function must exist");
  const fnBody = fnMatch![0];
  for (const field of allowed) {
    assert.ok(fnBody.includes(field), `allow-listed field missing from readSelfServiceFields: ${field}`);
  }
});
check("owner-only actions file remains gated by assertExecutiveHubAdmin() for create/update/status, unchanged by this gate", () => {
  assert.ok(ownerActions.includes("async function assertExecutiveHubAdmin"));
  const createFn = ownerActions.match(/export async function createExecutiveHubAction[\s\S]*?\n}/)![0];
  const updateFn = ownerActions.match(/export async function updateExecutiveHubAction[\s\S]*?\n}/)![0];
  const statusFn = ownerActions.match(/export async function setExecutiveHubStatusAction[\s\S]*?\n}/)![0];
  for (const fn of [createFn, updateFn, statusFn]) {
    assert.ok(fn.includes("assertExecutiveHubAdmin()"));
  }
});

// --- 4: Inactive/non-roster staff cannot self-edit ---
check("resolveActingRosterIdentity() checks is_active and returns null for an inactive or non-existent roster row", () => {
  const fnMatch = rosterAudit.match(/export async function resolveActingRosterIdentity[\s\S]*?\n}/);
  assert.ok(fnMatch, "resolveActingRosterIdentity must exist");
  const body = fnMatch![0];
  assert.ok(/if \(error \|\| !data \|\| !\(data as \{ is_active: boolean \}\)\.is_active\) return null;/.test(body));
});
check("self-service action treats an unresolvable identity (inactive staff included) as a hard stop, not a fallback", () => {
  assert.ok(selfServiceAction.includes("if (!actor)"));
  assert.ok(/redirect\(.*identity_not_resolvable/.test(selfServiceAction));
});

// --- 5: Owner management still works ---
check("owner Executive Hub editor (mode=edit/create) still renders every owner-only section (Company, Business Hub, Availability, Publishing)", () => {
  for (const sectionId of ["exec-company", "exec-business-hub", "exec-availability", "exec-publishing"]) {
    assert.ok(formComponent.includes(`id="${sectionId}"`), `owner section must still exist: ${sectionId}`);
  }
});
check("owner editor still submits status/slug via hidden fields when not in self mode", () => {
  assert.ok(formComponent.includes('<input type="hidden" name="status"'));
  assert.ok(formComponent.includes('mode === "edit" ? <input type="hidden" name="slug"'));
});

// --- 6: Public contact page still reads the same canonical profile ---
check("dbGetPublishedExecutiveProfile still reads from the same executives table via the same row mapper, with a pre-migration fallback that never breaks the public page", () => {
  const fnMatch = executivesDb.match(/export async function dbGetPublishedExecutiveProfile[\s\S]*?\n}/);
  assert.ok(fnMatch);
  const body = fnMatch![0];
  assert.ok(body.includes('.eq("status", "published")'));
  assert.ok(body.includes("rowToDigitalContactProfile"));
  assert.ok(body.includes("isMissingLinkedRosterIdColumn"), "must gracefully fall back before the migration is applied");
});
check("rowToDigitalContactProfile (the public shape) does not expose linked_roster_id", () => {
  const fnMatch = executivesDb.match(/export function rowToDigitalContactProfile[\s\S]*?\n}/);
  assert.ok(fnMatch);
  assert.ok(!/linked_roster_id|linkedRosterId/.test(fnMatch![0]));
});

// --- 7: Bootstrap is not accidentally broadened into a fake staff identity ---
check("resolveActingRosterIdentity() resolves identity ONLY from session cookies (getAdminOperatorEmailFromCookies/getAdminAuthUserIdFromCookies), never from the ADMIN_OPERATOR_EMAIL env fallback", () => {
  const fnMatch = rosterAudit.match(/export async function resolveActingRosterIdentity[\s\S]*?\n}/)![0];
  assert.ok(fnMatch.includes("getAdminOperatorEmailFromCookies"));
  assert.ok(fnMatch.includes("getAdminAuthUserIdFromCookies"));
  assert.ok(!/process\.env\.ADMIN_OPERATOR_EMAIL/.test(fnMatch), "must not fall back to the env var — that would let bootstrap masquerade as a real staff identity");
});
check("bootstrap login (/admin/login/submit) never sets the operator-email or auth-user-id session cookies", () => {
  assert.ok(loginSubmitRoute.includes("bootstrap: true"));
  assert.ok(!/operatorEmail\s*:/.test(loginSubmitRoute), "bootstrap route must not set operatorEmail");
  assert.ok(!/authUserId\s*:/.test(loginSubmitRoute), "bootstrap route must not set authUserId");
});
check("real Staff/Team login (/admin/login/auth) sets both cookies with bootstrap: false", () => {
  assert.ok(loginAuthRoute.includes("bootstrap: false"));
  assert.ok(loginAuthRoute.includes("operatorEmail: verified.email"));
  assert.ok(loginAuthRoute.includes("authUserId: verified.userId"));
});
check("getAdminOperatorEmailFromCookies/getAdminAuthUserIdFromCookies read only their own named cookies, no env fallback inside them", () => {
  const emailFn = adminSession.match(/export function getAdminOperatorEmailFromCookies[\s\S]*?\n}/)![0];
  const idFn = adminSession.match(/export function getAdminAuthUserIdFromCookies[\s\S]*?\n}/)![0];
  assert.ok(!/process\.env/.test(emailFn));
  assert.ok(!/process\.env/.test(idFn));
});

// --- Migration: additive, non-destructive, correctly typed ---
check("migration is purely additive: only ADD COLUMN IF NOT EXISTS / COMMENT / CREATE INDEX IF NOT EXISTS, no destructive statement", () => {
  assert.ok(/ADD COLUMN IF NOT EXISTS linked_roster_id/.test(migrationText));
  assert.ok(!/DROP |ALTER COLUMN|TRUNCATE|DELETE FROM/i.test(migrationText));
});
check("linked_roster_id is nullable, FK to admin_team_members(id), ON DELETE SET NULL (never CASCADE)", () => {
  assert.ok(/linked_roster_id uuid NULL\s*\n?\s*REFERENCES public\.admin_team_members\(id\) ON DELETE SET NULL/.test(migrationText));
});
check("unique index prevents the same roster member being linked to two executive profiles, without blocking multiple NULLs", () => {
  assert.ok(/CREATE UNIQUE INDEX IF NOT EXISTS executives_linked_roster_id_uidx/.test(migrationText));
  assert.ok(/WHERE linked_roster_id IS NOT NULL/.test(migrationText));
});

console.log(`\n${passed} check(s) passed.`);
if (process.exitCode) {
  console.error("\nSome checks FAILED.");
} else {
  console.log("\nAll checks passed.");
}
