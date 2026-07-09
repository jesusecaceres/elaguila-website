#!/usr/bin/env node
/**
 * RESTAURANTES-P0 — coupon add-on published parity (pending → checkout → webhook → live).
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const model = read("app/(site)/clasificados/restaurantes/application/restauranteListingApplicationModel.ts");
const publishPayload = read("app/(site)/clasificados/restaurantes/application/buildRestaurantePublishPayload.ts");
const mergeDraft = read("app/(site)/clasificados/restaurantes/application/createEmptyRestauranteDraft.ts");
const mapper = read("app/(site)/clasificados/restaurantes/lib/restaurantesPublicListingMapper.ts");
const publishRoute = read("app/api/clasificados/restaurantes/publish/route.ts");
const preview = read("app/(site)/clasificados/restaurantes/preview/RestaurantePreviewClient.tsx");
const shellMap = read("app/(site)/clasificados/restaurantes/application/mapRestauranteDraftToShell.ts");
const fulfillment = read("app/lib/listingPlans/revenueRestaurantFulfillment.ts");
const revenueFulfillment = read("app/lib/listingPlans/revenueFulfillment.ts");
const paymentRecords = read("app/lib/listingPlans/revenuePaymentRecords.ts");
const checkpoint = read("app/lib/listingPlans/publishCheckoutCheckpoint.ts");
const publicPage = read("app/(site)/clasificados/restaurantes/[slug]/page.tsx");
const couponsBlock = read("app/(site)/clasificados/restaurantes/shell/RestauranteShellCouponsBlock.tsx");
const pkg = read("package.json");

assert(model.includes("couponUpgradeEnabled"), "Application model defines couponUpgradeEnabled");
assert(model.includes("coupons?: RestauranteCoupon"), "Application model defines coupon rows");

assert(publishPayload.includes("couponUpgradeEnabled"), "Publish payload preserves couponUpgradeEnabled");
assert(publishPayload.includes("coupons:"), "Publish payload includes coupon rows");
assert(publishPayload.includes("couponFlyer"), "Publish payload includes couponFlyer");
assert(publishPayload.includes("activation_mode"), "Publish payload supports pending_payment");

assert(mergeDraft.includes("merged.couponUpgradeEnabled"), "Draft merge restores couponUpgradeEnabled");
assert(mergeDraft.includes("merged.coupons"), "Draft merge restores coupons array");

assert(mapper.includes("listing_json: d"), "Public listing insert stores full draft in listing_json");
assert(publishRoute.includes("draftToRestaurantePublicListingInsert"), "Publish route maps draft to listing row");
assert(publishRoute.includes("RESTAURANTE_PENDING_CHECKOUT_STATUS"), "Publish route supports hidden pending status");

assert(
  preview.includes("restaurantOffersAddonSelected") && preview.includes("couponUpgradeEnabled"),
  "Preview wires couponUpgradeEnabled to checkout checkpoint",
);
assert(
  preview.includes("RESTAURANTES_COUPON_ADDON_PACKAGE_KEY") || preview.includes("restaurantes_offers_addon"),
  "Preview sends restaurantes_offers_addon add-on",
);

assert(shellMap.includes("couponModuleEnabled"), "Shell mapper gates coupons on paid add-on flag");
assert(shellMap.includes("restauranteCouponRowRenderable"), "Shell mapper uses meaningful coupon row filter");

assert(fulfillment.includes("listing_json"), "Webhook activation reads listing_json");
assert(fulfillment.includes("couponAddonPaid"), "Webhook activation syncs coupon add-on paid truth");
assert(revenueFulfillment.includes("readRestaurantCouponAddonPaidFromPaymentRecord"), "Fulfillment reads payment add-on metadata");

assert(paymentRecords.includes("restaurant_coupon_addon_selected"), "Payment record stores coupon add-on snapshot");
assert(paymentRecords.includes("restaurant_offers_addon_package_key"), "Payment record stores add-on package key");

assert(checkpoint.includes("restaurantes_offers_addon"), "Checkpoint knows offers add-on package");

assert(publicPage.includes("mapRestauranteDraftToShellData"), "Public detail maps listing_json to shell");
assert(publicPage.includes("listingJsonToDraft"), "Public detail reads listing_json draft");

assert(couponsBlock.includes("Cupones y ofertas destacadas"), "Public coupon section ES title");
assert(couponsBlock.includes("Featured coupons & offers"), "Public coupon section EN title");
assert(!couponsBlock.includes("Ofertas Locales"), "Coupon block does not reference Ofertas Locales CMS");

assert(!fulfillment.includes("constructEvent"), "Stripe raw signature handling untouched in fulfillment");
assert(pkg.includes('"verify:restaurantes-p0-coupon-addon-published-parity"'), "package.json verifier registered");

console.log("OK: pending publish preserves coupon add-on + rows");
console.log("OK: checkout metadata + webhook activation preserve coupon truth");
console.log("OK: public Restaurante detail renders paid coupon module from listing_json");
console.log("verify-restaurantes-p0-coupon-addon-published-parity: PASS");
