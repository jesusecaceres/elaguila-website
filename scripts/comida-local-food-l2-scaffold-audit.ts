/**
 * Gate FOOD-L2 — Comida Local scaffold static audit.
 * Run: npm run comida-local:food-l2-scaffold-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const FOOD_L1_AUDIT = "app/lib/clasificados/comida-local/COMIDA_LOCAL_FOOD_L1_ARCHITECTURE_AUDIT.md";
const FOOD_L2_AUDIT = "app/lib/clasificados/comida-local/COMIDA_LOCAL_FOOD_L2_SCAFFOLD_AUDIT.md";

const LIB_FILES = [
  "app/lib/clasificados/comida-local/comidaLocalTypes.ts",
  "app/lib/clasificados/comida-local/comidaLocalConstants.ts",
  "app/lib/clasificados/comida-local/createEmptyComidaLocalDraft.ts",
  "app/lib/clasificados/comida-local/comidaLocalFieldCopy.ts",
  "app/lib/clasificados/comida-local/comidaLocalValidation.ts",
  "app/lib/clasificados/comida-local/comidaLocalFormatting.ts",
] as const;

const ROUTE_FILES = [
  "app/(site)/publicar/comida-local/page.tsx",
  "app/(site)/publicar/comida-local/ComidaLocalApplicationClient.tsx",
] as const;

const REQUIRED_LABELS = [
  "Comida Local",
  "Nombre del puesto",
  "Tipo de comida",
  "Ciudad / zona principal",
  "Qué vendes",
  "Teléfono",
  "WhatsApp",
  "Instagram",
  "Facebook",
  "TikTok",
  "Ubicación actual",
  "URL de ubicación actual",
  "Disponibilidad",
  "Opciones de servicio",
  "Métodos de pago",
  "Rango de precio",
  "Idiomas",
  "Foto principal",
] as const;

const FORBIDDEN_RESTAURANT_LABELS = [
  "Reservar",
  "Pedir ahora",
  "Opiniones en Google",
  "Opiniones en Yelp",
  "Amenidades",
  "Catering y eventos",
  "Menú completo",
] as const;

const ALLOWED_PREFIXES = [
  "app/lib/clasificados/comida-local/",
  "app/(site)/publicar/comida-local/",
  "scripts/comida-local-food-l2-scaffold-audit.ts",
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

function isAllowedPath(p: string): boolean {
  return ALLOWED_PREFIXES.some((prefix) => p === prefix || p.startsWith(prefix));
}

function run() {
  assert.ok(fs.existsSync(path.join(ROOT, FOOD_L1_AUDIT)), `${FOOD_L1_AUDIT} must exist`);
  assert.ok(fs.existsSync(path.join(ROOT, FOOD_L2_AUDIT)), `${FOOD_L2_AUDIT} must exist`);

  const l2 = read(FOOD_L2_AUDIT);
  assert.ok(l2.includes("Gate FOOD-L2"), "FOOD-L2 audit title");
  assert.ok(l2.includes("FOOD-L1 decisions used"), "FOOD-L1 decisions section");
  assert.ok(l2.includes("| Requirement | TRUE/FALSE | Evidence |"), "TRUE/FALSE table");

  for (const f of LIB_FILES) {
    assert.ok(fs.existsSync(path.join(ROOT, f)), `Missing lib file: ${f}`);
  }
  for (const f of ROUTE_FILES) {
    assert.ok(fs.existsSync(path.join(ROOT, f)), `Missing route file: ${f}`);
  }

  const fieldCopy = read("app/lib/clasificados/comida-local/comidaLocalFieldCopy.ts");
  const client = read("app/(site)/publicar/comida-local/ComidaLocalApplicationClient.tsx");
  const labelSources = `${fieldCopy}\n${client}`;

  for (const label of REQUIRED_LABELS) {
    assert.ok(labelSources.includes(label), `Missing label: ${label}`);
  }

  const scaffoldOnly = `${client}\n${read("app/lib/clasificados/comida-local/comidaLocalConstants.ts")}`;
  for (const bad of FORBIDDEN_RESTAURANT_LABELS) {
    assert.ok(!scaffoldOnly.includes(bad), `Forbidden restaurant label in scaffold: ${bad}`);
  }

  const emptyDraft = read("app/lib/clasificados/comida-local/createEmptyComidaLocalDraft.ts");
  assert.ok(emptyDraft.includes('businessName: ""'), "Empty businessName");
  assert.ok(!emptyDraft.includes("placeholder.com"), "No fake URLs in empty draft");

  const formatting = read("app/lib/clasificados/comida-local/comidaLocalFormatting.ts");
  assert.ok(formatting.includes("formatComidaLocalPhoneInput"), "Phone formatter");
  assert.ok(formatting.includes("buildComidaLocalWhatsAppHref"), "WhatsApp href builder");
  assert.ok(formatting.includes("normalizeComidaLocalSocialInput"), "Social normalizer");

  const validation = read("app/lib/clasificados/comida-local/comidaLocalValidation.ts");
  assert.ok(validation.includes("validateComidaLocalDraftForPreview"), "Preview validation");
  assert.ok(validation.includes("validateComidaLocalDraftForFuturePublish"), "Future publish validation");

  const page = read("app/(site)/publicar/comida-local/page.tsx");
  assert.ok(page.includes("/publicar/comida-local"), "Canonical route in page");

  assert.ok(
    !fs.existsSync(path.join(ROOT, "app/api/clasificados/comida-local/publish/route.ts")),
    "No comida-local publish API"
  );

  const pkg = read("package.json");
  assert.ok(
    pkg.includes('"comida-local:food-l2-scaffold-audit"'),
    "package.json audit script"
  );

  const changed = changedFiles();
  for (const p of changed) {
    if (p.startsWith("app/(site)/publicar/restaurantes/")) {
      assert.fail(`Restaurante application modified: ${p}`);
    }
    if (p.startsWith("app/api/clasificados/comida-local/")) {
      assert.fail(`Publish API created: ${p}`);
    }
    if (p.startsWith("supabase/migrations/")) {
      assert.fail(`Migration created: ${p}`);
    }
    assert.ok(isAllowedPath(p), `Changed file outside FOOD-L2 scope: ${p}`);
  }

  console.log("comida-local-food-l2-scaffold-audit: OK");
}

run();
