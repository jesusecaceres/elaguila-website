/**
 * Gate REST-POLISH2 — Restaurante media priority + video preview cards static audit.
 * Run: npm run restaurantes:polish2-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const AUDIT = "app/lib/clasificados/restaurantes/RESTAURANTES_POLISH2_AUDIT.md";
const STORY = "app/(site)/clasificados/restaurantes/shell/RestauranteAdStoryPreview.tsx";
const VIDEO_PREVIEW = "app/(site)/clasificados/restaurantes/shell/restauranteVideoPreview.ts";
const VIDEO_CARD = "app/(site)/clasificados/restaurantes/shell/RestauranteVideoPreviewCard.tsx";
const GALLERY = "app/(site)/clasificados/restaurantes/shell/RestauranteLockedGallerySection.tsx";
const HEADER = "app/(site)/clasificados/restaurantes/shell/RestauranteProfileHeader.tsx";
const HUB = "app/(site)/clasificados/restaurantes/shell/RestaurantContactHub.tsx";
const FORM_CLIENT = "app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx";

const FORBIDDEN_PREFIXES = [
  "app/(site)/publicar/comida-local/",
  "app/(site)/clasificados/comida-local/",
  "app/lib/clasificados/comida-local/",
  "app/(site)/clasificados/en-venta/",
  "app/(site)/clasificados/varios/",
  "app/api/",
  "supabase/migrations/",
  "database/migrations/",
  "app/(site)/dashboard/",
  "app/admin/",
];

const ALLOWED_PREFIXES = [
  "app/(site)/clasificados/restaurantes/",
  "app/lib/clasificados/restaurantes/",
  "scripts/restaurantes-polish2-audit.ts",
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
  assert.ok(exists(VIDEO_PREVIEW), `${VIDEO_PREVIEW} must exist`);
  assert.ok(exists(VIDEO_CARD), `${VIDEO_CARD} must exist`);

  const story = read(STORY);
  const videoPreview = read(VIDEO_PREVIEW);
  const videoCard = read(VIDEO_CARD);
  const gallery = read(GALLERY);
  const header = read(HEADER);
  const hub = read(HUB);
  const form = read(FORM_CLIENT);
  const pkg = read("package.json");

  assert.match(videoPreview, /extractRestauranteYoutubeId/, "YouTube ID extraction required");
  assert.match(videoPreview, /shorts/, "YouTube Shorts support required");
  assert.match(videoPreview, /img\.youtube\.com/, "YouTube thumbnail URL required");
  assert.match(videoPreview, /detectRestauranteVideoPlatform/, "Platform detection required");
  assert.match(videoCard, /RestauranteVideoPreviewCard/, "Video preview card component required");
  assert.match(videoCard, /Ver video|Watch video/, "Video CTA label required");
  assert.match(gallery, /RestauranteVideoPreviewCard/, "Gallery must use video preview cards");
  assert.match(gallery, /Galería y Videos|Gallery & Videos/, "Gallery section title updated");

  const storyIdx = {
    especialidades: story.indexOf("{/* 1. Especialidades de la Casa"),
    gallery: story.indexOf("{/* 2. Galería y Videos"),
    features: story.indexOf("{/* 3. Servicios y Características"),
    amenities: story.indexOf("{/* 4. Amenidades y más"),
  };
  assert.ok(storyIdx.especialidades >= 0, "Especialidades section must exist");
  assert.ok(storyIdx.gallery > storyIdx.especialidades, "Gallery must follow Especialidades");
  assert.ok(storyIdx.features > storyIdx.gallery, "Features must follow Gallery");
  assert.ok(storyIdx.amenities > storyIdx.features, "Amenities must follow Features");

  assert.match(header, /heroImageUrl|heroImage/, "Hero image sizing evidence required");
  assert.match(header, /LeonixLikeButton/, "Like button must remain in hero");
  assert.match(header, /LeonixSaveButton/, "Save button must remain in hero");
  assert.match(header, /LeonixShareButton/, "Share button must remain in hero");
  assert.match(hub, /lg:grid-cols-3/, "Business Hub layout must remain");

  assert.match(gallery, /RestauranteVideoPreviewCard/, "Gallery references video preview cards");
  assert.match(form, /section-a|restaurantes-section/, "Form section nav must remain");

  assert.match(pkg, /restaurantes:polish2-audit/, "package script must exist");

  const changed = changedFiles();
  for (const f of changed) {
    if (FORBIDDEN_PREFIXES.some((p) => f.startsWith(p))) {
      throw new Error(`Forbidden path modified: ${f}`);
    }
    if (!isGateScopedChange(f)) {
      throw new Error(`Out-of-scope path modified: ${f}`);
    }
  }

  console.log("restaurantes-polish2-audit: PASS");
}

run();
