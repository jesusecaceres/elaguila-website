/**
 * Focused, source-level proof for Owner Normal Login + Break-Glass Continuity (Master Operating
 * Book V2 §0F Owner Identity and Break-Glass Access). Same hand-rolled node:assert convention as
 * every other verify-*.ts script in this repo — structural/source-level proof only, no live
 * Supabase/Auth calls. Run from repo root: npx tsx scripts/verify-owner-auth-break-glass-01.ts
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

function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

/**
 * Extracts a top-level function's full body, from its declaration up to (and including) the
 * closing brace that sits at column 0 on its own line — this repo's consistent top-level
 * indentation style means only a function's OWN closing brace is ever flush-left; every nested
 * block (if/try/return-object) is indented. This avoids the ambiguity of brace-counting from the
 * declaration's first "{", which can land inside a parameter/return-type object-type annotation
 * (e.g. `res: { cookies: {...} }` or `Promise<{ ...fields... }>`) instead of the real body.
 */
function extractFunction(src: string, declaration: string): string {
  const start = src.indexOf(declaration);
  if (start === -1) throw new Error(`declaration not found: ${declaration}`);
  // A real function-closing "}" is the last non-whitespace character on its line (nothing trails
  // it, e.g. "}>" from a multi-line inline return-type object literal doesn't count).
  let searchFrom = start;
  for (;;) {
    const closeIdx = src.indexOf("\n}", searchFrom);
    if (closeIdx === -1) throw new Error(`no column-0 closing brace found for: ${declaration}`);
    const after = src.slice(closeIdx + 2, closeIdx + 3);
    if (after === "" || after === "\n" || after === "\r") {
      return src.slice(start, closeIdx + 2);
    }
    searchFrom = closeIdx + 2;
  }
}

console.log("Owner Normal Login + Break-Glass Continuity (Master Operating Book V2 §0F) — focused tests\n");

const loginAuthRoute = read("app/admin/login/auth/route.ts");
const loginSubmitRoute = read("app/admin/login/submit/route.ts");
const adminSession = read("app/lib/supabase/adminSession.ts");
const adminAccessControl = read("app/admin/_lib/adminAccessControl.ts");
const businessWorkspaceAccess = read("app/admin/_lib/businessWorkspaceAccess.ts");
const adminAuditLogServer = read("app/admin/_lib/adminAuditLogServer.ts");
const adminRosterAudit = read("app/admin/_lib/adminRosterAudit.ts");
const adminGuideRegistry = read("app/admin/_lib/adminGuideRegistry.ts");

// --- 1: normal Admin email login requires active roster identity ---
check("normal Staff/Team login verifies Supabase Auth credentials AND an active roster row before ever setting a session cookie", () => {
  const body = stripComments(loginAuthRoute);
  assert.ok(body.includes("verifyAdminSupabaseCredentials(email, password)"));
  assert.ok(body.includes("lookupActiveAdminRosterByEmail(verified.email)"));
  const verifyIdx = body.indexOf("verifyAdminSupabaseCredentials(");
  const rosterIdx = body.indexOf("lookupActiveAdminRosterByEmail(");
  const cookieIdx = body.indexOf("applyLeonixAdminSessionCookies(");
  assert.ok(verifyIdx >= 0 && rosterIdx > verifyIdx, "roster check must happen after credential verification");
  assert.ok(cookieIdx > rosterIdx, "session cookies must only be set after both checks pass");
  assert.ok(body.includes("if (!roster.ok)"), "an unresolved/inactive roster must short-circuit before the cookie is set");
});

// --- 2: bootstrap and staff sessions are distinct ---
check("applyLeonixAdminSessionCookies() never sets both a bootstrap token and operator-email/auth-user-id cookies in the same response", () => {
  const fn = stripComments(extractFunction(adminSession, "export function applyLeonixAdminSessionCookies"));
  const bootstrapBranch = fn.slice(fn.indexOf("if (opts.bootstrap)"), fn.indexOf("if (opts.operatorEmail)"));
  assert.ok(bootstrapBranch.includes(`res.cookies.set(LEONIX_ADMIN_OPERATOR_EMAIL_COOKIE, "", { ...base, maxAge: 0 });`));
  assert.ok(bootstrapBranch.includes(`res.cookies.set(LEONIX_ADMIN_AUTH_USER_ID_COOKIE, "", { ...base, maxAge: 0 });`));
});

// --- 3: staff login clears bootstrap state appropriately ---
check("a real staff/owner login (bootstrap: false) always clears the bootstrap cookie, so a prior bootstrap session cannot linger", () => {
  const fn = stripComments(extractFunction(adminSession, "export function applyLeonixAdminSessionCookies"));
  const afterBootstrapBranch = fn.slice(fn.indexOf("if (opts.operatorEmail)") - 200, fn.indexOf("if (opts.operatorEmail)"));
  assert.ok(afterBootstrapBranch.includes(`res.cookies.set(LEONIX_ADMIN_BOOTSTRAP_COOKIE, "", { ...base, maxAge: 0 });`), "the non-bootstrap path must clear the bootstrap cookie unconditionally");
});

// --- 4: bootstrap cannot fabricate a roster/staff identity ---
check("ownerBootstrapAccess() (Business Concierge's bootstrap actor) never looks up or fabricates a real admin_team_members row — fixed, clearly-labeled sentinel identity only", () => {
  const fn = stripComments(extractFunction(businessWorkspaceAccess, "function ownerBootstrapAccess()"));
  assert.ok(!/lookupActiveAdminRosterByEmail|lookupActiveAdminRosterByAuthUserId|admin_team_members/.test(fn), "bootstrap actor must never query the real roster table");
  assert.ok(fn.includes('rosterId: ""'), "bootstrap actor must carry an empty (never fabricated) rosterId");
  assert.ok(fn.includes("OWNER_BOOTSTRAP_ATTRIBUTION_AUTH_USER_ID") && fn.includes("OWNER_BOOTSTRAP_ACTOR_EMAIL"), "bootstrap actor must use the fixed, clearly-labeled sentinel identity constants, never a real person's identity");
});
check("bootstrap session cookie can never be forged into a valid session without the dedicated signing secret (fails closed, not just fails open to a bare marker)", () => {
  const fn = stripComments(extractFunction(adminSession, "export function isAdminBootstrapSession"));
  assert.ok(fn.includes("getBootstrapSessionSecret()"));
  assert.ok(/if \(!secret\) return false;/.test(fn), "must fail closed when the bootstrap signing secret is not configured");
  assert.ok(fn.includes("safeEqualHex("), "signature comparison must go through the constant-time helper, not a plain ===");
});
check("the bootstrap login route (/admin/login/submit) fails closed — never redirects to /admin looking successful when a valid signed bootstrap session could not actually be created", () => {
  const body = stripComments(loginSubmitRoute);
  assert.ok(body.includes("applyLeonixAdminSessionCookies(res, { bootstrap: true })"));
  assert.ok(body.includes("if (!result.ok)"));
  assert.ok(body.includes('/admin/login?error=bootstrap_unavailable'), "an unconfigured bootstrap secret must surface an honest error, not a false-success redirect");
});

// --- 5: owner role/capabilities resolve through real roster path ---
check("getCurrentAdminAccessContext() derives normalizedRole from the real admin_team_members row (normalizeAdminRole(rosterRole)) when a roster row resolves, not a hardcoded value", () => {
  const fn = stripComments(extractFunction(adminAccessControl, "export async function getCurrentAdminAccessContext"));
  assert.ok(fn.includes('.from("admin_team_members")'));
  assert.ok(fn.includes("const normalizedRole = normalizeAdminRole(rosterRole);"), "role must be derived from the real roster row's own role column");
  assert.ok(fn.includes("rosterResolved: true"), "a successful real-roster resolution must be marked distinctly from the fallback paths");
});
check("requireSalesWorkspaceAccess() (the hardened Business Concierge boundary) resolves a real staff actor only through a verified Auth-user + roster-by-auth_user_id chain, never by email alone", () => {
  const fn = stripComments(extractFunction(businessWorkspaceAccess, "export async function requireSalesWorkspaceAccess"));
  assert.ok(fn.includes("lookupAuthUserById(authUserId)"), "the auth_user_id cookie must be re-verified against a real, currently-existing Supabase Auth user");
  assert.ok(fn.includes("lookupActiveAdminRosterByAuthUserId(authUserId)"), "the roster row must be resolved by auth_user_id, not by the cookie's claimed email");
  assert.ok(fn.includes("authUser.email !== operatorEmail.trim().toLowerCase()"), "the cookie's claimed email must be cross-checked against the real Auth email");
});

// --- 6: inactive roster access is denied ---
check("lookupActiveAdminRosterByEmail()/lookupActiveAdminRosterByAuthUserId() both explicitly deny an inactive roster row rather than treating it as active", () => {
  for (const fnName of ["lookupActiveAdminRosterByEmail", "lookupActiveAdminRosterByAuthUserId"]) {
    const fn = stripComments(extractFunction(adminSession, `export async function ${fnName}`));
    assert.ok(/is_active[\s\S]*return \{ ok: false, code: "inactive" \}/.test(fn), `${fnName} must deny an inactive row with code "inactive"`);
  }
});
check("the real login route redirects to an explicit inactive/not_roster error rather than granting access on failed roster resolution", () => {
  const body = stripComments(loginAuthRoute);
  assert.ok(body.includes('roster.code === "inactive" ? "inactive" : "not_roster"'));
  assert.ok(body.includes("NextResponse.redirect(new URL(`/admin/login?error=${code}`"));
});

// --- 7: Business Concierge does not rely on unsafe bootstrap→owner identity remapping ---
check("toStaffWriteActor() unconditionally denies owner_bootstrap before any write-capable actor is ever constructed — bootstrap is never remapped into a fake staff or owner identity for a write", () => {
  const fn = stripComments(extractFunction(businessWorkspaceAccess, "export function toStaffWriteActor"));
  const denyIdx = fn.indexOf("isOwnerBootstrapActor(actor)");
  const okIdx = fn.indexOf("ok: true");
  assert.ok(denyIdx >= 0 && okIdx > denyIdx, "the bootstrap denial must be checked before any successful staff actor is returned");
  assert.ok(fn.includes('reason: "bootstrap_write_denied"'));
});
check("a real staff write actor requires both a non-empty rosterId and authUserId — an incomplete identity chain is denied, not silently treated as staff", () => {
  const fn = stripComments(extractFunction(businessWorkspaceAccess, "export function toStaffWriteActor"));
  assert.ok(fn.includes("if (!actor.rosterId || !actor.authUserId)"));
  assert.ok(fn.includes('reason: "staff_identity_incomplete"'));
});

// --- 8: audit actor path preserves real owner attribution, never an env-shared fallback ---
check("appendAdminAuditLog()'s actor resolution reads ONLY the session cookies, never the shared ADMIN_OPERATOR_EMAIL env fallback — an audit row is never attributed to a named person bootstrap could also reach", () => {
  const fn = stripComments(extractFunction(adminAuditLogServer, "async function resolveActorForAuditWrite"));
  assert.ok(fn.includes("getAdminOperatorEmailFromCookies") && fn.includes("getAdminAuthUserIdFromCookies"));
  assert.ok(!/process\.env\.ADMIN_OPERATOR_EMAIL/.test(fn), "must not fall back to the shared env var for audit attribution");
});
check("resolveActingRosterIdentity() (roster-mutation audit trail) is likewise cookie-only, never the env fallback", () => {
  const fn = stripComments(extractFunction(adminRosterAudit, "export async function resolveActingRosterIdentity"));
  assert.ok(!/process\.env\.ADMIN_OPERATOR_EMAIL/.test(fn));
});

// --- 9: Admin Guide correctly documents daily vs emergency login ---
check("a dedicated Admin Guide entry documents normal login vs. owner bootstrap as distinct, non-interchangeable paths", () => {
  const entryMatch = adminGuideRegistry.match(/id: "admin-login",[\s\S]*?\n {2}\},/);
  assert.ok(entryMatch, "admin-login guide entry must exist");
  const entry = entryMatch![0];
  assert.ok(/NORMAL LOGIN/.test(entry) && /OWNER BOOTSTRAP/.test(entry));
  assert.ok(/emergency|break-glass/i.test(entry));
  assert.ok(/not a daily identity|not.{0,20}interchangeable/i.test(entry));
});
check("Team Roster and Executive Hub guide entries remain the authoritative, non-duplicated explanation of login/authorization vs. public contact identity (not re-explained inside the new login entry)", () => {
  assert.ok(adminGuideRegistry.includes('id: "team-roster"'));
  assert.ok(adminGuideRegistry.includes('id: "executive-hub"'));
  const loginEntryMatch = adminGuideRegistry.match(/id: "admin-login",[\s\S]*?\n {2}\},/)![0];
  assert.ok(!/photo, title, theme|working hours/i.test(loginEntryMatch), "the login entry must not duplicate Executive Hub's own profile-field documentation");
});

console.log(`\n${passed} check(s) passed.`);
if (process.exitCode) {
  console.error("\nSome checks FAILED.");
} else {
  console.log("\nAll checks passed.");
}
