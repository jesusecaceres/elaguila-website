/**
 * Real-Owner-Login / Session repair — targeted runtime unit tests for the precedence guarantee
 * added to businessWorkspaceAccess.ts's resolveSalesWorkspaceAccess(): a real per-person staff
 * session must never lose to a legacy owner_bootstrap session when both cookie sets happen to be
 * present. Real, executable logic under test — not source-text scanning like the verify-*.ts
 * scripts.
 *
 * Same scratch-copy technique as scripts/test-admin-bootstrap-session-security.ts: both
 * app/admin/_lib/businessWorkspaceAccess.ts and app/lib/supabase/adminSession.ts are marked
 * `import "server-only"` and use `@/` path aliases plain tsx cannot resolve, so their real source
 * is copied into a scratch dir with only the server-only marker stripped and import specifiers
 * rewritten to real file:// paths — the actual precedence/resolution logic under test is never
 * reimplemented. The two Supabase-backed lookups in adminSession.ts (lookupAuthUserById,
 * lookupActiveAdminRosterByAuthUserId) are the test's I/O boundary and are swapped for small
 * in-memory fixture-driven stubs with identical signatures — every other exported function in
 * that file (isAdminBootstrapSession, createBootstrapSessionToken, the cookie helpers) stays
 * byte-identical to production.
 *
 * Run from repo root: npx tsx scripts/test-staff-bootstrap-session-precedence.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

let passed = 0;
function check(name: string, fn: () => void | Promise<void>): Promise<void> {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      passed += 1;
      console.log(`  PASS  ${name}`);
    })
    .catch((e) => {
      console.error(`  FAIL  ${name}`);
      console.error(e);
      process.exitCode = 1;
    });
}

console.log("Staff-vs-Bootstrap Session Precedence — targeted runtime unit tests\n");

const ROOT = path.resolve(__dirname, "..");
const serverModuleUrl = pathToFileURL(path.join(ROOT, "app/lib/supabase/server.ts")).href;
const scratchDir = mkdtempSync(path.join(tmpdir(), "staff-bootstrap-precedence-test-"));

// --- 1. Scratch copy of adminSession.ts with the two Supabase-backed lookups stubbed -----------
const AUTH_FIXTURE_SENTINEL = "__TEST_AUTH_FIXTURE__";
const ROSTER_FIXTURE_SENTINEL = "__TEST_ROSTER_FIXTURE__";

let adminSessionSource = readFileSync(path.join(ROOT, "app/lib/supabase/adminSession.ts"), "utf8");
adminSessionSource = adminSessionSource.replace(/^import "server-only";\r?\n/, "");
adminSessionSource = adminSessionSource.replaceAll("@/app/lib/supabase/server", serverModuleUrl);

function replaceFunctionBody(source: string, exportSignature: string, newBody: string): string {
  const idx = source.indexOf(exportSignature);
  if (idx === -1) throw new Error(`Could not find "${exportSignature}" to stub`);
  const braceStart = source.indexOf("{", idx);
  let depth = 0;
  let i = braceStart;
  for (; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") {
      depth--;
      if (depth === 0) break;
    }
  }
  return source.slice(0, braceStart) + `{\n${newBody}\n}` + source.slice(i + 1);
}

adminSessionSource = replaceFunctionBody(
  adminSessionSource,
  "export async function lookupAuthUserById(authUserId: string): Promise<AuthUserLookupResult> {",
  `  const fixture = (globalThis as any).${AUTH_FIXTURE_SENTINEL};\n  const hit = fixture ? fixture[authUserId] : undefined;\n  return hit ?? { ok: false };`,
);
adminSessionSource = replaceFunctionBody(
  adminSessionSource,
  "export async function lookupActiveAdminRosterByAuthUserId(authUserId: string): Promise<RosterLookupResult> {",
  `  const fixture = (globalThis as any).${ROSTER_FIXTURE_SENTINEL};\n  const hit = fixture ? fixture[authUserId] : undefined;\n  return hit ?? { ok: false, code: "not_in_roster" };`,
);

const adminSessionScratchFile = path.join(scratchDir, "adminSession.ts");
writeFileSync(adminSessionScratchFile, adminSessionSource, "utf8");
const adminSessionScratchUrl = pathToFileURL(adminSessionScratchFile).href;

// --- 2. Scratch copy of businessWorkspaceAccess.ts pointing at the stubbed adminSession --------
let accessSource = readFileSync(path.join(ROOT, "app/admin/_lib/businessWorkspaceAccess.ts"), "utf8");
const accessBeforeStrip = accessSource;
accessSource = accessSource.replace(/import "server-only";\r?\n/, "");
assert.notEqual(accessSource, accessBeforeStrip, 'expected to find and strip exactly one `import "server-only";` line in businessWorkspaceAccess.ts');
accessSource = accessSource.replaceAll("@/app/lib/supabase/adminSession", adminSessionScratchUrl);
accessSource = accessSource.replaceAll("@/app/lib/supabase/server", serverModuleUrl);
accessSource = accessSource.replace('from "./salesWorkspaceCapabilities"', `from "${pathToFileURL(path.join(ROOT, "app/admin/_lib/salesWorkspaceCapabilities.ts")).href}"`);
// next/headers' cookies() is never called by resolveSalesWorkspaceAccess (only by
// requireSalesWorkspaceAccess, which this test does not exercise), but the import itself throws
// outside a Next.js runtime — strip it and stub the one symbol used, so the module still loads.
accessSource = accessSource.replace('import { cookies } from "next/headers";\n', "const cookies = async () => { throw new Error(\"not used in this test\"); };\n");

const accessScratchFile = path.join(scratchDir, "businessWorkspaceAccess.ts");
writeFileSync(accessScratchFile, accessSource, "utf8");

function fakeCookies(values: Record<string, string>) {
  return { get: (name: string) => (name in values ? { value: values[name] } : undefined) };
}

async function main() {
  const TEST_SECRET = "staff-precedence-test-secret-do-not-use-in-real-env-abcdef0123456789";
  process.env.ADMIN_BOOTSTRAP_SESSION_SECRET = TEST_SECRET;

  const adminSessionMod = await import(adminSessionScratchUrl);
  const { createBootstrapSessionToken, LEONIX_ADMIN_BOOTSTRAP_COOKIE, LEONIX_ADMIN_OPERATOR_EMAIL_COOKIE, LEONIX_ADMIN_AUTH_USER_ID_COOKIE } = adminSessionMod;

  const accessMod = await import(pathToFileURL(accessScratchFile).href);
  const { resolveSalesWorkspaceAccess } = accessMod;

  const REAL_AUTH_USER_ID = "11111111-1111-4111-8111-111111111111";
  const REAL_EMAIL = "chuy@leonixmedia.com";
  const REAL_ROSTER_ID = "22222222-2222-4222-8222-222222222222";

  function setFixtures(opts: { authOk: boolean; rosterActive: boolean; rosterMissing?: boolean }) {
    (globalThis as any)[AUTH_FIXTURE_SENTINEL] = {
      [REAL_AUTH_USER_ID]: opts.authOk ? { ok: true, id: REAL_AUTH_USER_ID, email: REAL_EMAIL } : { ok: false },
    };
    (globalThis as any)[ROSTER_FIXTURE_SENTINEL] = {
      [REAL_AUTH_USER_ID]: opts.rosterMissing
        ? { ok: false, code: "not_in_roster" }
        : opts.rosterActive
          ? { ok: true, rosterMemberId: REAL_ROSTER_ID, role: "super_admin", displayName: "Chuy", email: REAL_EMAIL, isActive: true }
          : { ok: false, code: "inactive" },
    };
  }

  const validBootstrapToken = createBootstrapSessionToken();
  assert.ok(validBootstrapToken, "expected a constructible bootstrap token with the test secret configured");

  // --- A. bootstrap-only session -> actor owner_bootstrap, writes denied downstream --------------
  await check("A. Bootstrap-only session resolves to actorType owner_bootstrap", async () => {
    setFixtures({ authOk: true, rosterActive: true });
    const jar = fakeCookies({ leonix_admin: "1", [LEONIX_ADMIN_BOOTSTRAP_COOKIE]: validBootstrapToken });
    const result = await resolveSalesWorkspaceAccess(jar);
    assert.equal(result.ok, true);
    assert.equal(result.ok && result.actor.actorType, "owner_bootstrap");
  });

  // --- B. real staff auth session -> actor staff, real roster id -------------------------------
  await check("B. Real staff session (no bootstrap cookie) resolves to actorType staff with the real roster id", async () => {
    setFixtures({ authOk: true, rosterActive: true });
    const jar = fakeCookies({
      leonix_admin: "1",
      [LEONIX_ADMIN_OPERATOR_EMAIL_COOKIE]: REAL_EMAIL,
      [LEONIX_ADMIN_AUTH_USER_ID_COOKIE]: REAL_AUTH_USER_ID,
    });
    const result = await resolveSalesWorkspaceAccess(jar);
    assert.equal(result.ok, true);
    assert.equal(result.ok && result.actor.actorType, "staff");
    assert.equal(result.ok && result.actor.rosterId, REAL_ROSTER_ID);
  });

  // --- C. THE precedence guarantee: bootstrap cookie + valid real staff cookies -> staff wins ----
  await check("C. Bootstrap cookie present together with valid real staff cookies -> REAL STAFF WINS, not bootstrap", async () => {
    setFixtures({ authOk: true, rosterActive: true });
    const jar = fakeCookies({
      leonix_admin: "1",
      [LEONIX_ADMIN_BOOTSTRAP_COOKIE]: validBootstrapToken,
      [LEONIX_ADMIN_OPERATOR_EMAIL_COOKIE]: REAL_EMAIL,
      [LEONIX_ADMIN_AUTH_USER_ID_COOKIE]: REAL_AUTH_USER_ID,
    });
    const result = await resolveSalesWorkspaceAccess(jar);
    assert.equal(result.ok, true);
    assert.equal(result.ok && result.actor.actorType, "staff", "bootstrap must never win when a real staff session is also present");
    assert.equal(result.ok && result.actor.rosterId, REAL_ROSTER_ID);
  });

  // --- D. Stale/invalid staff cookies alongside bootstrap -> denies, does NOT fall back to bootstrap (no privilege escalation) ---
  await check("D. Staff cookies present but the roster row is inactive -> denied, never silently falls back to bootstrap access", async () => {
    setFixtures({ authOk: true, rosterActive: false });
    const jar = fakeCookies({
      leonix_admin: "1",
      [LEONIX_ADMIN_BOOTSTRAP_COOKIE]: validBootstrapToken,
      [LEONIX_ADMIN_OPERATOR_EMAIL_COOKIE]: REAL_EMAIL,
      [LEONIX_ADMIN_AUTH_USER_ID_COOKIE]: REAL_AUTH_USER_ID,
    });
    const result = await resolveSalesWorkspaceAccess(jar);
    assert.equal(result.ok, false);
    assert.equal(!result.ok && result.reason, "roster_inactive");
  });
  await check("D2. Staff cookies present but the auth user no longer exists -> denied, never falls back to bootstrap", async () => {
    setFixtures({ authOk: false, rosterActive: true });
    const jar = fakeCookies({
      leonix_admin: "1",
      [LEONIX_ADMIN_BOOTSTRAP_COOKIE]: validBootstrapToken,
      [LEONIX_ADMIN_OPERATOR_EMAIL_COOKIE]: REAL_EMAIL,
      [LEONIX_ADMIN_AUTH_USER_ID_COOKIE]: REAL_AUTH_USER_ID,
    });
    const result = await resolveSalesWorkspaceAccess(jar);
    assert.equal(result.ok, false);
    assert.equal(!result.ok && result.reason, "auth_user_not_found");
  });

  // --- E. No cookies at all -> no_admin_cookie (unchanged baseline) ------------------------------
  await check("E. No cookies at all -> no_admin_cookie", async () => {
    const result = await resolveSalesWorkspaceAccess(fakeCookies({}));
    assert.equal(result.ok, false);
    assert.equal(!result.ok && result.reason, "no_admin_cookie");
  });

  // --- F. Real actor attribution uses the canonical roster id, never a synthetic/placeholder one --
  await check("F. Real staff actor attribution is exactly the roster row's own id, never a placeholder", async () => {
    setFixtures({ authOk: true, rosterActive: true });
    const jar = fakeCookies({
      leonix_admin: "1",
      [LEONIX_ADMIN_OPERATOR_EMAIL_COOKIE]: REAL_EMAIL,
      [LEONIX_ADMIN_AUTH_USER_ID_COOKIE]: REAL_AUTH_USER_ID,
    });
    const result = await resolveSalesWorkspaceAccess(jar);
    assert.equal(result.ok, true);
    assert.equal(result.ok && result.actor.rosterId, REAL_ROSTER_ID);
    assert.notEqual(result.ok && result.actor.rosterId, "");
    assert.notEqual(result.ok && result.actor.authUserId, "00000000-0000-4000-a000-0000000000b7");
  });

  console.log(`\n${passed} check(s) passed.`);
  if (process.exitCode) {
    console.error("\nSome checks FAILED.");
  } else {
    console.log("\nAll checks passed.");
  }
}

void main();
