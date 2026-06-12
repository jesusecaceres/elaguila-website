/**
 * Gate REST-VIDEO-URL1 — Restaurante external video URL static audit.
 * Run: npm run restaurantes:video-url1-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const AUDIT = "app/lib/clasificados/restaurantes/RESTAURANTES_VIDEO_URL1_AUDIT.md";
const CLIENT = "app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx";
const VIDEO_SECTION = "app/(site)/publicar/restaurantes/RestauranteExternalVideoUrlsSection.tsx";
const BUCKETS = "app/(site)/clasificados/restaurantes/application/RestaurantePublishMediaBuckets.tsx";
const MAP_SHELL = "app/(site)/clasificados/restaurantes/application/mapRestauranteDraftToShell.ts";
const PAYLOAD = "app/(site)/clasificados/restaurantes/application/buildRestaurantePublishPayload.ts";
const UTILS = "app/lib/clasificados/restaurantes/restauranteVideoUrls.ts";

const FORBIDDEN_PREFIXES = [
  "app/(site)/publicar/comida-local/",
  "app/(site)/clasificados/comida-local/",
  "app/lib/clasificados/comida-local/",
  "app/(site)/clasificados/publicar/en-venta/",
  "app/(site)/clasificados/en-venta/",
  "app/(site)/dashboard/",
  "app/admin/",
  "supabase/migrations/",
  "database/migrations/",
];

const ALLOWED_PREFIXES = [
  "app/(site)/publicar/restaurantes/",
  "app/(site)/clasificados/restaurantes/",
  "app/lib/clasificados/restaurantes/",
  "scripts/restaurantes-video-url1-audit.ts",
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
  assert.ok(exists(VIDEO_SECTION), `${VIDEO_SECTION} must exist`);
  assert.ok(exists(UTILS), `${UTILS} must exist`);

  const videoSection = read(VIDEO_SECTION);
  const buckets = read(BUCKETS);
  const client = read(CLIENT);
  const mapShell = read(MAP_SHELL);
  const payload = read(PAYLOAD);
  const utils = read(UTILS);

  assert.match(videoSection, /Video opcional/, "form must have Video opcional section");
  assert.match(videoSection, /Añadir video/, "form must have Añadir video");
  assert.match(videoSection, /videoUrls/, "form must reference videoUrls");
  assert.match(utils, /RESTAURANTE_MAX_EXTERNAL_VIDEO_URLS = 4/, "max 4 videos");
  assert.match(utils, /isValidRestauranteExternalVideoUrl/, "validation helper exists");
  assert.doesNotMatch(buckets, /Subir video/, "buckets must not offer Subir video");
  assert.doesNotMatch(buckets, /accept="video\/\*"/, "buckets must not accept video files");
  assert.match(mapShell, /collectRestauranteExternalVideoUrls|buildVideoShellItems/, "shell maps videoUrls");
  assert.match(payload, /videoUrls/, "publish payload includes videoUrls");
  assert.match(buckets, /Agregar fotos de comida/, "photo upload preserved");

  for (const file of changedFiles()) {
    if (!isGateScopedChange(file)) {
      const forbidden = FORBIDDEN_PREFIXES.some((p) => file.startsWith(p));
      if (forbidden) assert.fail(`Forbidden path changed: ${file}`);
    }
  }

  console.log("restaurantes-video-url1-audit: PASS");
}

run();
