/**
 * Gate REST-OFFERS-UPSELL1 — Restaurante final review Ofertas upsell audit.
 * Run: npm run restaurantes:offers-upsell1-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const AUDIT = "app/lib/clasificados/restaurantes/RESTAURANTES_OFFERS_UPSELL1_AUDIT.md";
const CARD = "app/lib/clasificados/restaurantes/RestauranteOfertasLocalesUpsellCard.tsx";
const COPY = "app/lib/clasificados/restaurantes/restaurantesOffersUpsellCopy.ts";
const PREVIEW = "app/(site)/clasificados/restaurantes/preview/RestaurantePreviewClient.tsx";
const STRIP = "app/(site)/clasificados/restaurantes/shell/RestauranteOffersPreviewStrip.tsx";

const FORBIDDEN_PREFIXES = [
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
];

const ALLOWED_PREFIXES = [
  "app/(site)/publicar/restaurantes/",
  "app/(site)/clasificados/restaurantes/",
  "app/lib/clasificados/restaurantes/",
  "scripts/restaurantes-offers-upsell1-audit.ts",
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
  console.log("REST-OFFERS-UPSELL1 audit…");

  for (const f of [AUDIT, CARD, COPY, PREVIEW]) {
    assert.ok(fs.existsSync(path.join(ROOT, f.replace(/\//g, path.sep))), `missing: ${f}`);
  }

  const audit = read(AUDIT);
  const card = read(CARD);
  const copy = read(COPY);
  const preview = read(PREVIEW);
  const strip = fs.existsSync(path.join(ROOT, STRIP.replace(/\//g, path.sep))) ? read(STRIP) : "";
  const pkg = read("package.json");

  assert.match(audit, /\$399/, "audit documents $399");
  assert.match(audit, /\$199/, "audit documents $199 standalone context");
  assert.match(audit, /\$499/, "audit documents $499 combo");
  assert.match(audit, /\$99/, "audit documents $99 savings");
  assert.match(audit, /no fake coupon/i, "audit documents no fake coupons");
  assert.match(audit, /no payment behavior changed/i, "audit documents no payment change");

  assert.match(preview, /RestauranteOfertasLocalesUpsellCard/, "preview wires upsell card");
  assert.match(copy, /\/publicar\/ofertas-locales/, "CTA route in copy helper");
  assert.match(card, /restauranteOfertasLocalesPublishHref/, "card uses publish href helper");

  assert.doesNotMatch(card, /fake coupon|cupones activos|ofertas activas|\d+ cupones/i, "no fake coupon counts");
  assert.doesNotMatch(preview, /fake coupon|cupones activos|\d+ ofertas/i, "preview has no fake counts");

  assert.match(strip, /if \(!offers\.length\) return null/, "public strip hides without offers");

  assert.match(pkg, /restaurantes:offers-upsell1-audit/, "package script");

  for (const f of changedFiles()) {
    if (!isGateScopedChange(f)) continue;
    const norm = f.replace(/\\/g, "/");
    if (FORBIDDEN_PREFIXES.some((p) => norm.startsWith(p))) {
      assert.fail(`gate-owned forbidden path: ${f}`);
    }
  }

  console.log("REST-OFFERS-UPSELL1 audit PASS");
}

main();
