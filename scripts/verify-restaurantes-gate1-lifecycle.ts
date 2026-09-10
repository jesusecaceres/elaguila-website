/**
 * Gate RESTAURANTES-1 verifier — launch-critical Restaurantes lifecycle repairs.
 *
 * Pure/unit + source-level only: no network, no DB, no dev server.
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-restaurantes-gate1-lifecycle.ts
 *
 * Covers:
 *   1. Coupons INCLUDED in the $399 base — capability authority, no retired add-on, no 2nd charge.
 *   2. Dropped media surfaced instead of silently swallowed.
 *   3. Checkpoint price truth ($129 Comida Local) + EN cadence copy.
 *   4. JSON-LD absolute canonical.
 *   5. Open-now: one timezone-pinned evaluator shared by results and public detail.
 *   6. WhatsApp: shared international contract, no naive digit-strip left.
 *   7. Address privacy: the owner opt-out is reachable AND effective.
 *   8. Protected Application/Preview wiring still mounted.
 */
import { strict as assert } from "node:assert";
import * as fs from "node:fs";
import * as path from "node:path";

import { decideCategoryListingPlan, decideBusinessToolsAccess } from "@/app/lib/listingPlans/categoryCommercialPlanPolicy";
import { getRevenuePackageDefinition } from "@/app/lib/listingPlans/revenuePricingMatrix";
import { shouldShowRestaurantStreetAddress } from "@/app/clasificados/restaurantes/application/restauranteContactHref";
import { computeShellHoursPreview } from "@/app/clasificados/restaurantes/application/restauranteHoursPreview";
import type { RestauranteListingDraft } from "@/app/clasificados/restaurantes/application/restauranteDraftTypes";

const ROOT = process.cwd();
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), "utf8");
const ok = (m: string) => console.log(`OK: ${m}`);
/** Strip comments so a doc comment that NAMES an old pattern cannot pass/fail a code-shape check. */
const code = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const PUBLISH_ROUTE = "app/api/clasificados/restaurantes/publish/route.ts";
const DETAIL_PAGE = "app/(site)/clasificados/restaurantes/[slug]/page.tsx";
const CHECKPOINT = "app/(site)/clasificados/publicar/restaurantes/page.tsx";
const PREVIEW = "app/(site)/clasificados/restaurantes/preview/RestaurantePreviewClient.tsx";
const APPLICATION = "app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx";
const PLAN_RESOLVER = "app/lib/listingPlans/categoryCommercialPlan.ts";
const CAPABILITY_HELPER = "app/(site)/clasificados/restaurantes/lib/restauranteCouponCapabilityServer.ts";

/* ------------------------------------------------------------------ *
 * 1. COUPONS — included in the $399 base
 * ------------------------------------------------------------------ */

// Product truth is unchanged and still owner-locked.
const baseDef = getRevenuePackageDefinition("restaurantes_base_monthly");
assert.ok(baseDef, "restaurantes_base_monthly must exist");
assert.equal(baseDef.priceCents, 39900, "$399/mo server pricing");
// `capabilities` is optional on `RevenuePackageDefinition`, so under `strict` it must be proven
// present before it is read. Asserting it separately is also a STRONGER check than the original
// non-null read: "the base package declares capabilities at all" and "those capabilities include
// coupons_offers" are two distinct product facts, and this now fails loudly on either.
assert.ok(baseDef.capabilities, "restaurantes_base_monthly must declare capabilities");
assert.ok(baseDef.capabilities.includes("coupons_offers"), "coupons must be INCLUDED in the base package");
const retired = getRevenuePackageDefinition("restaurantes_offers_addon");
assert.ok(retired, "the retired add-on definition must be kept for historical rows");
assert.equal(retired.stripeEligible, false, "the retired add-on must never be purchasable again");
assert.equal(retired.newSalesRetired, true);
ok("1a. $399 base includes coupons_offers; the $79 add-on stays retired and unpurchasable");

// A paid base entitlement alone must yield the capability — no add-on row anywhere.
const nowMs = Date.parse("2026-09-10T18:00:00Z");
const basePlan = decideCategoryListingPlan({
  category: "restaurantes",
  nowMs,
  rows: [
    {
      id: "e1",
      packageKey: "restaurantes_base_monthly",
      grantSource: "stripe_webhook",
      packageTier: "digital_only",
      status: "active",
      startsAt: "2026-09-01T00:00:00Z",
      endsAt: null,
    },
  ],
});
assert.ok(basePlan.capabilities.includes("coupons_offers"), "a paid base entitlement must grant coupons_offers");
assert.equal(
  decideBusinessToolsAccess({ plan: basePlan, capability: "coupons_offers" }).allowed,
  true,
  "business-tools access must allow coupons for a base-package holder",
);
ok("1b. base-only entitlement resolves coupons_offers — no second checkout, no add-on row");

// A historical $79 buyer must not lose access.
const legacyPlan = decideCategoryListingPlan({
  category: "restaurantes",
  nowMs,
  rows: [
    {
      id: "e2",
      packageKey: "restaurantes_offers_addon",
      grantSource: "stripe_webhook",
      packageTier: "digital_only",
      status: "active",
      startsAt: "2026-01-01T00:00:00Z",
      endsAt: null,
    },
  ],
});
assert.ok(legacyPlan.capabilities.includes("coupons_offers"), "a historical add-on holder keeps access");
ok("1c. historical $79 add-on holders keep coupon access");

// Suspended blocks; no entitlement at all denies.
const suspended = decideCategoryListingPlan({
  category: "restaurantes",
  nowMs,
  subscriptionOverride: "suspended",
  rows: [
    { id: "e3", packageKey: "restaurantes_base_monthly", grantSource: "stripe_webhook", packageTier: null, status: "active", startsAt: null, endsAt: null },
  ],
});
assert.equal(decideBusinessToolsAccess({ plan: suspended, capability: "coupons_offers" }).allowed, false, "suspended blocks");
const none = decideCategoryListingPlan({ category: "restaurantes", nowMs, rows: [] });
assert.equal(decideBusinessToolsAccess({ plan: none, capability: "coupons_offers" }).allowed, false, "unpaid denies");
ok("1d. suspended blocks and unpaid denies — fails closed");

// The plan resolver must no longer filter on the inconsistently-written listing_source column.
const planResolverCode = code(read(PLAN_RESOLVER));
assert.ok(
  !/\.eq\("listing_source"/.test(planResolverCode),
  "categoryCommercialPlan must not filter on listing_source — the Stripe path writes the bare category there, so filtering matched zero rows for a genuinely paid listing",
);
assert.ok(planResolverCode.includes('.eq("category"') && planResolverCode.includes('.eq("listing_id"'));
ok("1e. plan resolver keys on category + listing_id (the durable identity)");

// Both owner-facing surfaces now use the capability, not the retired add-on key.
const helperCode = code(read(CAPABILITY_HELPER));
assert.ok(helperCode.includes("resolveBusinessToolsAccess"), "the coupon helper must use the canonical resolver");
assert.ok(!/RESTAURANTES_COUPON_ADDON_PACKAGE_KEY|restaurantes_offers_addon/.test(helperCode), "no retired-key lookup");
for (const rel of [DETAIL_PAGE, PUBLISH_ROUTE]) {
  const src = code(read(rel));
  assert.ok(src.includes("restauranteCouponsCapabilityActive"), `${rel} must resolve coupons via the capability`);
  assert.ok(
    !/fetchAddonEntitlementsForListings|RESTAURANTES_COUPON_ADDON_PACKAGE_KEY/.test(src),
    `${rel} must no longer gate coupons on the retired add-on entitlement`,
  );
}
ok("1f. public vitrina and publish route both gate coupons on the included capability");

// No checkout path for the retired add-on may exist anywhere in Restaurantes.
for (const rel of [PREVIEW, CHECKPOINT, APPLICATION]) {
  assert.ok(
    !/restaurantes_offers_addon/.test(code(read(rel))),
    `${rel} must not reference a purchasable retired add-on`,
  );
}
ok("1g. no retired add-on checkout path revived anywhere in the owner flow");

// Webhook remains paid authority; this gate writes no entitlement rows.
assert.ok(
  !/listing_package_entitlements/.test(helperCode),
  "the coupon helper must READ commercial state only — the webhook remains the writer",
);
ok("1h. webhook stays the paid authority; the capability read is write-free and idempotent");

/* ------------------------------------------------------------------ *
 * 2. DROPPED MEDIA
 * ------------------------------------------------------------------ */

const publishCode = code(read(PUBLISH_ROUTE));
assert.ok(publishCode.includes('warnDroppedUnpersistableMedia("restaurantes-publish"'), "adopt the shared warn helper");
assert.ok(publishCode.includes("droppedUnpersistableMedia"), "the dropped list must reach the client");
assert.ok(
  code(read("app/(site)/clasificados/restaurantes/application/saveRestaurantePendingBeforeCheckout.ts")).includes(
    "droppedUnpersistableMedia",
  ),
  "the pending-save result must carry the dropped list",
);
assert.ok(code(read(PREVIEW)).includes("mediaDroppedNote"), "preview must surface a non-blocking media warning");
assert.ok(
  code(read(APPLICATION)).includes("droppedUnpersistableMedia"),
  "the dashboard-edit save path must tell the owner instead of navigating away silently",
);
assert.ok(
  !/export function warnDroppedUnpersistable|function buildProposedFinalMediaSet/.test(publishCode),
  "no second media engine — the shared contract stays the only implementation",
);
ok("2. dropped media surfaced to the owner on both save paths, via the shared contract");

/* ------------------------------------------------------------------ *
 * 3. CHECKPOINT PRICE TRUTH
 * ------------------------------------------------------------------ */

const checkpointSrc = read(CHECKPOINT);
assert.ok(!checkpointSrc.includes("$199"), "the retired/incorrect $199 Comida Local price must be gone");
const comidaDef = getRevenuePackageDefinition("comida_local_base_monthly");
assert.ok(comidaDef && comidaDef.priceCents === 12900, "Comida Local is $129/mo in Revenue OS");
assert.ok(checkpointSrc.includes("$129/mes") && checkpointSrc.includes("$129/month"), "both locales show $129");
assert.ok(checkpointSrc.includes("$399/mes") && checkpointSrc.includes("$399/month"), "both locales show $399");
// The EN block must not carry Spanish cadence.
const enBlock = checkpointSrc.slice(checkpointSrc.indexOf("  en: {"));
assert.ok(!enBlock.includes("/mes"), "English copy must say /month, never /mes");
const esBlock = checkpointSrc.slice(checkpointSrc.indexOf("  es: {"), checkpointSrc.indexOf("  en: {"));
assert.ok(esBlock.includes("/mes") && !esBlock.includes("/month"), "Spanish copy keeps /mes");
ok("3. checkpoint advertises the real $129 Comida Local price, with correct ES/EN cadence");

/* ------------------------------------------------------------------ *
 * 4. JSON-LD ABSOLUTE CANONICAL
 * ------------------------------------------------------------------ */

const detailCode = code(read(DETAIL_PAGE));
assert.ok(
  detailCode.includes("${LEONIX_SITE_ORIGIN}/clasificados/restaurantes/"),
  "JSON-LD url must be the absolute canonical detail URL",
);
assert.ok(detailCode.includes("alternates: { canonical }"), "the route still declares its own canonical");
ok("4. published Restaurantes schema URL is absolute canonical");

/* ------------------------------------------------------------------ *
 * 5. OPEN-NOW — one timezone-pinned evaluator
 * ------------------------------------------------------------------ */

const hoursPreviewCode = code(read("app/(site)/clasificados/restaurantes/application/restauranteHoursPreview.ts"));
assert.ok(
  !/now\.getDay\(\)|getHours\(\)\s*\*\s*60/.test(hoursPreviewCode),
  "the detail-side hours preview must not read server-local time",
);
assert.ok(
  hoursPreviewCode.includes("weekdayKeyFromDateInTimeZone") && hoursPreviewCode.includes("minutesInTimeZone"),
  "it must reuse the timezone-pinned helpers the discovery card already uses",
);
const openNowLib = read("app/(site)/clasificados/restaurantes/lib/restauranteOpenNowFromHours.ts");
assert.ok(
  openNowLib.includes("export function weekdayKeyFromDateInTimeZone") &&
    openNowLib.includes("export function minutesInTimeZone"),
  "the shared helpers must be exported from the one evaluator module",
);

// Behavioral proof: 09:00–17:00 America/Los_Angeles. 20:00 UTC = 13:00 PT -> OPEN.
// Under the old server-local (UTC) reading, 20:00 would have fallen outside 09:00–17:00 -> CLOSED.
const weekly = {
  sunday: { closed: true },
  monday: { closed: false, openTime: "09:00", closeTime: "17:00" },
  tuesday: { closed: false, openTime: "09:00", closeTime: "17:00" },
  wednesday: { closed: false, openTime: "09:00", closeTime: "17:00" },
  thursday: { closed: false, openTime: "09:00", closeTime: "17:00" },
  friday: { closed: false, openTime: "09:00", closeTime: "17:00" },
  saturday: { closed: true },
} as unknown as Parameters<typeof computeShellHoursPreview>[0];
const midAfternoonPt = computeShellHoursPreview(weekly, new Date("2026-09-09T20:00:00Z"), "es");
assert.equal(midAfternoonPt.status, "open", "13:00 PT on a Wednesday must read OPEN, not server-UTC CLOSED");
const earlyMorningPt = computeShellHoursPreview(weekly, new Date("2026-09-09T13:00:00Z"), "es");
assert.equal(earlyMorningPt.status, "closed", "06:00 PT must read CLOSED");
ok("5. results and public detail share one timezone-pinned open-now evaluator (behavior proven)");

/* ------------------------------------------------------------------ *
 * 6. WHATSAPP
 * ------------------------------------------------------------------ */

for (const rel of [
  "app/(site)/clasificados/restaurantes/application/restauranteContactHref.ts",
  "app/(site)/clasificados/restaurantes/application/mapRestauranteDraftToShell.ts",
]) {
  const src = code(read(rel));
  assert.ok(src.includes("buildInternationalWhatsAppWaMeHrefWithText"), `${rel} must use the shared WhatsApp builder`);
  assert.ok(
    !/const digits = raw\.replace\(\/\\D\/g, ""\)[\s\S]{0,120}wa\.me/.test(src),
    `${rel} must not keep a naive digit-strip wa.me builder`,
  );
}
ok("6. both Restaurantes WhatsApp builders use the shared international contract");

/* ------------------------------------------------------------------ *
 * 7. ADDRESS PRIVACY — reachable AND effective
 * ------------------------------------------------------------------ */

const applicationSrc = read(APPLICATION);
assert.ok(
  applicationSrc.includes('id="restaurante-show-exact-address"'),
  "the privacy toggle must have a real control in the live application form",
);
assert.ok(
  read("app/(site)/publicar/restaurantes/restauranteApplicationFormCopy.ts").includes("showExactAddressLabel"),
  "the toggle must have bilingual copy",
);

const storefront = {
  addressLine1: "123 Main St",
  homeBasedBusiness: false,
} as unknown as RestauranteListingDraft;
assert.equal(shouldShowRestaurantStreetAddress(storefront), true, "absent choice keeps existing behavior (show)");
assert.equal(
  shouldShowRestaurantStreetAddress({ ...storefront, showExactAddress: false } as RestauranteListingDraft),
  false,
  "an explicit opt-out must hide the street address even for a non-home-based restaurant",
);
assert.equal(
  shouldShowRestaurantStreetAddress({
    ...storefront,
    homeBasedBusiness: true,
    showExactAddress: false,
  } as RestauranteListingDraft),
  false,
  "home-based opt-out still hides",
);
assert.equal(
  shouldShowRestaurantStreetAddress({ addressLine1: "" } as unknown as RestauranteListingDraft),
  false,
  "no address means nothing to show",
);
ok("7. address privacy opt-out is reachable in the form and now effective for every restaurant");

/* ------------------------------------------------------------------ *
 * 8. PROTECTED SURFACES STILL MOUNTED
 * ------------------------------------------------------------------ */

for (const anchor of ["useBusinessApplicationLeaveGuard", "saveRestauranteDraftToStorageResolved", "buildRestaurantePublishPayload"]) {
  assert.ok(applicationSrc.includes(anchor), `protected application wiring "${anchor}" must remain`);
}
for (const anchor of [
  "PublishCheckoutCheckpoint",
  "saveRestaurantePendingBeforeCheckout",
  "startRevenueCategoryCheckout",
  "captureCheckoutNewsletterSubscriber",
  "RestauranteAdStoryPreview",
]) {
  assert.ok(read(PREVIEW).includes(anchor), `protected preview wiring "${anchor}" must remain`);
}
// Same-row republish identity untouched by this gate.
assert.ok(
  publishCode.includes('.eq("draft_listing_id", draft.draftListingId)') &&
    publishCode.includes('.eq("status", statusDecision.targetStatus)'),
  "draft_listing_id keying + status compare-and-set must be preserved",
);
ok("8. protected Application/Preview wiring and same-row republish identity intact");

console.log("\nverify-restaurantes-gate1-lifecycle: PASS");
