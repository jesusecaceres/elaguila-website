/**
 * Gate FOOD-L6 — Comida Local public results static audit.
 * Run: npm run comida-local:food-l6-public-results-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const FOOD_L5B = "app/lib/clasificados/comida-local/COMIDA_LOCAL_FOOD_L5B_PUBLISH_DB_AUDIT.md";
const FOOD_L5C = "app/lib/clasificados/comida-local/COMIDA_LOCAL_FOOD_L5C_IMAGE_UPLOAD_AUDIT.md";
const FOOD_L6 = "app/lib/clasificados/comida-local/COMIDA_LOCAL_FOOD_L6_PUBLIC_RESULTS_AUDIT.md";

const REQUIRED = [
  FOOD_L5B,
  FOOD_L5C,
  FOOD_L6,
  "app/lib/clasificados/comida-local/comidaLocalPublicQueries.ts",
  "app/lib/clasificados/comida-local/mapComidaLocalPublicListing.ts",
  "app/(site)/clasificados/comida-local/components/ComidaLocalListingCard.tsx",
  "app/(site)/clasificados/comida-local/components/ComidaLocalResultsFilters.tsx",
  "app/(site)/clasificados/comida-local/page.tsx",
  "app/(site)/clasificados/comida-local/[slug]/page.tsx",
] as const;

const FORBIDDEN_RESTAURANT_LABELS = [
  "Reservar",
  "Pedir ahora",
  "Opiniones en Google",
  "Opiniones en Yelp",
  "Amenidades",
  "Catering y eventos",
  "Menú completo",
];

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
  "app/(site)/publicar/comida-local/",
  "app/api/",
  "supabase/migrations/",
  "app/(site)/dashboard/",
  "app/admin/",
];

const ALLOWED_PREFIXES = [
  "app/lib/clasificados/comida-local/",
  "app/(site)/clasificados/comida-local/",
  "scripts/comida-local-food-l6-public-results-audit.ts",
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

  const queries = read("app/lib/clasificados/comida-local/comidaLocalPublicQueries.ts");
  assert.ok(queries.includes("comida_local_public_listings"));
  assert.ok(queries.includes("published"));

  const resultsPage = read("app/(site)/clasificados/comida-local/page.tsx");
  assert.ok(resultsPage.includes("listPublishedComidaLocalListings"));
  assert.ok(!/\[\s*\{[^}]*businessName:\s*["'`]/i.test(resultsPage));
  assert.ok(!/demoListings|MOCK_|SAMPLE_LISTINGS/i.test(resultsPage));

  const detailPage = read("app/(site)/clasificados/comida-local/[slug]/page.tsx");
  assert.ok(!/Vista previa/i.test(detailPage));
  assert.ok(!/no está publicada/i.test(detailPage));
  assert.ok(detailPage.includes("getPublishedComidaLocalListingBySlug"));

  const card = read("app/(site)/clasificados/comida-local/components/ComidaLocalListingCard.tsx");
  const detailShell = read("app/(site)/clasificados/comida-local/components/ComidaLocalDetailShell.tsx");
  const mapper = read("app/lib/clasificados/comida-local/mapComidaLocalPublicListing.ts");

  for (const label of FORBIDDEN_RESTAURANT_LABELS) {
    assert.ok(!card.includes(label), `Card must not include: ${label}`);
    assert.ok(!detailShell.includes(label), `Detail shell must not include: ${label}`);
    assert.ok(!mapper.includes(label), `Mapper must not include: ${label}`);
  }

  const gateFiles = [resultsPage, detailPage, card, detailShell, queries, mapper].join("\n");
  assert.ok(!/stripe|payment_intent|checkout\.sessions/i.test(gateFiles));
  assert.ok(!/trackAnalytics|analytics_events/i.test(gateFiles));
  assert.ok(!/app\/admin|app\/\(site\)\/dashboard/i.test(gateFiles));

  const pkg = read("package.json");
  assert.ok(pkg.includes('"comida-local:food-l6-public-results-audit"'));

  function isAllowed(p: string): boolean {
    return ALLOWED_PREFIXES.some((a) => p === a || p.startsWith(a));
  }

  for (const p of changedFiles()) {
    const gateScope =
      p.startsWith("app/lib/clasificados/comida-local/") ||
      p.startsWith("app/(site)/clasificados/comida-local/") ||
      p.startsWith("scripts/comida-local-") ||
      p === "package.json";
    if (!gateScope) continue;
    assert.ok(isAllowed(p), `FOOD-L6 file outside allowed paths: ${p}`);
    if (FORBIDDEN_PREFIXES.some((fp) => p.startsWith(fp))) {
      assert.fail(`Forbidden path modified in FOOD-L6 scope: ${p}`);
    }
  }

  const migrationsDir = path.join(ROOT, "supabase", "migrations");
  if (fs.existsSync(migrationsDir)) {
    const changed = changedFiles().filter((p) => p.startsWith("supabase/migrations/"));
    assert.equal(changed.length, 0, "No migration files should change in FOOD-L6");
  }

  console.log("comida-local-food-l6-public-results-audit: OK");
}

run();
