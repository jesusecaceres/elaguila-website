/**
 * Servicios template routing + publish wire smoke (no network).
 * Run: npx tsx scripts/smoke-servicios-template-routing.ts
 */
import { getBusinessTypePreset, BUSINESS_TYPE_PRESETS } from "../app/(site)/clasificados/publicar/servicios/lib/businessTypePresets";
import { normalizeClasificadosServiciosApplicationState } from "../app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationNormalize";
import { createDefaultClasificadosServiciosState } from "../app/(site)/clasificados/publicar/servicios/lib/defaultClasificadosServiciosState";
import { mapClasificadosServiciosApplicationToServiciosDraft } from "../app/(site)/clasificados/publicar/servicios/lib/mapClasificadosServiciosApplicationToServiciosDraft";
import { evaluateServiciosPublishReadiness } from "../app/(site)/clasificados/publicar/servicios/lib/serviciosPublishReadiness";
import { evaluateServiciosPreviewReadiness } from "../app/(site)/clasificados/publicar/servicios/lib/serviciosPreviewReadiness";
import { SERVICIOS_LANDING_EXPLORE_CATEGORIES } from "../app/(site)/clasificados/servicios/landing/serviciosLandingSampleData";
import { SERVICIOS_INTERNAL_GROUP_IDS } from "../app/(site)/clasificados/servicios/lib/serviciosInternalGroupDisplay";
import {
  isServiciosProfessionalTemplate,
  readServiciosProfileBusinessTypeId,
  resolveServiciosListingTemplate,
} from "../app/(site)/clasificados/servicios/lib/serviciosTemplateRouting";
import type { ClasificadosServiciosApplicationState } from "../app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationTypes";
import { mapServiciosApplicationDraftToBusinessProfile } from "../app/(site)/servicios/lib/mapServiciosApplicationDraftToBusinessProfile";
import type { ServiciosBusinessProfile, ServiciosLang } from "../app/(site)/servicios/types/serviciosBusinessProfile";

function fail(msg: string): never {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
}

function assertTemplate(
  label: string,
  input: Parameters<typeof resolveServiciosListingTemplate>[0],
  expected: ReturnType<typeof resolveServiciosListingTemplate>,
): void {
  const got = resolveServiciosListingTemplate(input);
  if (got !== expected) {
    fail(`${label}: expected ${expected}, got ${got} (${JSON.stringify(input)})`);
  }
}

console.log("smoke-servicios-template-routing: start");

assertTemplate("abogado_asesoria_legal", { businessTypeId: "abogado_asesoria_legal" }, "legal_provider");
assertTemplate("contador_impuestos", { businessTypeId: "contador_impuestos" }, "financial_provider");
assertTemplate("terapia_fisica", { businessTypeId: "terapia_fisica" }, "clinic_provider");
assertTemplate("jardineria_paisajismo", { businessTypeId: "jardineria_paisajismo" }, "standard_service");
assertTemplate("unknown_service", { businessTypeId: "unknown_service" }, "standard_service");
assertTemplate("category Dentista", { categoryLabel: "Dentista" }, "clinic_provider");
assertTemplate("category Abogado de accidentes", { categoryLabel: "Abogado de accidentes" }, "legal_provider");

assertTemplate("null/empty safe", {}, "standard_service");
assertTemplate("empty strings", { businessTypeId: "", categoryLabel: "   " }, "standard_service");

if (!isServiciosProfessionalTemplate("legal_provider")) fail("legal_provider should be professional");
if (isServiciosProfessionalTemplate("standard_service")) fail("standard_service should not be professional");

// terapia substring guard: spa/masaje therapeutic copy must not flip to clinic
assertTemplate(
  "spa masajes not clinic via terapeuticos",
  { businessTypeId: "spa_masajes", categoryLabel: "Masajes terapéuticos" },
  "standard_service",
);

assertTemplate("consultoria_negocios advisor", { businessTypeId: "consultoria_negocios" }, "advisor_provider");
assertTemplate("consultoria_variada stays standard", { businessTypeId: "consultoria_variada" }, "standard_service");
assertTemplate("marketing stays standard", { businessTypeId: "marketing_publicidad" }, "standard_service");

assertTemplate(
  "contador category wins over legal_professional internal_group",
  { internalGroup: "legal_professional", categoryLabel: "Contador / Impuestos" },
  "financial_provider",
);
assertTemplate(
  "marketing under legal_professional group stays standard",
  { internalGroup: "legal_professional", categoryLabel: "Marketing / Publicidad" },
  "standard_service",
);
assertTemplate(
  "published opsMeta businessTypeId exact map",
  { businessTypeId: "contador_impuestos", internalGroup: "legal_professional" },
  "financial_provider",
);

assertTemplate("dentista_odontologia clinic", { businessTypeId: "dentista_odontologia" }, "clinic_provider");
assertTemplate("clinica_medica clinic", { businessTypeId: "clinica_medica" }, "clinic_provider");
assertTemplate("quiropractico clinic", { businessTypeId: "quiropractico" }, "clinic_provider");
assertTemplate("seguros_cotizaciones advisor", { businessTypeId: "seguros_cotizaciones" }, "advisor_provider");

const abogado = BUSINESS_TYPE_PRESETS.find((p) => p.id === "abogado_asesoria_legal");
if (!abogado) fail("missing abogado_asesoria_legal preset");
const piChipIds = new Set([
  "abog_pi_auto",
  "abog_pi_camion",
  "abog_pi_moto",
  "abog_pi_rideshare",
  "abog_pi_resbalon",
  "abog_pi_perro",
  "abog_pi_muerte",
  "abog_pi_seguro",
]);
for (const id of piChipIds) {
  if (!abogado.suggestedServices.some((c) => c.id === id)) {
    fail(`abogado preset missing PI chip ${id}`);
  }
}
if (BUSINESS_TYPE_PRESETS.some((p) => p.id.startsWith("abogado_") && p.id !== "abogado_asesoria_legal")) {
  fail("unexpected separate abogado_* business type — PI must stay chips on abogado_asesoria_legal");
}

const allowedGroups = new Set<string>(SERVICIOS_INTERNAL_GROUP_IDS);
for (const cat of SERVICIOS_LANDING_EXPLORE_CATEGORIES) {
  if (cat.resultsGroup && !allowedGroups.has(cat.resultsGroup)) {
    fail(`landing explore category ${cat.id}: invalid resultsGroup "${cat.resultsGroup}"`);
  }
}

function buildPublishWire(state: ClasificadosServiciosApplicationState, lang: ServiciosLang): ServiciosBusinessProfile {
  const draft = mapClasificadosServiciosApplicationToServiciosDraft(state, lang);
  draft.identity.slug = "smoke-publish-slug";
  const wire = mapServiciosApplicationDraftToBusinessProfile(draft);
  const opsMeta = { ...wire.opsMeta };
  const publishedBusinessTypeId = state.businessTypeId.trim();
  if (publishedBusinessTypeId) opsMeta.businessTypeId = publishedBusinessTypeId;
  return { ...wire, opsMeta };
}

function readyPublishableState(businessTypeId: string): ClasificadosServiciosApplicationState {
  const preset = getBusinessTypePreset(businessTypeId);
  const chipIds = (preset?.suggestedServices ?? []).slice(0, 2).map((c) => c.id);
  return normalizeClasificadosServiciosApplicationState({
    ...createDefaultClasificadosServiciosState(),
    businessTypeId,
    businessName: "Smoke Test Business",
    city: "León",
    aboutText: "Descripción suficiente para publicar sin problema.",
    enableCall: true,
    phone: "4771234567",
    coverUrl: "https://images.example.com/cover.jpg",
    selectedServiceIds: chipIds,
    customServicesOffered: ["Servicio personalizado"],
    confirmListingAccurate: true,
    confirmPhotosRepresentBusiness: true,
    confirmCommunityRules: true,
    socialX: "https://x.com/smokebiz",
    socialSnapchat: "https://www.snapchat.com/add/smokebiz",
    googleReviewsUrl: "https://www.google.com/maps/place/example/reviews",
    yelpReviewsUrl: "https://www.yelp.com/biz/example",
    extraLink1Url: "https://example.com/menu",
    extraLink1Label: "Menú",
  });
}

const PUBLISH_TYPES: { id: string; template: ReturnType<typeof resolveServiciosListingTemplate> }[] = [
  { id: "plomeria", template: "standard_service" },
  { id: "abogado_asesoria_legal", template: "legal_provider" },
  { id: "dentista_odontologia", template: "clinic_provider" },
  { id: "contador_impuestos", template: "financial_provider" },
  { id: "seguros_cotizaciones", template: "advisor_provider" },
];

for (const { id, template } of PUBLISH_TYPES) {
  const state = readyPublishableState(id);
  const publishReady = evaluateServiciosPublishReadiness(state, "es");
  if (!publishReady.ok) fail(`publish readiness failed for ${id}: ${JSON.stringify(publishReady.missing)}`);

  const withoutTerms = normalizeClasificadosServiciosApplicationState({
    ...state,
    confirmListingAccurate: false,
    confirmPhotosRepresentBusiness: false,
    confirmCommunityRules: false,
  });
  const previewReady = evaluateServiciosPreviewReadiness(withoutTerms, "es");
  if (!previewReady.ok) fail(`preview readiness failed for ${id}: ${JSON.stringify(previewReady.missing)}`);
  const publishBlocked = evaluateServiciosPublishReadiness(withoutTerms, "es");
  if (publishBlocked.ok) fail(`publish readiness should require terms for ${id}`);

  const wire = buildPublishWire(state, "es");
  const storedTypeId = readServiciosProfileBusinessTypeId(wire);
  if (storedTypeId !== id) fail(`wire opsMeta.businessTypeId expected ${id}, got ${storedTypeId}`);
  if ((wire.services?.length ?? 0) < 2) fail(`wire services missing chips/custom for ${id}`);
  if (!wire.contact?.socialLinks?.xUrl) fail(`wire social xUrl missing for ${id}`);
  if (!wire.contact?.externalReviewLinks?.googleReviewsUrl) fail(`wire googleReviewsUrl missing for ${id}`);
  if (!wire.contact?.extraLinks?.length) fail(`wire extraLinks missing for ${id}`);

  const resolvedTemplate = resolveServiciosListingTemplate({
    businessTypeId: storedTypeId,
    internalGroup: getBusinessTypePreset(id)?.internalGroup ?? null,
    categoryLabel: wire.hero?.categoryLine,
  });
  if (resolvedTemplate !== template) {
    fail(`published template for ${id}: expected ${template}, got ${resolvedTemplate}`);
  }
}

const invalidOptional = readyPublishableState("plomeria");
invalidOptional.googleReviewsUrl = "javascript:alert(1)";
invalidOptional.socialX = "ftp://not-allowed.example";
const invalidWire = buildPublishWire(invalidOptional, "es");
if (invalidWire.contact?.externalReviewLinks?.googleReviewsUrl) {
  fail("invalid googleReviewsUrl must not persist on wire");
}
if (invalidWire.contact?.socialLinks?.xUrl) fail("invalid socialX must not persist on wire");
const invalidPublish = evaluateServiciosPublishReadiness(invalidOptional, "es");
if (!invalidPublish.ok) fail("invalid optional URLs should not block publish readiness");

console.log("smoke-servicios-template-routing: OK");
