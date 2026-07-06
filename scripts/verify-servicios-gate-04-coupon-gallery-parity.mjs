#!/usr/bin/env node
/**
 * SERVICIOS-GATE-04 — coupon highlight row + gallery/video Restaurante parity.
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

const shell = read("app/(site)/clasificados/publicar/servicios/preview/ServiciosProfessionalPreviewShell.tsx");
const gallery = read("app/(site)/servicios/components/ServiciosGalleryWithTabs.tsx");
const coupons = read("app/(site)/servicios/components/ServiciosCouponsCard.tsx");
const mapper = read("app/(site)/clasificados/publicar/servicios/lib/mapClasificadosServiciosApplicationToServiciosDraft.ts");
const normalize = read("app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationNormalize.ts");
const copy = read("app/(site)/servicios/copy/serviciosProfileCopy.ts");
const presence = read("app/(site)/servicios/lib/serviciosProfilePresence.ts");
const pkg = read("package.json");

assert(!shell.includes("ServiciosPromocionesCard"), "Legacy free promotions card removed from preview shell");
assert(shell.includes("ServiciosCouponsCard"), "Paid coupons card remains in preview shell");
assert(shell.includes("hasPaidCouponsSectionResolved"), "Paid coupon presence helper used");
assert(shell.includes("mergeClasificadosCouponsOntoServiciosProfile"), "Preview merges paid coupons from application state");

const couponsRenderIdx = shell.indexOf("<ServiciosCouponsCard");
const galleryRenderIdx = shell.indexOf("<ServiciosGalleryWithTabs");
const servicesRenderIdx = shell.indexOf("<ServiciosOfferedSection");
assert(couponsRenderIdx > 0 && galleryRenderIdx > couponsRenderIdx, "Coupons section renders before gallery");
assert(servicesRenderIdx > galleryRenderIdx, "Gallery renders before services");

assert(coupons.includes("featuredRow"), "Coupons card supports featured highlight row");
assert(coupons.includes("featuredCouponsTitle"), "Coupons use paid add-on section title copy");
assert(!coupons.includes("profile.promotions"), "Coupons card does not use legacy promotions");

assert(gallery.includes("combinedMediaLayout"), "Gallery supports combined media layout");
assert(gallery.includes("Galería y Videos") || copy.includes("galleryAndVideos"), "Gallery section title present");
assert(gallery.includes("exploreGalleryAndVideos") || gallery.includes("Explorar fotos y videos"), "Explore button copy present");
assert(gallery.includes("ServiciosGalleryVideoTile"), "Video tiles preserved in combined layout");

assert(mapper.includes("Free `state.promotions` retired"), "Mapper documents free promo retirement");
assert(!/draft\.promotions\s*=/.test(mapper.replace(/\/\*[\s\S]*?\*\//g, "")), "Mapper must not set draft.promotions");
assert(mapper.includes("state.couponsAddOn"), "Coupon mapping gated by couponsAddOn");
assert(mapper.includes("mergeClasificadosCouponsOntoServiciosProfile"), "Preview coupon merge helper exported");
assert(mapper.includes("couponFlyer"), "couponFlyer mapped in draft mapper");
assert(mapper.includes("couponMoreOffers"), "couponMoreOffers mapped in draft mapper");

assert(normalize.includes("couponsAddOn = bool"), "Normalize reads couponsAddOn before clearing coupons");
assert(normalize.includes("couponFlyer"), "Normalize restores couponFlyer");
assert(normalize.includes("couponMoreOffers"), "Normalize restores couponMoreOffers");

assert(presence.includes("hasPaidCouponsSectionResolved"), "Paid coupons presence helper added");
assert(copy.includes("featuredCouponsTitle"), "Featured coupons copy keys present");
assert(copy.includes("Cupones y ofertas destacadas"), "Spanish paid coupon title in copy");

assert(!shell.includes('aria-labelledby="sec-promo"'), "No free promo section in preview shell");
assert(!gallery.includes("combinedMediaLayout ?") || gallery.includes("activeTab === \"photos\" && hasPhotos"), "Legacy tab path preserved when combined layout off");

assert(!gallery.includes('accept="video/*"'), "Gate 01: no video file upload regression");

assert(pkg.includes('"verify:servicios-gate-04"'), "package.json verifier registered");

console.log("OK: preview shell order — coupons → gallery → services");
console.log("OK: legacy free promotions hidden; paid coupons merged from application");
console.log("OK: combined gallery + videos layout");
console.log("verify-servicios-gate-04-coupon-gallery-parity: PASS");
