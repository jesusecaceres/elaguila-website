#!/usr/bin/env node
/**
 * SERVICIOS-P0 — coupon roundtrip, stepper, preview, and live parity.
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

const steps = read("app/(site)/clasificados/publicar/servicios/lib/serviciosApplicationStepLabels.ts");
const app = read("app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx");
const normalize = read("app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationNormalize.ts");
const handoff = read("app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosPreviewHandoff.ts");
const preview = read("app/(site)/clasificados/publicar/servicios/preview/ClasificadosServiciosPreviewClient.tsx");
const previewShell = read("app/(site)/clasificados/publicar/servicios/preview/ServiciosProfessionalPreviewShell.tsx");
const mapper = read("app/(site)/clasificados/publicar/servicios/lib/mapClasificadosServiciosApplicationToServiciosDraft.ts");
const draftMapper = read("app/(site)/servicios/lib/mapServiciosApplicationDraftToBusinessProfile.ts");
const resolver = read("app/(site)/servicios/lib/resolveServiciosProfile.ts");
const liveShell = read("app/(site)/servicios/components/ServiciosProfessionalProfileShell.tsx");
const publishPayload = read("app/(site)/clasificados/publicar/servicios/lib/buildServiciosPublishPayload.ts");
const publishRoute = read("app/api/clasificados/servicios/publish/route.ts");
const pkg = read("package.json");

assert(steps.includes("SERVICIOS_APPLICATION_STEP_COUNT = 8"), "Step count must be 8");
assert(steps.includes("Cupones y ofertas destacadas"), "Spanish coupon step label");
assert(steps.includes("Featured coupons & offers"), "English coupon step label");
assert(!steps.includes("Promoción (opcional)"), "No free promo step label");
assert(steps.includes("if (n >= 0 && n <= max) return n"), "Current step indices pass through unchanged");

assert(app.includes("step === 6"), "Coupon step UI at index 6");
assert(app.includes("step === 7"), "Review step UI at index 7");
assert(!app.includes("step === 8"), "No step index 8 in application");
assert(app.includes("goToStep(i)"), "Sidebar uses direct step index");
assert(
  app.includes("applicationStepIndex: Math.max(0, Math.min(SERVICIOS_APPLICATION_STEP_COUNT - 1, n))"),
  "goToStep clamps index without legacy migration",
);

assert(normalize.includes("const couponsAddOn = bool"), "couponsAddOn read before coupon clear");
assert(normalize.includes("if (!couponsAddOn) coupons = []"), "Coupons cleared only when add-on off");
assert(normalize.includes("couponFlyer"), "couponFlyer normalized");
assert(normalize.includes("couponMoreOffers"), "couponMoreOffers normalized");

assert(handoff.includes("persistServiciosDraftForPreviewNavigation"), "Preview handoff persists draft");
assert(handoff.includes("saveServiciosPreviewReturnDraft"), "Preview return payload saved");
assert(preview.includes("applyClasificadosCouponsToServiciosWireProfile"), "Preview applies coupon wire mapping");
assert(preview.includes("resolveServiciosProfile"), "Preview resolves profile");

assert(!previewShell.includes("ServiciosPromocionesCard"), "Preview shell hides legacy promotions");
const couponRender = previewShell.indexOf("<ServiciosCouponsCard");
const galleryRender = previewShell.indexOf("<ServiciosGalleryWithTabs");
assert(couponRender > 0 && galleryRender > couponRender, "Preview: coupons before gallery");

assert(mapper.includes("state.couponsAddOn"), "Clasificados draft mapper gates coupons");
assert(!/draft\.promotions\s*=/.test(mapper.replace(/\/\*[\s\S]*?\*\//g, "")), "No draft.promotions from state");
assert(mapper.includes("draft.coupons"), "Draft coupons mapped");
assert(mapper.includes("couponFlyer"), "Draft couponFlyer mapped");
assert(mapper.includes("applyClasificadosCouponsToServiciosWireProfile"), "Wire coupon helper exported");

assert(draftMapper.includes("mapCouponsDraftToWire"), "Draft→wire coupon mapper present");
assert(draftMapper.includes("out.coupons = couponsWire"), "Wire profile receives coupons");
assert(draftMapper.includes("couponFlyer"), "Wire profile receives couponFlyer");

assert(resolver.includes("resolveOneRichCouponWire"), "Resolver handles rich coupon wire");
assert(resolver.includes("couponFlyer"), "Resolver passes couponFlyer");

assert(!liveShell.includes("ServiciosPromocionesCard"), "Live shell hides legacy promotions");
assert(liveShell.includes("hasPaidCouponsSectionResolved"), "Live shell uses paid coupon presence");
const liveCoupon = liveShell.indexOf("<ServiciosCouponsCard");
const liveGallery = liveShell.indexOf("combinedMediaLayout");
assert(liveCoupon > 0 && liveGallery > liveCoupon, "Live: coupons before gallery");

assert(publishPayload.includes("couponsAddOn"), "Publish payload preserves couponsAddOn");
assert(publishPayload.includes("couponFlyer"), "Publish payload preserves couponFlyer");
assert(publishRoute.includes("applyClasificadosCouponsToServiciosWireProfile"), "Publish route applies coupon wire");

assert(pkg.includes('"verify:servicios-p0-coupon-roundtrip-live-parity"'), "package.json verifier registered");

console.log("OK: 8-step stepper + coupon storage");
console.log("OK: preview/live coupon wire + resolve pipeline");
console.log("OK: legacy promotions retired in preview/live shells");
console.log("verify-servicios-p0-coupon-roundtrip-live-parity: PASS");
