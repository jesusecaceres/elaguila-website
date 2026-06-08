/**
 * Gate FOOD-P1 — Comida Local customer-facing polish static audit.
 * Run: npm run comida-local:food-p1-customer-polish-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const FOOD_P1 = "app/lib/clasificados/comida-local/COMIDA_LOCAL_FOOD_P1_CUSTOMER_POLISH_AUDIT.md";

const ROUTES = [
  "app/(site)/clasificados/comida-local/page.tsx",
  "app/(site)/clasificados/comida-local/[slug]/page.tsx",
  "app/(site)/clasificados/comida-local/preview/page.tsx",
  "app/(site)/publicar/comida-local/page.tsx",
] as const;

const PUBLIC_COMPONENTS = [
  "app/(site)/clasificados/comida-local/components/ComidaLocalListingCard.tsx",
  "app/(site)/clasificados/comida-local/components/ComidaLocalDetailShell.tsx",
  "app/(site)/clasificados/comida-local/components/comidaLocalCustomerStyles.ts",
] as const;

const FORBIDDEN_RESTAURANT_LABELS = [
  "Reservar",
  "Pedir ahora",
  "Opiniones en Google",
  "Opiniones en Yelp",
  "Menú completo",
] as const;

const FAKE_METRICS = [
  "fake views",
  "fake clicks",
  "demo analytics",
  "placeholder analytics",
] as const;

const RAW_ERROR_MARKERS = ["schema cache", "Could not find the table", "PGRST205"] as const;

const FORBIDDEN_PREFIXES = [
  "app/(site)/publicar/restaurantes/",
  "app/(site)/clasificados/restaurantes/",
  "app/lib/clasificados/restaurantes/",
  "app/(site)/clasificados/rentas/",
  "app/(site)/clasificados/bienes-raices/",
  "app/(site)/clasificados/servicios/",
  "app/(site)/clasificados/en-venta/",
  "app/(site)/clasificados/autos/",
  "app/admin/",
  "app/dashboard/",
  "supabase/migrations/",
];

const ALLOWED_PREFIXES = [
  "app/lib/clasificados/comida-local/",
  "app/(site)/clasificados/comida-local/",
  "app/(site)/publicar/comida-local/",
  "scripts/comida-local-food-p1",
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
  assert.ok(exists(FOOD_P1), `${FOOD_P1} must exist`);

  for (const route of ROUTES) {
    assert.ok(exists(route), `Route must exist: ${route}`);
  }

  for (const c of PUBLIC_COMPONENTS) {
    assert.ok(exists(c), `Component must exist: ${c}`);
  }

  assert.ok(exists("app/(site)/publicar/comida-local/ComidaLocalApplicationClient.tsx"));

  const resultsPage = read("app/(site)/clasificados/comida-local/page.tsx");
  assert.ok(resultsPage.includes("Publicar tu puesto"));
  assert.ok(resultsPage.includes("COMIDA_LOCAL_RESULTS_EMPTY_MESSAGE_ES"));
  assert.ok(resultsPage.includes("listPublishedComidaLocalListings"));
  assert.ok(!/\[\s*\{[^}]*businessName:\s*["']/.test(resultsPage));
  for (const marker of RAW_ERROR_MARKERS) {
    assert.ok(!resultsPage.includes(marker), `Results page must not expose: ${marker}`);
  }

  const card = read("app/(site)/clasificados/comida-local/components/ComidaLocalListingCard.tsx");
  assert.ok(card.includes("Ver ficha"));
  assert.ok(card.includes("comidaLocalCustomerStyles"));

  const detailShell = read("app/(site)/clasificados/comida-local/components/ComidaLocalDetailShell.tsx");
  const detailPage = read("app/(site)/clasificados/comida-local/[slug]/page.tsx");
  const previewClient = read("app/(site)/clasificados/comida-local/preview/ComidaLocalPreviewClient.tsx");
  const application = read("app/(site)/publicar/comida-local/ComidaLocalApplicationClient.tsx");

  const publicCustomerCode = [resultsPage, card, detailShell, detailPage, previewClient].join("\n");
  for (const label of FORBIDDEN_RESTAURANT_LABELS) {
    assert.ok(!publicCustomerCode.includes(label), `Forbidden restaurant label: ${label}`);
  }
  for (const metric of FAKE_METRICS) {
    assert.ok(!publicCustomerCode.toLowerCase().includes(metric), `Fake metric: ${metric}`);
  }

  assert.ok(detailPage.includes("getPublishedComidaLocalListingBySlug"));
  assert.ok(detailPage.includes("notFound"));
  assert.ok(previewClient.includes("no publicada") || previewClient.includes("no está publicada"));
  assert.ok(!previewClient.includes("/api/clasificados/comida-local/publish"));
  assert.ok(!previewClient.includes("leonixAdId="));
  assert.ok(application.includes("postComidaLocalPublishApi") || application.includes("handlePublish"));

  const audit = read(FOOD_P1);
  assert.ok(audit.includes("FOOD-P1"));
  assert.ok(audit.includes("| Requirement | TRUE/FALSE | Evidence |"));

  const pkg = read("package.json");
  assert.ok(pkg.includes('"comida-local:food-p1-customer-polish-audit"'));

  for (const p of changedFiles()) {
    if (!isGateScopedChange(p)) continue;
    if (FORBIDDEN_PREFIXES.some((f) => p.startsWith(f))) {
      assert.fail(`Forbidden path changed: ${p}`);
    }
  }

  console.log("FOOD-P1 customer polish audit passed.");
}

run();
