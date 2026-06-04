/**
 * Gate FOOD-L5C — Comida Local image upload static audit.
 * Run: npm run comida-local:food-l5c-image-upload-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const FOOD_L5B = "app/lib/clasificados/comida-local/COMIDA_LOCAL_FOOD_L5B_PUBLISH_DB_AUDIT.md";
const FOOD_L5C = "app/lib/clasificados/comida-local/COMIDA_LOCAL_FOOD_L5C_IMAGE_UPLOAD_AUDIT.md";
const UPLOAD_ROUTE = "app/api/clasificados/comida-local/draft-media-upload/route.ts";
const PUBLISH_VALIDATION = "app/lib/clasificados/comida-local/comidaLocalPublishValidation.ts";
const PUBLISH_MAPPER = "app/lib/clasificados/comida-local/comidaLocalPublicListingMapper.ts";
const APP_CLIENT = "app/(site)/publicar/comida-local/ComidaLocalApplicationClient.tsx";

const REQUIRED_FILES = [
  FOOD_L5B,
  FOOD_L5C,
  "app/lib/clasificados/comida-local/comidaLocalImageValidation.ts",
  UPLOAD_ROUTE,
  PUBLISH_VALIDATION,
  PUBLISH_MAPPER,
  APP_CLIENT,
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
  "app/(site)/dashboard/",
  "app/admin/",
];

const ALLOWED_PREFIXES = [
  "app/lib/clasificados/comida-local/",
  "app/(site)/publicar/comida-local/",
  "app/(site)/clasificados/comida-local/",
  "app/api/clasificados/comida-local/",
  "scripts/comida-local-food-l5c-image-upload-audit.ts",
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
  for (const f of REQUIRED_FILES) {
    assert.ok(fs.existsSync(path.join(ROOT, f)), `${f} must exist`);
  }

  const l5c = read(FOOD_L5C);
  assert.ok(l5c.includes("Gate FOOD-L5C"), "FOOD-L5C title");
  assert.ok(l5c.includes("| Requirement | TRUE/FALSE | Evidence |"), "TRUE/FALSE table");

  const uploadApi = read(UPLOAD_ROUTE);
  assert.ok(/formData|multipart/i.test(uploadApi), "multipart form handling");
  assert.ok(
    (/image\/jpeg/i.test(uploadApi) && /image\/webp/i.test(uploadApi)) ||
      /COMIDA_LOCAL_ACCEPTED_IMAGE_MIME/.test(uploadApi)
  );
  assert.ok(!/stripe|checkout\.sessions|payment_intent/i.test(uploadApi));
  assert.ok(!/trackAnalytics|analytics_events/i.test(uploadApi));
  assert.ok(!/app\/admin|dashboard/i.test(uploadApi));
  assert.ok(/isUnsafeComidaLocalImageUrl|data:|blob:/i.test(uploadApi) || /COMIDA_LOCAL_ACCEPTED_IMAGE_MIME/.test(uploadApi));

  const publishVal = read(PUBLISH_VALIDATION);
  assert.ok(/hasComidaLocalMainPhoto|mainPhoto.*obligatoria/i.test(publishVal));

  const mapper = read(PUBLISH_MAPPER);
  assert.ok(mapper.includes("main_photo"));
  assert.ok(mapper.includes("logo_image"));
  assert.ok(mapper.includes("gallery_images"));

  const app = read(APP_CLIENT);
  assert.ok(app.includes("ComidaLocalImageUploadField"));
  assert.ok(/Foto principal|mainPhoto/i.test(app));
  assert.ok(/Logo|logoImage/i.test(app));
  assert.ok(/Galería|ComidaLocalGalleryUpload/i.test(app));

  const fieldCopy = read("app/lib/clasificados/comida-local/comidaLocalFieldCopy.ts");
  assert.ok(fieldCopy.includes("Galería limitada"));

  const pkg = read("package.json");
  assert.ok(pkg.includes('"comida-local:food-l5c-image-upload-audit"'));

  function isAllowed(p: string): boolean {
    return ALLOWED_PREFIXES.some((a) => p === a || p.startsWith(a));
  }

  for (const p of changedFiles()) {
    const gateScope =
      p.startsWith("app/lib/clasificados/comida-local/") ||
      p.startsWith("app/(site)/publicar/comida-local/") ||
      p.startsWith("app/(site)/clasificados/comida-local/") ||
      p.startsWith("app/api/clasificados/comida-local/") ||
      p.startsWith("scripts/comida-local-") ||
      p === "package.json";
    if (!gateScope) continue;
    assert.ok(isAllowed(p), `FOOD-L5C file outside allowed paths: ${p}`);
    if (FORBIDDEN_PREFIXES.some((fp) => p.startsWith(fp))) {
      assert.fail(`Forbidden path modified in FOOD-L5C scope: ${p}`);
    }
  }

  console.log("comida-local-food-l5c-image-upload-audit: OK");
}

run();
