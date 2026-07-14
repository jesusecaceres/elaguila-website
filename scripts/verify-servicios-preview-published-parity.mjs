#!/usr/bin/env node
/**
 * Servicios preview → results → published parity (Trade + Professional).
 * Static source checks — renderer selection, obsolete chrome removal, card navigation.
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

const slugPage = read("app/(site)/clasificados/servicios/[slug]/page.tsx");
const tradeShell = read("app/(site)/servicios/components/ServiciosProfileView.tsx");
const proShell = read("app/(site)/servicios/components/ServiciosProfessionalProfileShell.tsx");
const proPreview = read("app/(site)/clasificados/publicar/servicios/preview/ServiciosProfessionalPreviewShell.tsx");
const clasPreview = read("app/(site)/clasificados/publicar/servicios/preview/ClasificadosServiciosPreviewClient.tsx");
const templateRouting = read("app/(site)/clasificados/servicios/lib/serviciosTemplateRouting.ts");
const horizontalCard = read("app/(site)/clasificados/servicios/components/ServiciosHorizontalResultCard.tsx");
const proCard = read("app/(site)/clasificados/servicios/ServiciosProfessionalResultCard.tsx");
const bodyLink = read("app/(site)/clasificados/servicios/components/ServiciosResultCardBodyLink.tsx");
const hubRow = read("app/(site)/servicios/components/ServiciosBusinessHubEngagementRow.tsx");
const contactCard = read("app/(site)/servicios/components/ServiciosBusinessHubContactCard.tsx");
const pkg = read("package.json");

// Slug page: explicit public visitor chrome off + template routing
assert(slugPage.includes("isServiciosProfessionalTemplate(listingTemplate)"), "slug: professional template branch");
assert(slugPage.includes("ServiciosProfessionalProfileShell"), "slug: professional shell");
assert(slugPage.includes("ServiciosProfileView"), "slug: trade shell");
assert(slugPage.includes("showTopBar={false}"), "slug: hides ServiciosTopBar on public pages");
assert(slugPage.includes("showMobileSectionNav={false}"), "slug: hides professional bottom section nav on public");
assert(slugPage.includes("resolveServiciosListingTemplate"), "slug: resolves listing template from persisted row");

// Trade public shell marker
assert(tradeShell.includes('data-servicios-public-shell={showTopBar ? undefined : "trade"}'), "trade shell: public mode marker");
assert(tradeShell.includes("showTopBar ?"), "trade shell: conditional top bar");

// Professional public shell — no top bar / mobile nav by default for visitors
assert(proShell.includes('data-servicios-public-shell="professional"'), "pro shell: public mode marker");
assert(proShell.includes("renderTopBar = showTopBar ?? !visitorPublicMode"), "pro shell: visitor public hides top bar");
assert(proShell.includes("renderMobileNav = showMobileSectionNav ?? !visitorPublicMode"), "pro shell: visitor public hides mobile nav");
assert(proShell.includes('data-servicios-hero-engagement="1"'), "pro shell: hero Like/Share cluster");
assert(proShell.includes("hubEngagementVariant"), "pro shell: hub engagement variant prop");
assert(proShell.includes('hubVariant = hubEngagementVariant ?? (heroEngagementActive ? "save_only" : "full")'), "pro shell: defaults hub to save_only when hero has engagement");
assert(!proShell.includes("<LeonixSaveButton"), "pro shell: Save removed from hero (hub only)");

// Hub row save_only contract
assert(hubRow.includes('hubEngagementVariant === "save_only"'), "hub row: save_only branch");
assert(hubRow.includes("saveOnly ? null :"), "hub row: hides Like/Share when save_only");
assert(contactCard.includes("hubEngagementVariant"), "contact card: forwards hub variant");

// Preview still uses approved shells (unchanged entry points)
assert(clasPreview.includes("ServiciosProfileView"), "trade preview: ServiciosProfileView");
assert(clasPreview.includes("showTopBar={false}"), "trade preview: no top bar");
assert(proPreview.includes("ServiciosProfessionalHero"), "pro preview: professional hero");
assert(!proPreview.includes("ServiciosTopBar"), "pro preview: no top bar");

// Template routing — Immigration Law + trade fallback
assert(templateRouting.includes("abogado_asesoria_legal"), "routing: immigration/legal business type");
assert(templateRouting.includes('"legal_provider"'), "routing: legal_provider template");
assert(templateRouting.includes("isServiciosProfessionalTemplate"), "routing: professional template guard");

// Results cards — body navigation + CTA isolation
assert(bodyLink.includes("ServiciosResultCardBodyLink"), "body link helper exists");
assert(bodyLink.includes("SERVICIOS_RESULT_CARD_INTERACTIVE"), "interactive CTA z-index constant");
assert(horizontalCard.includes("ServiciosResultCardBodyLink"), "trade card: body link");
assert(horizontalCard.includes("SERVICIOS_RESULT_CARD_INTERACTIVE"), "trade card: interactive CTA column");
assert(horizontalCard.includes("pointer-events-none relative z-[2]"), "trade card: body passes clicks to link");
assert(horizontalCard.includes("isServiciosProfessionalTemplate(template)"), "trade card: routes professional rows");
assert(horizontalCard.includes("ServiciosProfessionalResultCard"), "trade card: delegates to professional card");

assert(proCard.includes("ServiciosResultCardBodyLink"), "pro card: body link");
assert(proCard.includes("SERVICIOS_RESULT_CARD_INTERACTIVE"), "pro card: interactive CTA column");
assert(proCard.includes("pointer-events-none relative z-[2]"), "pro card: body passes clicks to link");

// Package script
assert(pkg.includes('"verify:servicios-preview-published-parity"'), "package.json: verifier registered");

console.log("OK: public slug hides obsolete ServiciosTopBar + professional mobile nav");
console.log("OK: professional public hero owns Like/Share; hub save_only when hero active");
console.log("OK: results cards use stretched body link + isolated CTA column");
console.log("verify-servicios-preview-published-parity: PASS");
