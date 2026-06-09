/**
 * BR-INV-FIX-01E added property inventory end-to-end truth audit.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const AUDIT =
  "app/(site)/clasificados/bienes-raices/BR_INV_FIX_01E_ADDED_PROPERTY_END_TO_END_AUDIT.md";
const CHILD_APP =
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/sections/shared/BrNegocioChildInventoryFullApplication.tsx";
const CHILD_PREVIEW =
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/sections/shared/BrNegocioChildInventoryFullPreviewOverlay.tsx";
const SHELL =
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/sections/shared/BrNegocioPrePublishInventoryShell.tsx";
const SHELL_COPY =
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioPrePublishInventoryShellCopy.ts";
const PREVIEW_CLIENT =
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/preview/AgenteIndividualResidencialPreviewClient.tsx";
const FETCH =
  "app/(site)/clasificados/bienes-raices/lib/fetchBrRelatedInventoryListingsBrowser.ts";
const INV_COPY = "app/(site)/clasificados/lib/leonixBrPropertyInventoryCopy.ts";
const MAPPER =
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/mapping/mapAgenteResidencialFormStateToNegocioForPublish.ts";
const PRIVADO = "app/(site)/clasificados/publicar/bienes-raices/privado";
const RENTAS = "app/(site)/clasificados/rentas";
const AUTOS = "app/(site)/clasificados/autos";
const MIGRATIONS = "supabase/migrations";

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function walkTs(dirRel: string, fn: (rel: string, content: string) => void) {
  const base = path.join(ROOT, dirRel.replace(/\//g, path.sep));
  if (!fs.existsSync(base)) return;
  const walk = (d: string) => {
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, ent.name);
      if (ent.isDirectory()) walk(full);
      else if (/\.(tsx|ts)$/.test(ent.name)) {
        const rel = path.relative(ROOT, full).replace(/\\/g, "/");
        fn(rel, read(rel));
      }
    }
  };
  walk(base);
}

function run() {
  assert.ok(fs.existsSync(path.join(ROOT, AUDIT.replace(/\//g, path.sep))), "audit doc exists");
  const audit = read(AUDIT);
  const childApp = read(CHILD_APP);
  const childPreview = read(CHILD_PREVIEW);
  const shell = read(SHELL);
  const shellCopy = read(SHELL_COPY);
  const previewClient = read(PREVIEW_CLIENT);
  const fetchRel = read(FETCH);
  const invCopy = read(INV_COPY);
  const mapper = read(MAPPER);

  assert.ok(audit.includes("BR-INV-FIX-01E"), "gate id in audit");
  assert.ok(audit.includes("Final recommendation:"), "final recommendation in audit");

  const falseRows = [...audit.matchAll(/\|\s*[^|]+\|\s*FALSE\s*\|/g)];
  const recommendation = audit.match(/Final recommendation:\s*(GREEN|YELLOW|RED)/)?.[1];
  if (recommendation === "GREEN") {
    assert.equal(falseRows.length, 0, `GREEN audit must have no FALSE rows; found ${falseRows.length}`);
  }

  for (const s of [
    "Agregar propiedad",
    "Guardar propiedad",
    "Guardar y agregar otra",
    "Tienes cambios sin guardar",
    "La información profesional, contacto",
    "Professional, contact",
    "Vista previa de la propiedad adicional",
    "Additional property preview",
    "Esta propiedad se publicará como una ficha propia",
    "This property will publish as its own listing",
    "Inventario incluido en esta solicitud",
    "Inventory included in this application",
    "Vista previa del inventario de propiedades",
    "Property inventory preview",
    "Más propiedades de este agente",
    "More properties from this agent",
    "Más propiedades de esta inmobiliaria",
    "More properties from this brokerage",
  ]) {
    assert.ok(shellCopy.includes(s) || invCopy.includes(s) || childPreview.includes(s) || audit.includes(s), s);
  }

  assert.ok(fetchRel.includes("currentListingId"), "related inventory excludes current");
  assert.ok(fetchRel.includes("inventory_property"), "inventory role filter");
  assert.ok(mapper.includes("additionalInventoryProperties"), "multi-listing mapper");
  assert.ok(audit.includes("inventoryRole") || audit.includes("inventory_role"), "inventory role in audit");
  assert.ok(audit.includes("br_inventory_group_id") || audit.includes("propertyInventoryGroupId"), "group id");

  assert.ok(shell.includes("BrNegocioChildInventoryFullApplication"), "full child app wired");
  assert.ok(!/\b(Publicar|Publish)\b/.test(childApp.replace(/PrePublish/g, "")), "no publish CTA in child app");
  assert.ok(childApp.includes("unsavedCloseConfirm"), "unsaved confirm wired");
  assert.ok(childApp.includes("inheritedNotice"), "inherited notice in child app");
  assert.ok(childPreview.includes("childFullPreviewTitle"), "child full preview");
  assert.ok(previewClient.includes('variant="package"'), "parent package preview");

  walkTs(PRIVADO, (rel, c) => {
    assert.equal(c.includes("BrNegocioPrePublishInventoryShell"), false, `${rel} no inventory shell`);
    assert.equal(c.includes("BrNegocioChildInventoryFullApplication"), false, `${rel} no child inventory app`);
  });

  walkTs(AUTOS, (rel, c) => {
    assert.equal(c.includes("brNegocioChildInventory"), false, `${rel} autos untouched`);
  });

  const migBase = path.join(ROOT, MIGRATIONS.replace(/\//g, path.sep));
  if (fs.existsSync(migBase)) {
    const recent = fs
      .readdirSync(migBase)
      .filter((f) => f.endsWith(".sql"))
      .slice(-3);
    for (const f of recent) {
      const c = fs.readFileSync(path.join(migBase, f), "utf8");
      assert.equal(c.includes("br_inventory"), false, `no new migration in ${f} from this gate`);
    }
  }

  console.log("BR-INV-FIX-01E audit OK");
}

run();
