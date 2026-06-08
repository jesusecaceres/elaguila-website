/**
 * Gate FOOD-L7A-RESTORE — Re-wire Comida Local in Mis Anuncios static audit.
 * Run: npm run comida-local:food-l7a-restore-mis-anuncios-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const RESTORE_AUDIT =
  "app/lib/clasificados/comida-local/COMIDA_LOCAL_FOOD_L7A_RESTORE_MIS_ANUNCIOS_AUDIT.md";
const MIS_ANUNCIOS = "app/(site)/dashboard/mis-anuncios/page.tsx";

const FORBIDDEN_ANALYTICS = ["impresiones", "llamadas", "visitas", "fake views", "fake clicks"];
const FORBIDDEN_RESTAURANT = [
  "Reservar",
  "Pedir ahora",
  "Opiniones en Google",
  "Opiniones en Yelp",
  "Menú completo",
];

const FORBIDDEN_PREFIXES = [
  "app/(site)/publicar/restaurantes/",
  "app/(site)/clasificados/restaurantes/",
  "app/lib/clasificados/restaurantes/",
  "app/api/",
  "app/admin/",
  "supabase/migrations/",
  "database/migrations/",
];

const ALLOWED_PREFIXES = [
  "app/lib/clasificados/comida-local/",
  "app/(site)/dashboard/mis-anuncios/",
  "scripts/comida-local-food-l7a-restore",
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

function isGateChange(p: string): boolean {
  return ALLOWED_PREFIXES.some((a) => p === a || p.startsWith(a));
}

function run() {
  assert.ok(exists(RESTORE_AUDIT), `${RESTORE_AUDIT} must exist`);
  assert.ok(exists(MIS_ANUNCIOS), `${MIS_ANUNCIOS} must exist`);

  assert.ok(exists("app/lib/clasificados/comida-local/comidaLocalDashboardQueries.ts"));
  assert.ok(exists("app/lib/clasificados/comida-local/mapComidaLocalDashboardListing.ts"));
  assert.ok(exists("app/lib/clasificados/comida-local/ComidaLocalDashboardListings.tsx"));

  const queries = read("app/lib/clasificados/comida-local/comidaLocalDashboardQueries.ts");
  assert.ok(queries.includes("fetchOwnerComidaLocalListings"));
  assert.ok(queries.includes('.eq("owner_user_id", owner)'));

  const mapper = read("app/lib/clasificados/comida-local/mapComidaLocalDashboardListing.ts");
  assert.ok(mapper.includes("leonixAdId"));
  assert.ok(mapper.includes("/clasificados/comida-local/"));

  const component = read("app/lib/clasificados/comida-local/ComidaLocalDashboardListings.tsx");
  assert.ok(component.includes("Comida Local"));
  assert.ok(component.includes("Ver ficha") || component.includes("View listing"));

  const page = read(MIS_ANUNCIOS);
  assert.ok(page.includes("fetchOwnerComidaLocalListings"));
  assert.ok(page.includes("ComidaLocalDashboardListings"));
  assert.ok(page.includes("mapComidaLocalRowToDashboardVm"));
  assert.ok(page.includes('"comida-local"'));
  assert.ok(page.includes("comidaLocalDashboardItems"));
  assert.ok(!page.includes("owner_user_id") || page.includes("fetchOwnerComidaLocalListings(supabase, u.id)"));

  const comidaLib = [queries, mapper, component].join("\n");
  assert.ok(!/stripe|checkout\.sessions/i.test(comidaLib));
  assert.ok(!/from\s+["']@\/app\/admin/i.test(comidaLib));

  for (const label of FORBIDDEN_ANALYTICS) {
    assert.ok(!component.toLowerCase().includes(label.toLowerCase()), `No analytics label: ${label}`);
  }
  for (const label of FORBIDDEN_RESTAURANT) {
    assert.ok(!component.includes(label), `No restaurant CTA: ${label}`);
  }

  const audit = read(RESTORE_AUDIT);
  assert.ok(audit.includes("FOOD-L7A-RESTORE"));
  assert.ok(audit.includes("| Requirement | TRUE/FALSE | Evidence |"));

  const pkg = read("package.json");
  assert.ok(pkg.includes('"comida-local:food-l7a-restore-mis-anuncios-audit"'));

  for (const p of changedFiles()) {
    if (!isGateChange(p)) continue;
    if (FORBIDDEN_PREFIXES.some((f) => p.startsWith(f))) {
      assert.fail(`Forbidden path changed: ${p}`);
    }
  }

  console.log("FOOD-L7A-RESTORE mis-anuncios audit passed.");
}

run();
