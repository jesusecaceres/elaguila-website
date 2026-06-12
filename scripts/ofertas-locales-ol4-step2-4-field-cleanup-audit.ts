/**
 * Gate OL-4 — Ofertas Locales Step 2–4 field cleanup audit.
 * Run: npm run ofertas-locales:ol4-step2-4-field-cleanup-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const PLAN = "app/lib/ofertas-locales/OFERTAS_LOCALES_OL4_STEP2_4_FIELD_CLEANUP_PLAN.md";
const AUDIT = "app/lib/ofertas-locales/OFERTAS_LOCALES_OL4_STEP2_4_FIELD_CLEANUP_AUDIT.md";
const APP = "app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx";
const COPY = "app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts";
const EMPTY = "app/lib/ofertas-locales/createEmptyOfertaLocalDraft.ts";
const PERSIST = "app/lib/ofertas-locales/ofertasLocalesDraftPersistence.ts";
const VALIDATION = "app/lib/ofertas-locales/ofertasLocalesValidation.ts";
const FORMAT = "app/lib/ofertas-locales/ofertasLocalesFormatting.ts";
const PREVIEW_HELPERS = "app/lib/ofertas-locales/ofertasLocalesPreviewHelpers.ts";
const PREVIEW_COPY = "app/(site)/publicar/ofertas-locales/preview/ofertasLocalesPreviewCopy.ts";
const PACKAGE = "package.json";

const FORBIDDEN = [
  /^app\/admin\//,
  /^app\/\(site\)\/dashboard\//,
  /stripe/i,
  /^supabase\/migrations\//,
  /^database\/migrations\//,
  /^app\/\(site\)\/clasificados\/ofertas-locales\//,
  /^app\/api\/ofertas-locales\/scan/,
  /OfertasLocalesDraftAssetSection/,
  /OfertasLocalesAiScan/,
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
      .filter(Boolean);
  } catch {
    tracked = [];
  }
  try {
    untracked = execSync("git ls-files --others --exclude-standard", { cwd: ROOT, encoding: "utf8" })
      .split(/\r?\n/)
      .filter(Boolean);
  } catch {
    untracked = [];
  }
  return [...new Set([...tracked, ...untracked])].map((x) => x.replace(/\\/g, "/"));
}

function run() {
  assert.ok(exists(PLAN), "OL-4 plan must exist");
  assert.ok(exists(AUDIT), "OL-4 audit must exist");

  const app = read(APP);
  const copy = read(COPY);
  const empty = read(EMPTY);
  const persist = read(PERSIST);
  const validation = read(VALIDATION);
  const format = read(FORMAT);
  const previewHelpers = read(PREVIEW_HELPERS);
  const previewCopy = read(PREVIEW_COPY);
  const pkg = read(PACKAGE);

  assert.match(copy, /step2OfferTitleLabel|Título de la oferta/, "Step 2 offer title ES");
  assert.match(copy, /step2PromotionTitleLabel|Título de la promoción/, "Step 2 promotion title ES");
  assert.ok(copy.includes("step2OfferTitleLabel") && copy.includes("Offer title"), "Step 2 offer title EN");
  assert.match(app, /step2OfferTitleLabel|step2PromotionTitleLabel/, "Step 2 uses lane title labels");
  assert.doesNotMatch(app, /laneShoppingFlyerTitleLabel/, "Step 3 must not render flyer title field");
  assert.doesNotMatch(app, /laneCouponPromotionTitleLabel/, "Step 3 must not duplicate promotion title field");
  assert.match(app, /laneShoppingSectionTitle|laneCouponSectionTitle/, "Step 3 section titles");
  assert.match(app, /type="date"/, "Step 3 dates remain");

  assert.match(empty, /city:\s*""/, "Fresh city empty");
  assert.doesNotMatch(empty, /city:\s*["']sa["']/, "No sa city default");
  assert.doesNotMatch(app, /value=\{[^}]*San Jose|value=\{[^}]*["']sa["']/i, "No hardcoded city value");

  assert.match(app, /type="text"[\s\S]*zipCode|zipCode[\s\S]*type="text"/, "ZIP uses text input");
  assert.doesNotMatch(app, /zipCode[\s\S]{0,200}inputMode="numeric"/, "ZIP must not use numeric inputMode");
  assert.match(format, /normalizeOfertaLocalZipInput/, "ZIP string normalization");
  assert.match(format, /replace\(\/\\D\/g/, "ZIP strips non-digits only");
  assert.match(validation, /zipCode|length !== 5|length === 5/, "5-digit ZIP validation");

  assert.doesNotMatch(validation, /serviceZipCodes[\s\S]*obligatorio|serviceZip.*required/i, "Service ZIP not required");
  assert.doesNotMatch(app, /ZIPs de servicio|Service ZIP codes/, "Service ZIP hidden from UI");

  assert.doesNotMatch(app, /URL de mapa \/ direcciones|Directions \/ map URL/, "Map URL hidden from UI");
  assert.match(validation, /validateOptionalUrlField\(issues, "directionsUrl"/, "Directions URL optional when present");

  assert.match(format, /buildOfertaLocalGoogleMapsSearchUrl/, "Generated directions helper");
  assert.match(format, /google\.com\/maps\/search/, "Safe Google Maps search URL");
  assert.match(previewHelpers, /buildOfertaLocalGoogleMapsSearchUrl/, "Preview uses generated directions");
  assert.doesNotMatch(format, /routes\.googleapis\.com/i, "No Google Routes API endpoint");

  assert.match(persist, /sessionStorage/, "OL-2 persistence intact");
  assert.match(persist, /migrateOfertaLocalDraftFields/, "Field migration on load/save");
  assert.match(persist, /clearLegacyLocalStorageDraft/, "Legacy localStorage guard");

  assert.match(previewCopy, /Volver a editar/, "Preview back CTA ES");
  assert.match(previewCopy, /Back to edit/, "Preview back CTA EN");

  assert.match(pkg, /ofertas-locales:ol4-step2-4-field-cleanup-audit/, "package script wired");

  for (const file of changedFiles()) {
    if (FORBIDDEN.some((re) => re.test(file))) {
      assert.fail(`Forbidden file changed: ${file}`);
    }
  }

  console.log("Gate OL-4 — Ofertas Locales Step 2–4 field cleanup audit passed.");
}

run();
