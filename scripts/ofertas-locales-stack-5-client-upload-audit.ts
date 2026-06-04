/**
 * Stack 5 — Ofertas Locales client upload shell static audit.
 * Run: npm run ofertas-locales:stack-5-client-upload-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const AUDIT_DOC = "app/lib/ofertas-locales/OFERTAS_LOCALES_STACK_5_CLIENT_UPLOAD_SHELL_AUDIT.md";
const VALIDATION = "app/lib/ofertas-locales/ofertasLocalesClientUploadValidation.ts";
const ASSET_SECTION = "app/(site)/publicar/ofertas-locales/OfertasLocalesDraftAssetSection.tsx";
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
  "readAsDataURL",
  "base64",
  "localStorage.setItem",
] as const;

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

  const validation = read(VALIDATION);
  assert.ok(validation.includes("export function validateOfertaLocalClientAssetFile"), "validation helper");
  assert.ok(validation.includes("export function getOfertaLocalAssetTypeFromFile"), "type mapper");
  assert.ok(validation.includes("export function formatOfertaLocalFileSize"), "file size formatter");

  const constants = read("app/lib/ofertas-locales/ofertasLocalesConstants.ts");
  assert.ok(constants.includes("OFERTAS_LOCALES_CLIENT_UPLOAD_MAX_FLYER_MB"), "flyer max MB");
  assert.ok(constants.includes("OFERTAS_LOCALES_CLIENT_UPLOAD_FLYER_MIME_TYPES"), "flyer MIME");
  assert.ok(constants.includes("OFERTAS_LOCALES_CLIENT_UPLOAD_COUPON_MIME_TYPES"), "coupon MIME");

  const section = read(ASSET_SECTION);
  assert.ok(section.includes('type="file"'), "file input enabled");
  assert.ok(section.includes("validateOfertaLocalClientAssetFile"), "uses validation");
  assert.ok(section.includes("revokeObjectURL"), "revokes object URLs");
  assert.ok(section.includes("createObjectURL"), "session preview URLs");
  assert.ok(!section.includes('type="file"\n              disabled'), "file input not disabled");

  const preview = read(PREVIEW_ASSETS);
  assert.ok(preview.includes("assetHasLocalFileMetadata"), "preview local file metadata");
  assert.ok(preview.includes("selectedFilePendingMessage"), "upload pending copy");

  const bundle = `${validation}\n${section}\n${preview}`;
  assertNoForbidden(bundle, "Stack 5 bundle");

  assert.ok(!exists("app/api/ofertas-locales"), "No API route");
  assertNoMigration();

  const pkg = read("package.json");
  assert.ok(pkg.includes('"ofertas-locales:stack-5-client-upload-audit"'), "package script");

  const changed = changedFiles();
  for (const nav of NAV_FILES) {
    assert.ok(!changed.includes(nav), `Nav must not change: ${nav}`);
  }

  console.log("Stack 5 — Ofertas Locales client upload shell audit passed.");
}

run();
