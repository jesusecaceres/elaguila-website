/**
 * Stack 4 — Ofertas Locales draft asset UX static audit.
 * Run: npm run ofertas-locales:stack-4-asset-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const AUDIT_DOC = "app/lib/ofertas-locales/OFERTAS_LOCALES_STACK_4_DRAFT_ASSET_UX_AUDIT.md";
const DRAFT_CLIENT = "app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx";
const ASSET_SECTION = "app/(site)/publicar/ofertas-locales/OfertasLocalesDraftAssetSection.tsx";
const PREVIEW_CARD = "app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewCard.tsx";
const PREVIEW_ASSETS = "app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewAssetCards.tsx";

const FORBIDDEN = [
  "fetch('/api",
  'fetch("/api',
  "supabase",
  "insert(",
  "upsert(",
  ".storage",
  "stripe",
  "checkout",
  "Stripe",
  "data:image",
  "base64",
] as const;

const NAV_FILES = ["app/components/Navbar.tsx", "app/components/AdvertiseDropdown.tsx"] as const;

const ALLOWED_PREFIXES = [
  "app/lib/ofertas-locales/",
  "app/(site)/publicar/ofertas-locales/",
  "scripts/ofertas-locales-stack-4-asset-audit.ts",
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

function assertNoForbidden(source: string, label: string) {
  for (const pattern of FORBIDDEN) {
    assert.ok(!source.includes(pattern), `${label} must not include: ${pattern}`);
  }
}

function assertNoMigration() {
  const dir = path.join(ROOT, "supabase", "migrations");
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir)) {
    const content = fs.readFileSync(path.join(dir, f), "utf8");
    assert.ok(!content.toLowerCase().includes("ofertas_locales"), `Migration ${f} references ofertas_locales`);
  }
}

function run() {
  assert.ok(exists(AUDIT_DOC), `${AUDIT_DOC} must exist`);

  const types = read("app/lib/ofertas-locales/ofertasLocalesTypes.ts");
  assert.ok(types.includes("OfertaLocalDraftAsset"), "OfertaLocalDraftAsset type required");
  assert.ok(types.includes("flyer_pdf"), "flyer_pdf asset type required");
  assert.ok(types.includes("coupon_image"), "coupon_image asset type required");

  const createAsset = read("app/lib/ofertas-locales/createEmptyOfertaLocalDraftAsset.ts");
  assert.ok(createAsset.includes("export function createEmptyOfertaLocalDraftAsset"), "create helper required");

  const emptyDraft = read("app/lib/ofertas-locales/createEmptyOfertaLocalDraft.ts");
  assert.ok(emptyDraft.includes("flyerAssets: []"), "flyerAssets initialized");
  assert.ok(emptyDraft.includes("couponAssets: []"), "couponAssets initialized");

  const constants = read("app/lib/ofertas-locales/ofertasLocalesConstants.ts");
  assert.ok(constants.includes("OFERTAS_LOCALES_FLYER_DRAFT_ASSET_TYPES"), "flyer asset constants");
  assert.ok(constants.includes("OFERTAS_LOCALES_MAX_FLYER_ASSETS"), "max flyer assets");

  const draftClient = read(DRAFT_CLIENT);
  const assetSection = read(ASSET_SECTION);
  assert.ok(draftClient.includes("flyerAssets"), "draft client references flyerAssets");
  assert.ok(draftClient.includes("couponAssets"), "draft client references couponAssets");
  assert.ok(assetSection.includes("createEmptyOfertaLocalDraftAsset"), "asset section creates assets");
  assert.ok(assetSection.includes("assetsRealUploadSoonEn"), "upload soon label");

  const previewCard = read(PREVIEW_CARD);
  const previewAssets = read(PREVIEW_ASSETS);
  assert.ok(previewCard.includes("OfertasLocalesPreviewAssetCards"), "preview card uses asset cards");
  assert.ok(previewAssets.includes("uploadPending"), "upload pending state");
  assert.ok(previewAssets.includes("external_url"), "external url handling");

  const bundle = `${draftClient}\n${assetSection}\n${previewCard}\n${previewAssets}`;
  assertNoForbidden(bundle, "Stack 4 UI bundle");

  assert.ok(!exists("app/api/ofertas-locales"), "No API route");
  assertNoMigration();

  const pkg = read("package.json");
  assert.ok(pkg.includes('"ofertas-locales:stack-4-asset-audit"'), "package script required");

  const changed = changedFiles();
  for (const nav of NAV_FILES) {
    assert.ok(!changed.includes(nav), `Nav must not change: ${nav}`);
  }

  console.log("Stack 4 — Ofertas Locales draft asset UX audit passed.");
}

run();
