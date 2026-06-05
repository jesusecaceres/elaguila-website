/**
 * Gate FOOD-L7B — Comida Local admin dashboard static audit.
 * Run: npm run comida-local:food-l7b-admin-dashboard-audit
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
const FOOD_L7B = "app/lib/clasificados/comida-local/COMIDA_LOCAL_FOOD_L7B_ADMIN_DASHBOARD_AUDIT.md";

const REQUIRED = [
  FOOD_L5B,
  FOOD_L6,
  FOOD_L7A,
  FOOD_L7B,
  "app/lib/clasificados/comida-local/comidaLocalAdminQueries.ts",
  "app/lib/clasificados/comida-local/mapComidaLocalAdminListing.ts",
  "app/lib/clasificados/comida-local/ComidaLocalAdminListings.tsx",
  "app/admin/(dashboard)/workspace/clasificados/comida-local/page.tsx",
] as const;

const FORBIDDEN_ANALYTICS = ["impresiones", "llamadas", "visitas", "views", "clicks", "impressions"];

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
  "app/(site)/dashboard/",
  "supabase/migrations/",
  "database/migrations/",
];

const ALLOWED_PREFIXES = [
  "app/lib/clasificados/comida-local/",
  "app/admin/",
  "scripts/comida-local-food-l7b-admin-dashboard-audit.ts",
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

  const queries = read("app/lib/clasificados/comida-local/comidaLocalAdminQueries.ts");
  assert.ok(queries.includes("comida_local_public_listings"));
  assert.ok(queries.includes("listAdminComidaLocalListings"));
  assert.ok(queries.includes("leonix_ad_id"));
  assert.ok(queries.includes("updateAdminComidaLocalListingStatus"));

  const mapper = read("app/lib/clasificados/comida-local/mapComidaLocalAdminListing.ts");
  assert.ok(mapper.includes("leonixAdId"));
  assert.ok(mapper.includes("/clasificados/comida-local/"));
  assert.ok(mapper.includes("Comida Local"));

  const component = read("app/lib/clasificados/comida-local/ComidaLocalAdminListings.tsx");
  assert.ok(component.includes("Comida Local"));
  assert.ok(component.includes("Ver ficha"));
  assert.ok(component.includes("No hay publicaciones de Comida Local todavía"));
  assert.ok(component.includes("leonixAdId") || component.includes("Leonix ID"));

  const adminPage = read("app/admin/(dashboard)/workspace/clasificados/comida-local/page.tsx");
  assert.ok(adminPage.includes("listAdminComidaLocalListings"));
  assert.ok(adminPage.includes("ComidaLocalAdminListings"));
  assert.ok(adminPage.includes("comida-local"));

  const comidaOnly = [queries, mapper, component, adminPage].join("\n");
  assert.ok(!/stripe|checkout\.sessions|payment_intent/i.test(comidaOnly));
  assert.ok(!/from\s+["']@\/app\/\(site\)\/dashboard/i.test(comidaOnly));

  for (const label of FORBIDDEN_ANALYTICS) {
    assert.ok(!component.toLowerCase().includes(label.toLowerCase()), `No fake analytics label: ${label}`);
  }

  const pkg = read("package.json");
  assert.ok(pkg.includes('"comida-local:food-l7b-admin-dashboard-audit"'));

  function isAllowed(p: string): boolean {
    return ALLOWED_PREFIXES.some((a) => p === a || p.startsWith(a));
  }

  for (const p of changedFiles()) {
    if (FORBIDDEN_PREFIXES.some((f) => p.startsWith(f))) {
      assert.fail(`Forbidden path changed: ${p}`);
    }
    if (!isAllowed(p)) {
      assert.fail(`Changed file outside gate firewall: ${p}`);
    }
  }

  console.log("FOOD-L7B admin dashboard audit passed.");
}

run();
