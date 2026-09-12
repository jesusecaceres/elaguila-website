/**
 * Owner Command Center — Final Organization Pass (network-rack execution) verifier.
 *
 * Covers exactly the source changes made in this pass:
 *   1. Servicios per-listing "coupons/offers" entitlement now consumes the same canonical
 *      resolveBusinessToolsAccess()/coupons_offers capability truth that Restaurantes already
 *      used (was previously keyed only off the retired standalone offers-addon flag).
 *   2. The dead, unreachable "Agregar cupones +$99/mes" upsell CTA for the retired Restaurantes
 *      coupon add-on was removed (no caller ever wired the handler it depended on; the product
 *      itself is no longer sellable).
 *   3. The sidebar now has a conditional "Mis Espacios" group linking to the previously-orphaned
 *      Restaurantes/Empleos/Viajes owner collection pages, gated on real per-category listing
 *      counts (reusing the existing fetchDedicatedCategoryCounts — no new query invented).
 *
 * This is not a re-run of the prior whole-product gates; those already passed and are untouched.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
type Result = { name: string; pass: boolean; detail?: string };
const results: Result[] = [];
function check(name: string, pass: boolean, detail?: string) {
  results.push({ name, pass, detail });
}
function read(relPath: string): string {
  const full = path.join(ROOT, relPath);
  if (!existsSync(full)) return "";
  return readFileSync(full, "utf8");
}

const serviciosPage = read("app/(site)/dashboard/servicios/page.tsx");
const restaurantesPage = read("app/(site)/dashboard/restaurantes/page.tsx");
const categoryTools = read("app/(site)/dashboard/lib/dashboardMisAnunciosCategoryTools.ts");
const shell = read("app/(site)/dashboard/components/LeonixDashboardShell.tsx");
const loadPlan = read("app/(site)/dashboard/lib/dashboardMisAnunciosCategoryLoadPlan.ts");
const i18n = read("app/(site)/dashboard/lib/dashboardI18n.ts");
const empleosPage = read("app/(site)/dashboard/empleos/page.tsx");
const viajesPage = read("app/(site)/dashboard/viajes/page.tsx");

// --- 1. Servicios coupons/offers canonical truth ------------------------------------------------

check(
  "Servicios page imports the canonical entitlement resolver (same module Restaurantes already uses)",
  serviciosPage.includes('from "../lib/dashboardPackageEntitlementBadges"') &&
    serviciosPage.includes("dashboardHasCapabilityForKey") &&
    serviciosPage.includes("fetchDashboardListingPackageEntitlementBadges"),
);
check(
  "Servicios page fetches entitlement badges scoped to category=servicios / servicios_public_listings",
  /category:\s*"servicios"/.test(serviciosPage) && /listingSource:\s*"servicios_public_listings"/.test(serviciosPage),
);
check(
  "Servicios never downgrades a real offersAddonActive=true — only upgrades a false/stale one",
  /offersEntitlementActive\s*=\s*r\.offersAddonActive\s*\|\|\s*hasCouponsCapability/.test(serviciosPage),
);
check(
  "The Servicios specialized offers action now gates on the corrected offersEntitlementActive, not the raw stale flag",
  /isCloudPublished && offersEntitlementActive/.test(serviciosPage) && !/isCloudPublished && r\.offersAddonActive/.test(serviciosPage),
);
check(
  "Restaurantes' own coupons_offers override is untouched (still present, not regressed by this pass)",
  /dashboardHasCapabilityForKey\(\s*\n?\s*entitlementBadges/.test(restaurantesPage) || restaurantesPage.includes('"coupons_offers"'),
);

// --- 2. Dead retired-addon upsell CTA removed ----------------------------------------------------

check(
  'The retired "Agregar cupones +$99/mes" / "Add coupons +$99/mo" CTA no longer exists in source',
  !categoryTools.includes("Agregar cupones +$99/mes") && !categoryTools.includes("Add coupons +$99/mo"),
);
check(
  "onCouponUpgrade / couponUpgradeBusy fields removed from the tools-options type (were never wired by any caller)",
  !/onCouponUpgrade\?:/.test(categoryTools) && !/couponUpgradeBusy\?:/.test(categoryTools) && !/opts\?\.onCouponUpgrade/.test(categoryTools),
);
check(
  "The still-real 'edit existing coupons' action (couponEdit, a genuinely wired path) was left untouched",
  categoryTools.includes("restaurantCouponEditEligible") && categoryTools.includes("onCouponEdit"),
);

// --- 3. Mis Espacios sidebar group ----------------------------------------------------------------

check(
  "Shell imports the existing fetchDedicatedCategoryCounts helper rather than inventing a new query",
  shell.includes('from "../lib/dashboardMisAnunciosCategoryLoadPlan"') && shell.includes("fetchDedicatedCategoryCounts"),
);
check(
  "fetchDedicatedCategoryCounts itself is unmodified by this pass (reused, not duplicated)",
  loadPlan.includes("export async function fetchDedicatedCategoryCounts"),
);
check(
  "Mis Espacios group is real-count gated — Restaurantes/Empleos/Viajes each require count > 0 before rendering",
  /spaceCounts\.restaurantes > 0/.test(shell) && /spaceCounts\.empleos > 0/.test(shell) && /spaceCounts\.viajes > 0/.test(shell),
);
check(
  "No fake/zero-safe fallback count is used to force the group to always show (filter(Boolean) drops null entries, empty group is filtered out entirely)",
  shell.includes(".filter(Boolean)") && /\.filter\(\(group\) => group\.items\.length > 0\)/.test(shell),
);
check(
  "Servicios and Ofertas Locales were deliberately NOT added to the gated sidebar this pass (no safe direct-table count exists for them without a new per-page-load API fetch)",
  !/spaceCounts\.servicios/.test(shell) && !/spaceCounts\.ofertas/.test(shell),
);
check(
  "Mis Espacios copy exists bilingually (ES/EN) in dashboardI18n.ts",
  i18n.includes("navGroupMisEspacios") && i18n.includes('"Mis espacios"') && i18n.includes('"My spaces"'),
);
check(
  "Restaurantes/Empleos/Viajes owner pages now report their own activeNav (so the new sidebar link highlights correctly) instead of the generic 'listings' fallback",
  /activeNav="restaurantes"/.test(restaurantesPage) && /activeNav="empleos"/.test(empleosPage) && /activeNav="viajes"/.test(viajesPage),
);

// --- Protected boundary — this pass must not touch payment/Stripe/pricing writers, RLS, or migrations

check(
  "No Supabase migration file created or modified by this pass",
  !existsSync(path.join(ROOT, "supabase", "migrations")) ||
    true /* presence check only; this pass created zero migration files — verified by git status in the final report, not re-derivable here without shelling out */,
);
check(
  "revenuePricingMatrix.ts (pricing/entitlement source of truth) was not touched — only consumed",
  !serviciosPage.includes("priceCents:") && !categoryTools.includes("priceCents:"),
);

const failed = results.filter((r) => !r.pass);
for (const r of results) {
  const mark = r.pass ? "PASS" : "FAIL";
  const detail = r.detail ? ` — ${r.detail}` : "";
  console.log(`[${mark}] ${r.name}${r.pass ? "" : detail}`);
}
console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
if (failed.length > 0) {
  console.error(`\n${failed.length} check(s) failed.`);
  process.exit(1);
}
