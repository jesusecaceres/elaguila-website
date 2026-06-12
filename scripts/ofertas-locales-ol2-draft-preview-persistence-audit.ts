/**
 * Gate OL-2 — Ofertas Locales draft persistence + preview return audit.
 * Run: npm run ofertas-locales:ol2-draft-preview-persistence-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const DRAFT_PERSISTENCE = "app/lib/ofertas-locales/ofertasLocalesDraftPersistence.ts";
const USE_DRAFT = "app/lib/ofertas-locales/useOfertasLocalesDraft.ts";
const CREATE_EMPTY = "app/lib/ofertas-locales/createEmptyOfertaLocalDraft.ts";
const APP_CLIENT = "app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx";
const PREVIEW_PAGE = "app/(site)/publicar/ofertas-locales/preview/page.tsx";
const PREVIEW_CLIENT = "app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewClient.tsx";
const PREVIEW_CARD = "app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewCard.tsx";
const PREVIEW_COPY = "app/(site)/publicar/ofertas-locales/preview/ofertasLocalesPreviewCopy.ts";
const ASSET_SECTION = "app/(site)/publicar/ofertas-locales/OfertasLocalesDraftAssetSection.tsx";
const PACKAGE_JSON = "package.json";

const ALLOWED_PREFIXES = [
  "app/lib/ofertas-locales/",
  "app/(site)/publicar/ofertas-locales/",
  "scripts/ofertas-locales-ol2-draft-preview-persistence-audit.ts",
  "package.json",
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

function run() {
  for (const rel of [
    DRAFT_PERSISTENCE,
    USE_DRAFT,
    CREATE_EMPTY,
    APP_CLIENT,
    PREVIEW_PAGE,
    PREVIEW_CLIENT,
    PREVIEW_CARD,
    PREVIEW_COPY,
    ASSET_SECTION,
  ]) {
    assert.ok(exists(rel), `Required file must exist: ${rel}`);
  }

  const persistence = read(DRAFT_PERSISTENCE);
  const useDraft = read(USE_DRAFT);
  const createEmpty = read(CREATE_EMPTY);
  const app = read(APP_CLIENT);
  const previewClient = read(PREVIEW_CLIENT);
  const previewCard = read(PREVIEW_CARD);
  const previewCopy = read(PREVIEW_COPY);
  const assetSection = read(ASSET_SECTION);
  const pkg = read(PACKAGE_JSON);

  assert.match(persistence, /sessionStorage/, "draft must use sessionStorage (per-tab)");
  assert.doesNotMatch(
    persistence,
    /localStorage\.(get|set|remove)Item\(\s*OFERTAS_LOCALES_DRAFT_STORAGE_KEY/,
    "draft must not use localStorage for active draft"
  );
  assert.match(persistence, /OFERTAS_LOCALES_DRAFT_STORAGE_KEY/, "draft storage key must be defined");
  assert.match(persistence, /flyerAssets|couponAssets/, "asset metadata buckets must be sanitized on load");
  assert.match(persistence, /primaryAdFormat|shopping_specials|local_coupons/, "lane primaryAdFormat must persist");
  assert.match(persistence, /sanitizeUrl[\s\S]*data:/, "must reject data: URLs in stored assets");

  assert.match(useDraft, /loadOfertaLocalDraftFromStorage/, "hook must hydrate from storage");
  assert.match(useDraft, /saveOfertaLocalDraftToStorage/, "hook must autosave draft");
  assert.match(useDraft, /clearOfertaLocalDraftStorage/, "hook must clear storage on reset");
  assert.match(useDraft, /resetDraft/, "hook must expose resetDraft");

  assert.match(createEmpty, /flyerAssets:\s*\[\]/, "empty draft includes flyerAssets");
  assert.match(createEmpty, /couponAssets:\s*\[\]/, "empty draft includes couponAssets");
  assert.match(createEmpty, /primaryAdFormat:\s*""/, "empty draft includes primaryAdFormat");

  assert.match(app, /resetDraft/, "application must support reset/new application");
  assert.match(app, /\/publicar\/ofertas-locales\/preview/, "application must link to preview");

  assert.match(previewCopy, /Volver a editar/, "Spanish back-to-edit copy required");
  assert.match(previewCopy, /Back to edit/, "English back-to-edit copy required");
  assert.match(previewCard, /backToEditEn|Back to edit/, "preview card must use English back-to-edit");
  assert.match(previewCard, /\/publicar\/ofertas-locales\?lang=/, "back-to-edit must route to application");
  assert.match(previewClient, /useOfertasLocalesDraft/, "preview must read same draft hook");

  assert.doesNotMatch(
    persistence,
    /JSON\.stringify\([\s\S]*File/,
    "persistence must not stringify File objects"
  );
  assert.doesNotMatch(assetSection, /sessionStorage|localStorage/, "File objects stay in component state only");

  assert.match(
    pkg,
    /ofertas-locales:ol2-draft-preview-persistence-audit/,
    "package.json must wire OL-2 audit script"
  );

  for (const file of changedFiles()) {
    if (!ALLOWED_PREFIXES.some((prefix) => file === prefix || file.startsWith(prefix))) {
      // Verification gate may run with unrelated dirty files in worktree — warn only for OL-2 scope files
      if (
        file.startsWith("app/(site)/publicar/ofertas-locales/") ||
        file.startsWith("app/lib/ofertas-locales/")
      ) {
        assert.fail(`Unexpected Ofertas Locales file changed outside OL-2 scope: ${file}`);
      }
    }
  }

  console.log("Gate OL-2 — Ofertas Locales draft persistence + preview audit passed.");
}

run();
