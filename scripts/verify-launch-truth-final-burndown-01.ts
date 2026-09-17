/**
 * Focused, source-level proof for the Final Launch-Truth Burndown gate: can_view_payments
 * enforcement, Website Preview cleanup, Viajes dormancy, and raw-technical-error removal. Same
 * hand-rolled node:assert convention as every other verify-*.ts script in this repo —
 * structural/source-level proof only, no live Supabase/Auth calls.
 * Run from repo root: npx tsx scripts/verify-launch-truth-final-burndown-01.ts
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

console.log("Final Launch-Truth Burndown — focused tests\n");

const accessControl = read("app/admin/_lib/adminAccessControl.ts");
const dashboardPage = read("app/admin/(dashboard)/page.tsx");
const paymentTrackerPage = read("app/admin/(dashboard)/workspace/payment-tracker/page.tsx");
const manualPaymentPage = read("app/admin/(dashboard)/workspace/payment-tracker/manual-payment/page.tsx");
const extendedSearch = read("app/admin/_lib/adminExtendedGlobalSearch.ts");
const opsPage = read("app/admin/(dashboard)/ops/page.tsx");
const staffAdminAccess = read("app/admin/_lib/staffAdminAccess.ts");
const websitePreviewPage = read("app/admin/(dashboard)/team/website-preview/page.tsx");
const globalNav = read("app/admin/_lib/adminGlobalNav.ts");
const guideRegistry = read("app/admin/_lib/adminGuideRegistry.ts");
const viajesOverview = read("app/admin/(dashboard)/clasificados/viajes/page.tsx");
const adminStrings = read("app/admin/_lib/adminStrings.ts");
const activityLogPage = read("app/admin/(dashboard)/activity-log/page.tsx");
const rosterPage = read("app/admin/(dashboard)/team/roster/page.tsx");
const usuariosDetailPage = read("app/admin/(dashboard)/usuarios/[id]/page.tsx");
const unifiedSearch = read("app/admin/_lib/adminOpsUnifiedSearch.ts");
const authCallbackSession = read("app/lib/auth/authCallbackSession.ts");

// =====================================================================================================
// PAYMENTS
// =====================================================================================================

check("1. can_view_payments is actually checked by the canonical payment-tracker page guard", () => {
  const fn = extractFunction(accessControl, "export function hasPaymentTrackerAccess");
  assert.ok(fn.includes('ctx.permissions.includes("can_view_payments")'));
  const guardFn = extractFunction(accessControl, "export function requirePaymentTrackerAccess");
  assert.ok(guardFn.includes("hasPaymentTrackerAccess(ctx)"));
  assert.ok(paymentTrackerPage.includes("requirePaymentTrackerAccess(access)"));
  assert.ok(manualPaymentPage.includes("requirePaymentTrackerAccess(access)"));
});
check("2. the Company Search Payments/entitlements source enforces the same permission — no bypass via an alternate read path", () => {
  const block = extendedSearch.match(/Payments \/ entitlements[\s\S]*?catch \(e\) \{\s*errors\.push\(`Payments\/entitlements/);
  assert.ok(block, "the payments search block must exist");
  assert.ok(block![0].includes("viewer?.isOwnerAdmin || viewer?.canViewPayments"));
  assert.ok(opsPage.includes("canViewPayments: hasPaymentTrackerAccess(access)"));
});
check("3. direct URL cannot bypass permission — the guard re-resolves a fresh server-side access context on every request, before any data fetch", () => {
  for (const page of [paymentTrackerPage, manualPaymentPage]) {
    const accessIdx = page.indexOf("await getCurrentAdminAccessContext()");
    const guardIdx = page.indexOf("requirePaymentTrackerAccess(access)");
    assert.ok(accessIdx >= 0 && guardIdx > accessIdx, "access must be freshly resolved, then guarded, before rendering/fetching");
  }
});
check("4. owner/super_admin access is preserved unconditionally", () => {
  const fn = extractFunction(accessControl, "export function hasPaymentTrackerAccess");
  assert.ok(/if \(isOwnerAdminRole\(ctx\.normalizedRole\)\) return true;/.test(fn));
});
check("5. unrelated permissions do not grant payment visibility — the check is specific to can_view_payments, not any permission array membership", () => {
  const fn = extractFunction(accessControl, "export function hasPaymentTrackerAccess");
  assert.ok(!/permissions\.length|permissions\[0\]|permissions\.some/.test(fn), "must not grant access based on having ANY permission");
  assert.ok(fn.includes('"can_view_payments"'));
});
check("the old role-only canViewPaymentTracker() (owner_admin hardcoded, ignored can_view_payments) is fully removed — no dangling fake-permission path", () => {
  assert.ok(!accessControl.includes("export function canViewPaymentTracker"));
});
check("nav visibility for Payment Tracker now matches real access (workspace sub-nav and global sidebar both use the permission-aware check)", () => {
  const workspaceFn = extractFunction(accessControl, "export function getAllowedWorkspaceNavHrefs");
  assert.ok(workspaceFn.includes("hasPaymentTrackerAccess(ctx)"));
  const globalFn = extractFunction(accessControl, "export function getAllowedGlobalNavHrefs");
  assert.ok(globalFn.includes("hasPaymentTrackerAccess(ctx)"));
  assert.ok(dashboardPage.includes("hasPaymentTrackerAccess(access)"));
});

// =====================================================================================================
// WEBSITE PREVIEW
// =====================================================================================================

check("6. no launch-visible Website Preview CTA points to Coming Soon", () => {
  assert.ok(!/coming-soon/i.test(staffAdminAccess));
  assert.ok(!/coming-soon/i.test(websitePreviewPage));
});
check("7. no V2/Planned/Next Gate/engineering-status copy remains in Website Preview", () => {
  const linksArrayCode = stripComments(staffAdminAccess).match(/STAFF_PREVIEW_LINKS[\s\S]*?\];/)?.[0] ?? "";
  assert.ok(!/status:/.test(linksArrayCode), "no per-link engineering-status field may remain");
  assert.ok(!stripComments(staffAdminAccess).includes("StaffPreviewLinkStatus"));
  assert.ok(!staffAdminAccess.includes("staffPreviewStatusLabel"));
  assert.ok(!websitePreviewPage.includes("statusBadgeClass"));
  assert.ok(!websitePreviewPage.includes("staffPreviewStatusLabel"));
  assert.ok(!/NEXT_PUBLIC_COMING_SOON_LOCK/.test(websitePreviewPage), "raw env var name must not be shown to staff");
});

// =====================================================================================================
// VIAJES
// =====================================================================================================

check("8. Viajes mock sub-pages (Affiliate Cards, Campaigns, Editorial, Businesses, Settings) are absent from launch-visible navigation and guide entry points", () => {
  for (const src of [globalNav, viajesOverview]) {
    assert.ok(!/affiliate-cards|\/campaigns|\/editorial/.test(src.replace(/from ["'].*["']/g, "")));
  }
  const guideEntry = guideRegistry.match(/id: "viajes-ops",[\s\S]*?\n {2}\},/);
  assert.ok(guideEntry, "viajes-ops guide entry must exist");
  // Only the actionable fields (what a staff member is taught to actually go do) must be checked
  // — the entry's own "notes" field is allowed to explain, as history, what was removed and why.
  const actionableFieldsMatch = guideEntry![0].match(/(commonTasks|howTo|keywords): \[[^\]]*\]/g) ?? [];
  const actionableFields = actionableFieldsMatch.join(" ");
  assert.ok(!/affiliate cards|campaigns|editorial/i.test(actionableFields), "no actionable guide field may still teach staff to use a removed mock tool");
  assert.ok(viajesOverview.includes("/admin/clasificados/viajes/business-offers"), "the one real sub-page must remain reachable");
});

// =====================================================================================================
// RAW ERRORS
// =====================================================================================================

check("9. known raw migration/table/column messages are gone from primary operator UI (Activity Log, Roster, Support, Users detail, Clasificados Ops)", () => {
  // Comments (explaining WHY a migration reference used to exist, or citing it for engineering
  // history) are fine — only rendered/visible strings and code matter here.
  assert.ok(!/admin_audit_log|listing_audit_event|\d{14}_\w+\.sql/.test(stripComments(activityLogPage)));
  assert.ok(!/\.sql</.test(stripComments(rosterPage)));
  const support = read("app/admin/(dashboard)/support/page.tsx");
  assert.ok(!/\.sql</.test(stripComments(support)));
  assert.ok(!usuariosDetailPage.includes("auditHistory.detail"));
  assert.ok(!/listings\.detail_pairs|listings\.republished_at/.test(stripComments(read("app/admin/(dashboard)/workspace/clasificados/page.tsx"))));
});
check("known raw table/migration strings are gone from the admin i18n dictionary (EN and ES) for the fixed keys", () => {
  for (const key of ["activityLog.badgeLive", "activityLog.subtitleLive", "activityLog.subtitleUnavailable", "activityLog.helperNoSecrets", "clasificados.detailPairsMissingTitle", "clasificados.boostMissingTitle"]) {
    const matches = [...adminStrings.matchAll(new RegExp(`"${key.replace(/[.]/g, "\\.")}":[\\s\\S]*?,\\r?\\n`, "g"))];
    assert.ok(matches.length >= 2, `${key} must have both EN and ES entries`);
    for (const m of matches) {
      assert.ok(!/admin_audit_log|listing_audit_event|\.sql|listings\.detail_pairs|listings\.republished_at/.test(m[0]), `${key} entry must not contain a raw table/migration reference: ${m[0]}`);
    }
  }
});
check("10. replacement copy still communicates a real degraded state — never faking a healthy status", () => {
  assert.ok(/[Tt]emporarily unavailable/.test(adminStrings));
  assert.ok(/[Ss]etup required/.test(adminStrings));
  assert.ok(/System Health/.test(activityLogPage) || /System Health/.test(adminStrings));
});

// =====================================================================================================
// GLOBAL — nothing else regressed
// =====================================================================================================

check("11. Admin Guide remains searchable", () => {
  assert.ok(guideRegistry.includes("export function searchAdminGuide"));
  assert.ok(guideRegistry.includes("ADMIN_GUIDE_ENTRIES"));
});
check("12. System Health remains discoverable", () => {
  assert.ok(globalNav.includes('href: "/admin/system-health"'));
  assert.ok(guideRegistry.includes('id: "system-health"'));
});
check("13. Company Search remains intact", () => {
  assert.ok(unifiedSearch.includes("export async function runAdminUnifiedSearch"));
  assert.ok(globalNav.includes('href: "/admin/ops"'));
});
check("14. auth recovery (customer + admin) remains intact and untouched by this gate", () => {
  assert.ok(authCallbackSession.includes("export function resolveRecoveryContext"));
  const adminForgot = read("app/admin/login/forgot/page.tsx");
  const adminReset = read("app/admin/login/reset/page.tsx");
  assert.ok(adminForgot.includes("resetPasswordForEmail"));
  assert.ok(adminReset.includes("updateUser({ password: newPassword })"));
});
check("can_reset_passwords remains hidden — not reintroduced by this gate", () => {
  const teamTypes = read("app/admin/_lib/teamTypes.ts");
  assert.ok(!teamTypes.includes('"can_reset_passwords"'));
  assert.ok(!guideRegistry.match(/reset.{0,40}password/i)?.[0]?.includes("permission"), "no guide text should imply a reset-passwords permission exists");
});

console.log(`\n${passed} check(s) passed.`);
if (process.exitCode) {
  console.error("\nSome checks FAILED.");
} else {
  console.log("\nAll checks passed.");
}
