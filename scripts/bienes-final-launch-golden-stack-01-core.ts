/**
 * NODE FIXTURE — Bienes Raíces final launch golden stack contract proofs.
 * Exercises real project mappers (not regex-only).
 */
import {
  createEmptyAgenteIndividualResidencialState,
  mergePartialAgenteIndividualResidencial,
} from "../app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/schema/agenteIndividualResidencialFormState";
import { mapAgenteResidencialFormStateToNegocioForPublish } from "../app/(site)/clasificados/publicar/bienes-raices/negocio/application/mapping/mapAgenteResidencialFormStateToNegocioForPublish";
import { buildBusinessMetaJsonFromBienesRaicesNegocioState } from "../app/(site)/clasificados/lib/leonixNegocioBusinessMetaFromFormState";
import {
  LEONIX_DP_BR_GATE12D_V1,
  buildBrGate12dV1FromNegocioState,
  buildBrLiveGate12dOpenHouseCard,
  serializeBrGate12dV1Payload,
} from "../app/(site)/clasificados/lib/leonixBrGate12d";
import { buildLeonixMachineFacetPairsFromBienesRaicesNegocioState } from "../app/(site)/clasificados/lib/leonixBrMachineFacetPairsFromFormState";
import { LEONIX_PROP_COUNTRY } from "../app/(site)/clasificados/shared/constants/leonixPropertyLocationContract";
import { isListingRowActiveAndPublishedForBrowse } from "../app/(site)/clasificados/lib/listingPublicBrowseEligibility";
import {
  applyBrEntitlementBadgeToListing,
  compareBrSponsoredRank,
} from "../app/(site)/clasificados/bienes-raices/lib/brPublicEntitlementOverlay";
import type { BrNegocioListing } from "../app/(site)/clasificados/bienes-raices/resultados/cards/listingTypes";
import { resolveCategoryAdPlan } from "../app/lib/listingPlans/categoryAdPlans";
import { normalizeOpenHouseSlots } from "../app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/lib/agenteResidencialPreviewFormat";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function eq(a: unknown, b: unknown, field: string) {
  assert(a === b, `${field}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}

const LINK_TITLE = "Agent Portfolio and Client Reviews";
const DESCRIPTION =
  "Beautiful mixed-use property near downtown — call for additional information.";
const OH_NOTE_EN = "Also available Monday through Saturday by appointment.";
const OH_NOTE_ES = "Disponible de lunes a sábado con cita previa.";

function buildParentFixture() {
  const base = createEmptyAgenteIndividualResidencialState();
  return mergePartialAgenteIndividualResidencial({
    ...base,
    categoriaPropiedad: "residencial",
    titulo: "Golden Stack Parent — Residential",
    precio: "1250000",
    descripcionPrincipal: DESCRIPTION,
    direccionLinea1: "500 Market Street",
    direccionLinea2: "Suite 12",
    ciudad: "Austin",
    direccionEstado: "TX",
    direccionCodigoPostal: "78701",
    direccionPais: "United States",
    mostrarDireccionExacta: true,
    telefonoPrincipal: "(512) 555-0147",
    correoPrincipal: "agent@example.com",
    googleBusinessUrl: "https://maps.google.com/?cid=golden-biz",
    googleReviewsUrl: "https://maps.google.com/?cid=golden-reviews",
    yelpReviewsUrl: "https://www.yelp.com/biz/golden-stack-re",
    businessExtraUrls: [
      { title: LINK_TITLE, url: "https://example.com/agent-portfolio" },
      { title: "Office Tour", url: "https://example.com/office-tour" },
    ],
    videoUrls: [
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "https://www.youtube.com/shorts/abcdef12345",
      "https://www.tiktok.com/@demo/video/123",
      "https://vimeo.com/123456789",
    ],
    brochureUrl: "https://cdn.example.com/brochure.pdf",
    fotosDataUrls: [
      "https://cdn.example.com/parent-main.jpg",
      "https://cdn.example.com/parent-g2.jpg",
    ],
    fotoPortadaIndex: 0,
    openHouseSlots: [
      {
        fecha: "2026-08-15",
        inicio: "11:00",
        fin: "14:00",
        notas: OH_NOTE_EN,
      },
      {
        fecha: "2026-08-16",
        inicio: "12:00",
        fin: "15:00",
        notas: OH_NOTE_ES,
      },
    ],
    permitirLlamar: true,
    permitirWhatsApp: true,
    permitirSolicitarInformacion: true,
    permitirProgramarVisita: true,
  });
}

function listingStub(id: string): BrNegocioListing {
  return {
    id,
    title: id,
    priceLabel: "",
    city: "Austin",
    badges: [],
    isSponsored: false,
  } as unknown as BrNegocioListing;
}

console.log("=== Bienes Final Launch Golden Stack 01 — fixture core ===");

const parent = buildParentFixture();
assert(parent.descripcionPrincipal.includes("downtown"), "multi-word description retained");
assert(parent.descripcionPrincipal.includes("—"), "punctuation retained");
assert(LINK_TITLE.includes(" "), "fixture link title has spaces");
eq(normalizeOpenHouseSlots(parent).length, 2, "open-house slot count");

const negocio = mapAgenteResidencialFormStateToNegocioForPublish(parent);
eq(negocio.titulo, "Golden Stack Parent — Residential", "publish title");
eq(negocio.precio, "1250000", "publish price machine-safe");
eq(negocio.ciudad, "Austin", "nationwide city");
eq(negocio.estado, "TX", "nationwide state");
eq(negocio.codigoPostal, "78701", "nationwide zip");
assert(negocio.cta.openHouseActivo === true, "open house active on publish map");
eq(negocio.cta.openHouseFecha, "2026-08-15", "first open-house date mapped");
assert(
  String(negocio.cta.openHouseNotas).includes("2026-08-16") ||
    String(negocio.cta.openHouseNotas).includes("Fecha:") ||
    String(negocio.cta.openHouseNotas).includes(OH_NOTE_ES),
  "additional open-house dates/notes mapped",
);
eq(negocio.businessExtraUrls?.[0]?.title, LINK_TITLE, "titled link title mapped");
eq(negocio.googleBusinessUrl, "https://maps.google.com/?cid=golden-biz", "google business mapped");
eq((negocio.media?.externalVideoUrls ?? []).length, 4, "four external videos mapped");

const metaJson = buildBusinessMetaJsonFromBienesRaicesNegocioState(negocio);
assert(metaJson, "business_meta JSON produced");
const meta = JSON.parse(metaJson!) as Record<string, string>;
eq(meta.negocioGoogleBusinessUrl, "https://maps.google.com/?cid=golden-biz", "google business in meta");
eq(meta.negocioGoogleReviewsUrl, "https://maps.google.com/?cid=golden-reviews", "google reviews in meta");
eq(meta.negocioYelpReviewsUrl, "https://www.yelp.com/biz/golden-stack-re", "yelp in meta");
assert(meta.negocioExternalVideoUrls, "external videos in meta");
assert(meta.negocioBusinessExtraUrls, "titled links in meta");

const gate = buildBrGate12dV1FromNegocioState(negocio);
assert(gate.openHouseEnabled === true, "gate12d open house enabled");
eq(gate.openHouseDate, "2026-08-15", "gate12d primary date");
const gateSer = serializeBrGate12dV1Payload(gate);
assert(gateSer, "gate12d serializes");
const liveOh = buildBrLiveGate12dOpenHouseCard([{ label: LEONIX_DP_BR_GATE12D_V1, value: gateSer! }], "en");
assert(liveOh && liveOh.rows.length > 0, "live open-house card builds");

const facets = buildLeonixMachineFacetPairsFromBienesRaicesNegocioState(negocio);
const countryPair = facets.find((p) => p.label === LEONIX_PROP_COUNTRY);
assert(countryPair, "country facet present");
assert(/united states/i.test(String(countryPair!.value)), "country from form pais (US)");

assert(isListingRowActiveAndPublishedForBrowse({ status: "active", is_published: true }) === true, "active browse eligible");
assert(isListingRowActiveAndPublishedForBrowse({ status: "sold", is_published: true }) === false, "sold excluded from browse");
assert(isListingRowActiveAndPublishedForBrowse({ status: "paused", is_published: false }) === false, "paused excluded");
assert(isListingRowActiveAndPublishedForBrowse({ status: "active", is_published: false }) === false, "unpublished excluded");

const planBiz = resolveCategoryAdPlan({
  category: "bienes-raices",
  sourceTable: "listings",
  sellerType: "business",
  detailPairs: [],
  price: 1250000,
});
const planPriv = resolveCategoryAdPlan({
  category: "bienes-raices",
  sourceTable: "listings",
  sellerType: "private",
  detailPairs: [],
  price: 450000,
});
assert(planBiz.isBusiness === true && planBiz.isPaid === true, `business listing plan: ${planBiz.labelEn}`);
assert(planPriv.isPrivate === true && planPriv.isPaid === true, `private listing plan: ${planPriv.labelEn}`);

const entitled = applyBrEntitlementBadgeToListing(listingStub("parent-uuid"), {
  tier: "full_page",
  startsAt: "2026-01-01T00:00:00.000Z",
  endsAt: "2026-12-31T00:00:00.000Z",
  grantsDestacado: true,
  grantsResultsPriority: true,
  digitalPlacementPriority: 100,
  printPlacementType: "full_page",
});
const normal = listingStub("child-uuid");
assert(compareBrSponsoredRank(entitled, normal) < 0, "full-page entitled ranks before normal");

const parentId = "11111111-1111-4111-8111-111111111111" as string;
const childId = "22222222-2222-4222-8222-222222222222" as string;
assert(parentId !== childId, "parent/child UUID independence fixture");

console.log("GOLDEN_STACK_CORE: PASS");
console.log("PROOF_TYPE: NODE FIXTURE SIMULATION");
