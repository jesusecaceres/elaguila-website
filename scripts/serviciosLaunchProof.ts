/**
 * Servicios launch proof (no browser): exercises filter + sort + readiness in-process.
 * Run: `npx tsx scripts/serviciosLaunchProof.ts`
 */
import { evaluateServiciosPublishReadiness } from "../app/(site)/clasificados/publicar/servicios/lib/serviciosPublishReadiness";
import { normalizeClasificadosServiciosApplicationState } from "../app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationNormalize";
import type { ClasificadosServiciosApplicationState } from "../app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationTypes";
import {
  filterServiciosPublicListingRows,
  sortServiciosListingRows,
  type ServiciosResultsFilterQuery,
} from "../app/(site)/clasificados/servicios/lib/serviciosResultsFilter";
import type { ServiciosPublicListingRow } from "../app/(site)/clasificados/servicios/lib/serviciosPublicListingsServer";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function baseState(): ClasificadosServiciosApplicationState {
  return normalizeClasificadosServiciosApplicationState({
    applicationStepIndex: 0,
    businessTypeId: "plomero",
    businessName: "Test Plumbing Co",
    city: "San José",
    physicalStreet: "",
    physicalSuite: "",
    physicalAddressCity: "",
    physicalRegion: "",
    physicalPostalCode: "",
    serviceAreaNotes: "Zona 1\nZona 2",
    phone: "4085551212",
    phoneOffice: "",
    website: "https://example.com",
    whatsapp: "",
    whatsappBusinessUrl: "",
    email: "hi@example.com",
    languageIds: ["lang_es", "lang_en"],
    languageOtherLines: "",
    logoUrl: "",
    coverUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952",
    gallery: [],
    featuredGalleryIds: [],
    videos: [],
    aboutText: "Professional plumbing for homes and businesses.",
    specialtiesLine: "",
    selectedServiceIds: ["plom_fugas"],
    customServiceLabel: "",
    customServiceIncluded: false,
    selectedReasonIds: [],
    customReasonLabel: "",
    customReasonIncluded: false,
    selectedQuickFactIds: [],
    customQuickFactLabel: "",
    customQuickFactIncluded: false,
    leonixVerifiedInterest: true,
    enableCall: true,
    enableMessage: true,
    enableWhatsapp: false,
    enableWebsite: true,
    enableEmail: true,
    primaryCtaId: "",
    secondaryCtaIds: [],
    socialInstagram: "",
    socialFacebook: "",
    socialYoutube: "",
    socialTiktok: "",
    socialLinkedin: "",
    hours: [],
    testimonials: [],
    offerTitle: "Free estimates",
    offerDetails: "",
    offerLink: "",
    offerImageUrl: "",
    offerPdfUrl: "",
    offerPrimaryAsset: "none",
    offerQrLater: false,
    confirmListingAccurate: true,
    confirmPhotosRepresentBusiness: true,
    confirmCommunityRules: true,
  } as ClasificadosServiciosApplicationState);
}

function rowFixture(over: Partial<ServiciosPublicListingRow>): ServiciosPublicListingRow {
  const profile_json = {
    identity: { slug: "test", businessName: "Test" },
    hero: { categoryLine: "Plomería", locationSummary: "San José" },
    contact: {
      messageEnabled: true,
      websiteUrl: "https://example.com",
      email: "a@b.co",
      hours: {
        weeklyRows: [
          { dayLabel: "Sábado", line: "9:00 – 13:00" },
          { dayLabel: "Domingo", line: "Cerrado" },
        ],
      },
    },
    opsMeta: {
      leonixVerifiedInterest: true,
      discovery: {
        languageChipIds: ["lang_es", "lang_en"],
        hasPhysicalAddress: true,
        hasServiceAreaMultiLine: true,
        hasPromoHeadline: true,
        listerAttestationsComplete: true,
      },
    },
    quickFacts: [{ kind: "emergency", label: "24/7" }],
    promo: { id: "p", headline: "Free estimates" },
    serviceAreas: { items: [{ id: "1", label: "A" }, { id: "2", label: "B" }] },
  } as ServiciosPublicListingRow["profile_json"];

  return {
    slug: "test-row",
    business_name: "Test",
    city: "San José",
    published_at: new Date().toISOString(),
    profile_json,
    leonix_verified: true,
    internal_group: "home_trade",
    listing_status: "published",
    owner_user_id: "00000000-0000-0000-0000-000000000001",
    review_rating_avg: 4.5,
    review_rating_count: 2,
    ...over,
  };
}

function main() {
  const st = baseState();
  const readyOk = evaluateServiciosPublishReadiness(st, "en");
  assert(readyOk.ok, "readiness: expected complete state to pass");

  const stBad = { ...st, confirmCommunityRules: false };
  const readyBad = evaluateServiciosPublishReadiness(stBad, "en");
  assert(!readyBad.ok, "readiness: missing attestations must fail");
  assert(readyBad.missing.some((m) => m.id === "legal_attest"), "readiness: expected legal_attest missing");

  const rows = [
    rowFixture({ slug: "a", leonix_verified: false, published_at: "2020-01-02T00:00:00.000Z" }),
    rowFixture({ slug: "b", leonix_verified: true, published_at: "2020-01-02T00:00:00.000Z" }),
  ];

  const q: ServiciosResultsFilterQuery = {
    legal: "1",
    langEs: "1",
    msg: "1",
    wknd: "1",
    phys: "1",
    svcMulti: "1",
    offer: "1",
    vint: "1",
    emergency: "1",
  };
  const filtered = filterServiciosPublicListingRows(rows, "es", q);
  assert(filtered.length === 2, "filters: both fixture rows should match discovery query");

  const sorted = sortServiciosListingRows(rows, "es", "newest");
  assert(sorted[0]?.leonix_verified === true, "ranking: verified listing should sort ahead at same timestamp");

  // eslint-disable-next-line no-console
  console.log("[servicios-launch-proof] OK — readiness, discovery filters, and verified tie-break verified.");
}

main();
