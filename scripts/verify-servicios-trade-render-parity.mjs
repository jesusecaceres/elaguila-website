#!/usr/bin/env node
/**
 * Trade render parity — structural markers that must appear in canonical Trade output.
 * Catches preview/public/card mismatches that import-name checks miss.
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

const profileView = read("app/(site)/servicios/components/ServiciosProfileView.tsx");
const proHero = read("app/(site)/servicios/components/ServiciosProfessionalHero.tsx");
const legacyHero = read("app/(site)/servicios/components/ServiciosHero.tsx");
const tradeCard = read("app/(site)/clasificados/servicios/components/ServiciosHorizontalResultCard.tsx");
const previewClient = read("app/(site)/clasificados/publicar/servicios/preview/ClasificadosServiciosPreviewClient.tsx");
const slugPage = read("app/(site)/clasificados/servicios/[slug]/page.tsx");
const resultados = read("app/(site)/clasificados/servicios/resultados/page.tsx");
const proShell = read("app/(site)/servicios/components/ServiciosProfessionalProfileShell.tsx");
const tradeAdapter = read("app/(site)/clasificados/servicios/lib/mapServiciosTradePresentation.ts");
const pkg = read("package.json");

// Trade full — editorial hero, not centered legacy
assert(!profileView.includes("ServiciosHero"), "trade profile view must not import centered ServiciosHero");
assert(profileView.includes("ServiciosProfessionalHero"), "trade profile view uses editorial hero");
assert(profileView.includes('template="standard_service"'), "trade hero uses standard_service template");
assert(profileView.includes('data-servicios-full-shell="trade-canonical"'), "trade full shell marker");
assert(profileView.includes('data-servicios-hero-engagement="1"'), "trade hero owns Like/Share");
assert(profileView.includes('hubEngagementVariant={hubVariant}'), "trade hub uses save_only when hero active");
assert(profileView.includes("heroEngagementActive ? (\"save_only\" as const)"), "trade hub variant logic");

assert(proHero.includes('data-servicios-hero-shell={heroShell}'), "hero exposes shell marker");
assert(proHero.includes('data-servicios-hero-align="editorial"'), "hero editorial alignment marker");
assert(proHero.includes('data-servicios-cta-row="1"'), "hero CTA row marker");
assert(legacyHero.includes('data-servicios-hero-shell="centered-legacy"'), "legacy hero marked unreachable for trade");

// Trade card — canonical stacked shell
assert(tradeCard.includes('data-servicios-card-shell="trade-canonical"'), "trade card shell marker");
assert(tradeCard.includes('data-servicios-card-cta-stack="1"'), "trade card CTA stack marker");
assert(!tradeCard.includes("data-servicios-card-cta-rail"), "trade card must not use CTA rail marker");
assert(!tradeCard.includes("sm:grid-cols-[minmax(0,1fr)_minmax(9.25rem,auto)]"), "trade card must not use legacy side-rail grid");
assert(tradeCard.includes("mapServiciosTradePresentationProfile"), "trade card uses shared presentation adapter");

assert(!resultados.includes('density="compact"'), "results page must not force compact legacy density");

// Preview + published both route to canonical trade shells
assert(previewClient.includes("ServiciosProfileView"), "preview uses trade profile view");
assert(slugPage.includes("ServiciosProfileView"), "published trade uses profile view");
assert(slugPage.includes("showTopBar={false}"), "published hides obsolete top bar");

// Professional regression lock
assert(proShell.includes("ServiciosProfessionalHero"), "professional shell unchanged");
assert(!proShell.includes("ServiciosHero"), "professional must not use centered hero");

assert(tradeAdapter.includes("mapServiciosTradePresentationProfile"), "trade presentation adapter exists");

assert(pkg.includes('"verify:servicios-trade-render-parity"'), "package.json registers verifier");

console.log("OK: trade full uses editorial hero (trade-canonical), not centered legacy");
console.log("OK: trade card uses stacked canonical shell, not CTA rail");
console.log("OK: professional pipeline markers unchanged");
console.log("verify-servicios-trade-render-parity: PASS");
