/**
 * Gate FOOD-L9C — Comida Local subcategory launch lock + customer preview readiness static audit.
 * Run: npm run comida-local:food-l9c-subcategory-lock-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const FOOD_L9C = "app/lib/clasificados/comida-local/COMIDA_LOCAL_FOOD_L9C_SUBCATEGORY_LOCK_AUDIT.md";
const FOOD_L9B = "app/lib/clasificados/comida-local/COMIDA_LOCAL_FOOD_L9B_PRODUCTION_TABLE_AUDIT.md";
const TABLE = "comida_local_public_listings";
const EXPECTED_MIGRATION = "20260604120000_comida_local_public_listings.sql";

const ROUTES = [
  "app/(site)/clasificados/comida-local/page.tsx",
  "app/(site)/clasificados/comida-local/[slug]/page.tsx",
  "app/(site)/clasificados/comida-local/preview/page.tsx",
  "app/(site)/publicar/comida-local/page.tsx",
] as const;

const FORBIDDEN_PREFIXES = [
  "app/(site)/publicar/restaurantes/",
  "app/(site)/clasificados/restaurantes/",
  "app/lib/clasificados/restaurantes/",
  "app/(site)/clasificados/rentas/",
  "app/(site)/clasificados/bienes-raices/",
  "app/(site)/clasificados/servicios/",
  "app/(site)/clasificados/en-venta/",
  "app/(site)/clasificados/autos/",
  "app/dashboard/",
  "app/admin/",
];

const ALLOWED_PREFIXES = [
  "app/lib/clasificados/comida-local/",
  "app/(site)/clasificados/comida-local/",
  "app/(site)/publicar/comida-local/",
  "app/api/clasificados/comida-local/",
  "supabase/migrations/",
  "scripts/comida-local-food-l9c",
  "package.json",
];

const RAW_ERROR_MARKERS = [
  "schema cache",
  "Could not find the table",
  "PGRST205",
] as const;

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

function migrationHasTable(): boolean {
  const file = path.join(ROOT, "supabase/migrations", EXPECTED_MIGRATION);
  if (!fs.existsSync(file)) return false;
  const content = fs.readFileSync(file, "utf8");
  return /create\s+table\s+if\s+not\s+exists\s+public\.comida_local_public_listings/i.test(content);
}

function run() {
  assert.ok(exists(FOOD_L9C), `${FOOD_L9C} must exist`);
  assert.ok(exists(FOOD_L9B), `${FOOD_L9B} must exist (FOOD-L9B prior gate)`);
  assert.ok(migrationHasTable(), `Migration must create ${TABLE}`);

  for (const route of ROUTES) {
    assert.ok(exists(route), `Route must exist: ${route}`);
  }

  const publicQueries = read("app/lib/clasificados/comida-local/comidaLocalPublicQueries.ts");
  assert.ok(publicQueries.includes(`"${TABLE}"`));
  assert.ok(publicQueries.includes("classifyComidaLocalInventoryError"));
  assert.ok(publicQueries.includes("inventory_table_missing"));

  const publish = read("app/api/clasificados/comida-local/publish/route.ts");
  assert.ok(publish.includes(`"${TABLE}"`));
  assert.ok(publish.includes("parseComidaLocalPublishRequest"));
  assert.ok(publish.includes("allocateNextComidaLocalLeonixAdId"));
  assert.ok(!/stripe|checkout/i.test(publish));

  const publishValidation = read("app/lib/clasificados/comida-local/comidaLocalPublishValidation.ts");
  assert.ok(publishValidation.includes("hasComidaLocalMainPhoto"));
  assert.ok(publishValidation.includes("Agrega teléfono o WhatsApp"));

  const publishClient = read("app/lib/clasificados/comida-local/comidaLocalPublishClient.ts");
  assert.ok(publishClient.includes("/api/clasificados/comida-local/publish"));

  const application = read("app/(site)/publicar/comida-local/ComidaLocalApplicationClient.tsx");
  assert.ok(application.includes("postComidaLocalPublishApi"));
  assert.ok(application.includes("handlePublish"));

  const preview = read("app/(site)/clasificados/comida-local/preview/ComidaLocalPreviewClient.tsx");
  assert.ok(preview.includes("no está publicada"));
  assert.ok(!preview.includes("/api/clasificados/comida-local/publish"));

  const resultsPage = read("app/(site)/clasificados/comida-local/page.tsx");
  assert.ok(resultsPage.includes("listPublishedComidaLocalListings"));
  assert.ok(resultsPage.includes("COMIDA_LOCAL_RESULTS_EMPTY_MESSAGE_ES"));
  assert.ok(!/\[\s*\{[^}]*businessName:\s*["']/.test(resultsPage));
  for (const marker of RAW_ERROR_MARKERS) {
    assert.ok(!resultsPage.includes(marker), `Results page must not expose: ${marker}`);
  }

  const card = read("app/(site)/clasificados/comida-local/components/ComidaLocalListingCard.tsx");
  assert.ok(card.includes("Ver ficha"));
  assert.ok(card.includes("detailHref"));
  assert.ok(!/Reservar|Pedir ahora|Opiniones en Google/i.test(card));

  const detailPage = read("app/(site)/clasificados/comida-local/[slug]/page.tsx");
  assert.ok(detailPage.includes("getPublishedComidaLocalListingBySlug"));
  assert.ok(detailPage.includes("notFound"));

  const dashboardPath = "app/lib/clasificados/comida-local/comidaLocalDashboardQueries.ts";
  if (exists(dashboardPath)) {
    assert.ok(read(dashboardPath).includes(`"${TABLE}"`));
  }

  const adminPath = "app/lib/clasificados/comida-local/comidaLocalAdminQueries.ts";
  if (exists(adminPath)) {
    assert.ok(read(adminPath).includes(`"${TABLE}"`));
  }

  const audit = read(FOOD_L9C);
  assert.ok(audit.includes("FOOD-L9C"));
  assert.ok(audit.includes("| Requirement | TRUE/FALSE | Evidence |"));
  assert.ok(audit.includes("Admin polish is deferred"));

  const pkg = read("package.json");
  assert.ok(pkg.includes('"comida-local:food-l9c-subcategory-lock-audit"'));

  for (const p of changedFiles()) {
    if (!isGateScopedChange(p)) continue;
    if (FORBIDDEN_PREFIXES.some((f) => p.startsWith(f))) {
      assert.fail(`Forbidden path changed: ${p}`);
    }
  }

  console.log("FOOD-L9C subcategory lock audit passed.");
}

run();
