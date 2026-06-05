/**
 * Stack 6.5A — Ofertas Locales product logic cleanup static audit.
 * Run: npm run ofertas-locales:stack-6-5a-product-logic-cleanup-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const PLAN = "app/lib/ofertas-locales/OFERTAS_LOCALES_STACK_6_5A_PRODUCT_LOGIC_CLEANUP_PLAN.md";
const AUDIT_DOC = "app/lib/ofertas-locales/OFERTAS_LOCALES_STACK_6_5A_PRODUCT_LOGIC_CLEANUP_AUDIT.md";
const APP_CLIENT = "app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx";
const APP_COPY = "app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts";
const ASSET_SECTION = "app/(site)/publicar/ofertas-locales/OfertasLocalesDraftAssetSection.tsx";
const PREVIEW_CARD = "app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewCard.tsx";
const TYPES = "app/lib/ofertas-locales/ofertasLocalesTypes.ts";
const FACTORY = "app/lib/ofertas-locales/createEmptyOfertaLocalDraft.ts";
const PERSISTENCE = "app/lib/ofertas-locales/ofertasLocalesDraftPersistence.ts";
const HELPERS = "app/lib/ofertas-locales/ofertasLocalesApplicationHelpers.ts";

const APP_BUNDLE = [APP_CLIENT, APP_COPY, ASSET_SECTION, PREVIEW_CARD];

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

function assertNoForbiddenPhrases(source: string, label: string) {
  const forbidden = [
    "Socio de recogida de revista",
    "Interés en ser socio de recogida Leonix",
  ];
  for (const phrase of forbidden) {
    assert.ok(!source.includes(phrase), `${label} must not include: ${phrase}`);
  }
}

function assertNoNewMigration() {
  const dir = path.join(ROOT, "supabase", "migrations");
  if (!fs.existsSync(dir)) return;
  const changed = changedFiles();
  for (const f of fs.readdirSync(dir)) {
    if (!changed.includes(`supabase/migrations/${f}`)) continue;
    const content = fs.readFileSync(path.join(dir, f), "utf8");
    assert.ok(!content.toLowerCase().includes("ofertas_locales"), `New migration ${f} references ofertas_locales`);
  }
}

function run() {
  assert.ok(exists(PLAN), `${PLAN} must exist`);
  assert.ok(exists(AUDIT_DOC), `${AUDIT_DOC} must exist`);

  const types = read(TYPES);
  assert.ok(types.includes("customMarketType"), "customMarketType in types");
  assert.ok(types.includes("wantsAiSearchableSpecials"), "wantsAiSearchableSpecials in types");

  const factory = read(FACTORY);
  assert.ok(factory.includes("customMarketType"), "factory customMarketType");
  assert.ok(factory.includes("wantsAiSearchableSpecials"), "factory wantsAiSearchableSpecials");

  const persistence = read(PERSISTENCE);
  assert.ok(persistence.includes("customMarketType"), "persistence customMarketType");
  assert.ok(persistence.includes("wantsAiSearchableSpecials"), "persistence wantsAiSearchableSpecials");

  const helpers = read(HELPERS);
  assert.ok(helpers.includes("getOfertaLocalMarketDisplayLabel"), "market display helper");

  const app = read(APP_CLIENT);
  assert.ok(app.includes("customMarketType"), "app uses customMarketType");
  assert.ok(app.includes("wantsAiSearchableSpecials"), "app uses wantsAiSearchableSpecials");
  assert.ok(app.includes("leonixPartnerTitle") || app.includes("Leonix Partner"), "Leonix Partner callout");
  assert.ok(app.includes("OFERTAS_LOCALES_APPLICATION_DIGITAL_PRICING_KEYS"), "digital pricing keys");
  assert.ok(app.includes("formatOfertaLocalPhoneDisplay"), "phone formatting");
  assert.ok(!app.includes('label="Etiqueta CTA de membresía"'), "no membership CTA label field");
  assert.ok(!app.includes("Object.values(OFERTAS_LOCALES_PRICING)"), "no full pricing table");
  assert.ok(app.includes("quarterLocalDeals") === false && app.includes("Half Growth") === false, "no print packages in UI");

  const copy = read(APP_COPY);
  assert.ok(copy.includes("ofertasLocalesAppCopy"), "bilingual copy helper");

  const assets = read(ASSET_SECTION);
  assert.ok(
    assets.includes("fileReceived") || assets.includes("Archivo recibido") || assets.includes("uploadPending"),
    "asset confirmation copy"
  );

  const preview = read(PREVIEW_CARD);
  assert.ok(preview.includes("getOfertaLocalMarketDisplayLabel") || preview.includes("marketLabel"), "preview market label");
  assert.ok(preview.includes("wantsAiSearchableSpecials"), "preview AI intent");
  assert.ok(preview.includes("membershipCtaLabel(lang)"), "standard membership CTA");

  const bundle = APP_BUNDLE.map(read).join("\n");
  assertNoForbiddenPhrases(bundle, "Ofertas Locales app bundle");

  assert.ok(!exists("app/(site)/clasificados/ofertas-locales"), "no public results");
  assertNoNewMigration();

  const pkg = read("package.json");
  assert.ok(pkg.includes('"ofertas-locales:stack-6-5a-product-logic-cleanup-audit"'), "package script");

  const changed = changedFiles();
  for (const nav of NAV_FILES) {
    assert.ok(!changed.includes(nav), `Nav must not change: ${nav}`);
  }
  assert.ok(!changed.some((f) => f.startsWith("app/admin/")), "no admin changes");
  assert.ok(!changed.some((f) => f.includes("app/(site)/dashboard/")), "no dashboard changes");

  console.log("Stack 6.5A — Ofertas Locales product logic cleanup audit passed.");
}

run();
