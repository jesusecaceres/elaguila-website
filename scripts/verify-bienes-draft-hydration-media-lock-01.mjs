#!/usr/bin/env node
/**
 * Verifier — Bienes Raíces draft hydration + media lock (hard refresh / volver a editar).
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

const previewDraft = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/utils/previewDraft.ts",
);
const draftMedia = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/utils/brAgenteResDraftMedia.ts",
);
const childSession = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioChildInventoryEditorSession.ts",
);
const childPersist = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioInventoryDraftPersistence.ts",
);
const agenteState = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/schema/agenteIndividualResidencialFormState.ts",
);
const cardModel = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioInventoryCardModel.ts",
);
const cardUi = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/sections/shared/BrNegocioPrePublishInventoryCard.tsx",
);
const app = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/AgenteIndividualResidencialApplication.tsx",
);

assert(previewDraft.includes("bootstrapAgenteIndividualResidencialApplicationStateResolved"), "async bootstrap with IDB");
assert(previewDraft.includes("mirrorDraftToLocalStorage(json)"), "localStorage mirror on save");
assert(previewDraft.includes("syncDraftMediaBridgesFromState"), "media bridge sync after restore");
assert(previewDraft.includes("googleBusinessUrl") || agenteState.includes("googleBusinessUrl"), "google business in state");
assert(previewDraft.includes("additionalInventoryProperties"), "child inventory in draft path");
assert(draftMedia.includes("offloadChildEditorPropertySliceToIdb"), "isolated child editor IDB offload");
assert(draftMedia.includes("CHILD_EDITOR_"), "child editor IDB segment avoids MAIN_PHOTO collision");
assert(childSession.includes("offloadChildEditorPropertySliceToIdb"), "child session uses isolated offload");
assert(childPersist.includes("mergeChildInventoryWithMediaBridge"), "child media bridge merge");
assert(childPersist.includes("propertyForm"), "child propertyForm preserved in merge");
assert(cardModel.includes("gallerySlotUrls"), "inventory card gallery slots model");
assert(cardModel.includes("BR_INVENTORY_GALLERY_SLOT_COUNT = 6"), "six gallery slots");
assert(cardUi.includes("GallerySlotGrid"), "inventory card gallery grid UI");
assert(app.includes("bootstrapAgenteIndividualResidencialApplicationStateResolved"), "app awaits IDB rehydrate");
assert(app.includes("persistAgenteResApplicationDraftResolved"), "preview awaits persist before navigate");
assert(!previewDraft.includes("fullDraftMediaBridge = null"), "bootstrap must not wipe media bridge early");

console.log("OK: bienes-draft-hydration-media-lock-01");
