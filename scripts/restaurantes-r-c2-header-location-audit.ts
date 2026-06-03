/**
 * Gate R-C2 — Restaurante Header + Description + Location CTA static audit.
 * Run: npm run restaurantes:r-c2-header-location-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const AUDIT_MD = "app/lib/clasificados/restaurantes/RESTAURANTES_R_C2_HEADER_LOCATION_AUDIT.md";

const REQUIRED_LABELS = [
  "Sobre nosotros",
  "Ver en el mapa",
  "Cómo llegar",
  "Dirección",
  "Ciudad",
  "Estado",
  "Código postal",
] as const;

const FORBIDDEN_UI = ["Resumen corto", "resumen corto"];

const ALLOWED_PREFIXES = [
  "app/(site)/clasificados/restaurantes/",
  "app/(site)/publicar/restaurantes/",
  "app/lib/clasificados/restaurantes/",
  "app/api/clasificados/restaurantes/",
  "scripts/restaurant-contact-hub-qa.ts",
  "scripts/restaurantes-r-c2-header-location-audit.ts",
  "package.json",
];

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
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

function isAllowedPath(p: string): boolean {
  return ALLOWED_PREFIXES.some((prefix) => p === prefix || p.startsWith(prefix));
}

function run() {
  assert.ok(fs.existsSync(path.join(ROOT, AUDIT_MD)), `${AUDIT_MD} must exist`);
  const md = read(AUDIT_MD);
  assert.ok(md.includes("Gate R-C2"), "Audit title");
  assert.ok(md.includes("## Servicios reference findings"), "Servicios reference section");
  assert.ok(/Resumen corto removal/i.test(md), "Resumen corto removal section");
  assert.ok(/Address-to-map CTA/i.test(md), "Address-to-map section");
  assert.ok(/Header background standard/i.test(md), "Header background section");
  assert.ok(md.includes("| Requirement | TRUE/FALSE | Evidence |"), "TRUE/FALSE table");

  const app = read("app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx");
  const hubBuild = read("app/(site)/clasificados/restaurantes/application/buildRestaurantContactHub.ts");
  const hubUi = read("app/(site)/clasificados/restaurantes/shell/RestaurantContactHub.tsx");
  const labelSources = `${app}\n${hubBuild}\n${hubUi}`;
  for (const label of REQUIRED_LABELS) {
    assert.ok(labelSources.includes(label), `Missing label: ${label}`);
  }
  for (const bad of FORBIDDEN_UI) {
    assert.ok(!app.includes(`>${bad}<`) && !app.includes(`required>${bad}`), `Application still shows ${bad}`);
    assert.ok(!app.includes(`FieldLabel required>${bad}`), `Required field label ${bad}`);
  }

  const shell = read("app/(site)/clasificados/restaurantes/shell/RestauranteAdStoryPreview.tsx");
  assert.ok(shell.includes("RestauranteProfileHeader"), "Controlled profile header in preview");
  assert.ok(!shell.includes("summaryShort"), "No summaryShort in AdStory preview shell");

  const mapper = read("app/(site)/clasificados/restaurantes/application/mapRestauranteDraftToShell.ts");
  assert.ok(mapper.includes("summaryShort: undefined"), "Shell omits short summary output");

  const hrefLib = read("app/(site)/clasificados/restaurantes/application/restauranteContactHref.ts");
  assert.ok(hrefLib.includes("buildRestaurantPublicAddressQuery"), "Address query builder");
  assert.ok(hrefLib.includes("encodeURIComponent"), "URL encoding for maps");

  const pkg = read("package.json");
  assert.ok(pkg.includes('"restaurantes:r-c2-header-location-audit"'), "package script");

  const changed = changedFiles();
  const blocked = changed.filter(
    (p) => p.includes("stripe") || p.startsWith("app/admin/") || (p.includes("dashboard") && p.startsWith("app/")),
  );
  assert.equal(blocked.length, 0, `Blocked paths: ${blocked.join(", ")}`);

  const unrelated = changed.filter((p) => !isAllowedPath(p));
  assert.equal(unrelated.length, 0, `Unrelated files: ${unrelated.join(", ")}`);

  console.log("OK: restaurantes:r-c2-header-location-audit passed");
  console.log(`Changed files (${changed.length}):`, changed.length ? changed.join(", ") : "(none)");
}

run();
