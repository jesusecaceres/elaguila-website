/**
 * Globalization Build 04, Gate 20 — Translation fixtures for the two newly-adopted categories
 * (Comida Local, Ofertas Locales). Runs the real builder/apply functions against constructed
 * fixtures — no live translation-provider call. Proves: human-facing text is sent for
 * translation; phone/email/URL/price/IDs/structured values are never sent and never mutated by
 * applying a translation result.
 *
 * Run: npx tsx scripts/verify-globalization-translation-04-fixtures.ts
 */
import { strict as assert } from "node:assert";
import {
  applyComidaLocalTranslation,
  buildComidaLocalTranslatableContent,
} from "../app/lib/clasificados/comida-local/comidaLocalTranslateAd";
import {
  applyOfertasLocalesTranslation,
  buildOfertasLocalesTranslatableContent,
} from "../app/lib/ofertas-locales/ofertasLocalesTranslateAd";
import type { ComidaLocalPreviewVm } from "../app/lib/clasificados/comida-local/comidaLocalPreviewTypes";
import type { OfertaLocalPublicOfferDetail } from "../app/lib/ofertas-locales/ofertasLocalesTypes";

const failures: string[] = [];
function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK: ${name}`);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
    console.error(`FAIL: ${name}`);
    console.error(`  ${e instanceof Error ? e.message : String(e)}`);
  }
}

// =================================================================================
// Comida Local
// =================================================================================

function comidaLocalFixtureVm(): ComidaLocalPreviewVm {
  return {
    businessName: "Tacos Doña Lupe",
    mainImage: null,
    logoImage: null,
    foodTypeChips: [],
    orderLink: null,
    eventScheduleNote: "",
    cateringServiceRadiusNote: "",
    cateringEventInfoNote: "",
    mealPrepScheduleNote: "",
    locationLine: "Houston, TX",
    queVendes: "Vendemos tacos al pastor y elotes preparados los fines de semana.",
    locationNote: "Afuera de la tienda HEB en Bissonnet.",
    availabilityNote: "Sábados y domingos de 10am a 3pm.",
    serviceChips: [],
    paymentChips: [],
    languageLabels: [],
    priceLevelLabel: "$$",
    contactActions: [
      { id: "call", label: "Llamar", href: "tel:+17135550100", variant: "primary" },
      { id: "whatsapp", label: "WhatsApp", href: "https://wa.me/17135550100", variant: "whatsapp" },
      { id: "instagram", label: "Instagram", href: "https://instagram.com/tacosdonalupe", variant: "social", platform: "instagram" },
      { id: "facebook", label: "Facebook", href: "https://facebook.com/tacosdonalupe", variant: "social", platform: "facebook" },
    ],
    reviewLinks: [],
    galleryImages: [],
    businessTypeLabel: "",
    highlightChips: [],
    additionalWebsites: [],
    businessAddressLine: "",
    isOpenNow: null,
    hoursLines: [],
    sections: {
      showContact: true,
      showQueVendes: true,
      showLocationAvailability: true,
      showService: false,
      showPayment: false,
      showExtras: false,
      showGallery: false,
      showHighlights: false,
      showAdditionalWebsites: false,
      showBusinessAddress: false,
      showHours: false,
      showOrderLink: false,
      showEventSchedule: false,
      showCateringDetails: false,
      showMealPrepSchedule: false,
    },
    previewIssues: [],
    previewReady: true,
  };
}

check("Comida Local: translatable content includes queVendes/locationNote/availabilityNote as description/details/highlights", () => {
  const vm = comidaLocalFixtureVm();
  const content = buildComidaLocalTranslatableContent(vm);
  assert.equal(content.description, vm.queVendes);
  assert.equal(content.details, vm.locationNote);
  assert.equal(content.highlights, vm.availabilityNote);
});

check("Comida Local: translatable content never includes contact hrefs (phone/whatsapp/social) or price level", () => {
  const vm = comidaLocalFixtureVm();
  const content = buildComidaLocalTranslatableContent(vm);
  const serialized = JSON.stringify(content);
  for (const action of vm.contactActions) {
    assert.ok(!serialized.includes(action.href), `contact href ${action.href} must never reach the translation payload`);
  }
  assert.ok(!serialized.includes(vm.priceLevelLabel));
});

check("Comida Local: applying a translation result only changes queVendes/locationNote/availabilityNote — contact actions/price untouched", () => {
  const vm = comidaLocalFixtureVm();
  const translated = applyComidaLocalTranslation(vm, {
    description: "We sell al pastor tacos and prepared elote on weekends.",
    details: "Outside the HEB store on Bissonnet.",
    highlights: "Saturdays and Sundays 10am to 3pm.",
  });
  assert.equal(translated.queVendes, "We sell al pastor tacos and prepared elote on weekends.");
  assert.equal(translated.locationNote, "Outside the HEB store on Bissonnet.");
  assert.equal(translated.availabilityNote, "Saturdays and Sundays 10am to 3pm.");
  assert.deepEqual(translated.contactActions, vm.contactActions, "contact actions/hrefs must never be touched by translation");
  assert.equal(translated.priceLevelLabel, vm.priceLevelLabel);
  assert.equal(translated.businessName, vm.businessName, "business identity must never be translated");
});

check("Comida Local: an empty translation result leaves the vm unchanged (no field wiped to blank)", () => {
  const vm = comidaLocalFixtureVm();
  const translated = applyComidaLocalTranslation(vm, {});
  assert.deepEqual(translated, vm);
});

// =================================================================================
// Ofertas Locales
// =================================================================================

function ofertasLocalesFixtureOffer(): OfertaLocalPublicOfferDetail {
  return {
    id: "offer-fixture-1",
    leonixAdId: "LX-OFERTA-1",
    businessName: "Supermercado El Sol",
    offerType: "flyer",
    city: "Houston",
    state: "TX",
    zipCode: "77036",
    validFrom: "2026-08-01",
    validUntil: "2026-08-31",
    description: "Ofertas especiales de fin de semana en frutas y verduras frescas.",
    couponText: "Presenta este cupón en caja para tu descuento.",
    flyerTitle: "Volante de agosto",
    whatsappHref: "https://wa.me/17135550100",
    flyerAssets: [],
    couponAssets: [],
    membershipUrl: "https://elsol.example.com/membresia",
    membershipCtaLabel: "Únete",
    membershipNote: "Los miembros reciben 10% de descuento adicional todos los martes.",
    requiresMembershipForDeals: false,
    digitalCouponUrl: "https://elsol.example.com/cupon-digital",
    digitalCouponNote: "Cupón digital válido solo en la app.",
    socialLinks: {} as OfertaLocalPublicOfferDetail["socialLinks"],
    wantsAiSearchableSpecials: true,
    isExpired: false,
    businessLogoHref: null,
    phoneDisplay: "(713) 555-0100",
    pickupLocations: [],
  } as unknown as OfertaLocalPublicOfferDetail;
}

check("Ofertas Locales: translatable content includes only offer.description (as description) and offer.membershipNote (as highlights)", () => {
  const offer = ofertasLocalesFixtureOffer();
  const content = buildOfertasLocalesTranslatableContent(offer);
  assert.equal(content.description, offer.description);
  assert.equal(content.highlights, offer.membershipNote);
  assert.equal(Object.keys(content).length, 2, "must send exactly description + highlights, nothing else");
});

check("Ofertas Locales: translatable content never includes couponText, phone, URLs, city/state/zip, or ids", () => {
  const offer = ofertasLocalesFixtureOffer();
  const content = buildOfertasLocalesTranslatableContent(offer);
  const serialized = JSON.stringify(content);
  assert.ok(!serialized.includes(offer.couponText));
  assert.ok(!serialized.includes(offer.phoneDisplay));
  assert.ok(!serialized.includes(offer.whatsappHref ?? "unreachable"));
  assert.ok(!serialized.includes(offer.membershipUrl ?? "unreachable"));
  assert.ok(!serialized.includes(offer.digitalCouponUrl ?? "unreachable"));
  assert.ok(!serialized.includes(offer.city));
  assert.ok(!serialized.includes(offer.id));
  assert.ok(!serialized.includes(offer.leonixAdId ?? "unreachable"));
});

check("Ofertas Locales: applying a translation result only changes description/membershipNote — every price/contact/id/URL field untouched", () => {
  const offer = ofertasLocalesFixtureOffer();
  const translated = applyOfertasLocalesTranslation(offer, {
    description: "Special weekend deals on fresh fruits and vegetables.",
    highlights: "Members get an extra 10% off every Tuesday.",
  });
  assert.equal(translated.description, "Special weekend deals on fresh fruits and vegetables.");
  assert.equal(translated.membershipNote, "Members get an extra 10% off every Tuesday.");
  assert.equal(translated.couponText, offer.couponText, "couponText is not part of this adoption and must stay untouched");
  assert.equal(translated.phoneDisplay, offer.phoneDisplay);
  assert.equal(translated.whatsappHref, offer.whatsappHref);
  assert.equal(translated.membershipUrl, offer.membershipUrl);
  assert.equal(translated.digitalCouponUrl, offer.digitalCouponUrl);
  assert.equal(translated.digitalCouponNote, offer.digitalCouponNote, "item-adjacent digital coupon note is not offer.description/membershipNote and must stay untouched");
  assert.equal(translated.city, offer.city);
  assert.equal(translated.id, offer.id);
  assert.equal(translated.businessName, offer.businessName, "business identity must never be translated");
});

check("Ofertas Locales: an empty translation result leaves the offer unchanged (no field wiped to blank)", () => {
  const offer = ofertasLocalesFixtureOffer();
  const translated = applyOfertasLocalesTranslation(offer, {});
  assert.deepEqual(translated, offer);
});

if (failures.length) {
  console.error(`\n${failures.length} check(s) FAILED`);
  process.exit(1);
}
console.log("\nverify-globalization-translation-04-fixtures: PASS");
