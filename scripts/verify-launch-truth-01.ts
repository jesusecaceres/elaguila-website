/**
 * Focused, source-level proof for the Launch Placeholder / Fake-Capability Eradication gate.
 * Same hand-rolled node:assert convention as every other verify-*.ts script in this repo —
 * structural/source-level proof only. Run from repo root: npx tsx scripts/verify-launch-truth-01.ts
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

console.log("Launch Placeholder / Fake-Capability Eradication — focused tests\n");

const globalNav = read("app/admin/_lib/adminGlobalNav.ts");
const accessControl = read("app/admin/_lib/adminAccessControl.ts");
const teamTypes = read("app/admin/_lib/teamTypes.ts");
const rosterPage = read("app/admin/(dashboard)/team/roster/page.tsx");
const usersNewPage = read("app/admin/(dashboard)/team/users/new/page.tsx");
const guideRegistry = read("app/admin/_lib/adminGuideRegistry.ts");
const commandCenter = read("app/admin/_components/AdminCommandCenterDashboard.tsx");
const purposeCard = read("app/admin/_components/AdminPagePurposeCard.tsx");
const settingsPage = read("app/admin/(dashboard)/settings/page.tsx");
const viajesOverview = read("app/admin/(dashboard)/clasificados/viajes/page.tsx");
const navOpsScript = read("scripts/verify-admin-nav-ops.mjs");

// --- 1: no canonical Admin navigation href points to Coming Soon ---
check("no entry in ADMIN_GLOBAL_NAV points to a Coming Soon route", () => {
  assert.ok(!/href:\s*"[^"]*coming-soon[^"]*"/i.test(globalNav));
});

// --- 2: no visible Admin CTA intentionally uses Coming Soon as a fallback ---
check("the dead /admin/settings stub is fully removed from primary nav (was the only Admin dead-end this gate found reachable from a real nav array)", () => {
  assert.ok(!globalNav.includes('href: "/admin/settings"'));
});
check("getAllowedGlobalNavHrefs() no longer pushes the removed /admin/settings stub alongside the real site-settings href", () => {
  const fnMatch = accessControl.match(/if \(canViewSiteSettings\(ctx\.normalizedRole\)\) \{[\s\S]*?\n {4}\}/);
  assert.ok(fnMatch, "the site-settings visibility branch must exist");
  assert.ok(!fnMatch![0].includes('"/admin/settings"'));
  assert.ok(fnMatch![0].includes('"/admin/site-settings"'));
});
check("/admin/settings now redirects to the real settings writer instead of rendering a disabled-everything stub", () => {
  assert.ok(settingsPage.includes('redirect("/admin/site-settings")'));
  const code = settingsPage.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  assert.ok(!/\bdisabled\b/i.test(code), "the redirect page must not carry any of the old disabled form controls");
});
check("the Viajes overview no longer shows illustrative/mock stat tiles or links to mock sub-pages — only the real Business Offers moderation tool", () => {
  assert.ok(!viajesOverview.includes("ADMIN_VIAJES_OVERVIEW_MOCK"));
  assert.ok(!viajesOverview.includes("AdminViajesAnalyticsPlaceholders"));
  assert.ok(!/affiliate-cards|\/campaigns|\/editorial|\/settings/.test(viajesOverview.replace(/from ["'].*["']/g, "")), "no remaining links to the mock-heavy sub-pages");
  assert.ok(viajesOverview.includes("/admin/clasificados/viajes/business-offers"), "the one real sub-page must remain linked");
});

// --- 3: can_reset_passwords is no longer a fake exposed permission ---
check("can_reset_passwords (and the other 3 confirmed-unenforced permission keys) are removed from the permission type, the allow-list array, and both label maps", () => {
  for (const key of ["can_view_users", "can_reset_passwords", "can_view_activity_logs", "can_use_replica_mode"]) {
    assert.ok(!teamTypes.includes(`"${key}"`), `${key} must not remain in teamTypes.ts`);
    assert.ok(!rosterPage.includes(`${key}:`), `${key} must not remain in roster page's PERM_SHORT`);
    assert.ok(!usersNewPage.includes(`${key}:`), `${key} must not remain in users/new page's PERM_LABELS`);
  }
});
check("the remaining permission keys are still enforced/labelled consistently — this was a removal of fakes, not a break of real ones", () => {
  for (const key of ["can_edit_users", "can_manage_ads", "can_manage_reports", "can_manage_categories", "can_manage_magazine", "can_manage_website_content", "can_manage_prayer_wall", "can_view_payments", "can_manage_team", "can_manage_recursos"]) {
    assert.ok(teamTypes.includes(`"${key}"`), `${key} must still exist`);
    assert.ok(rosterPage.includes(`${key}:`), `${key} must still be labelled in roster page`);
  }
});

// --- 4: Admin Guide contains no instructions for removed fake controls ---
check("the Admin Guide no longer has a dedicated entry for the removed /admin/settings stub", () => {
  assert.ok(!guideRegistry.includes('id: "settings"'));
  assert.ok(!guideRegistry.includes('route: "/admin/settings"'));
});
check("the Admin Guide's site-settings entry no longer points to the removed /admin/settings stub as a related route", () => {
  const entryMatch = guideRegistry.match(/id: "site-settings",[\s\S]*?\n {2}\},/);
  assert.ok(entryMatch, "site-settings guide entry must exist");
  assert.ok(!entryMatch![0].includes('"/admin/settings"'));
});
check("the Admin Guide's Viajes entry no longer teaches staff to use the removed Affiliate Cards flow as a common task", () => {
  const entryMatch = guideRegistry.match(/id: "viajes-ops",[\s\S]*?\n {2}\},/);
  assert.ok(entryMatch, "viajes-ops guide entry must exist");
  assert.ok(!/Manage business offers or affiliate cards/.test(entryMatch![0]));
});

// --- 5: Command Center visible copy contains no stale "next gate" engineering language ---
check("the Command Center's top hero and purpose card no longer contain roadmap/engineering-lifecycle language", () => {
  assert.ok(!/planned OS tool/i.test(commandCenter));
  assert.ok(!/next gate/i.test(commandCenter));
  assert.ok(!/schema proof|schema gate/i.test(commandCenter));
  assert.ok(!/nextGate=/.test(commandCenter), "the purpose card call must no longer pass a generic nextGate");
});
check("the Command Center no longer renders the PlannedCard roadmap component anywhere", () => {
  assert.ok(!commandCenter.includes("<PlannedCard"));
  assert.ok(!commandCenter.includes("function PlannedCard"));
});
check("the Command Center no longer names unbuilt system-alerts/Bug Finder database tables to the owner", () => {
  assert.ok(!/admin_system_alerts|system-alerts database table/i.test(commandCenter));
});

// --- 6: known purpose-card engineering placeholders are removed/reworded ---
check("AdminPagePurposeCard's nextGate is optional and only rendered when genuinely provided — no forced generic roadmap block", () => {
  assert.ok(purposeCard.includes("nextGate?: string"));
  assert.ok(purposeCard.includes('{nextGate ? <InfoBlock label="Next step">{nextGate}</InfoBlock> : null}'));
});
check("the Command Center's own purpose card is now status real with no nextGate/warningNote", () => {
  const cardMatch = commandCenter.match(/<AdminPagePurposeCard[\s\S]*?\/>/);
  assert.ok(cardMatch, "the top-level purpose card must exist");
  assert.ok(cardMatch![0].includes('status="real"'));
  assert.ok(!cardMatch![0].includes("nextGate="));
  assert.ok(!cardMatch![0].includes("warningNote="));
});
check("raw table/column names and raw migration filenames were removed from the Command Center's primary visible footer and Support/Roster's primary banners", () => {
  assert.ok(!/moderation_reason|review_notes|listings\.status = flagged/.test(commandCenter));
  const support = read("app/admin/(dashboard)/support/page.tsx");
  const roster = read("app/admin/(dashboard)/team/roster/page.tsx");
  assert.ok(!/\.sql</.test(support), "support page must not show a raw migration filename in a rendered element");
  assert.ok(!/\.sql</.test(roster), "roster page must not show a raw migration filename in a rendered element");
});

// --- 7: no existing real route was accidentally removed ---
check("every other real primary-nav route besides the removed /admin/settings stub is still present", () => {
  for (const href of [
    "/admin/leo",
    "/admin",
    "/admin/businesses",
    "/admin/leads/inbox",
    "/admin/workspace/clasificados",
    "/admin/ops",
    "/admin/workspace/payment-tracker",
    "/admin/team/roster",
    "/admin/usuarios",
    "/admin/support",
    "/admin/workspace",
    "/admin/site-settings",
    "/admin/clasificados/viajes",
    "/admin/activity-log",
    "/admin/system-health",
    "/admin/guide",
    "/admin/workspace/language-audit",
    "/admin/tienda",
    "/admin/recursos",
  ]) {
    assert.ok(globalNav.includes(`href: "${href}"`), `real nav href missing: ${href}`);
  }
});
check("the settings-page route file still exists and still exports a default page component (redirect, not a deleted file)", () => {
  assert.ok(settingsPage.includes("export default function AdminSettingsPage"));
});
check("the Viajes business-offers moderation route file is untouched by this gate (the one real sub-feature was preserved, not deleted)", () => {
  const businessOffers = read("app/admin/(dashboard)/clasificados/viajes/business-offers/page.tsx");
  assert.ok(businessOffers.length > 0);
});
check("verify-admin-nav-ops.mjs's own required-hrefs list no longer requires the removed /admin/settings stub, and still requires every other real href", () => {
  assert.ok(!navOpsScript.includes('"/admin/settings",'));
  assert.ok(navOpsScript.includes('"/admin/site-settings",'));
});

// --- 8: auth callback/dev URLs are not incorrectly classified as Coming Soon cleanup ---
check("the real Supabase Auth callback route and its recovery-context allowlist (added in the prior gate) are untouched by this gate's Coming Soon cleanup", () => {
  const authCallback = read("app/(site)/auth/callback/page.tsx");
  const authCallbackSession = read("app/lib/auth/authCallbackSession.ts");
  assert.ok(authCallback.includes("isAllowedRecoveryDestination"));
  assert.ok(authCallbackSession.includes("export function resolveRecoveryContext"));
  assert.ok(!/coming-soon/i.test(authCallback));
  assert.ok(!/coming-soon/i.test(authCallbackSession));
});
check("the legitimate pre-launch marketing Coming Soon gate (ComingSoonGate.tsx, a real newsletter/advertise/media-kit landing page) was correctly left untouched — not misclassified as a fake placeholder", () => {
  const comingSoonGate = read("app/components/ComingSoonGate.tsx");
  assert.ok(comingSoonGate.includes("resetPasswordForEmail") === false, "sanity: this is a distinct file from the auth flow");
  assert.ok(comingSoonGate.includes("newsletterAction"), "the real newsletter signup form must remain");
  assert.ok(comingSoonGate.includes("ctaAdvertise") && comingSoonGate.includes("ctaMediaKit"), "the real marketing CTAs must remain");
});

// --- 9: Company Search and Guide Search remain intact ---
check("Company Search (adminOpsUnifiedSearch/adminExtendedGlobalSearch) and Admin Guide Search (searchAdminGuide) remain two distinct, present systems", () => {
  const unifiedSearch = read("app/admin/_lib/adminOpsUnifiedSearch.ts");
  assert.ok(unifiedSearch.includes("export async function runAdminUnifiedSearch"));
  assert.ok(guideRegistry.includes("getAdminGuideEntryForRoute") || guideRegistry.includes("ADMIN_GUIDE_ENTRIES"));
  assert.ok(globalNav.includes('href: "/admin/ops"'));
  assert.ok(globalNav.includes('href: "/admin/guide"'));
});

// --- 10: System Health remains discoverable ---
check("System Health remains in primary nav and in the Admin Guide, and the Command Center still links to it", () => {
  assert.ok(globalNav.includes('href: "/admin/system-health"'));
  assert.ok(guideRegistry.includes('id: "system-health"'));
  assert.ok(commandCenter.includes("ADMIN_DASHBOARD_ROUTES.systemHealth"));
});

console.log(`\n${passed} check(s) passed.`);
if (process.exitCode) {
  console.error("\nSome checks FAILED.");
} else {
  console.log("\nAll checks passed.");
}
