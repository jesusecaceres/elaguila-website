/**
 * Gate FOOD-P2 — Comida Local final customer flow lock + screenshot readiness static audit.
 * Run: npm run comida-local:food-p2-final-customer-flow-lock-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const FOOD_P2 = "app/lib/clasificados/comida-local/COMIDA_LOCAL_FOOD_P2_FINAL_CUSTOMER_FLOW_LOCK_AUDIT.md";
const FOOD_P1 = "app/lib/clasificados/comida-local/COMIDA_LOCAL_FOOD_P1_CUSTOMER_POLISH_AUDIT.md";

const ROUTES = [
  "app/(site)/publicar/comida-local/page.tsx",
  "app/(site)/publicar/comida-local/ComidaLocalApplicationClient.tsx",
  "app/(site)/clasificados/comida-local/preview/page.tsx",
  "app/(site)/clasificados/comida-local/page.tsx",
  "app/(site)/clasificados/comida-local/[slug]/page.tsx",
] as const;

const COMPONENTS = [
  "app/(site)/clasificados/comida-local/components/ComidaLocalListingCard.tsx",
  "app/(site)/clasificados/comida-local/components/ComidaLocalDetailShell.tsx",
  "app/(site)/clasificados/comida-local/components/comidaLocalCustomerStyles.ts",
] as const;

const FORBIDDEN_RESTAURANT = [
  "Reservar",
  "Pedir ahora",
  "Opiniones en Google",
  "Opiniones en Yelp",
  "Menú completo",
] as const;

const FAKE_METRICS = [
  "fake views",
  "fake clicks",
  "fake likes",
  "demo analytics",
  "placeholder analytics",
] as const;

const RAW_ERRORS = ["schema cache", "Could not find the table", "PGRST205"] as const;

const FORBIDDEN_PREFIXES = [
  "app/(site)/publicar/restaurantes/",
  "app/(site)/clasificados/restaurantes/",
  "app/lib/clasificados/restaurantes/",
  "app/admin/",
  "app/dashboard/",
  "supabase/migrations/",
];

const ALLOWED_PREFIXES = [
  "app/lib/clasificados/comida-local/",
  "app/(site)/clasificados/comida-local/",
  "app/(site)/publicar/comida-local/",
  "scripts/comida-local-food-p2",
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

function isComidaLocalGateChange(p: string): boolean {
  return ALLOWED_PREFIXES.some((a) => p === a || p.startsWith(a));
}

function run() {
  assert.ok(exists(FOOD_P2), `${FOOD_P2} must exist`);
  assert.ok(exists(FOOD_P1), `${FOOD_P1} must exist (prior FOOD-P1)`);

  for (const r of ROUTES) {
    assert.ok(exists(r), `Route/file must exist: ${r}`);
  }
  for (const c of COMPONENTS) {
    assert.ok(exists(c), `Component must exist: ${c}`);
  }

  const resultsPage = read("app/(site)/clasificados/comida-local/page.tsx");
  const card = read("app/(site)/clasificados/comida-local/components/ComidaLocalListingCard.tsx");
  const detailShell = read("app/(site)/clasificados/comida-local/components/ComidaLocalDetailShell.tsx");
  const detailPage = read("app/(site)/clasificados/comida-local/[slug]/page.tsx");
  const previewClient = read("app/(site)/clasificados/comida-local/preview/ComidaLocalPreviewClient.tsx");
  const application = read("app/(site)/publicar/comida-local/ComidaLocalApplicationClient.tsx");
  const publishClient = read("app/lib/clasificados/comida-local/comidaLocalPublishClient.ts");

  assert.ok(resultsPage.includes("Publicar tu puesto"));
  assert.ok(resultsPage.includes("/publicar/comida-local"));
  assert.ok(resultsPage.includes("listPublishedComidaLocalListings"));
  assert.ok(!/\[\s*\{[^}]*businessName:\s*["']/.test(resultsPage));
  for (const e of RAW_ERRORS) {
    assert.ok(!resultsPage.includes(e), `Results must not expose: ${e}`);
  }

  assert.ok(card.includes("Ver ficha"));
  assert.ok(detailPage.includes("getPublishedComidaLocalListingBySlug"));
  assert.ok(detailPage.includes("notFound"));
  assert.ok(!detailPage.includes("Vista previa"));
  assert.ok(!detailPage.includes("no publicada"));

  assert.ok(previewClient.includes("Vista previa"));
  assert.ok(!previewClient.includes("/api/clasificados/comida-local/publish"));
  assert.ok(!previewClient.includes("leonixAdId="));
  assert.ok(previewClient.includes("ComidaLocalDetailShell"));

  assert.ok(application.includes("postComidaLocalPublishApi"));
  assert.ok(application.includes("handlePublish"));
  assert.ok(publishClient.includes("/api/clasificados/comida-local/publish"));

  const publicCode = [resultsPage, card, detailShell, detailPage, previewClient].join("\n");
  for (const label of FORBIDDEN_RESTAURANT) {
    assert.ok(!publicCode.includes(label), `Forbidden restaurant label: ${label}`);
  }
  for (const m of FAKE_METRICS) {
    assert.ok(!publicCode.toLowerCase().includes(m), `Fake metric: ${m}`);
  }

  const audit = read(FOOD_P2);
  assert.ok(audit.includes("FOOD-P2"));
  assert.ok(audit.includes("Screenshot checklist"));
  assert.ok(audit.includes("| Requirement | TRUE/FALSE | Evidence |"));

  const pkg = read("package.json");
  assert.ok(pkg.includes('"comida-local:food-p2-final-customer-flow-lock-audit"'));

  for (const p of changedFiles()) {
    if (!isComidaLocalGateChange(p)) continue;
    if (FORBIDDEN_PREFIXES.some((f) => p.startsWith(f))) {
      assert.fail(`Forbidden path changed by gate: ${p}`);
    }
  }

  console.log("FOOD-P2 final customer flow lock audit passed.");
}

run();
