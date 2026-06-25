/**
 * Gate REST-OFFERS1 — Restaurante + Ofertas Locales combo bridge audit.
 * Run: npm run restaurantes:offers1-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const AUDIT = "app/lib/clasificados/restaurantes/RESTAURANTES_OFFERS1_AUDIT.md";
const STRIP = "app/(site)/clasificados/restaurantes/shell/RestauranteOffersPreviewStrip.tsx";
const QUERY = "app/lib/clasificados/restaurantes/restaurantesLinkedOffersQuery.ts";
const PRICING = "app/lib/clasificados/restaurantes/restaurantesOffersComboPricing.ts";

const FORBIDDEN_PREFIXES = [
  "app/(site)/publicar/restaurantes/",
  "app/(site)/publicar/comida-local/",
  "app/(site)/clasificados/comida-local/",
  "app/lib/clasificados/comida-local/",
  "app/(site)/clasificados/en-venta/",
  "app/lib/clasificados/en-venta/",
  "app/(site)/clasificados/servicios/",
  "app/(site)/clasificados/autos/",
  "app/(site)/clasificados/rentas/",
  "app/(site)/clasificados/bienes-raices/",
  "supabase/migrations/",
  "database/migrations/",
  "app/(site)/dashboard/",
  "app/admin/",
];

const ALLOWED_PREFIXES = [
  "app/(site)/clasificados/restaurantes/",
  "app/lib/clasificados/restaurantes/",
  "scripts/restaurantes-offers1-audit.ts",
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
  console.log("REST-OFFERS1 audit…");

  assert.ok(fs.existsSync(path.join(ROOT, AUDIT.replace(/\//g, path.sep))), "audit file missing");
  assert.ok(fs.existsSync(path.join(ROOT, STRIP.replace(/\//g, path.sep))), "preview strip missing");
  assert.ok(fs.existsSync(path.join(ROOT, QUERY.replace(/\//g, path.sep))), "linked offers query missing");
  assert.ok(fs.existsSync(path.join(ROOT, PRICING.replace(/\//g, path.sep))), "pricing doc missing");

  const audit = read(AUDIT);
  const strip = read(STRIP);
  const query = read(QUERY);
  const pricing = read(PRICING);
  const pkg = read("package.json");

  assert.match(audit, /\$399/, "audit must document $399 Restaurante Premium");
  assert.match(audit, /\$199/, "audit must document $199 Ofertas standalone");
  assert.match(audit, /\$499/, "audit must document $499 combo");
  assert.match(audit, /no fake offer/i, "audit must document no fake offers");
  assert.match(audit, /no payment behavior changed/i, "audit must document no payment changes");

  assert.match(pricing, /399/, "pricing constants include 399");
  assert.match(pricing, /199/, "pricing constants include 199");
  assert.match(pricing, /499/, "pricing constants include 499");

  assert.match(strip, /if \(!offers\.length\) return null/, "strip hides without offers");
  assert.doesNotMatch(strip, /placeholder|coming soon|fake|demo coupon/i, "no fake offer UI");

  assert.match(query, /linkedRestaurantePublicListingId/, "explicit link key only");
  assert.doesNotMatch(query, /business_name|owner_id.*restaurant/i, "no fuzzy owner/name link");

  assert.match(pkg, /restaurantes:offers1-audit/, "package script exists");

  for (const f of changedFiles()) {
    if (!isGateScopedChange(f)) continue;
    const norm = f.replace(/\\/g, "/");
    if (FORBIDDEN_PREFIXES.some((p) => norm.startsWith(p))) {
      assert.fail(`gate-owned change under forbidden path: ${f}`);
    }
  }

  assert.doesNotMatch(audit, /\bFAIL\b/, "audit must not contain FAIL status");

  console.log("REST-OFFERS1 audit PASS");
}

main();
