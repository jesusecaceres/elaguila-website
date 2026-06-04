/**
 * Gate FOOD-L3 — Comida Local field UX + draft persistence audit.
 * Run: npm run comida-local:food-l3-field-draft-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const FOOD_L1 = "app/lib/clasificados/comida-local/COMIDA_LOCAL_FOOD_L1_ARCHITECTURE_AUDIT.md";
const FOOD_L2 = "app/lib/clasificados/comida-local/COMIDA_LOCAL_FOOD_L2_SCAFFOLD_AUDIT.md";
const FOOD_L3 = "app/lib/clasificados/comida-local/COMIDA_LOCAL_FOOD_L3_FIELD_DRAFT_AUDIT.md";

const PERSISTENCE_FILES = [
  "app/lib/clasificados/comida-local/comidaLocalDraftPersistence.ts",
  "app/lib/clasificados/comida-local/useComidaLocalDraft.ts",
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

const FORBIDDEN_RESTAURANT = [
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
  "scripts/comida-local-food-l3-field-draft-audit.ts",
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
  for (const f of [FOOD_L1, FOOD_L2, FOOD_L3]) {
    assert.ok(fs.existsSync(path.join(ROOT, f)), `${f} must exist`);
  }

  for (const f of PERSISTENCE_FILES) {
    assert.ok(fs.existsSync(path.join(ROOT, f)), `Missing persistence: ${f}`);
  }

  const persistence = read("app/lib/clasificados/comida-local/comidaLocalDraftPersistence.ts");
  assert.ok(persistence.includes("leonix:comida-local:draft:v1"), "Comida Local storage key");
  assert.ok(!/restaurante/i.test(persistence), "No restaurante storage key");
  assert.ok(persistence.includes('startsWith("data:")'), "Strips data: URLs from storage");
  assert.ok(!persistence.includes("base64,"), "No base64 persistence pattern");

  const client = read("app/(site)/publicar/comida-local/ComidaLocalApplicationClient.tsx");
  const fieldCopy = read("app/lib/clasificados/comida-local/comidaLocalFieldCopy.ts");
  const labels = `${client}\n${fieldCopy}\n${read("app/(site)/publicar/comida-local/ComidaLocalValidationPanel.tsx")}`;

  for (const label of REQUIRED_LABELS) {
    assert.ok(labels.includes(label), `Missing label: ${label}`);
  }

  assert.ok(client.includes("useComidaLocalDraft"), "Draft hook wired");
  assert.ok(client.includes("CityAutocomplete"), "NorCal city autocomplete");
  assert.ok(client.includes("formatComidaLocalPhoneInput"), "Phone formatting in UI");
  assert.ok(client.includes("normalizeComidaLocalSocialInput"), "Social normalization");
  assert.ok(client.includes("validateComidaLocalDraftForFuturePublish"), "Publish validation UX");
  assert.ok(client.includes("validateComidaLocalDraftForPreview"), "Preview validation UX");
  assert.ok(
    client.includes("previewSoon") || labels.includes("Próximo paso: vista previa"),
    "Non-publishing preview CTA"
  );

  for (const bad of FORBIDDEN_RESTAURANT) {
    assert.ok(!client.includes(bad), `Forbidden label: ${bad}`);
  }

  const validation = read("app/lib/clasificados/comida-local/comidaLocalValidation.ts");
  assert.ok(validation.includes("phone.length >= 10 || wa.length >= 8"), "Phone OR WhatsApp");

  assert.ok(
    !fs.existsSync(path.join(ROOT, "app/api/clasificados/comida-local/publish/route.ts")),
    "No publish API"
  );

  const pkg = read("package.json");
  assert.ok(pkg.includes('"comida-local:food-l3-field-draft-audit"'), "package script");

  for (const p of changedFiles()) {
    if (p.startsWith("app/(site)/publicar/restaurantes/")) {
      assert.fail(`Restaurante modified: ${p}`);
    }
    if (p.startsWith("app/api/clasificados/comida-local/")) {
      assert.fail(`Publish API: ${p}`);
    }
    if (p.startsWith("supabase/migrations/")) {
      assert.fail(`Migration: ${p}`);
    }
    assert.ok(isAllowedPath(p), `Out of scope: ${p}`);
  }

  console.log("comida-local-food-l3-field-draft-audit: OK");
}

run();
