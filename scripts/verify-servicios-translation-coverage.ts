/**
 * SERVICIOS FINAL PRE-PAYMENT CLOSEOUT — ⚠️37 full translation coverage (2026-09-14).
 *
 * Owner evidence: "Traducir anuncio" left the public profile MIXED — About / custom text switched
 * language while preset services, reasons, quick facts, highlights, amenity chips, payment labels,
 * credentials text, coupon text and the generated "Resumen rápido" stayed in the source language.
 * Root cause (coverage / mapping, not the engine): preset chips are stored pre-localized in the
 * SOURCE language and were never re-labelled; render-time id → label lookups (amenities, payment
 * methods, smart summary) used the PAGE locale; several owner-authored fields never entered the
 * translatable bundle.
 *
 * Coverage contract pinned here:
 *   STATIC_UI            locale copy only — never in the payload, never overlaid.
 *   CANONICAL_PRESET     deterministic ES ↔ EN catalog re-label for the destination locale (no API).
 *   CUSTOM_TRANSLATABLE  masked → /api/translate-ad (same engine, v3 cache, no-op guards).
 *   LITERAL_PRESERVE     never sent, never mutated.
 *   Render-time catalog ids resolve with the CONTENT locale (`contentLang`) while headings keep `lang`.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-translation-coverage.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import {
  applyServiciosTranslation,
  buildServiciosTranslatableContent,
  canonicalBusinessTypeLabel,
  canonicalPresetLabel,
  isOwnerAuthoredHeroBadge,
  relabelServiciosCanonicalPresets,
} from "../app/(site)/servicios/lib/serviciosTranslateAd";
import { buildServiciosHowGroups } from "../app/(site)/servicios/lib/serviciosGroupedHowData";
import { buildServiciosPagosGroups } from "../app/(site)/servicios/lib/serviciosPagosBeneficiosData";
import { buildServiciosSmartTrustSummary } from "../app/(site)/servicios/lib/serviciosSmartTrustSummary";
import { getServiciosAmenityOption } from "../app/(site)/servicios/lib/serviciosAmenitiesCatalog";
import { getServiciosPaymentMethodLabel } from "../app/(site)/servicios/lib/serviciosPaymentMethodCatalog";
import { isNoOpTranslation } from "../app/components/translation/TranslateAdControl";
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
 * Fixture: a Spanish-authored profile touching every public field class.
 * ============================================================================================ */
const LITERALS = {
  name: "Carpintería Hernández",
  phone: "+1 408 555 0199",
  email: "hola@carpinteriahernandez.com",
  site: "https://carpinteriahernandez.com",
  yelp: "https://www.yelp.com/biz/carpinteria-hernandez",
  extraUrl: "https://instagram.com/carpinteriahernandez",
  code: "LEONIX10",
  license: "CSLB #1099887",
  authority: "CSLB",
  expires: "2027-03-31",
  area: "San José, CA 95112",
  review: "Excelente trabajo, muy puntuales.",
  zip: "95112",
};

const fixture = {
  identity: { slug: "carpinteria-hernandez", businessName: LITERALS.name },
  hero: {
    title: LITERALS.name,
    categoryLine: "Carpintería",
    badges: [
      { kind: "verified", label: "Verificado" },
      { kind: "spanish", label: "Español" },
      { kind: "custom", label: "Inglés" },
      { kind: "custom", label: "Otro idioma" },
      { kind: "custom", label: "Portugués básico" },
    ],
  },
  about: { text: "Somos una empresa familiar.", specialtiesLine: "Cocinas y closets a medida" },
  services: [
    { id: "svc_carpinteria::carp_muebles", title: "Fabricación de muebles", secondaryLine: "", imageAlt: "Fabricación de muebles" },
    { id: "custom_offer_1", title: "Restauración de antigüedades", secondaryLine: "Presupuesto en 24 h", imageAlt: "Restauración de antigüedades" },
  ],
  trust: [
    { id: "trust_carpinteria::carp_r1", label: "Madera de calidad", icon: "shield" },
    { id: "custom_reason", label: "20 años en San José", icon: "star" },
  ],
  highlights: [
    { id: "bh_preset_bh_free_quote", label: "Cotización gratis" },
    { id: "bh_custom_1", label: "Garantía por escrito" },
  ],
  quickFacts: [
    { kind: "years_experience", label: "Más de 10 años de experiencia" },
    { kind: "custom", label: "Atendemos sábados" },
  ],
  amenityOptionIds: ["service_at_home"],
  customAmenityOptionsByGroup: { availability: ["Atención de emergencia nocturna"] },
  customAmenityOptions: ["Atención de emergencia nocturna"],
  paymentMethodIds: ["zelle", "cash"],
  customPaymentMethods: ["Pago en abonos sin interés"],
  credentials: {
    licenseNumber: LITERALS.license,
    licenseType: "Contratista de carpintería",
    licenseAuthority: LITERALS.authority,
    licenseExpiration: LITERALS.expires,
    insuranceType: "Seguro de responsabilidad civil",
    certifications: ["Certificación en instalación de gabinetes"],
  },
  contact: {
    phoneDisplay: LITERALS.phone,
    email: LITERALS.email,
    websiteHref: LITERALS.site,
    externalReviewLinks: { yelp: LITERALS.yelp },
    extraLinks: [{ label: "Catálogo de trabajos", url: LITERALS.extraUrl }],
    physicalAddressDisplay: LITERALS.area,
  },
  serviceAreas: { items: [{ label: LITERALS.area }] },
  reviews: [{ author: "María", text: LITERALS.review, rating: 5 }],
  coupons: [
    {
      id: "c0",
      title: "10% en tu primer servicio",
      description: "Menciona Leonix",
      couponCode: LITERALS.code,
      redemptionNote: "Presenta este cupón al pagar",
      ctaLabel: "Ver oferta",
      expirationDate: LITERALS.expires,
    },
  ],
  promotions: [
    { id: "p0", headline: "Primera visita gratis", footnote: "Solo clientes nuevos" },
    { id: "p1", headline: "Descuento para adultos mayores" },
  ],
} as unknown as ServiciosProfileResolved;

const SPANISH_PRESETS = ["Fabricación de muebles", "Madera de calidad", "Cotización gratis", "Más de 10 años de experiencia", "Carpintería", "Español", "Inglés", "Otro idioma"];

/* ==============================================================================================
 * B — CANONICAL_PRESET: deterministic ES ↔ EN, never sent to the API.
 * ============================================================================================ */
check("B canonical maps: preset services / reasons / highlights / quick facts / languages / category resolve by id or either-locale label", () => {
  assert.equal(canonicalPresetLabel("service", { id: "carpinteria::carp_muebles", label: "" }, "en"), "Furniture making");
  assert.equal(canonicalPresetLabel("service", { label: "Furniture making" }, "es"), "Fabricación de muebles");
  assert.equal(canonicalPresetLabel("reason", { id: "carpinteria::carp_r1", label: "" }, "en"), "Quality wood");
  assert.equal(canonicalPresetLabel("highlight", { id: "bh_free_quote", label: "" }, "en"), "Free quote");
  assert.equal(canonicalPresetLabel("highlight", { label: "free quote" }, "es"), "Cotización gratis");
  assert.equal(canonicalPresetLabel("language", { label: "Español" }, "en"), "Spanish");
  assert.equal(canonicalPresetLabel("language", { label: "English" }, "es"), "Inglés");
  assert.equal(canonicalPresetLabel("language", { label: "Otro idioma" }, "en"), "Other language");
  assert.equal(canonicalPresetLabel("service", { label: "Restauración de antigüedades" }, "en"), null, "custom text is not a preset");
  assert.equal(canonicalBusinessTypeLabel("Carpintería", "en"), "Carpentry");
  assert.equal(canonicalBusinessTypeLabel("Carpentry", "es"), "Carpintería");
  assert.equal(canonicalBusinessTypeLabel("Reparación de drones", "en"), null, "custom category is owner prose");
});
check("B preset re-label ES → EN covers every preset class and leaves custom items + literals alone", () => {
  const en = relabelServiciosCanonicalPresets(fixture, "en");
  assert.equal(en.hero.categoryLine, "Carpentry");
  assert.deepEqual(en.hero.badges.map((b) => b.label), ["Verificado", "Spanish", "English", "Other language", "Portugués básico"]);
  assert.equal(en.services[0]!.title, "Furniture making");
  assert.equal(en.services[0]!.imageAlt, "Furniture making", "alt follows the canonical title");
  assert.equal(en.services[1]!.title, "Restauración de antigüedades", "custom service waits for the API");
  assert.equal(en.trust[0]!.label, "Quality wood");
  assert.equal(en.trust[1]!.label, "20 años en San José");
  assert.equal(en.highlights[0]!.label, "Free quote");
  assert.equal(en.highlights[1]!.label, "Garantía por escrito");
  assert.equal(en.quickFacts[0]!.label, "10+ years experience");
  assert.equal(en.quickFacts[1]!.label, "Atendemos sábados");
  assert.equal(en.identity.businessName, LITERALS.name);
  assert.equal(en.contact.phoneDisplay, LITERALS.phone);
  assert.equal(en.coupons[0]!.couponCode, LITERALS.code);
  // Round trip EN → ES restores the Spanish catalog labels.
  const es = relabelServiciosCanonicalPresets(en, "es");
  assert.equal(es.hero.categoryLine, "Carpintería");
  assert.equal(es.services[0]!.title, "Fabricación de muebles");
  assert.equal(es.trust[0]!.label, "Madera de calidad");
  assert.equal(es.highlights[0]!.label, "Cotización gratis");
  assert.equal(es.quickFacts[0]!.label, "Más de 10 años de experiencia");
  assert.deepEqual(es.hero.badges.map((b) => b.label), ["Verificado", "Español", "Inglés", "Otro idioma", "Portugués básico"]);
});

/* ==============================================================================================
 * C / D — CUSTOM_TRANSLATABLE rides the payload; LITERAL_PRESERVE and presets never do.
 * ============================================================================================ */
check("C payload carries every owner-authored public field", () => {
  const content = buildServiciosTranslatableContent(fixture);
  const sent = Object.values(content).filter(Boolean).join("\n");
  assert.equal(content.title, undefined, "preset category line is canonical, not machine-translated");
  assert.equal(content.description, "Somos una empresa familiar.");
  assert.equal(content.customServiceText, "Cocinas y closets a medida");
  assert.equal(content.details, "1\tRestauración de antigüedades\tPresupuesto en 24 h", "only the custom service, indexed");
  assert.equal(content.highlights, "1\tGarantía por escrito");
  assert.equal(content.shareText, "Primera visita gratis");
  const body = content.body ?? "";
  for (const line of [
    "qf\t1\tAtendemos sábados",
    "tr\t1\t20 años en San José",
    "cp\t0\t10% en tu primer servicio\tMenciona Leonix",
    "cn\t0\tPresenta este cupón al pagar\tVer oferta",
    "pr\t1\tDescuento para adultos mayores",
    "pf\t0\tSolo clientes nuevos",
    "cr\tlicenseType\tContratista de carpintería",
    "cr\tinsuranceType\tSeguro de responsabilidad civil",
    "cf\t0\tCertificación en instalación de gabinetes",
    "el\t0\tCatálogo de trabajos",
    "pm\t0\tPago en abonos sin interés",
    "am\tavailability:0\tAtención de emergencia nocturna",
    "hb\t4\tPortugués básico",
  ]) {
    assert.ok(body.includes(line), `body line missing: ${line}\n${body}`);
  }
  assert.ok(isOwnerAuthoredHeroBadge({ kind: "custom", label: "Portugués básico" }));
  assert.ok(!isOwnerAuthoredHeroBadge({ kind: "custom", label: "Inglés" }), "catalog language badge is canonical");
  assert.ok(!isOwnerAuthoredHeroBadge({ kind: "verified", label: "Verificado" }));
  for (const preset of SPANISH_PRESETS) assert.ok(!sent.includes(preset), `preset never sent: ${preset}`);
});
check("D literals never enter the payload", () => {
  const sent = Object.values(buildServiciosTranslatableContent(fixture)).filter(Boolean).join("\n");
  for (const literal of Object.values(LITERALS)) assert.ok(!sent.includes(literal), `literal must not be sent: ${literal}`);
  for (const brand of ["Zelle", "zelle", "cash", "Yelp"]) assert.ok(!sent.includes(brand), `brand/id must not be sent: ${brand}`);
});
check("C+D apply ES → EN: machine text lands on owner fields, presets canonical, literals byte-identical; Ver original intact", () => {
  const translated = applyServiciosTranslation(
    fixture,
    {
      description: "We are a family business.",
      customServiceText: "Custom kitchens and closets",
      details: "1\tAntique restoration\tQuote within 24 h\n0\tSHOULD NOT APPLY (preset)",
      highlights: "1\tWritten warranty\n0\tSHOULD NOT APPLY",
      shareText: "First visit free",
      body: [
        "qf\t1\tOpen on Saturdays",
        "tr\t1\t20 years in San José",
        "cp\t0\t10% off your first service\tMention Leonix",
        "cn\t0\tShow this coupon when paying\tSee offer",
        "pr\t1\tSenior discount",
        "pf\t0\tNew customers only",
        "cr\tlicenseType\tCarpentry contractor",
        "cr\tinsuranceType\tGeneral liability insurance",
        "cf\t0\tCabinet installation certification",
        "el\t0\tWork catalog",
        "pm\t0\tInterest-free installments",
        "am\tavailability:0\tNight emergency service",
        "hb\t4\tBasic Portuguese",
        "hb\t1\tSHOULD NOT APPLY (canonical language)",
      ].join("\n"),
    },
    "en",
  );
  assert.equal(translated.hero.categoryLine, "Carpentry");
  assert.deepEqual(translated.hero.badges.map((b) => b.label), ["Verificado", "Spanish", "English", "Other language", "Basic Portuguese"]);
  assert.equal(translated.about?.text, "We are a family business.");
  assert.equal(translated.about?.specialtiesLine, "Custom kitchens and closets");
  assert.deepEqual(translated.services.map((s) => s.title), ["Furniture making", "Antique restoration"]);
  assert.equal(translated.services[1]!.secondaryLine, "Quote within 24 h");
  assert.deepEqual(translated.trust.map((t) => t.label), ["Quality wood", "20 years in San José"]);
  assert.deepEqual(translated.highlights.map((h) => h.label), ["Free quote", "Written warranty"]);
  assert.deepEqual(translated.quickFacts.map((f) => f.label), ["10+ years experience", "Open on Saturdays"]);
  assert.equal(translated.coupons[0]!.title, "10% off your first service");
  assert.equal(translated.coupons[0]!.description, "Mention Leonix");
  assert.equal(translated.coupons[0]!.redemptionNote, "Show this coupon when paying");
  assert.equal(translated.coupons[0]!.ctaLabel, "See offer");
  assert.equal(translated.coupons[0]!.couponCode, LITERALS.code);
  assert.equal(translated.coupons[0]!.expirationDate, LITERALS.expires);
  assert.equal(translated.promotions[0]!.headline, "First visit free");
  assert.equal(translated.promotions[0]!.footnote, "New customers only");
  assert.equal(translated.promotions[1]!.headline, "Senior discount");
  assert.equal(translated.credentials?.licenseType, "Carpentry contractor");
  assert.equal(translated.credentials?.insuranceType, "General liability insurance");
  assert.deepEqual(translated.credentials?.certifications, ["Cabinet installation certification"]);
  assert.equal(translated.credentials?.licenseNumber, LITERALS.license);
  assert.equal(translated.credentials?.licenseAuthority, LITERALS.authority);
  assert.equal(translated.credentials?.licenseExpiration, LITERALS.expires);
  assert.deepEqual(translated.contact.extraLinks, [{ label: "Work catalog", url: LITERALS.extraUrl }]);
  assert.equal(translated.contact.phoneDisplay, LITERALS.phone);
  assert.equal(translated.contact.email, LITERALS.email);
  assert.equal(translated.contact.websiteHref, LITERALS.site);
  assert.equal(translated.contact.externalReviewLinks?.yelp, LITERALS.yelp);
  assert.equal(translated.contact.physicalAddressDisplay, LITERALS.area);
  assert.deepEqual(translated.customPaymentMethods, ["Interest-free installments"]);
  assert.deepEqual(translated.paymentMethodIds, ["zelle", "cash"], "catalog payment ids untouched");
  assert.deepEqual(translated.customAmenityOptionsByGroup, { availability: ["Night emergency service"] });
  assert.deepEqual(translated.customAmenityOptions, ["Night emergency service"], "legacy flat list regenerated");
  assert.deepEqual(translated.amenityOptionIds, ["service_at_home"], "catalog amenity ids untouched");
  assert.equal(translated.identity.businessName, LITERALS.name);
  assert.deepEqual(translated.serviceAreas, fixture.serviceAreas, "place names literal");
  assert.deepEqual(translated.reviews, fixture.reviews, "customer quotes preserved");
  // "Ver original" = the untouched source object.
  assert.equal(fixture.services[0]!.title, "Fabricación de muebles");
  assert.equal(fixture.hero.categoryLine, "Carpintería");
  assert.equal(fixture.credentials?.licenseType, "Contratista de carpintería");
  assert.equal(fixture.coupons[0]!.redemptionNote, "Presenta este cupón al pagar");
  assert.equal(applyServiciosTranslation(fixture, {}), fixture, "empty translation keeps reference identity");
});
check("EN → ES: an English-authored profile re-labels presets to Spanish and applies Spanish machine text", () => {
  const enAuthored = {
    ...fixture,
    hero: { ...fixture.hero, categoryLine: "Carpentry", badges: [{ kind: "spanish", label: "Spanish" }, { kind: "custom", label: "English" }] },
    services: [{ id: "svc_carpinteria::carp_muebles", title: "Furniture making", secondaryLine: "", imageAlt: "Furniture making" }],
    trust: [{ id: "trust_carpinteria::carp_r1", label: "Quality wood", icon: "shield" }],
    highlights: [{ id: "bh_preset_bh_free_quote", label: "Free quote" }],
    quickFacts: [{ kind: "years_experience", label: "10+ years experience" }],
    about: { text: "We are a family business." },
  } as unknown as ServiciosProfileResolved;
  const es = applyServiciosTranslation(enAuthored, { description: "Somos una empresa familiar." }, "es");
  assert.equal(es.hero.categoryLine, "Carpintería");
  assert.deepEqual(es.hero.badges.map((b) => b.label), ["Español", "Inglés"]);
  assert.equal(es.services[0]!.title, "Fabricación de muebles");
  assert.equal(es.trust[0]!.label, "Madera de calidad");
  assert.equal(es.highlights[0]!.label, "Cotización gratis");
  assert.equal(es.quickFacts[0]!.label, "Más de 10 años de experiencia");
  assert.equal(es.about?.text, "Somos una empresa familiar.");
});

/* ==============================================================================================
 * Render-time catalog ids follow the CONTENT locale; headings follow the PAGE locale.
 * ============================================================================================ */
check("Cómo trabaja: amenity options + custom lines + language badges render in the content locale under page-locale headings", () => {
  const overlay = applyServiciosTranslation(fixture, { body: "am\tavailability:0\tNight emergency service\nhb\t4\tBasic Portuguese" }, "en");
  const groups = buildServiciosHowGroups(overlay, "es", "en");
  const flat = groups.flatMap((g) => g.items);
  assert.ok(flat.includes(getServiciosAmenityOption("service_at_home")!.label.en), "catalog option in EN");
  assert.ok(!flat.includes(getServiciosAmenityOption("service_at_home")!.label.es), "no Spanish catalog leak");
  assert.ok(flat.includes("Night emergency service"), "custom amenity from the overlay");
  assert.ok(flat.includes("Spanish") && flat.includes("English") && flat.includes("Basic Portuguese"), `languages in EN: ${flat.join(" | ")}`);
  const titles = groups.map((g) => g.title);
  assert.ok(titles.includes("Disponibilidad") || titles.includes("Servicio"), `headings stay page-locale (ES): ${titles.join(" | ")}`);
  // Default: itemLang follows lang (behaviour unchanged when not translated).
  const plain = buildServiciosHowGroups(fixture, "es").flatMap((g) => g.items);
  assert.ok(plain.includes(getServiciosAmenityOption("service_at_home")!.label.es));
});
check("Pagos y beneficios: catalog payment labels follow the content locale; custom labels come from the overlay", () => {
  const overlay = applyServiciosTranslation(fixture, { body: "pm\t0\tInterest-free installments" }, "en");
  const groups = buildServiciosPagosGroups(fixture, overlay, "es", "en");
  const labels = groups.flatMap((g) => g.items.map((i) => i.label));
  assert.ok(labels.includes(getServiciosPaymentMethodLabel("zelle", "en")));
  assert.ok(labels.includes(getServiciosPaymentMethodLabel("cash", "en")), `cash in EN: ${labels.join(" | ")}`);
  assert.ok(!labels.includes(getServiciosPaymentMethodLabel("cash", "es")), "no Spanish catalog leak");
  assert.ok(labels.includes("Interest-free installments"), "custom payment label translated");
  assert.ok(labels.includes("Free quote"), "preset highlight canonical EN");
  assert.ok(!labels.includes("Cotización gratis"));
  const plain = buildServiciosPagosGroups(fixture, fixture, "es").flatMap((g) => g.items.map((i) => i.label));
  assert.ok(plain.includes(getServiciosPaymentMethodLabel("cash", "es")), "untranslated view unchanged");
});
check("G Resumen rápido regenerates as ONE unit in the content locale (no mixed sentence)", () => {
  const overlay = applyServiciosTranslation(fixture, { description: "We are a family business.", customServiceText: "Custom kitchens and closets" }, "en");
  const en = buildServiciosSmartTrustSummary(overlay, "en");
  assert.ok(en, "summary exists for the fixture");
  // The business NAME is a literal and legitimately contains "Carpintería" — strip it before scanning.
  const text = `${en!.paragraph} ${en!.chips.join(" ")}`.split(LITERALS.name).join("");
  for (const es of ["Fabricación de muebles", "Cocinas y closets", "Carpintería", "Cotización gratis", "Efectivo"]) {
    assert.ok(!text.includes(es), `Spanish leak in EN summary: ${es}\n${text}`);
  }
  const esModel = buildServiciosSmartTrustSummary(fixture, "es");
  assert.ok(esModel && !esModel.paragraph.includes("Furniture making"), "Spanish summary stays Spanish");
});

/* ==============================================================================================
 * A — STATIC_UI stays locale copy; wiring; cache / no-op protections; known-source callers.
 * ============================================================================================ */
check("A static chrome never enters the payload or the overlay module", () => {
  const overlay = raw("app/(site)/servicios/lib/serviciosTranslateAd.ts");
  for (const chrome of ["Sobre nosotros", "Contáctanos", "Nuestra ubicación", "Horarios", "Galería", "Nuestros servicios", "Confianza y credenciales", "Pagos y beneficios", "Cómo trabaja", "Cómo llegar", "Compartir", "Cerrar", "getServiciosProfileLabels"]) {
    assert.ok(!overlay.includes(chrome), `overlay must not reference chrome: ${chrome}`);
  }
  const sent = Object.values(buildServiciosTranslatableContent(fixture)).filter(Boolean).join("\n");
  for (const chrome of ["Sobre nosotros", "Contáctanos", "Nuestra ubicación", "Horarios", "Galería", "Nuestros servicios", "Confianza", "Pagos y beneficios", "Cómo trabaja", "Cómo llegar", "Compartir", "Resumen rápido", "Disponibilidad", "Clientes que atiende", "Accesibilidad", "Descuentos y beneficios"]) {
    assert.ok(!sent.includes(chrome), `chrome must not be sent: ${chrome}`);
  }
  // Section headings are page-locale copy, independent of contentLang.
  const how = raw("app/(site)/servicios/components/ServiciosGroupedHowSection.tsx");
  assert.ok(how.includes('lang === "en" ? "How this business works" : "Cómo trabaja este negocio"'));
  assert.ok(how.includes("buildServiciosHowGroups(displayProfile ?? profile, lang, contentLang ?? lang)"));
  const pagos = raw("app/(site)/servicios/components/ServiciosPagosBeneficiosSection.tsx");
  assert.ok(pagos.includes('lang === "en" ? "Payments & benefits" : "Pagos y beneficios"'));
  assert.ok(pagos.includes("buildServiciosPagosGroups(profile, displayProfile, lang, itemLang)"));
  const summary = raw("app/(site)/servicios/components/ServiciosSmartTrustSummary.tsx");
  assert.ok(summary.includes("buildServiciosSmartTrustSummary(profile, contentLang ?? lang)") && summary.includes("getServiciosSmartTrustSummaryCopy(lang)"));
  const howData = raw("app/(site)/servicios/lib/serviciosGroupedHowData.ts");
  assert.ok(howData.includes("def?.label[itemLang] ?? id"), "amenity option labels follow the content locale");
  const pagosData = raw("app/(site)/servicios/lib/serviciosPagosBeneficiosData.ts");
  assert.ok(pagosData.includes("getServiciosPaymentMethodLabel(id, itemLang)") && pagosData.includes("displayProfile.customPaymentMethods"));
});
check("wiring: both public shells thread displayLang/contentLang and the overlay to every business-content section", () => {
  const layer = raw("app/(site)/servicios/components/ServiciosPublicTranslationLayer.tsx");
  assert.ok(layer.includes("applyServiciosTranslation(profile, translation.translated, translatedLang)"));
  assert.ok(layer.includes("translation?.effectiveTargetLocale ?? translation?.targetLocale"), "content locale = effective target");
  assert.ok(layer.includes("return { displayProfile, translateControl, displayLang };"));
  for (const rel of [
    "app/(site)/servicios/components/ServiciosProfileView.tsx",
    "app/(site)/servicios/components/ServiciosProfessionalProfileShell.tsx",
  ]) {
    const src = raw(rel);
    assert.ok(src.includes("const { displayProfile, translateControl, displayLang } = useServiciosPublicTranslation("), `${rel}: displayLang consumed`);
    assert.ok(src.includes("<ServiciosGroupedHowSection profile={profile} displayProfile={displayProfile} lang={lang} contentLang={displayLang} />"), `${rel}: how section`);
    assert.ok(src.includes("contentLang={displayLang}"), `${rel}: canvas/pagos content locale`);
    assert.ok(/<ServiciosBusinessHubContactCard\s+profile=\{displayProfile\}/.test(src), `${rel}: contact card renders overlay labels`);
    assert.ok(!src.includes("<ServiciosGroupedHowSection profile={profile} lang={lang} />"), `${rel}: no stale mount`);
  }
});
check("cache / no-op protections and known-source callers are untouched", () => {
  const layer = raw("app/(site)/servicios/components/ServiciosPublicTranslationLayer.tsx");
  assert.ok(layer.includes('version="servicios-t4-v3"'), "v3 cache key kept");
  const control = raw("app/components/translation/TranslateAdControl.tsx");
  assert.ok(control.includes("export function isNoOpTranslation"), "no-op guard exported");
  assert.ok(isNoOpTranslation({ description: "Hola" }, { description: "Hola" }), "identical output is a no-op");
  assert.ok(!isNoOpTranslation({ description: "Hola" }, { description: "Hello" }));
  const route = raw("app/api/translate-ad/route.ts");
  assert.ok(route.includes('if (parsed.sourceLocale !== "unknown") {'), "known-source early path intact");
  for (const rel of [
    "app/(site)/clasificados/autos/components/AutosListingTranslationLayer.tsx",
    "app/(site)/clasificados/empleos/components/EmpleosJobTranslationLayer.tsx",
  ]) {
    try {
      assert.ok(!raw(rel).includes("serviciosTranslateAd"), `${rel}: no Servicios coupling`);
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
    }
  }
  assert.ok(!raw("app/(site)/servicios/lib/serviciosTranslateAd.ts").includes("fetch("), "no second engine: the overlay is pure");
});

if (failures.length) {
  console.error(`\n${failures.length} failure(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nverify-servicios-translation-coverage: PASS");
