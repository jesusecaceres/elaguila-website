#!/usr/bin/env node
/**
 * Verifier — Bienes Raíces Business Hub map + Google/Yelp contact + inventory showcase.
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function assert(cond, msg) {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    process.exit(1);
  }
}

const miniMap = read(
  "app/(site)/clasificados/publicar/bienes-raices/shared/BrLeonixPreviewMiniMap.tsx",
);
assert(miniMap.includes("buildOfertaLocalPreviewMapEmbedUrl"), "mini map uses Ofertas embed helper");
assert(!miniMap.includes("AIza"), "no Google Maps API key in mini map");

const agenteState = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/schema/agenteIndividualResidencialFormState.ts",
);
assert(agenteState.includes("googleBusinessUrl"), "agente form state has googleBusinessUrl");

const negocioState = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/schema/bienesRaicesNegocioFormState.ts",
);
assert(negocioState.includes("googleBusinessUrl"), "negocio form state has googleBusinessUrl");
assert(negocioState.includes("googleReviewsUrl"), "negocio form state has googleReviewsUrl");
assert(negocioState.includes("yelpReviewsUrl"), "negocio form state has yelpReviewsUrl");

const previewMap = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/mapping/mapBienesRaicesNegocioStateToPreviewVm.ts",
);
assert(previewMap.includes("googleBusinessUrl: resolveHttpUrl"), "preview VM maps googleBusinessUrl");
assert(previewMap.includes("mapLocationLine"), "preview VM builds mapLocationLine");

const negocioPreview = read("app/(site)/clasificados/bienes-raices/preview/BienesRaicesNegocioPreviewView.tsx");
assert(negocioPreview.includes("BrLeonixPreviewMiniMap"), "negocio preview uses mini map");
assert(negocioPreview.includes("vm.contact.googleBusinessUrl"), "negocio preview renders Google Business");

const inventoryCard = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/sections/shared/BrNegocioPrePublishInventoryCard.tsx",
);
assert(inventoryCard.includes('"showcase"'), "inventory card has showcase layout");

const inventoryPreview = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/sections/shared/BrNegocioPrePublishInventoryPreview.tsx",
);
assert(inventoryPreview.includes('layout={additionalLayout}'), "inventory preview uses showcase layout");
assert(!inventoryPreview.includes("compact"), "inventory preview no longer forces compact cards");

const publishMap = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/mapping/mapAgenteResidencialFormStateToNegocioForPublish.ts",
);
assert(publishMap.includes("googleBusinessUrl: durableHttpUrl"), "agente→negocio publish maps google URLs");

console.log("OK: bienes-business-hub-map-contact-inventory-showcase-01");
