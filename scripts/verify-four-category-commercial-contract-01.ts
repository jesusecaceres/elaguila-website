/**
 * FOUR-CATEGORY COMMERCIAL CONTRACT (owner lock 2026-09-24): Servicios, Restaurantes, Autos Dealer,
 * Bienes Negocio — BASE ($249) and PRO ($399) share ONE application, ONE listing row and ONE public
 * presentation; they differ ONLY in commercial entitlement.
 *
 * Executes the real pure policies + the real media contract (no mocks of the decision under test), and
 * pins the seams to source. The "real rows" below are the EXACT rows read from the canonical database
 * on 2026-09-24 (autos-mechanics / restaurant 12582849… / cd914354…), with the Stripe evidence
 * (subscription active, invoices paid Aug 13 and Sep 13) that proves the entitlement rows went stale
 * only because renewals were never reconciled.
 *
 * Run: node node_modules/tsx/dist/cli.mjs --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-four-category-commercial-contract-01.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import {
  decideBusinessToolsAccess,
  decideCategoryListingPlan,
  type EntitlementRowFacts,
} from "../app/lib/listingPlans/categoryCommercialPlanPolicy";
import { decideLegacySubscriptionAdoption } from "../app/lib/listingPlans/legacySubscriptionAdoption";
import { getRevenuePackageDefinition } from "../app/lib/listingPlans/revenuePricingMatrix";
import {
  AUTOS_DEALER_BASE_INCLUDED_VEHICLES,
  AUTOS_DEALER_INVENTORY_PACK_ADDITIONAL_VEHICLES,
  AUTOS_DEALER_INVENTORY_PACK_PACKAGE_KEY,
  AUTOS_DEALER_QUICK_INCLUDED_VEHICLES,
  AUTOS_DEALER_TOTAL_WITH_INVENTORY_PACK_LIMIT,
  BR_INVENTORY_PACK_PACKAGE_KEY,
} from "../app/lib/listingPlans/publishCheckoutCheckpoint";
import {
  QUICK_DEALER_ACTIVE_VEHICLE_LIMIT,
  resolveDealerActiveVehicleLimit,
  STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT,
  summarizeDealerInventory,
} from "../app/lib/clasificados/autos/autosDealerInventoryPolicy";
import { applicationCanAddInventoryVehicle, countApplicationInventoryVehicles } from "../app/lib/clasificados/autos/autosAdditionalInventoryDraft";
import { decideCommercialWrite } from "../app/lib/listingPlans/commercialWriteGuardPolicy";
import { validateNegociosApplicationPublishInventory } from "../app/lib/clasificados/autos/autosDealerInventoryApplicationPublishGuard";
import {
  quickDealerInventoryAddonRefusal,
  stripQuickDealerFullOnlyFields,
} from "../app/lib/clasificados/autos/stripQuickDealerFullOnlyFields";
import { quickBienesInventoryAddonRefusal } from "../app/lib/clasificados/bienes-raices/stripQuickBienesFullOnlyFields";
import {
  QUICK_BUSINESS_MAX_IMAGES_BY_CATEGORY,
  enforceQuickBusinessPublishMedia,
  quickImageMaxForBusinessCategory,
  type SemanticMediaItem,
} from "../app/lib/quickBusiness/quickBusinessMediaSemantics";
import { quickContractAppliesTo, resolveQuickBusinessProduct } from "../app/lib/listingPlans/quickBusinessProductIdentity";
import { BUSINESS_CATEGORY_PACKAGE_PAIR } from "../app/lib/listingPlans/businessAccessLevel";
import { validateRevenueCheckoutAddOns } from "../app/lib/listingPlans/revenueCheckout";

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
const raw = (rel: string) => readFileSync(rel, "utf8").replace(/\r\n/g, "\n");

const NOW = Date.parse("2026-09-24T18:00:00Z");
const row = (o: Partial<EntitlementRowFacts> & { packageKey: string | null }): EntitlementRowFacts => ({
  id: "e",
  grantSource: "stripe_webhook",
  packageTier: "digital_only",
  status: "active",
  startsAt: "2026-07-13T16:23:21Z",
  endsAt: null,
  ...o,
});
const plan = (category: string, rows: EntitlementRowFacts[], override?: "grace" | "suspended" | null) =>
  decideCategoryListingPlan({ category, rows, nowMs: NOW, subscriptionOverride: override ?? null });
const coupons = (category: string, rows: EntitlementRowFacts[], override?: "grace" | "suspended" | null) =>
  decideBusinessToolsAccess({ plan: plan(category, rows, override), capability: "coupons_offers" });

// ------------------------------------------------------------------------------------------------
// SERVICIOS + RESTAURANTES — coupons are PRO-only; PRO includes them; BASE never inherits them
// ------------------------------------------------------------------------------------------------
for (const [category, base, quick, addon] of [
  ["servicios", "servicios_base_monthly", "servicios_quick_monthly", "servicios_offers_addon"],
  ["restaurantes", "restaurantes_base_monthly", "restaurantes_quick_monthly", "restaurantes_offers_addon"],
] as const) {
  check(`${category}: matrix — PRO declares coupons_offers + full; BASE declares none + simple`, () => {
    assert.deepEqual(getRevenuePackageDefinition(base)?.capabilities, ["coupons_offers"]);
    assert.equal(getRevenuePackageDefinition(base)?.businessAccessLevel, "full");
    assert.equal(getRevenuePackageDefinition(base)?.priceCents, 39900);
    assert.deepEqual(getRevenuePackageDefinition(quick)?.capabilities, []);
    assert.equal(getRevenuePackageDefinition(quick)?.businessAccessLevel, "simple");
    assert.equal(getRevenuePackageDefinition(quick)?.priceCents, 24900);
  });
  check(`${category}: a live PRO grant (Stripe / manual cleared / admin) allows coupons; BASE denies them`, () => {
    for (const grantSource of ["stripe_webhook", "manual_cleared_payment", "admin_manual"]) {
      assert.equal(coupons(category, [row({ packageKey: base, grantSource, endsAt: "2026-10-20T00:00:00Z" })]).allowed, true, grantSource);
    }
    const b = coupons(category, [row({ packageKey: quick, endsAt: "2026-10-20T00:00:00Z" })]);
    assert.equal(b.allowed, false, "BASE never inherits coupons merely because it shares the application");
    assert.equal(b.plan.packageKey, quick, "and BASE is a real, honest plan (not 'none')");
  });
  check(`${category}: overlapping BASE + PRO resolves PRO in any order; an upgrade never reads as a downgrade`, () => {
    const q = row({ id: "q", packageKey: quick, endsAt: "2026-10-20T00:00:00Z" });
    const f = row({ id: "f", packageKey: base, endsAt: "2026-10-20T00:00:00Z" });
    assert.equal(coupons(category, [q, f]).allowed, true);
    assert.equal(coupons(category, [f, q]).allowed, true);
    assert.equal(plan(category, [q, f]).packageKey, base);
  });
  check(`${category}: expired / suspended fail closed with the honest reason; a legacy $79 holder keeps compatibility`, () => {
    const past = row({ packageKey: base, endsAt: "2026-08-12T16:23:21Z" });
    const expired = coupons(category, [past]);
    assert.equal(expired.allowed, false);
    assert.equal(expired.reasonCode, "expired");
    const suspended = coupons(category, [row({ packageKey: base, endsAt: "2026-10-20T00:00:00Z" })], "suspended");
    assert.equal(suspended.allowed, false);
    assert.equal(suspended.reasonCode, "suspended");
    const grace = coupons(category, [row({ packageKey: base, endsAt: "2026-10-20T00:00:00Z" })], "grace");
    assert.equal(grace.allowed, true, "paid access stays usable through grace");
    const legacy = coupons(category, [row({ packageKey: addon, endsAt: "2026-10-20T00:00:00Z" })]);
    assert.equal(legacy.allowed, true);
    assert.equal(legacy.reasonCode, "legacy_addon_entitlement");
    assert.equal(legacy.plan.packageKey, addon, "honest: never fabricated as the base package");
  });
}

// ------------------------------------------------------------------------------------------------
// THE PROVEN DEFECT — real rows, real Stripe evidence
// ------------------------------------------------------------------------------------------------
const STRIPE_PERIOD_END_MS = 1791908594 * 1000; // sub_1TsmdU… current_period_end (2026-10-13)
const STRIPE_SUB = "sub_1TsmdURxP2tafN4zMmw9g6I0";
const PAYMENT_ID = "d1ce7075-724a-4d6a-a59c-9da4a562cc9d";
const LISTING_ID = "ef6977d5-d280-44d4-a986-bf94e371a565";
const realBase = row({ id: "59ef2691", packageKey: "servicios_base_monthly", status: "active", startsAt: "2026-07-13T16:23:21.448Z", endsAt: "2026-08-12T16:23:21.448Z" });
const realAddon = row({ id: "9d7977ee", packageKey: "servicios_offers_addon", status: "active", startsAt: "2026-07-13T16:23:23.065Z", endsAt: "2026-08-12T16:23:23.065Z" });

check("real Servicios PRO listing: the STALE rows read 'expired' (the exact warning the owner saw) — the resolver was honest", () => {
  const d = coupons("servicios", [realBase, realAddon]);
  assert.equal(d.allowed, false);
  assert.equal(d.reasonCode, "expired");
  const copy = raw("app/lib/listingPlans/enableIncludedCapabilityClient.ts");
  assert.ok(/code === "no_qualifying_package" \|\| code === "expired"[\s\S]{0,140}Activa o renueva tu plan base/.test(copy), "expired -> the 'activate or renew' copy");
});
check("real Servicios PRO listing: once renewals are reconciled to Stripe's paid-through period the coupons capability is recognised", () => {
  const endsAt = new Date(STRIPE_PERIOD_END_MS + 7 * 86_400_000).toISOString();
  const d = coupons("servicios", [{ ...realBase, endsAt }, { ...realAddon, endsAt }]);
  assert.equal(d.allowed, true);
  assert.equal(d.reasonCode, "active_package");
  assert.equal(d.plan.packageKey, "servicios_base_monthly", "canonical PRO wins over the retired add-on row");
});
const metadata = {
  leonix_payment_record_id: PAYMENT_ID,
  leonix_category: "servicios",
  leonix_listing_id: LISTING_ID,
  leonix_package_key: "servicios_base_monthly",
  leonix_owner_user_id: "086b3ea8-f6bb-4353-96a3-919f801bdd16",
};
const payment = {
  id: PAYMENT_ID,
  category: "servicios",
  listingId: LISTING_ID,
  packageKey: "servicios_base_monthly",
  paymentStatus: "paid",
  stripeSubscriptionId: STRIPE_SUB,
  ownerUserId: "086b3ea8-f6bb-4353-96a3-919f801bdd16",
};
const ents = [
  { id: "59ef2691", category: "servicios", listingId: LISTING_ID, packageKey: "servicios_base_monthly", grantSource: "stripe_webhook", status: "active", paymentRecordId: PAYMENT_ID, subscriptionRecordId: null },
  { id: "9d7977ee", category: "servicios", listingId: LISTING_ID, packageKey: "servicios_offers_addon", grantSource: "stripe_webhook", status: "active", paymentRecordId: PAYMENT_ID, subscriptionRecordId: null },
];
const adopt = (over: Partial<Parameters<typeof decideLegacySubscriptionAdoption>[0]> = {}) =>
  decideLegacySubscriptionAdoption({ stripeSubscriptionId: STRIPE_SUB, stripeStatus: "active", metadata, payment, entitlements: ents, ...over });

check("adoption: the real legacy subscription is adopted from PAYMENT evidence, with its add-on row as a companion", () => {
  const d = adopt();
  assert.equal(d.adopt, true);
  if (d.adopt) {
    assert.equal(d.entitlementId, "59ef2691");
    assert.deepEqual(d.companionEntitlementIds, ["9d7977ee"]);
    assert.equal(d.listingId, LISTING_ID);
    assert.equal(d.packageKey, "servicios_base_monthly");
  }
});
check("adoption refuses anything short of real payment evidence (no fabrication from metadata, status, URL or owner)", () => {
  const reason = (d: ReturnType<typeof adopt>) => (d.adopt ? "ADOPTED" : d.reason);
  assert.equal(reason(adopt({ payment: null })), "payment_record_missing");
  assert.equal(reason(adopt({ payment: { ...payment, paymentStatus: "pending" } })), "payment_not_paid");
  assert.equal(reason(adopt({ payment: { ...payment, paymentStatus: "canceled" } })), "payment_not_paid");
  assert.equal(reason(adopt({ payment: { ...payment, stripeSubscriptionId: "sub_someone_else" } })), "payment_subscription_mismatch");
  assert.equal(reason(adopt({ payment: { ...payment, listingId: "another-listing" } })), "payment_identity_mismatch");
  assert.equal(reason(adopt({ payment: { ...payment, packageKey: "servicios_quick_monthly" } })), "payment_identity_mismatch");
  assert.equal(reason(adopt({ metadata: { ...metadata, leonix_payment_record_id: "" } })), "metadata_incomplete");
  assert.equal(reason(adopt({ metadata: { ...metadata, leonix_listing_id: "forged-other-listing" } })), "payment_identity_mismatch");
  assert.equal(reason(adopt({ stripeStatus: "canceled" })), "subscription_not_active");
  assert.equal(reason(adopt({ stripeStatus: "past_due" })), "subscription_not_active");
  assert.equal(reason(adopt({ entitlements: [] })), "no_matching_entitlement");
  assert.equal(reason(adopt({ entitlements: ents.map((e) => ({ ...e, status: "revoked" })) })), "entitlement_revoked");
  assert.equal(reason(adopt({ entitlements: [...ents, { ...ents[0]!, id: "dup" }] })), "ambiguous_entitlement");
});
check("adoption cannot upgrade BASE to PRO or create rows: a BASE payment can only adopt a BASE entitlement", () => {
  const quickMeta = { ...metadata, leonix_package_key: "servicios_quick_monthly" };
  const quickPay = { ...payment, packageKey: "servicios_quick_monthly" };
  const d = adopt({ metadata: quickMeta, payment: quickPay });
  assert.equal(d.adopt, false, "no PRO row exists for a BASE payment, so nothing is adopted or fabricated");
  const src = raw("app/lib/listingPlans/legacySubscriptionAdoption.ts");
  assert.ok(!/\.insert\(|\.upsert\(/.test(src), "the pure decision never writes");
});
check("wiring: invoice.paid adopts before ignoring; the admin reconcile route is guarded, dry-run by default, and never writes on scan", () => {
  const ev = raw("app/lib/listingPlans/revenueSubscriptionEvents.ts");
  assert.ok(/await loadSubscriptionRecord\(stripeSubscriptionId\);\s*if \(!record\) \{\s*const adopted = await adoptLegacySubscriptionRecord\(stripeSubscriptionId\);/.test(ev), "invoice.paid adopts before ignoring");
  assert.ok(/adopted\.kind === "retryable"\) return \{ ok: false, outcome: "failed_retryable"/.test(ev), "a Stripe outage is retryable, never a silent ignore");
  assert.ok(ev.includes("decideLegacySubscriptionAdoption("), "the impure layer only asks the pure decision");
  assert.ok(ev.includes("companion_entitlement_ids"), "a companion row renews with its subscription");
  const route = raw("app/api/admin/revenue-os/reconcile-legacy-subscriptions/route.ts");
  assert.ok(route.includes("requireRevenueProtectedWriteAccess()"), "staff identity re-verified per request");
  assert.ok(route.includes("const dryRun = body.dryRun !== false;"), "a write needs an explicit dryRun:false");
  assert.ok(/Scan: never writes/.test(route));
});

// ------------------------------------------------------------------------------------------------
// AUTOS DEALER — BASE 5 / PRO 10 / +10 pack for PRO only
// ------------------------------------------------------------------------------------------------
const PAIR_AUTOS = BUSINESS_CATEGORY_PACKAGE_PAIR.autos!;
check("autos: matrix — BASE 5 active vehicles / no pack; PRO 10 + the +10 pack ($129)", () => {
  const quick = getRevenuePackageDefinition("autos_dealer_quick_monthly")!;
  const full = getRevenuePackageDefinition("autos_dealer_monthly")!;
  const pack = getRevenuePackageDefinition(AUTOS_DEALER_INVENTORY_PACK_PACKAGE_KEY)!;
  assert.equal(quick.includedInventory, "5 active vehicles");
  assert.equal(quick.addOnInventory, null);
  assert.equal(quick.priceCents, 24900);
  assert.equal(full.includedInventory, "10 active vehicles");
  assert.equal(full.priceCents, 39900);
  assert.equal(pack.priceCents, 12900);
  assert.equal(pack.includedInventory, "+10 additional active vehicles");
  assert.equal(AUTOS_DEALER_QUICK_INCLUDED_VEHICLES, 5);
  assert.equal(Number(/\d+/.exec(quick.includedInventory)![0]), AUTOS_DEALER_QUICK_INCLUDED_VEHICLES, "the string and the constant cannot drift");
  assert.equal(AUTOS_DEALER_BASE_INCLUDED_VEHICLES, 10);
  assert.equal(AUTOS_DEALER_INVENTORY_PACK_ADDITIONAL_VEHICLES, 10);
  assert.equal(AUTOS_DEALER_TOTAL_WITH_INVENTORY_PACK_LIMIT, 20);
  assert.equal(PAIR_AUTOS.simple, "autos_dealer_quick_monthly");
  assert.equal(PAIR_AUTOS.full, "autos_dealer_monthly");
});
check("autos: limits — BASE 5 (a stray pack never lifts it); PRO 10; PRO + pack 20", () => {
  assert.equal(QUICK_DEALER_ACTIVE_VEHICLE_LIMIT, 5);
  assert.equal(resolveDealerActiveVehicleLimit(false, { quick: true }), 5);
  assert.equal(resolveDealerActiveVehicleLimit(true, { quick: true }), 5);
  assert.equal(resolveDealerActiveVehicleLimit(false), STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT);
  assert.equal(STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT, 10);
  assert.equal(resolveDealerActiveVehicleLimit(true), 20);
});
check("autos: server capacity — BASE vehicles #1–#5 allowed, #6 refused with the honest upgrade copy; PRO #1–#10 allowed, #11 needs the pack", () => {
  const write = (activeCount: number, limit: number) =>
    decideCommercialWrite({ operation: "create_child_vehicle" as never, capacityDelta: 1, activeCount, limit, subscriptionStatus: "active" });
  for (let n = 0; n < 5; n += 1) assert.equal(write(n, QUICK_DEALER_ACTIVE_VEHICLE_LIMIT).allowed, true, `BASE vehicle #${n + 1}`);
  const sixth = write(5, QUICK_DEALER_ACTIVE_VEHICLE_LIMIT);
  assert.equal(sixth.allowed, false, "BASE vehicle #6 refused");
  for (let n = 0; n < 10; n += 1) assert.equal(write(n, STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT).allowed, true, `PRO vehicle #${n + 1}`);
  assert.equal(write(10, STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT).allowed, false, "PRO vehicle #11 without the pack");
  assert.equal(write(10, AUTOS_DEALER_TOTAL_WITH_INVENTORY_PACK_LIMIT).allowed, true, "PRO + pack allows #11");
  assert.equal(write(19, AUTOS_DEALER_TOTAL_WITH_INVENTORY_PACK_LIMIT).allowed, true);
  assert.equal(write(20, AUTOS_DEALER_TOTAL_WITH_INVENTORY_PACK_LIMIT).allowed, false);
  const guard = raw("app/lib/listingPlans/commercialWriteGuard.ts");
  assert.ok(/quickDealer\s*\n?\s*\? QUICK_DEALER_ACTIVE_VEHICLE_LIMIT/.test(guard), "the server guard uses the BASE limit for a PROVEN BASE dealer only");
  assert.ok(guard.includes("Upgrade to PRO to add more vehicles"), "the refusal is honest: BASE cannot buy the pack");
});
check("autos: application publish guard — BASE capped at 5 (the pack never lifts it); PRO 10 needs the boost past 10", () => {
  const v = (totalVehicles: number, boostActive: boolean, quick?: boolean) =>
    validateNegociosApplicationPublishInventory({ totalVehicles, boostActive, lang: "en", quick });
  assert.equal(v(5, false, true).ok, true);
  const six = v(6, false, true);
  assert.equal(six.ok, false);
  if (!six.ok) assert.equal(six.error, "dealer_quick_inventory_limit");
  assert.equal(v(6, true, true).ok, false, "a stray pack does not lift BASE");
  assert.equal(v(10, false).ok, true);
  assert.equal(v(11, false).ok, false);
  assert.equal(v(20, true).ok, true);
});
check("autos: BASE inventory is CAPPED at the allowance (not stripped); stored history is never destroyed", () => {
  const many = { additionalInventoryVehicles: Array.from({ length: 7 }, (_, i) => ({ id: `v${i}` })), dealerWebsite: "https://d.example.com" };
  const decision = { product: "quick", source: "live_entitlement" } as const;
  const out = stripQuickDealerFullOnlyFields({ listing: many, existing: null, decision });
  assert.equal((out.listing as typeof many).additionalInventoryVehicles.length, 4, "main vehicle + 4 additional = 5");
  assert.equal((out.listing as typeof many).dealerWebsite, "https://d.example.com");
  const few = stripQuickDealerFullOnlyFields({ listing: { additionalInventoryVehicles: [{ id: "a" }] }, existing: null, decision });
  assert.equal((few.listing as { additionalInventoryVehicles: unknown[] }).additionalInventoryVehicles.length, 1);
  const full = stripQuickDealerFullOnlyFields({ listing: many, existing: null, decision: { product: "full", source: "live_entitlement" } });
  assert.equal((full.listing as typeof many).additionalInventoryVehicles.length, 7, "PRO is untouched");
  const fulfill = raw("app/lib/listingPlans/revenueAutosDealerFulfillment.ts");
  assert.ok(/quickDealerPaid\s*\?\s*stagedChildren\.slice\(0, Math\.max\(0, AUTOS_DEALER_QUICK_INCLUDED_VEHICLES - 1\)\)/.test(fulfill));
});
check("autos: BASE can NEVER buy the +10 pack — bundled with a BASE checkout, standalone on a BASE parent, or with a forged key", () => {
  const packItem = [{ key: AUTOS_DEALER_INVENTORY_PACK_PACKAGE_KEY, quantity: 1 }];
  const withQuick = validateRevenueCheckoutAddOns({ category: "autos", basePackageKey: PAIR_AUTOS.simple, addOns: packItem });
  assert.equal(withQuick.ok, false);
  if (!withQuick.ok) assert.equal(withQuick.code, "add_ons_not_supported");
  const withFull = validateRevenueCheckoutAddOns({ category: "autos", basePackageKey: PAIR_AUTOS.full, addOns: packItem });
  assert.equal(withFull.ok, true, "PRO + pack is allowed");
  const forged = validateRevenueCheckoutAddOns({ category: "autos", basePackageKey: PAIR_AUTOS.simple.toUpperCase(), addOns: packItem });
  assert.equal(forged.ok, false, "case games do not bypass the allowlist");
  const proven = { product: "quick", source: "live_entitlement" } as const;
  assert.ok(quickDealerInventoryAddonRefusal(proven), "standalone dashboard pack on a PROVEN BASE parent is refused");
  assert.equal(quickDealerInventoryAddonRefusal({ product: "full", source: "live_entitlement" }), null);
  assert.equal(quickDealerInventoryAddonRefusal({ product: "unverified", source: "none" }), null, "unverified is never blocked on a guess");
  const checkout = raw("app/lib/listingPlans/revenueCheckout.ts");
  const validator = checkout.slice(checkout.indexOf("export async function validateAutosDealerInventoryAddonOwnership"));
  assert.ok(validator.includes("quickDealerInventoryAddonRefusal(parentProduct)"), "the standalone path resolves the PARENT's product server-side");
  assert.ok(!/searchParams|nextUrl|\.plan\b/.test(validator.slice(0, validator.indexOf("export type BienesInventoryAddonOwnerValidationResult"))), "no URL / plan input");
});

// ------------------------------------------------------------------------------------------------
// BIENES NEGOCIO — BASE: 1 property, up to 8 REAL property photos, no video, no pack; PRO keeps its pack
// ------------------------------------------------------------------------------------------------
const PAIR_BR = BUSINESS_CATEGORY_PACKAGE_PAIR["bienes-raices"]!;
const prop = (n: number): SemanticMediaItem[] => Array.from({ length: n }, () => ({ role: "property", mime: "image/jpeg" }));
const media = (items: SemanticMediaItem[], externalVideoCount = 0) =>
  enforceQuickBusinessPublishMedia({ category: "bienes-negocio", items, externalVideoCount });
check("bienes: matrix — BASE 1 active property / no pack; PRO keeps the +3 pack ($99)", () => {
  const quick = getRevenuePackageDefinition("br_agent_quick_monthly")!;
  const full = getRevenuePackageDefinition("br_agent_monthly")!;
  const pack = getRevenuePackageDefinition(BR_INVENTORY_PACK_PACKAGE_KEY)!;
  assert.equal(quick.includedInventory, "1 active property");
  assert.equal(quick.addOnInventory, null);
  assert.equal(quick.priceCents, 24900);
  assert.equal(full.priceCents, 39900);
  assert.ok(/\+3 properties/.test(String(full.addOnInventory)));
  assert.equal(pack.priceCents, 9900);
  assert.equal(pack.includedInventory, "+3 additional properties");
});
check("bienes: BASE photo cap is 8 from the ONE table; every seam reads it (no other literal)", () => {
  assert.equal(QUICK_BUSINESS_MAX_IMAGES_BY_CATEGORY["bienes-negocio"], 8);
  assert.equal(quickImageMaxForBusinessCategory("bienes-negocio"), 8);
  assert.equal(quickImageMaxForBusinessCategory("servicios"), 5);
  assert.equal(quickImageMaxForBusinessCategory("restaurantes"), 5);
  assert.equal(quickImageMaxForBusinessCategory("autos-dealer"), 4, "other families are untouched");
});
check("bienes: 1–8 real property photos accepted; the 9th refused; video refused server-side", () => {
  for (let n = 1; n <= 8; n += 1) assert.equal(media(prop(n))?.ok, true, `${n} photos`);
  const nine = media(prop(9));
  assert.ok(nine && !nine.ok && nine.issues.some((i) => i.code === "too_many_images"));
  const video = media(prop(3), 1);
  assert.ok(video && !video.ok && video.issues.some((i) => i.code === "video_not_allowed"));
  const videoFile = media([...prop(2), { role: "property", mime: "video/mp4" }]);
  assert.ok(videoFile && !videoFile.ok && videoFile.issues.some((i) => i.code === "video_not_allowed"));
});
check("bienes: logo / headshot never satisfy or consume the property-photo allowance; no role never counts as property", () => {
  const identityOnly = media([{ role: "logo", mime: "image/jpeg" }, { role: "headshot", mime: "image/jpeg" }]);
  assert.ok(identityOnly && !identityOnly.ok, "identity images alone are not a property photo");
  const eightPlusIdentity = media([...prop(8), { role: "logo", mime: "image/jpeg" }, { role: "headshot", mime: "image/jpeg" }]);
  assert.equal(eightPlusIdentity?.ok, true, "8 property photos + logo + headshot: identity does not count toward the 8");
  const ninePlusIdentity = media([...prop(9), { role: "logo", mime: "image/jpeg" }]);
  assert.ok(ninePlusIdentity && !ninePlusIdentity.ok, "a 9th PROPERTY photo is still refused");
  const noRole = media([{ role: null, mime: "image/jpeg" }, { role: null, mime: "image/jpeg" }]);
  assert.ok(noRole && !noRole.ok, "nothing upgrades a missing role to property (no fake padding)");
});
check("bienes: BASE cannot buy the +3 pack (bundled or standalone); PRO can", () => {
  const packItem = [{ key: BR_INVENTORY_PACK_PACKAGE_KEY, quantity: 1 }];
  const withQuick = validateRevenueCheckoutAddOns({ category: "bienes-raices", basePackageKey: PAIR_BR.simple, addOns: packItem });
  assert.equal(withQuick.ok, false);
  assert.equal(validateRevenueCheckoutAddOns({ category: "bienes-raices", basePackageKey: PAIR_BR.full, addOns: packItem }).ok, true);
  assert.ok(quickBienesInventoryAddonRefusal({ product: "quick", source: "live_entitlement" }));
  assert.equal(quickBienesInventoryAddonRefusal({ product: "full", source: "live_entitlement" }), null);
});

// ------------------------------------------------------------------------------------------------
// SHARED — authority is server-side; BASE/PRO share the row; no forgery
// ------------------------------------------------------------------------------------------------
check("shared: BASE and PRO use the SAME application / row / public presentation (only entitlement differs)", () => {
  const svc = raw("app/(site)/clasificados/servicios/[slug]/page.tsx");
  assert.ok(svc.includes("resolveBusinessToolsAccess") || svc.includes("resolveBusinessAccess"), "the public page reads server entitlement");
  const reg = raw("app/lib/quickBusiness/quickBusinessRegistry.ts");
  assert.ok(reg.includes("standardApplicationPath"), "one canonical application path per family");
});
check("shared: a Full first save is never Quick; overlapping BASE + PRO resolves PRO; staff custody beats the URL; declaration never upgrades", () => {
  for (const category of ["servicios", "restaurantes", "autos", "bienes-raices"]) {
    const pair = BUSINESS_CATEGORY_PACKAGE_PAIR[category]!;
    assert.equal(quickContractAppliesTo(resolveQuickBusinessProduct({ category })), false, `${category}: unverified is not Quick`);
    assert.equal(quickContractAppliesTo(resolveQuickBusinessProduct({ category, declaredPackageKey: pair.full })), false, `${category}: a declared Full key is not trusted, and is not Quick`);
    const both = resolveQuickBusinessProduct({
      category,
      liveEntitlementRows: [
        { packageKey: pair.simple, packageTier: "digital_only" },
        { packageKey: pair.full, packageTier: "digital_only" },
      ],
    });
    assert.equal(both.product, "full", `${category}: overlapping BASE + PRO resolves PRO`);
    assert.equal(quickContractAppliesTo(both), false);
    const staffBase = resolveQuickBusinessProduct({ category, assistedPackageKey: pair.simple, declaredPackageKey: pair.full });
    assert.equal(staffBase.product, "quick", `${category}: the staff custody BASE wins over a declared Full`);
    const staffPro = resolveQuickBusinessProduct({ category, assistedPackageKey: pair.full, declaredPackageKey: pair.simple });
    assert.equal(staffPro.product, "full", `${category}: staff PRO is not downgraded by a URL/body BASE marker`);
  }
});
check("shared: BASE -> PRO upgrade is an ENTITLEMENT change on the SAME listing row (scoped by listing id; no reapplication, no second row)", () => {
  const conv = raw("app/lib/listingPlans/quickToFullConvergenceCore.ts");
  assert.ok(conv.includes("The exact listing being upgraded. The lookup MUST be scoped to it."), "convergence is scoped to the one listing being upgraded");
  const dash = raw("app/(site)/clasificados/autos/dashboard/AutosDealerInventoryDashboardSection.tsx");
  assert.ok(dash.includes("autos_dealer_monthly"), "the dealer upgrade buys the category EXISTING PRO package for the same parent listing");
  // Entitlements hang off (category, listing_id): a PRO row next to the BASE row for the SAME listing resolves PRO
  // with the SAME listing id, so coupons / capacity / media unlock without touching the listing row.
  const beforeUpgrade = coupons("servicios", [row({ packageKey: "servicios_quick_monthly", endsAt: "2026-10-20T00:00:00Z" })]);
  const afterUpgrade = coupons("servicios", [
    row({ id: "q", packageKey: "servicios_quick_monthly", endsAt: "2026-10-20T00:00:00Z" }),
    row({ id: "f", packageKey: "servicios_base_monthly", endsAt: "2026-10-20T00:00:00Z" }),
  ]);
  assert.equal(beforeUpgrade.allowed, false);
  assert.equal(afterUpgrade.allowed, true, "coupons become available after the upgrade");
});

check("autos DATABASE authority (TOTAL model): the RPC derives child ceilings 4 / 9 / 19 = TOTAL 5 / 10 / 20 (parent + children) from the parent's entitlements, and never from the caller", () => {
  const mig = raw("supabase/migrations/20260924190000_autos_dealer_base_capacity_authority.sql");
  assert.ok(mig.includes("create or replace function public.autos_dealer_activate_listing("));
  assert.ok(mig.includes("v_limit := case when v_base_only then 4 when v_boost_active then 19 else 9 end;"), "child ceilings: BASE 4 / PRO+pack 19 / PRO 9 (the parent is vehicle #1)");
  assert.ok(mig.includes("return query select false, false, 'capacity_reached', v_count + 1, v_limit + 1;"), "a refusal reports TOTALS (children + parent / total limit)");
  assert.ok(mig.includes("(case when v_target_is_parent then 0 else 1 end), v_limit + 1;"), "a success reports TOTALS");
  assert.ok(/\(v_target_is_parent and v_count > v_limit\) or \(not v_target_is_parent and v_count >= v_limit\)/.test(mig), "a child is refused at the ceiling; the parent only when children already exceed it");
  assert.ok(!/then 4 when v_boost_active then 20 else 10 end/.test(mig), "the old child-count limits (10 / 20 children = 11 / 21 vehicles) are gone");
  assert.ok(/package_key = 'autos_dealer_quick_monthly'[\s\S]{0,260}and not exists[\s\S]{0,260}package_key = 'autos_dealer_monthly'/.test(mig), "BASE = live Quick AND NO live PRO on the same parent");
  assert.ok(mig.includes("e.status in ('active', 'scheduled')") && mig.includes("e.revoked_at is null") && mig.includes("e.ends_at >= v_now"), "liveness mirrors the application resolver");
  assert.ok(!/p_limit|p_max|p_is_quick|p_plan/.test(mig), "the RPC never accepts a caller-supplied limit / plan");
  assert.ok(/grant execute on function public\.autos_dealer_activate_listing\(uuid, uuid, text\) to service_role;/.test(mig) && /revoke all on function public\.autos_dealer_activate_listing\(uuid, uuid, text\) from public, anon, authenticated;/.test(mig) &&
      mig.includes("has_function_privilege('anon', v_fn, 'EXECUTE')"),
    "service_role only — client roles revoked explicitly and asserted (Launch security Wave 1)",
  );
  assert.ok(!mig.includes("br_negocio_activate_listing"), "the Bienes function is untouched");
  assert.ok(!/(insert|update|delete)\s+(into\s+)?public\.listing_package_entitlements/i.test(mig), "the migration never mutates entitlements");
});
check("autos TOTAL-vehicle ladder in the application layer: parent-only 1/5, 5/5 and the 5th child refused (BASE); 10/10 and the 10th child refused (PRO); 20/20 and the 20th child refused (PRO + pack)", () => {
  const child = (activeTotal: number, limit: number) =>
    decideCommercialWrite({ operation: "create_child_vehicle" as never, capacityDelta: 1, activeCount: activeTotal, limit, subscriptionStatus: "active" });
  const tiers: Array<[string, number]> = [
    ["BASE", QUICK_DEALER_ACTIVE_VEHICLE_LIMIT],
    ["PRO", STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT],
    ["PRO + pack", AUTOS_DEALER_TOTAL_WITH_INVENTORY_PACK_LIMIT],
  ];
  assert.deepEqual(tiers.map(([, n]) => n), [5, 10, 20]);
  for (const [name, limit] of tiers) {
    assert.equal(child(1, limit).allowed, true, `${name}: parent only (1/${limit}) accepts its first child`);
    assert.equal(child(limit - 1, limit).allowed, true, `${name}: the last child (parent + ${limit - 1} = ${limit}/${limit}) is accepted`);
    assert.equal(child(limit, limit).allowed, false, `${name}: one more child at ${limit}/${limit} is REFUSED`);
  }
  // The application draft / preview counts the SAME totals: the main listing (1) + additional vehicles.
  assert.equal(countApplicationInventoryVehicles(0), 1, "the main listing is vehicle #1");
  for (const [name, limit] of tiers) {
    assert.equal(applicationCanAddInventoryVehicle(limit - 2, limit), true, `${name}: additional #${limit - 1} (total ${limit}) can be added`);
    assert.equal(applicationCanAddInventoryVehicle(limit - 1, limit), false, `${name}: additional #${limit} (total ${limit + 1}) cannot`);
  }
  // Dashboard + checkout summaries use the same totals.
  const full = summarizeDealerInventory(5, QUICK_DEALER_ACTIVE_VEHICLE_LIMIT);
  assert.deepEqual([full.activeCount, full.limit, full.remainingSlots, full.canAddActiveVehicle], [5, 5, 0, false]);
  assert.equal(summarizeDealerInventory(1, QUICK_DEALER_ACTIVE_VEHICLE_LIMIT).remainingSlots, 4);
});
check("autos capacity: EVERY status='active' write for a dealer child goes through the RPC — including the staff assisted-publish vehicle (was a direct write with no limit)", () => {
  const assisted = raw("app/api/clasificados/autos/assisted-publish/route.ts");
  assert.ok(assisted.includes("activateAutosDealerListingAtomic({"), "assisted-publish activates the vehicle through the RPC");
  const vehicleBlock = assisted.slice(assisted.indexOf("if (vehicleListingId) {\n      // The vehicle is an inventory child"));
  assert.ok(!/from\("autos_classifieds_listings"\)\s*\.update\(\{ status: "active"[\s\S]{0,200}eq\("id", vehicleListingId\)/.test(vehicleBlock.slice(0, 1800)), "no direct status write for the vehicle child");
  assert.ok(/error: vehicleActivation\.blockedReason \?\? "capacity_reached"/.test(assisted) && /status: 409/.test(assisted), "a refusal is reported (409), never swallowed");
});

if (failures.length) {
  console.error(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
console.log("\nverify-four-category-commercial-contract-01: all checks passed");
