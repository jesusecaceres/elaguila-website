/**
 * BR-INV-D Bienes Raices owner-only inventory preview cards audit (no DB/network).
 * Run: npm run br:inv-d-audit
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");
const AUDIT = "app/(site)/clasificados/bienes-raices/BR_INV_D_INVENTORY_PREVIEW_CARDS_AUDIT.md";
const PREVIEW = "app/(site)/clasificados/publicar/bienes-raices/negocio/application/sections/shared/BrNegocioPrePublishInventoryPreview.tsx";
const CARD = "app/(site)/clasificados/publicar/bienes-raices/negocio/application/sections/shared/BrNegocioPrePublishInventoryCard.tsx";
const MODEL = "app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioInventoryCardModel.ts";
const SHELL = "app/(site)/clasificados/publicar/bienes-raices/negocio/application/sections/shared/BrNegocioPrePublishInventoryShell.tsx";
const PRIVADO = "app/(site)/clasificados/publicar/bienes-raices/privado";

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function exists(rel: string): boolean {
  return fs.existsSync(path.join(ROOT, rel.replace(/\//g, path.sep)));
}

function run() {
  assert.ok(exists(AUDIT), "BR-INV-D audit doc must exist");
  assert.ok(exists(PREVIEW), "Preview component must exist");
  assert.ok(exists(CARD), "Card component must exist");
  assert.ok(exists(MODEL), "Card model must exist");

  const audit = read(AUDIT);
  const preview = read(PREVIEW);
  const card = read(CARD);
  const model = read(MODEL);
  const shell = read(SHELL);

  assert.ok(audit.includes("BR-INV-D"), "Gate title required");
  assert.ok(audit.includes("BR Negocio"), "BR Negocio section required");
  assert.ok(/owner-only|Owner-only/i.test(audit), "Owner-only preview required");
  assert.ok(/Main property|Propiedad principal/i.test(audit), "Main property card required");
  assert.ok(/Additional property|Propiedad adicional/i.test(audit), "Additional property card required");
  assert.ok(/Draft|Borrador|not published/i.test(audit), "Draft status required");
  assert.ok(/No public URLs|No fake listing/i.test(audit), "No fake URLs/IDs claims required");
  assert.ok(audit.includes("No Supabase"), "No Supabase writes claim required");
  assert.ok(/No schema\/migration/i.test(audit), "No schema/migration claim required");
  assert.ok(audit.includes("BR Privado"), "BR Privado untouched required");
  assert.ok(/Rentas.*Untouched|Rentas is deferred/i.test(audit), "Rentas untouched required");
  assert.ok(audit.includes("BR-INV-E"), "Next gate BR-INV-E required");

  assert.ok(preview.includes("BrNegocioPrePublishInventoryCard"), "Preview must render cards");
  assert.ok(preview.includes("mainProperty"), "Main property required");
  assert.ok(model.includes("mapNegocioFormToMainInventoryCard"), "Negocio main mapper required");
  assert.ok(model.includes("mapAgenteFormToMainInventoryCard"), "Agente main mapper required");
  assert.ok(model.includes("formatUsdWhole"), "Comma price formatting required");
  assert.ok(card.includes("onEdit"), "Edit on additional cards required");
  assert.ok(shell.includes("BrNegocioPrePublishInventoryPreview"), "Shell must embed preview");
  assert.equal(/leonix_ad_id|listing_id|publicUrl/i.test(preview + card + model), false, "No fake public IDs in preview UI");

  if (fs.existsSync(path.join(ROOT, PRIVADO.replace(/\//g, path.sep)))) {
    const walk = (dir: string) => {
      for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, ent.name);
        if (ent.isDirectory()) walk(full);
        else if (ent.name.endsWith(".tsx") || ent.name.endsWith(".ts")) {
          const rel = path.relative(ROOT, full).replace(/\\/g, "/");
          const content = read(rel);
          assert.equal(content.includes("BrNegocioPrePublishInventoryPreview"), false, "BR Privado must not import preview");
        }
      }
    };
    walk(path.join(ROOT, PRIVADO.replace(/\//g, path.sep)));
  }

  console.log("BR-INV-D audit doc OK");
  console.log("Owner-only preview + main/additional cards OK");
  console.log("Draft status + formatting documented OK");
  console.log("No Supabase / no fake URLs / no schema claims OK");
  console.log("BR Privado / Rentas untouched OK");
  console.log("BR-INV-E next gate referenced OK");
}

run();
