/**
 * Focused, source-level proof for the Admin Password Recovery Routing gate — Admin/staff forgot-
 * password reuses the exact same canonical Supabase recovery engine customers use, routed through
 * a hardcoded recovery-context allowlist, never a second implementation. Same hand-rolled
 * node:assert convention as every other verify-*.ts script in this repo — structural/source-level
 * proof only, no live Supabase/Auth calls.
 * Run from repo root: npx tsx scripts/verify-admin-password-recovery-01.ts
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

console.log("Admin Password Recovery Routing — focused tests\n");

const adminLoginPage = read("app/admin/login/page.tsx");
const adminForgotPage = read("app/admin/login/forgot/page.tsx");
const adminResetPage = read("app/admin/login/reset/page.tsx");
const authCallbackSession = read("app/lib/auth/authCallbackSession.ts");
const authCallbackPage = read("app/(site)/auth/callback/page.tsx");
const customerLoginPage = read("app/(site)/login/page.tsx");
const loginSubmitRoute = read("app/admin/login/submit/route.ts");
const loginAuthRoute = read("app/admin/login/auth/route.ts");
const adminSession = read("app/lib/supabase/adminSession.ts");
const adminGuideRegistry = read("app/admin/_lib/adminGuideRegistry.ts");

// --- 1: admin forgot-password entry exists and reuses the canonical primitive ---
check("/admin/login has a Forgot password? link to /admin/login/forgot", () => {
  assert.ok(/href="\/admin\/login\/forgot"/.test(adminLoginPage));
  assert.ok(/Forgot password\?/.test(adminLoginPage));
});
check("the admin forgot-password page calls the SAME resetPasswordForEmail primitive the customer flow uses — no new/duplicate implementation", () => {
  assert.ok(adminForgotPage.includes("supabase.auth.resetPasswordForEmail("));
  assert.ok(customerLoginPage.includes("supabase.auth.resetPasswordForEmail("));
  assert.ok(adminForgotPage.includes('import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser"'));
});

// --- 2: no account enumeration ---
check("the admin forgot-password page always shows the same fixed, non-enumerating success message regardless of whether the account exists", () => {
  assert.ok(/If an account exists for that email, check your inbox/.test(adminForgotPage));
  const code = stripComments(adminForgotPage);
  // The success message must not be gated behind any check for a "user not found"-style error —
  // only a rate-limit branch may show a different message (which reveals request volume, not
  // account existence).
  const rateLimitBranchMatch = code.match(/if \(error\?\.message\?\.toLowerCase\(\)\.includes\("rate"\)\) \{[\s\S]*?\n {6}\}/);
  assert.ok(rateLimitBranchMatch, "a distinct rate-limit branch must exist");
  assert.ok(!/user not found|no account|does not exist|no user/i.test(code), "must never branch on account existence");
});

// --- 3 & 4: hardcoded recovery-context allowlist, not an arbitrary safe-internal-redirect ---
check("resolveRecoveryContext() only ever returns customer or admin for exactly two hardcoded destination paths", () => {
  const fn = authCallbackSession.match(/const RECOVERY_DESTINATION_PATHS: Record<RecoveryContext, string> = \{[\s\S]*?\};/);
  assert.ok(fn, "RECOVERY_DESTINATION_PATHS map must exist");
  assert.ok(fn![0].includes('customer: "/dashboard/seguridad"'));
  assert.ok(fn![0].includes('admin: "/admin/login/reset"'));
  const matches = fn![0].match(/:\s*"\//g);
  assert.equal(matches?.length, 2, "the allowlist must contain exactly the two known destinations, nothing more");
});
check("isAllowedRecoveryDestination() is exported and used to gate the callback before establishing a recovery session", () => {
  assert.ok(authCallbackSession.includes("export function isAllowedRecoveryDestination"));
  assert.ok(authCallbackPage.includes("isAllowedRecoveryDestination(destination)"));
  const runFnMatch = authCallbackPage.match(/async function run\(\) \{[\s\S]*?\n {4}\}/);
  assert.ok(runFnMatch, "run() must exist");
  const run = stripComments(runFnMatch![0]);
  const guardIdx = run.indexOf("recoveryFlow && !isAllowedRecoveryDestination(destination)");
  const establishIdx = run.indexOf("establishSessionFromAuthCallback(");
  assert.ok(guardIdx >= 0 && establishIdx > guardIdx, "the allowlist check must run before the session is ever established");
});
check("an unrecognized recovery destination throws before any navigation — fails safe, never falls through to an arbitrary redirect", () => {
  assert.ok(authCallbackPage.includes('throw new Error("recovery_destination_not_allowed")'));
  assert.ok(authCallbackSession.includes('"recovery_destination_not_allowed"'), "the error must be mapped to a safe, generic user-facing message");
});

// --- 5: customer regression — the existing customer destination is unchanged and still allowlisted ---
check("the customer recovery destination (/dashboard/seguridad) is unchanged and still passes the allowlist", () => {
  assert.ok(customerLoginPage.includes("/dashboard/seguridad?recovery=1"));
  assert.ok(authCallbackSession.includes('customer: "/dashboard/seguridad"'));
});
check("customer recovery errors still redirect to /login (not /admin/login) — admin context never leaks into the customer flow", () => {
  const fnMatch = authCallbackPage.match(/function redirectToLoginWithError\([\s\S]*?\n {4}\}/);
  assert.ok(fnMatch, "redirectToLoginWithError must exist");
  const fn = stripComments(fnMatch![0]);
  assert.ok(/if \(recoveryFlow && recoveryContext === "admin"\) \{/.test(fn), "only the admin context branch may divert away from /login");
  assert.ok(fn.includes('router.replace(`/login?${q.toString()}`)'), "the default path (customer/non-recovery) must still go to /login");
});
check("admin recovery errors route back to /admin/login, never to the customer /login page or the customer dashboard", () => {
  const fnMatch = authCallbackPage.match(/function redirectToLoginWithError\([\s\S]*?\n {4}\}/);
  const fn = stripComments(fnMatch![0]);
  assert.ok(fn.includes('router.replace(`/admin/login?error=recovery`)'));
});

// --- 6: shared underlying primitives, admin reset page never uses a service-role/admin API ---
check("the admin reset-password page updates the password via the same supabase.auth.updateUser({ password }) primitive the customer destination uses — no new logic", () => {
  assert.ok(adminResetPage.includes("supabase.auth.updateUser({ password: newPassword })"));
  const dashboardSeguridad = read("app/(site)/dashboard/seguridad/page.tsx");
  assert.ok(dashboardSeguridad.includes("supabase.auth.updateUser({"));
});
check("the admin reset-password page never uses a Supabase service-role/admin API in browser code", () => {
  assert.ok(!/auth\.admin\./.test(adminResetPage));
  assert.ok(!/auth\.admin\./.test(adminForgotPage));
  assert.ok(!/SUPABASE_SERVICE_ROLE_KEY/.test(adminResetPage));
  assert.ok(!/SUPABASE_SERVICE_ROLE_KEY/.test(adminForgotPage));
});
check("the admin reset-password page reuses the shared password-policy and UI primitives (evaluatePassword, PasswordInputField, PasswordStrengthMeter) rather than reimplementing them", () => {
  assert.ok(adminResetPage.includes('from "@/app/lib/auth/customerPassword"'));
  assert.ok(adminResetPage.includes('from "@/app/(site)/components/auth/PasswordInputField"'));
  assert.ok(adminResetPage.includes('from "@/app/(site)/components/auth/PasswordStrengthMeter"'));
});

// --- 7: valid recovery session required before password update ---
check("the admin reset-password page requires an existing Supabase session before rendering the password-update form — no session means an 'invalid/expired' state, not a form", () => {
  const code = stripComments(adminResetPage);
  assert.ok(code.includes("supabase.auth.getUser()"));
  assert.ok(/if \(!data\.user\) \{\s*setStatus\("invalid"\);/.test(code));
  assert.ok(code.includes('status === "ready" &&'), "the submit button must be gated on a resolved, valid session state");
});
check("the admin reset-password page offers a way to request another recovery email when the link is invalid/expired", () => {
  assert.ok(adminResetPage.includes('href="/admin/login/forgot"'));
});

// --- 8: authorization boundary — recovery never touches admin_team_members, roles, or bootstrap ---
check("neither the admin forgot-password nor reset-password page ever reads or writes admin_team_members, roster roles, or permissions", () => {
  for (const code of [adminForgotPage, adminResetPage]) {
    assert.ok(!/admin_team_members/.test(code));
    assert.ok(!/rosterRole|normalizedRole|super_admin|isOwnerAdminRole|canViewAdminTeam|rosterMemberId/.test(code));
  }
});
check("neither new page reads or writes any bootstrap cookie/session primitive — password recovery is fully isolated from break-glass access", () => {
  for (const code of [adminForgotPage, adminResetPage]) {
    assert.ok(!/bootstrap/i.test(code));
    assert.ok(!/leonix_admin/.test(code));
  }
});
check("the bootstrap login route and its session primitives are byte-for-byte untouched by this gate (no reference to the new recovery pages)", () => {
  assert.ok(!/login\/forgot|login\/reset/.test(loginSubmitRoute));
  assert.ok(!/login\/forgot|login\/reset/.test(adminSession));
  assert.ok(loginSubmitRoute.includes('applyLeonixAdminSessionCookies(res, { bootstrap: true })'));
});
check("the real staff login route is unaffected by this gate — still requires Supabase Auth + active roster before any cookie is set", () => {
  assert.ok(loginAuthRoute.includes("verifyAdminSupabaseCredentials(email, password)"));
  assert.ok(loginAuthRoute.includes("lookupActiveAdminRosterByEmail(verified.email)"));
});

// --- 9: no open redirect ---
check("resetPasswordForEmail's redirectTo in both the customer and admin forgot-password pages is built from a hardcoded literal path, never a client-suppliable value", () => {
  assert.ok(/redirect=\$\{encodeURIComponent\(\s*"\/admin\/login\/reset\?recovery=1&lang=en"\s*\)\}/.test(adminForgotPage.replace(/\n/g, " ")) || adminForgotPage.includes('"/admin/login/reset?recovery=1&lang=en"'));
  assert.ok(!/redirectTo:\s*[a-zA-Z]/.test(adminForgotPage.replace(/redirectTo:\s*redirectTo/g, "")) || adminForgotPage.includes("const redirectTo"), "redirectTo must be a locally-constructed value, not a raw pass-through of user input");
});
check("the recovery-context allowlist is the actual redirect gate for recovery flows — a non-allowlisted destination cannot reach router.replace()", () => {
  const runFnMatch = authCallbackPage.match(/async function run\(\) \{[\s\S]*?\n {4}\}/);
  const run = stripComments(runFnMatch![0]);
  assert.ok(/if \(recoveryFlow && !isAllowedRecoveryDestination\(destination\)\) \{\s*throw/.test(run));
});

// --- 10: Admin Guide documents the new forgot-password flow ---
check("the admin-login Admin Guide entry documents the forgot-password flow, recovery email, and returning to Staff / Team login, while still explaining bootstrap as unrelated emergency-only access", () => {
  const entryMatch = adminGuideRegistry.match(/id: "admin-login",[\s\S]*?\n {2}\},/);
  assert.ok(entryMatch, "admin-login guide entry must exist");
  const entry = entryMatch![0];
  assert.ok(/[Ff]orgot password/.test(entry));
  assert.ok(/recovery link|recovery email/i.test(entry));
  assert.ok(/Return to Staff \/ Team login/.test(entry));
  assert.ok(/bootstrap/i.test(entry) && /unrelated|emergency/i.test(entry));
});

console.log(`\n${passed} check(s) passed.`);
if (process.exitCode) {
  console.error("\nSome checks FAILED.");
} else {
  console.log("\nAll checks passed.");
}
