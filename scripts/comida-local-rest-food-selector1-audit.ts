/**
 * Gate REST-FOOD-SELECTOR1 — Restaurantes publish selector static audit.
 * Run: npm run comida-local:rest-food-selector1-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const SELECTOR = "app/(site)/clasificados/publicar/restaurantes/page.tsx";
const HUB = "app/(site)/negocios-locales/page.tsx";
const AUDIT = "app/lib/clasificados/comida-local/COMIDA_LOCAL_REST_FOOD_SELECTOR1_AUDIT.md";
const BR_REF = "app/(site)/clasificados/publicar/bienes-raices/page.tsx";

const FORBIDDEN_PREFIXES = [
  "app/(site)/publicar/restaurantes/",
  "app/(site)/publicar/comida-local/",
  "app/(site)/clasificados/comida-local/",
  "app/(site)/clasificados/restaurantes/",
  "app/lib/clasificados/restaurantes/",
  "app/api/",
  "supabase/migrations/",
  "database/migrations/",
  "app/(site)/dashboard/",
  "app/admin/",
];

const ALLOWED_PREFIXES = [
  "app/(site)/clasificados/publicar/restaurantes/",
  "app/(site)/negocios-locales/",
  "app/lib/clasificados/comida-local/COMIDA_LOCAL_REST_FOOD_SELECTOR1_AUDIT.md",
  "scripts/comida-local-rest-food-selector1-audit.ts",
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
  assert.ok(exists(AUDIT), `${AUDIT} must exist`);
  assert.ok(exists(BR_REF), `${BR_REF} reference must exist`);
  assert.ok(exists(SELECTOR), `${SELECTOR} must exist`);
  assert.ok(exists(HUB), `${HUB} must exist`);

  const selector = read(SELECTOR);
  assert.ok(selector.includes("Restaurante establecido"));
  assert.ok(selector.includes("/publicar/restaurantes"));
  assert.ok(selector.includes("Comida Local"));
  assert.ok(selector.includes("/publicar/comida-local"));
  assert.ok(selector.includes("Publicar en Restaurantes"));
  assert.ok(selector.includes("max-w-lg"), "Selector should match BR max-width pattern");

  const hub = read(HUB);
  assert.ok(hub.includes("/clasificados/publicar/restaurantes"), "Hub Restaurantes publish → selector");
  assert.ok(hub.includes("/publicar/comida-local"), "Comida Local hub card preserved");

  const audit = read(AUDIT);
  assert.ok(audit.includes("REST-FOOD-SELECTOR1"));
  assert.ok(audit.includes("No visual polish pass was started"));
  assert.ok(audit.includes("| Requirement | TRUE/FALSE | Evidence |"));

  const pkg = read("package.json");
  assert.ok(pkg.includes('"comida-local:rest-food-selector1-audit"'));

  for (const p of changedFiles()) {
    if (!isGateScopedChange(p)) continue;
    if (FORBIDDEN_PREFIXES.some((f) => p.startsWith(f))) {
      assert.fail(`Forbidden path changed: ${p}`);
    }
    if (p.toLowerCase().includes("stripe")) {
      assert.fail(`Stripe path changed: ${p}`);
    }
  }

  console.log("REST-FOOD-SELECTOR1 audit passed.");
}

run();
