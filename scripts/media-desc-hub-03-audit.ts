/**
 * MEDIA-DESC-HUB-03 — Bienes Raíces + Rentas media/description/contact audit (no network).
 * Run: npm run media:desc-hub-03-audit
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");
const AUDIT = "app/(site)/clasificados/bienes-raices/MEDIA_DESC_HUB_03_AUDIT.md";

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function exists(rel: string): boolean {
  return fs.existsSync(path.join(ROOT, rel.replace(/\//g, path.sep)));
}

function run() {
  assert.ok(exists(AUDIT), "MEDIA-DESC-HUB-03 audit doc must exist");

  const audit = read(AUDIT);

  for (const required of [
    "MEDIA-DESC-HUB-03",
    "BR Privado",
    "BR Negocio",
    "Rentas Privado",
    "Rentas Negocio",
    "Fotos y medios",
    "drag",
    "portada",
    "Usar URL",
    "Descripción principal",
    "second agent",
    "Financiamiento",
    "duplicate CTA",
    "analytics",
    "TRUE",
    "FALSE",
    "N/A",
  ]) {
    assert.ok(audit.includes(required), `Audit doc must mention: ${required}`);
  }

  assert.ok(
    audit.includes("| TRUE |") || audit.includes("| FALSE |") || audit.includes("| N/A |"),
    "Audit doc must include TRUE/FALSE/N/A tables",
  );

  for (const unrelated of ["autos/", "servicios/", "restaurantes/", "tienda/", "empleos/"]) {
    assert.equal(
      audit.toLowerCase().includes(`changed: \`${unrelated}`) || audit.toLowerCase().includes(`modified \`${unrelated}`),
      false,
      `Audit doc should not list unrelated category as changed: ${unrelated}`,
    );
  }

  console.log("media-desc-hub-03-audit: OK");
}

run();
