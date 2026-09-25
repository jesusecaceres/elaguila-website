/**
 * CATEGORY CIRCUIT CLOSEOUT (2026-09) — CHECKOUT PART ONLY, ported onto the golden survivor (2026-09-25).
 *
 * The branch suite (integration/category-circuit-closeout-2026-09: scripts/verify-category-circuit-closeout.ts +
 * scripts/verify-forensic-closeout.ts) also pins Admin / dashboard / Empleos / Mascotas repairs that other ports own;
 * only its checkout, checkout-client, Comida consent and Restaurantes-publish checks are carried here, amended for
 * golden's Quick keys (isBusinessBasePackageKey) and the `businessUpgradeInPlace` exemption.
 * Behaviour (the route executed) lives in scripts/verify-final-paid-defects.ts; these are the narrow source pins.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-category-circuit-closeout-checkout.ts
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
const ROUTE = "app/api/revenue-os/checkout/route.ts";

check("checkout: rentas/FSBO/Clases base payment requires an owned, unpublished `pending` row of the right category", () => {
  const r = raw(ROUTE);
  assert.match(r, /rentas_30d: "rentas"/);
  assert.match(r, /br_fsbo_45d: "bienes-raices"/);
  assert.match(r, /clases_paid_30d: "clases"/);
  assert.match(r, /String\(lr\.status \?\? ""\)\.toLowerCase\(\) !== "pending" \|\| lr\.is_published === true/);
  assert.match(r, /isBrFsboRow\(\{ category: lr\.category, seller_type: lr\.seller_type, listing_json: lr\.listing_json \}\)/);
  assert.match(r, /operationEarly !== "renew_listing"/, "renewals keep their own validators");
  assert.ok(r.indexOf("LISTINGS_PAID_BASE_CATEGORY") < r.indexOf("createPendingPaymentRecord({"), "before payment record / Stripe");
});

check("checkout: Empleos paid post only from an owned draft; Viajes business refused (no fulfilment)", () => {
  const r = raw(ROUTE);
  assert.match(r, /empleos_listing_owner_mismatch/);
  assert.match(r, /lifecycle_status \?\? ""\)\.toLowerCase\(\) !== "draft"/);
  assert.match(r, /viajes_checkout_not_available/);
  assert.ok(r.indexOf("viajes_checkout_not_available") < r.indexOf("createRecurringConsentRecord({"));
  assert.ok(r.indexOf("viajes_checkout_not_available") < r.indexOf("createPendingPaymentRecord({"));
});

check("checkout: no second session while the first may be paid; Autos lane + inventory-child pre-flight (Quick dealer key covered)", () => {
  const r = raw(ROUTE);
  assert.match(r, /payment_in_progress/);
  assert.match(r, /checkout_state_unverifiable/);
  assert.ok(r.indexOf('code: "payment_in_progress"') < r.indexOf("await releaseStaleCheckoutAttempt(existingAttempt.id)"));
  assert.match(r, /autosRow\.lane !== expectedAutosLane \|\| autosRow\.inventory_role === "inventory_vehicle"/);
  const autos = r.slice(r.indexOf("Autos base-package pre-flight"), r.indexOf("Per-lane pre-flights"));
  assert.match(autos, /isBusinessBasePackageKey\("autos", packageDef\.packageKey\)/);
  assert.ok(autos.indexOf("autos_listing_package_mismatch") < autos.indexOf("!businessUpgradeInPlace && !isAutosListingPayableStatus"), "lane check is not exempted by an upgrade");
});

check("checkout: subscription base pre-flights cover Quick AND Full and exempt only the status check for an upgrade in place", () => {
  const r = raw(ROUTE);
  const blk = r.slice(r.indexOf("Per-lane pre-flights"), r.indexOf("const canonicalListingSource = resolveCheckoutListingSource("));
  assert.doesNotMatch(blk, /=== SERVICIOS_BASE_MONTHLY_PACKAGE_KEY|=== RESTAURANTES_BASE_MONTHLY_PACKAGE_KEY|=== BIENES_NEGOCIO_BASE_PACKAGE_KEY/, "no Full-only key gate");
  assert.equal((blk.match(/businessUpgradeInPlace/g) ?? []).length >= 2, true);
  assert.match(blk, /laneRow\.owner_user_id !== bearerUserId/, "owner check is never exempted");
  assert.match(blk, /brRow\.owner_id !== bearerUserId/);
});

check("checkout: consent row + attempt key use the server-derived canonical listing source, not body.sourceTable", () => {
  const r = raw(ROUTE);
  const consent = r.slice(r.indexOf("createRecurringConsentRecord({"), r.indexOf("createRecurringConsentRecord({") + 400);
  assert.match(consent, /listingSource: canonicalListingSource,/);
  const key = r.slice(r.indexOf("computeCheckoutAttemptKey({"), r.indexOf("computeCheckoutAttemptKey({") + 700);
  assert.match(key, /listingSource: canonicalListingSource \?\? packageDef\.category,/);
  assert.doesNotMatch(key, /body\.sourceTable/);
});

check("client: no-recharge / in-progress codes surface as an honest no-second-charge message, not a generic error", () => {
  const c = raw("app/lib/listingPlans/revenueCategoryCheckoutClient.ts");
  assert.match(c, /active_entitlement_no_recharge/);
  assert.match(c, /already_published_no_recharge/);
  assert.match(c, /No se inició ningún cobro/);
  assert.doesNotMatch(c, /Tus cambios se guardaron/);
});

check("Comida checkout forwards the recurring-billing consent", () => {
  assert.match(raw("app/(site)/clasificados/comida-local/preview/ComidaLocalPreviewClient.tsx"), /recurringConsent: ctx\.recurringConsent \?\? null/);
});

check("restaurantes: duplicate-tolerant lookup + update by primary key; new rows only as pending_payment", () => {
  const r = raw("app/api/clasificados/restaurantes/publish/route.ts");
  assert.match(r, /\.limit\(1\);\s*\n\s*const existingByDraft = \(existingRowsByDraft/);
  assert.match(r, /\.eq\("id", existingListingId as string\)/);
  assert.match(r, /if \(!pendingPayment && !isAssistedSaveForClient\) \{/);
  const f = raw("app/lib/listingPlans/revenueRestaurantFulfillment.ts");
  assert.match(f, /RESTAURANTE_ACTIVATABLE_PRE_PUBLISH_STATUSES = \[RESTAURANTE_PENDING_CHECKOUT_STATUS\] as const/);
});

if (failures.length) {
  console.error(`\n${failures.length} check(s) FAILED`);
  for (const f of failures) console.error(` - ${f}`);
  process.exit(1);
}
console.log("\nverify-category-circuit-closeout-checkout: PASS");
