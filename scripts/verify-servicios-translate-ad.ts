/**
 * SERVICIOS LIVE LAUNCH PERFECTION — Wave 3 (⚠️16 Translate Ad, ⚠️17 static locale), 2026-09-13.
 *
 * Owner evidence (#120 → #121): "Traducir anuncio" on the Spanish page flipped to "Ver original"
 * while the Spanish prose stayed byte-identical. Root cause: Servicios sends `sourceLocale:
 * "unknown"` and the target was always the page locale, so Spanish content on the Spanish page was
 * an es → es echo. Two wiring gaps compounded it: ServiciosPublicDetailsCanvas discarded the
 * translated overlay, and owner-authored quick facts / reasons / coupons were never sent.
 *
 * Locked contract (PM): detect the content language; detected ≠ requested target → translate into
 * the requested target; detected = requested target → the opposite active language (ES ↔ EN).
 * Known-source callers keep their exact prior direction. Static Leonix chrome never enters
 * Translate Ad. "Ver original" restores the untouched owner content.
 *
 * Execution-first: the pure policy, the detection-code mapper, the detection sample builder and the
 * Servicios overlay (build + apply) run against fixtures. Source assertions pin the route
 * composition, the additive response fields, the canvas wiring and the three static-locale leaks.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-translate-ad.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import {
  buildDetectionSample,
  oppositeActiveTranslateLocale,
  planUnknownSourceTranslation,
} from "../app/lib/translation/unknownSourcePolicy";
import { mapGoogleLanguageCodeToTranslateAdSourceLocale } from "../app/lib/translation/localeCodes";
import {
  applyServiciosTranslation,
  buildServiciosTranslatableContent,
  isOwnerAuthoredQuickFact,
  isOwnerAuthoredTrustItem,
} from "../app/(site)/servicios/lib/serviciosTranslateAd";
import { getServiciosProfileLabels } from "../app/(site)/servicios/copy/serviciosProfileCopy";
import type { ServiciosProfileResolved } from "../app/(site)/servicios/types/serviciosBusinessProfile";

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

/* ==============================================================================================
 * ⚠️16 — locked unknown-source policy (pure).
 * ============================================================================================ */
check("⚠️16 policy: Spanish content on the Spanish page → English (retargeted)", () => {
  assert.deepEqual(planUnknownSourceTranslation("es", "es"), {
    sourceLocale: "es",
    targetLocale: "en",
    detectedSourceLocale: "es",
    retargeted: true,
  });
});
check("⚠️16 policy: English content on the English page → Spanish (retargeted)", () => {
  assert.deepEqual(planUnknownSourceTranslation("en", "en"), {
    sourceLocale: "en",
    targetLocale: "es",
    detectedSourceLocale: "en",
    retargeted: true,
  });
});
check("⚠️16 policy: content in the other language translates normally into the page locale", () => {
  assert.deepEqual(planUnknownSourceTranslation("en", "es"), {
    sourceLocale: "es",
    targetLocale: "en",
    detectedSourceLocale: "es",
    retargeted: false,
  });
  assert.deepEqual(planUnknownSourceTranslation("es", "en"), {
    sourceLocale: "en",
    targetLocale: "es",
    detectedSourceLocale: "en",
    retargeted: false,
  });
});
check("⚠️16 policy: undetermined detection keeps the pre-policy behaviour (no regression)", () => {
  assert.deepEqual(planUnknownSourceTranslation("es", "unknown"), {
    sourceLocale: "unknown",
    targetLocale: "es",
    detectedSourceLocale: "unknown",
    retargeted: false,
  });
});
check("⚠️16 policy: opposite active language is ES ↔ EN; other site locales fall back to Spanish", () => {
  assert.equal(oppositeActiveTranslateLocale("es"), "en");
  assert.equal(oppositeActiveTranslateLocale("en"), "es");
  assert.equal(oppositeActiveTranslateLocale("vi"), "es");
  assert.equal(planUnknownSourceTranslation("vi", "vi").targetLocale, "es");
});
check("⚠️16 detection-code mapper: allowlist pass-through, region collapse, und/RTL/unknown → unknown", () => {
  assert.equal(mapGoogleLanguageCodeToTranslateAdSourceLocale("es"), "es");
  assert.equal(mapGoogleLanguageCodeToTranslateAdSourceLocale("es-419"), "es");
  assert.equal(mapGoogleLanguageCodeToTranslateAdSourceLocale("en-US"), "en");
  assert.equal(mapGoogleLanguageCodeToTranslateAdSourceLocale("pt-BR"), "pt");
  assert.equal(mapGoogleLanguageCodeToTranslateAdSourceLocale("zh-TW"), "zh-CN");
  assert.equal(mapGoogleLanguageCodeToTranslateAdSourceLocale("zh-Hans"), "zh-Hans");
  assert.equal(mapGoogleLanguageCodeToTranslateAdSourceLocale("fil"), "fil");
  assert.equal(mapGoogleLanguageCodeToTranslateAdSourceLocale("und"), "unknown");
  assert.equal(mapGoogleLanguageCodeToTranslateAdSourceLocale(""), "unknown");
  assert.equal(mapGoogleLanguageCodeToTranslateAdSourceLocale("ar"), "unknown", "RTL held");
  assert.equal(mapGoogleLanguageCodeToTranslateAdSourceLocale("xx-YY"), "unknown");
});
check("⚠️16 detection sample: owner prose first, mask placeholders stripped, capped", () => {
  const sample = buildDetectionSample({
    title: "Plomería",
    description: "Reparaciones de emergencia __LEONIX_MASK_0__ las 24 horas.",
    shareText: "10% de descuento",
  });
  assert.ok(sample.startsWith("Reparaciones de emergencia"), sample);
  assert.ok(!sample.includes("__LEONIX_MASK_"), "placeholders removed");
  assert.ok(sample.includes("Plomería") && sample.includes("10% de descuento"));
  assert.equal(buildDetectionSample({ description: "x".repeat(5000) }).length, 1500);
  assert.equal(buildDetectionSample({}), "");
});

/* ==============================================================================================
 * ⚠️16 — Servicios overlay: only owner-authored content is sent; presets and chrome never are.
 * ============================================================================================ */
const fixture = {
  hero: { categoryLine: "Plomería residencial", badges: [] },
  about: { text: "Somos una empresa familiar.", specialtiesLine: "Fugas y calentadores" },
  highlights: [
    { id: "bh_preset_free_estimate", label: "Presupuesto sin costo" },
    { id: "bh_custom_1", label: "Garantía por escrito" },
  ],
  services: [{ title: "Destapado de drenajes", secondaryLine: "Mismo día" }],
  promotions: [
    { id: "p0", headline: "Primera visita gratis" },
    { id: "p1", headline: "Descuento para adultos mayores" },
  ],
  quickFacts: [
    // ⚠️37: preset quick facts carry a real catalog label (carpinteria::carp_q1) — that is what
    // makes them canonical; the mapper also infers non-custom kinds from owner text.
    { kind: "years_experience", label: "Más de 10 años de experiencia" },
    { kind: "custom", label: "Atendemos sábados" },
  ],
  trust: [
    { id: "trust_licensed", label: "Con licencia", icon: "shield" },
    { id: "custom_reason", label: "20 años en San José", icon: "star" },
  ],
  coupons: [
    { id: "c0", title: "10% en tu primer servicio", description: "Menciona Leonix", couponCode: "LEONIX10" },
    { id: "c1", title: "Inspección gratis" },
  ],
} as unknown as ServiciosProfileResolved;

check("⚠️16 overlay build: custom quick fact / custom reason / coupons / later promos ride in `body`; presets stay home", () => {
  const content = buildServiciosTranslatableContent(fixture);
  assert.equal(content.description, "Somos una empresa familiar.");
  assert.equal(content.title, "Plomería residencial");
  assert.equal(content.shareText, "Primera visita gratis");
  const body = content.body ?? "";
  assert.ok(body.includes("qf\t1\tAtendemos sábados"), body);
  assert.ok(!body.includes("Más de 10 años de experiencia"), "preset quick fact (catalog label) never sent");
  assert.ok(body.includes("tr\t1\t20 años en San José"), body);
  assert.ok(!body.includes("Con licencia"), "preset reason (pre-localized) never sent");
  assert.ok(body.includes("cp\t0\t10% en tu primer servicio\tMenciona Leonix"), body);
  assert.ok(body.includes("cp\t1\tInspección gratis\t"), body);
  assert.ok(body.includes("pr\t1\tDescuento para adultos mayores"), body);
  assert.ok(!body.includes("Primera visita gratis"), "first promo stays in shareText only");
  assert.ok(!body.includes("LEONIX10"), "coupon codes never sent");
  assert.equal(content.highlights, "1\tGarantía por escrito", "only the custom highlight is sent, indexed");
  assert.ok(!(content.highlights ?? "").includes("Presupuesto sin costo"), "preset highlight never sent");
  assert.ok(isOwnerAuthoredQuickFact({ kind: "custom", label: "x" }));
  assert.ok(!isOwnerAuthoredQuickFact({ kind: "years_experience", label: "Más de 10 años de experiencia" }));
  assert.ok(isOwnerAuthoredQuickFact({ kind: "emergency", label: "Emergencias nocturnas en tu casa" }), "owner text with an inferred kind still translates");
  assert.ok(isOwnerAuthoredTrustItem({ id: "custom_reason", label: "x", icon: "star" }));
  assert.ok(!isOwnerAuthoredTrustItem({ id: "trust_licensed", label: "x", icon: "shield" }));
});
check("⚠️16 overlay apply: translated body lands on exactly the owner-authored items; originals untouched", () => {
  const translated = applyServiciosTranslation(fixture, {
    description: "We are a family business.",
    highlights: "1\tWritten warranty\n0\tSHOULD NOT APPLY (preset)",
    body: [
      "qf\t1\tOpen on Saturdays",
      "tr\t1\t20 years in San José",
      "cp\t0\t10% off your first service\tMention Leonix",
      "cp\t1\tFree inspection\t",
      "pr\t1\tSenior discount",
      "qf\t0\tSHOULD NOT APPLY (preset)",
      "tr\t0\tSHOULD NOT APPLY (preset)",
    ].join("\n"),
  });
  assert.equal(translated.about?.text, "We are a family business.");
  assert.equal(translated.highlights[1]!.label, "Written warranty");
  assert.equal(translated.highlights[0]!.label, "Presupuesto sin costo", "preset highlight untouched");
  assert.equal(translated.quickFacts[1]!.label, "Open on Saturdays");
  assert.equal(translated.quickFacts[0]!.label, "Más de 10 años de experiencia", "preset quick fact untouched by machine text (no target locale given)");
  assert.equal(translated.trust[1]!.label, "20 years in San José");
  assert.equal(translated.trust[0]!.label, "Con licencia", "preset reason untouched");
  assert.equal(translated.coupons[0]!.title, "10% off your first service");
  assert.equal(translated.coupons[0]!.description, "Mention Leonix");
  assert.equal(translated.coupons[0]!.couponCode, "LEONIX10", "code untouched");
  assert.equal(translated.coupons[1]!.title, "Free inspection");
  assert.equal(translated.promotions[1]!.headline, "Senior discount");
  assert.equal(translated.promotions[0]!.headline, "Primera visita gratis", "index 0 governed by shareText only");
  // "Ver original" = the untouched source object.
  assert.equal(fixture.about?.text, "Somos una empresa familiar.");
  assert.equal(fixture.quickFacts[1]!.label, "Atendemos sábados");
  assert.equal(fixture.coupons[0]!.title, "10% en tu primer servicio");
});
check("⚠️16 overlay apply: tolerant of tab-collapsed lines; empty translation returns the same object", () => {
  const collapsed = applyServiciosTranslation(fixture, { body: "qf 1 Open on Saturdays" });
  assert.equal(collapsed.quickFacts[1]!.label, "Open on Saturdays");
  assert.equal(applyServiciosTranslation(fixture, {}), fixture, "no-op keeps reference identity");
});

/* ==============================================================================================
 * ⚠️16 — route / provider / canvas composition (source).
 * ============================================================================================ */
check("⚠️16 route: known-source requests return early on the unchanged path; policy only for `unknown`", () => {
  const route = raw("app/api/translate-ad/route.ts");
  const knownIdx = route.indexOf('if (parsed.sourceLocale !== "unknown") {');
  const policyIdx = route.indexOf("planUnknownSourceTranslation(parsed.targetLocale, detected)");
  assert.ok(knownIdx > 0 && policyIdx > knownIdx, "known-source early return precedes the policy");
  assert.ok(route.includes("const result = await translateAdWithConfiguredProvider(parsed);\n      return NextResponse.json(result);"), "known-source body unchanged");
  assert.ok(route.includes("detectAdLanguageWithConfiguredProvider(buildDetectionSample(parsed.maskedFields))"));
  assert.ok(route.includes("sourceLocale: plan.sourceLocale,") && route.includes("targetLocale: plan.targetLocale,"), "provider + cache run under the effective direction");
  assert.ok(route.includes("detectedSourceLocale: plan.detectedSourceLocale,") && route.includes("effectiveTargetLocale: plan.targetLocale,"), "additive response fields");
  assert.ok(route.includes("sourceLocale: parsed.sourceLocale,\n      targetLocale: parsed.targetLocale,"), "requested locales preserved for backward compatibility");
});
check("⚠️16 provider/types: detection is additive; result type gains only optional fields", () => {
  const provider = raw("app/lib/translation/provider.ts");
  assert.ok(provider.includes("export async function detectAdLanguageWithConfiguredProvider"));
  assert.ok(provider.includes(":detectLanguage"));
  assert.ok(provider.includes("export async function translateAdWithConfiguredProvider("), "translate entry untouched");
  const types = raw("app/lib/translation/types.ts");
  assert.ok(types.includes("detectedSourceLocale?: ContentLocale;") && types.includes("effectiveTargetLocale?: Locale;"));
  const control = raw("app/components/translation/TranslateAdControl.tsx");
  assert.ok(control.includes("targetLocale: siteLocale,") && control.includes("cached.targetLocale === siteLocale"), "shared control unchanged — requested target still drives it");
});
check("⚠️16 canvas + profile view: the translated overlay actually renders", () => {
  const canvas = raw("app/(site)/servicios/components/ServiciosPublicDetailsCanvas.tsx");
  assert.ok(!canvas.includes("displayProfile: _displayProfile"), "overlay no longer discarded");
  assert.ok(canvas.includes("<ServiciosTrustSection profile={displayProfile}"));
  assert.ok(canvas.includes("facts={displayProfile.quickFacts}"));
  assert.ok(canvas.includes("<ServiciosSmartTrustSummary profile={displayProfile}"));
  assert.ok(canvas.includes("hasTrustSectionResolved(profile)"), "existence gates still read the untouched profile");
  const view = raw("app/(site)/servicios/components/ServiciosProfileView.tsx");
  assert.ok(view.includes("<ServiciosAbout profile={displayProfile}"));
  assert.ok(view.includes("services={displayProfile.services}"));
  assert.ok(view.includes("coupons={displayProfile.coupons}"));
  assert.ok(view.includes("<ServiciosPublicDetailsCanvas profile={profile} displayProfile={displayProfile}"));
  // ⚠️37 (2026-09-14): the contact card receives the overlay so owner extra-link LABELS translate;
  // contact literals are never sent nor rewritten — pinned in verify-servicios-translation-coverage.
  assert.ok(view.includes("<ServiciosBusinessHubContactCard\n                    profile={displayProfile}"), "contact card renders the overlay");
});

/* ==============================================================================================
 * ⚠️17 — static locale: the three proven leaks, and chrome stays out of Translate Ad.
 * ============================================================================================ */
check("⚠️17 static labels: gallery eyebrow, Leonix promo badge and highlights heading are locale copy", () => {
  const es = getServiciosProfileLabels("es");
  const en = getServiciosProfileLabels("en");
  assert.equal(es.galleryEyebrow, "Galería");
  assert.equal(en.galleryEyebrow, "Gallery");
  assert.equal(es.leonixPromoBadge, "Promoción Leonix");
  assert.equal(en.leonixPromoBadge, "Leonix promotion");
  assert.ok(!/Highlights/.test(es.highlightsTitle), `ES highlights heading is Spanish: ${es.highlightsTitle}`);
  assert.equal(en.highlightsTitle, "Business highlights");
  const gallery = raw("app/(site)/servicios/components/ServiciosGalleryWithTabs.tsx");
  assert.ok(gallery.includes("{L.galleryEyebrow}") && !/>Galería</.test(gallery));
  const promos = raw("app/(site)/servicios/components/ServiciosPromocionesCard.tsx");
  assert.ok(promos.includes("{L.leonixPromoBadge}") && !promos.includes("Promoción Leonix\n"));
});
check("⚠️17 chrome never enters Translate Ad: the overlay reads only owner fields", () => {
  const overlay = raw("app/(site)/servicios/lib/serviciosTranslateAd.ts");
  for (const chrome of ["Llamar", "Compartir", "Nuestra ubicación", "Cómo llegar", "Contáctanos", "Sobre nosotros", "getServiciosProfileLabels"]) {
    assert.ok(!overlay.includes(chrome), `overlay must not reference chrome: ${chrome}`);
  }
  const content = buildServiciosTranslatableContent(fixture);
  const sent = Object.values(content).join("\n");
  for (const chrome of ["Llamar", "Compartir", "Cómo llegar", "Sobre nosotros", "Galería"]) {
    assert.ok(!sent.includes(chrome), `chrome label leaked into the payload: ${chrome}`);
  }
});

if (failures.length) {
  console.error(`\nverify-servicios-translate-ad: ${failures.length} failure(s)`);
  process.exit(1);
}
console.log("\nverify-servicios-translate-ad: PASS");
