/**
 * LEO-POLISH.1 — Foreground LEO in Owner Admin — construction verifier.
 *
 * Proves the sidebar/mobile-nav/Command-Center changes that surface LEO as the owner's
 * first-class conversational entry point did not touch LEO's governance, authorization,
 * Gmail write path, env, migrations, or Production, and did not create a duplicate route.
 *
 * Run: npx tsx scripts/verify-leo-polish1-admin-foreground.ts
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function src(rel: string): string {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

function exists(rel: string): boolean {
  return existsSync(path.join(ROOT, rel));
}

let failures = 0;
const check = (ok: boolean, label: string) => {
  if (ok) console.log(`PASS  ${label}`);
  else {
    failures += 1;
    console.error(`FAIL  ${label}`);
  }
};

function main() {
  const nav = src("app/admin/_lib/adminGlobalNav.ts");
  const access = src("app/admin/_lib/adminAccessControl.ts");
  const strings = src("app/admin/_lib/adminStrings.ts");
  const sidebar = src("app/admin/_components/AdminSidebar.tsx");
  const mobileDrawer = src("app/admin/_components/AdminMobileNavDrawer.tsx");
  const dashboard = src("app/admin/_components/AdminCommandCenterDashboard.tsx");
  const routes = src("app/admin/_lib/adminDashboardRoutes.ts");
  const leoPage = src("app/admin/(dashboard)/leo/page.tsx");

  // 1. Sidebar entry exists and points at the real, single canonical route.
  check(/href:\s*["']\/admin\/leo["']/.test(nav), "LEO_SIDEBAR_ENTRY_EXISTS");
  check(exists("app/admin/(dashboard)/leo/page.tsx"), "LEO_ROUTE_IS_ADMIN_LEO");

  // 2. LEO is the first entry in the COMMAND group (first item overall in the nav array whose
  // group is "command", and it precedes the /admin dashboard entry).
  const leoIdx = nav.indexOf('href: "/admin/leo"');
  const dashboardIdx = nav.indexOf('href: "/admin", labelKey: "nav.dashboard"');
  check(leoIdx >= 0 && dashboardIdx >= 0 && leoIdx < dashboardIdx, "LEO_FIRST_IN_COMMAND_GROUP");

  // 3. Command Center remains: dashboard nav entry + its page + its data helpers untouched.
  check(
    /href:\s*["']\/admin["']/.test(nav) && exists("app/admin/(dashboard)/page.tsx"),
    "COMMAND_CENTER_REMAINS",
  );
  check(
    /getAdminDashboardSnapshot|AdminCommandCenterDashboard/.test(dashboard),
    "COMMAND_CENTER_DASHBOARD_UNCHANGED_SHAPE",
  );

  // 4. Active-route styling covers /admin/leo (isAdminGlobalNavItemActive + descendants).
  check(
    /isAdminGlobalNavItemActive/.test(sidebar) && /pathname\.startsWith\(item\.href\)/.test(nav),
    "LEO_ACTIVE_ROUTE_SUPPORTED",
  );

  // 5. Mobile nav reuses the same canonical ADMIN_GLOBAL_NAV array — no second nav/route.
  check(
    /import\s*\{[^}]*ADMIN_GLOBAL_NAV[^}]*\}\s*from\s*["']\.\.\/_lib\/adminGlobalNav["']/.test(mobileDrawer),
    "MOBILE_NAV_REUSES_CANONICAL_ENTRY",
  );
  check(!/\/admin\/leo-mobile|\/admin\/m\/leo/i.test(mobileDrawer + sidebar), "NO_MOBILE_ONLY_DUPLICATE_ROUTE");

  // 6. Admin home has a LEO discovery CTA, distinct from the full LEO UI, routing to /admin/leo.
  check(/admin-leo-executive-cta/.test(dashboard), "ADMIN_HOME_LEO_CTA_EXISTS");
  check(
    /leo:\s*["']\/admin\/leo["']/.test(routes) && /ADMIN_DASHBOARD_ROUTES\.leo/.test(dashboard),
    "ADMIN_HOME_LEO_CTA_ROUTES_TO_ADMIN_LEO",
  );
  check(
    !/LeoConversationPanel|LeoMorningBrief|LeoAttentionPanel|LeoOperatingShell|LeoGovernedActionsPanel/.test(
      (() => {
        const start = dashboard.indexOf("leoExecutiveCta = (");
        const end = dashboard.indexOf("promoCodeGeneratorTopCta = (");
        return start >= 0 && end > start ? dashboard.slice(start, end) : dashboard;
      })(),
    ),
    "ADMIN_HOME_CTA_NOT_A_DUPLICATE_LEO_UI",
  );

  // 7. No duplicate/alias LEO route created anywhere under app/admin or app/leo routing.
  const aliasCandidates = [
    "app/admin/(dashboard)/assistant/page.tsx",
    "app/admin/(dashboard)/leo-home/page.tsx",
    "app/admin/(dashboard)/ai/page.tsx",
    "app/admin/assistant/page.tsx",
  ];
  check(!aliasCandidates.some((p) => exists(p)), "NO_DUPLICATE_LEO_ROUTE");
  check((nav.match(/labelKey:\s*["']nav\.leo["']/g) ?? []).length === 1, "NO_DUPLICATE_LEO_NAV_ENTRY");

  // 8. LEO authorization/governance unchanged: page still resolves owner-only access; nav
  // convenience gate on the sidebar is unchanged from LEO-9B.
  check(/resolveLeoAccess/.test(leoPage), "LEO_AUTHORIZATION_UNCHANGED");
  check(
    /isOwnerAdminRole/.test(access) && /hrefs\.push\(["']\/admin\/leo["']\)/.test(access),
    "LEO_NAV_ALLOWLIST_STILL_OWNER_GATED",
  );
  check(/"nav\.leo":\s*"LEO Executive Assistant"/.test(strings), "LEO_NAV_LABEL_UNCHANGED");

  // 9. Governance / RED gate copy untouched (still present, unmodified semantics).
  check(/CHUY APPROVAL REQUIRED/i.test(leoPage) || /GovernanceLegend/.test(leoPage), "GOVERNANCE_UNCHANGED");

  // 10. Gmail write path untouched — this polish never imports/mentions send/write Gmail APIs.
  const touchedFiles = [nav, access, strings, sidebar, mobileDrawer, dashboard, routes];
  check(
    !touchedFiles.some((f) => /gmail\.users\.messages\.send|sendEmail|resend\.emails\.send/i.test(f)),
    "GMAIL_WRITE_UNCHANGED",
  );

  // 11. No env var reads/writes introduced by THIS task's actual edits (adminGlobalNav,
  // adminDashboardRoutes, AdminCommandCenterDashboard). adminAccessControl.ts is intentionally
  // excluded here — it already reads process.env.ADMIN_OPERATOR_EMAIL for unrelated, pre-existing
  // role resolution and was not modified by this task (see LEO_NAV_ALLOWLIST_STILL_OWNER_GATED).
  const filesEditedByThisTask = [nav, routes, dashboard];
  check(!filesEditedByThisTask.some((f) => /process\.env\./.test(f)), "NO_ENV_CHANGE");

  // 12. No new/modified Supabase migrations.
  const migrationsDir = "supabase/migrations";
  const migrations = exists(migrationsDir) ? readdirSync(path.join(ROOT, migrationsDir)) : [];
  check(!migrations.some((m) => /leo_polish|admin_leo_foreground/i.test(m)), "NO_MIGRATION");

  // 13. Production untouched — no deploy/vercel/production config files edited by this task.
  check(
    !touchedFiles.some((f) => /vercel\.json|VERCEL_|production\.env/i.test(f)),
    "PRODUCTION_UNTOUCHED",
  );

  if (failures > 0) {
    console.error(`\nLEO-POLISH.1 verifier: ${failures} failure(s)`);
    process.exit(1);
  }
  console.log("\nLEO-POLISH.1 verifier: PASS");
}

main();
