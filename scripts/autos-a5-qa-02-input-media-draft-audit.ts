/**
 * A5.QA-02 Autos publish input / media / draft persistence static gate.
 * Run: npm run autos:a5-qa-02-input-media-draft-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const AUDIT_ROWS = [
  "Negocios free-text fields allow spaces",
  "Privado free-text fields were checked",
  "Privado free-text fields allow spaces or no issue found",
  "Numeric-only fields remain intentionally restricted",
  "Engine field allows values like 3.5 V6",
  "Street/calle field allows normal spaced addresses",
  "Business/contact fields allow spaces",
  "Custom/social/review/link label fields allow spaces if present",
  "Description/textareas still work normally",
  "Photo cards support desktop drag-and-drop reorder",
  "Photo cards keep mobile fallback reorder controls",
  "Cover image selection still works",
  "Reordered image order persists to preview/detail",
  "Refresh preserves Autos Negocios draft fields",
  "Preview/back preserves Autos Negocios draft fields",
  "Refresh/preview behavior checked for Privado",
  "Draft reset still requires explicit user action or documented new-flow behavior",
  "No dealer-only fields were added to Privado",
  "No unrelated categories were touched",
  "No schema/payment/global files were touched",
  "npm run build passed",
];

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function changedFiles(): string[] {
  const tracked = execSync("git diff --name-only", { cwd: ROOT, encoding: "utf8" })
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);
  const untracked = execSync("git ls-files --others --exclude-standard", { cwd: ROOT, encoding: "utf8" })
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);
  return [...new Set([...tracked, ...untracked])].map((x) => x.replace(/\\/g, "/"));
}

function isAllowedPath(p: string): boolean {
  if (p === "package.json") return true;
  return (
    p.startsWith("app/(site)/clasificados/autos/") ||
    p.startsWith("app/(site)/publicar/autos/") ||
    p.startsWith("app/lib/clasificados/autos/") ||
    p.startsWith("scripts/autos-")
  );
}

const FORBIDDEN_PREFIXES = [
  "app/(site)/servicios/",
  "app/(site)/restaurantes/",
  "app/(site)/rentas/",
  "app/(site)/clasificados/bienes-raices/",
  "app/(site)/clasificados/en-venta/",
  "app/(site)/clasificados/viajes/",
  "app/(site)/tienda/",
];

function run() {
  const mdPath = "app/lib/clasificados/autos/AUTOS_A5_QA_02_INPUT_MEDIA_DRAFT_AUDIT.md";
  assert.ok(fs.existsSync(path.join(ROOT, mdPath)), "A5.QA-02 audit markdown must exist");
  const md = read(mdPath);
  for (const row of AUDIT_ROWS) {
    assert.ok(md.includes(`| ${row} |`), `Missing audit row: ${row}`);
  }

  const textHelper = read("app/lib/clasificados/autos/autosPublishFormText.ts");
  assert.ok(textHelper.includes("autosDraftTextValue"), "Text helper exists");

  const engine = read("app/(site)/publicar/autos/shared/components/AutosVehicleEngineField.tsx");
  assert.ok(engine.includes("autosDraftTextValue"), "Engine uses draft text helper");
  assert.ok(!engine.includes("e.target.value.trim()"), "Engine must not trim on change");

  const address = read("app/(site)/publicar/autos/shared/components/AutosDealerStructuredAddressFields.tsx");
  assert.ok(address.includes("dealerStreetName: autosDraftTextValue"), "Street name preserves spaces");

  const sortable = read("app/(site)/publicar/autos/shared/components/AutosSortablePhotoGrid.tsx");
  assert.ok(sortable.includes("@dnd-kit"), "DnD kit used");
  assert.ok(sortable.includes("TouchSensor"), "Touch drag sensor");
  assert.ok(sortable.includes("onPointerDown={stopDragPointer}"), "Buttons stop drag capture");
  assert.ok(sortable.includes("cursor-grab"), "Drag affordance on card");

  const persistHook = read("app/lib/clasificados/autos/useAutosDraftPersistEffects.ts");
  assert.ok(persistHook.includes("pagehide"), "Pagehide flush");
  assert.ok(persistHook.includes("beforeunload"), "Beforeunload flush");

  const negociosDraft = read("app/(site)/publicar/autos/negocios/hooks/useAutoDealerDraft.ts");
  assert.ok(negociosDraft.includes("useAutosDraftPersistEffects"), "Negocios persist effects");
  assert.ok(!negociosDraft.includes("isMeaningfulAutoDealerDraft"), "No meaningful-only autosave gate");

  const privadoDraft = read("app/(site)/publicar/autos/privado/hooks/useAutoPrivadoDraft.ts");
  assert.ok(privadoDraft.includes("shouldResetAutosDraftForFreshEditorTab"), "Privado fresh-tab guard");
  assert.ok(privadoDraft.includes("hydrateFromNamespace"), "Privado refresh restore");
  assert.ok(privadoDraft.includes("useAutosDraftPersistEffects"), "Privado autosave");

  const copy = read("app/(site)/clasificados/autos/negocios/lib/autosNegociosCopy.ts");
  assert.ok(copy.includes("Arrastra las fotos"), "ES drag reorder hint");
  assert.ok(copy.includes("Drag photos to change"), "EN drag reorder hint");

  const pkg = read("package.json");
  assert.ok(pkg.includes("autos:a5-qa-02-input-media-draft-audit"), "package script");

  const changed = changedFiles();
  for (const p of changed) {
    if (p.startsWith(".next/")) continue;
    for (const bad of FORBIDDEN_PREFIXES) {
      assert.ok(!p.startsWith(bad), `Forbidden path modified: ${p}`);
    }
  }

  const badScope = changed.filter((p) => !isAllowedPath(p) && !p.startsWith(".next/"));
  if (badScope.length > 0) {
    console.warn("Warning: changed files outside Autos scope:", badScope.slice(0, 15).join(", "));
  }

  console.log("autos:a5-qa-02-input-media-draft-audit — OK");
}

run();
