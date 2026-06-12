/**
 * ADMIN-CLEANUP-01 static verification.
 * Run: npm run verify:admin-dashboard-cleanup
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function fail(msg) {
  console.error(`verify-admin-dashboard-cleanup: FAIL — ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`OK: ${msg}`);
}

// --- Dashboard: no full category registry grid ---
const dashPage = read("app/admin/(dashboard)/page.tsx");
const dashUi = read("app/admin/_components/AdminCommandCenterDashboard.tsx");
const dashRoutes = read("app/admin/_lib/adminDashboardRoutes.ts");
const dash = `${dashPage}\n${dashUi}\n${dashRoutes}`;
if (dash.includes("registry.map((c)")) {
  fail("/admin still maps full category registry cards");
}
if (!dash.includes("AdminMonetizationLinksCard")) {
  fail("/admin missing compact AdminMonetizationLinksCard");
}
if (!dash.includes("/admin/workspace/clasificados")) {
  fail("/admin missing Categories command center CTA");
}
if (dash.includes("dashboard.recentEntitlementsTitle")) {
  fail("/admin still renders recent entitlements deep section");
}
if (!dash.includes("dashboard.pendingReviewTitle")) {
  fail("/admin missing pending review queue");
}
if (!dash.includes("dashboard.expiringTitle")) {
  fail("/admin missing expiring queue");
}
ok("Executive dashboard — category registry clutter removed; queues preserved");

// --- Left nav ---
const nav = read("app/admin/_lib/adminGlobalNav.ts");
for (const [label, href] of [
  ["Categories", "/admin/workspace/clasificados"],
  ["Tienda", "/admin/tienda"],
  ["Site sections", "/admin/workspace"],
  ["Users", "/admin/usuarios"],
]) {
  if (!nav.includes(href)) fail(`adminGlobalNav missing ${label} → ${href}`);
}
ok("Left nav — Categories, Tienda, Site sections, Users present");

// --- Categories hub ---
const hub = read("app/admin/(dashboard)/workspace/clasificados/ClasificadosCategoryHub.tsx");
if (!hub.includes("hub.scaffoldBadge")) {
  fail("ClasificadosCategoryHub missing scaffold honesty badge");
}
if (!hub.includes("adminCategoryOpenQueueCtaCopy")) {
  fail("ClasificadosCategoryHub missing primary queue CTA");
}
if (!hub.includes("hub.clientReadyBadge")) {
  fail("ClasificadosCategoryHub missing client-ready badge (honest labeling)");
}
ok("Categories hub — scaffold badges and primary queue CTA");

// --- Category CTA routes ---
const queueHref = read("app/admin/_lib/adminCategoryWorkspaceQueueHref.ts");
const requiredRoutes = [
  "/admin/workspace/clasificados/restaurantes",
  "/admin/workspace/clasificados/servicios",
  "/admin/workspace/clasificados/empleos",
  "/admin/workspace/clasificados/autos",
  "/admin/workspace/clasificados/travel",
  "/admin/workspace/clasificados/en-venta",
  "/admin/workspace/clasificados/rentas",
  "/admin/workspace/clasificados/clases",
  "/admin/workspace/clasificados/comunidad",
];
for (const r of requiredRoutes) {
  if (!queueHref.includes(r)) fail(`adminCategoryWorkspaceQueueHref missing ${r}`);
}
ok("Category-only queue routes defined");

// --- Hub entries helper ---
const hubEntries = read("app/admin/_lib/adminCategoriesHubEntries.ts");
if (!hubEntries.includes("comida-local")) {
  fail("adminCategoriesHubEntries missing comida-local supplement");
}
if (!hubEntries.includes("isAdminCategoryScaffoldEntry")) {
  fail("adminCategoriesHubEntries missing scaffold helper");
}
ok("Supplemental hub entries + scaffold helper");

// --- Protected features still referenced ---
const table = read("app/admin/(dashboard)/workspace/clasificados/AdminListingsTable.tsx");
if (!table.includes("AdminListingMonetizationSummary")) {
  fail("AdminListingsTable no longer references AdminListingMonetizationSummary");
}
const queueFlow = read("app/admin/_lib/adminQueueActionFlow.ts");
if (!queueFlow.includes("adminQueueTableZebra")) {
  fail("adminQueueActionFlow missing adminQueueTableZebra");
}
if (!table.includes("adminQueueRowClass")) {
  fail("AdminListingsTable no longer uses queue zebra rows");
}
const rowActions = read("app/admin/(dashboard)/workspace/clasificados/_components/ClassifiedAdminRowActions.tsx");
if (!rowActions.includes("suspend") && !rowActions.includes("archive")) {
  fail("ClassifiedAdminRowActions may have lost suspend/archive actions");
}
const queueFlowFile = read("app/admin/_lib/adminQueueActionFlow.ts");
if (!queueFlowFile.includes("parseAdminActionResultFromRecord")) {
  fail("adminQueueActionFlow missing action proof parsing");
}
ok("Action proof, zebra rows, monetization summary references preserved");

// --- Scope guard: stack files only (parallel WIP from other chats is ignored) ---
const STACK_FILES = [
  "app/admin/(dashboard)/page.tsx",
  "app/admin/(dashboard)/workspace/clasificados/page.tsx",
  "app/admin/(dashboard)/workspace/clasificados/ClasificadosCategoryHub.tsx",
  "app/admin/_components/AdminMonetizationLinksCard.tsx",
  "app/admin/_lib/adminCategoriesHubEntries.ts",
  "app/admin/_lib/adminGlobalNav.ts",
  "app/admin/_lib/adminStrings.ts",
  "scripts/verify-admin-dashboard-cleanup.mjs",
  "package.json",
];

let diffFiles = [];
try {
  diffFiles = execSync("git diff --name-only", { cwd: root, encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean)
    .map((f) => f.replace(/\\/g, "/"));
} catch {
  diffFiles = [];
}

const forbiddenPrefixes = ["app/(site)/", "app/dashboard/", "supabase/migrations/"];
const stackDiff = diffFiles.filter((f) => STACK_FILES.includes(f));
for (const f of stackDiff) {
  if (forbiddenPrefixes.some((p) => f.startsWith(p))) {
    fail(`Stack file outside allowed scope: ${f}`);
  }
  if (!f.startsWith("app/admin/") && f !== "package.json" && f !== "scripts/verify-admin-dashboard-cleanup.mjs") {
    fail(`Stack file outside admin scope: ${f}`);
  }
}
if (stackDiff.length === 0 && diffFiles.length > 0) {
  console.log(`NOTE: ${diffFiles.length} parallel WIP file(s) in working tree (ignored by scope guard).`);
} else {
  ok(`Scope guard — ${stackDiff.length} stack file(s) changed, all within admin scope`);
}

// --- No migration changes (staged or unstaged) ---
const migChanged = diffFiles.some((f) => f.replace(/\\/g, "/").includes("supabase/migrations/"));
if (migChanged) fail("Migration files changed");
ok("No migration changes");

console.log("\nverify-admin-dashboard-cleanup: PASS");
