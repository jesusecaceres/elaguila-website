/**
 * BR-INV-C Bienes Raices property-only inventory drawer fields audit (no DB/network).
 * Run: npm run br:inv-c-audit
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");
const AUDIT = "app/(site)/clasificados/bienes-raices/BR_INV_C_PROPERTY_DRAWER_FIELDS_AUDIT.md";
const DRAFT = "app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioAdditionalInventoryDraft.ts";
const FORM = "app/(site)/clasificados/publicar/bienes-raices/negocio/application/sections/shared/BrNegocioPrePublishInventoryDrawerForm.tsx";
const SHELL = "app/(site)/clasificados/publicar/bienes-raices/negocio/application/sections/shared/BrNegocioPrePublishInventoryShell.tsx";
const NEGOCIO_STATE = "app/(site)/clasificados/publicar/bienes-raices/negocio/application/schema/bienesRaicesNegocioFormState.ts";
const PRIVADO = "app/(site)/clasificados/publicar/bienes-raices/privado";

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function exists(rel: string): boolean {
  return fs.existsSync(path.join(ROOT, rel.replace(/\//g, path.sep)));
}

function run() {
  assert.ok(exists(AUDIT), "BR-INV-C audit doc must exist");
  assert.ok(exists(DRAFT), "Draft module must exist");
  assert.ok(exists(FORM), "Drawer form must exist");

  const audit = read(AUDIT);
  const draft = read(DRAFT);
  const form = read(FORM);
  const shell = read(SHELL);
  const negocioState = read(NEGOCIO_STATE);

  assert.ok(audit.includes("BR-INV-C"), "Gate title required");
  assert.ok(audit.includes("BR Negocio"), "BR Negocio section required");
  assert.ok(/property-only drawer fields|Drawer fields added/i.test(audit), "Property-only drawer fields required");
  assert.ok(audit.includes("BrNegocioAdditionalInventoryPropertyDraft"), "Draft data model required");
  assert.ok(/Save|Guardar propiedad/i.test(audit), "Save behavior required");
  assert.ok(/save-and-add-another|Guardar y agregar/i.test(audit), "Save and add another required");
  assert.ok(/Edit|Remove|Editar|Eliminar/i.test(audit), "Edit/remove required");
  assert.ok(audit.includes("No Supabase"), "No Supabase writes claim required");
  assert.ok(/No schema\/migration/i.test(audit), "No schema/migration claim required");
  assert.ok(/No fake.*URL|No public URLs/i.test(audit), "No fake URLs claim required");
  assert.ok(/No fake.*Leonix|No fake listing/i.test(audit), "No fake IDs claim required");
  assert.ok(audit.includes("BR Privado"), "BR Privado untouched required");
  assert.ok(/Rentas.*Untouched|Rentas is deferred/i.test(audit), "Rentas untouched required");
  assert.ok(audit.includes("BR-INV-D"), "Next gate BR-INV-D required");

  assert.ok(draft.includes("br-local-property-"), "Local-only draft ids required");
  assert.ok(draft.includes("validateBrNegocioAdditionalInventoryDraft"), "Validation required");
  assert.ok(form.includes("propertyType"), "Property type field required");
  assert.ok(shell.includes("onItemsChange"), "Inventory list mutations required");
  assert.ok(negocioState.includes("additionalInventoryProperties"), "Negocio state field required");
  assert.equal(/from\s+["']@\/.*supabase|createClient/i.test(form + shell + draft), false, "No Supabase in inventory UI");

  const privadoDir = path.join(ROOT, PRIVADO.replace(/\//g, path.sep));
  if (fs.existsSync(privadoDir)) {
    const walk = (dir: string) => {
      for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, ent.name);
        if (ent.isDirectory()) walk(full);
        else if (ent.name.endsWith(".tsx") || ent.name.endsWith(".ts")) {
          const rel = path.relative(ROOT, full).replace(/\\/g, "/");
          const content = read(rel);
          assert.equal(content.includes("BrNegocioPrePublishInventoryShell"), false, "BR Privado must not import shell");
        }
      }
    };
    walk(privadoDir);
  }

  console.log("BR-INV-C audit doc OK");
  console.log("Property-only drawer + draft model OK");
  console.log("Save / edit / remove documented OK");
  console.log("No Supabase / no fake URLs / no schema claims OK");
  console.log("BR Privado / Rentas untouched OK");
  console.log("BR-INV-D next gate referenced OK");
}

run();
