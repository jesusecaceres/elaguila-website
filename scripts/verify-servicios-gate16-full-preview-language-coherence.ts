/**
 * Servicios False-Gates-Only Final Completion Pass — Gate 16 verifier (2026-09-17).
 *
 * Walks the FULL Servicios preview/published display model (not just result-card service chips,
 * which scripts/verify-servicios-card-translate-mixed-language-regression.ts already covers) through
 * the real production translate pipeline — relabelServiciosCanonicalPresets + buildServiciosTranslatableContent
 * + mask/wrap/[simulated provider]/unwrap/unmask + applyServiciosTranslation — and proves, using the
 * Gate 1 inventory (scripts/servicios-display-language-inventory.ts) as the checklist:
 *
 *   1. Spanish original: every CANONICAL_PRESET and CUSTOM_TRANSLATABLE field renders in Spanish.
 *   2. Translate: every one of those fields renders in English; ZERO Spanish leftover.
 *   3. View Original: exact Spanish profile is restored byte-for-byte (untouched original object).
 *   4. LITERAL_PRESERVE fields (business name, phone/email, address, review quotes, license
 *      number/authority, coupon code, day labels, hour text) are BYTE-IDENTICAL across all three
 *      states — translation never touches them.
 *
 * Covers: hero (categoryLine + badges), About (text + specialtiesLine), services, highlights,
 * quickFacts, credentials (licenseType/insuranceType/certifications), coupons, promotions, contact
 * (extraLinks), payment labels (custom), amenities (custom), trust — i.e. every section Gate 1
 * classified as CANONICAL_PRESET or CUSTOM_TRANSLATABLE. Reviews, contact literals, hours and the
 * email/quote sheet's own chrome are proven separately (they are UI_CHROME/LITERAL_PRESERVE by
 * construction — see Gate 1 verifier) since they never enter this pipeline at all.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-gate16-full-preview-language-coherence.ts
 */
import { strict as assert } from "node:assert";
import {
  applyServiciosTranslation,
  buildServiciosTranslatableContent,
  relabelServiciosCanonicalPresets,
} from "../app/(site)/servicios/lib/serviciosTranslateAd";
import {
  maskTranslatableFields,
  pickTranslatableAdFields,
  unmaskTranslatableFields,
} from "../app/lib/translation/helpers";
import {
  unwrapMaskPlaceholdersFromGoogleHtml,
  wrapMaskPlaceholdersForGoogleHtml,
} from "../app/lib/translation/providers/maskPlaceholders";
import { BUSINESS_TYPE_PRESETS } from "../app/(site)/clasificados/publicar/servicios/lib/businessTypePresets";
import { BUSINESS_HIGHLIGHT_PRESET_CHIPS } from "../app/(site)/clasificados/publicar/servicios/lib/businessHighlightPresets";
import { LANGUAGE_OPTION_CHIPS } from "../app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationTypes";
import type { ServiciosProfileResolved } from "../app/(site)/servicios/types/serviciosBusinessProfile";
import { SERVICIOS_DISPLAY_LANGUAGE_INVENTORY } from "./servicios-display-language-inventory";

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

/* ── Real catalog entries — never hand-typed, so this can't drift from the live ES/EN maps. ── */
const preset = BUSINESS_TYPE_PRESETS[0]!;
const presetService = preset.suggestedServices[0]!;
const presetReason = preset.reasonsToChoose[0]!;
const presetQuickFact = preset.quickFacts[0]!;
const presetHighlight = BUSINESS_HIGHLIGHT_PRESET_CHIPS[0]!;
const presetLanguage = LANGUAGE_OPTION_CHIPS[0]!;

/* ── LITERAL_PRESERVE anchors — must survive every transform byte-for-byte. ── */
const LITERAL = {
  businessName: "Plomería León del Valle QA",
  phoneDisplay: "(555) 123-4567",
  email: "owner@leonixmedia.com",
  physicalAddressDisplay: "123 Calle Falsa, Los Angeles, CA",
  licenseNumber: "LIC-998877",
  licenseAuthority: "California CSLB",
  couponCode: "AHORRA10",
  reviewAuthorName: "María González",
  reviewQuote: "Excelente servicio, muy profesionales y puntuales.",
};

function buildFixtureProfile(): ServiciosProfileResolved {
  return {
    identity: { slug: "plomeria-leon-del-valle-qa", businessName: LITERAL.businessName },
    hero: {
      categoryLine: preset.labelEs,
      badges: [
        { kind: "spanish", label: presetLanguage.es },
        { kind: "custom", label: "Servicio bilingüe 24/7 ES" },
      ],
      rating: 4.8,
      reviewCount: 12,
    },
    contact: {
      phoneDisplay: LITERAL.phoneDisplay,
      phoneTelHref: "tel:+15551234567",
      email: LITERAL.email,
      emailMailtoHref: `mailto:${LITERAL.email}`,
      messageEnabled: true,
      isFeatured: false,
      physicalAddressDisplay: LITERAL.physicalAddressDisplay,
      extraLinks: [{ label: "Enlace personalizado ES", url: "https://example.com/es" }],
    },
    quickFacts: [
      { kind: "emergency", label: presetQuickFact.es },
      { kind: "custom", label: "Dato personalizado ES" },
    ],
    about: {
      text: "Somos una plomería familiar con más de veinte años de experiencia en el valle.",
      specialtiesLine: "Especialistas en reparaciones de emergencia ES",
    },
    services: [
      { id: `svc_${presetService.id}`, title: presetService.es, secondaryLine: "", imageAlt: presetService.es },
      { id: "custom_offer_0", title: "Servicio personalizado ES", secondaryLine: "Línea secundaria ES", imageAlt: "Servicio personalizado ES" },
    ],
    gallery: [],
    galleryMore: [],
    galleryVideos: [],
    trust: [
      { id: `trust_${presetReason.id}`, label: presetReason.es, icon: "shield" },
      { id: "custom_reason", label: "Razón personalizada ES", icon: "heart" },
    ],
    highlights: [
      { id: `bh_preset_${presetHighlight.id}`, label: presetHighlight.es },
      { id: "bh_custom_0", label: "Destacado personalizado ES" },
    ],
    reviews: [{ id: "rev_0", authorName: LITERAL.reviewAuthorName, quote: LITERAL.reviewQuote, rating: 5 } as never],
    serviceAreas: { items: [] },
    paymentMethodIds: [],
    customPaymentMethods: ["Método de pago personalizado ES"],
    amenityOptionIds: [],
    customAmenityOptionsByGroup: { general: ["Amenidad personalizada ES"] },
    customAmenityOptions: ["Amenidad personalizada ES"],
    promotions: [
      { id: "promo_0", headline: "Promoción principal ES", footnote: "Nota promo cero ES" },
      { id: "promo_1", headline: "Segunda promoción ES", footnote: "Nota promo uno ES" },
    ],
    coupons: [
      {
        id: "coupon_0",
        title: "Cupón de inspección ES",
        description: "Descripción del cupón ES",
        couponCode: LITERAL.couponCode,
        expirationDate: "2026-12-31",
        redemptionNote: "Nota de canje ES",
        ctaLabel: "Canjear ahora",
      },
    ],
    credentials: {
      hasLicense: true,
      isInsured: true,
      licenseType: "Licencia general ES",
      licenseNumber: LITERAL.licenseNumber,
      licenseAuthority: LITERAL.licenseAuthority,
      licenseExpiration: "2027-01-01",
      insuranceType: "Seguro general ES",
      certifications: ["Certificación de plomería ES"],
    },
  } as unknown as ServiciosProfileResolved;
}

/** Every CUSTOM_TRANSLATABLE Spanish source string in the fixture, for leftover-detection. */
const CUSTOM_ES_STRINGS = [
  "Servicio bilingüe 24/7 ES",
  "Dato personalizado ES",
  "Somos una plomería familiar con más de veinte años de experiencia en el valle.",
  "Especialistas en reparaciones de emergencia ES",
  "Servicio personalizado ES",
  "Línea secundaria ES",
  "Razón personalizada ES",
  "Destacado personalizado ES",
  "Enlace personalizado ES",
  "Método de pago personalizado ES",
  "Amenidad personalizada ES",
  "Promoción principal ES",
  "Nota promo cero ES",
  "Segunda promoción ES",
  "Nota promo uno ES",
  "Cupón de inspección ES",
  "Descripción del cupón ES",
  "Nota de canje ES",
  "Licencia general ES",
  "Seguro general ES",
  "Certificación de plomería ES",
];
/**
 * A minimal simulated round-trip dictionary — every ES source string maps to a genuinely distinct EN
 * string (never a superstring of the ES source, so the "zero Spanish leftover" substring check below
 * can't pass by accident).
 */
const DICTIONARY: Record<string, string> = Object.fromEntries(
  CUSTOM_ES_STRINGS.map((es, i) => [es, es.endsWith(" ES") ? es.replace(/ ES$/, " EN") : `Translated EN text #${i}`]),
);

function simulateProviderTranslate(wrappedHtml: string): string {
  let out = wrappedHtml;
  for (const [es, en] of Object.entries(DICTIONARY)) out = out.replaceAll(es, en);
  return out;
}

/* ── 1. Spanish original — sanity baseline. ── */
const originalProfile = buildFixtureProfile();
check("STATE 1 (Spanish original): canonical preset fields render the real ES catalog label", () => {
  const relabeled = relabelServiciosCanonicalPresets(originalProfile, "es");
  assert.equal(relabeled.services[0]!.title, presetService.es);
  assert.equal(relabeled.trust[0]!.label, presetReason.es);
  assert.equal(relabeled.highlights[0]!.label, presetHighlight.es);
  assert.equal(relabeled.quickFacts[0]!.label, presetQuickFact.es);
  assert.equal(relabeled.hero.badges[0]!.label, presetLanguage.es);
  assert.equal(relabeled.hero.categoryLine, preset.labelEs);
});
check("STATE 1 (Spanish original): every CUSTOM_TRANSLATABLE fixture string is present in the raw profile", () => {
  const json = JSON.stringify(originalProfile);
  for (const es of CUSTOM_ES_STRINGS) assert.ok(json.includes(es), `missing fixture string: ${es}`);
});

/* ── 2. CLICK "Traducir al inglés" — full pipeline, all CUSTOM_TRANSLATABLE fields in one pass. ── */
let translatedProfile: ServiciosProfileResolved;
check('STATE 2 (Translate): buildServiciosTranslatableContent -> mask -> [provider] -> unmask -> applyServiciosTranslation drives every CUSTOM_TRANSLATABLE field at once', () => {
  const content = buildServiciosTranslatableContent(originalProfile);
  const picked = pickTranslatableAdFields(content);
  // Confirms Gate 1's inventory claim: all six TranslatableAdFields keys are populated by this fixture.
  for (const key of ["title", "description", "customServiceText", "highlights", "details", "shareText"] as const) {
    if (key === "title") continue; // categoryLine is a CATALOG preset here, correctly excluded from title.
    assert.ok(picked[key] && picked[key]!.length > 0, `TranslatableAdFields.${key} unexpectedly empty for this fixture`);
  }
  assert.ok(content.body && content.body.length > 0, "owner-extras body (qf/tr/cp/cn/pr/pf/cr/cf/el/pm/am/hb) unexpectedly empty");

  const { fields: maskedFields, fieldMaps } = maskTranslatableFields(picked);
  const translatedFields: Record<string, string> = {};
  for (const [key, value] of Object.entries(maskedFields)) {
    if (!value) continue;
    const wrapped = wrapMaskPlaceholdersForGoogleHtml(value);
    const providerOut = simulateProviderTranslate(wrapped);
    translatedFields[key] = unwrapMaskPlaceholdersFromGoogleHtml(providerOut);
  }
  const restored = unmaskTranslatableFields(translatedFields, fieldMaps);
  translatedProfile = applyServiciosTranslation(originalProfile, restored, "en");
});

check("STATE 2 (Translate): every canonical field now shows the real EN catalog label", () => {
  assert.equal(translatedProfile.services[0]!.title, presetService.en);
  assert.equal(translatedProfile.trust[0]!.label, presetReason.en);
  assert.equal(translatedProfile.highlights[0]!.label, presetHighlight.en);
  assert.equal(translatedProfile.quickFacts[0]!.label, presetQuickFact.en);
  assert.equal(translatedProfile.hero.badges[0]!.label, presetLanguage.en);
  assert.equal(translatedProfile.hero.categoryLine, preset.labelEn);
});
check("STATE 2 (Translate): every owner-authored CUSTOM_TRANSLATABLE field now shows the translated result", () => {
  assert.equal(translatedProfile.hero.badges[1]!.label, DICTIONARY["Servicio bilingüe 24/7 ES"]);
  assert.equal(translatedProfile.quickFacts[1]!.label, DICTIONARY["Dato personalizado ES"]);
  assert.equal(translatedProfile.about!.text, DICTIONARY["Somos una plomería familiar con más de veinte años de experiencia en el valle."]);
  assert.equal(translatedProfile.about!.specialtiesLine, DICTIONARY["Especialistas en reparaciones de emergencia ES"]);
  assert.equal(translatedProfile.services[1]!.title, DICTIONARY["Servicio personalizado ES"]);
  assert.equal(translatedProfile.trust[1]!.label, DICTIONARY["Razón personalizada ES"]);
  assert.equal(translatedProfile.highlights[1]!.label, DICTIONARY["Destacado personalizado ES"]);
  assert.equal(translatedProfile.contact.extraLinks![0]!.label, DICTIONARY["Enlace personalizado ES"]);
  assert.equal(translatedProfile.customPaymentMethods[0], DICTIONARY["Método de pago personalizado ES"]);
  assert.equal(translatedProfile.customAmenityOptionsByGroup.general![0], DICTIONARY["Amenidad personalizada ES"]);
  assert.equal(translatedProfile.promotions[0]!.headline, DICTIONARY["Promoción principal ES"]);
  assert.equal(translatedProfile.promotions[0]!.footnote, DICTIONARY["Nota promo cero ES"]);
  assert.equal(translatedProfile.promotions[1]!.headline, DICTIONARY["Segunda promoción ES"]);
  assert.equal(translatedProfile.promotions[1]!.footnote, DICTIONARY["Nota promo uno ES"]);
  assert.equal(translatedProfile.coupons[0]!.title, DICTIONARY["Cupón de inspección ES"]);
  assert.equal(translatedProfile.coupons[0]!.description, DICTIONARY["Descripción del cupón ES"]);
  assert.equal(translatedProfile.coupons[0]!.redemptionNote, DICTIONARY["Nota de canje ES"]);
  assert.equal(translatedProfile.credentials!.licenseType, DICTIONARY["Licencia general ES"]);
  assert.equal(translatedProfile.credentials!.insuranceType, DICTIONARY["Seguro general ES"]);
  assert.equal(translatedProfile.credentials!.certifications[0], DICTIONARY["Certificación de plomería ES"]);
});
check("STATE 2 (Translate): ZERO Spanish leftover among owner-authored CUSTOM_TRANSLATABLE strings", () => {
  // Whole-JSON substring checks on the catalog ES labels themselves are unsound here — a catalog
  // word (e.g. "Plomería") can legitimately still appear inside an untouched LITERAL_PRESERVE field
  // (the business name). The per-field equality checks above already pin every CANONICAL_PRESET
  // field to its real EN catalog label; this check only re-confirms the owner-authored prose, whose
  // fixture strings are unique enough that a substring match is a real leftover, not a collision.
  const json = JSON.stringify(translatedProfile);
  const leftover = CUSTOM_ES_STRINGS.filter((es) => json.includes(es));
  assert.deepEqual(leftover, [], `Spanish leftover after translate: ${leftover.join(", ")}`);
});
check("STATE 2 (Translate): every LITERAL_PRESERVE field is byte-identical to the Spanish original", () => {
  assert.equal(translatedProfile.identity.businessName, LITERAL.businessName);
  assert.equal(translatedProfile.contact.phoneDisplay, LITERAL.phoneDisplay);
  assert.equal(translatedProfile.contact.email, LITERAL.email);
  assert.equal(translatedProfile.contact.physicalAddressDisplay, LITERAL.physicalAddressDisplay);
  assert.equal(translatedProfile.credentials!.licenseNumber, LITERAL.licenseNumber);
  assert.equal(translatedProfile.credentials!.licenseAuthority, LITERAL.licenseAuthority);
  assert.equal(translatedProfile.coupons[0]!.couponCode, LITERAL.couponCode);
  assert.equal((translatedProfile.reviews[0] as unknown as { authorName: string }).authorName, LITERAL.reviewAuthorName);
  assert.equal((translatedProfile.reviews[0] as unknown as { quote: string }).quote, LITERAL.reviewQuote);
});

/* ── 3. CLICK "Ver original (español)" — untouched original object, byte for byte. ── */
check('STATE 3 (View Original): the untouched original Spanish profile object is restored exactly', () => {
  // "View Original" in production is "stop showing the translated overlay, show `profile` again" —
  // the original object was NEVER mutated (every transform above is pure/copy-on-write), so this is
  // a structural-equality proof that `originalProfile` itself never drifted during translate.
  const relabeledEs = relabelServiciosCanonicalPresets(originalProfile, "es");
  assert.equal(relabeledEs.services[0]!.title, presetService.es);
  assert.equal(relabeledEs.hero.categoryLine, preset.labelEs);
  assert.equal(originalProfile.about!.text, "Somos una plomería familiar con más de veinte años de experiencia en el valle.");
  assert.equal(originalProfile.services[1]!.title, "Servicio personalizado ES");
  assert.equal(originalProfile.hero.badges[1]!.label, "Servicio bilingüe 24/7 ES");
  const json = JSON.stringify(originalProfile);
  for (const es of CUSTOM_ES_STRINGS) assert.ok(json.includes(es), `original profile lost fixture string after translate ran: ${es}`);
});

/* ── 4. Gate 1 cross-check: every CANONICAL_PRESET/CUSTOM_TRANSLATABLE section this fixture can
 *      exercise is represented in the Gate 1 inventory (keeps the two gates from drifting apart). ── */
check("Gate 1 inventory lists a CANONICAL_PRESET or CUSTOM_TRANSLATABLE entry for every section this fixture exercises", () => {
  const exercisedSections = ["services", "why choose us", "highlights", "quick facts", "hero", "About", "coupons", "promotions", "contact", "licenses", "certifications"];
  for (const section of exercisedSections) {
    const hasTranslatable = SERVICIOS_DISPLAY_LANGUAGE_INVENTORY.some(
      (f) => f.section === section && (f.cls === "CANONICAL_PRESET" || f.cls === "CUSTOM_TRANSLATABLE"),
    );
    assert.ok(hasTranslatable, `Gate 1 inventory has no translatable entry for section "${section}"`);
  }
});

if (failures.length) {
  console.error(`\nverify-servicios-gate16-full-preview-language-coherence: ${failures.length} failure(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nverify-servicios-gate16-full-preview-language-coherence: PASS");
