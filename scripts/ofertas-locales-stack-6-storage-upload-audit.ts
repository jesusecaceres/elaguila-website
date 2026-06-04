/**
 * Stack 6 — Ofertas Locales storage upload foundation static audit.
 * Run: npm run ofertas-locales:stack-6-storage-upload-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const PLAN = "app/lib/ofertas-locales/OFERTAS_LOCALES_STACK_6_STORAGE_UPLOAD_PLAN.md";
const AUDIT_DOC = "app/lib/ofertas-locales/OFERTAS_LOCALES_STACK_6_STORAGE_UPLOAD_AUDIT.md";
const STORAGE_PATHS = "app/lib/ofertas-locales/ofertasLocalesStoragePaths.ts";
const UPLOAD_ROUTE = "app/api/ofertas-locales/assets/upload/route.ts";
const UPLOAD_CLIENT = "app/lib/ofertas-locales/ofertasLocalesAssetUpload.ts";
const ASSET_SECTION = "app/(site)/publicar/ofertas-locales/OfertasLocalesDraftAssetSection.tsx";
const PREVIEW_ASSETS = "app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewAssetCards.tsx";
const PERSISTENCE = "app/lib/ofertas-locales/ofertasLocalesDraftPersistence.ts";

const NAV_FILES = ["app/components/Navbar.tsx", "app/components/AdvertiseDropdown.tsx"] as const;

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

function assertNoMigration() {
  const dir = path.join(ROOT, "supabase", "migrations");
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir)) {
    const content = fs.readFileSync(path.join(dir, f), "utf8");
    assert.ok(!content.toLowerCase().includes("ofertas_locales"), `Migration ${f} references ofertas_locales`);
  }
}

function run() {
  assert.ok(exists(PLAN), `${PLAN} must exist`);
  assert.ok(exists(AUDIT_DOC), `${AUDIT_DOC} must exist`);

  const paths = read(STORAGE_PATHS);
  assert.ok(paths.includes("export function sanitizeOfertaLocalStorageSegment"), "sanitize helper");
  assert.ok(paths.includes("export function createOfertaLocalAssetStoragePath"), "create path helper");
  assert.ok(paths.includes("export function getOfertaLocalAssetStorageFolder"), "folder helper");
  assert.ok(paths.includes("ofertas-locales/drafts/"), "path prefix");

  const types = read("app/lib/ofertas-locales/ofertasLocalesTypes.ts");
  assert.ok(types.includes("OfertaLocalUploadedAssetResult"), "upload result type");
  assert.ok(types.includes("storagePath"), "draft asset storagePath field");

  assert.ok(exists(UPLOAD_ROUTE), "upload API route must exist");
  const route = read(UPLOAD_ROUTE);
  assert.ok(route.includes("ofertasLocalesOwnerIdFromBearer"), "auth helper");
  assert.ok(route.includes("401") || route.includes("unauthorized"), "blocks unauthenticated");
  assert.ok(route.includes("validateOfertaLocalClientAssetFile"), "server MIME/size validation");
  assert.ok(route.includes("@vercel/blob"), "Vercel Blob upload");
  assert.ok(!route.includes("stripe"), "no Stripe");
  assert.ok(!route.includes(".from("), "no DB writes");
  assert.ok(!route.includes("insert("), "no DB insert");

  const client = read(UPLOAD_CLIENT);
  assert.ok(client.includes("/api/ofertas-locales/assets/upload"), "client upload route");
  assert.ok(client.includes("Authorization"), "Bearer token on upload");

  const section = read(ASSET_SECTION);
  assert.ok(section.includes("uploadOfertaLocalDraftAsset"), "draft calls upload helper");
  assert.ok(section.includes("assetsUploadFile"), "upload action copy");
  assert.ok(section.includes("assetsUploading"), "uploading state");
  assert.ok(!section.includes("readAsDataURL"), "no base64 read");
  assert.ok(!section.includes("localStorage.setItem"), "no localStorage writes in section");

  const persistence = read(PERSISTENCE);
  assert.ok(persistence.includes("storagePath"), "persistence stores storagePath");
  assert.ok(!persistence.includes("base64"), "no base64 in persistence");

  const preview = read(PREVIEW_ASSETS);
  assert.ok(preview.includes("assetHasUploadedWithUrl"), "preview uploaded with URL");
  assert.ok(preview.includes("assetHasUploadedStorageOnly"), "preview storage-only");
  assert.ok(preview.includes("assetHasLocalFileMetadata"), "preview local pending");
  assert.ok(preview.includes("openUploadedFlyer") || preview.includes("openUploadedCoupon"), "uploaded link copy");

  assert.ok(!exists("app/api/ofertas-locales/publish"), "no publish API");
  assertNoMigration();

  const pkg = read("package.json");
  assert.ok(pkg.includes('"ofertas-locales:stack-6-storage-upload-audit"'), "package script");

  const changed = changedFiles();
  for (const nav of NAV_FILES) {
    assert.ok(!changed.includes(nav), `Nav must not change: ${nav}`);
  }
  assert.ok(!changed.some((f) => f.startsWith("app/admin/")), "no admin changes");
  assert.ok(!changed.some((f) => f.includes("app/(site)/dashboard/")), "no dashboard changes");

  console.log("Stack 6 — Ofertas Locales storage upload audit passed.");
}

run();
