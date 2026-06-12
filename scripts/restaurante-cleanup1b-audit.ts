/**
 * Gate REST-FORM-CLEANUP1B — Restaurante form cleanup static audit.
 * Run: npm run restaurantes:form-cleanup1b-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const PAGE = "app/(site)/publicar/restaurantes/page.tsx";
const CLIENT = "app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx";
const SECTION_MODEL = "app/(site)/publicar/restaurantes/restauranteApplicationSectionModel.ts";
const CONFIG = "app/lib/clasificados/restaurantes/restauranteFormCleanupConfig.ts";
const SELECTOR = "app/(site)/clasificados/publicar/restaurantes/page.tsx";
const AUDIT = "app/lib/clasificados/restaurantes/RESTAURANTES_FORM_CLEANUP1B_VERIFY_PATCH_AUDIT.md";

const FORBIDDEN_PREFIXES = [
  "app/(site)/publicar/comida-local/",
  "app/(site)/clasificados/comida-local/",
  "app/lib/clasificados/comida-local/",
  "app/api/",
  "supabase/migrations/",
  "database/migrations/",
  "app/(site)/dashboard/",
  "app/admin/",
];

const ALLOWED_PREFIXES = [
  "app/(site)/publicar/restaurantes/",
  "app/lib/clasificados/restaurantes/",
  "scripts/restaurante-cleanup1b-audit.ts",
  "package.json",
];

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function exists(rel: string): boolean {
  return fs.existsSync(path.join(ROOT, rel.replace(/\//g, path.sep)));
}

function changedFiles(): string[] {
  let tracked: string[] = [];
  let untracked: string[] = [];
  try {
    tracked = execSync("git diff --name-only", { cwd: ROOT, encoding: "utf8" })
      .split(/\r?\n/)
      .map((x) => x.trim())
      .filter(Boolean);
  } catch {
    tracked = [];
  }
  try {
    untracked = execSync("git ls-files --others --exclude-standard", { cwd: ROOT, encoding: "utf8" })
      .split(/\r?\n/)
      .map((x) => x.trim())
      .filter(Boolean);
  } catch {
    untracked = [];
  }
  return [...new Set([...tracked, ...untracked])].map((x) => x.replace(/\\/g, "/"));
}

function isGateScopedChange(p: string): boolean {
  return ALLOWED_PREFIXES.some((a) => p === a || p.startsWith(a));
}

function run() {
  assert.ok(exists(AUDIT), `${AUDIT} must exist`);
  assert.ok(exists(PAGE), `${PAGE} must exist`);
  assert.ok(exists(CLIENT), `${CLIENT} must exist`);
  assert.ok(exists(CONFIG), `${CONFIG} must exist`);
  assert.ok(exists(SELECTOR), `${SELECTOR} must exist`);

  const page = read(PAGE);
  const client = read(CLIENT);
  const sectionModel = read(SECTION_MODEL);
  const config = read(CONFIG);
  const selector = read(SELECTOR);

  assert.match(page, /RestauranteApplicationClient/, "page must render RestauranteApplicationClient");
  assert.match(client, /Tipo de negocio/, "client must render Tipo de negocio");
  assert.match(client, /Idiomas/, "client must render Idiomas");
  assert.match(client, /Modelo de operación/, "client must render Modelo de operación");
  assert.match(client, /RESTAURANTE_FORM_BUSINESS_TYPES/, "client must use filtered business types");
  assert.match(client, /Añadir/, "client must expose Añadir for custom language");
  assert.match(client, /Catering y eventos/, "client must keep Catering y eventos");
  assert.doesNotMatch(client, /Ubicación móvil/, "client must not show Ubicación móvil toggle");
  assert.doesNotMatch(client, />Desde casa</, "client must not show Desde casa toggle");
  assert.doesNotMatch(sectionModel, /restaurantes-section-i/, "section nav must not include I");
  assert.doesNotMatch(sectionModel, /restaurantes-section-j/, "section nav must not include J");
  assert.match(config, /pop_up/, "config must document excluded pop_up");
  assert.match(config, /home_based_food/, "config must document excluded home_based_food");
  assert.match(config, /street_vendor/, "config must document excluded street_vendor");
  assert.match(selector, /\/publicar\/restaurantes/, "selector must route Restaurante establecido");
  assert.match(selector, /\/publicar\/comida-local/, "selector must route Comida Local");

  for (const file of changedFiles()) {
    if (!isGateScopedChange(file)) {
      const forbidden = FORBIDDEN_PREFIXES.some((p) => file.startsWith(p));
      if (forbidden) {
        assert.fail(`Forbidden path changed: ${file}`);
      }
    }
  }

  console.log("restaurante-cleanup1b-audit: PASS");
}

run();
