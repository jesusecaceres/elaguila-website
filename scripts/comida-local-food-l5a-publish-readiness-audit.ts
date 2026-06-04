/**
 * Gate FOOD-L5A — Comida Local publish readiness static audit.
 * Run: npm run comida-local:food-l5a-publish-readiness-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const FOOD_L5A = "app/lib/clasificados/comida-local/COMIDA_LOCAL_FOOD_L5A_PUBLISH_READINESS_AUDIT.md";

const PRIOR_AUDITS = [
  "app/lib/clasificados/comida-local/COMIDA_LOCAL_FOOD_L1_ARCHITECTURE_AUDIT.md",
  "app/lib/clasificados/comida-local/COMIDA_LOCAL_FOOD_L2_SCAFFOLD_AUDIT.md",
  "app/lib/clasificados/comida-local/COMIDA_LOCAL_FOOD_L3_FIELD_DRAFT_AUDIT.md",
  "app/lib/clasificados/comida-local/COMIDA_LOCAL_FOOD_L4_PREVIEW_DETAIL_AUDIT.md",
] as const;

const REQUIRED_SECTIONS = [
  "Recommended DB strategy",
  "Proposed table",
  "Publish payload contract",
  "Leonix ID plan",
  "Package/pricing plan",
  "Image/upload plan",
  "Dashboard readiness",
  "Admin readiness",
  "Search/results readiness",
  "Security/validation guardrails",
  "FOOD-L5B",
  "FOOD-L5C",
  "FOOD-L5D",
  "FOOD-L6",
  "FOOD-L7",
  "FOOD-L8",
  "FOOD-L9",
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
  "app/api/",
  "app/(site)/dashboard/",
  "app/admin/",
  "supabase/migrations/",
];

const ALLOWED_PREFIXES = [
  "app/lib/clasificados/comida-local/",
  "scripts/comida-local-food-l5a-publish-readiness-audit.ts",
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

function run() {
  for (const f of [...PRIOR_AUDITS, FOOD_L5A]) {
    assert.ok(fs.existsSync(path.join(ROOT, f)), `${f} must exist`);
  }

  const md = read(FOOD_L5A);
  assert.ok(md.includes("Gate FOOD-L5A"), "FOOD-L5A title");
  assert.ok(md.includes("| Requirement | TRUE/FALSE | Evidence |"), "TRUE/FALSE table");
  assert.ok(md.includes("comida_local_public_listings"), "Recommended table name");

  for (const section of REQUIRED_SECTIONS) {
    assert.ok(md.includes(section), `Missing section/keyword: ${section}`);
  }

  assert.ok(
    !fs.existsSync(path.join(ROOT, "app/api/clasificados/comida-local/publish/route.ts")),
    "No comida-local publish API yet"
  );

  const migrationsDir = path.join(ROOT, "supabase", "migrations");
  if (fs.existsSync(migrationsDir)) {
    const migrationFiles = fs.readdirSync(migrationsDir);
    const comidaMigration = migrationFiles.some((f) => /comida_local/i.test(f));
    assert.ok(!comidaMigration, "No comida_local migration should exist in FOOD-L5A");
  }

  const pkg = read("package.json");
  assert.ok(pkg.includes('"comida-local:food-l5a-publish-readiness-audit"'), "package script");

  function isAllowed(p: string): boolean {
    return ALLOWED_PREFIXES.some((a) => p === a || p.startsWith(a));
  }

  /** Only assert scope for files this gate may have touched — ignore unrelated dirty worktree files. */
  for (const p of changedFiles()) {
    const gateScope =
      p.startsWith("app/lib/clasificados/comida-local/") ||
      p.startsWith("scripts/comida-local-") ||
      p === "package.json";
    if (!gateScope) continue;
    assert.ok(isAllowed(p), `FOOD-L5A file outside allowed paths: ${p}`);
    if (FORBIDDEN_PREFIXES.some((fp) => p.startsWith(fp))) {
      assert.fail(`Forbidden path modified by FOOD-L5A scope: ${p}`);
    }
  }

  console.log("comida-local-food-l5a-publish-readiness-audit: OK");
}

run();
