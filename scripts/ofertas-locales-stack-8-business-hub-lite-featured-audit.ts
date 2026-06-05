/**
 * Stack 8 — Ofertas Locales Business Hub Lite + Featured Placement audit.
 * Run: npm run ofertas-locales:stack-8-business-hub-lite-featured-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const PLAN = "app/lib/ofertas-locales/OFERTAS_LOCALES_STACK_8_BUSINESS_HUB_LITE_FEATURED_PLAN.md";
const AUDIT_DOC = "app/lib/ofertas-locales/OFERTAS_LOCALES_STACK_8_BUSINESS_HUB_LITE_FEATURED_AUDIT.md";
const APP_CLIENT = "app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx";
const PREVIEW_CARD = "app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewCard.tsx";
const TYPES = "app/lib/ofertas-locales/ofertasLocalesTypes.ts";
const FACTORY = "app/lib/ofertas-locales/createEmptyOfertaLocalDraft.ts";
const PERSISTENCE = "app/lib/ofertas-locales/ofertasLocalesDraftPersistence.ts";
const PUBLISH_MAPPER = "app/lib/ofertas-locales/ofertasLocalesPublishMapper.ts";
const HELPERS = "app/lib/ofertas-locales/ofertasLocalesApplicationHelpers.ts";

const NAV_FILES = ["app/components/Navbar.tsx", "app/components/AdvertiseDropdown.tsx"] as const;

const SOCIAL_FIELDS = [
  "facebookUrl",
  "instagramUrl",
  "tiktokUrl",
  "youtubeUrl",
  "googleBusinessUrl",
] as const;

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

function assertNoNewOfertasMigration() {
  const dir = path.join(ROOT, "supabase", "migrations");
  if (!fs.existsSync(dir)) return;
  const changed = changedFiles();
  for (const f of fs.readdirSync(dir)) {
    const rel = `supabase/migrations/${f}`;
    if (!changed.includes(rel)) continue;
    const content = fs.readFileSync(path.join(dir, f), "utf8");
    assert.ok(
      !content.includes("facebook_url") && !content.includes("featured_placement_scope"),
      `Stack 8 must not add social/scope columns without approval: ${f}`
    );
  }
}

function run() {
  assert.ok(exists(PLAN), "Stack 8 plan must exist");
  assert.ok(exists(AUDIT_DOC), "Stack 8 audit doc must exist");

  const types = read(TYPES);
  const factory = read(FACTORY);
  const persistence = read(PERSISTENCE);
  const app = read(APP_CLIENT);
  const preview = read(PREVIEW_CARD);
  const mapper = read(PUBLISH_MAPPER);
  const helpers = read(HELPERS);
  const bundle = `${types}\n${factory}\n${persistence}\n${app}\n${preview}`;

  for (const field of SOCIAL_FIELDS) {
    assert.ok(types.includes(field), `types: ${field}`);
    assert.ok(factory.includes(field), `factory: ${field}`);
    assert.ok(persistence.includes(field), `persistence: ${field}`);
    assert.ok(app.includes(field), `application: ${field}`);
  }

  assert.ok(types.includes("wantsFeaturedPlacement"), "types: wantsFeaturedPlacement");
  assert.ok(types.includes("featuredPlacementScope"), "types: featuredPlacementScope");
  assert.ok(types.includes("OfertaLocalFeaturedPlacementScope"), "types: scope union");
  assert.ok(factory.includes("wantsFeaturedPlacement"), "factory: wantsFeaturedPlacement");
  assert.ok(factory.includes('featuredPlacementScope: "none"'), "factory: featuredPlacementScope default");
  assert.ok(persistence.includes("wantsFeaturedPlacement"), "persistence: wantsFeaturedPlacement");
  assert.ok(persistence.includes("featuredPlacementScope"), "persistence: featuredPlacementScope");

  assert.ok(app.includes("wantsFeaturedPlacement"), "application: wantsFeaturedPlacement");
  assert.ok(app.includes("socialSectionTitle"), "application: social section");
  assert.ok(app.includes("featuredSectionTitle"), "application: featured section");

  assert.ok(helpers.includes("getOfertaLocalSocialLinks"), "helpers: social links");
  assert.ok(preview.includes("getOfertaLocalSocialLinks"), "preview: social links helper");
  assert.ok(preview.includes("followUsEs") || preview.includes("Follow us"), "preview: follow us copy");
  assert.ok(preview.includes("featuredInterestEs"), "preview: featured interest note");
  assert.ok(!preview.includes("Destacado activo"), "preview must not claim active featured");
  assert.ok(!preview.includes("Featured placement active"), "preview must not claim active featured EN");

  assert.ok(!bundle.includes("googleReviewsUrl"), "no reviews fields");
  assert.ok(!bundle.includes("yelpReviewsUrl"), "no reviews fields");
  assert.ok(!bundle.includes("bookingUrl"), "no booking CTA fields");
  assert.ok(!bundle.includes("appointmentUrl"), "no appointment CTA fields");

  assert.ok(mapper.includes("socialLinks"), "publish mapper: social metadata");
  assert.ok(mapper.includes("featuredPlacementScope"), "publish mapper: scope metadata");
  assert.ok(mapper.includes("wantsFeaturedPlacement"), "publish mapper: featured intent");

  assert.ok(!exists("app/lib/stripe/ofertasLocales"), "no Stripe logic");
  const changed = changedFiles();
  for (const nav of NAV_FILES) {
    assert.ok(!changed.includes(nav), `Nav must not change: ${nav}`);
  }
  assert.ok(!changed.some((f) => f.startsWith("app/admin/")), "admin must not change");
  assert.ok(!changed.some((f) => f.includes("clasificados/autos/")), "unrelated category autos");
  assert.ok(!changed.some((f) => f.includes("clasificados/servicios/")), "unrelated category servicios");

  assertNoNewOfertasMigration();

  const pkg = read("package.json");
  assert.ok(
    pkg.includes('"ofertas-locales:stack-8-business-hub-lite-featured-audit"'),
    "package script"
  );

  console.log("Stack 8 — Ofertas Locales Business Hub Lite + Featured Placement audit passed.");
}

run();
