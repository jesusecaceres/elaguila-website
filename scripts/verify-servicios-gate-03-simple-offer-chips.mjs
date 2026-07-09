#!/usr/bin/env node
/**
 * SERVICIOS-GATE-03 — remove free promo step; simple offer chips in Step 5; paid coupons preserved.
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
const copy = read("app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationCopy.ts");
const app = read("app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx");
const mapper = read("app/(site)/clasificados/publicar/servicios/lib/mapClasificadosServiciosApplicationToServiciosDraft.ts");
const normalize = read("app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationNormalize.ts");
const pkg = read("package.json");

assert(steps.includes("SERVICIOS_APPLICATION_STEP_COUNT = 8"), "Step count must be 8");
assert(!steps.includes("Promoción (opcional)"), "Spanish free promo step label removed");
assert(!steps.includes("Promotion (optional)"), "English free promo step label removed");
assert(!steps.includes("Vista de contacto y opciones"), "Spanish contact preview step label removed");
assert(!steps.includes("Contact preview & options"), "English contact preview step label removed");
assert(steps.includes("Cupones y ofertas destacadas"), "Spanish paid coupons step label present");
assert(steps.includes("Featured coupons & offers"), "English paid coupons step label present");
assert(steps.includes("migrateServiciosApplicationStepIndex"), "Legacy step migration helper present");

assert(!app.includes("Añadir promoción"), "Free promo add button removed from UI");
assert(!app.includes("promoAddPromotion"), "Free promo add label not rendered");
assert(!app.includes('aria-labelledby="sec-promo"'), "Free promo section removed");
assert(!app.includes("promoImageInputRefs"), "Free promo image upload removed");
assert(!app.includes("promoPdfInputRefs"), "Free promo PDF upload removed");
assert(app.includes("simpleOfferPhrasesTitle"), "Step 5 simple offer title wired");
assert(app.includes("simpleOfferPhrasesHelper"), "Step 5 simple offer helper wired");
assert(app.includes("step === 6"), "Coupons step uses index 6");
assert(app.includes("step === 7"), "Review step uses index 7");
assert(!app.includes("step === 8"), "No step index 8 in application UI");
assert(app.includes("migrateServiciosApplicationStepIndex"), "Application migrates legacy step indices");

assert(copy.includes("Frases destacadas u ofertas simples"), "ES simple offer copy present");
assert(copy.includes("Featured phrases or simple offers"), "EN simple offer copy present");
assert(copy.includes("Consulta inicial gratis"), "ES examples include professional services");
assert(copy.includes("Compra 4 llantas"), "ES examples include field/mechanic services");
assert(copy.includes("Free initial consultation"), "EN examples include professional services");
assert(copy.includes("Buy 4 tires"), "EN examples include field/mechanic services");
assert(copy.includes("couponsFeaturedStepTitle"), "Paid coupon step copy keys present");
assert(copy.includes("Para frases simples sin imagen/código/enlace"), "ES paid step points to highlights");
assert(copy.includes("For simple text phrases without image/code/link"), "EN paid step points to highlights");

assert(mapper.includes("Free `state.promotions` retired"), "Mapper documents free promo retirement");
assert(!mapper.includes("draft.promotions"), "Mapper must not set draft.promotions");
assert(!/promotions\s*=/.test(mapper.replace(/\/\*[\s\S]*?\*\//g, "")), "Mapper must not assign promotions from state");
assert(mapper.includes("state.couponsAddOn"), "Coupon mapping gated by couponsAddOn");

assert(normalize.includes("migrateServiciosApplicationStepIndex"), "Normalize migrates applicationStepIndex");
assert(normalize.includes("promotions"), "Legacy promotions normalize preserved for old drafts");

assert(!app.includes('accept="video/*"'), "Gate 01: no video file upload regression");
assert(app.includes("SERVICIOS_MAX_VIDEO_URLS"), "Gate 01: video URL cap preserved");
assert(!app.includes("coverInputRef"), "Gate 02: cover file input ref removed");
assert(!app.includes("coverUrlDraft"), "Gate 02: cover URL draft input removed");

assert(pkg.includes('"verify:servicios-gate-03"'), "package.json verifier registered");

console.log("OK: 8-step flow without free promo step");
console.log("OK: Step 5 simple offer chip guidance");
console.log("OK: paid coupons add-on preserved");
console.log("OK: free promotions not mapped to draft output");
console.log("verify-servicios-gate-03-simple-offer-chips: PASS");
