#!/usr/bin/env node
/**
 * Verifier — Bienes Raíces emergency hydration proof (parent + 2 children).
 * Proof type: NODE FIXTURE SIMULATION via tsx + static guards.
 */
import { execFileSync } from "node:child_process";
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
const steps = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/sections/steps01-03.tsx",
);
const cardUi = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/sections/shared/BrNegocioPrePublishInventoryCard.tsx",
);
const copyEn = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/brAgenteResidencialCopy.en.ts",
);
const copyEs = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/brAgenteResidencialCopy.es.ts",
);

assert(previewDraft.includes("parsePersistedStateFromJson(raw)"), "LS fallback uses parsePersistedStateFromJson");
assert(previewDraft.includes("coercePersistedFormState"), "bridge unwrap helper exists");
assert(previewDraft.includes("resolveFullDraftMediaBridgeState"), "bootstrap uses validated bridge");
assert(previewDraft.includes("draftHasPersistableProgress"), "empty persist guard exists");
assert(!/function saveReturnPayload[\s\S]*mirrorDraftToLocalStorage/.test(previewDraft), "return payload must not mirror wrapped JSON to LS");

assert(copyEn.includes("Image 1 is your main listing photo"), "EN image note line 1");
assert(copyEn.includes("Images 2–7 are your results card gallery"), "EN image note line 2");
assert(copyEs.includes("La imagen 1 es la foto principal de tu anuncio"), "ES image note line 1");
assert(copyEs.includes("Las imágenes 2–7 son la galería para la tarjeta de resultados"), "ES image note line 2");
assert(steps.includes("imageUploadNoteLabel"), "Step03 image note beside upload");
assert(!steps.includes("resultsGalleryTitle"), "Step03 must not separate gallery note from upload");

assert(cardUi.includes("sm:min-w-[11rem]"), "gallery uses wider right-side space");
assert(cardUi.includes("min-h-[72px]"), "gallery slots are substantially sized");

execFileSync("npx", ["tsx", "scripts/bienes-hydration-proof-01-core.ts"], {
  cwd: root,
  stdio: "inherit",
  shell: process.platform === "win32",
});

console.log("PROOF_TYPE: NODE FIXTURE SIMULATION");
