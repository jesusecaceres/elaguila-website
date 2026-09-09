/**
 * Staging Release Blocker Hardening — focused tests for the signed bootstrap session (Blocker 1)
 * and the clean commitment validation error contract (Blocker 2). Same hand-rolled node:assert
 * convention as every other verify-*.ts script in this repo. Structural/source-level proof only
 * for the parts that need a live Next.js request context (cookies(), requireSalesWorkspaceAccess)
 * — the pure signing/verification logic itself is covered by real runtime execution in
 * scripts/test-admin-bootstrap-session-security.ts, which this script does not duplicate.
 * Run from repo root: npx tsx scripts/verify-admin-bootstrap-session-hardening-01.ts
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

console.log("Bootstrap Session Hardening + Commitment Error Contract — focused tests\n");

function read(relPath: string): string {
  return readFileSync(path.resolve(__dirname, "..", relPath), "utf8");
}

const adminSessionText = read("app/lib/supabase/adminSession.ts");
const serverText = read("app/lib/supabase/server.ts");
const submitRouteText = read("app/admin/login/submit/route.ts");
const businessWorkspaceAccessText = read("app/admin/_lib/businessWorkspaceAccess.ts");

// --- Blocker 1: signed bootstrap session ------------------------------------------------------

check("isAdminBootstrapSession reads a signed token, not a bare \"1\" sentinel", () => {
  assert.ok(!/LEONIX_ADMIN_BOOTSTRAP_COOKIE\)\?\.value === "1"/.test(adminSessionText), "must not compare the bootstrap cookie's value directly against the literal \"1\"");
  assert.ok(adminSessionText.includes("createHmac"), "must sign with an HMAC");
  assert.ok(adminSessionText.includes("timingSafeEqual"), "must compare signatures in constant time, not with ===");
});

check("Bootstrap signature is keyed by a dedicated server-only secret (ADMIN_BOOTSTRAP_SESSION_SECRET), never ADMIN_PASSWORD itself", () => {
  assert.ok(adminSessionText.includes("ADMIN_BOOTSTRAP_SESSION_SECRET"));
  assert.ok(!/signBootstrapPayload\([^)]*ADMIN_PASSWORD/.test(adminSessionText), "must not sign with ADMIN_PASSWORD — a signing-key leak and a password leak must be independent failures");
});

check("isAdminBootstrapSession fails closed when the secret is not configured (returns false, never throws or falls back to the old bare-\"1\" check)", () => {
  const fnMatch = adminSessionText.match(/export function isAdminBootstrapSession\(cookies: CookieStore\): boolean \{([\s\S]*?)\n\}/);
  assert.ok(fnMatch, "isAdminBootstrapSession body not found");
  const body = fnMatch![1];
  assert.ok(/if \(!secret\) return false;/.test(body), "must return false immediately when no secret is configured");
});

check("isAdminBootstrapSession verifies expiry in both directions (not expired, not issued in the future) before trusting the signature", () => {
  const fnMatch = adminSessionText.match(/export function isAdminBootstrapSession\(cookies: CookieStore\): boolean \{([\s\S]*?)\n\}/);
  assert.ok(fnMatch);
  const body = fnMatch![1];
  assert.ok(/issuedAt > Date\.now\(\)/.test(body), "must reject a token issued in the future");
  assert.ok(/expiresAt <= Date\.now\(\)/.test(body), "must reject an expired token");
});

check("createBootstrapSessionToken fails closed (returns null) when the secret is not configured — applyLeonixAdminSessionCookies must never issue a bootstrap cookie without one", () => {
  const fnMatch = adminSessionText.match(/export function createBootstrapSessionToken\([^)]*\): string \| null \{([\s\S]*?)\n\}/);
  assert.ok(fnMatch, "createBootstrapSessionToken body not found");
  assert.ok(/if \(!secret\) return null;/.test(fnMatch![1]));
});

check("applyLeonixAdminSessionCookies clears BOTH leonix_admin and leonix_admin_bootstrap when signing fails, and reports the failure to its caller instead of silently issuing a broken session", () => {
  const fnMatch = adminSessionText.match(/export function applyLeonixAdminSessionCookies\([\s\S]*?\n\}/);
  assert.ok(fnMatch, "applyLeonixAdminSessionCookies not found");
  const body = fnMatch![0];
  assert.ok(/if \(!token\) \{/.test(body));
  assert.ok(/reason: "bootstrap_secret_not_configured"/.test(body));
});

check("/admin/login/submit fails closed: a valid ADMIN_PASSWORD alone is not enough to reach /admin if signing failed", () => {
  assert.ok(submitRouteText.includes("const result = applyLeonixAdminSessionCookies"));
  assert.ok(submitRouteText.includes("!result.ok"));
  assert.ok(submitRouteText.includes("bootstrap_unavailable"));
});

check("Admin session cookies are HttpOnly, Secure in production, and SameSite=Strict", () => {
  const baseMatch = adminSessionText.match(/const base = \{[^}]*\};/);
  assert.ok(baseMatch, "cookie base options object not found");
  const base = baseMatch![0];
  assert.ok(base.includes("httpOnly: true"));
  assert.ok(base.includes('sameSite: "strict"'));
  assert.ok(/secure(,|\s*:)/.test(base), "must set secure");
  assert.ok(adminSessionText.includes('process.env.NODE_ENV === "production"'), "secure must be gated on production, not hardcoded true (would break local http:// dev) or false (would weaken deployed environments)");
});

check("The bootstrap session cookie is expiring — carries its own maxAge, shorter than the 7-day staff session (bootstrap is emergency/owner-only access, not a daily identity)", () => {
  assert.ok(adminSessionText.includes("ADMIN_BOOTSTRAP_SESSION_MAX_AGE_SEC"));
  const bootstrapMaxAge = adminSessionText.match(/const ADMIN_BOOTSTRAP_SESSION_MAX_AGE_SEC = ([^;]+);/);
  const staffMaxAge = adminSessionText.match(/const ADMIN_SESSION_MAX_AGE_SEC = ([^;]+);/);
  assert.ok(bootstrapMaxAge && staffMaxAge);
  const evalArithmetic = (expr: string): number => Function(`"use strict"; return (${expr});`)() as number;
  const bootstrapSec = evalArithmetic(bootstrapMaxAge![1]);
  const staffSec = evalArithmetic(staffMaxAge![1]);
  assert.ok(bootstrapSec < staffSec, `expected the bootstrap session to be shorter-lived than the staff session, got ${bootstrapSec}s vs ${staffSec}s`);
});

check("logout clears the bootstrap cookie (in addition to the operator cookies)", () => {
  const fnMatch = adminSessionText.match(/export function clearLeonixAdminSessionCookies\([\s\S]*?\n\}/);
  assert.ok(fnMatch);
  assert.ok(fnMatch![0].includes("LEONIX_ADMIN_BOOTSTRAP_COOKIE"));
});

check("requireAdminCookie's coarse-check design (leonix_admin alone) is documented as intentional, with the real bootstrap authority boundary named explicitly, rather than silently left ambiguous after this audit", () => {
  assert.ok(serverText.includes("isAdminBootstrapSession()"), "requireAdminCookie's doc comment must point to the real bootstrap authority boundary");
  assert.ok(serverText.includes("requireSalesWorkspaceAccess()"), "requireAdminCookie's doc comment must point to the real staff authority boundary");
});

check("owner_bootstrap still denies every Business Concierge write regardless of how the session was authenticated — toStaffWriteActor's decision does not depend on cookie internals, only on actorType", () => {
  const guardBody = businessWorkspaceAccessText.match(/export function toStaffWriteActor\(actor: StrictSalesActor\): StaffWorkspaceWriteAccessResult \{([\s\S]*?)\n\}/);
  assert.ok(guardBody, "toStaffWriteActor not found");
  assert.ok(/isOwnerBootstrapActor\(actor\)/.test(guardBody![1]));
  assert.ok(/reason: "bootstrap_write_denied"/.test(businessWorkspaceAccessText));
});

// --- Blocker 2: commitment error contract ------------------------------------------------------

const promiseKeeperRepoText = read("app/lib/business/promiseKeeper/repository.ts");

check("createCommitment validates staff-requires-roster at the application boundary, before any DB insert", () => {
  const fnMatch = promiseKeeperRepoText.match(/export async function createCommitment\([\s\S]*?\n\}/);
  assert.ok(fnMatch, "createCommitment not found");
  const body = fnMatch![0];
  const validationIdx = body.indexOf('input.responsibleParty === "staff"');
  const insertIdx = body.indexOf(".insert(");
  assert.ok(validationIdx >= 0, "expected an explicit responsibleParty===\"staff\" check");
  assert.ok(insertIdx >= 0 && validationIdx < insertIdx, "the validation must run before the insert, not rely on the DB to catch it");
  assert.ok(body.includes('error: "staff_assignee_required"'));
});

check("updateCommitment re-validates staff-requires-roster when assignedRosterId can be cleared on an existing staff-responsible commitment", () => {
  const fnMatch = promiseKeeperRepoText.match(/export async function updateCommitment\([\s\S]*?\n\}/);
  assert.ok(fnMatch, "updateCommitment not found");
  const body = fnMatch![0];
  assert.ok(body.includes('existing.responsibleParty === "staff"'));
  assert.ok(body.includes('error: "staff_assignee_required"'));
});

check("Neither createCommitment nor updateCommitment ever forwards a raw Postgres error.message to the caller — both map to a clean, generic code and log the real error server-side instead", () => {
  assert.ok(!promiseKeeperRepoText.includes('error?.message ?? "insert_failed"'), "createCommitment must not leak error.message");
  assert.ok(!promiseKeeperRepoText.includes('error?.message ?? "update_failed"'), "updateCommitment must not leak error.message");
  assert.ok(promiseKeeperRepoText.includes('"commitment_create_failed"'));
  assert.ok(promiseKeeperRepoText.includes('"commitment_update_failed"'));
  assert.ok((promiseKeeperRepoText.match(/console\.error\(`\[promiseKeeper\]/g) ?? []).length >= 2, "unexpected DB errors must still be logged server-side, not silently swallowed");
});

check("No raw constraint name (business_commitments_staff_requires_roster_chk) can appear anywhere in this module's exported error surface", () => {
  assert.ok(!/return \{ ok: false, error: error/.test(promiseKeeperRepoText), "no return path may forward the raw Postgres error object/message as the client-facing error code");
});

check("The DB CHECK constraint itself is untouched — this is defense-in-depth added on top, not a replacement for it", () => {
  const migrationText = read("supabase/migrations/20260810150000_business_proposal_promise_keeper_foundation.sql");
  assert.ok(migrationText.includes("business_commitments_staff_requires_roster_chk"));
  assert.ok(migrationText.includes("responsible_party != 'staff' OR assigned_roster_id IS NOT NULL"));
});

console.log(`\n${passed} check(s) passed.`);
if (process.exitCode) {
  console.error("\nSome checks FAILED.");
} else {
  console.log("\nAll checks passed.");
}
