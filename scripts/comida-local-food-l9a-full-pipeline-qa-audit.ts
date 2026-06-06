/**
 * Gate FOOD-L9A — Comida Local full pipeline visibility + publish QA static audit.
 * Run: npm run comida-local:food-l9a-full-pipeline-qa-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const FOOD_L9A = "app/lib/clasificados/comida-local/COMIDA_LOCAL_FOOD_L9A_FULL_PIPELINE_QA_AUDIT.md";

const PRIOR_AUDITS = [
  "app/lib/clasificados/comida-local/COMIDA_LOCAL_FOOD_L5B_PUBLISH_DB_AUDIT.md",
  "app/lib/clasificados/comida-local/COMIDA_LOCAL_FOOD_L5C_IMAGE_UPLOAD_AUDIT.md",
  "app/lib/clasificados/comida-local/COMIDA_LOCAL_FOOD_L5D_PACKAGE_PAYMENT_AUDIT.md",
  "app/lib/clasificados/comida-local/COMIDA_LOCAL_FOOD_L6_PUBLIC_RESULTS_AUDIT.md",
  "app/lib/clasificados/comida-local/COMIDA_LOCAL_FOOD_L7A_USER_DASHBOARD_AUDIT.md",
  "app/lib/clasificados/comida-local/COMIDA_LOCAL_FOOD_L7B_ADMIN_DASHBOARD_AUDIT.md",
  "app/lib/clasificados/comida-local/COMIDA_LOCAL_FOOD_L8A_ANALYTICS_EVENTS_AUDIT.md",
] as const;

const ROUTE_FILES = [
  "app/(site)/publicar/comida-local/page.tsx",
  "app/(site)/clasificados/comida-local/preview/page.tsx",
  "app/(site)/clasificados/comida-local/page.tsx",
  "app/(site)/clasificados/comida-local/[slug]/page.tsx",
] as const;

const PIPELINE_FILES = [
  "app/api/clasificados/comida-local/publish/route.ts",
  "app/api/clasificados/comida-local/draft-media-upload/route.ts",
  "app/lib/clasificados/comida-local/comidaLocalPublicQueries.ts",
  "app/(site)/clasificados/comida-local/components/ComidaLocalListingCard.tsx",
  "app/(site)/clasificados/comida-local/components/ComidaLocalDetailShell.tsx",
  "app/lib/clasificados/comida-local/comidaLocalDashboardQueries.ts",
  "app/lib/clasificados/comida-local/comidaLocalAdminQueries.ts",
  "app/lib/clasificados/comida-local/comidaLocalPackages.ts",
  "app/lib/clasificados/comida-local/comidaLocalAnalytics.ts",
  "app/admin/(dashboard)/workspace/clasificados/comida-local/page.tsx",
] as const;

const FAKE_METRICS = ["fake views", "fake clicks", "fake impressions", "demo analytics", "placeholder analytics"];
const FAKE_PAID_ASSIGNMENTS = [
  /payment_status\s*[:=]\s*["']paid["']/i,
  /payment_status\s*:\s*COMIDA_LOCAL_PAYMENT_STATUS\.PAID/i,
];

const FORBIDDEN_PREFIXES = [
  "app/(site)/publicar/restaurantes/",
  "app/(site)/clasificados/restaurantes/",
  "app/lib/clasificados/restaurantes/",
  "app/(site)/publicar/rentas/",
  "app/(site)/clasificados/rentas/",
  "app/(site)/clasificados/bienes-raices/",
  "app/(site)/clasificados/servicios/",
  "app/(site)/clasificados/en-venta/",
  "app/(site)/clasificados/autos/",
  "supabase/migrations/",
  "database/migrations/",
];

const ALLOWED_PREFIXES = [
  "app/lib/clasificados/comida-local/",
  "scripts/comida-local-",
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

function isGateScoped(p: string): boolean {
  return p.startsWith("app/lib/clasificados/comida-local/") || p.startsWith("scripts/comida-local-food-l9a");
}

function run() {
  assert.ok(exists(FOOD_L9A), `${FOOD_L9A} must exist`);

  for (const f of PRIOR_AUDITS) {
    assert.ok(exists(f), `Prior audit must exist: ${f}`);
  }

  for (const f of ROUTE_FILES) {
    assert.ok(exists(f), `Route file must exist: ${f}`);
  }

  for (const f of PIPELINE_FILES) {
    assert.ok(exists(f), `Pipeline file must exist: ${f}`);
  }

  const publish = read("app/api/clasificados/comida-local/publish/route.ts");
  assert.ok(publish.includes("comida_local_public_listings"));
  assert.ok(publish.includes("allocateNextComidaLocalLeonixAdId"));
  assert.ok(publish.includes("parseComidaLocalPublishRequest"));
  assert.ok(!/stripe|checkout/i.test(publish));

  const publicQueries = read("app/lib/clasificados/comida-local/comidaLocalPublicQueries.ts");
  assert.ok(publicQueries.includes('comida_local_public_listings'));
  assert.ok(publicQueries.includes('"published"') || publicQueries.includes("'published'"));

  const resultsPage = read("app/(site)/clasificados/comida-local/page.tsx");
  assert.ok(resultsPage.includes("listPublishedComidaLocalListings"));
  assert.ok(!/\[\s*\{[^}]*businessName:\s*["']/.test(resultsPage), "No inline demo listing array");

  const card = read("app/(site)/clasificados/comida-local/components/ComidaLocalListingCard.tsx");
  assert.ok(!/Reservar|Pedir ahora|Opiniones en Google|Menú completo/i.test(card));

  const packages = read("app/lib/clasificados/comida-local/comidaLocalPackages.ts");
  assert.ok(packages.includes("9900"));
  assert.ok(packages.includes("14900"));

  const analytics = read("app/lib/clasificados/comida-local/comidaLocalAnalytics.ts");
  assert.ok(analytics.includes("trackComidaLocalListingEvent"));

  const audit = read(FOOD_L9A);
  assert.ok(audit.includes("Screenshot capture checklist"));
  assert.ok(audit.includes("Restaurante regression"));

  const misAnunciosPath = "app/(site)/dashboard/mis-anuncios/page.tsx";
  if (exists(misAnunciosPath)) {
    const misAnuncios = read(misAnunciosPath);
    const wired = misAnuncios.includes("fetchOwnerComidaLocalListings");
    if (!wired) {
      assert.ok(
        audit.toLowerCase().includes("l7a regression") ||
          audit.toLowerCase().includes("dashboard wiring gap") ||
          audit.toLowerCase().includes("not wired"),
        "Audit must document user dashboard wiring gap when mis-anuncios lacks Comida Local fetch"
      );
    }
  }

  const comidaPublic = [resultsPage, card, read("app/(site)/clasificados/comida-local/[slug]/page.tsx")].join("\n");
  for (const label of FAKE_METRICS) {
    assert.ok(!comidaPublic.toLowerCase().includes(label.toLowerCase()), `No fake metric: ${label}`);
  }

  const publishRoute = read("app/api/clasificados/comida-local/publish/route.ts");
  const paymentHelper = read("app/lib/clasificados/comida-local/comidaLocalPaymentStatus.ts");
  const publishMapper = read("app/lib/clasificados/comida-local/comidaLocalPublicListingMapper.ts");
  const publishCode = [publishRoute, paymentHelper, publishMapper].join("\n");
  for (const pattern of FAKE_PAID_ASSIGNMENTS) {
    assert.ok(!pattern.test(publishCode), `No fake paid assignment in publish path: ${pattern}`);
  }

  const pkg = read("package.json");
  assert.ok(pkg.includes('"comida-local:food-l9a-full-pipeline-qa-audit"'));

  for (const p of changedFiles()) {
    if (p === "package.json") continue;
    if (!isGateScoped(p)) continue;
    if (FORBIDDEN_PREFIXES.some((f) => p.startsWith(f))) {
      assert.fail(`Forbidden path changed: ${p}`);
    }
    if (!ALLOWED_PREFIXES.some((a) => p === a || p.startsWith(a))) {
      assert.fail(`Gate-scoped file outside firewall: ${p}`);
    }
  }

  console.log("FOOD-L9A full pipeline QA audit passed.");
}

run();
