/**
 * Gate REST-MEDIA-PERF1 — Restaurante image preview performance static audit.
 * Run: npm run restaurantes:media-perf1-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const CLIENT = "app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx";
const PREVIEW_IMG = "app/(site)/clasificados/restaurantes/application/RestauranteMediaPreviewImg.tsx";
const BUCKETS = "app/(site)/clasificados/restaurantes/application/RestaurantePublishMediaBuckets.tsx";
const COMPRESS = "app/(site)/clasificados/restaurantes/application/compressRestauranteImage.ts";
const DRAFT_HOOK = "app/(site)/clasificados/restaurantes/application/useRestauranteDraft.ts";
const AUDIT = "app/lib/clasificados/restaurantes/RESTAURANTES_MEDIA_PERF1_AUDIT.md";

const FORBIDDEN_PREFIXES = [
  "app/(site)/publicar/comida-local/",
  "app/(site)/clasificados/comida-local/",
  "app/lib/clasificados/comida-local/",
  "supabase/migrations/",
  "database/migrations/",
  "app/(site)/dashboard/",
  "app/admin/",
];

const ALLOWED_PREFIXES = [
  "app/(site)/publicar/restaurantes/",
  "app/(site)/clasificados/restaurantes/",
  "app/lib/clasificados/restaurantes/",
  "scripts/restaurantes-media-perf1-audit.ts",
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
  assert.ok(exists(PREVIEW_IMG), `${PREVIEW_IMG} must exist`);

  const client = read(CLIENT);
  const previewImg = read(PREVIEW_IMG);
  const buckets = read(BUCKETS);
  const compress = read(COMPRESS);
  const hook = read(DRAFT_HOOK);
  const pkg = read("package.json");

  assert.match(previewImg, /RestauranteMediaPreviewImg/, "preview img component must exist");
  assert.match(previewImg, /loading=/, "lazy loading support");
  assert.match(previewImg, /decoding=/, "async decoding support");
  assert.match(previewImg, /revokeObjectURL/, "object URL cleanup");
  assert.match(previewImg, /resolveRestauranteMediaRefForDisplay/, "lazy IDB resolve");

  assert.match(client, /RestauranteMediaPreviewImg/, "client uses optimized preview img");
  assert.match(client, /Foto principal \(hero\)/, "hero section exists");
  assert.match(client, /Logo del negocio/, "logo section exists");
  assert.match(client, /RestaurantePublishMediaBuckets/, "food/interior/exterior buckets exist");
  assert.match(client, /Plato/, "featured dish section exists");

  assert.match(buckets, /appendBucketImages/, "sequential bucket upload");
  assert.doesNotMatch(buckets, /Promise\.all\(imageFiles\.map/, "no parallel compress-all blocking");

  assert.match(compress, /RESTAURANTE_GRID_IMAGE_COMPRESSION_OPTS/, "grid compression opts");
  assert.match(compress, /readRestauranteImageAsDataUrlWithInstantPreview/, "instant blob preview helper");

  assert.match(hook, /loadRestauranteDraftFromStorageForEditor/, "fast editor load without bulk inline");
  assert.match(hook, /resolveMediaOnLoad/, "preview can still inline media");

  assert.doesNotMatch(read("app/(site)/clasificados/restaurantes/application/restauranteDraftStorage.ts"), /localStorage\.setItem.*data:image/, "no base64 in localStorage");

  assert.match(pkg, /restaurantes:media-perf1-audit/, "package script exists");

  for (const file of changedFiles()) {
    if (!isGateScopedChange(file)) {
      const forbidden = FORBIDDEN_PREFIXES.some((p) => file.startsWith(p));
      if (forbidden) {
        assert.fail(`Forbidden path changed: ${file}`);
      }
    }
  }

  console.log("restaurantes-media-perf1-audit: PASS");
}

run();
