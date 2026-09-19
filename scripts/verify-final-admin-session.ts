/**
 * FINAL CLOSEOUT - publication-write Admin routes and money/lifecycle server actions must re-verify admin IDENTITY,
 * not just the coarse unsigned `leonix_admin=1` marker (a raw HTTP client can send that cookie).
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-final-admin-session.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";

const failures: string[] = [];
function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK: ${name}`);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
    console.error(`FAIL: ${name}\n  ${e instanceof Error ? e.message : String(e)}`);
  }
}
const raw = (rel: string) => readFileSync(new URL(`../${rel}`, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const ROUTES = [
  "app/api/admin/autos/listings/[id]/route.ts",
  "app/api/admin/clasificados/listings/ai-review/bulk/route.ts",
  "app/api/admin/clasificados/listings/[id]/ai-review/route.ts",
  "app/api/admin/clasificados/listings/[id]/route.ts",
  "app/api/admin/comida-local/listings/[id]/route.ts",
  "app/api/admin/empleos/listings/moderate/route.ts",
  "app/api/admin/empleos/listings/[id]/route.ts",
  "app/api/admin/empleos/listings/route.ts",
  "app/api/admin/ofertas-locales/listings/[id]/route.ts",
  "app/api/admin/restaurantes/listings/[id]/route.ts",
  "app/api/admin/servicios/listings/[id]/route.ts",
  "app/api/admin/viajes/listings/[id]/route.ts",
  "app/api/admin/viajes/staged-listings/moderate/route.ts",
  "app/api/admin/viajes/staged-listings/route.ts",
  "app/api/ofertas-locales/admin/[id]/review/route.ts",
  "app/api/ofertas-locales/admin/[id]/renewals/route.ts",
  "app/lib/ofertas-locales/ofertasLocalesReviewAuth.ts",
];
const ACTIONS = [
  "app/admin/_lib/leonixAdminGate.ts",
  "app/admin/(dashboard)/workspace/clasificados/ofertas-locales/actions.ts",
  "app/admin/(dashboard)/workspace/clasificados/servicios/actions.ts",
  "app/admin/(dashboard)/workspace/package-entitlements/actions.ts",
  "app/admin/(dashboard)/workspace/promo-codes/actions.ts",
];

check("publication-write routes use the identity-verified session, never the bare cookie marker", () => {
  for (const rel of [...ROUTES, ...ACTIONS]) {
    const s = raw(rel);
    assert.match(s, /isVerifiedAdminSession\(/, `${rel} must call isVerifiedAdminSession`);
    assert.doesNotMatch(s, /requireAdminCookie\(/, `${rel} must not gate on requireAdminCookie alone`);
    assert.doesNotMatch(s, /get\("leonix_admin"\)\?\.value !== "1"/, `${rel} must not gate on the raw cookie value`);
  }
});

check("the helper delegates to the staff/bootstrap identity resolver and fails closed", () => {
  const s = raw("app/admin/_lib/adminVerifiedSession.ts");
  assert.match(s, /resolveSalesWorkspaceAccess\(jar\)/);
  assert.match(s, /catch\s*\{\s*return false;/);
  assert.match(s, /access\.ok === true/);
});

if (failures.length) {
  console.error(`\n${failures.length} check(s) FAILED`);
  process.exit(1);
}
console.log("\nALL CHECKS PASSED");
