/**
 * Staff Operating System / Business Concierge day-in-the-life — focused verifier for the NEW
 * WIRING ONLY. Run: npx tsx scripts/verify-staff-operating-system-01.ts
 *
 * Proves (plain node:assert, matching this repo's convention — no jest/vitest):
 *  1. role-aware reachability: every link the staff home emits for a sales_rep passes the SAME
 *     path allowlist the dashboard layout enforces (no /admin/ops, /admin/workspace/*,
 *     /admin/digital-contact/* hand-offs that would bounce to /admin/team?access_denied=1);
 *  2. no permission broadening: the sales_rep allowlist and the capability matrix are untouched
 *     (sales_rep still lacks run_ai_research / grant_business_profile_entitlement /
 *     create_creative_job; the allowlist still rejects /admin/workspace and /admin/digital-contact);
 *  3. commercial truth per role: Manual Payment is offered only to a real super_admin staff actor
 *     with payment-tracker access; Payment Tracker never to a sales_rep; restricted tools are
 *     listed truthfully instead of silently hidden;
 *  4. every search-first Quick Action carries its intent (only "Find business" may be the bare
 *     inventory anchor);
 *  5. the prospect journey strip targets only real section ids / routes on the business page,
 *     and never claims a research source that does not exist in code;
 *  6. reciprocal navigation: Team nav → Business Concierge, Command Center → Concierge +
 *     Create for Client, staff home → Staff Home / Help / Command Center (role-aware);
 *  7. one PWA: single manifest (app/manifest.ts, start_url /admin/businesses, scope /admin/),
 *     single service worker file, and the canonical registration component is now mounted on
 *     the start page;
 *  8. Admin Guide entries reuse the existing registry, point only at routes whose page.tsx
 *     exists, and answer the day-in-the-life questions by keyword.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { composeStaffOperatingSystem, staffOperatingSystemHrefs, STAFF_OS_ROUTES } from "../app/admin/_lib/staffOperatingSystem";
import { isStaffSalesAllowedAdminPath } from "../app/admin/_lib/staffSalesAllowedAdminPath";
import { capabilitiesForRole } from "../app/admin/_lib/salesWorkspaceCapabilities";
import { ADMIN_GUIDE_ENTRIES, searchAdminGuide } from "../app/admin/_lib/adminGuideRegistry";

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");
const pageExists = (route: string) => existsSync(join(ROOT, "app/admin/(dashboard)", route.replace(/^\/admin\/?/, ""), "page.tsx"));

// 1 + 3. Role-aware reachability and commercial truth ---------------------------------------------
const rep = composeStaffOperatingSystem({ role: "sales_rep", actorType: "staff", capabilities: capabilitiesForRole("sales_rep"), paymentTrackerAccess: false });
const mgr = composeStaffOperatingSystem({ role: "sales_manager", actorType: "staff", capabilities: capabilitiesForRole("sales_manager"), paymentTrackerAccess: true });
const mgrNoPay = composeStaffOperatingSystem({ role: "sales_manager", actorType: "staff", capabilities: capabilitiesForRole("sales_manager"), paymentTrackerAccess: false });
const owner = composeStaffOperatingSystem({ role: "super_admin", actorType: "staff", capabilities: capabilitiesForRole("super_admin"), paymentTrackerAccess: true });
const bootstrap = composeStaffOperatingSystem({ role: "super_admin", actorType: "owner_bootstrap", capabilities: capabilitiesForRole("super_admin"), paymentTrackerAccess: true });

for (const href of staffOperatingSystemHrefs(rep)) {
  if (href.startsWith("#") || !href.startsWith("/admin")) continue; // in-page anchor or public page
  const path = href.split(/[?#]/)[0];
  assert.ok(isStaffSalesAllowedAdminPath(path), `sales_rep link is reachable under the layout allowlist: ${href}`);
}
const repHrefs = staffOperatingSystemHrefs(rep);
assert.ok(repHrefs.includes(STAFF_OS_ROUTES.teamPromoCodes) && !repHrefs.some((h) => h.startsWith("/admin/workspace/promo-codes")), "sales_rep promo codes go through /admin/team/promo-codes");
assert.ok(repHrefs.includes(STAFF_OS_ROUTES.teamSalesTracker), "sales_rep sales tracker goes through /admin/team/sales-tracker");
assert.ok(repHrefs.includes(STAFF_OS_ROUTES.teamClients) && !repHrefs.includes("/admin/ops"), "sales_rep Find client goes to My Clients, never /admin/ops");
assert.ok(!repHrefs.some((h) => h.includes("payment-tracker")), "sales_rep never receives a payment-tracker link");
assert.ok(rep.restricted.some((r) => r.key === "payment_tracker") && rep.restricted.some((r) => r.key === "manual_payment") && rep.restricted.some((r) => r.key === "package_entitlements"), "sales_rep restricted tools are listed truthfully");
assert.ok(rep.restricted.some((r) => r.key === "doorbell") && rep.restricted.some((r) => r.key === "presence"), "doorbell/presence are ROLE RESTRICTED for sales_rep (allowlist unchanged)");
assert.ok(!repHrefs.includes(STAFF_OS_ROUTES.commandCenter), "sales_rep is not sent to /admin (layout redirects it)");

const mgrHrefs = staffOperatingSystemHrefs(mgr);
assert.ok(mgrHrefs.includes("/admin/workspace/payment-tracker") && mgrHrefs.includes("/admin/ops") && mgrHrefs.includes(STAFF_OS_ROUTES.doorbell) && mgrHrefs.includes(STAFF_OS_ROUTES.presence), "sales_manager gets workspace payment tracker, unified search, doorbell, presence");
assert.ok(!mgrHrefs.includes(STAFF_OS_ROUTES.manualPayment) && mgr.restricted.some((r) => r.key === "manual_payment"), "sales_manager cannot record a manual payment (super_admin-only revenue write) and is told so");
assert.ok(!staffOperatingSystemHrefs(mgrNoPay).includes("/admin/workspace/payment-tracker") && mgrNoPay.restricted.some((r) => r.key === "payment_tracker"), "no can_view_payments → no payment tracker link, honest reason");
assert.ok(!mgrHrefs.includes("/admin/team/roster"), "sales_manager never receives owner-only team links");

const ownerHrefs = staffOperatingSystemHrefs(owner);
assert.ok(ownerHrefs.includes(STAFF_OS_ROUTES.manualPayment), "super_admin staff login gets Manual payment");
assert.ok(ownerHrefs.includes("/admin/team/roster") && ownerHrefs.includes("/admin/team/users/new") && ownerHrefs.includes(STAFF_OS_ROUTES.executiveHub), "owner gets roster, create staff login, executive hub");
assert.ok(!staffOperatingSystemHrefs(bootstrap).includes(STAFF_OS_ROUTES.manualPayment) && bootstrap.restricted.some((r) => r.key === "manual_payment"), "owner_bootstrap is never offered Manual payment (bootstrap writes are rejected by design)");
for (const os of [rep, mgr, owner]) {
  const hrefs = staffOperatingSystemHrefs(os);
  for (const must of [STAFF_OS_ROUTES.createForClient, STAFF_OS_ROUTES.myProfile, STAFF_OS_ROUTES.guide, STAFF_OS_ROUTES.teamHome, STAFF_OS_ROUTES.leonixManaged, STAFF_OS_ROUTES.visitanos]) {
    assert.ok(hrefs.includes(must), `${os.personaLabel} can reach ${must}`);
  }
}

// 2. No permission broadening ---------------------------------------------------------------------
const repCaps = capabilitiesForRole("sales_rep");
for (const withheld of ["run_ai_research", "review_ai_briefing", "promote_ai_briefing", "grant_business_profile_entitlement", "create_creative_job", "archive_sales_record", "manage_staff_assignments"] as const) {
  assert.ok(!repCaps.has(withheld), `sales_rep still lacks ${withheld}`);
}
for (const blocked of ["/admin/workspace/promo-codes", "/admin/workspace/payment-tracker", "/admin/workspace/package-entitlements", "/admin/ops", "/admin/digital-contact/doorbell", "/admin/digital-contact/presence", "/admin/usuarios"]) {
  assert.ok(!isStaffSalesAllowedAdminPath(blocked), `sales_rep allowlist still rejects ${blocked}`);
}
const allowlistSrc = read("app/admin/_lib/staffSalesAllowedAdminPath.ts");
assert.ok(!/digital-contact|workspace|\/admin\/ops/.test(allowlistSrc), "allowlist source was not broadened");
const osSrc = read("app/admin/_lib/staffOperatingSystem.ts");
assert.ok(!/from\("|supabase|server-only|fetch\(/.test(osSrc), "staff OS composer is pure (no I/O, no DB)");
assert.ok(!/paid\s*:\s*true|isPaid|profile_paid/.test(osSrc), "staff OS never fabricates a paid flag");

// 4. Every Quick Action carries intent ------------------------------------------------------------
for (const os of [rep, mgr, owner]) {
  assert.equal(staffOperatingSystemHrefs(os).filter((h) => h === "#businesses-inventory").length, 0, "the composer never emits a bare inventory anchor — Find business is a literal page-local anchor on the home");
}
for (const key of ["note", "follow_up", "meeting", "research", "creative_studio"]) {
  const link = [...rep.clientWork, ...rep.customerCommunication].find((l) => l.key === key) ?? [...mgr.clientWork, ...mgr.customerCommunication].find((l) => l.key === key);
  assert.ok(link && link.href.startsWith(`/admin/businesses?action=${key}`), `${key} carries its intent through ?action=`);
}
const commandCenterSrc = read("app/admin/(dashboard)/businesses/StaffCommandCenter.tsx");
assert.ok(!/href="\/admin\/ops"|ADMIN_DASHBOARD_ROUTES\.customerOps|href=\{ADMIN_DASHBOARD_ROUTES/.test(commandCenterSrc), "StaffCommandCenter no longer hard-codes role-blind commercial/ops links — the composer decides");
assert.equal((commandCenterSrc.match(/href="#businesses-inventory"/g) ?? []).length, 1, "exactly one literal Find business anchor on the home");
assert.ok(commandCenterSrc.includes(`href="${STAFF_OS_ROUTES.addProspect}"`) && commandCenterSrc.includes(`href="${STAFF_OS_ROUTES.fieldAgent}"`), "Add prospect + Field Agent stay literal on the home (every Sales Workspace role holds those capabilities)");
assert.ok(commandCenterSrc.includes("os.clientWork") && commandCenterSrc.includes("os.commercial") && commandCenterSrc.includes("os.customerCommunication") && commandCenterSrc.includes("os.myLeonix") && commandCenterSrc.includes("os.restricted"), "home renders CLIENT WORK / COMMERCIAL / CUSTOMER COMMUNICATION / MY LEONIX + restricted list");
assert.ok(/Hoy \/ Today/.test(commandCenterSrc), "TODAY block preserved (existing chips, no new count engine)");
const homePageSrc = read("app/admin/(dashboard)/businesses/page.tsx");
assert.ok(homePageSrc.includes("composeStaffOperatingSystem(") && homePageSrc.includes("hasPaymentTrackerAccess("), "staff home composes the OS from the strict actor + existing payment-tracker access check");

// 5. Prospect journey strip → real targets only ---------------------------------------------------
const stripSrc = read("app/admin/(dashboard)/businesses/[businessId]/ProspectJourneyStrip.tsx");
const workspaceSrc = read("app/admin/(dashboard)/businesses/[businessId]/page.tsx");
for (const id of ["discover", "overview", "business-book", "business-profile", "creative"]) {
  assert.ok(stripSrc.includes(`href="#${id}"`), `journey strip links #${id}`);
  assert.ok(workspaceSrc.includes(`id="${id}"`), `#${id} is a real section on the business page`);
}
assert.ok(workspaceSrc.includes("<ProspectJourneyStrip") && workspaceSrc.includes('id="prospect-journey"') === false, "strip is mounted once on the business page (its own id lives in the component)");
assert.ok(stripSrc.includes('resolveConciergeActionDestination("create_listing"'), "Create Ad / Listing reuses the intent resolver (→ create-for-client?businessId=)");
assert.ok(stripSrc.includes("/admin/field/${businessId}"), "Add sources & files hands off to the existing Field Agent page");
// Rendered copy only — the file's own doc comment legitimately names the forbidden claim.
const stripRendered = stripSrc.replace(/\/\*[\s\S]*?\*\//g, "");
assert.ok(!/full web|entire internet|scrape the web|toda la internet/i.test(stripRendered), "no false full-web research claim");
assert.ok(/Never .the whole web/.test(stripSrc) && /Google Places/.test(stripSrc), "research copy names the real sources and disclaims full-web research");
assert.ok(/googlePlacesAvailable/.test(stripSrc) && /providerAvailable/.test(stripSrc), "research availability is shown from real config flags, not assumed");
assert.ok(!/magazine_placements|MagazineCreativePanel/.test(stripSrc + workspaceSrc), "no fake magazine placement tool was invented");
assert.ok(!existsSync(join(ROOT, "app/admin/(dashboard)/businesses/[businessId]/BusinessIdentityPanel.tsx")), "no second identity editor was created (REAL GAP stays honest)");
assert.ok(!/from\("|await |use client/.test(stripSrc), "journey strip is pure presentation (no queries, server component)");

// 6. Reciprocal navigation ------------------------------------------------------------------------
const teamNavSrc = read("app/admin/_components/StaffTeamNav.tsx");
assert.ok(teamNavSrc.includes('href: "/admin/businesses"'), "Team nav → Business Concierge");
const dashSrc = read("app/admin/_components/AdminCommandCenterDashboard.tsx");
assert.ok(dashSrc.includes('href: "/admin/businesses"') && dashSrc.includes('href: "/admin/businesses/create-for-client"'), "Command Center → Concierge + Create for Client");
assert.ok(ownerHrefs.includes("/admin") && mgrHrefs.includes("/admin"), "Concierge → Command Center for manager/owner");
assert.ok(repHrefs.includes("/admin/team") && repHrefs.includes("/admin/guide"), "Concierge → Staff Home + Help for every role");
const fieldIdentitySrc = read("app/admin/field/FieldAgentIdentity.tsx");
assert.ok(fieldIdentitySrc.includes('href="/admin/businesses"'), "Field Agent → Concierge (already existed, still true)");

// 7. One PWA ----------------------------------------------------------------------------------------
const manifest = read("app/manifest.ts");
assert.ok(manifest.includes('start_url: "/admin/businesses"') && manifest.includes('scope: "/admin/"') && manifest.includes('id: "/admin/businesses"'), "one manifest: start_url /admin/businesses, scope /admin/");
assert.ok(read("app/layout.tsx").includes('manifest: "/manifest.webmanifest"'), "root layout references the single generated manifest");
assert.ok(!readdirSync(join(ROOT, "public")).some((n) => /manifest/i.test(n)), "no second manifest under public/");
assert.ok(existsSync(join(ROOT, "public/sw.js")) && !readdirSync(join(ROOT, "public")).some((n) => /sw.*\.js$/i.test(n) && n !== "sw.js"), "exactly one service worker file");
assert.ok(read("public/sw.js").includes('OFFLINE_URL = "/offline"') && existsSync(join(ROOT, "app/offline/page.tsx")), "offline fallback route exists");
assert.ok(commandCenterSrc.includes("<LeonixServiceWorkerRegister />"), "canonical SW registration is mounted on the PWA start page");
assert.equal((read("app/components/digitalContact/LeonixServiceWorkerRegister.tsx").match(/serviceWorker\.register\(/g) ?? []).length, 2, "registration still lives only in the canonical component (component + ensure helper)");
assert.ok(!/serviceWorker\.register/.test(commandCenterSrc + homePageSrc), "no second registration path was written");

// 8. Admin Guide entries reuse the registry and answer the day-in-the-life questions --------------
for (const id of ["create-for-client", "business-research-to-truth", "business-profile-pipeline", "manual-payment"]) {
  const entry = ADMIN_GUIDE_ENTRIES.find((e) => e.id === id);
  assert.ok(entry, `guide entry ${id} exists`);
  assert.ok(pageExists(entry!.route), `guide entry ${id} points at a real page: ${entry!.route}`);
}
assert.equal(new Set(ADMIN_GUIDE_ENTRIES.map((e) => e.id)).size, ADMIN_GUIDE_ENTRIES.length, "guide ids stay unique");
const answers: Array<[string, string]> = [
  ["create for client", "create-for-client"],
  ["research a business", "business-research-to-truth"],
  ["promo code", "promo-codes"],
  ["offline payment", "manual-payment"],
  ["entitlement", "package-entitlements"],
  ["temporary availability", "virtual-front-desk-presence"],
  ["my profile", "my-profile"],
  ["visitor video call", "virtual-front-desk-doorbell"],
  ["business profile", "business-profile-pipeline"],
  ["category application", "create-for-client"],
  ["leonix managed", "business-profile-pipeline"],
];
for (const [q, id] of answers) {
  const top = searchAdminGuide(q).slice(0, 3).map((r) => r.entry.id);
  assert.ok(top.includes(id), `guide answers "${q}" with ${id} (got ${top.join(", ")})`);
}
const manualEntry = ADMIN_GUIDE_ENTRIES.find((e) => e.id === "manual-payment")!;
assert.ok(/pending_verification/.test(manualEntry.statuses?.map((s) => s.label).join(" ") ?? "") && /super_admin/.test(manualEntry.permissionNote), "manual-payment guide teaches pending verification and the super_admin-only write");

console.log("verify-staff-operating-system-01: PASS (8 contracts)");
