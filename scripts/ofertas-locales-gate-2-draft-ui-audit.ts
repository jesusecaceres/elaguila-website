/**
 * Gate 2 — Ofertas Locales draft UI shell static audit.
 * Run: npm run ofertas-locales:gate-2-draft-ui-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const AUDIT_DOC = "app/lib/ofertas-locales/OFERTAS_LOCALES_GATE_2_DRAFT_UI_AUDIT.md";
const CLIENT = "app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx";

const ROUTE_FILES = [
  "app/(site)/publicar/ofertas-locales/page.tsx",
  CLIENT,
  "app/(site)/publicar/ofertas-locales/OfertasLocalesValidationPanel.tsx",
] as const;

const CLIENT_REQUIRED = [
  "validateOfertaLocalDraftForPreview",
  "validateOfertaLocalDraftForFuturePublish",
  "OFERTAS_LOCALES_PRICING",
  "regularPriceMonthly",
  "pickupPartnerPriceMonthly",
  "membershipUrl",
  "membershipCtaLabel",
  "requiresMembershipForDeals",
  "digitalCouponUrl",
  "digitalCouponNote",
  "isMagazinePickupPartner",
  "magazineDistributionStatus",
  "magazinePickupNotes",
  "magazineMonthlyDropEstimate",
  "previewDisabled",
  "publishDisabled",
  "useOfertasLocalesDraft",
] as const;

const CLIENT_FORBIDDEN = [
  "fetch('/api",
  'fetch("/api',
  ".from(",
  "supabase",
  "insert(",
  "upsert(",
  "stripe",
  "checkout",
  "Stripe",
] as const;

const NAV_FILES = [
  "app/components/Navbar.tsx",
  "app/components/AdvertiseDropdown.tsx",
] as const;

const FORBIDDEN_PATHS = ["app/api/ofertas-locales"] as const;

const ALLOWED_PREFIXES = [
  "app/(site)/publicar/ofertas-locales/",
  "app/lib/ofertas-locales/",
  "scripts/ofertas-locales-gate-2-draft-ui-audit.ts",
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
    assert.ok(
      !content.toLowerCase().includes("ofertas_locales"),
      `Migration ${f} must not reference ofertas_locales`
    );
  }
}

function assertNavUntouchedByGate(changed: string[]) {
  for (const nav of NAV_FILES) {
    if (changed.includes(nav)) {
      assert.fail(`Header/nav file must not be changed by Gate 2: ${nav}`);
    }
  }
}

function run() {
  assert.ok(exists(AUDIT_DOC), `${AUDIT_DOC} must exist`);

  const audit = read(AUDIT_DOC);
  assert.ok(audit.includes("Gate 2"), "Audit doc must reference Gate 2");
  assert.ok(audit.includes("PublishAuthGateLayout"), "Audit doc must note auth inheritance");
  assert.ok(audit.includes("TRUE/FALSE"), "Audit doc must include TRUE/FALSE checklist");

  for (const f of ROUTE_FILES) {
    assert.ok(exists(f), `Missing route file: ${f}`);
  }

  const client = read(CLIENT);
  for (const pattern of CLIENT_REQUIRED) {
    assert.ok(client.includes(pattern), `Client must include: ${pattern}`);
  }
  for (const pattern of CLIENT_FORBIDDEN) {
    assert.ok(!client.includes(pattern), `Client must not include: ${pattern}`);
  }

  assert.ok(
    read("app/lib/ofertas-locales/useOfertasLocalesDraft.ts").includes("createEmptyOfertaLocalDraft"),
    "Draft hook must use createEmptyOfertaLocalDraft"
  );
  assert.ok(
    read("app/lib/ofertas-locales/ofertasLocalesDraftPersistence.ts").includes(
      "leonix:ofertas-locales:draft:v1"
    ),
    "Draft persistence must use leonix:ofertas-locales:draft:v1 key"
  );

  for (const forbidden of FORBIDDEN_PATHS) {
    assert.ok(!exists(forbidden), `Forbidden path must not exist: ${forbidden}`);
  }

  assertNoOfertasLocalesMigration();

  const pkg = read("package.json");
  assert.ok(
    pkg.includes('"ofertas-locales:gate-2-draft-ui-audit"'),
    "package.json must include ofertas-locales:gate-2-draft-ui-audit script"
  );

  const changed = changedFiles();
  assertNavUntouchedByGate(changed);

  const disallowed = changed.filter((p) => !isAllowedPath(p));
  if (disallowed.length > 0) {
    console.warn(
      "Warning: changed files outside Gate 2 allowlist (may be pre-existing dirty work):",
      disallowed
    );
  }

  console.log("Gate 2 — Ofertas Locales draft UI audit passed.");
  console.log(`  Route: /publicar/ofertas-locales`);
  console.log(`  Audit doc: ${AUDIT_DOC}`);
  console.log("  Auth: inherits PublishAuthGateLayout from /publicar layout");
}

run();
