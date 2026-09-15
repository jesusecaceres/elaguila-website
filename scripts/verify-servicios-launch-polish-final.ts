/**
 * SERVICIOS FINAL LIVE LAUNCH QA POLISH — ⚠️32 / ⚠️33 / ⚠️34 / ⚠️36 (2026-09-14).
 *
 * ⚠️33  Live runtime: the production route already answers the owner's exact case correctly
 *       (unknown→es Spanish → detected es, effective en, English text — proven by a live POST on
 *       2026-09-14). The one client path with ZERO network traffic and ZERO visible change is the
 *       sessionStorage cache branch replaying a pre-policy es→es ECHO stored under the v2 key. Fix:
 *       cache-key version bump + no-op guards (echo is never presented, never cached).
 * ⚠️34  The lightbox stage clips and the 16:9 embed's width is capped so its height always fits
 *       below the header/tabs at 100 % zoom.
 * ⚠️36  Every place the 15 % welcome discount is named says "first payment only"; the schedule line
 *       names the discounted figure as a one-time first payment, then the full monthly price.
 * (⚠️32 lives in verify-servicios-share-quote-protect; ⚠️35 is reported BLOCKED — server truth.)
 *
 * Execution-first where a pure function exists (isNoOpTranslation, buildVerifiedIntroChargeScheduleText).
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-launch-polish-final.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { isNoOpTranslation } from "../app/components/translation/TranslateAdControl";
import { buildVerifiedIntroChargeScheduleText } from "../app/lib/listingPlans/recurringConsentCopy";

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

/* ⚠️33 ------------------------------------------------------------------------------------------ */
check("⚠️33 isNoOpTranslation: echo detected; real translation passes; partial echo passes; empty is no-op", () => {
  const source = { description: "Somos una empresa familiar.", title: "Plomería" };
  assert.equal(isNoOpTranslation(source, { description: "Somos una empresa familiar.", title: "Plomería" }), true);
  assert.equal(isNoOpTranslation(source, { description: " Somos una empresa familiar. " }), true, "trim-insensitive");
  assert.equal(isNoOpTranslation(source, { description: "We are a family business.", title: "Plomería" }), false);
  assert.equal(isNoOpTranslation(source, {}), true, "nothing translated = nothing to show");
});
check("⚠️33 control: cached echo is cleared and re-requested; fresh echo is never cached nor shown as translated", () => {
  const control = raw("app/components/translation/TranslateAdControl.tsx");
  const cachedIdx = control.indexOf("if (isNoOpTranslation(picked, cached.translated)) {");
  const clearIdx = control.indexOf("clearCachedAdTranslation(cacheKey);");
  assert.ok(cachedIdx > 0 && clearIdx > cachedIdx, "cached echo → clear → fall through to a real request");
  const freshIdx = control.indexOf("if (isNoOpTranslation(picked, restoredTranslated)) {");
  const setCacheIdx = control.indexOf("setCachedAdTranslation(cacheKey, result);");
  assert.ok(freshIdx > 0 && freshIdx < setCacheIdx, "fresh echo is rejected BEFORE caching / onTranslated");
  assert.ok(control.slice(freshIdx, setCacheIdx).includes("setError(labels.unavailable)"), "echo surfaces as unavailable, not as a translation");
  assert.ok(control.includes("targetLocale: siteLocale,"), "request direction unchanged (server policy retargets)");
});
check("⚠️33 Servicios layer: cache-key version bumped past the pre-policy echo", () => {
  const layer = raw("app/(site)/servicios/components/ServiciosPublicTranslationLayer.tsx");
  // Owner QA 914 bumped v3 → v4 for a proven stale/garbled cached response; the mechanism this
  // ⚠️33 check protects (a version-scoped cache key that can be bumped to invalidate a bad reply)
  // is what must survive, not the literal v3 string.
  assert.ok(/version="servicios-t4-v\d+"/.test(layer), "cache key still version-scoped (now v4)");
  assert.ok(!layer.includes('version="servicios-t4-v2"'), "v2 key gone");
  assert.ok(layer.includes("requestTranslation={requestServiciosAdTranslation}"), "live request callback wired");
});
check("⚠️33 route/policy unchanged from the certified build (detect → normal / opposite language)", () => {
  const route = raw("app/api/translate-ad/route.ts");
  assert.ok(route.includes("planUnknownSourceTranslation(parsed.targetLocale, detected)"));
  assert.ok(route.includes('if (parsed.sourceLocale !== "unknown") {'), "known-source callers keep their path");
});

/* ⚠️34 ------------------------------------------------------------------------------------------ */
check("⚠️34 lightbox: header stays a non-shrinking bar; stage clips; video width capped to fit 16:9 below the header", () => {
  const modal = raw("app/components/media/BusinessGalleryModal.tsx");
  assert.ok(modal.includes('<div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-3 py-2 sm:px-4">'), "header bar unchanged");
  assert.ok(modal.includes("flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden bg-black"), "stage clips");
  assert.ok(modal.includes('<div className="w-full max-w-[calc((96vh-7rem)*16/9)]">{current.renderVideo()}</div>'), "16:9 width cap derived from the 96vh dialog height");
  assert.ok(modal.includes('className="max-h-[min(78vh,820px)] max-w-full object-contain"'), "image sizing untouched");
  assert.ok(modal.includes("absolute left-1 top-1/2 z-10") && modal.includes("absolute right-1 top-1/2 z-10"), "prev/next stay reachable");
  const tile = raw("app/(site)/servicios/components/ServiciosGalleryVideoTile.tsx");
  assert.ok(tile.includes('<div className="relative aspect-video w-full overflow-hidden rounded-xl'), "embed still 16:9 by width (engine untouched)");
  const gallery = raw("app/(site)/servicios/components/ServiciosGalleryWithTabs.tsx");
  assert.ok(gallery.includes('renderVideo: () => <ServiciosGalleryVideoTile v={v} lang={lang} variant="embed" />'), "Servicios still renders the same embed");
  assert.ok(gallery.includes("mediaFilter === \"photos\" ? photoSlides : mediaFilter === \"videos\" ? videoSlides"), "Todo/Fotos/Videos logic untouched");
});

/* ⚠️36 ------------------------------------------------------------------------------------------ */
check("⚠️36 schedule text: $339.15 named as a one-time first payment, then $399.00 monthly (ES/EN)", () => {
  const es = buildVerifiedIntroChargeScheduleText({ firstChargeCents: 33915, renewalCents: 39900, lang: "es" });
  const en = buildVerifiedIntroChargeScheduleText({ firstChargeCents: 33915, renewalCents: 39900, lang: "en" });
  assert.equal(es, "Primer pago: $339.15 — solo esta vez. Después: $399.00 al mes.");
  assert.equal(en, "First payment: $339.15 — this once. Then: $399.00 per month.");
});
check("⚠️36 panel + checkout copy: 15% is always 'first payment only'; eligibility/no-stacking untouched", () => {
  const panel = raw("app/(site)/clasificados/components/VerifiedIntroDiscountVerifyPanel.tsx");
  for (const s of [
    'title: "15% de bienvenida — solo en tu primer pago"',
    'title: "15% welcome discount — first payment only"',
    'apply: "Aplicar 15% a mi primer pago"',
    'apply: "Apply 15% to my first payment"',
    'applied: "15% de bienvenida aplicado — solo en tu primer pago."',
    'applied: "15% welcome discount applied — first payment only."',
    "cada renovación se cobra al precio completo",
    "every renewal is billed at the full price",
  ]) assert.ok(panel.includes(s), `panel copy: ${s}`);
  assert.ok(panel.includes("basisEmail") && panel.includes("El correo del boletín no afecta este descuento."), "⚠️27 copy kept");
  assert.ok(panel.includes("if (promoCodeActive && !applied) return null;"), "no stacking (mutual exclusion) kept");
  const cp = raw("app/(site)/clasificados/components/PublishCheckoutCheckpoint.tsx");
  assert.ok(cp.includes('"15% de bienvenida — solo primer pago (estimado)"') && cp.includes('"15% welcome discount — first payment only (estimated)"'));
  assert.ok(cp.includes("buildVerifiedIntroChargeScheduleText({"), "schedule line still rendered before payment");
  const coupon = raw("app/lib/listingPlans/verifiedIntroDiscountStripeCoupon.ts");
  assert.ok(coupon.includes('duration: "once"'), "Stripe coupon stays first-invoice-only");
});

if (failures.length) {
  console.error(`\nverify-servicios-launch-polish-final: ${failures.length} failure(s)`);
  process.exit(1);
}
console.log("\nverify-servicios-launch-polish-final: PASS");
