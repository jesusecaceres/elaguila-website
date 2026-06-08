/**
 * Gate HUB-CTA1 — Comida Local CTA on Negocios Locales hub static audit.
 * Run: npm run comida-local:hub-cta1-negocios-locales-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const HUB_PAGE = "app/(site)/negocios-locales/page.tsx";
const AUDIT = "app/lib/clasificados/comida-local/COMIDA_LOCAL_HUB_CTA1_NEGOCIOS_LOCALES_AUDIT.md";

const FORBIDDEN_PREFIXES = [
  "app/(site)/publicar/comida-local/",
  "app/(site)/clasificados/comida-local/",
  "app/(site)/publicar/restaurantes/",
  "app/(site)/clasificados/restaurantes/",
  "app/lib/clasificados/restaurantes/",
  "app/api/",
  "supabase/migrations/",
  "database/migrations/",
  "app/(site)/dashboard/",
  "app/admin/",
];

const ALLOWED_PREFIXES = [
  "app/(site)/negocios-locales/",
  "app/lib/clasificados/comida-local/COMIDA_LOCAL_HUB_CTA1_NEGOCIOS_LOCALES_AUDIT.md",
  "scripts/comida-local-hub-cta1-negocios-locales-audit.ts",
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
  assert.ok(exists(HUB_PAGE), `${HUB_PAGE} must exist`);

  const hub = read(HUB_PAGE);
  assert.ok(hub.includes("Comida Local"), "Hub must mention Comida Local");
  assert.ok(hub.includes("/clasificados/comida-local"), "Hub must link to results");
  assert.ok(hub.includes("/publicar/comida-local"), "Hub must link to publish");
  assert.ok(hub.includes("comida-local"), "Hub must use comida-local lane key");
  assert.ok(
    hub.includes("Puestos, pop-ups, comida casera y vendedores móviles"),
    "Hub must include Spanish description"
  );
  assert.ok(hub.includes("Publicar tu puesto"), "Hub must include Spanish publish CTA");

  const audit = read(AUDIT);
  assert.ok(audit.includes("HUB-CTA1"));
  assert.ok(audit.includes("| Requirement | TRUE/FALSE | Evidence |"));

  const pkg = read("package.json");
  assert.ok(pkg.includes('"comida-local:hub-cta1-negocios-locales-audit"'));

  for (const p of changedFiles()) {
    if (!isGateScopedChange(p)) continue;
    if (FORBIDDEN_PREFIXES.some((f) => p.startsWith(f))) {
      assert.fail(`Forbidden path changed: ${p}`);
    }
    if (p.toLowerCase().includes("stripe")) {
      assert.fail(`Stripe path changed: ${p}`);
    }
  }

  console.log("HUB-CTA1 Negocios Locales audit passed.");
}

run();
