/**
 * Gate REST-ANALYTICS1 — Restaurante public CTA tracking + seller analytics truth audit.
 * Run: npm run restaurantes:analytics1-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const AUDIT = "app/lib/clasificados/restaurantes/RESTAURANTES_ANALYTICS1_AUDIT.md";

const REQUIRED = [
  AUDIT,
  "app/(site)/clasificados/restaurantes/lib/restaurantesCtaTracking.ts",
  "app/(site)/clasificados/restaurantes/lib/recordRestaurantesGlobalAnalytics.ts",
  "app/(site)/clasificados/restaurantes/lib/restaurantesAnalyticsIdentity.ts",
  "app/(site)/clasificados/restaurantes/shell/RestaurantContactHub.tsx",
  "app/(site)/clasificados/restaurantes/shell/RestauranteProfileHeader.tsx",
  "app/(site)/clasificados/restaurantes/components/RestauranteProfileViewAnalytics.tsx",
  "app/lib/clasificados/restaurantes/restaurantesSellerAnalytics.ts",
] as const;

const TRACKING_MARKERS = [
  "trackRestaurantesListingCta",
  "recordRestaurantesGlobalAnalyticsEvent",
  "restaurantesGlobalLikeRecorder",
  "restaurantesGlobalSaveRecorder",
  "restaurantesGlobalShareRecorder",
  "trackRestaurantesPublicProfileView",
];

const IDENTITY_MARKERS = [
  "restaurantes_public_listings",
  '"restaurantes"',
  "RESTAURANTES_ANALYTICS_SOURCE_TABLE",
  "RESTAURANTES_ANALYTICS_CATEGORY",
];

const FAKE_METRIC_STRINGS = [
  "fake views",
  "fake clicks",
  "demo analytics",
  "placeholder analytics",
  "Math.random",
];

const FORBIDDEN_PREFIXES = [
  "app/(site)/publicar/restaurantes/",
  "app/(site)/publicar/comida-local/",
  "app/(site)/clasificados/comida-local/",
  "app/lib/clasificados/comida-local/",
  "app/(site)/clasificados/en-venta/",
  "app/lib/clasificados/en-venta/",
  "app/(site)/clasificados/bienes-raices/",
  "app/(site)/clasificados/servicios/",
  "app/(site)/clasificados/autos/",
  "app/(site)/clasificados/rentas/",
  "app/admin/",
  "supabase/migrations/",
  "database/migrations/",
];

const ALLOWED_PREFIXES = [
  "app/(site)/clasificados/restaurantes/",
  "app/lib/clasificados/restaurantes/",
  "app/lib/analytics/",
  "app/lib/listingAnalyticsEventTypes.ts",
  "app/components/clasificados/analytics/",
  "scripts/restaurantes-analytics1-audit.ts",
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
      .filter(Boolean);
  } catch {
    tracked = [];
  }
  try {
    untracked = execSync("git ls-files --others --exclude-standard", { cwd: ROOT, encoding: "utf8" })
      .split(/\r?\n/)
      .filter(Boolean);
  } catch {
    untracked = [];
  }
  return [...new Set([...tracked, ...untracked])];
}

function isGateScopedChange(p: string): boolean {
  const norm = p.replace(/\\/g, "/");
  return ALLOWED_PREFIXES.some((a) => norm === a || norm.startsWith(a));
}

function main() {
  console.log("REST-ANALYTICS1 audit…");

  for (const f of REQUIRED) {
    assert.ok(fs.existsSync(path.join(ROOT, f.replace(/\//g, path.sep))), `missing required file: ${f}`);
  }

  const pkg = read("package.json");
  assert.match(pkg, /restaurantes:analytics1-audit/, "package.json missing restaurantes:analytics1-audit script");

  const hub = read("app/(site)/clasificados/restaurantes/shell/RestaurantContactHub.tsx");
  const ctaTracking = read("app/(site)/clasificados/restaurantes/lib/restaurantesCtaTracking.ts");
  const global = read("app/(site)/clasificados/restaurantes/lib/recordRestaurantesGlobalAnalytics.ts");
  const header = read("app/(site)/clasificados/restaurantes/shell/RestauranteProfileHeader.tsx");

  for (const m of TRACKING_MARKERS) {
    assert.ok(
      hub.includes(m) || ctaTracking.includes(m) || header.includes(m) || global.includes(m),
      `expected tracking marker: ${m}`,
    );
  }

  for (const m of IDENTITY_MARKERS) {
    assert.ok(global.includes(m) || ctaTracking.includes(m), `expected identity marker: ${m}`);
  }

  assert.match(global, /social:\s*"cta_click"/, "social CTA must map to cta_click");
  assert.match(global, /review:\s*"cta_click"/, "review CTA must map to cta_click");
  assert.match(hub, /openSocial\(s\.id/, "social chips must pass platform id for analytics metadata");

  assert.match(header, /allowEngagement/, "preview must gate engagement on published source UUID");
  assert.doesNotMatch(header, /Math\.random/, "no fake counters in header");

  for (const fake of FAKE_METRIC_STRINGS) {
    assert.doesNotMatch(hub, new RegExp(fake, "i"), `fake metric string in hub: ${fake}`);
  }

  const changed = changedFiles();
  for (const f of changed) {
    if (!isGateScopedChange(f)) continue;
    const norm = f.replace(/\\/g, "/");
    if (FORBIDDEN_PREFIXES.some((p) => norm.startsWith(p))) {
      assert.fail(`gate-owned change under forbidden path: ${f}`);
    }
  }

  assert.doesNotMatch(read(AUDIT), /FAIL/, "audit doc must not contain FAIL status rows");

  console.log("REST-ANALYTICS1 audit PASS");
}

main();
