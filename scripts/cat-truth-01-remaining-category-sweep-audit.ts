/**
 * CAT-TRUTH-01 — Remaining category truth sweep static audit.
 * Run: npm run cat-truth:remaining-category-sweep
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const AUDIT = "app/lib/website-audit/CAT_TRUTH_01_REMAINING_CATEGORY_SWEEP.md";
const OPS = "app/admin/_lib/classifiedsOpsContract.ts";
const REGISTRY = "app/lib/clasificados/clasificadosCategoryRegistry.ts";
const MONETIZATION = "app/lib/listingPlans/categoryListingMonetization.ts";
const ANALYTICS_ID = "app/lib/analytics/listingAnalyticsIdentity.ts";
const QUEUE_META = "app/admin/(dashboard)/workspace/clasificados/_lib/clasificadosQueueSurfaceMeta.ts";

const CATEGORY_SECTIONS = [
  "En Venta / Varios",
  "Rentas",
  "Bienes Raíces",
  "Clases",
  "Comunidad / Eventos",
  "Busco / Se busca",
  "Mascotas / Perdidos",
  "Restaurantes",
  "Servicios",
  "Autos",
  "Empleos",
  "Viajes / Travel",
  "Ofertas Locales",
  "Other active surfaces",
] as const;

const OPS_SLUGS_REQUIRED = [
  "restaurantes",
  "servicios",
  "comida-local",
  "empleos",
  "autos",
  "rentas",
  "bienes-raices",
  "en-venta",
  "comunidad",
  "clases",
  "mascotas-y-perdidos",
  "travel",
] as const;

const SCAFFOLD_SLUGS = ["clases", "comunidad", "busco", "mascotas-y-perdidos"] as const;

const LIVE_ANALYTICS_WRAPPERS = [
  "recordRestaurantesGlobalAnalytics",
  "recordServiciosGlobalAnalytics",
  "recordEmpleosGlobalAnalytics",
  "trackComidaLocalListingEvent",
  "recordAutosGlobalAnalytics",
] as const;

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function exists(rel: string): boolean {
  return fs.existsSync(path.join(ROOT, rel.replace(/\//g, path.sep)));
}

function run() {
  assert.ok(exists(AUDIT), "CAT-TRUTH-01 audit doc must exist");

  const audit = read(AUDIT);
  const ops = read(OPS);
  const registry = read(REGISTRY);
  const monetization = read(MONETIZATION);
  const analyticsId = read(ANALYTICS_ID);
  const queueMeta = read(QUEUE_META);

  assert.ok(audit.includes("CAT-TRUTH-01"), "Gate title required");
  assert.ok(audit.includes("ADMIN_DASHBOARD_CLEANUP: TRUE"), "Admin cleanup recommendation required");
  assert.ok(audit.includes("Final recommendation: GREEN"), "GREEN recommendation required");

  for (const section of CATEGORY_SECTIONS) {
    assert.ok(audit.includes(section), `Category section required: ${section}`);
  }

  for (const slug of OPS_SLUGS_REQUIRED) {
    assert.ok(ops.includes(`slug: "${slug}"`), `Ops contract must include slug: ${slug}`);
  }

  assert.equal(ops.includes('slug: "busco"'), false, "Busco ops contract gap must remain documented (not silently added)");
  assert.ok(audit.includes("Busco") && audit.includes("MISSING") && audit.includes("CLASSIFIEDS_OPS_CONTRACTS"), "Busco contract gap documented");

  for (const slug of SCAFFOLD_SLUGS) {
    assert.ok(registry.includes(`"${slug}"`), `Registry must mention scaffold slug: ${slug}`);
    assert.ok(registry.includes("coming_soon") || registry.includes("scaffold"), "Registry scaffold posture");
    assert.ok(monetization.includes("NOT_CLIENT_READY"), "Monetization NOT_CLIENT_READY guard");
    assert.ok(monetization.includes(`"${slug}"`), `NOT_CLIENT_READY must include ${slug}`);
  }

  assert.ok(audit.includes("SCAFFOLD") && audit.includes("TRUE_REAL") && audit.includes("PARTIAL"), "Classification labels in doc");

  assert.ok(analyticsId.includes("listings"), "Analytics allowlist includes listings");
  assert.ok(analyticsId.includes("autos_classifieds_listings"), "Analytics allowlist includes autos");
  assert.ok(analyticsId.includes("comida_local_public_listings"), "Analytics allowlist includes comida local");

  for (const fn of LIVE_ANALYTICS_WRAPPERS) {
    assert.ok(exists(findWrapperPath(fn)), `Analytics wrapper must exist: ${fn}`);
  }

  assert.ok(queueMeta.includes('case "busco"'), "Queue meta must support busco admin");
  assert.ok(queueMeta.includes("public.listings"), "Queue meta listings table");

  assert.ok(audit.includes("ofertas_locales"), "Ofertas Locales status documented");
  assert.ok(audit.includes("MISSING") && audit.includes("public"), "Ofertas public gap documented");
  assert.ok(!audit.includes("Ofertas Locales") || audit.includes("Do not implement pipeline"), "Ofertas pipeline guard");

  assert.ok(exists("supabase/migrations/20260605120000_ofertas_locales.sql"), "Ofertas migration file exists (read-only proof)");
  assert.ok(exists("app/(site)/publicar/ofertas-locales/page.tsx"), "Ofertas publish route exists");

  assert.ok(exists("app/admin/(dashboard)/workspace/clasificados/_components/ListingsCategoryOpsQueuePage.tsx"), "Listings admin queue");
  assert.ok(exists("app/admin/(dashboard)/workspace/clasificados/_components/ClassifiedAdminRowActions.tsx"), "Admin row actions");

  assert.ok(read("package.json").includes('"cat-truth:remaining-category-sweep"'), "package.json script");

  console.log("CAT-TRUTH-01 remaining category sweep audit passed.");
  console.log(`Categories documented: ${CATEGORY_SECTIONS.length}`);
  console.log(`Ops contract slugs verified: ${OPS_SLUGS_REQUIRED.length}`);
}

function findWrapperPath(exportName: string): string {
  const candidates = [
    "app/(site)/clasificados/restaurantes/lib/recordRestaurantesGlobalAnalytics.ts",
    "app/(site)/clasificados/servicios/lib/recordServiciosGlobalAnalytics.ts",
    "app/(site)/clasificados/empleos/lib/recordEmpleosGlobalAnalytics.ts",
    "app/lib/clasificados/comida-local/comidaLocalAnalytics.ts",
    "app/(site)/clasificados/autos/lib/recordAutosGlobalAnalytics.ts",
  ];
  for (const c of candidates) {
    if (exists(c) && read(c).includes(exportName)) return c;
  }
  throw new Error(`Wrapper not found: ${exportName}`);
}

run();
