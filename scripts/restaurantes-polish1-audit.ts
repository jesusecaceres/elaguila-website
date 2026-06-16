/**
 * Gate REST-POLISH1 — Restaurante public detail compression static audit.
 * Run: npm run restaurantes:polish1-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const AUDIT = "app/lib/clasificados/restaurantes/RESTAURANTES_POLISH1_AUDIT.md";
const HUB = "app/(site)/clasificados/restaurantes/shell/RestaurantContactHub.tsx";
const STORY = "app/(site)/clasificados/restaurantes/shell/RestauranteAdStoryPreview.tsx";
const FEATURES = "app/(site)/clasificados/restaurantes/shell/RestauranteGroupedFeaturesSection.tsx";
const AMENITIES = "app/(site)/clasificados/restaurantes/shell/RestauranteAmenitiesShellSection.tsx";
const GALLERY = "app/(site)/clasificados/restaurantes/shell/RestauranteLockedGallerySection.tsx";
const FORM_CLIENT = "app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx";

const FORBIDDEN_PREFIXES = [
  "app/(site)/publicar/comida-local/",
  "app/(site)/clasificados/comida-local/",
  "app/lib/clasificados/comida-local/",
  "app/api/",
  "supabase/migrations/",
  "database/migrations/",
  "app/(site)/dashboard/",
  "app/admin/",
];

const ALLOWED_PREFIXES = [
  "app/(site)/clasificados/restaurantes/",
  "app/lib/clasificados/restaurantes/",
  "scripts/restaurantes-polish1-audit.ts",
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
  assert.ok(exists(HUB), `${HUB} must exist`);
  assert.ok(exists(STORY), `${STORY} must exist`);

  const hub = read(HUB);
  const story = read(STORY);
  const features = read(FEATURES);
  const amenities = read(AMENITIES);
  const gallery = read(GALLERY);
  const form = read(FORM_CLIENT);
  const pkg = read("package.json");

  assert.match(hub, /lg:grid-cols-3/, "Business Hub must use 3-column desktop layout");
  assert.match(hub, /rest-hub-contact-heading/, "Contact section must exist in hub");
  assert.match(hub, /rest-hub-location-heading/, "Location section must exist in hub");
  assert.match(hub, /rest-hub-hours-heading/, "Hours section must exist in hub");
  assert.match(hub, /RestaurantHubSocialBrandIcon/, "Social icons must remain platform-specific");
  assert.match(hub, /RestaurantHubReviewLinkButton/, "Review links must remain real-link buttons");

  assert.match(story, /RestauranteGroupedFeaturesSection/, "Services/features section must exist");
  assert.match(story, /RestauranteAmenitiesShellSection/, "Amenities section must exist");
  assert.match(story, /Especialidades de la Casa/, "Specialties section must exist");
  assert.match(story, /RestauranteLockedGallerySection/, "Gallery section must exist");
  assert.match(story, /Explorar fotos y videos|Más información/, "Gallery CTA or Más información must exist");
  assert.match(story, /hubHasHours|showStandaloneHours/, "Duplicate hours must be suppressed when hub has hours");

  assert.match(features, /Servicios y Características/, "Features heading must exist");
  assert.match(amenities, /RestaurantePublishChipMarker|lookupRestauranteAmenityLeading/, "Amenities must use icon-flavored chips");
  assert.match(gallery, /Explorar fotos y videos/, "Gallery explore CTA must exist");
  assert.match(gallery, /video|Video/, "Photos/videos separation must remain");

  assert.match(form, /section-a|restaurantes-section/, "Form section nav must remain (no form UX removal)");

  assert.match(pkg, /restaurantes:polish1-audit/, "package script must exist");

  const changed = changedFiles();
  for (const f of changed) {
    if (FORBIDDEN_PREFIXES.some((p) => f.startsWith(p))) {
      throw new Error(`Forbidden path modified: ${f}`);
    }
    if (!isGateScopedChange(f)) {
      throw new Error(`Out-of-scope path modified: ${f}`);
    }
  }

  console.log("restaurantes-polish1-audit: PASS");
}

run();
