/**
 * FINAL CIRCUIT MATRIX GUARD (2026-09) — cheap SOURCE-GUARD checks so the two matrices
 *   docs/admin-os/PAID_CIRCUIT_MATRIX_2026-09.md   (Gate 7)
 *   docs/admin-os/FREE_CIRCUIT_MATRIX_2026-09.md   (Gate 8)
 * cannot silently rot. It only reads files (no imports of app code, no network, no DB, no build).
 *
 * Three groups:
 *  1. ANCHORS   — every lane's key files exist and still contain the function / column / status names the
 *                 docs cite. A FAIL means a doc row now points at code that moved: update the doc (or the code).
 *  2. INVARIANTS — the "proof" claims the docs make about paid-vs-free separation (free packages are not Stripe
 *                 eligible, no free lane client imports the checkout client, payment products the docs say exist).
 *  3. SENTINELS — each open DEFECT recorded in the docs. These never fail the run: if the defect's signature is
 *                 GONE the script prints "APPEARS FIXED" so the doc's Defects table can be updated.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-final-circuit-matrix.ts
 * Exit code 1 only when an ANCHOR/INVARIANT check fails.
 */
import { existsSync, readFileSync } from "node:fs";

const ROOT = new URL("../", import.meta.url);
const failures: string[] = [];
let okCount = 0;

function abs(rel: string): URL {
  return new URL(rel, ROOT);
}
function read(rel: string): string | null {
  const u = abs(rel);
  return existsSync(u) ? readFileSync(u, "utf8").split("\r\n").join("\n") : null;
}
function ok(msg: string) {
  okCount++;
  console.log(`OK: ${msg}`);
}
function fail(msg: string) {
  failures.push(msg);
  console.error(`FAIL: ${msg}`);
}

type Anchor = {
  lane: string;
  file: string;
  /** substrings (or regexes) that must still occur in the file */
  has: Array<string | RegExp>;
};

function matches(text: string, p: string | RegExp): boolean {
  return typeof p === "string" ? text.includes(p) : p.test(text);
}

function runAnchors(group: string, anchors: Anchor[]) {
  for (const a of anchors) {
    const text = read(a.file);
    if (text == null) {
      fail(`[${group}] ${a.lane}: file missing -> ${a.file}`);
      continue;
    }
    const missing = a.has.filter((p) => !matches(text, p));
    if (missing.length) {
      fail(`[${group}] ${a.lane}: ${a.file} no longer contains ${missing.map(String).join(" | ")}`);
    } else {
      ok(`[${group}] ${a.lane}: ${a.file} (${a.has.length} anchors)`);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────────
// 0. The docs themselves
// ─────────────────────────────────────────────────────────────────────────────────────────────────────
const PAID_DOC = "docs/admin-os/PAID_CIRCUIT_MATRIX_2026-09.md";
const FREE_DOC = "docs/admin-os/FREE_CIRCUIT_MATRIX_2026-09.md";

function checkDoc(rel: string, headings: string[]) {
  const t = read(rel);
  if (t == null) return fail(`doc missing -> ${rel}`);
  const missing = headings.filter((h) => !t.includes(h));
  if (missing.length) fail(`${rel} is missing sections: ${missing.join(", ")}`);
  else ok(`${rel} has all ${headings.length} required sections`);
}
checkDoc(PAID_DOC, [
  "Servicios",
  "Restaurantes",
  "Autos Dealer",
  "Autos Privado",
  "Empleos Quick",
  "Empleos Premium",
  "Rentas",
  "Bienes Ra",
  "FSBO",
  "Clases paid",
  "Comida Local",
  "Ofertas Locales",
  "Defects found",
  "br_agent_monthly pre-flight coverage",
]);
checkDoc(FREE_DOC, [
  "Empleos Feria",
  "Clases free",
  "Comunidad",
  "Busco",
  "Mascotas",
  "En Venta",
  "Restaurantes",
  "Defects found",
]);

// ─────────────────────────────────────────────────────────────────────────────────────────────────────
// 1a. PAID lane anchors (Gate 7)
// ─────────────────────────────────────────────────────────────────────────────────────────────────────
const PAID: Anchor[] = [
  // spine
  {
    lane: "spine/checkout",
    file: "app/api/revenue-os/checkout/route.ts",
    has: [
      "export async function POST",
      "requiresBaseCheckout",
      "active_entitlement_no_recharge",
      "already_published_no_recharge",
      "autos_listing_not_payable",
      "autos_listing_package_mismatch",
      "EMPLEOS_JOB_POST_PAID_PACKAGE_KEY",
      "viajes_checkout_not_available",
      "addon_retired_included_in_base",
      "payment_in_progress",
      "checkout_state_unverifiable",
      "packageRequiresRecurringConsent",
      "createRecurringConsentRecord",
      "computeCheckoutAttemptKey",
      "createPendingPaymentRecord",
      "createRevenueStripeCheckoutSession",
      "setAutosListingPendingPayment",
      "LISTINGS_PAID_BASE_CATEGORY",
      "validateOfertasLocalesCheckoutOwnership",
    ],
  },
  {
    lane: "spine/webhook",
    file: "app/api/revenue-os/webhook/route.ts",
    has: ["fulfillCheckoutSessionCompleted", "markCheckoutSessionExpired", "claimStripeEvent", "ensureSubscriptionRecordFromCheckoutSession", "handleInvoicePaid"],
  },
  {
    lane: "spine/fulfillment",
    file: "app/lib/listingPlans/revenueFulfillment.ts",
    has: [
      "export async function fulfillCheckoutSessionCompleted",
      "tryActivateServiciosListingAfterEntitlement",
      "tryActivateRestauranteListingAfterEntitlement",
      "tryActivateComidaLocalListingAfterEntitlement",
      "tryActivateAutosDealerListingAfterEntitlement",
      "tryActivateAutosPrivadoListingAfterEntitlement",
      "tryActivateEmpleosListingAfterEntitlement",
      "tryActivateRentasListingAfterEntitlement",
      "tryActivateBienesNegocioListingAfterEntitlement",
      "tryActivateBienesFsboListingAfterEntitlement",
      "tryActivateClasesListingAfterEntitlement",
      "tryFulfillOfertasLocalesParentAfterEntitlement",
      "activateEntitlementsForPayment",
      "amount_mismatch",
      "ofertas_metadata_contract_mismatch",
    ],
  },
  { lane: "spine/entitlement", file: "app/lib/listingPlans/revenueEntitlementFulfillment.ts", has: ["export async function activatePackageEntitlement", "export async function activateEntitlementsForPayment", "listing_package_entitlements", "extendEntitlementForInvoicePaid"] },
  { lane: "spine/payment-record", file: "app/lib/listingPlans/revenuePaymentRecords.ts", has: ["export async function createPendingPaymentRecord", "leonix_payment_records", "findOpenCheckoutAttempt", "markPaymentRecordPaid"] },
  { lane: "spine/subscription", file: "app/lib/listingPlans/revenueSubscriptionEvents.ts", has: ["ensureSubscriptionRecordFromCheckoutSession", "leonix_subscription_records"] },
  { lane: "spine/consent", file: "app/lib/listingPlans/recurringConsent.ts", has: ["packageRequiresRecurringConsent", "createRecurringConsentRecord", "leonix_billing_consents", "monthly_subscription"] },
  {
    lane: "spine/base-guard",
    file: "app/lib/listingPlans/revenueActiveEntitlementGuard.ts",
    has: ["REVENUE_BASE_ENTITLEMENT_GUARD_PACKAGE_KEYS", "autos_dealer_monthly", "br_agent_monthly", "restaurantes_base_monthly", "servicios_base_monthly", "comida_local_base_monthly", "requiresBaseCheckout"],
  },
  {
    lane: "spine/matrix",
    file: "app/lib/listingPlans/revenuePricingMatrix.ts",
    has: [
      "REVENUE_V1_PACKAGE_MATRIX",
      "servicios_base_monthly",
      "restaurantes_base_monthly",
      "comida_local_base_monthly",
      "autos_dealer_monthly",
      "autos_privado_30d",
      "br_agent_monthly",
      "br_fsbo_45d",
      "rentas_30d",
      "clases_paid_30d",
      "EMPLEOS_JOB_POST_PAID_PACKAGE_KEY",
      "OFERTAS_LOCALES_FLYER_30D_PACKAGE_KEY",
      "OFERTAS_LOCALES_COUPONS_30D_PACKAGE_KEY",
      "viajes_business_monthly",
    ],
  },
  { lane: "spine/validate", file: "app/lib/listingPlans/revenueCheckout.ts", has: ["export function validateRevenueCheckoutRequest", "listing_required", "package_not_stripe_eligible", "package_is_free", "EMPLEOS_JOB_FAIR_FREE_PACKAGE_KEY"] },
  { lane: "spine/client", file: "app/lib/listingPlans/revenueCategoryCheckoutClient.ts", has: ["startRevenueCategoryCheckout", "active_entitlement_no_recharge", "already_published_no_recharge"] },
  {
    lane: "spine/payloads",
    file: "app/lib/listingPlans/revenueCategoryCheckoutPayload.ts",
    has: ["SERVICIOS_BASE_CHECKOUT", "RESTAURANTES_BASE_CHECKOUT", "COMIDA_LOCAL_BASE_CHECKOUT", "AUTOS_DEALER_CHECKOUT", "AUTOS_PRIVADO_CHECKOUT", "BIENES_RAICES_NEGOCIO_CHECKOUT", "BIENES_RAICES_FSBO_CHECKOUT", "RENTAS_CATEGORY_CHECKOUT", "CLASES_CATEGORY_CHECKOUT", "EMPLEOS_PAID_JOB_CHECKOUT"],
  },
  { lane: "spine/dashboard-pending", file: "app/(site)/dashboard/lib/dashboardPendingPayment.ts", has: ["dashboardInventoryRowIsPubliclyLive", "isEmpleosDraftAwaitingPayment", "isRestauranteAwaitingPayment", "isAutosPrivadoAwaitingPayment", "isSharedListingsRowNotLive", "resolveSharedListingPaymentLane", "buildDashboardResumePaymentPayload"] },
  {
    lane: "spine/admin-live",
    file: "app/admin/_lib/adminLivePredicates.ts",
    has: ["isRentasRowPubliclyLive", "isBrRowPubliclyLive", "isGenericListingPubliclyLive", "isEmpleosRowPubliclyLive", "isServiciosRowPubliclyLive", "isRestauranteRowPubliclyLive", "isComidaLocalRowPubliclyLive", "isViajesRowPubliclyLive", "genericLiveSqlPlan"],
  },
  { lane: "spine/admin-live-autos", file: "app/admin/_lib/adminAutosLivePredicate.ts", has: ["isAutosRowPubliclyLive", "isAutosRowLiveRowLevel", "isAutosChildParentGateSatisfied"] },
  { lane: "spine/admin-live-ofertas", file: "app/admin/_lib/adminOfertasLivePredicate.ts", has: ["isOfertaPubliclyLive", "isOfertaLocalPublicOfferRowEligible"] },
  // Servicios
  { lane: "servicios/activator", file: "app/lib/listingPlans/revenueServiciosFulfillment.ts", has: ["activatePaidServiciosListingFromRevenueOs", "SERVICIOS_ACTIVATABLE_PRE_PUBLISH_STATUSES", "paused_unpublished", "servicios_public_listings"] },
  { lane: "servicios/publish", file: "app/api/clasificados/servicios/publish/route.ts", has: ["export async function POST", "decideServiciosOwnerSaveStatus", "isServiciosListingOwner", "payment_required", "pending_payment", "leonix_ad_id", "listing_not_found"] },
  { lane: "servicios/client", file: "app/(site)/clasificados/publicar/servicios/preview/ClasificadosServiciosPreviewClient.tsx", has: ["saveServiciosPendingBeforeCheckout", "SERVICIOS_BASE_CHECKOUT", "recurringConsent: ctx.recurringConsent"] },
  { lane: "servicios/save-client", file: "app/(site)/clasificados/publicar/servicios/lib/saveServiciosPendingBeforeCheckout.ts", has: ["saveServiciosPendingBeforeCheckout", "pending_payment"] },
  { lane: "servicios/public", file: "app/(site)/clasificados/servicios/lib/serviciosPublicListingsServer.ts", has: ["listServiciosPublicListingsFromDb", "getServiciosPublicListingBySlugFromDb", "getServiciosPublicListingByIdFromDb", "listServiciosPublicListingsAdminQueueFromDb"] },
  { lane: "servicios/owner-policy", file: "app/(site)/clasificados/servicios/lib/serviciosOwnerMutationPolicy.ts", has: ["decideServiciosOwnerSaveStatus", "isServiciosListingOwner"] },
  // Restaurantes
  { lane: "restaurantes/activator", file: "app/lib/listingPlans/revenueRestaurantFulfillment.ts", has: ["activatePaidRestauranteListingFromRevenueOs", "RESTAURANTE_ACTIVATABLE_PRE_PUBLISH_STATUSES", "restaurantes_public_listings"] },
  { lane: "restaurantes/publish", file: "app/api/clasificados/restaurantes/publish/route.ts", has: ["export async function POST", "resolveRestauranteOwnerEditTargetStatus", "allocateNextRestauranteLeonixAdId", "ownership_mismatch", "reconcileRestauranteFirstSave", "RESTAURANTE_PENDING_CHECKOUT_STATUS"] },
  { lane: "restaurantes/status-authority", file: "app/lib/clasificados/restaurantes/restauranteOwnerEditStatusAuthority.ts", has: ["resolveRestauranteOwnerEditTargetStatus", "restaurante_status_transition_not_allowed"] },
  { lane: "restaurantes/client", file: "app/(site)/clasificados/restaurantes/preview/RestaurantePreviewClient.tsx", has: ["saveRestaurantePendingBeforeCheckout", "RESTAURANTES_BASE_CHECKOUT", "recurringConsent: ctx.recurringConsent"] },
  { lane: "restaurantes/public", file: "app/(site)/clasificados/restaurantes/lib/restaurantesPublicListingsServer.ts", has: ["tryListRestaurantesPublicListingsFromDb", "getRestaurantePublicListingBySlugFromDb", "listRestaurantesPublicListingsAdminFromDb", ".eq(\"status\", \"published\")"] },
  { lane: "restaurantes/dashboard-edit", file: "app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx", has: ["saveExistingDashboardListing", "/api/clasificados/restaurantes/publish"] },
  // Autos
  {
    lane: "autos/service",
    file: "app/lib/clasificados/autos/autosClassifiedsListingService.ts",
    has: [
      "createAutosClassifiedsListing",
      "updateAutosClassifiedsListingDraft",
      "isAutosListingPayableStatus",
      "AUTOS_PAYABLE_LISTING_STATUSES",
      "setAutosListingPendingPayment",
      "tryActivateAutosListingAfterPayment",
      "tryRenewAutosPrivadoListingAfterPayment",
      "listActiveAutosClassifiedsRows",
      "getActiveLiveAutosBundle",
      "activateAutosDealerListingAtomic",
      "computeFixedDayRenewalExpiresAt",
    ],
  },
  { lane: "autos/dealer-activator", file: "app/lib/listingPlans/revenueAutosDealerFulfillment.ts", has: ["activatePaidAutosDealerListingFromRevenueOs", "grantAutosDealerInventoryPackAddOn", "publishNegociosBundleAdditionalVehicles"] },
  { lane: "autos/privado-activator", file: "app/lib/listingPlans/revenueAutosPrivadoFulfillment.ts", has: ["activatePaidAutosPrivadoListingFromRevenueOs", "tryRenewAutosPrivadoListingAfterPayment"] },
  { lane: "autos/rpc", file: "app/lib/listingPlans/capacityActivationRpc.ts", has: ["activateAutosDealerListingAtomic", "activateBrNegocioListingAtomic"] },
  { lane: "autos/listings-api", file: "app/api/clasificados/autos/listings/[id]/route.ts", has: ["export async function PATCH", "updateAutosClassifiedsListingDraft"] },
  { lane: "autos/restore", file: "app/api/clasificados/autos/listings/[id]/restore/route.ts", has: ["activateAutosDealerListingAtomic", "assertCommercialCapacityForWrite"] },
  { lane: "autos/confirm", file: "app/(site)/publicar/autos/shared/components/AutosPublishConfirmCore.tsx", has: ["AUTOS_PRIVADO_CHECKOUT", "AUTOS_DEALER_CHECKOUT", "bypassOnly: true", "no_bypass_available", "buildRecurringConsentAcknowledgment"] },
  { lane: "autos/negocios-preview", file: "app/(site)/clasificados/autos/negocios/preview/AutosNegociosPreviewClient.tsx", has: ["ensurePendingDealerListing", "startRevenueCategoryCheckout", "recurringConsent: ctx.recurringConsent"] },
  { lane: "autos/dashboard", file: "app/(site)/dashboard/lib/dashboardInventory.ts", has: ["fetchOwnerAutosClassifiedsListings", "buildAutosClassifiedsInventoryItems", "fetchOwnerEmpleosListings", "buildEmpleosInventoryItems", "fetchOwnerRestaurantListings", "buildRestaurantInventoryItems", "fetchOwnerServiciosListings", "buildServiciosInventoryItems"] },
  { lane: "autos/legacy-checkout", file: "app/api/clasificados/autos/checkout/route.ts", has: ["bypassOnly", "no_bypass_available", "requiresBaseCheckout", "getStripePriceIdForAutosLane"] },
  // Empleos
  { lane: "empleos/activator", file: "app/lib/listingPlans/revenueEmpleosFulfillment.ts", has: ["activatePaidEmpleosListingFromRevenueOs", "EMPLEOS_PENDING_CHECKOUT_STATUS", "lifecycle_status"] },
  { lane: "empleos/checkout-client", file: "app/(site)/publicar/empleos/shared/publish/empleosRevenueCheckout.ts", has: ["saveEmpleosDraftAndStartPaidJobCheckout", "EMPLEOS_PAID_JOB_CHECKOUT", "/api/clasificados/empleos/listings"] },
  { lane: "empleos/db", file: "app/(site)/clasificados/empleos/lib/empleosPublicListingsDbServer.ts", has: ["upsertEmpleosListingFromEnvelope", "fetchEmpleosPublishedJobRecords", "fetchEmpleosPublishedListingRowBySlug", "fetchEmpleosListingsForOwner", "resolveEmpleosUpsertLifecycle"] },
  { lane: "empleos/policy", file: "app/(site)/clasificados/empleos/lib/empleosPublishLifecyclePolicy.ts", has: ["resolveEmpleosUpsertLifecycle", "resolveEmpleosOwnerTransition", "isEmpleosFreeLane", "payment_required"] },
  { lane: "empleos/quick-preview", file: "app/(site)/clasificados/empleos/quick-preview/EmpleoQuickPreviewClient.tsx", has: ["saveEmpleosDraftAndStartPaidJobCheckout", "suppressListingBoundCheckout"] },
  { lane: "empleos/premium-preview", file: "app/(site)/clasificados/empleos/premium-preview/EmpleoPremiumPreviewClient.tsx", has: ["saveEmpleosDraftAndStartPaidJobCheckout", "suppressListingBoundCheckout", "buildEmpleosPublishEnvelopeFromPremium"] },
  // Rentas / BR / FSBO / Clases
  { lane: "rentas/activator", file: "app/lib/listingPlans/revenueRentasFulfillment.ts", has: ["activatePaidRentasListingFromRevenueOs", "computeFixedDayRenewalExpiresAt", "RENTAS_PENDING_CHECKOUT_STATUS"] },
  { lane: "rentas/edit", file: "app/api/clasificados/rentas/listing-edit/route.ts", has: ["export async function POST", "owner_mismatch", "wrong_category", "leonix_id_mismatch"] },
  { lane: "rentas/public", file: "app/(site)/clasificados/rentas/lib/fetchRentasPublicListingsForBrowse.ts", has: ["fetchRentasPublicListingsForBrowse"] },
  { lane: "rentas/visibility", file: "app/(site)/clasificados/rentas/lib/rentasPublicRowVisibility.ts", has: ["resolveListingLifecycle"] },
  { lane: "listings/publish-core", file: "app/(site)/clasificados/lib/leonixPublishRealEstateListingCore.ts", has: ["publishLeonixRealEstateListingCore", "buildListingsInsertRowForLeonixPublish", "pending_payment", "realEstatePendingLookupOrder", "pickAdoptableRealEstatePendingRow"] },
  { lane: "br-negocio/activator", file: "app/lib/listingPlans/revenueBienesNegocioFulfillment.ts", has: ["activatePaidBienesNegocioListingFromRevenueOs", "tryActivateBrListingAfterPayment", "BIENES_NEGOCIO_BASE_PACKAGE_KEY"] },
  { lane: "br-negocio/payment-service", file: "app/lib/clasificados/bienes-raices/brListingPaymentService.ts", has: ["tryActivateBrListingAfterPayment", "getBrListingById"] },
  { lane: "br-negocio/lifecycle", file: "app/lib/clasificados/bienes-raices/brListingLifecycleService.ts", has: ["applyBrActivatePending", "activateBrNegocioListingAtomic", "br_agent_monthly"] },
  { lane: "br-negocio/preview", file: "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/preview/AgenteIndividualResidencialPreviewClient.tsx", has: ["BIENES_RAICES_NEGOCIO_CHECKOUT", "recurringConsent: ctx?.recurringConsent", "listingBoundPreview", "startRevenueCategoryCheckout"] },
  { lane: "br-negocio/edit", file: "app/api/clasificados/bienes-raices/listing-edit/route.ts", has: ["export async function POST", "owner_mismatch", "lane_mismatch", "leonix_id_mismatch"] },
  { lane: "br-public", file: "app/(site)/clasificados/bienes-raices/lib/fetchBrPublishedListingsBrowser.ts", has: ["isBrFsboRowWithinTerm"] },
  { lane: "fsbo/activator", file: "app/lib/listingPlans/revenueBienesFsboFulfillment.ts", has: ["activatePaidBienesFsboListingFromRevenueOs", "BIENES_RAICES_FSBO_PACKAGE_KEY", "renewed"] },
  { lane: "fsbo/lifecycle", file: "app/lib/listingLifecycle/bienesFsboLifecycle.ts", has: ["isBrFsboRow", "isBrFsboRowWithinTerm"] },
  { lane: "fsbo/preview", file: "app/(site)/clasificados/bienes-raices/preview/privado/components/BienesRaicesPrivadoPreviewClient.tsx", has: ["savePendingFsboListing", "BIENES_RAICES_FSBO_CHECKOUT", "previewModeSuppressesBasePlanCheckout"] },
  { lane: "fsbo/status-api", file: "app/api/clasificados/bienes-raices/privado-status/route.ts", has: ["export async function POST"] },
  { lane: "clases/activator", file: "app/lib/listingPlans/revenueClasesFulfillment.ts", has: ["activatePaidClasesListingFromRevenueOs", "CLASES_PENDING_CHECKOUT_STATUS", "computeFixedDayRenewalExpiresAt"] },
  { lane: "clases/publisher", file: "app/(site)/publicar/community/shared/publish/publishCommunityQuickToListings.ts", has: ["publishCommunityQuickToListings", "activationMode", "pending_payment", "shouldBlockClasesPaidPublish", "verifyQuickListingReusable", "getOrCreateSessionPublishAttemptKey"] },
  { lane: "clases/bar", file: "app/(site)/publicar/community/shared/preview/CommunityQuickPreviewPublishBar.tsx", has: ["isPaidClases", "CLASES_CATEGORY_CHECKOUT", "startRevenueCategoryCheckout", "classCostType === \"pagada\""] },
  { lane: "clases/term", file: "app/lib/listingLifecycle/enforcedTermReadPredicate.ts", has: ["isListingRowWithinEnforcedTerm"] },
  { lane: "generic/mis-anuncios-editor", file: "app/(site)/dashboard/mis-anuncios/[id]/editar/page.tsx", has: ["applyOwnerListingPatch", "markStatus", "isBrFsboRow", "dashboardOwnerMayActivateFromStatus"] },
  { lane: "generic/mis-anuncios", file: "app/(site)/dashboard/mis-anuncios/page.tsx", has: ["renewListingsTableRepublish", "startPendingPayment", "startRentasRenewal", "startBienesFsboRenewal"] },
  // Comida
  { lane: "comida/activator", file: "app/lib/listingPlans/revenueComidaLocalFulfillment.ts", has: ["activatePaidComidaLocalListingFromRevenueOs", "COMIDA_LOCAL_ACTIVATABLE_PRE_PUBLISH_STATUSES", "comida_local_public_listings"] },
  { lane: "comida/publish", file: "app/api/clasificados/comida-local/publish/route.ts", has: ["export async function POST", "payment_required", "resolveComidaLocalOwnerEditTargetStatus", "allocateNextComidaLocalLeonixAdId", "ownership_mismatch", ".eq(\"draft_listing_id\", draftListingId)"] },
  { lane: "comida/status-authority", file: "app/lib/clasificados/comida-local/comidaLocalOwnerEditStatusAuthority.ts", has: ["resolveComidaLocalOwnerEditTargetStatus"] },
  { lane: "comida/client", file: "app/(site)/clasificados/comida-local/preview/ComidaLocalPreviewClient.tsx", has: ["COMIDA_LOCAL_BASE_CHECKOUT", "recurringConsent: ctx.recurringConsent"] },
  { lane: "comida/queries", file: "app/lib/clasificados/comida-local/comidaLocalPublicQueries.ts", has: ["listPublishedComidaLocalListings", "getPublishedComidaLocalListingBySlug"] },
  { lane: "comida/dashboard", file: "app/lib/clasificados/comida-local/comidaLocalDashboardQueries.ts", has: ["listUserComidaLocalListings"] },
  // Ofertas
  { lane: "ofertas/commercial", file: "app/lib/ofertas-locales/ofertasLocalesCommercial.ts", has: ["OFERTAS_LOCALES_COMMERCIAL_PRODUCTS", "getOfertaLocalCommercialProductByPackageKey", "ofertaLocalCommercialProductMatchesOfferType"] },
  { lane: "ofertas/constants", file: "app/lib/ofertas-locales/ofertasLocalesConstants.ts", has: ["OFERTAS_LOCALES_FLYER_PRICE_CENTS = 39900", "OFERTAS_LOCALES_COUPONS_PRICE_CENTS = 0", "OFERTAS_LOCALES_PUBLIC_TERM_DAYS"] },
  { lane: "ofertas/server", file: "app/lib/ofertas-locales/ofertasLocalesCommercialServer.ts", has: ["validateOfertasLocalesCheckoutOwnership", "markOfertaLocalCheckoutStarted", "markOfertaLocalEntitlementFulfilled", "validateOfertaLocalSubmissionEntitlement", "CHECKOUT_ELIGIBLE_STATUSES", "entitlement_already_active"] },
  { lane: "ofertas/admin-mutations", file: "app/lib/ofertas-locales/ofertasLocalesAdminReviewMutations.ts", has: ["tryAutoActivateOfertaLocalAfterPayment", "mutateOfertaLocalAdminReview", "APPROVE_FROM"] },
  { lane: "ofertas/public-helper", file: "app/lib/ofertas-locales/ofertasLocalesPublicOfferHelpers.ts", has: ["isOfertaLocalPublicOfferRowEligible"] },
  { lane: "ofertas/leonix-ad-id", file: "app/lib/ofertas-locales/ofertasLocalesLeonixAdId.ts", has: ["OFERTA_LOCAL_LEONIX_AD_ID_PATTERN", "ensureOfertaLocalLeonixAdId"] },
  { lane: "ofertas/checkout-page", file: "app/(site)/dashboard/ofertas-locales/[id]/checkout/page.tsx", has: ["startRevenueCategoryCheckout", "commercialProductKey", "checkoutEligible"] },
  // Leonix Ad ID migrations
  { lane: "leonix-ad-id/triggers", file: "supabase/migrations/20260506150000_leonix_ad_id_all_classifieds.sql", has: ["listings_leonix_ad_id_bi", "servicios_leonix_ad_id_bi", "empleos_leonix_ad_id_bi", "autos_classifieds_leonix_ad_id_bi", "restaurantes_leonix_ad_id_bi", "leonix_listings_prefix"] },
  { lane: "leonix-ad-id/comida-index", file: "supabase/migrations/20260604120000_comida_local_public_listings.sql", has: ["comida_local_public_listings_leonix_ad_id_uidx", "comida_local_leonix_ad_id_bi"] },
  { lane: "empleos/schema", file: "supabase/migrations/20260410210000_empleos_public_listings.sql", has: ["lifecycle_status", "'quick', 'premium', 'feria'"] },
];

runAnchors("paid", PAID);

// ─────────────────────────────────────────────────────────────────────────────────────────────────────
// 1b. FREE lane anchors (Gate 8) — filled from the FREE matrix doc; see FREE_ANCHORS below.
// ─────────────────────────────────────────────────────────────────────────────────────────────────────
const FREE: Anchor[] = [
  // Empleos Feria
  { lane: "feria/client", file: "app/(site)/publicar/empleos/feria/EmpleoFeriaApplicationClient.tsx", has: ["/api/clasificados/empleos/listings", "publish"] },
  { lane: "feria/preview", file: "app/(site)/clasificados/empleos/feria-preview/EmpleoFeriaPreviewClient.tsx", has: ["EmpleoFeriaPreviewClient"] },
  { lane: "feria/save-api", file: "app/api/clasificados/empleos/listings/route.ts", has: ["export async function POST", "upsertEmpleosListingFromEnvelope", "payment_required", "lane_mismatch", "leonix_ad_id"] },
  { lane: "feria/owner-patch", file: "app/api/clasificados/empleos/listings/[listingId]/route.ts", has: ["updateEmpleosListingLifecycleOwner"] },
  { lane: "feria/db", file: "app/(site)/clasificados/empleos/lib/empleosPublicListingsDbServer.ts", has: ["upsertEmpleosListingFromEnvelope", "resolveEmpleosUpsertLifecycle", "EMPLEOS_REQUIRE_LISTING_REVIEW", "fetchAllEmpleosListingsForAdmin", "updateEmpleosListingLifecycleOwner", "lane_mismatch"] },
  { lane: "feria/policy", file: "app/(site)/clasificados/empleos/lib/empleosPublishLifecyclePolicy.ts", has: ["FREE_LANES", "\"feria\"", "resolveEmpleosOwnerTransition", "everPublished", "hasStaffReason"] },
  { lane: "feria/canonical", file: "app/(site)/clasificados/empleos/lib/staged/empleosEnvelopeToJobRecord.ts", has: ["e.payload.lane", "lane: e.lane", "empleosEnvelopeToCanonical"] },
  { lane: "feria/admin-actions", file: "app/admin/_lib/adminEmpleosStaffActions.ts", has: ["decideEmpleosStaffAction", "EMPLEOS_STAFF_SUSPENDED_MARKER", "EMPLEOS_STAFF_REJECTED_MARKER", "empleos_admin_archive"] },
  { lane: "feria/admin-route", file: "app/api/admin/empleos/listings/[id]/route.ts", has: ["PATCH"] },
  { lane: "feria/admin-queue", file: "app/api/admin/empleos/listings/route.ts", has: ["GET"] },
  // shared generic `listings` spine
  { lane: "listings/select-shrink", file: "app/(site)/clasificados/lib/listingsSelectShrink.ts", has: ["insertListingsRowResilient", "updateListingsRowResilient"] },
  { lane: "listings/idempotency", file: "app/(site)/clasificados/lib/quickListingIdempotency.ts", has: ["verifyQuickListingReusable", "getOrCreateSessionPublishAttemptKey", "isPublishAttemptKeyConflict", "QUICK_LISTING_EXISTING_IDENTITY_INVALID_CODE"] },
  { lane: "listings/owner-query", file: "app/(site)/dashboard/lib/ownerListingsQuery.ts", has: ["fetchOwnerListingsForDashboard"] },
  { lane: "listings/owner-patch", file: "app/(site)/dashboard/lib/ownerListingsLifecycleClient.ts", has: ["applyOwnerListingPatch"] },
  { lane: "listings/admin-select", file: "app/admin/_lib/listingsAdminSelect.ts", has: ["fetchListingsForAdminWorkspaceFiltered", "isGenericListingPubliclyLive", "genericLiveSqlPlan"] },
  { lane: "listings/admin-route", file: "app/api/admin/clasificados/listings/[id]/route.ts", has: ["decideAdminReactivation", "flagged", "removed"] },
  { lane: "listings/reactivation-policy", file: "app/admin/_lib/adminReactivationPolicy.ts", has: ["decideAdminReactivation", "PAID_LANE_CATEGORIES", "provenNeverLive"] },
  { lane: "listings/browse-eligibility", file: "app/(site)/clasificados/lib/listingPublicBrowseEligibility.ts", has: ["isListingRowActiveAndPublishedForBrowse"] },
  { lane: "listings/rls", file: "supabase/migrations/20260421130001_listings_enable_rls_full_policies.sql", has: ["listings_anon_select_public_catalog", "listings_authenticated_update_own"] },
  // Clases free / Comunidad
  { lane: "community/publisher", file: "app/(site)/publicar/community/shared/publish/publishCommunityQuickToListings.ts", has: ["markPublishFailedNonPublic", "status: \"active\", is_published: true", "publish_attempt_key"] },
  { lane: "community/results", file: "app/(site)/clasificados/community/shared/communityListingsBrowseClient.ts", has: ["fetchPublishedCommunityCategoryListings", "isListingRowWithinEnforcedTerm"] },
  { lane: "community/event-expiry", file: "app/(site)/clasificados/community/shared/communityEventDiscoveryExpiration.ts", has: ["prepareComunidadDiscoveryRows"] },
  { lane: "community/ad-id", file: "app/(site)/clasificados/community/shared/communityLeonixAdId.ts", has: ["leonix"] },
  { lane: "community/detail", file: "app/(site)/clasificados/anuncio/[id]/page.tsx", has: ["isListingRowWithinEnforcedTerm"] },
  // Busco / Mascotas
  { lane: "busco/publisher", file: "app/(site)/publicar/busco/shared/publishBuscoQuickToListings.ts", has: ["publishBuscoQuickToListings", "markPublishFailedNonPublic", "is_free"] },
  { lane: "busco/bar", file: "app/(site)/publicar/busco/quick/BuscoQuickPreviewPublishBar.tsx", has: ["publishBuscoQuickToListings"] },
  { lane: "busco/results", file: "app/(site)/clasificados/busco/shared/loadBuscoListings.ts", has: ["fetchPublishedBuscoListings", "is_published"] },
  { lane: "mascotas/publisher", file: "app/(site)/publicar/mascotas-y-perdidos/shared/publishMascotasPerdidosQuickToListings.ts", has: ["publishMascotasPerdidosQuickToListings", "markPublishFailedNonPublic"] },
  { lane: "mascotas/bar", file: "app/(site)/publicar/mascotas-y-perdidos/quick/preview/MascotasPerdidosQuickPreviewPublishBar.tsx", has: ["publishMascotasPerdidosQuickToListings"] },
  { lane: "mascotas/results", file: "app/(site)/clasificados/mascotas-y-perdidos/shared/loadMascotasPerdidosListings.ts", has: ["fetchPublishedMascotasPerdidosListings", "is_published"] },
  // En Venta
  { lane: "en-venta/publisher", file: "app/(site)/clasificados/en-venta/publish/enVentaPublishFromDraft.ts", has: ["publishEnVentaFromDraft", "finalizeEnVentaListingForPublicBrowse", "Leonix:plan", "plan: \"free\" | \"pro\""] },
  { lane: "en-venta/submit-bar", file: "app/(site)/clasificados/en-venta/publish/EnVentaPublishSubmitBar.tsx", has: ["publishEnVentaFromDraft"] },
  { lane: "en-venta/browse", file: "app/lib/clasificados/en-venta/fetchEnVentaPublicListingsForBrowse.ts", has: ["fetchEnVentaPublicListingsForBrowse"] },
  { lane: "en-venta/visibility", file: "app/(site)/clasificados/en-venta/lib/enVentaListingVisibility.ts", has: ["isEnVentaListingPubliclyVisible"] },
  { lane: "en-venta/checkpoint", file: "app/(site)/clasificados/publicar/_components/QuickLaneCheckpointClient.tsx", has: ["getEnVentaCheckpointCard", "/clasificados/publicar/en-venta/pro"] },
  { lane: "en-venta/checkpoint-card", file: "app/(site)/clasificados/publicar/_lib/categoryPublishCheckpoints.ts", has: ["getEnVentaCheckpointCard", "Publicar gratis"] },
  { lane: "en-venta/dev-seed", file: "app/api/clasificados/en-venta/dev-seed-listing/route.ts", has: ["EN_VENTA_DEV_PUBLISH"] },
  // Restaurantes (free application = API-only branch)
  { lane: "restaurantes-free/route", file: "app/api/clasificados/restaurantes/publish/route.ts", has: ["isRestaurantesStrictPublishEnvironment", "pendingPayment", "RESTAURANTE_PENDING_CHECKOUT_STATUS", "activation_mode"] },
  { lane: "restaurantes-free/admin-route", file: "app/api/admin/restaurantes/listings/[id]/route.ts", has: ["decideAdminPrePublishAction"] },
  // Comida (proves it is NOT a free lane)
  { lane: "comida-not-free/route", file: "app/api/clasificados/comida-local/publish/route.ts", has: ["payment_required", "isPendingPayment", "auth_required"] },
  // Other public-without-payment lanes
  { lane: "ofertas-free/constants", file: "app/lib/ofertas-locales/ofertasLocalesConstants.ts", has: ["OFERTAS_LOCALES_COUPONS_PRICE_CENTS = 0"] },
  { lane: "viajes/submit", file: "app/api/clasificados/viajes/submit/route.ts", has: ["POST"] },
  { lane: "iglesias/church", file: "app/lib/iglesias/churchApplication.ts", has: ["AUTO_PUBLISH"] },
];
runAnchors("free", FREE);

// ─────────────────────────────────────────────────────────────────────────────────────────────────────
// 2. Invariants
// ─────────────────────────────────────────────────────────────────────────────────────────────────────
function invariants() {
  const matrix = read("app/lib/listingPlans/revenuePricingMatrix.ts") ?? "";
  // every free package key must be non-Stripe: find each object literal and check its stripeEligible flag
  const blocks = matrix.split(/\n  \{\n/).slice(1);
  const freeKeys = ["en_venta_free_v1", "clases_free", "comunidad_free", "mascotas_free", "busco_free", "EMPLEOS_JOB_FAIR_FREE_PACKAGE_KEY", "viajes_affiliate"];
  for (const key of freeKeys) {
    const block = blocks.find((b) => b.includes(`packageKey: ${key.startsWith("EMPLEOS") ? key : `"${key}"`}`));
    if (!block) {
      fail(`[invariant] free package ${key} not found in the pricing matrix`);
      continue;
    }
    if (/stripeEligible:\s*false/.test(block) && /priceCents:\s*0/.test(block)) ok(`[invariant] ${key} is priceCents 0 and stripeEligible false`);
    else fail(`[invariant] ${key} must be priceCents 0 AND stripeEligible false`);
  }

  // the server refuses a free/ineligible package before any Stripe call
  const validate = read("app/lib/listingPlans/revenueCheckout.ts") ?? "";
  if (validate.includes("isStripeEligiblePackageKey(packageKey)") && validate.includes('billingMode === "free"')) ok("[invariant] validateRevenueCheckoutRequest rejects non-eligible and free packages");
  else fail("[invariant] validateRevenueCheckoutRequest no longer rejects non-eligible / free packages");

  // No FREE-lane publisher / preview bar / application client may reference the Revenue OS checkout.
  // (CommunityQuickPreviewPublishBar.tsx is shared with Clases-paid, so it must only call checkout under `isPaidClases`.)
  const FREE_LANE_FILES = [
    "app/(site)/publicar/busco/shared/publishBuscoQuickToListings.ts",
    "app/(site)/publicar/busco/quick/BuscoQuickPreviewPublishBar.tsx",
    "app/(site)/publicar/mascotas-y-perdidos/shared/publishMascotasPerdidosQuickToListings.ts",
    "app/(site)/publicar/mascotas-y-perdidos/quick/preview/MascotasPerdidosQuickPreviewPublishBar.tsx",
    "app/(site)/publicar/community/shared/publish/publishCommunityQuickToListings.ts",
    "app/(site)/clasificados/en-venta/publish/enVentaPublishFromDraft.ts",
    "app/(site)/clasificados/en-venta/publish/EnVentaPublishSubmitBar.tsx",
    "app/(site)/publicar/empleos/feria/EmpleoFeriaApplicationClient.tsx",
    "app/(site)/clasificados/empleos/feria-preview/EmpleoFeriaPreviewClient.tsx",
  ];
  for (const f of FREE_LANE_FILES) {
    const t = read(f);
    if (t == null) {
      fail(`[invariant] free-lane file missing -> ${f}`);
      continue;
    }
    if (/startRevenueCategoryCheckout|api\/revenue-os\/checkout|revenueCategoryCheckoutClient/.test(t)) fail(`[invariant] free-lane file references the Revenue OS checkout -> ${f}`);
    else ok(`[invariant] free lane never references checkout: ${f}`);
  }
  {
    const bar = read("app/(site)/publicar/community/shared/preview/CommunityQuickPreviewPublishBar.tsx") ?? "";
    const call = bar.indexOf("startRevenueCategoryCheckout({");
    const guardIdx = bar.lastIndexOf("if (isPaidClases)", call);
    if (call > 0 && guardIdx > 0 && guardIdx < call) ok("[invariant] shared community bar calls checkout only after `if (isPaidClases)`");
    else fail("[invariant] community publish bar checkout call is no longer under `if (isPaidClases)`");
    if (/const isPaidClases = kind === "clases" && .*classCostType === "pagada"/.test(bar)) ok("[invariant] isPaidClases requires kind==='clases' && classCostType==='pagada'");
    else fail("[invariant] isPaidClases definition changed");
  }
  {
    // the Empleos paid checkout client is used by Quick/Premium only, never by feria
    const checkoutUsers = ["app/(site)/clasificados/empleos/quick-preview/EmpleoQuickPreviewClient.tsx", "app/(site)/clasificados/empleos/premium-preview/EmpleoPremiumPreviewClient.tsx"];
    for (const f of checkoutUsers) {
      if ((read(f) ?? "").includes("saveEmpleosDraftAndStartPaidJobCheckout")) ok(`[invariant] paid Empleos lane uses the paid checkout: ${f}`);
      else fail(`[invariant] paid Empleos preview no longer uses saveEmpleosDraftAndStartPaidJobCheckout: ${f}`);
    }
  }
  {
    // Comida Local must stay non-free: a brand-new row without pending_payment is refused
    const c = read("app/api/clasificados/comida-local/publish/route.ts") ?? "";
    if (/if \(!isPendingPayment\) \{\s*return NextResponse\.json\(\{ ok: false, error: "payment_required" \}, \{ status: 402 \}\);/.test(c)) ok("[invariant] Comida Local refuses a new row without pending_payment (402)");
    else fail("[invariant] Comida Local new-row payment_required guard changed");
  }

  // paid lanes exist and have exactly the documented product set
  const packages = [...matrix.matchAll(/packageKey:\s*"?([A-Za-z0-9_]+)"?,/g)].map((m) => m[1]);
  for (const k of ["servicios_base_monthly", "restaurantes_base_monthly", "comida_local_base_monthly", "autos_dealer_monthly", "autos_privado_30d", "br_agent_monthly", "br_fsbo_45d", "rentas_30d", "clases_paid_30d"]) {
    if (packages.includes(k)) ok(`[invariant] paid package ${k} exists`);
    else fail(`[invariant] paid package ${k} missing from the pricing matrix`);
  }
  // Empleos has ONE paid product (no distinct Premium package)
  const empleosPaid = packages.filter((p) => /^empleos_/.test(p) || p === "EMPLEOS_JOB_POST_PAID_PACKAGE_KEY" || p === "EMPLEOS_JOB_FAIR_FREE_PACKAGE_KEY");
  if (empleosPaid.length === 2) ok("[invariant] Empleos has exactly two matrix entries (paid post + free feria); no distinct Premium package");
  else fail(`[invariant] Empleos matrix entries changed (${empleosPaid.join(", ")}) — the doc says Quick and Premium share one package`);

  // Restaurantes free application: every base guard package key is still guarded (br_agent_monthly included)
  const guard = read("app/lib/listingPlans/revenueActiveEntitlementGuard.ts") ?? "";
  for (const k of ["autos_dealer_monthly", "br_agent_monthly", "restaurantes_base_monthly", "servicios_base_monthly", "comida_local_base_monthly"]) {
    if (guard.includes(`"${k}"`)) ok(`[invariant] base entitlement guard covers ${k}`);
    else fail(`[invariant] base entitlement guard no longer covers ${k}`);
  }
}
invariants();

// ─────────────────────────────────────────────────────────────────────────────────────────────────────
// 3. Sentinels — open DEFECTS recorded in the docs (informational; never fail the run)
// ─────────────────────────────────────────────────────────────────────────────────────────────────────
type Sentinel = { id: string; sev: string; file: string; stillDefective: (text: string) => boolean; note: string };
const SENTINELS: Sentinel[] = [
  {
    id: "D1",
    sev: "HIGH",
    file: "app/api/clasificados/restaurantes/publish/route.ts",
    // defective while a brand-new row can be inserted as published when no pending flag was sent
    stillDefective: (t) => /status:\s*pendingPayment\s*\?\s*RESTAURANTE_PENDING_CHECKOUT_STATUS\s*:\s*"published"/.test(t) && !/payment_required/.test(t),
    note: "Restaurantes publish route can INSERT a published row without payment",
  },
  {
    id: "D2",
    sev: "MED-HIGH",
    file: "app/lib/listingPlans/revenueEmpleosFulfillment.ts",
    stillDefective: (t) => !/expires_at/.test(t),
    note: "Empleos paid 30-day post has no expiry at activation",
  },
  {
    id: "D3",
    sev: "MED",
    file: "app/api/revenue-os/checkout/route.ts",
    stillDefective: (t) => /bearerUserId\s*\|\|\s*body\.ownerUserId/.test(t),
    note: "Checkout accepts unauthenticated requests and a body-supplied ownerUserId",
  },
  {
    id: "D4",
    sev: "MED",
    file: "app/api/revenue-os/checkout/route.ts",
    // Fixed: the pre-flights read the row through a per-lane table map (table: "..._public_listings") + a br_agent_monthly block.
    stillDefective: (t) =>
      !/table: "servicios_public_listings"[\s\S]*table: "restaurantes_public_listings"[\s\S]*table: "comida_local_public_listings"/.test(t) ||
      !/BIENES_NEGOCIO_BASE_PACKAGE_KEY && listingRef/.test(t),
    note: "No dedicated owner/status pre-flight for Servicios / Restaurantes / Comida Local / br_agent_monthly",
  },
  {
    id: "D5a",
    sev: "LOW-MED",
    file: "app/lib/listingPlans/revenuePricingMatrix.ts",
    stillDefective: (t) => /packageKey:\s*OFERTAS_LOCALES_COUPONS_30D_PACKAGE_KEY,[\s\S]*?stripeEligible:\s*true/.test(t),
    note: "Ofertas coupons is Stripe-eligible ($199) in the matrix but free ($0) in the catalog",
  },
  {
    id: "D5b",
    sev: "LOW",
    file: "app/lib/ofertas-locales/ofertasLocalesCommercialServer.ts",
    stillDefective: (t) => /CHECKOUT_ELIGIBLE_STATUSES\s*=\s*new Set\(\[[^\]]*"rejected"/.test(t),
    note: "Ofertas checkout is allowed for a rejected listing but auto-activation never approves from rejected",
  },
  {
    id: "D6",
    sev: "LOW-MED",
    file: "app/lib/listingLifecycle/listingRenewalCheckout.ts",
    stillDefective: (t) => !/clases/i.test(t),
    note: "Clases paid has no renewal path",
  },
  {
    id: "D9",
    sev: "LOW",
    file: "app/lib/listingPlans/revenueRestaurantFulfillment.ts",
    stillDefective: (t) => /RESTAURANTE_ACTIVATABLE_PRE_PUBLISH_STATUSES\s*=\s*\[\s*"archived"/.test(t),
    note: "Restaurantes fulfilment can re-publish an archived (possibly staff-archived) row",
  },
  {
    id: "D11",
    sev: "LOW",
    file: "app/api/clasificados/comida-local/publish/route.ts",
    stillDefective: (t) => /Only enforced when the existing row actually recorded an owner/.test(t),
    note: "Comida Local publish route lets an authenticated user claim an ownerless legacy row",
  },
];
SENTINELS.push(
  {
    id: "F1/D13",
    sev: "HIGH",
    file: "app/(site)/clasificados/empleos/lib/empleosPublicListingsDbServer.ts",
    // defective while the payment lane is read from the top-level envelope only and never cross-checked with payload.lane
    stillDefective: (t) => /lane:\s*\(input\.envelope\.lane as string \| undefined\)/.test(t) && !/envelope\.payload\.lane/.test(t),
    note: "Empleos free-lane decision reads envelope.lane, content is built from envelope.payload.lane (forge lane:'feria' for a free paid post)",
  },
  {
    id: "F5",
    sev: "MED",
    file: "app/admin/_lib/adminEmpleosStaffActions.ts",
    stillDefective: (t) => /case "archive":\s*patch\.lifecycle_status = "archived";\s*return/.test(t),
    note: "Staff archive writes no moderation marker, so the owner can reopen an archived (ever-published) Empleos post",
  },
  {
    id: "F6",
    sev: "MED",
    // Fixed in the policy (not the publisher): a free Clases row (is_free === true) is exempt from the never-live evidence rule.
    file: "app/admin/_lib/adminReactivationPolicy.ts",
    stillDefective: (t) => !/freeClasesRow/.test(t),
    note: "Free Clases publisher never stamps published_at; decideAdminReactivation then blocks staff Restore (payment_required)",
  },
  {
    id: "F7",
    sev: "LOW-MED",
    file: "app/(site)/publicar/empleos/feria/EmpleoFeriaApplicationClient.tsx",
    stillDefective: (t) => !/empleosPendingCheckoutIdentity|rememberEmpleos/.test(t),
    note: "Feria remembers the created listing id in React state only (Back then Publish inserts a second row)",
  },
  {
    id: "F9",
    sev: "LOW",
    file: "app/admin/_lib/adminLivePredicates.ts",
    stillDefective: (t) => !/prepareComunidadDiscoveryRows|communityEventDiscoveryExpiration/.test(t),
    note: "Admin Live for Comunidad has no event-date rule (public discovery hides past events)",
  },
  {
    id: "F12",
    sev: "LOW",
    file: "app/api/revenue-os/checkout/route.ts",
    stillDefective: (t) => !/["']feria["']/.test(t),
    note: "Empleos paid pre-flight is not lane-checked (a feria draft can be paid)",
  },
  {
    id: "F13",
    sev: "LOW",
    file: "app/(site)/clasificados/lib/quickListingIdempotency.ts",
    stillDefective: (t) => /\.select\("id, owner_id, category"\)/.test(t),
    note: "verifyQuickListingReusable checks owner + category, never status (stale in-flight id can revive a removed row)",
  },
);

console.log("\n--- defect sentinels (informational) ---");
for (const s of SENTINELS) {
  const text = read(s.file);
  if (text == null) {
    console.log(`SENTINEL ${s.id} [${s.sev}]: file missing (${s.file}) — update the docs`);
    continue;
  }
  if (s.stillDefective(text)) console.log(`SENTINEL ${s.id} [${s.sev}]: STILL OPEN — ${s.note}`);
  else console.log(`SENTINEL ${s.id} [${s.sev}]: APPEARS FIXED — update the Defects table (${s.note})`);
}

console.log(`\n${okCount} checks passed, ${failures.length} failed.`);
if (failures.length) {
  console.error("\nFAILURES:\n" + failures.map((f) => ` - ${f}`).join("\n"));
  process.exit(1);
}
