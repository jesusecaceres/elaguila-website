/**
 * Servicios Final Consolidated Lifecycle Execution — Gate 15 (public detail Golden parity —
 * offers authority divergence, 2026-09-18).
 *
 * The public profile page already resolved coupons/promotions visibility from the real
 * server-verified `coupons_offers` capability (`resolveBusinessToolsAccess`, the same authority
 * the publish route enforces). Listing-bound Preview instead used `appState.couponsAddOn`, a
 * client-side flag INFERRED from stored profile content on hydration
 * (`inferCouponsAddOnFromProfile`) — not real entitlement truth. A listing whose package had
 * lapsed but still had old coupon content saved, or whose content hadn't caught up to a newly
 * granted capability, could show coupons/promotions in Preview that the published page would not
 * show (or vice versa) — the confirmed "offers authority divergence" this gate targets.
 *
 * Fix: the my-listing API route (already the sole listing-bound hydration source for both
 * dashboard-edit and Preview) now also resolves and returns the same real `coupons_offers`
 * capability truth. Preview uses it (not `appState.couponsAddOn`) to decide whether to render
 * coupons/promotions for a listing-bound row; a fresh, not-yet-persisted application (no real
 * entitlement to check yet) keeps using the owner's own selection, unchanged.
 *
 * The exhaustive cross-surface visual parity proof (identity/category/services/custom prose/
 * Translate/Call/Message/WhatsApp/Email sheet/native Share/gallery/hours/address privacy/Maps/
 * website-socials/Community Leonix) is a live runtime verification task — Gate 21's scope, not
 * achievable by static source inspection. This gate's source-level scope is the one confirmed,
 * named defect: offers authority.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-exec-gate15-offers-authority-parity.ts
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
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}
const raw = (rel: string) =>
  stripComments(readFileSync(new URL(`../${rel}`, import.meta.url), "utf8").replace(/\r\n/g, "\n"));

const MY_LISTING_ROUTE = "app/api/clasificados/servicios/my-listing/route.ts";
const HYDRATION = "app/(site)/clasificados/publicar/servicios/lib/serviciosPublishedToApplicationDraft.ts";
const PREVIEW = "app/(site)/clasificados/publicar/servicios/preview/ClasificadosServiciosPreviewClient.tsx";
const PUBLIC_PAGE = "app/(site)/clasificados/servicios/[slug]/page.tsx";

check("the my-listing route resolves the SAME coupons_offers capability the publish route and public page use", () => {
  const src = raw(MY_LISTING_ROUTE);
  assert.ok(src.includes('import { resolveBusinessToolsAccess } from "@/app/lib/listingPlans/categoryCommercialPlan";'));
  const idx = src.indexOf("const offersEntitled =");
  assert.ok(idx > 0);
  const block = src.slice(idx, idx + 400);
  assert.ok(block.includes('category: "servicios",'));
  assert.ok(block.includes('listingSource: "servicios_public_listings",'));
  assert.ok(block.includes('capability: "coupons_offers",'));
  assert.ok(src.includes("offers_entitled: offersEntitled,"), "must be returned on the response");
});

check("REGRESSION GUARD: the public profile page's own resolution of the same capability is untouched", () => {
  const src = raw(PUBLIC_PAGE);
  assert.ok(src.includes('import { resolveBusinessToolsAccess } from "@/app/lib/listingPlans/categoryCommercialPlan";'));
  assert.ok(src.includes('capability: "coupons_offers",'));
});

check("Preview's listing-bound profile uses the real server-resolved capability, not the content-inferred intent flag", () => {
  const src = raw(PREVIEW);
  assert.ok(src.includes("setListingBoundOffersEntitled(data.listing.offers_entitled === true);"));
  const idx = src.indexOf("const offersEntitled = listingBoundPreview ? listingBoundOffersEntitled === true : appState.couponsAddOn;");
  assert.ok(idx > 0, "must branch on listingBoundPreview to prefer real entitlement truth");
});

check("REGRESSION GUARD: a fresh (non listing-bound) application preview still uses the owner's own selection (no real entitlement exists yet)", () => {
  const src = raw(PREVIEW);
  assert.ok(src.includes(": appState.couponsAddOn;"));
});

check("REGRESSION GUARD: the hydration type/mapper is additive only — inferCouponsAddOnFromProfile (still used for the form's own toggle state) is untouched", () => {
  const src = raw(HYDRATION);
  assert.ok(src.includes("offers_entitled?: boolean;"));
  assert.ok(src.includes("const couponsAddOn = inferCouponsAddOnFromProfile(profile);"));
});

if (failures.length) {
  console.error(`\nverify-servicios-exec-gate15-offers-authority-parity: ${failures.length} failure(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nverify-servicios-exec-gate15-offers-authority-parity: PASS");
