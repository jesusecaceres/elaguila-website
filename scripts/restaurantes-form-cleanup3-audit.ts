/**
 * Gate REST-FORM-CLEANUP3 — Restaurante address + Google review copy static audit.
 * Run: npm run restaurantes:form-cleanup3-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const CLIENT = "app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx";
const CONFIG = "app/lib/clasificados/restaurantes/restauranteFormCleanupConfig.ts";
const CONTACT_HREF = "app/(site)/clasificados/restaurantes/application/restauranteContactHref.ts";
const TAXONOMY = "app/(site)/clasificados/restaurantes/application/restauranteTaxonomy.ts";
const AUDIT = "app/lib/clasificados/restaurantes/RESTAURANTES_FORM_CLEANUP3_AUDIT.md";

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
  "app/(site)/clasificados/restaurantes/",
  "app/lib/clasificados/restaurantes/",
  "scripts/restaurantes-form-cleanup3-audit.ts",
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
  assert.ok(exists(CLIENT), `${CLIENT} must exist`);

  const client = read(CLIENT);
  const config = read(CONFIG);
  const href = read(CONTACT_HREF);
  const taxonomy = read(TAXONOMY);
  const pkg = read("package.json");

  assert.match(client, /Google reseñas o perfil/, "Google review label must be clear");
  assert.match(client, /perfil de Google o reseñas públicas/, "Google helper must not imply maps URL");
  assert.doesNotMatch(taxonomy, /googleReviewUrl: "https:\/\/maps\.google\.com/, "Google placeholder must not be maps URL");

  assert.match(client, /Dirección \/ número y calle/, "street address label must exist");
  assert.match(client, /Dirección línea 2/, "address line 2 label must exist");
  assert.match(client, />Ciudad</, "city label must exist");
  assert.match(client, />Estado</, "state label must exist");
  assert.match(client, /Código postal/, "ZIP label must exist");
  assert.match(client, /freeText/, "city must accept free text");
  assert.match(client, /RESTAURANTE_US_STATE_OPTIONS/, "state dropdown must exist");
  assert.match(config, /RESTAURANTE_US_STATE_OPTIONS/, "state options list must exist");

  assert.doesNotMatch(client, /Ver en el mapa \(URL personalizada\)/, "custom map URL field must be removed");
  assert.doesNotMatch(client, /Mostrar dirección exacta cuando aplique/, "exact address checkbox must be removed");
  assert.doesNotMatch(client, /food trucks, pop-ups, cocina en casa/, "mobile/home privacy copy must be removed");

  assert.match(href, /formatRestauranteCityStateZipLine/, "city/state/ZIP formatter must exist");
  assert.match(href, /buildRestaurantPublicAddressQuery/, "full address map query helper must exist");
  assert.match(href, /verUbicacionUrl/, "legacy custom map URL fallback must remain in mapper");

  assert.match(pkg, /restaurantes:form-cleanup3-audit/, "package script must exist");

  for (const file of changedFiles()) {
    if (!isGateScopedChange(file)) {
      const forbidden = FORBIDDEN_PREFIXES.some((p) => file.startsWith(p));
      if (forbidden) {
        assert.fail(`Forbidden path changed: ${file}`);
      }
    }
  }

  console.log("restaurantes-form-cleanup3-audit: PASS");
}

run();
