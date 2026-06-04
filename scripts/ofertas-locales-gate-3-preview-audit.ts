/**
 * Gate 3 — Ofertas Locales preview shell static audit.
 * Run: npm run ofertas-locales:gate-3-preview-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const AUDIT_DOC = "app/lib/ofertas-locales/OFERTAS_LOCALES_GATE_3_PREVIEW_AUDIT.md";
const PREVIEW_CLIENT = "app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewClient.tsx";
const PREVIEW_CARD = "app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewCard.tsx";
const DRAFT_CLIENT = "app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx";

const PREVIEW_FILES = [
  "app/(site)/publicar/ofertas-locales/preview/page.tsx",
  PREVIEW_CLIENT,
  PREVIEW_CARD,
] as const;

const PREVIEW_CLIENT_REQUIRED = [
  "useOfertasLocalesDraft",
  "hasOfertaLocalDraftContent",
  "emptyTitle",
  "/publicar/ofertas-locales",
] as const;

const PREVIEW_CARD_REQUIRED = [
  "previewNoticeEs",
  "requiresMembershipForDeals",
  "membershipUrl",
  "digitalCouponUrl",
  "isMagazinePickupPartner",
  "magazineDistributionStatus",
  "aiTeaser",
  "flyerPlaceholderEs",
  "publishDisabled",
] as const;

const PREVIEW_COPY_REQUIRED = [
  "This page is a preview and is not live yet",
  "Future upgrade: searchable item specials",
] as const;

const DRAFT_CLIENT_REQUIRED = ["/publicar/ofertas-locales/preview"] as const;

const FORBIDDEN_IN_PREVIEW = [
  "fetch('/api",
  'fetch("/api',
  "supabase",
  "insert(",
  "upsert(",
  "stripe",
  "checkout",
  "Stripe",
] as const;

const NAV_FILES = ["app/components/Navbar.tsx", "app/components/AdvertiseDropdown.tsx"] as const;

const ALLOWED_PREFIXES = [
  "app/(site)/publicar/ofertas-locales/",
  "app/lib/ofertas-locales/",
  "scripts/ofertas-locales-gate-3-preview-audit.ts",
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

function isAllowedPath(p: string): boolean {
  return ALLOWED_PREFIXES.some((prefix) => p === prefix || p.startsWith(prefix));
}

function assertNoOfertasLocalesMigration() {
  const migrationsDir = path.join(ROOT, "supabase", "migrations");
  if (!fs.existsSync(migrationsDir)) return;
  for (const f of fs.readdirSync(migrationsDir)) {
    const content = fs.readFileSync(path.join(migrationsDir, f), "utf8");
    assert.ok(!content.toLowerCase().includes("ofertas_locales"), `Migration ${f} references ofertas_locales`);
  }
}

function assertNavUntouched(changed: string[]) {
  for (const nav of NAV_FILES) {
    if (changed.includes(nav)) {
      assert.fail(`Header/nav file must not be changed by Gate 3: ${nav}`);
    }
  }
}

function assertNoForbidden(source: string, label: string) {
  for (const pattern of FORBIDDEN_IN_PREVIEW) {
    assert.ok(!source.includes(pattern), `${label} must not include: ${pattern}`);
  }
}

function run() {
  assert.ok(exists(AUDIT_DOC), `${AUDIT_DOC} must exist`);

  const audit = read(AUDIT_DOC);
  assert.ok(audit.includes("Gate 3"), "Audit doc must reference Gate 3");
  assert.ok(audit.includes("PublishAuthGateLayout"), "Audit doc must note auth inheritance");
  assert.ok(audit.includes("TRUE/FALSE"), "Audit doc must include TRUE/FALSE checklist");

  for (const f of PREVIEW_FILES) {
    assert.ok(exists(f), `Missing preview file: ${f}`);
  }

  const previewClient = read(PREVIEW_CLIENT);
  const previewCard = read(PREVIEW_CARD);
  const previewCopy = read("app/(site)/publicar/ofertas-locales/preview/ofertasLocalesPreviewCopy.ts");
  const draftClient = read(DRAFT_CLIENT);
  const previewBundle = `${previewClient}\n${previewCard}\n${draftClient}`;

  for (const pattern of PREVIEW_CLIENT_REQUIRED) {
    assert.ok(previewClient.includes(pattern), `Preview client must include: ${pattern}`);
  }
  for (const pattern of PREVIEW_CARD_REQUIRED) {
    assert.ok(previewCard.includes(pattern), `Preview card must include: ${pattern}`);
  }
  for (const pattern of PREVIEW_COPY_REQUIRED) {
    assert.ok(previewCopy.includes(pattern), `Preview copy must include: ${pattern}`);
  }
  for (const pattern of DRAFT_CLIENT_REQUIRED) {
    assert.ok(draftClient.includes(pattern), `Draft client must link to: ${pattern}`);
  }

  assertNoForbidden(previewBundle, "Preview/draft bundle");

  assert.ok(!exists("app/api/ofertas-locales"), "No app/api/ofertas-locales route");
  assertNoOfertasLocalesMigration();

  const pkg = read("package.json");
  assert.ok(pkg.includes('"ofertas-locales:gate-3-preview-audit"'), "package.json must include gate-3 script");

  const changed = changedFiles();
  assertNavUntouched(changed);

  const disallowed = changed.filter((p) => !isAllowedPath(p));
  if (disallowed.length > 0) {
    console.warn("Warning: files outside Gate 3 allowlist:", disallowed);
  }

  console.log("Gate 3 — Ofertas Locales preview audit passed.");
  console.log("  Route: /publicar/ofertas-locales/preview");
  console.log("  Auth: inherits PublishAuthGateLayout from /publicar layout");
}

run();
