/**
 * BR-INV-B Bienes Raices pre-publish inventory drawer shell audit (no DB/network).
 * Run: npm run br:inv-b-audit
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");
const AUDIT = "app/(site)/clasificados/bienes-raices/BR_INV_B_DRAWER_SHELL_AUDIT.md";
const SHELL = "app/(site)/clasificados/publicar/bienes-raices/negocio/application/sections/shared/BrNegocioPrePublishInventoryShell.tsx";
const DRAWER = "app/(site)/clasificados/publicar/bienes-raices/negocio/application/sections/shared/BrNegocioPrePublishInventoryDrawerShell.tsx";
const PRIVADO = "app/(site)/clasificados/publicar/bienes-raices/privado";

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function exists(rel: string): boolean {
  return fs.existsSync(path.join(ROOT, rel.replace(/\//g, path.sep)));
}

function run() {
  assert.ok(exists(AUDIT), "BR-INV-B audit doc must exist");
  assert.ok(exists(SHELL), "Inventory shell component must exist");
  assert.ok(exists(DRAWER), "Inventory drawer component must exist");

  const audit = read(AUDIT);
  const shell = read(SHELL);
  const drawer = read(DRAWER);

  assert.ok(audit.includes("BR-INV-B"), "Gate title required");
  assert.ok(audit.includes("BR Negocio"), "BR Negocio section required");
  assert.ok(/CTA|Agregar propiedad/i.test(audit), "CTA section required");
  assert.ok(/drawer/i.test(audit), "Drawer shell section required");
  assert.ok(/inventory count|Propiedades adicionales/i.test(audit), "Inventory count shell required");
  assert.ok(audit.includes("No Supabase"), "No Supabase writes claim required");
  assert.ok(/No schema\/migration/i.test(audit), "No schema/migration claim required");
  assert.ok(audit.includes("BR Privado"), "BR Privado untouched statement required");
  assert.ok(/Rentas.*Untouched|Rentas is deferred/i.test(audit), "Rentas untouched statement required");
  assert.ok(audit.includes("BR-INV-C"), "Next gate BR-INV-C required");

  assert.ok(shell.includes("BrNegocioPrePublishInventoryDrawerShell"), "Shell must render drawer");
  assert.ok(shell.includes("additionalCount = 0"), "Count shell must start at 0");
  assert.ok(drawer.includes("disabled"), "Save button must be disabled");
  assert.equal(/from\s+["']@\/.*supabase|createClient|\.from\(/i.test(drawer), false, "Drawer must not call Supabase");

  const privadoFiles = fs.readdirSync(path.join(ROOT, PRIVADO.replace(/\//g, path.sep)), { recursive: true });
  for (const f of privadoFiles) {
    if (typeof f === "string" && f.endsWith(".tsx")) {
      const content = read(`${PRIVADO}/${f}`);
      assert.equal(
        content.includes("BrNegocioPrePublishInventoryShell"),
        false,
        "BR Privado must not import inventory shell"
      );
    }
  }

  console.log("BR-INV-B audit doc OK");
  console.log("CTA + drawer + count shell documented OK");
  console.log("No Supabase / no schema claims OK");
  console.log("BR Privado / Rentas untouched OK");
  console.log("BR-INV-C next gate referenced OK");
}

run();
