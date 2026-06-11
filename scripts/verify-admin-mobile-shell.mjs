import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

const checks = [];

function assert(name, condition, detail) {
  checks.push({ name, ok: Boolean(condition), detail });
}

const shell = read("app/admin/_components/AdminShell.tsx");
const sidebar = read("app/admin/_components/AdminSidebar.tsx");
const topbar = read("app/admin/_components/AdminTopbar.tsx");
const drawer = read("app/admin/_components/AdminMobileNavDrawer.tsx");
const theme = read("app/admin/_components/adminTheme.ts");
const responsiveTabs = read("app/admin/_components/AdminResponsiveTabs.tsx");
const leadsSubnav = read("app/admin/_components/leads/AdminLeadsSubnav.tsx");
const staffNav = read("app/admin/_components/StaffTeamNav.tsx");
const inboxClient = read("app/admin/_components/leads/AdminLeonixLeadsInboxClient.tsx");
const newsletterClient = read("app/admin/_components/leads/AdminNewsletterSubscribersInboxClient.tsx");
const mediaKitClient = read("app/admin/_components/leads/AdminMediaKitLeadsClient.tsx");
const mobileCard = read("app/admin/_components/leads/AdminLaunchLeadMobileCard.tsx");
const rowActions = read("app/admin/_components/leads/AdminLaunchLeadRowActions.tsx");
const rosterPage = read("app/admin/(dashboard)/team/roster/page.tsx");
const listingsTable = read("app/admin/(dashboard)/workspace/clasificados/AdminListingsTable.tsx");
const globalNav = read("app/admin/_lib/adminGlobalNav.ts");
const inboxPage = read("app/admin/(dashboard)/leads/inbox/page.tsx");
const pkg = read("package.json");

// 1. Mobile hamburger/menu exists
assert("mobile hamburger in drawer", /data-testid="admin-mobile-hamburger"/.test(drawer), drawer);
assert("hamburger wired in topbar", /AdminMobileNavDrawer/.test(topbar), topbar);
assert("drawer lg:hidden only", /lg:hidden/.test(drawer), drawer);

// 2. Sidebar not permanently full-width on mobile
assert("sidebar hidden below lg", /hidden w-64 shrink-0 lg:block/.test(shell), shell);

// 3. Drawer close behavior
assert("drawer overlay close", /mobile\.closeOverlay/.test(drawer) && /onClick=\{close\}/.test(drawer), drawer);
assert("drawer X close button", /mobile\.close/.test(drawer), drawer);
assert("drawer closes on route change", /pathname.*close/.test(drawer), drawer);

// 4. Admin content wrapper mobile-safe
assert("adminContentArea export", /export const adminContentArea/.test(theme), theme);
assert("shell uses adminContentArea", /adminContentArea/.test(shell), shell);
assert("shell overflow-x-hidden", /overflow-x-hidden/.test(shell), shell);

// 5. No fixed desktop-only content width breaking phone
assert("content min-w-0", /min-w-0/.test(shell), shell);
assert("content max-w-7xl desktop cap", /max-w-7xl/.test(theme), theme);

// 6. Tab navigation mobile-safe
assert("AdminResponsiveTabs scroll strip", /adminResponsiveTabsScroll/.test(theme), theme);
assert("leads subnav uses responsive tabs", /AdminResponsiveTabs/.test(leadsSubnav), leadsSubnav);
assert("staff nav uses responsive tabs", /AdminResponsiveTabs/.test(staffNav), staffNav);
assert("inbox ops tabs responsive", /AdminResponsiveTabs/.test(inboxClient), inboxClient);

// 7–9. Mobile cards / safe layouts
assert("launch lead mobile card component", exists("app/admin/_components/leads/AdminLaunchLeadMobileCard.tsx"), mobileCard);
assert("inbox mobile list", /adminMobileCardList/.test(inboxClient) && /AdminLaunchLeadMobileCard/.test(inboxClient), inboxClient);
assert("inbox desktop table preserved", /adminDesktopTableOnly/.test(inboxClient), inboxClient);
assert("newsletter mobile list", /newsletter-mobile-list/.test(newsletterClient), newsletterClient);
assert("media-kit mobile list", /media-kit-mobile-list/.test(mediaKitClient), mediaKitClient);
assert("team roster mobile list", /team-roster-mobile-list/.test(rosterPage), rosterPage);
assert("clasificados mobile list", /clasificados-mobile-list/.test(listingsTable), listingsTable);

// 10–14. Actions, filters, CSV preserved
assert("row actions View", />\s*View\s*</.test(rowActions), rowActions);
assert("row actions Reply", />\s*Reply\s*</.test(rowActions), rowActions);
assert("row actions Email", />\s*Email\s*</.test(rowActions), rowActions);
assert("row actions Archive", />\s*Archive\s*</.test(rowActions), rowActions);
assert("row actions Restore", />\s*Restore\s*</.test(rowActions), rowActions);
assert("row actions Delete", />\s*Delete\s*</.test(rowActions), rowActions);
assert("inbox CSV export", /\/api\/admin\/leads\/inbox\/export/.test(inboxClient), inboxClient);
assert("newsletter CSV export", /\/api\/admin\/leads\/newsletter\/export/.test(newsletterClient), newsletterClient);
assert("inbox search filter", /placeholder="Name, email/.test(inboxClient), inboxClient);
assert("adminFilterRow", /export const adminFilterRow/.test(theme), theme);

// 15–17. Guardrails — no public/schema/stripe changes in this task files
const publicLayout = exists("app/(site)/layout.tsx") ? read("app/(site)/layout.tsx") : "";
assert("no public layout edits in shell", !/AdminMobileNavDrawer/.test(publicLayout), "public layout untouched");

const migrationDir = path.join(root, "supabase/migrations");
const recentMigrationTouch =
  exists(migrationDir) &&
  fs.readdirSync(migrationDir).some((f) => f.includes("admin_mobile") || f.includes("mobile_shell"));
assert("no new supabase migrations for mobile shell", !recentMigrationTouch, "schema unchanged");

assert("drawer global nav items", /ADMIN_GLOBAL_NAV/.test(drawer), drawer);
for (const key of [
  "nav.dashboard",
  "nav.categories",
  "nav.tienda",
  "nav.siteSections",
  "nav.viajes",
  "nav.users",
  "nav.launchLeads",
  "nav.support",
  "nav.team",
  "nav.activityLog",
  "nav.settings",
  "nav.languageAudit",
]) {
  assert(`global nav label ${key}`, globalNav.includes(key), globalNav);
}
assert("view site in drawer", /shell\.viewSite/.test(drawer), drawer);

// Data warning wraps
assert("inbox warning callout", /adminWarningCallout/.test(inboxPage), inboxPage);

// Touch targets
assert("mobile action min-h 44", /min-h-\[44px\]/.test(rowActions), rowActions);

// Package script
assert("verify script in package.json", /verify:admin-mobile-shell/.test(pkg), pkg);

// Build-safe imports (no obviously broken paths)
assert("AdminResponsiveTabs file exists", exists("app/admin/_components/AdminResponsiveTabs.tsx"), responsiveTabs);

const failed = checks.filter((c) => !c.ok);

if (failed.length > 0) {
  console.error("verify:admin-mobile-shell FAILED\n");
  for (const f of failed) {
    console.error(`  ✗ ${f.name}${f.detail ? `: ${String(f.detail).slice(0, 120)}` : ""}`);
  }
  process.exit(1);
}

console.log(`verify:admin-mobile-shell PASS (${checks.length} checks)`);
