/**
 * Gate FOOD-L7A — Comida Local user dashboard static audit.
 * Run: npm run comida-local:food-l7a-user-dashboard-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const FOOD_L5B = "app/lib/clasificados/comida-local/COMIDA_LOCAL_FOOD_L5B_PUBLISH_DB_AUDIT.md";
const FOOD_L6 = "app/lib/clasificados/comida-local/COMIDA_LOCAL_FOOD_L6_PUBLIC_RESULTS_AUDIT.md";
const FOOD_L7A = "app/lib/clasificados/comida-local/COMIDA_LOCAL_FOOD_L7A_USER_DASHBOARD_AUDIT.md";

const REQUIRED = [
  FOOD_L5B,
  FOOD_L6,
  FOOD_L7A,
  "app/lib/clasificados/comida-local/comidaLocalDashboardQueries.ts",
  "app/lib/clasificados/comida-local/mapComidaLocalDashboardListing.ts",
  "app/lib/clasificados/comida-local/ComidaLocalDashboardListings.tsx",
  "app/(site)/dashboard/mis-anuncios/page.tsx",
] as const;

const FORBIDDEN_ANALYTICS = ["impresiones", "llamadas", "visitas", "listing_view", "trackAnalytics"];

const FORBIDDEN_PREFIXES = [
  "app/(site)/publicar/restaurantes/",
  "app/(site)/clasificados/restaurantes/",
  "app/lib/clasificados/restaurantes/",
  "app/(site)/publicar/rentas/",
  "app/(site)/clasificados/rentas/",
  "app/(site)/clasificados/bienes-raices/",
  "app/(site)/clasificados/servicios/",
  "app/(site)/publicar/servicios/",
  "app/(site)/clasificados/en-venta/",
  "app/(site)/publicar/en-venta/",
  "app/(site)/clasificados/autos/",
  "app/api/",
  "app/admin/",
  "supabase/migrations/",
];

const ALLOWED_PREFIXES = [
  "app/lib/clasificados/comida-local/",
  "app/(site)/dashboard/",
  "scripts/comida-local-food-l7a-user-dashboard-audit.ts",
  "scripts/comida-local-food-l7a-restore-mis-anuncios-audit.ts",
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

function run() {
  for (const f of REQUIRED) {
    assert.ok(fs.existsSync(path.join(ROOT, f)), `${f} must exist`);
  }

  const queries = read("app/lib/clasificados/comida-local/comidaLocalDashboardQueries.ts");
  assert.ok(queries.includes("comida_local_public_listings"));
  assert.ok(queries.includes("owner_user_id"));
  assert.ok(queries.includes("listUserComidaLocalListings"));

  const mapper = read("app/lib/clasificados/comida-local/mapComidaLocalDashboardListing.ts");
  assert.ok(mapper.includes("leonixAdId"));
  assert.ok(mapper.includes("/clasificados/comida-local/"));

  const component = read("app/lib/clasificados/comida-local/ComidaLocalDashboardListings.tsx");
  assert.ok(component.includes("Comida Local"));
  assert.ok(component.includes("Ver ficha") || component.includes("View listing"));
  assert.ok(component.includes("Todavía no tienes publicaciones de Comida Local"));

  const misAnuncios = read("app/(site)/dashboard/mis-anuncios/page.tsx");
  assert.ok(misAnuncios.includes("fetchOwnerComidaLocalListings"));
  assert.ok(misAnuncios.includes("ComidaLocalDashboardListings"));
  assert.ok(misAnuncios.includes("comida-local"));

  const comidaOnly = [queries, mapper, component].join("\n");
  assert.ok(!/stripe|checkout\.sessions|payment_intent/i.test(comidaOnly));
  assert.ok(!/from\s+["']@\/app\/admin/i.test(comidaOnly));
  assert.ok(!misAnuncios.includes("fetchOwnerComidaLocalListings") || misAnuncios.includes("ComidaLocalDashboardListings"));

  for (const label of FORBIDDEN_ANALYTICS) {
    assert.ok(!component.toLowerCase().includes(label.toLowerCase()), `No fake analytics label: ${label}`);
  }

  const pkg = read("package.json");
  assert.ok(pkg.includes('"comida-local:food-l7a-user-dashboard-audit"'));

  function isAllowed(p: string): boolean {
    return ALLOWED_PREFIXES.some((a) => p === a || p.startsWith(a));
  }

  for (const p of changedFiles()) {
    const scope =
      p.startsWith("app/lib/clasificados/comida-local/") ||
      p.startsWith("app/(site)/dashboard/") ||
      p.startsWith("scripts/comida-local-food-l7a") ||
      p.startsWith("scripts/comida-local-") ||
      p === "package.json";
    if (!scope) continue;
    assert.ok(isAllowed(p), `FOOD-L7A file outside allowed paths: ${p}`);
    if (FORBIDDEN_PREFIXES.some((fp) => p.startsWith(fp))) {
      assert.fail(`Forbidden path modified: ${p}`);
    }
  }

  console.log("comida-local-food-l7a-user-dashboard-audit: OK");
}

run();
