#!/usr/bin/env node
/**
 * Verifier — Bienes Raíces draft hydration + media lock
 * + child save-to-parent media contract + new/resume intent isolation.
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
const formMapping = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioChildInventoryFormMapping.ts",
);
const childApp = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/sections/shared/BrNegocioChildInventoryFullApplication.tsx",
);
const shell = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/sections/shared/BrNegocioPrePublishInventoryShell.tsx",
);

assert(previewDraft.includes("bootstrapAgenteIndividualResidencialApplicationStateResolved"), "async bootstrap with IDB");
assert(previewDraft.includes("mirrorDraftToLocalStorage(json, scope)"), "namespaced localStorage mirror on save");
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
assert(previewDraft.includes("resolveFullDraftMediaBridgeState"), "bootstrap uses validated media bridge");
assert(previewDraft.includes("parsePersistedStateFromJson(raw)"), "LS fallback parses return wrapper");
assert(previewDraft.includes("flushAgenteResDraftSyncForUnload"), "pagehide sync flush exists");
assert(
  previewDraft.includes("preserveDurableMediaOnSyncFlush") && previewDraft.includes("preservePhotoListForSyncFlush"),
  "sync unload flush must preserve IDB/http photo refs (not wipe gallery on hard refresh)",
);
assert(
  previewDraft.includes("mergeCompactAvoidEmptyMediaOverwrite") &&
    previewDraft.includes("agenteResStateHasUnpersistedDataUrlPhotos") &&
    previewDraft.includes("draftPersistEpoch"),
  "immediate media offload + empty-gallery overwrite guard required",
);
assert(
  previewDraft.includes("livePhotoCount > 0 && durablePhotoCount(compact) === 0") ||
    previewDraft.includes("liveChildPhotos > 0 && durableChildInventoryPhotoCount(compact) === 0"),
  "must refuse empty gallery write when live photos exist (parent and/or child)",
);
assert(
  app.includes("onMediaDraftCommit") && app.includes("agenteResStateHasUnpersistedDataUrlPhotos(state) ? 0 : 800"),
  "parent must persist photos immediately on upload (not 800ms-only)",
);
assert(
  read(
    "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/sections/steps01-03.tsx",
  ).includes("onMediaDraftCommit"),
  "Step03 media commit hook",
);
assert(
  childApp.includes("onMediaDraftCommit") && childSession.includes("childSessionPersistEpoch"),
  "child immediate media persist + epoch guard",
);
assert(
  childSession.includes("resolveChildEditorMediaId") && childSession.includes("childSessionMatchesEditor"),
  "child must use stable draft media id (not null→new-child bucket)",
);
assert(
  childSession.includes("inlineChildEditorPropertySliceFromIdb") &&
    childSession.includes("resolveChildPropertySliceMediaFromIdb") &&
    childSession.includes("getActiveBrAgenteDraftMediaNamespace()") &&
    !/inlineBrAgenteResHeavyMediaFromIdb\(BR_AGENTE_DRAFT_MEDIA_NAMESPACE,\s*hub\)/.test(childSession),
  "child hard-refresh inline must use CHILD_EDITOR_* segments (not MAIN_PHOTO)",
);
assert(
  childSession.includes("persistChildInventoryEditorSessionResolved") &&
    childApp.includes("persistChildInventoryEditorSessionResolved"),
  "child save/preview must await durable media commit",
);
assert(
  formMapping.includes("childInventoryDraftFromCommittedEditorMedia"),
  "committed child media → saved child draft helper",
);
assert(
  childApp.includes("childInventoryDraftFromCommittedEditorMedia") &&
    childApp.includes("await Promise.resolve(onSave(draft, mode))") &&
    /await Promise\.resolve\(onSave\(draft, mode\)\);\s*\n\s*clearChildInventoryEditorSession\(\)/.test(childApp),
  "child save must commit→draft→await parent onSave→then clear session (no premature clear)",
);
assert(
  shell.includes("clearChildInventoryEditorSession()") &&
    shell.includes("await Promise.resolve(onItemsChange") &&
    /await Promise\.resolve\(onItemsChange[\s\S]*?clearChildInventoryEditorSession\(\)/.test(shell),
  "shell must await parent inventory update then clear child session before close",
);
assert(
  app.includes("await persistAgenteResApplicationDraftResolved(next, { applicationInstanceId })"),
  "parent must await draft persist immediately after child inventory save",
);
assert(
  previewDraft.includes("writeReturn") &&
    previewDraft.includes("isBrowserHardReload") &&
    previewDraft.includes("isExplicitReturningToEditIntent") &&
    previewDraft.includes("leonix-publish-flow-returning-to-edit") &&
    previewDraft.includes("clearAgenteResApplicationMemoryOnly()"),
  "new application vs resume intent isolation required",
);
assert(
  previewDraft.includes("Brand-new application") || previewDraft.includes("brand-new"),
  "bootstrap must document brand-new isolation",
);
assert(
  app.includes("persistAgenteResApplicationDraftResolved(state, { applicationInstanceId, writeReturn: true })"),
  "openPreview must write return key for Volver",
);
assert(
  read(
    "app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioAdditionalInventoryDraft.ts",
  ).includes("__LX_BR_AGENTE_IDB__"),
  "child inventory draft sync must treat IDB refs as durable",
);
assert(
  fs.existsSync(
    path.join(
      root,
      "app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioChildMediaCanonical.ts",
    ),
  ),
  "Bienes child canonical media helper must exist",
);
const childCanonical = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioChildMediaCanonical.ts",
);
assert(
  childCanonical.includes("export type BrChildMediaImage") &&
    childCanonical.includes("hydrateBrChildMediaCanonical") &&
    childCanonical.includes("projectBrChildMediaToBienesFields") &&
    childCanonical.includes("isPrimary") &&
    childCanonical.includes("sortOrder"),
  "canonical BrChildMediaImage collection with hydrate + project",
);
assert(
  childApp.includes("hydrateBrChildMediaCanonical") &&
    childApp.includes("applyBrChildMediaDisplayFieldsToSlice") &&
    childApp.includes("mediaFormState"),
  "child editor must hydrate canonical media into display state",
);
assert(
  cardModel.includes("mapAdditionalDraftToInventoryCardResolved") &&
    cardModel.includes("brChildMediaPrimaryDisplayUrl") &&
    cardModel.includes("brChildMediaGalleryDisplayUrls"),
  "inventory card must map from canonical primary + gallery",
);
assert(
  read(
    "app/(site)/clasificados/publicar/bienes-raices/negocio/application/sections/shared/BrNegocioPrePublishInventoryPreview.tsx",
  ).includes("mapAdditionalDraftToInventoryCardResolved"),
  "inventory preview must resolve canonical media before card render",
);
assert(
  read(
    "app/(site)/clasificados/publicar/bienes-raices/negocio/application/sections/shared/BrNegocioChildInventoryFullPreviewOverlay.tsx",
  ).includes("hydrateBrChildInventoryDraftMediaForDisplay"),
  "child full Preview must hydrate canonical display media",
);
assert(cardUi.includes("grid grid-cols-3") && /gap-1\.5|gap-2/.test(cardUi), "results gallery has small tile gap");
assert(
  childPersist.includes("bridgePhotos.length > 0 ? bridged.primaryPhotoIndex") ||
    childPersist.includes("sessionPhotos.length > 0 ? sessionPhotos : bridgePhotos"),
  "media bridge must prefer complete durable galleries (including IDB), not data:-only",
);
assert(
  previewDraft.includes("durableChildInventoryPhotoCount"),
  "parent persist must guard child inventory empty media overwrites",
);

console.log("OK: bienes-draft-hydration-media-lock-01");
