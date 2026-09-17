/**
 * Servicios Golden receiver contracts for OCC intake.
 *
 * Source-level only: no network, no DB, no browser QA.
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-golden-receiver-contracts.ts
 *
 * Covers:
 *   SRV-GOLDEN-01  existingListingId fail-closed (never INSERT)
 *   SRV-GOLDEN-02  coupons_offers persist authority
 *   SRV-GOLDEN-03  customQuickFacts reverse map
 *   SRV-GOLDEN-04  reactivation authority on manage + publish
 *   DASH-53        hub detail Save + live result-card Save
 *   DASH-58/59/60  Saved Search adapter / matcher / dashboard registry
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";

const failures: string[] = [];
function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK: ${name}`);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
    console.error(`FAIL: ${name}\n  ${e instanceof Error ? e.message : String(e)}`);
  }
}
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}
const src = (rel: string) => stripComments(readFileSync(new URL(`../${rel}`, import.meta.url), "utf8"));
const raw = (rel: string) => readFileSync(new URL(`../${rel}`, import.meta.url), "utf8");

const PUBLISH = src("app/api/clasificados/servicios/publish/route.ts");
const MANAGE = src("app/api/clasificados/servicios/manage/route.ts");
const REVERSE = src("app/(site)/clasificados/publicar/servicios/lib/serviciosPublishedToApplicationDraft.ts");
const HUB = src("app/(site)/servicios/components/ServiciosBusinessHubEngagementRow.tsx");
const STRIP = src("app/(site)/servicios/components/ServiciosResultCardEngagementStrip.tsx");
const HORIZONTAL = src("app/(site)/clasificados/servicios/components/ServiciosHorizontalResultCard.tsx");
const PRO_CARD = src("app/(site)/clasificados/servicios/ServiciosProfessionalResultCard.tsx");
const LEGACY_CARD = src("app/(site)/clasificados/servicios/ServiciosListingResultCard.tsx");
const RESULTS = src("app/(site)/clasificados/servicios/resultados/page.tsx");
const IDENTITY = src("app/lib/serviciosSavedListingIdentity.ts");
const SAVE_BTN = src("app/components/clasificados/analytics/LeonixSaveButton.tsx");
const SAVE_RT = src("app/lib/savedListingsRuntime.ts");
const ADAPTER = src("app/lib/saved-search/servicios/savedSearchServiciosAdapter.ts");
const MATCHER = src("app/lib/saved-search/servicios/savedSearchServiciosMatcher.ts");
const DASHBOARD = src("app/(site)/dashboard/busquedas-guardadas/page.tsx");

check("SRV-GOLDEN-01 create: no existingListingId may INSERT", () => {
  const createElse = PUBLISH.slice(PUBLISH.indexOf("} else {", PUBLISH.indexOf("} else if (existingListingIdRaw)")));
  assert.match(createElse, /\.insert\(insertRow\)/);
  assert.match(PUBLISH, /slug = await allocateSlug\(baseSlug\)/);
});

check("SRV-GOLDEN-01 existing edit: UPDATE exact canonical UUID", () => {
  const idStart = PUBLISH.indexOf("if (existingListingIdRaw) {");
  const idBlock = PUBLISH.slice(idStart, PUBLISH.indexOf("} else {", idStart));
  assert.match(idBlock, /getServiciosPublicListingByIdFromDb\(existingListingIdRaw/);
  assert.match(idBlock, /canonicalListingId = resolvedId/);
  assert.match(idBlock, /slug = row\.slug/);
  assert.ok(!/allocateSlug\(/.test(idBlock), "declared edit must not allocate a create slug");
  assert.match(PUBLISH, /updateQuery\.eq\("id", canonicalListingId\)/);
});

check("SRV-GOLDEN-01 unresolved existing ID: fail closed, INSERT fallthrough NO", () => {
  const idStart = PUBLISH.indexOf("if (existingListingIdRaw) {");
  const idBlock = PUBLISH.slice(idStart, PUBLISH.indexOf("} else {", idStart));
  assert.match(idBlock, /error:\s*"listing_not_found"/);
  assert.match(idBlock, /status:\s*404/);
  assert.match(PUBLISH, /else if \(existingListingIdRaw\)/);
  assert.match(PUBLISH, /persistStage: "insert_forbidden"/);
  const persistStart = PUBLISH.indexOf("if (existing) {");
  const persistToInsert = PUBLISH.slice(persistStart, PUBLISH.indexOf(".insert(insertRow)"));
  assert.match(persistToInsert, /else if \(existingListingIdRaw\)/);
  assert.ok(
    persistToInsert.indexOf('error: "listing_not_found"') < persistToInsert.indexOf(".insert(") ||
      persistToInsert.includes("insert_forbidden"),
    "INSERT must be unreachable once existingListingId is declared",
  );
});

check("SRV-GOLDEN-02 coupons persist authority is coupons_offers", () => {
  assert.match(PUBLISH, /resolveBusinessToolsAccess\(\{/);
  assert.match(PUBLISH, /capability:\s*"coupons_offers"/);
});

check("SRV-GOLDEN-03 customQuickFacts reverse-map on edit hydration", () => {
  assert.match(REVERSE, /customQuickFacts:\s*mapCustomQuickFacts\(profile\)/);
});

check("SRV-GOLDEN-04 reactivation authority on manage + publish", () => {
  assert.match(MANAGE, /await resolveServiciosReactivationAuthority\(row\.id\)/);
  assert.match(PUBLISH, /await resolveServiciosReactivationAuthority\(existing\.id\)/);
});

check("DASH-53 detail Save: hub mounts shared LeonixSaveButton + extras", () => {
  assert.match(HUB, /<LeonixSaveButton/);
  assert.match(HUB, /serviciosSavedListingExtras\(/);
  assert.match(HUB, /serviciosGlobalSaveRecorder\(/);
  assert.match(HUB, /category="servicios"/);
  assert.match(IDENTITY, /source_table:\s*"servicios_public_listings"/);
  assert.match(SAVE_BTN, /upsertSavedListingForUser/);
  assert.match(SAVE_RT, /saved_listings/);
});

check("DASH-53 result Save: live cards mount the same shared Save engine", () => {
  assert.match(STRIP, /<LeonixSaveButton/);
  assert.match(STRIP, /serviciosSavedListingExtras\(/);
  assert.match(STRIP, /serviciosGlobalSaveRecorder\(/);
  assert.match(STRIP, /savedListingKey=\{sourceId \|\| undefined\}/);
  assert.match(STRIP, /category="servicios"/);
  assert.match(STRIP, /data-servicios-action-order="like,save,share"/);
  assert.ok(STRIP.indexOf("<ServiciosLikeEngagementCluster") < STRIP.indexOf("<LeonixSaveButton"));
  assert.ok(STRIP.indexOf("<LeonixSaveButton") < STRIP.indexOf("<LeonixShareButton"));
  assert.match(HORIZONTAL, /<ServiciosResultCardEngagementStrip/);
  assert.match(PRO_CARD, /<ServiciosResultCardEngagementStrip/);
  assert.match(RESULTS, /ServiciosHorizontalResultCard/);
  assert.ok(!LEGACY_CARD.includes("<LeonixSaveButton"), "dead listing card must not grow a second Save");
});

check("DASH-58/59/60 Saved Search: adapter + matcher + dashboard registry", () => {
  assert.match(ADAPTER, /export const SAVED_SEARCH_SERVICIOS_CATEGORY = "servicios"/);
  assert.match(ADAPTER, /payload\.state = state/);
  assert.match(ADAPTER, /payload\.zip = zip/);
  assert.match(ADAPTER, /payload\.country = country/);
  assert.match(MATCHER, /export function matchesServiciosSavedSearch/);
  assert.match(MATCHER, /savedSearchToServiciosFilterQuery/);
  assert.match(DASHBOARD, /servicios:\s*\{/);
  assert.match(DASHBOARD, /buildServiciosSavedSearchResultsUrl/);
});

check("no second Save backend", () => {
  const stripRaw = raw("app/(site)/servicios/components/ServiciosResultCardEngagementStrip.tsx");
  assert.ok(
    stripRaw.includes('from "@/app/components/clasificados/analytics/LeonixSaveButton"'),
    "result strip must import the shared LeonixSaveButton",
  );
  assert.ok(!STRIP.includes("upsertSavedListingForUser"), "result strip must not call the save runtime directly");
  assert.ok(!STRIP.includes("createSupabaseBrowserClient"), "result strip must not open a second client");
});

if (failures.length) {
  console.error(`\n${failures.length} check(s) FAILED`);
  process.exit(1);
}
console.log("\nverify-servicios-golden-receiver-contracts: PASS (10/10)");
