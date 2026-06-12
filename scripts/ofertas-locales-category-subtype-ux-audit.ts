/**
 * Ofertas Locales category + subtype UX audit.
 * Run: npm run ofertas-locales:category-subtype-ux-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const PLAN = "app/lib/ofertas-locales/OFERTAS_LOCALES_CATEGORY_SUBTYPE_UX_PLAN.md";
const UX = "app/lib/ofertas-locales/ofertasLocalesBusinessCategoryUx.ts";
const CONSTANTS = "app/lib/ofertas-locales/ofertasLocalesConstants.ts";
const APP = "app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx";
const PUBLISH = "app/lib/ofertas-locales/ofertasLocalesPublishMapper.ts";
const VALIDATION = "app/lib/ofertas-locales/ofertasLocalesValidation.ts";

const FORBIDDEN_PATHS = [
  /^app\/admin\//,
  /^app\/\(site\)\/dashboard\//,
  /stripe/i,
  /^app\/api\/ofertas-locales\/public/,
  /^supabase\/migrations\//,
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
  assert.ok(exists(PLAN), "category/subtype UX plan must exist");
  assert.ok(exists(UX), "business category UX module must exist");

  const ux = read(UX);
  const constants = read(CONSTANTS);
  const app = read(APP);
  const publish = read(PUBLISH);
  const validation = read(VALIDATION);

  assert.match(ux, /OFERTAS_LOCALES_BUSINESS_SUBCATEGORY_OPTIONS_BY_CATEGORY/, "conditional subtype map");
  assert.match(ux, /automotive_services/, "automotive primary category");
  assert.match(ux, /value: "tire_shop"[\s\S]*Llantera/, "tire shop as automotive subtype");

  const businessSection = constants.slice(
    constants.indexOf("OFERTAS_LOCALES_BUSINESS_CATEGORY_OPTIONS"),
    constants.indexOf("OFERTAS_LOCALES_MARKET_TYPE_OPTIONS")
  );
  assert.ok(!businessSection.includes('value: "tire_shop"'), "tire_shop must not be a primary category");
  assert.ok(!businessSection.includes("Llantera"), "Llantera must not be a primary category label");
  assert.match(constants, /automotive_services/, "automotive services in primary options");
  assert.match(constants, /other_business/, "other business in primary options");

  assert.match(app, /getSubtypeOptionsForBusinessCategory/, "conditional subtype options in app");
  assert.match(app, /businessCategoryShowsSubtypeDropdown/, "conditional subtype visibility");
  assert.match(app, /buildBusinessCategoryChangePatch/, "category change resets incompatible subtype");
  assert.match(app, /businessCategoryUsesCustomTypeText/, "other business custom text");
  assert.ok(
    !app.includes("OFERTAS_LOCALES_MARKET_TYPE_OPTIONS"),
    "global market type options must not be used in application client"
  );

  assert.match(ux, /Tipo de mercado/, "Spanish market subtype label");
  assert.match(ux, /Market type/, "English market subtype label");
  assert.match(ux, /Tipo de comida/, "Spanish cuisine label");
  assert.match(ux, /Cuisine type/, "English cuisine label");
  assert.match(ux, /Tipo de servicio automotriz/, "Spanish automotive label");
  assert.match(ux, /Automotive service type/, "English automotive label");

  assert.match(publish, /normalizeOfertaLocalDraftCategoryFields/, "publish normalizes category");
  assert.match(publish, /business_category/, "publish stores business_category");
  assert.match(publish, /market_type/, "publish stores market_type");
  assert.match(publish, /customMarketType/, "publish documents custom market type in metadata");

  assert.match(validation, /businessCategory/, "validation requires primary category");
  assert.match(validation, /other_business/, "validation for other business");

  for (const file of changedFiles()) {
    if (file.startsWith(".next/")) continue;
    if (!exists(file)) continue;
    if (FORBIDDEN_PATHS.some((re) => re.test(file))) {
      throw new Error(`Forbidden file changed: ${file}`);
    }
  }

  console.log("ofertas-locales category/subtype UX audit passed");
}

run();
