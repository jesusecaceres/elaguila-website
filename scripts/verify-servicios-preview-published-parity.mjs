#!/usr/bin/env node
/**
 * Servicios preview → results → published parity (Trade + Professional).
 * Structural markers + routing — not import-name-only checks.
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
const legacyHero = read("app/(site)/servicios/components/ServiciosHero.tsx");
const pkg = read("package.json");

assert(slugPage.includes("isServiciosProfessionalTemplate(listingTemplate)"), "slug: professional template branch");
assert(slugPage.includes("showTopBar={false}"), "slug: hides ServiciosTopBar on public pages");
assert(slugPage.includes("showMobileSectionNav={false}"), "slug: hides professional bottom section nav on public");

// Trade canonical full presentation
assert(!tradeShell.includes("ServiciosHero"), "trade shell: no centered legacy hero");
assert(tradeShell.includes("ServiciosProfessionalHero"), "trade shell: editorial hero");
assert(tradeShell.includes('data-servicios-full-shell="trade-canonical"'), "trade shell: canonical marker");
assert(tradeShell.includes('data-servicios-hero-engagement="1"'), "trade shell: hero engagement placement");

assert(proShell.includes('data-servicios-public-shell="professional"'), "pro shell: public mode marker");
assert(proShell.includes("hubEngagementVariant"), "pro shell: hub engagement variant prop");
assert(!proShell.includes("<LeonixSaveButton"), "pro shell: Save removed from hero");

assert(hubRow.includes('hubEngagementVariant === "save_only"'), "hub row: save_only branch");
assert(contactCard.includes("hubEngagementVariant"), "contact card: forwards hub variant");

assert(clasPreview.includes("ServiciosProfileView"), "trade preview: ServiciosProfileView");
assert(clasPreview.includes("showTopBar={false}"), "trade preview: no top bar");
assert(proPreview.includes("ServiciosProfessionalHero"), "pro preview: professional hero");
assert(!proPreview.includes("ServiciosTopBar"), "pro preview: no top bar");

assert(templateRouting.includes("abogado_asesoria_legal"), "routing: immigration/legal business type");

// Trade canonical card
assert(horizontalCard.includes('data-servicios-card-shell="trade-canonical"'), "trade card: canonical marker");
assert(horizontalCard.includes('data-servicios-card-cta-stack="1"'), "trade card: stacked CTA marker");
assert(!horizontalCard.includes("sm:grid-cols-[minmax(0,1fr)_minmax(9.25rem,auto)]"), "trade card: no legacy rail grid");
assert(horizontalCard.includes("ServiciosResultCardBodyLink"), "trade card: body navigation link");
assert(horizontalCard.includes("SERVICIOS_RESULT_CARD_INTERACTIVE"), "trade card: CTA isolation");

assert(proCard.includes("ServiciosResultCardEngagementStrip"), "professional card: engagement strip");
assert(legacyHero.includes('data-servicios-hero-shell="centered-legacy"'), "legacy hero: marked deprecated");

assert(pkg.includes('"verify:servicios-preview-published-parity"'), "package.json: verifier registered");
assert(pkg.includes('"verify:servicios-trade-render-parity"'), "package.json: trade render verifier registered");

console.log("OK: trade editorial hero + canonical card markers");
console.log("OK: professional pipeline preserved");
console.log("verify-servicios-preview-published-parity: PASS");
