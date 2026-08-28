/**
 * REMOVE-COMING-SOON-GATE-01 verification.
 *
 * Proves the owner-directed removal of the global public Coming Soon / pre-launch
 * blocker, without re-running the full admin/staff auth suite (see
 * verify-production-preview-bypass.mjs, verify-admin-staff-launch-readiness.mjs,
 * verify-staff-admin-sales-access.mjs, verify-staff-admin-supabase-activation.mjs,
 * verify-admin-staff-auth-boundary.mjs, and gate-p1-globalization-runtime-unblock-selftest.ts,
 * which already cover those areas in depth and still pass unmodified or with the
 * narrow gateRoot-assertion updates made alongside this change).
 *
 * Run: node scripts/verify-remove-coming-soon-gate.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}
function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}
function fail(msg) {
  console.error(`verify-remove-coming-soon-gate: FAIL — ${msg}`);
  process.exit(1);
}
function ok(msg) {
  console.log(`OK: ${msg}`);
}

const gateRoot = read("app/components/ComingSoonGateRoot.tsx");
const layout = read("app/layout.tsx");
const middleware = read("middleware.ts");
const publicLaunchLock = read("app/lib/launchLock/publicLaunchLock.ts");

// ---------------------------------------------------------------------------
// 1-2. Public root and normal public routes are no longer routed to Coming Soon
// ---------------------------------------------------------------------------
if (gateRoot.includes("NEXT_PUBLIC_COMING_SOON_LOCK")) {
  fail("ComingSoonGateRoot must not read the retired public launch lock flag");
}
if (/return\s*<ComingSoonGate\s*\/>/.test(gateRoot)) {
  fail("ComingSoonGateRoot must not be able to render the Coming Soon overlay");
}
if (!/return\s*<>\{children\}<\/>;/.test(gateRoot)) {
  fail("ComingSoonGateRoot must unconditionally render children");
}
if (!layout.includes("<ComingSoonGateRoot>")) {
  fail("root layout must still wrap children in ComingSoonGateRoot (contract preserved, gate retired)");
}
ok("1-2. Public root and every public route render the real site — ComingSoonGateRoot always passes through");

// ---------------------------------------------------------------------------
// 3. Preview routes are not intercepted by the launch gate
// ---------------------------------------------------------------------------
// ComingSoonGateRoot has no VERCEL_ENV / preview-specific branch at all — since it always
// renders children for every environment, Preview visitors get the exact same unblocked
// render as Production, with no separate Preview-only gate to trip.
if (/VERCEL_ENV/.test(gateRoot)) {
  fail("ComingSoonGateRoot must not reintroduce environment-conditional gating");
}
if (!/export function isPublicLaunchLockEnabled\(\): boolean \{\s*return false;\s*\}/.test(publicLaunchLock)) {
  fail("middleware's launch-lock contract must remain hardcoded off (already-retired precedent)");
}
ok("3. Preview deployments are not intercepted by the launch gate (no env-conditional branch exists)");

// ---------------------------------------------------------------------------
// 4-7. Admin, dashboard, staff-only areas, and auth routes remain protected/intact
// ---------------------------------------------------------------------------
if (!middleware.includes('req.cookies.get(ADMIN_COOKIE)?.value !== "1"')) {
  fail("middleware must still redirect unauthenticated /admin requests to /admin/login");
}
if (!middleware.includes("isPublicAdminLoginPath")) fail("admin login path handling must remain intact");
if (!exists("app/admin/_lib/adminAuthBoundary.ts")) fail("admin auth boundary module must remain intact");
if (!exists("app/admin/(dashboard)/layout.tsx") || !read("app/admin/(dashboard)/layout.tsx").includes("resolveAdminDashboardAccessDenial")) {
  fail("dashboard layout must still enforce resolveAdminDashboardAccessDenial");
}
if (!exists("app/admin/_lib/staffAdminAccess.ts")) fail("staff role-guard module must remain intact");
if (!exists("app/(site)/auth/callback")) fail("auth callback route must remain intact");
if (!publicLaunchLock.includes('"/auth/callback"')) fail("auth callback must stay allowlisted at the launch-lock layer too");
ok("4-7. Admin, dashboard, staff-only, and auth routes are untouched and still enforced by their own real mechanisms");

// ---------------------------------------------------------------------------
// 8. No public category routes were removed
// ---------------------------------------------------------------------------
const CATEGORY_DIRS = [
  "app/(site)/clasificados/comunidad",
  "app/(site)/clasificados/clases",
  "app/(site)/clasificados/mascotas-y-perdidos",
  "app/(site)/clasificados/busco",
  "app/(site)/clasificados/servicios",
  "app/(site)/clasificados/restaurantes",
  "app/(site)/clasificados/comida-local",
  "app/(site)/clasificados/ofertas-locales",
];
for (const dir of CATEGORY_DIRS) {
  if (!exists(dir)) fail(`public category route directory missing: ${dir}`);
}
ok("8. No public category routes were removed");

// ---------------------------------------------------------------------------
// 9-10. No DB migration, no Revenue OS / Stripe changes in this change's scope
// ---------------------------------------------------------------------------
{
  const changedFiles = execSync("git diff --name-only origin/main", { cwd: root, encoding: "utf8" })
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const untrackedFiles = execSync("git status --porcelain", { cwd: root, encoding: "utf8" })
    .split("\n")
    .filter((l) => l.startsWith("??"))
    .map((l) => l.slice(3).trim());
  const allTouched = [...new Set([...changedFiles, ...untrackedFiles])];

  const migrationTouched = allTouched.some((f) => f.startsWith("supabase/migrations/") || /\.sql$/i.test(f));
  if (migrationTouched) fail(`expected no DB migration files touched, found: ${allTouched.filter((f) => /migrations|\.sql$/i.test(f)).join(", ")}`);

  const protectedPrefixes = ["app/lib/listingPlans/", "app/api/revenue-os/", "app/api/clasificados/leonix/stripe/"];
  const protectedTouched = allTouched.filter((f) => protectedPrefixes.some((p) => f.startsWith(p)));
  if (protectedTouched.length > 0) fail(`expected no Revenue OS / Stripe files touched, found: ${protectedTouched.join(", ")}`);

  ok("9-10. No DB migration; no Revenue OS / Stripe files touched");
}

console.log("\nverify-remove-coming-soon-gate: all checks passed");
