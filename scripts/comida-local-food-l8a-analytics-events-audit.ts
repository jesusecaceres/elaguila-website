/**
 * Gate FOOD-L8A — Comida Local analytics events static audit.
 * Run: npm run comida-local:food-l8a-analytics-events-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const FOOD_L8A = "app/lib/clasificados/comida-local/COMIDA_LOCAL_FOOD_L8A_ANALYTICS_EVENTS_AUDIT.md";

const REQUIRED = [
  FOOD_L8A,
  "app/lib/clasificados/comida-local/comidaLocalAnalytics.ts",
  "app/(site)/clasificados/comida-local/components/ComidaLocalListingCard.tsx",
  "app/(site)/clasificados/comida-local/components/ComidaLocalContactActions.tsx",
  "app/(site)/clasificados/comida-local/components/ComidaLocalPublicDetailClient.tsx",
] as const;

const EVENT_TYPES = [
  "profile_view",
  "result_card_click",
  "call_click",
  "sms_click",
  "whatsapp_click",
  "instagram_click",
  "facebook_click",
  "tiktok_click",
  "location_click",
] as const;

const FAKE_METRIC_STRINGS = [
  "fake views",
  "fake clicks",
  "fake impressions",
  "demo analytics",
  "placeholder analytics",
  "impresiones",
  "visitas",
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
  "app/(site)/dashboard/",
  "app/admin/",
  "supabase/migrations/",
  "database/migrations/",
];

const ALLOWED_PREFIXES = [
  "app/lib/clasificados/comida-local/",
  "app/(site)/clasificados/comida-local/",
  "app/lib/analytics/",
  "app/api/analytics/",
  "scripts/comida-local-",
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

function isGateScopedPath(p: string): boolean {
  return (
    p.startsWith("app/lib/clasificados/comida-local/") ||
    p.startsWith("app/(site)/clasificados/comida-local/") ||
    p.startsWith("app/lib/analytics/") ||
    p.startsWith("app/api/analytics/") ||
    p.startsWith("scripts/comida-local-food-l8a")
  );
}

function isAllowed(p: string): boolean {
  return ALLOWED_PREFIXES.some((a) => p === a || p.startsWith(a));
}

function run() {
  for (const f of REQUIRED) {
    assert.ok(fs.existsSync(path.join(ROOT, f)), `${f} must exist`);
  }

  const analytics = read("app/lib/clasificados/comida-local/comidaLocalAnalytics.ts");
  assert.ok(analytics.includes("comida-local"));
  assert.ok(analytics.includes("comida_local_public_listings"));
  assert.ok(analytics.includes("trackComidaLocalListingEvent"));
  assert.ok(analytics.includes("recordAnalyticsEvent"));

  for (const evt of EVENT_TYPES) {
    assert.ok(analytics.includes(evt), `Analytics helper must allowlist ${evt}`);
  }

  const card = read("app/(site)/clasificados/comida-local/components/ComidaLocalListingCard.tsx");
  assert.ok(card.includes("trackComidaLocalListingEvent"));
  assert.ok(card.includes("result_card_click"));

  const contact = read("app/(site)/clasificados/comida-local/components/ComidaLocalContactActions.tsx");
  assert.ok(contact.includes("analyticsContext"));

  const detail = read("app/(site)/clasificados/comida-local/components/ComidaLocalPublicDetailClient.tsx");
  assert.ok(detail.includes("trackComidaLocalProfileViewOnce"));

  const preview = read("app/(site)/clasificados/comida-local/preview/ComidaLocalPreviewClient.tsx");
  assert.ok(!preview.includes("trackComidaLocal"), "Preview must not track real listing analytics");

  const comidaOnly = [analytics, card, contact, detail].join("\n");
  assert.ok(!/stripe|checkout\.sessions/i.test(comidaOnly));
  assert.ok(!/localStorage\.setItem\([^)]*analytics/i.test(comidaOnly));

  for (const label of FAKE_METRIC_STRINGS) {
    assert.ok(!comidaOnly.toLowerCase().includes(label.toLowerCase()), `No fake metric: ${label}`);
  }

  const identity = read("app/lib/analytics/listingAnalyticsIdentity.ts");
  assert.ok(identity.includes("comida_local_public_listings"));

  const pkg = read("package.json");
  assert.ok(pkg.includes('"comida-local:food-l8a-analytics-events-audit"'));

  for (const p of changedFiles()) {
    if (p === "package.json") continue;
    if (!isGateScopedPath(p)) continue;
    if (FORBIDDEN_PREFIXES.some((f) => p.startsWith(f))) {
      assert.fail(`Forbidden path changed: ${p}`);
    }
    if (!isAllowed(p)) {
      assert.fail(`Gate-scoped file outside firewall: ${p}`);
    }
  }

  console.log("FOOD-L8A analytics events audit passed.");
}

run();
