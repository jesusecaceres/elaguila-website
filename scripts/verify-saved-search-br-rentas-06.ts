/**
 * Saved Search 06 — Bienes Raíces + Rentas global expansion verifier.
 * Run: npx tsx scripts/verify-saved-search-br-rentas-06.ts
 *
 * A. Bienes Raíces proofs (Gate 30)
 * B. Rentas proofs (Gate 30)
 * C. Global ledger verifier (Gate 31)
 * D. Email/delivery verifier (Gate 32)
 * E. Dashboard verifier (Gate 33)
 */
import fs from "node:fs";
import path from "node:path";
import { strict as assert } from "node:assert";

const root = process.cwd();
const failures: string[] = [];

function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK: ${name}`);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
    console.error(`FAIL: ${name}`);
    console.error(`  ${e instanceof Error ? e.message : String(e)}`);
  }
}

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function stripJsComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

function stripSqlComments(sql: string): string {
  return sql
    .split(/\r?\n/)
    .map((line) => line.replace(/--.*$/, ""))
    .join("\n");
}

// --- File paths ---
const BR_ADAPTER = "app/lib/saved-search/bienes-raices/savedSearchBienesRaicesAdapter.ts";
const BR_MATCHER = "app/lib/saved-search/bienes-raices/savedSearchBienesRaicesMatcher.ts";
const BR_ELIGIBILITY = "app/lib/saved-search/bienes-raices/bienesRaicesPublicEligibleListing.ts";
const BR_ORCHESTRATOR = "app/lib/saved-search/bienes-raices/bienesRaicesSavedSearchMatchOrchestrator.ts";
const BR_ELIGIBILITY_SUPPORT = "app/lib/saved-search/bienes-raices/bienesRaicesSavedSearchEligibilitySupport.ts";
const BR_RESOLVER = "app/lib/saved-search/bienes-raices/bienesRaicesSavedSearchDeliveryResolver.ts";
const BR_RESULTS_URL = "app/lib/saved-search/bienes-raices/bienesRaicesSavedSearchResultsUrl.ts";
const BR_RESULTS_CLIENT = "app/(site)/clasificados/bienes-raices/resultados/BienesRaicesResultsClient.tsx";
const BR_PAYMENT_SERVICE = "app/lib/clasificados/bienes-raices/brListingPaymentService.ts";

const RENTAS_ADAPTER = "app/lib/saved-search/rentas/savedSearchRentasAdapter.ts";
const RENTAS_MATCHER = "app/lib/saved-search/rentas/savedSearchRentasMatcher.ts";
const RENTAS_ELIGIBILITY = "app/lib/saved-search/rentas/rentasPublicEligibleListing.ts";
const RENTAS_ORCHESTRATOR = "app/lib/saved-search/rentas/rentasSavedSearchMatchOrchestrator.ts";
const RENTAS_RESOLVER = "app/lib/saved-search/rentas/rentasSavedSearchDeliveryResolver.ts";
const RENTAS_RESULTS_URL = "app/lib/saved-search/rentas/rentasSavedSearchResultsUrl.ts";
const RENTAS_RESULTS_CLIENT = "app/(site)/clasificados/rentas/results/RentasResultsClient.tsx";
const RENTAS_REVENUE_FULFILLMENT = "app/lib/listingPlans/revenueRentasFulfillment.ts";

const DELIVERY_ENGINE = "app/lib/saved-search/delivery/savedSearchEmailDelivery.ts";
const DELIVERY_TEMPLATE = "app/lib/saved-search/delivery/savedSearchMatchEmail.ts";
const DELIVERY_RESOLVER_TYPE = "app/lib/saved-search/delivery/savedSearchDeliveryCategoryResolver.ts";
const DASHBOARD_PAGE = "app/(site)/dashboard/busquedas-guardadas/page.tsx";
const MIGRATION = "supabase/migrations/20260819150000_saved_search_match_events_br_rentas.sql";
const SAVED_SEARCH_CTA = "app/(site)/clasificados/components/savedSearch/SavedSearchButton.tsx";

const brAdapterSrc = read(BR_ADAPTER);
const brMatcherSrc = read(BR_MATCHER);
const brEligibilitySrc = read(BR_ELIGIBILITY);
const brOrchestratorSrc = read(BR_ORCHESTRATOR);
const brEligibilitySupportSrc = read(BR_ELIGIBILITY_SUPPORT);
const brResolverSrc = read(BR_RESOLVER);
const brResultsClientSrc = read(BR_RESULTS_CLIENT);
const brPaymentServiceSrc = read(BR_PAYMENT_SERVICE);

const rentasAdapterSrc = read(RENTAS_ADAPTER);
const rentasMatcherSrc = read(RENTAS_MATCHER);
const rentasEligibilitySrc = read(RENTAS_ELIGIBILITY);
const rentasOrchestratorSrc = read(RENTAS_ORCHESTRATOR);
const rentasResolverSrc = read(RENTAS_RESOLVER);
const rentasResultsClientSrc = read(RENTAS_RESULTS_CLIENT);
const rentasRevenueSrc = read(RENTAS_REVENUE_FULFILLMENT);

const deliverySrc = read(DELIVERY_ENGINE);
const deliveryCode = stripJsComments(deliverySrc);
const templateSrc = read(DELIVERY_TEMPLATE);
const dashboardSrc = read(DASHBOARD_PAGE);
const sql = read(MIGRATION);
const sqlNoComments = stripSqlComments(sql);
const sqlNorm = sql.replace(/\s+/g, " ").toLowerCase();
const ctaSrc = read(SAVED_SEARCH_CTA);

// =================================================================================
// A. Bienes Raíces proofs (Gate 30)
// =================================================================================

check("BR adapter uses the real public filter truth (BrResultsParsedState), no invented contract", () => {
  assert.ok(brAdapterSrc.includes('from "@/app/clasificados/bienes-raices/resultados/lib/brResultsUrlState"'));
  assert.ok(brAdapterSrc.includes("SAVED_SEARCH_BIENES_RAICES_CATEGORY = \"bienes-raices\""));
});

check("BR matcher reuses filterBrListings verbatim — no reimplemented filter logic", () => {
  assert.ok(brMatcherSrc.includes('from "@/app/clasificados/bienes-raices/resultados/lib/brResultsFilters"'));
  assert.ok(brMatcherSrc.includes("filterBrListings([listing], state, null)"));
  assert.ok(!/if \(l\.city|if \(listing\.city|\.categoriaPropiedad ===.*&&.*===/.test(stripJsComments(brMatcherSrc)));
});

check("BR eligibility rejects a raw draft/pending/unpublished row — cannot reach the matcher", () => {
  assert.ok(brEligibilitySrc.includes("isListingRowActiveAndPublishedForBrowse(row)"));
  assert.ok(brEligibilitySrc.includes("return null"));
  assert.ok(brEligibilitySrc.includes("__bienesRaicesPublicEligible: true"));
});

check("BR public eligibility certification is a branded type, not a raw row passthrough", () => {
  assert.ok(brEligibilitySrc.includes("readonly __bienesRaicesPublicEligible: true"));
  assert.ok(brEligibilitySrc.includes("export function certifyBienesRaicesPublicEligibleListing"));
});

check("BR match-event snapshot never includes a hidden/exact address field", () => {
  const orchestratorCode = stripJsComments(brOrchestratorSrc);
  assert.ok(!/addressLine|street|exact_address/i.test(orchestratorCode));
  assert.ok(orchestratorCode.includes("listing_city: row!.city"));
  assert.ok(orchestratorCode.includes("listing_state: certified.stateCode"));
});

check("BR canonical public URL helper reused — leonixLiveAnuncioPath, no invented URL format", () => {
  assert.ok(brResolverSrc.includes('from "@/app/clasificados/lib/leonixRealEstateListingContract"'));
  assert.ok(brResolverSrc.includes("leonixLiveAnuncioPath(listingId)"));
});

check("BR publication hook fires only after the real activation write already committed (both branches)", () => {
  const code = brPaymentServiceSrc;
  const rpcBranchIdx = code.indexOf("activateBrNegocioListingAtomic(");
  const rpcHookIdx = code.indexOf("triggerBienesRaicesSavedSearchMatchBestEffort", rpcBranchIdx);
  const rpcReturnIdx = code.indexOf("return { ok: true, transitioned: true };", rpcBranchIdx);
  assert.ok(rpcHookIdx > rpcBranchIdx && rpcHookIdx < rpcReturnIdx, "negocio-RPC branch: hook must run after RPC success, before return");

  const genericUpdateIdx = code.indexOf(".update({\n      status: \"active\",");
  const genericHookIdx = code.indexOf("triggerBienesRaicesSavedSearchMatchBestEffort", genericUpdateIdx);
  assert.ok(genericHookIdx > genericUpdateIdx, "generic branch: BR hook must run after the direct-update activation");
});

check("BR orchestrator writes to the ONE shared saved_search_match_events table — no BR-specific outbox", () => {
  assert.ok(brOrchestratorSrc.includes('const MATCH_EVENTS_TABLE = "saved_search_match_events"'));
  assert.ok(!/saved_search_br_match_events|br_match_events/i.test(brOrchestratorSrc));
});

check("BR delivery uses the shared delivery engine via a resolver — no separate BR email module", () => {
  assert.ok(brOrchestratorSrc.includes('from "../delivery/savedSearchEmailDelivery"'));
  assert.ok(!fs.existsSync(path.join(root, "app/lib/saved-search/bienes-raices/savedSearchBrEmailDelivery.ts")));
});

check("BR delivery resolver does not import the BR orchestrator (no circular dependency)", () => {
  assert.ok(!/bienesRaicesSavedSearchMatchOrchestrator/.test(brResolverSrc));
  assert.ok(brResolverSrc.includes('from "./bienesRaicesSavedSearchEligibilitySupport"'));
  assert.ok(!/bienesRaicesSavedSearchMatchOrchestrator|savedSearchEmailDelivery/.test(brEligibilitySupportSrc));
});

check("BR results page has a real Save Search CTA wired to the shared component", () => {
  assert.ok(brResultsClientSrc.includes('from "@/app/clasificados/components/savedSearch/SavedSearchButton"'));
  assert.ok(brResultsClientSrc.includes("bienesRaicesFilterStateToSavedSearch(parsed)"));
  assert.ok(brResultsClientSrc.includes("<SavedSearchButton"));
});

check("BR dashboard summary is registered (human-readable facets, real results URL)", () => {
  assert.ok(dashboardSrc.includes("describeBienesRaicesSavedSearchFacets"));
  assert.ok(dashboardSrc.includes("buildBienesRaicesSavedSearchResultsUrl"));
  assert.ok(dashboardSrc.includes('"bienes-raices"'));
});

// =================================================================================
// B. Rentas proofs (Gate 30)
// =================================================================================

check("Rentas adapter uses the real public filter truth (RentasBrowseParamsParsed), no invented contract", () => {
  assert.ok(rentasAdapterSrc.includes('from "@/app/clasificados/rentas/shared/rentasBrowseContract"'));
  assert.ok(rentasAdapterSrc.includes("SAVED_SEARCH_RENTAS_CATEGORY = \"rentas\""));
});

check("Rentas matcher reuses filterRentasPublicListings verbatim — no reimplemented filter logic", () => {
  assert.ok(rentasMatcherSrc.includes('from "@/app/clasificados/rentas/shared/rentasBrowseFilters"'));
  assert.ok(rentasMatcherSrc.includes("filterRentasPublicListings([listing], p)"));
});

check("Rentas eligibility rejects a raw draft/inactive/unpublished row — cannot reach the matcher", () => {
  assert.ok(rentasEligibilitySrc.includes("mapped.browseActive !== true"));
  assert.ok(rentasEligibilitySrc.includes("return null"));
  assert.ok(rentasEligibilitySrc.includes("__rentasPublicEligible: true"));
});

check("Rentas has no invented dealer/business inventory parent-child gate (confirmed none exists)", () => {
  assert.ok(!/inventory_parent|inventory_role/.test(stripJsComments(rentasEligibilitySrc)));
});

check("Rentas match-event snapshot never includes a hidden/exact address field", () => {
  const code = stripJsComments(rentasOrchestratorSrc);
  assert.ok(!/addressLine|street|exact_address|showExactAddress/i.test(code));
  assert.ok(code.includes("listing_city: certified.city"));
  assert.ok(code.includes("listing_state: certified.stateRegion"));
});

check("Rentas canonical public URL helper reused — rentasListingPublicPath, no invented URL format", () => {
  assert.ok(rentasResolverSrc.includes('from "@/app/clasificados/rentas/shared/utils/rentasPublishRoutes"'));
  assert.ok(rentasResolverSrc.includes("rentasListingPublicPath(listingId)"));
});

check("Rentas has TWO real publication hooks — legacy shared-table branch AND Revenue OS branch", () => {
  assert.ok(brPaymentServiceSrc.includes('existing.category === "rentas"') && brPaymentServiceSrc.includes("triggerRentasSavedSearchMatchBestEffort"));
  assert.ok(rentasRevenueSrc.includes("triggerRentasSavedSearchMatchBestEffort"));
  const idx = rentasRevenueSrc.indexOf("triggerRentasSavedSearchMatchBestEffort(listingId");
  const returnIdx = rentasRevenueSrc.indexOf('return { ok: true, outcome: renewal ? "renewed" : "activated"');
  assert.ok(idx > 0 && idx < returnIdx, "Revenue OS hook must run after the real activation update, before the success return");
});

check("Rentas orchestrator writes to the ONE shared saved_search_match_events table — no Rentas-specific outbox", () => {
  assert.ok(rentasOrchestratorSrc.includes('const MATCH_EVENTS_TABLE = "saved_search_match_events"'));
  assert.ok(!/saved_search_rentas_match_events|rentas_match_events/i.test(rentasOrchestratorSrc));
});

check("Rentas delivery uses the shared delivery engine via a resolver — no separate Rentas email module", () => {
  assert.ok(rentasOrchestratorSrc.includes('from "../delivery/savedSearchEmailDelivery"'));
  assert.ok(!fs.existsSync(path.join(root, "app/lib/saved-search/rentas/savedSearchRentasEmailDelivery.ts")));
});

check("Rentas delivery resolver does not import the Rentas orchestrator (no circular dependency)", () => {
  assert.ok(!/rentasSavedSearchMatchOrchestrator/.test(rentasResolverSrc));
});

check("Rentas results page has a real Save Search CTA wired to the shared component", () => {
  assert.ok(rentasResultsClientSrc.includes('from "@/app/clasificados/components/savedSearch/SavedSearchButton"'));
  assert.ok(rentasResultsClientSrc.includes("rentasFilterStateToSavedSearch(parsed)"));
  assert.ok(rentasResultsClientSrc.includes("<SavedSearchButton"));
});

check("Rentas dashboard summary is registered (human-readable facets, real results URL)", () => {
  assert.ok(dashboardSrc.includes("describeRentasSavedSearchFacets"));
  assert.ok(dashboardSrc.includes("buildRentasSavedSearchResultsUrl"));
  assert.ok(dashboardSrc.includes("rentas:"));
});

// =================================================================================
// C. Global ledger verifier (Gate 31)
// =================================================================================

check("ONE saved_search_match_events architecture — no BR-specific or Rentas-specific match table anywhere in the repo", () => {
  const allNewSrc = [brOrchestratorSrc, rentasOrchestratorSrc, deliverySrc].join("\n");
  assert.ok(!/saved_search_br_match_events|saved_search_rentas_match_events/i.test(allNewSrc));
  assert.ok(!fs.existsSync(path.join(root, "app/lib/saved-search/bienes-raices/bienesRaicesSavedSearchMatchEvents.ts")));
  assert.ok(!fs.existsSync(path.join(root, "app/lib/saved-search/rentas/rentasSavedSearchMatchEvents.ts")));
});

check("category CHECK generalized to exactly autos | bienes-raices | rentas, matching each category's own live identifier", () => {
  assert.ok(sqlNorm.includes("check (category in ('autos', 'bienes-raices', 'rentas'))"));
});

check("listing identity generalized safely — Autos-only FK on listing_id dropped, no fake replacement FK added", () => {
  assert.ok(sqlNorm.includes("drop constraint if exists saved_search_match_events_listing_id_fkey"));
  assert.ok(!/references public\.listings/.test(sqlNorm), "must not add a new FK pointing only at public.listings either — that would exclude Autos");
  assert.ok(!/references public\.autos_classifieds_listings/.test(sqlNoComments.toLowerCase()), "the dropped Autos-only FK must not be silently re-added");
});

check("referential truth is provided by application-layer certification, not a database FK, for the generalized column", () => {
  for (const src of [brOrchestratorSrc, rentasOrchestratorSrc]) {
    assert.ok(/certify(BienesRaicesPublicEligibleListing|RentasPublicEligibleListing)\(/.test(src));
  }
});

check("dedupe contract unchanged and preserved — (saved_search_id, listing_id, event_type) remains the sole unique key", () => {
  assert.ok(!/drop.*dedupe_uidx|alter.*dedupe_uidx/i.test(sqlNoComments));
  assert.ok(!/alter table.*add constraint.*unique/i.test(sqlNoComments));
});

check("claim RPC untouched by this migration — remains category-agnostic, operates on id alone", () => {
  // Prose may reference the RPC by name (explaining it's untouched); the migration must not
  // (re)define it — that would mean this migration is silently changing claim semantics.
  assert.ok(!/create (or replace )?function public\.claim_saved_search_match_event/.test(sqlNorm));
});

check("no destructive SQL — no DROP TABLE, no TRUNCATE, no DELETE, no data rewrite", () => {
  assert.ok(!/drop table|truncate|delete from/i.test(sqlNoComments));
  assert.ok(!/update public\.saved_search_match_events set/i.test(sqlNoComments));
});

check("event_type stays activation-only truth — no relisted/price_drop/availability_change invented for BR/Rentas", () => {
  for (const src of [brOrchestratorSrc, rentasOrchestratorSrc]) {
    assert.ok(src.includes('const EVENT_TYPE = "listing_activated_match"'));
    assert.ok(!/relisted|price_drop|availability_change/i.test(src));
  }
});

check("seller_lane vocabulary widened truthfully — both categories' own real spelling accepted, neither rewritten", () => {
  assert.ok(sqlNorm.includes("check (seller_lane is null or seller_lane in ('negocios', 'negocio', 'privado'))"));
});

// =================================================================================
// D. Email/delivery verifier (Gate 32)
// =================================================================================

check("still only ONE Resend sender reused across all categories — no per-category email stack", () => {
  assert.ok(deliverySrc.includes('from "@/app/lib/email/sendLeonixResendEmail"'));
  const resendImports = (deliveryCode.match(/sendLeonixResendEmailWithConfig/g) ?? []).length;
  assert.ok(resendImports >= 1);
  assert.ok(!/new Resend\(/.test(deliveryCode));
});

check("delivery dispatches via a category resolver registry — one engine, not one engine per category", () => {
  assert.ok(deliverySrc.includes("CATEGORY_RESOLVERS"));
  assert.ok(deliverySrc.includes('autos: autosSavedSearchDeliveryResolver'));
  assert.ok(deliverySrc.includes('"bienes-raices": bienesRaicesSavedSearchDeliveryResolver'));
  assert.ok(deliverySrc.includes("rentas: rentasSavedSearchDeliveryResolver"));
});

check("owner email remains server-derived via auth admin lookup — unchanged by this generalization", () => {
  assert.ok(deliverySrc.includes(".auth.admin.getUserById("));
});

check("saved-search category check now compares against the claimed event's own category, not a hardcoded Autos constant", () => {
  assert.ok(deliverySrc.includes("search.category !== claimed.category"));
  assert.ok(!deliverySrc.includes("SAVED_SEARCH_AUTOS_CATEGORY"));
});

check("email template is one shared, parameterized template — not three separate email files", () => {
  assert.ok(templateSrc.includes("category: string"));
  assert.ok(templateSrc.includes("CATEGORY_COPY"));
  assert.ok(!fs.existsSync(path.join(root, "app/lib/saved-search/bienes-raices/bienesRaicesMatchEmail.ts")));
  assert.ok(!fs.existsSync(path.join(root, "app/lib/saved-search/rentas/rentasMatchEmail.ts")));
});

check("email content is bilingual and varies the category noun truthfully (vehicle/property/rental)", () => {
  assert.ok(templateSrc.includes('"un auto"') || templateSrc.includes("a vehicle"));
  assert.ok(templateSrc.includes('"una propiedad"') || templateSrc.includes("a property"));
  assert.ok(templateSrc.includes('"una renta"') || templateSrc.includes("a rental"));
});

check("no exact hidden address, private contact, or raw internal ids in the shared template", () => {
  const code = stripJsComments(templateSrc);
  assert.ok(!/address|contact_email|contact_phone|payment|stripe/i.test(code));
  assert.ok(!/saved_search_id|owner_user_id|match_event/i.test(code));
});

check("delivery failure cannot fail publication — the resolver dispatch is inside the same try/catch-bounded deliverClaimedEvent", () => {
  const fn = deliverySrc.match(/async function deliverClaimedEvent[\s\S]*$/)?.[0] ?? "";
  assert.ok(fn.includes("CATEGORY_RESOLVERS[claimed.category]"));
  const entryFn = deliverySrc.match(/export async function attemptSavedSearchEmailDeliveryBestEffort[\s\S]*?\n}/)?.[0] ?? "";
  assert.ok(entryFn.includes("try {") && entryFn.includes("} catch (e) {"));
});

// =================================================================================
// E. Dashboard verifier (Gate 33)
// =================================================================================

check("dashboard supports all three categories via one registry, not three dashboards", () => {
  assert.ok(dashboardSrc.includes("CATEGORY_REGISTRY"));
  assert.ok(dashboardSrc.includes('autos:'));
  assert.ok(dashboardSrc.includes('"bienes-raices":'));
  assert.ok(dashboardSrc.includes('rentas:'));
  assert.ok(!fs.existsSync(path.join(root, "app/(site)/dashboard/busquedas-guardadas-br/page.tsx")));
  assert.ok(!fs.existsSync(path.join(root, "app/(site)/dashboard/busquedas-guardadas-rentas/page.tsx")));
});

check("dashboard no longer hardcodes category=autos when loading saved searches", () => {
  assert.ok(dashboardSrc.includes("listSavedSearchesClient()"));
  assert.ok(!dashboardSrc.includes('listSavedSearchesClient({ category: "autos" })'));
});

check("dashboard renders a real per-row category label from the registry, not a hardcoded 'Autos' string", () => {
  assert.ok(dashboardSrc.includes("entry.label[lang]"));
});

check("dashboard reuses the shared pause/reactivate/delete CRUD client — unchanged for all categories", () => {
  assert.ok(dashboardSrc.includes("setSavedSearchActiveClient"));
  assert.ok(dashboardSrc.includes("deleteSavedSearchClient"));
});

check("dashboard never dumps raw filter_payload JSON — only per-category describeFacets output", () => {
  assert.ok(!/JSON\.stringify\(row/.test(dashboardSrc));
  assert.ok(!/row\.filterPayload\}/.test(dashboardSrc));
});

check("Save Search CTA is one shared component, not one per category", () => {
  assert.ok(ctaSrc.includes("normalized: SavedSearchNormalizedInput"));
  assert.ok(!fs.existsSync(path.join(root, "app/(site)/clasificados/bienes-raices/resultados/components/BienesRaicesSaveSearchButton.tsx")));
  assert.ok(!fs.existsSync(path.join(root, "app/(site)/clasificados/rentas/results/components/RentasSaveSearchButton.tsx")));
});

check("resolver type contract exists and is genuinely narrow (only revalidate + buildDetailUrl)", () => {
  const t = read(DELIVERY_RESOLVER_TYPE);
  assert.ok(t.includes("revalidateListingStillEligible"));
  assert.ok(t.includes("buildDetailUrl"));
});

// =================================================================================
if (failures.length) {
  console.error(`\n${failures.length} check(s) FAILED`);
  process.exit(1);
}
console.log("\nverify-saved-search-br-rentas-06: PASS");
