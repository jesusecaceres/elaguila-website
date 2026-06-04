/**
 * Gate FOOD-L5B — Comida Local publish DB + API static audit.
 * Run: npm run comida-local:food-l5b-publish-db-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const FOOD_L5A = "app/lib/clasificados/comida-local/COMIDA_LOCAL_FOOD_L5A_PUBLISH_READINESS_AUDIT.md";
const FOOD_L5B = "app/lib/clasificados/comida-local/COMIDA_LOCAL_FOOD_L5B_PUBLISH_DB_AUDIT.md";
const PUBLISH_ROUTE = "app/api/clasificados/comida-local/publish/route.ts";

const REQUIRED_FILES = [
  FOOD_L5A,
  FOOD_L5B,
  "app/lib/clasificados/comida-local/comidaLocalLeonixAdId.ts",
  "app/lib/clasificados/comida-local/comidaLocalSlug.ts",
  "app/lib/clasificados/comida-local/comidaLocalPublishTypes.ts",
  "app/lib/clasificados/comida-local/comidaLocalPublishValidation.ts",
  PUBLISH_ROUTE,
] as const;

const MIGRATION_REQUIRED_SNIPPETS = [
  "comida_local_public_listings",
  "leonix_ad_id",
  "slug",
  "owner_user_id",
  "status",
  "package_tier",
  "payment_status",
  "listing_json",
  "city_canonical",
  "city_display",
  "food_type",
  "enable row level security",
] as const;

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
  "app/(site)/clasificados/comida-local/",
  "app/(site)/dashboard/",
  "app/admin/",
];

const ALLOWED_PREFIXES = [
  "app/lib/clasificados/comida-local/",
  "app/api/clasificados/comida-local/publish/",
  "supabase/migrations/",
  "scripts/comida-local-food-l5b-publish-db-audit.ts",
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

function findComidaMigration(): string {
  const dir = path.join(ROOT, "supabase", "migrations");
  assert.ok(fs.existsSync(dir), "supabase/migrations must exist");
  const files = fs
    .readdirSync(dir)
    .filter((f) => /comida_local/i.test(f))
    .sort();
  assert.ok(files.length > 0, "comida_local migration file must exist");
  return `supabase/migrations/${files[files.length - 1]}`;
}

function run() {
  for (const f of REQUIRED_FILES) {
    assert.ok(fs.existsSync(path.join(ROOT, f)), `${f} must exist`);
  }

  const l5b = read(FOOD_L5B);
  assert.ok(l5b.includes("Gate FOOD-L5B"), "FOOD-L5B title");
  assert.ok(l5b.includes("| Requirement | TRUE/FALSE | Evidence |"), "TRUE/FALSE table");

  const migrationRel = findComidaMigration();
  const migrationSql = read(migrationRel);
  for (const snippet of MIGRATION_REQUIRED_SNIPPETS) {
    assert.ok(
      migrationSql.toLowerCase().includes(snippet.toLowerCase()) ||
        migrationSql.includes(snippet),
      `Migration missing: ${snippet}`
    );
  }

  const leonix = read("app/lib/clasificados/comida-local/comidaLocalLeonixAdId.ts");
  assert.ok(/COMIDA/i.test(leonix), "Leonix helper must reference COMIDA");
  assert.ok(/comida_local/i.test(leonix), "Leonix helper must use comida_local namespace");

  assert.ok(fs.existsSync(path.join(ROOT, "app/lib/clasificados/comida-local/comidaLocalSlug.ts")));

  const publishApi = read(PUBLISH_ROUTE);
  assert.ok(/export\s+async\s+function\s+POST/.test(publishApi), "Publish API must export POST");
  assert.ok(!/stripe|checkout\.sessions|payment_intent/i.test(publishApi), "No Stripe in publish API");
  assert.ok(!/trackAnalytics|analytics_events|insertAnalytics/i.test(publishApi), "No analytics inserts");
  assert.ok(!/app\/admin|app\/\(site\)\/dashboard/i.test(publishApi), "No dashboard/admin imports");

  const pkg = read("package.json");
  assert.ok(pkg.includes('"comida-local:food-l5b-publish-db-audit"'), "package.json L5B script");

  function isAllowed(p: string): boolean {
    return ALLOWED_PREFIXES.some((a) => p === a || p.startsWith(a));
  }

  for (const p of changedFiles()) {
    const gateScope =
      p.startsWith("app/lib/clasificados/comida-local/") ||
      p.startsWith("app/api/clasificados/comida-local/") ||
      p.startsWith("supabase/migrations/") ||
      p.startsWith("scripts/comida-local-") ||
      p === "package.json";
    if (!gateScope) continue;
    assert.ok(isAllowed(p), `FOOD-L5B file outside allowed paths: ${p}`);
    if (FORBIDDEN_PREFIXES.some((fp) => p.startsWith(fp))) {
      assert.fail(`Forbidden path modified in FOOD-L5B scope: ${p}`);
    }
  }

  console.log("comida-local-food-l5b-publish-db-audit: OK");
}

run();
