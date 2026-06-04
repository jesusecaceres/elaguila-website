/**
 * Gate FOOD-L4 — Comida Local preview/detail audit.
 * Run: npm run comida-local:food-l4-preview-detail-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const AUDITS = [
  "app/lib/clasificados/comida-local/COMIDA_LOCAL_FOOD_L1_ARCHITECTURE_AUDIT.md",
  "app/lib/clasificados/comida-local/COMIDA_LOCAL_FOOD_L2_SCAFFOLD_AUDIT.md",
  "app/lib/clasificados/comida-local/COMIDA_LOCAL_FOOD_L3_FIELD_DRAFT_AUDIT.md",
  "app/lib/clasificados/comida-local/COMIDA_LOCAL_FOOD_L4_PREVIEW_DETAIL_AUDIT.md",
] as const;

const REQUIRED_FILES = [
  "app/lib/clasificados/comida-local/comidaLocalPreviewTypes.ts",
  "app/lib/clasificados/comida-local/mapComidaLocalDraftToPreviewVm.ts",
  "app/(site)/clasificados/comida-local/components/ComidaLocalDetailShell.tsx",
  "app/(site)/clasificados/comida-local/components/ComidaLocalContactActions.tsx",
  "app/(site)/clasificados/comida-local/preview/page.tsx",
  "app/(site)/clasificados/comida-local/preview/ComidaLocalPreviewClient.tsx",
] as const;

const FORBIDDEN_PREFIXES = [
  "app/(site)/publicar/restaurantes/",
  "app/(site)/clasificados/restaurantes/",
  "app/lib/clasificados/restaurantes/",
  "app/(site)/publicar/rentas/",
  "app/(site)/clasificados/rentas/",
  "app/(site)/clasificados/bienes-raices/",
  "app/(site)/clasificados/servicios/",
  "app/(site)/clasificados/en-venta/",
  "app/(site)/publicar/servicios/",
  "app/api/clasificados/comida-local/",
  "app/(site)/dashboard/",
  "app/admin/",
  "supabase/migrations/",
];

const FORBIDDEN_LABELS = [
  "Reservar",
  "Pedir ahora",
  "Opiniones en Google",
  "Opiniones en Yelp",
  "Amenidades",
  "Catering y eventos",
  "Menú completo",
] as const;

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
  for (const f of AUDITS) {
    assert.ok(fs.existsSync(path.join(ROOT, f)), `${f} must exist`);
  }
  for (const f of REQUIRED_FILES) {
    assert.ok(fs.existsSync(path.join(ROOT, f)), `${f} must exist`);
  }

  const mapper = read("app/lib/clasificados/comida-local/mapComidaLocalDraftToPreviewVm.ts");
  assert.ok(mapper.includes("mapComidaLocalDraftToPreviewVm"), "Mapper export");
  assert.ok(mapper.includes("buildComidaLocalTelHref"), "Phone href in mapper");
  assert.ok(mapper.includes("normalizeComidaLocalSocialInput"), "Social normalize in mapper");

  const persistence = read("app/lib/clasificados/comida-local/comidaLocalDraftPersistence.ts");
  assert.ok(persistence.includes("leonix:comida-local:draft:v1"), "Draft key");
  assert.ok(persistence.includes('startsWith("data:")'), "No data URL persistence");

  const previewClient = read("app/(site)/clasificados/comida-local/preview/ComidaLocalPreviewClient.tsx");
  assert.ok(previewClient.includes("loadComidaLocalDraftFromStorage"), "Reads local draft only");
  assert.ok(previewClient.includes("Vista previa — Comida Local"), "Preview badge");
  assert.ok(
    previewClient.includes("no está publicada todavía"),
    "Pre-publish note"
  );
  assert.ok(!previewClient.includes("fetch("), "No API fetch in preview");
  assert.ok(!previewClient.includes("leonix_ad_id"), "No fake Leonix ID");

  const fieldCopy = read("app/lib/clasificados/comida-local/comidaLocalFieldCopy.ts");
  const app = read("app/(site)/publicar/comida-local/ComidaLocalApplicationClient.tsx");
  assert.ok(
    app.includes("viewPreview") || fieldCopy.includes("Ver vista previa"),
    "Preview CTA label"
  );
  assert.ok(app.includes("/clasificados/comida-local/preview"), "Preview route link");

  const outputScope = [
    previewClient,
    read("app/(site)/clasificados/comida-local/components/ComidaLocalDetailShell.tsx"),
    mapper,
  ].join("\n");
  for (const bad of FORBIDDEN_LABELS) {
    assert.ok(!outputScope.includes(bad), `Forbidden label: ${bad}`);
  }

  assert.ok(
    !fs.existsSync(path.join(ROOT, "app/api/clasificados/comida-local/publish/route.ts")),
    "No publish API"
  );

  const pkg = read("package.json");
  assert.ok(pkg.includes('"comida-local:food-l4-preview-detail-audit"'), "package script");

  for (const p of changedFiles()) {
    if (FORBIDDEN_PREFIXES.some((fp) => p.startsWith(fp))) {
      assert.fail(`Forbidden path modified in working tree: ${p}`);
    }
  }

  console.log("comida-local-food-l4-preview-detail-audit: OK");
}

run();
