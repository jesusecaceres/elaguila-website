/**
 * ACCESS-01 — Command Center, Concierge access, and PWA truth verifier.
 * Run: npx tsx scripts/verify-access-01-command-center-concierge-pwa.ts
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EXPECTED_BRANCH = "integration/leo-executive-operating-intelligence-2026-08";

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

{
  const branch = execSync("git branch --show-current", { cwd: ROOT, encoding: "utf8" }).trim();
  check(branch === EXPECTED_BRANCH, `branch ${EXPECTED_BRANCH}`);
}

const adminPage = src("app/admin/(dashboard)/page.tsx");
const globalNav = src("app/admin/_lib/adminGlobalNav.ts");
const adminStrings = src("app/admin/_lib/adminStrings.ts");
const sidebar = src("app/admin/_components/AdminSidebar.tsx");
const drawer = src("app/admin/_components/AdminMobileNavDrawer.tsx");
const accessControl = src("app/admin/_lib/adminAccessControl.ts");
const leoPage = src("app/admin/(dashboard)/leo/page.tsx");
const leoHeader = src("app/admin/(dashboard)/leo/_components/LeoExecutiveHeader.tsx");
const leoWayfinding = src("app/admin/(dashboard)/leo/_components/LeoAdminWayfinding.tsx");
const dashboardShell = src("app/(site)/dashboard/components/LeonixDashboardShell.tsx");
const businessTools = src("app/(site)/dashboard/business-tools/page.tsx");
const manifest = src("public/manifest.webmanifest");
const sw = src("public/sw.js");
const leoPwaShell = src("app/admin/(dashboard)/leo/_components/LeoPwaShell.tsx");
const leoCaps = src("app/leo/_lib/leoPwaCapabilities.ts");

check(adminPage.includes("AdminCommandCenterDashboard"), "/admin renders AdminCommandCenterDashboard");
check(!exists("app/admin/(dashboard)/command-center/page.tsx"), "no duplicate /admin/command-center route");
check(
  globalNav.includes('{ href: "/admin", labelKey: "nav.dashboard"'),
  "ADMIN_GLOBAL_NAV includes /admin entry",
);

check(sidebar.includes("<Link") && sidebar.includes("item.href"), "AdminSidebar renders nav as Link");
check(drawer.includes("<Link") && drawer.includes("ADMIN_GLOBAL_NAV"), "mobile drawer renders nav links");
check(/nav\.dashboard":\s*"Command Center"/.test(adminStrings), 'nav.dashboard labeled "Command Center" (EN)');
check(/nav\.leo":\s*"LEO Executive Assistant"/.test(adminStrings), "LEO nav label for owner_admin");
check(globalNav.includes('{ href: "/admin/leo", labelKey: "nav.leo"'), "LEO href in global nav");

check(leoWayfinding.includes('href="/admin"'), "LEO wayfinding links to Command Center");
check(leoHeader.includes("LeoAdminWayfinding"), "LEO header mounts wayfinding");

check(/owner_admin/.test(accessControl) && accessControl.includes('"/admin/leo"'), "LEO remains owner_admin gated in nav");
check(leoPage.includes("resolveLeoAccess"), "LEO page still enforces leoAccess");

check(
  dashboardShell.includes('navItem("business", `/dashboard/business-tools'),
  "dashboard nav exposes Business Tools",
);
check(exists("app/(site)/dashboard/business-tools/page.tsx"), "/dashboard/business-tools route exists");
check(!exists("app/(site)/dashboard/business-tools/concierge/page.tsx"), "no premature concierge workspace route");

check(businessTools.includes("comingSoonTitle") || businessTools.includes("Coming soon"), "coming soon section explicit");
check(
  businessTools.includes("Website builder") || businessTools.includes("Constructor de sitio web"),
  "website builder listed as coming soon",
);
check(
  businessTools.includes("Logo generator") || businessTools.includes("Generador de logo"),
  "logo generator listed as coming soon",
);
check(!/Build my website|Generate my logo|Create my brand|Create social posts/i.test(businessTools), "no fake generator CTAs");
check(!/href=.*website.*builder|href=.*logo.*generator/i.test(businessTools), "no fake generator links");
check(
  businessTools.includes("capabilitiesTitle") || businessTools.includes("Capacidades por anuncio"),
  "entitlement rows remain",
);
check(businessTools.includes("completeness") || businessTools.includes("Completitud"), "profile completeness remains");

check(exists("public/manifest.webmanifest") && exists("public/sw.js"), "single manifest + SW preserved");
check(!exists("public/leo-sw.js") && !exists("public/concierge-manifest.webmanifest"), "no second LEO/Concierge PWA assets");
check(manifest.includes('"scope": "/"') && manifest.includes('"start_url": "/"'), "Leonix PWA scope /");
check(/Install Leonix/.test(leoPwaShell), "install copy says Leonix not separate LEO app");
check(!/\bInstall LEO\b/i.test(leoPwaShell + manifest), "no Install LEO separate-app copy");
check(leoPwaShell.includes("ensureLeonixServiceWorker"), "LEO uses canonical SW registration");
check(/\/admin\/leo/.test(sw + leoCaps), "LEO reachable inside Leonix shell");
check(dashboardShell.includes("LeonixDashboardShell"), "Business Tools uses Leonix dashboard shell");

check(sidebar.includes("py-2.5") || sidebar.includes("min-h"), "admin sidebar touch-friendly");
check(drawer.includes("min-h-[44px]"), "mobile drawer touch targets");
check(businessTools.includes("min-h-[44px]"), "business tools CTAs touch-friendly");
check(leoWayfinding.includes("min-h-[44px]"), "LEO wayfinding touch-friendly");

const changed = execSync("git diff --name-only HEAD", { cwd: ROOT, encoding: "utf8" })
  .trim()
  .split(/\r?\n/)
  .filter(Boolean)
  .map((f) => f.replace(/\\/g, "/"));
const untracked = execSync("git status --short", { cwd: ROOT, encoding: "utf8" })
  .trim()
  .split(/\r?\n/)
  .filter((l) => l.startsWith("??"))
  .map((l) => l.replace(/^\?\?\s+/, "").replace(/\\/g, "/"));

const allowed = new Set([
  "app/admin/_lib/adminStrings.ts",
  "app/admin/(dashboard)/leo/_components/LeoExecutiveHeader.tsx",
  "app/admin/(dashboard)/leo/_components/LeoAdminWayfinding.tsx",
  "app/(site)/dashboard/business-tools/page.tsx",
  "app/(site)/dashboard/lib/dashboardI18n.ts",
  "scripts/verify-access-01-command-center-concierge-pwa.ts",
  "app/leo/_lib/leoTypes.ts",
  "app/leo/_lib/leoWatchDefinitions.ts",
  "app/leo/_lib/leoWatchEngine.ts",
  "app/leo/_lib/leoWatchService.ts",
  "app/leo/_lib/leoSystemHealth.ts",
  "app/leo/_lib/leoAttentionService.ts",
  "app/leo/_lib/leoAttentionEngine.ts",
  "app/leo/_lib/leoExecutiveReportingTypes.ts",
  "app/leo/_lib/leoExecutiveReportingService.ts",
  "app/leo/_lib/leoExecutiveReportingAdapter.ts",
  "app/leo/_lib/leoExecutiveReportingWatchPolicy.ts",
  "app/leo/_lib/leoNotificationService.ts",
  "app/admin/_components/AdminExecutiveReportsPanel.tsx",
  "scripts/verify-exec-reports-02-whole-company-watch-integration.ts",
  "scripts/verify-exec-reports-01-global-reporting-fabric.ts",
  "scripts/verify-leo-16-scheduled-watches-notifications.ts",
  "scripts/verify-leo-15-business-concierge-read-bridge.ts",
  "scripts/verify-leo-14-11-morning-ceo-brief.ts",
  "scripts/verify-leo-14-10-hands-free.ts",
]);
const illegal = [...changed, ...untracked].filter((f) => !allowed.has(f) && !f.startsWith(".next/"));
check(illegal.length === 0, `scope only allowlisted${illegal.length ? ": " + illegal.join(", ") : ""}`);

check(
  execSync("git diff --name-only HEAD -- package.json package-lock.json supabase/migrations", {
    cwd: ROOT,
    encoding: "utf8",
  }).trim() === "",
  "package + migrations untouched",
);

if (failures > 0) {
  console.error(`\nACCESS-01 FAILED with ${failures} failure(s)`);
  process.exit(1);
}
console.log("\nACCESS-01 PASS");
