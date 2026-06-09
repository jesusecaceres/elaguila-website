/**
 * BR-DRAFT-PERSIST-01 — full BR Agente draft + inventory persistence audit.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const AUDIT = "app/(site)/clasificados/bienes-raices/BR_DRAFT_PERSIST_01_AUDIT.md";
const PREVIEW_DRAFT =
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/utils/previewDraft.ts";
const DRAFT_MEDIA =
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/utils/brAgenteResDraftMedia.ts";
const CHILD_SESSION =
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioChildInventoryEditorSession.ts";
const CHILD_APP =
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/sections/shared/BrNegocioChildInventoryFullApplication.tsx";
const PUBLISH_CORE = "app/(site)/clasificados/lib/leonixPublishRealEstateListingCore.ts";
const AUTOS = "app/(site)/publicar/autos";
const RENTAS = "app/(site)/clasificados/publicar/rentas";
const SERVICIOS = "app/(site)/clasificados/publicar/servicios";
const MIGRATIONS = "supabase/migrations";

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function run() {
  assert.ok(fs.existsSync(path.join(ROOT, AUDIT.replace(/\//g, path.sep))), "audit doc");
  const audit = read(AUDIT);
  const preview = read(PREVIEW_DRAFT);
  const media = read(DRAFT_MEDIA);
  const childSession = read(CHILD_SESSION);
  const childApp = read(CHILD_APP);
  const publishCore = read(PUBLISH_CORE);

  assert.ok(audit.includes("BR-DRAFT-PERSIST-01"), "gate id");
  assert.ok(audit.includes("Final recommendation:"), "recommendation");

  const falseRows = [...audit.matchAll(/\|\s*[^|]+\|\s*FALSE\s*\|/g)];
  const rec = audit.match(/Final recommendation:\s*(GREEN|YELLOW|RED)/)?.[1];
  if (rec === "GREEN") {
    assert.equal(falseRows.length, 0, `GREEN must have no FALSE rows (${falseRows.length})`);
  }

  assert.ok(preview.includes("persistAgenteResApplicationDraftResolved"), "resolved persist");
  assert.ok(preview.includes("rehydrateAgenteResDraftMediaFromIdb"), "idb rehydrate");
  assert.ok(preview.includes("BR_AGENTE_RES_DRAFT_LS_FALLBACK_KEY"), "ls fallback");
  assert.ok(preview.includes("additionalInventoryProperties"), "inventory in draft");
  assert.ok(media.includes("BR_AGENTE_IDB_PREFIX"), "idb refs");
  assert.ok(media.includes("offloadBrAgenteResHeavyMediaToIdb"), "media offload");
  assert.ok(media.includes("inlineBrAgenteResHeavyMediaFromIdb"), "media inline");
  assert.ok(childSession.includes("loadChildInventoryEditorSessionResolved"), "child session resolve");
  assert.ok(childApp.includes("unsavedCloseConfirm"), "dirty close copy");
  assert.ok(childApp.includes("loadChildInventoryEditorSessionResolved"), "child restore");
  assert.ok(audit.includes("Volver a editar"), "volver documented");
  assert.ok(audit.includes("IndexedDB"), "idb documented");
  assert.ok(publishCore.includes("isBlob"), "publish blob guard");

  for (const dir of [AUTOS, RENTAS, SERVICIOS]) {
    const base = path.join(ROOT, dir.replace(/\//g, path.sep));
    if (!fs.existsSync(base)) continue;
    const rel = path.relative(ROOT, base).replace(/\\/g, "/");
    assert.equal(audit.includes(`${rel} not modified`) || audit.includes("not modified"), true, "category untouched note");
  }

  const migBase = path.join(ROOT, MIGRATIONS.replace(/\//g, path.sep));
  if (fs.existsSync(migBase)) {
    const recent = fs.readdirSync(migBase).filter((f) => f.includes("br_agente") || f.includes("br-agente"));
    assert.equal(recent.length, 0, "no BR agente migrations added");
  }

  console.log("BR-DRAFT-PERSIST-01 audit OK");
}

run();
