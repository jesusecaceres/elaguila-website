/**
 * Focused, source-level proof for the Final Pre-QA Security Hardening Gate: manual-payments and
 * subscription-sweep must fail CLOSED on protected revenue writes, independent of
 * ADMIN_ENFORCE_ROSTER_PERMISSIONS. Same hand-rolled node:assert convention as every other
 * verify-*.ts script in this repo — structural/source-level proof only, no live Supabase/Auth
 * calls (this repo's verify scripts never spin up a server or hit a real database).
 * Run from repo root: npx tsx scripts/verify-revenue-write-security-hardening-01.ts
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

function extractFunction(src: string, declaration: string): string {
  const start = src.indexOf(declaration);
  if (start === -1) throw new Error(`declaration not found: ${declaration}`);
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

console.log("Revenue Write Security Hardening — focused tests\n");

const accessControl = read("app/admin/_lib/adminAccessControl.ts");
const manualPayments = read("app/api/admin/revenue-os/manual-payments/route.ts");
const subscriptionSweep = read("app/api/revenue-os/admin/subscription-sweep/route.ts");
const paymentTrackerPage = read("app/admin/(dashboard)/workspace/payment-tracker/page.tsx");
const manualPaymentPage = read("app/admin/(dashboard)/workspace/payment-tracker/manual-payment/page.tsx");
const adminSession = read("app/lib/supabase/adminSession.ts");

const guardFn = stripComments(
  extractFunction(accessControl, "export async function requireRevenueProtectedWriteAccess"),
);

// =====================================================================================================
// THE GUARD ITSELF
// =====================================================================================================

check("1. missing session (no admin cookie) is denied, and denied FIRST, before any other check", () => {
  const cookieIdx = guardFn.indexOf("requireAdminCookie(jar)");
  const bootstrapIdx = guardFn.indexOf("isAdminBootstrapSession(jar)");
  assert.ok(cookieIdx !== -1, "requireAdminCookie check missing");
  assert.ok(bootstrapIdx !== -1, "isAdminBootstrapSession check missing");
  assert.ok(cookieIdx < bootstrapIdx, "admin-cookie check must run before the bootstrap check");
  assert.ok(guardFn.includes('reason: "no_admin_cookie"'));
});

check("2. a normal customer (no leonix_admin cookie at all) cannot reach roster/role resolution", () => {
  // requireAdminCookie() is the same Layer-1 cookie gate every admin surface uses; a customer
  // session never has it, so the very first branch above denies them before any Supabase call.
  assert.ok(guardFn.startsWith("export async function requireRevenueProtectedWriteAccess"));
  const firstIfIdx = guardFn.indexOf("if (!requireAdminCookie(jar))");
  assert.ok(firstIfIdx !== -1 && firstIfIdx < 200, "admin-cookie check must be the first branch in the guard");
});

check("3. unauthorized staff (any role other than exactly super_admin) is denied", () => {
  assert.ok(guardFn.includes('roster.role.trim().toLowerCase() !== "super_admin"'));
  assert.ok(guardFn.includes('reason: "role_not_permitted"'));
});

check("4. can_view_payments is never consulted by the write guard — a READ permission is not write authority", () => {
  assert.ok(!guardFn.includes("can_view_payments"));
  assert.ok(!guardFn.includes("permissions.includes"));
  assert.ok(!guardFn.includes("hasPaymentTrackerAccess"));
});

check("5. owner/super_admin is allowed only after the full identity chain verifies", () => {
  assert.ok(guardFn.includes("lookupAuthUserById(authUserId)"));
  assert.ok(guardFn.includes("lookupActiveAdminRosterByAuthUserId(authUserId)"));
  assert.ok(guardFn.includes('authUser.email !== operatorEmail.trim().toLowerCase()'));
  assert.ok(guardFn.includes('roster.email.trim().toLowerCase() !== authUser.email'));
  assert.ok(guardFn.includes('roster.role.trim().toLowerCase() !== "super_admin"'));
  assert.ok(guardFn.includes("ok: true"));
  assert.ok(guardFn.includes("actorAuthUserId: authUserId"));
});

check("6. bootstrap cannot bypass write authorization — denied explicitly, before identity resolution", () => {
  assert.ok(guardFn.includes("if (isAdminBootstrapSession(jar))"));
  assert.ok(guardFn.includes('reason: "bootstrap_not_allowed"'));
  const bootstrapIdx = guardFn.indexOf("isAdminBootstrapSession(jar)");
  const operatorEmailIdx = guardFn.indexOf("getAdminOperatorEmailFromCookies(jar)");
  assert.ok(bootstrapIdx !== -1 && operatorEmailIdx !== -1 && bootstrapIdx < operatorEmailIdx);
  // Independently confirm bootstrap sessions never carry the operator-email/auth-user-id cookie
  // pair in the first place (defense in depth for check 6 — not just a code-order assertion).
  const bootstrapBranch = stripComments(
    extractFunction(adminSession, "export function applyLeonixAdminSessionCookies"),
  );
  assert.ok(bootstrapBranch.includes("if (opts.bootstrap)"));
  const bootstrapBlockStart = bootstrapBranch.indexOf("if (opts.bootstrap)");
  const bootstrapBlockEnd = bootstrapBranch.indexOf("return { ok: true };", bootstrapBlockStart);
  const bootstrapBlock = bootstrapBranch.slice(bootstrapBlockStart, bootstrapBlockEnd);
  assert.ok(bootstrapBlock.includes(`LEONIX_ADMIN_OPERATOR_EMAIL_COOKIE, ""`));
  assert.ok(bootstrapBlock.includes(`LEONIX_ADMIN_AUTH_USER_ID_COOKIE, ""`));
});

check("7-9. ADMIN_ENFORCE_ROSTER_PERMISSIONS is never referenced by the guard or either route — the env flag cannot weaken or otherwise affect this authorization path in any state (unset, \"false\", or any other value)", () => {
  assert.ok(!guardFn.includes("ADMIN_ENFORCE_ROSTER_PERMISSIONS"));
  assert.ok(!stripComments(manualPayments).includes("ADMIN_ENFORCE_ROSTER_PERMISSIONS"));
  assert.ok(!stripComments(subscriptionSweep).includes("ADMIN_ENFORCE_ROSTER_PERMISSIONS"));
  // Confirm neither route imports the optional, env-gated layer at all anymore.
  assert.ok(!manualPayments.includes("leonixAdminGate"));
  assert.ok(!subscriptionSweep.includes("leonixAdminGate"));
  assert.ok(!manualPayments.includes("requireLeonixAdminPermission"));
  assert.ok(!subscriptionSweep.includes("requireLeonixAdminPermission"));
  // Confirm both routes now import the always-on guard instead.
  assert.ok(manualPayments.includes("requireRevenueProtectedWriteAccess"));
  assert.ok(subscriptionSweep.includes("requireRevenueProtectedWriteAccess"));
  assert.ok(manualPayments.includes('from "@/app/admin/_lib/adminAccessControl"'));
  assert.ok(subscriptionSweep.includes('from "@/app/admin/_lib/adminAccessControl"'));
});

// =====================================================================================================
// REGRESSION: READ-ONLY PAYMENT TRACKER PERMISSION MUST BE COMPLETELY UNCHANGED
// =====================================================================================================

check("10. existing read-only Payment Tracker permission model is completely unchanged", () => {
  const hasAccessFn = extractFunction(accessControl, "export function hasPaymentTrackerAccess");
  assert.ok(hasAccessFn.includes("isOwnerAdminRole(ctx.normalizedRole)"));
  assert.ok(hasAccessFn.includes('ctx.permissions.includes("can_view_payments")'));
  const requireFn = extractFunction(accessControl, "export function requirePaymentTrackerAccess");
  assert.ok(requireFn.includes("hasPaymentTrackerAccess(ctx)"));
  assert.ok(paymentTrackerPage.includes("requirePaymentTrackerAccess(access)"));
  assert.ok(manualPaymentPage.includes("requirePaymentTrackerAccess(access)"));
  // The new write guard is a distinct, separate export — it does not replace or alias the
  // read-visibility function.
  assert.notEqual(
    accessControl.indexOf("export function hasPaymentTrackerAccess"),
    -1,
  );
  assert.notEqual(
    accessControl.indexOf("export async function requireRevenueProtectedWriteAccess"),
    -1,
  );
});

// =====================================================================================================
// REGRESSION: BUSINESS LOGIC UNCHANGED AFTER AUTHORIZATION
// =====================================================================================================

check("11a. manual-payments route business logic (action branches, field parsing, writer calls) is unchanged", () => {
  assert.ok(manualPayments.includes('action === "record"'));
  assert.ok(manualPayments.includes('action === "verify_cleared"'));
  assert.ok(manualPayments.includes('action === "reject"'));
  assert.ok(manualPayments.includes('action === "reverse"'));
  assert.ok(manualPayments.includes("recordManualPaymentPendingVerification("));
  assert.ok(manualPayments.includes("verifyManualPaymentCleared("));
  assert.ok(manualPayments.includes("markManualPaymentRejected("));
  assert.ok(manualPayments.includes("markManualPaymentReversed("));
  assert.ok(manualPayments.includes("paymentRecordId_required".replace("_", "_")) || manualPayments.includes("payment_record_id_required"));
  assert.ok(manualPayments.includes("amountCents: Number(body.amountCents ?? 0)"));
});

check("11b. subscription-sweep business logic (machine-key path, sweep params) is unchanged", () => {
  assert.ok(subscriptionSweep.includes("function machineKeyAuthorized(request: NextRequest)"));
  assert.ok(subscriptionSweep.includes("LEONIX_SUBSCRIPTION_SWEEP_KEY"));
  assert.ok(subscriptionSweep.includes("x-leonix-sweep-key"));
  assert.ok(subscriptionSweep.includes("timingSafeEqual("));
  assert.ok(subscriptionSweep.includes("sweepDueSubscriptionTransitions({"));
  assert.ok(subscriptionSweep.includes("reapStaleProcessingEvents()"));
  assert.ok(subscriptionSweep.includes("dryRun: body.dryRun === true"));
  // The machine-key branch is still checked FIRST and independently of the admin-session guard.
  // Scope this to the POST handler body only — the file's own top-of-file doc comment mentions
  // requireRevenueProtectedWriteAccess() by name before machineKeyAuthorized's definition, which
  // would otherwise false-fail a naive whole-file ordering check.
  const postHandler = stripComments(
    extractFunction(subscriptionSweep, "export async function POST"),
  );
  const machineKeyIdx = postHandler.indexOf("machineKeyAuthorized(request)");
  const guardCallIdx = postHandler.indexOf("requireRevenueProtectedWriteAccess()");
  assert.ok(machineKeyIdx !== -1 && guardCallIdx !== -1 && machineKeyIdx < guardCallIdx);
});

// =====================================================================================================
// AUDIT ATTRIBUTION TRUTHFULNESS
// =====================================================================================================

check("12. manual-payments audit attribution is always the real, server-verified actor — never client-suppliable, never a fabricated fallback", () => {
  assert.ok(!manualPayments.includes("body.adminUserId"));
  assert.ok(manualPayments.includes("const adminUserId = access.actorAuthUserId;"));
  // The old "admin" literal last-resort fallback (only reachable when no identity at all could be
  // resolved) is gone — it can never be reached now because unresolved identities are denied
  // above, before this line, by the guard itself.
  assert.ok(!manualPayments.includes('?? "admin"'));
  assert.ok(!manualPayments.includes("getCurrentAdminAccessContext"));
});

console.log(`\n${passed} check(s) passed.`);
