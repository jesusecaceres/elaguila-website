/**
 * Real Owner Login / Session Repair — structural verifier for this gate's changes:
 * (1) resolveSalesWorkspaceAccess() now checks for a real staff session BEFORE consulting
 *     isAdminBootstrapSession(), making "staff wins over bootstrap when both are present" a
 *     structural guarantee rather than only an invariant the login routes happen to maintain
 *     (the actual behavior is exercised by scripts/test-staff-bootstrap-session-precedence.ts —
 *     this file checks the source shape, not the runtime behavior, which is covered separately);
 * (2) the admin login page's copy makes Staff/Team login the clearly primary, discoverable path
 *     and explains — in plain language, no raw internal error codes — that legacy bootstrap
 *     cannot perform Business Concierge writes;
 * (3) the Canvas/Add Prospect route is re-confirmed to use the same canonical resolver (no
 *     bypass was introduced to "fix" the reported symptom).
 *
 * Run from repo root: npx tsx scripts/verify-staff-session-precedence-and-login-ux-01.ts
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

console.log("Staff Session Precedence + Login UX — targeted checks\n");

function read(relPath: string): string {
  return readFileSync(path.resolve(__dirname, "..", relPath), "utf8");
}

const accessLib = read("app/admin/_lib/businessWorkspaceAccess.ts");
const loginPage = read("app/admin/login/page.tsx");
const canvassRoute = read("app/api/admin/businesses/canvass/route.ts");

// --- 1. Precedence structure -------------------------------------------------------------------
check("1a. requireSalesWorkspaceAccess() delegates to a jar-accepting resolveSalesWorkspaceAccess()", () => {
  const idx = accessLib.indexOf("export async function requireSalesWorkspaceAccess");
  const block = accessLib.slice(idx, idx + 300);
  assert.ok(/return resolveSalesWorkspaceAccess\(jar\)/.test(block));
});
check("1b. Staff-identity cookies are checked and resolved BEFORE isAdminBootstrapSession() in source order", () => {
  const idx = accessLib.indexOf("export async function resolveSalesWorkspaceAccess");
  const block = accessLib.slice(idx, idx + 1400);
  const staffCheckIdx = block.indexOf("if (operatorEmail && authUserId)");
  const bootstrapCheckIdx = block.indexOf("if (isAdminBootstrapSession(jar))");
  assert.ok(staffCheckIdx !== -1 && bootstrapCheckIdx !== -1);
  assert.ok(staffCheckIdx < bootstrapCheckIdx, "staff-identity check must appear before the bootstrap check so it is evaluated first");
});
check("1c. A staff-identity match resolves via resolveStaffSession() and returns before bootstrap is ever consulted", () => {
  const idx = accessLib.indexOf("if (operatorEmail && authUserId)");
  const block = accessLib.slice(idx, idx + 120);
  assert.ok(/return resolveStaffSession\(operatorEmail, authUserId\);/.test(block));
});
check("1d. toStaffWriteActor's bootstrap denial and identity-incomplete denial are still both present (unchanged, not weakened)", () => {
  assert.ok(accessLib.includes('reason: "bootstrap_write_denied"'));
  assert.ok(accessLib.includes('reason: "staff_identity_incomplete"'));
});

// --- 2. Login UX -----------------------------------------------------------------------------
check("2a. Staff / Team login is presented as the primary, full-access path", () => {
  assert.ok(/Staff \/ Team login/.test(loginPage));
  assert.ok(/full authorized\s*\n?\s*operational access/.test(loginPage) || /full authorized/i.test(loginPage));
});
check("2b. Legacy bootstrap is clearly labeled as limited/emergency access, not the primary option", () => {
  assert.ok(/Legacy owner bootstrap/.test(loginPage));
  assert.ok(/[Ee]mergency/.test(loginPage));
});
check("2c. Legacy bootstrap copy explains the write limitation in plain language, no raw internal error codes exposed", () => {
  const idx = loginPage.indexOf("Legacy owner bootstrap");
  const block = loginPage.slice(idx, idx + 600);
  assert.ok(/Business Concierge/.test(block));
  assert.ok(!/bootstrap_write_denied/.test(block));
  assert.ok(!/ADMIN_OPERATOR_EMAIL/.test(block), "internal env var name should no longer be exposed in the login page copy");
});
check("2d. Legacy bootstrap copy points the user back to Staff/Team login when they have a team account", () => {
  const idx = loginPage.indexOf("Legacy owner bootstrap");
  const block = loginPage.slice(idx, idx + 600);
  assert.ok(/Staff \/ Team login/.test(block));
});

// --- 3. Canvas reproduction — still the canonical resolver, no bypass --------------------------
check("3a. Canvas/Add Prospect still uses requireStaffWorkspaceWriteAccess (no bypass introduced)", () => {
  assert.ok(canvassRoute.includes('requireStaffWorkspaceWriteAccess("conduct_canvassing")'));
});
check("3b. No new ad-hoc actor-construction or bootstrap special-case was added to the canvass route", () => {
  assert.ok(!/owner_bootstrap/i.test(canvassRoute));
  assert.ok(!/actorType:\s*"staff"/.test(canvassRoute), "canvass route must obtain its actor only from the resolver, never construct one inline");
});

console.log(`\n${passed} check(s) passed.`);
