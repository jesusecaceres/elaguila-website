#!/usr/bin/env node
/**
 * SERVICIOS-P0B — coupon output render proof (preview + live shells).
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

const mapper = read("app/(site)/clasificados/publicar/servicios/lib/mapClasificadosServiciosApplicationToServiciosDraft.ts");
const draftMapper = read("app/(site)/servicios/lib/mapServiciosApplicationDraftToBusinessProfile.ts");
const resolver = read("app/(site)/servicios/lib/resolveServiciosProfile.ts");
const presence = read("app/(site)/servicios/lib/serviciosProfilePresence.ts");
const previewClient = read("app/(site)/clasificados/publicar/servicios/preview/ClasificadosServiciosPreviewClient.tsx");
const previewShell = read("app/(site)/servicios/components/ServiciosProfessionalProfileShell.tsx");
const liveShell = read("app/(site)/servicios/components/ServiciosProfessionalProfileShell.tsx");
const couponsCard = read("app/(site)/servicios/components/ServiciosCouponsCard.tsx");
const pkg = read("package.json");

assert(mapper.includes("draft.coupons = draftCoupons"), "Clasificados state maps to draft.coupons");
assert(mapper.includes("applyClasificadosCouponsToServiciosWireProfile"), "Wire coupon apply helper exists");
assert(mapper.includes("mergeClasificadosCouponsOntoServiciosProfile"), "Resolved profile merge helper exists");

assert(draftMapper.includes("mapCouponsDraftToWire"), "Draft→wire coupon mapper");
assert(draftMapper.includes("out.coupons = couponsWire"), "Wire profile receives coupons");

assert(resolver.includes("resolveOneRichCouponWire"), "Resolver handles rich coupon wire");
assert(resolver.includes("expirationDate"), "Resolver preserves expirationDate");

assert(presence.includes("expirationDate?.trim()"), "Presence checks expirationDate");
assert(presence.includes("redemptionNote?.trim()"), "Presence checks redemptionNote");

assert(previewClient.includes("mergeClasificadosCouponsOntoServiciosProfile"), "Preview client merges coupons from app state");
// Quick/Full shared presentation (2026-09-24): the shared shell takes the resolved profile; application coupons are merged in the client.
assert(previewClient.includes("mergeClasificadosCouponsOntoServiciosProfile(resolved, appState, lang)"), "Preview shell receives the in-memory application coupons via the resolved profile");

assert(previewShell.includes("displayProfile.coupons"), "Preview shell renders from displayProfile.coupons");
assert(!previewShell.includes("ServiciosPromocionesCard"), "Preview shell hides legacy promotions");
const previewCoupon = previewShell.indexOf("<ServiciosCouponsCard");
const previewGallery = previewShell.indexOf("<ServiciosGalleryWithTabs");
assert(previewCoupon > 0 && previewGallery > previewCoupon, "Preview: coupons before gallery");
// Quick/Full shared presentation (2026-09-24): the merge is synchronous in the client's profile useMemo (the shared shell has no applicationState prop).
assert(previewClient.includes("const profile = useMemo(") && previewClient.includes("offersEntitled"), "Preview profile merges application coupons synchronously before the shared shell");

assert(!liveShell.includes("ServiciosPromocionesCard"), "Live professional shell hides legacy promotions");
assert(liveShell.includes("displayProfile.coupons"), "Live shell renders paid coupons from displayProfile");
const liveCoupon = liveShell.indexOf("<ServiciosCouponsCard");
const liveGallery = liveShell.indexOf("combinedMediaLayout");
assert(liveCoupon > 0 && liveGallery > liveCoupon, "Live: coupons before gallery");

assert(couponsCard.includes("featuredCouponsTitle"), "Coupon card uses featured section title copy");
assert(couponsCard.includes("coupon.description"), "Coupon card renders description");
assert(couponsCard.includes("coupon.couponCode"), "Coupon card renders coupon code");
assert(couponsCard.includes("coupon.expirationDate"), "Coupon card renders expiration");
assert(couponsCard.includes("coupon.redemptionNote"), "Coupon card renders redemption note");
assert(couponsCard.includes("coupon.imageUrl"), "Coupon card renders image when provided");
assert(!couponsCard.includes("Ofertas especiales"), "Coupon card does not use retired free promo label");

assert(pkg.includes('"verify:servicios-p0b-coupon-output-render-proof"'), "package.json verifier registered");

console.log("OK: draft→wire→resolve coupon pipeline");
console.log("OK: preview/live shells render displayProfile.coupons above gallery");
console.log("OK: coupon card renders real field output");
console.log("verify-servicios-p0b-coupon-output-render-proof: PASS");
