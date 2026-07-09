#!/usr/bin/env node
/**
 * SVC-SHELL-2D — Restaurante blueprint measurement lock for Servicios contact + grouped sections.
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

function indexAfter(haystack, first, second, label) {
  const a = haystack.indexOf(first);
  const b = haystack.indexOf(second);
  assert(a >= 0, `${label}: missing ${first}`);
  assert(b >= 0, `${label}: missing ${second}`);
  assert(a < b, `${label}: expected ${first} before ${second}`);
}

const contactCard = read("app/(site)/servicios/components/ServiciosBusinessHubContactCard.tsx");
const contactTokens = read("app/(site)/servicios/lib/serviciosContactHubLeonix.ts");
const shellTokens = read("app/(site)/servicios/lib/serviciosShellSectionTokens.ts");
const howSection = read("app/(site)/servicios/components/ServiciosGroupedHowSection.tsx");
const pagosSection = read("app/(site)/servicios/components/ServiciosPagosBeneficiosSection.tsx");
const detailsCanvas = read("app/(site)/servicios/components/ServiciosPublicDetailsCanvas.tsx");
const hubMapper = read("app/(site)/servicios/lib/mapServiciosProfileToBusinessHubContact.ts");
const proShell = read("app/(site)/servicios/components/ServiciosProfessionalProfileShell.tsx");
const stdShell = read("app/(site)/servicios/components/ServiciosProfileView.tsx");
const previewShell = read("app/(site)/clasificados/publicar/servicios/preview/ServiciosProfessionalPreviewShell.tsx");
const restauranteHub = read("app/(site)/clasificados/restaurantes/shell/RestaurantContactHub.tsx");
const restauranteFeatures = read("app/(site)/clasificados/restaurantes/shell/RestauranteGroupedFeaturesSection.tsx");
const restauranteAmenities = read("app/(site)/clasificados/restaurantes/shell/RestauranteAmenitiesShellSection.tsx");
const canvas = read("app/(site)/servicios/components/ServiciosPublicDetailsCanvas.tsx");
const pkg = read("package.json");

assert(contactTokens.includes("lg:grid-cols-3"), "contact tokens: primary 3-col grid");
assert(contactTokens.includes("sm:grid-cols-2 lg:grid-cols-3"), "contact tokens: secondary row grid");
assert(contactTokens.includes("rounded-lg border border-[#D4C4A8]"), "contact tokens: compact map wrapper");

assert(contactCard.includes("SCH_HUB_CARD"), "contact card: inner RCH-style hub card");
assert(contactCard.includes("SCH_PRIMARY_GRID"), "contact card: 3-column primary grid");
assert(contactCard.includes("SCH_SECONDARY_GRID"), "contact card: secondary reviews/social/find-us row");
assert(contactCard.includes("SCH_MAP_WRAP"), "contact card: compact map wrapper");
assert(contactCard.includes("ServiciosBusinessHubMapPanel"), "contact card: real map panel in column");
assert(contactCard.includes("ServiciosHubReviewLinkButton"), "contact card: reviews in secondary row");
assert(!contactCard.includes("HubDivider"), "contact card: no long vertical divider stack");
assert(!contactCard.includes("border-2 border-[#D4C4A8] shadow-md ring-1 ring-[#C9A84A]/20"), "contact card: no oversized map border wrapper");

assert(shellTokens.includes("lg:grid-cols-4"), "shell tokens: grouped features compact grid");
assert(shellTokens.includes("xl:grid-cols-6"), "shell tokens: amenities xl grid");
assert(shellTokens.includes("text-[10px]"), "shell tokens: compact chip text");

assert(howSection.includes("SVC_GROUP_BLOCK"), "how section: group block cards");
assert(howSection.includes("SVC_FEATURES_COMPACT_GRID"), "how section: sm:2 lg:4 grid");
assert(howSection.includes("SVC_FEATURE_CHIP"), "how section: compact feature chips");

assert(pagosSection.includes("SVC_PAGOS_BENEFICIOS_GRID"), "pagos section: even-thirds grid");
assert(pagosSection.includes("resolveServiciosPagosGroupIcon"), "pagos section: group icon resolver");
assert(shellTokens.includes("lg:grid-cols-3"), "shell tokens: lg:grid-cols-3");

assert(detailsCanvas.includes("ServiciosCredencialesCard"), "details canvas: credentials preserved");
assert(!detailsCanvas.includes("ServiciosOpcionesFacilidadesCard"), "details canvas: how moved out");
assert(!detailsCanvas.includes("ServiciosPagosCard"), "details canvas: payments moved out");
assert(!detailsCanvas.includes("ServiciosHighlightsSection"), "details canvas: highlights moved out");

assert(hubMapper.includes("Google Business"), "hub mapper: Google Business label");
assert(hubMapper.includes("googleBusiness"), "hub mapper: Google Business mapping");
assert(!hubMapper.includes('label: lang === "en" ? "Google Reviews" : "Google Reviews"'), "hub mapper: reviews not duplicated in find-us");

indexAfter(proShell, "ServiciosPublicDetailsCanvas", "ServiciosGroupedHowSection", "professional shell");
indexAfter(proShell, "ServiciosGroupedHowSection", "ServiciosPagosBeneficiosSection", "professional shell");
indexAfter(stdShell, "ServiciosPublicDetailsCanvas", "ServiciosGroupedHowSection", "standard shell");
indexAfter(previewShell, "ServiciosPublicDetailsCanvas", "ServiciosGroupedHowSection", "preview shell");

assert(restauranteHub === read("app/(site)/clasificados/restaurantes/shell/RestaurantContactHub.tsx"), "restaurante hub unchanged");
assert(restauranteFeatures === read("app/(site)/clasificados/restaurantes/shell/RestauranteGroupedFeaturesSection.tsx"), "restaurante features unchanged");
assert(restauranteAmenities === read("app/(site)/clasificados/restaurantes/shell/RestauranteAmenitiesShellSection.tsx"), "restaurante amenities unchanged");

assert(pkg.includes('"verify:servicios-shell-2d"'), "package.json: verifier registered");

console.log("OK: Restaurante-style 3-col contact hub with compact map");
console.log("OK: Cómo trabaja + Pagos y beneficios use grouped Restaurante measurements");
console.log("OK: credentials canvas preserved; section order locked");
console.log("verify-servicios-shell-2d: PASS");
