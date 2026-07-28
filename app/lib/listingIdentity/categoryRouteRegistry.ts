/**
 * Gate B — category route registry.
 *
 * Registers one `CategoryRouteAdapter` per pipeline, describing CURRENT repository routing
 * truth only. Nothing here is wired into any live page/dashboard/publish/webhook yet
 * (additive only, per Gate B scope).
 *
 * Route literals are deliberately hardcoded rather than imported from the real dashboard/
 * public-URL builder modules (e.g. app/(site)/dashboard/lib/*AddonCheckout.ts,
 * app/(site)/clasificados/lib/hubUrl.ts, app/(site)/clasificados/lib/listingDestinationRoutes.ts).
 * Two reasons:
 *   1. Those modules live under app/(site)/... and several transitively import React/browser/
 *      Supabase-browser-client code — importing them here would break this module's "no React,
 *      no browser globals, no Supabase client, pure functions only" requirement, and would
 *      invert the expected app/lib → app/(site) dependency direction.
 *   2. Per the Gate B instructions, when importing an existing helper risks that kind of
 *      coupling, the route literal should be documented with a comment instead, deferring
 *      runtime unification (i.e. actually calling into those builders) to Gate C/D.
 * Every literal below cites the exact source file/line it was copied from.
 */

import type { CategoryRouteAdapter, InventoryRole, ListingIdentity, RouteResolveOpts } from "./types";

function lang(opts?: RouteResolveOpts): "es" | "en" {
  return opts?.lang === "en" ? "en" : "es";
}

/**
 * Minimal, local equivalent of appendLangToPath (app/(site)/clasificados/lib/hubUrl.ts:38-43).
 * Not imported for the same architectural-boundary reason described above — this is a
 * deliberately tiny, dependency-free duplicate, not a divergent reimplementation.
 */
function withLang(path: string, l: "es" | "en"): string {
  const joiner = path.includes("?") ? "&" : "?";
  return `${path}${joiner}lang=${l}`;
}

function dashboardEditParams(input: {
  mode: string;
  focus?: string | null;
  listingId: string;
  leonixAdId?: string | null;
  returnPanel: string;
}): URLSearchParams {
  const params = new URLSearchParams({ edit: "1", source: "dashboard", mode: input.mode });
  if (input.focus) params.set("focus", input.focus);
  params.set("listingId", input.listingId);
  const leonixAdId = (input.leonixAdId ?? "").trim();
  if (leonixAdId) params.set("leonixAdId", leonixAdId);
  params.set("returnPanel", input.returnPanel);
  return params;
}

function identityListingIdForEdit(identity: ListingIdentity): string {
  // Bienes/Autos inventory items are edited through the parent's application, not a
  // dedicated per-child URL (see the adapter-level knownLimitations for each pipeline).
  return identity.parentSourceId?.trim() || identity.sourceId;
}

// ---------------------------------------------------------------------------------------
// Restaurantes
// Public URL: app/(site)/clasificados/restaurantes/lib/restaurantesPublicListingMapper.ts /
//   app/api/clasificados/restaurantes/publish/route.ts:423 (`/clasificados/restaurantes/${slug}`).
// Entry: app/(site)/clasificados/lib/hubUrl.ts:33 (HUB_CATEGORY_PATH.restaurantes).
// Coupon-edit-only route: app/(site)/dashboard/lib/restaurantesDashboardCouponAddonCheckout.ts:277
//   (`/publicar/restaurantes?...&mode=coupon-edit&listingId=...`).
// ---------------------------------------------------------------------------------------
const RESTAURANTES_ADAPTER: CategoryRouteAdapter = {
  pipeline: "restaurantes",
  category: "restaurantes",
  sourceTable: "restaurantes_public_listings",
  entryRoute: "/clasificados/restaurantes",
  applicationRoute: "/publicar/restaurantes",
  resultsRoute: "/clasificados/restaurantes/resultados",

  // Slug-keyed public identity — no DB call is allowed here, so this resolver can only echo
  // the precomputed `identity.publicUrl` (built by the caller from a real slug lookup).
  publicRoute: (identity) => identity.publicUrl || null,

  // No full-listing dashboard edit route was found in the repository as of this gate — only
  // a coupon-scoped edit route exists (see knownLimitations). Per Gate B instructions, an
  // unsupported/unconfirmed route must return null rather than be guessed.
  editRoute: () => null,

  // No confirmed dashboard-listing-bound Preview route was found for Restaurantes (unlike
  // Bienes/Servicios/Autos, which each export a dedicated `*_DASHBOARD_PREVIEW_BASE`).
  previewRoute: () => null,

  dashboardRoute: (_identity, opts) => withLang("/dashboard/restaurantes", lang(opts)),

  // Coupon editing — the one genuinely confirmed, entitlement-gated "manage" sub-flow for this
  // pipeline (restauranteCouponEditHref, restaurantesDashboardCouponAddonCheckout.ts:261-278).
  secondaryManageRoute: (identity, opts) => {
    const params = new URLSearchParams({
      focus: "coupon-upgrade",
      source: "dashboard",
      mode: "coupon-edit",
      listingId: identity.sourceId,
    });
    if (identity.leonixAdId) params.set("leonixAdId", identity.leonixAdId);
    params.set("returnPanel", "restaurantes");
    return withLang(`${"/publicar/restaurantes"}?${params.toString()}`, lang(opts));
  },

  supportsParentChildInventory: false,
  supportsCoupons: true,
  supportsBusinessHub: true,

  knownLimitations: [
    "No confirmed full-listing dashboard edit route exists — only a coupon-scoped edit route " +
      "(`restauranteCouponEditHref`, app/(site)/dashboard/lib/restaurantesDashboardCouponAddonCheckout.ts:261-278, " +
      "base `/publicar/restaurantes?mode=coupon-edit&listingId=...`). editRoute() returns null " +
      "honestly rather than pointing at that partial route under a generic \"edit\" label.",
    "No confirmed dashboard-listing-bound Preview route exists for an already-published listing.",
  ],
};

// ---------------------------------------------------------------------------------------
// Servicios
// Public URL: app/api/clasificados/servicios/publish/route.ts:570 (`/clasificados/servicios/${slug}`).
// Entry: app/(site)/clasificados/lib/hubUrl.ts:27 (HUB_CATEGORY_PATH.servicios).
// Edit/Preview bases: app/(site)/dashboard/lib/serviciosDashboardOffersAddonCheckout.ts:73-108
//   (SERVICIOS_DASHBOARD_APPLICATION_BASE = "/publicar/servicios",
//    SERVICIOS_DASHBOARD_PREVIEW_BASE = "/clasificados/publicar/servicios/preview").
// ---------------------------------------------------------------------------------------
const SERVICIOS_APPLICATION_BASE = "/publicar/servicios";
const SERVICIOS_PREVIEW_BASE = "/clasificados/publicar/servicios/preview";

const SERVICIOS_ADAPTER: CategoryRouteAdapter = {
  pipeline: "servicios",
  category: "servicios",
  sourceTable: "servicios_public_listings",
  entryRoute: "/clasificados/servicios",
  applicationRoute: SERVICIOS_APPLICATION_BASE,
  resultsRoute: "/clasificados/servicios/resultados",

  publicRoute: (identity) => identity.publicUrl || null,

  editRoute: (identity, opts) => {
    const params = dashboardEditParams({
      mode: "listing-edit",
      listingId: identity.sourceId,
      leonixAdId: identity.leonixAdId,
      returnPanel: "servicios",
    });
    return withLang(`${SERVICIOS_APPLICATION_BASE}?${params.toString()}`, lang(opts));
  },

  previewRoute: (identity, opts) => {
    const params = dashboardEditParams({
      mode: "listing-edit",
      listingId: identity.sourceId,
      leonixAdId: identity.leonixAdId,
      returnPanel: "servicios",
    });
    params.set("preview", "listing");
    return withLang(`${SERVICIOS_PREVIEW_BASE}?${params.toString()}`, lang(opts));
  },

  dashboardRoute: (_identity, opts) => withLang("/dashboard/servicios", lang(opts)),

  // Offers editing — the confirmed, entitlement-gated "manage" sub-flow for this pipeline
  // (serviciosOffersEditHref, app/(site)/dashboard/lib/serviciosDashboardOffersAddonCheckout.ts:111-116).
  secondaryManageRoute: (identity, opts) => {
    const params = dashboardEditParams({
      mode: "offers-edit",
      focus: "coupon-upgrade",
      listingId: identity.sourceId,
      leonixAdId: identity.leonixAdId,
      returnPanel: "servicios",
    });
    return withLang(`${SERVICIOS_APPLICATION_BASE}?${params.toString()}`, lang(opts));
  },

  supportsParentChildInventory: false,
  supportsCoupons: true,
  supportsBusinessHub: true,

  knownLimitations: [
    "Save-by-slug requires the caller to prime `existingPublicSlug` before this route resolver " +
      "runs, or the underlying publish route may INSERT a duplicate row instead of updating in " +
      "place (app/api/clasificados/servicios/publish/route.ts:214-226). Not every save call site " +
      "was independently verified to prime it.",
  ],
};

// ---------------------------------------------------------------------------------------
// Bienes Raíces Negocio
// Public URL (shared shell): app/(site)/clasificados/lib/listingDestinationRoutes.ts:7
//   (CLASIFICADOS_ANUNCIO_LIVE = "/clasificados/anuncio") — same as leonixLiveAnuncioPath()
//   in app/(site)/clasificados/lib/leonixRealEstateListingContract.ts:207-209.
// Entry/Results: app/(site)/clasificados/lib/listingDestinationRoutes.ts:10,12.
// Edit base: app/(site)/dashboard/lib/bienesDashboardInventoryAddonCheckout.ts:59
//   (BIENES_DASHBOARD_APPLICATION_BASE = "/clasificados/publicar/bienes-raices/negocio").
// Preview base: app/(site)/clasificados/lib/listingDestinationRoutes.ts:21
//   (BR_PREVIEW_NEGOCIO = "/clasificados/bienes-raices/preview/negocio").
// Application (new): app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual.
// ---------------------------------------------------------------------------------------
const BIENES_DASHBOARD_APPLICATION_BASE = "/clasificados/publicar/bienes-raices/negocio";
const BR_PREVIEW_NEGOCIO = "/clasificados/bienes-raices/preview/negocio";

const BIENES_RAICES_NEGOCIO_ADAPTER: CategoryRouteAdapter = {
  pipeline: "bienes_raices_negocio",
  category: "bienes-raices",
  sourceTable: "listings",
  entryRoute: "/clasificados/bienes-raices",
  applicationRoute: "/clasificados/publicar/bienes-raices/negocio/agente-individual",
  resultsRoute: "/clasificados/bienes-raices/resultados",

  // UUID-keyed public identity — self-sufficient from sourceId, no lookup required.
  publicRoute: (identity) => `/clasificados/anuncio/${identity.sourceId}`,

  editRoute: (identity, opts) => {
    const params = dashboardEditParams({
      mode: "listing-edit",
      listingId: identityListingIdForEdit(identity),
      leonixAdId: identity.leonixAdId,
      returnPanel: "bienes-raices",
    });
    return withLang(`${BIENES_DASHBOARD_APPLICATION_BASE}?${params.toString()}`, lang(opts));
  },

  previewRoute: (identity, opts) => {
    const params = dashboardEditParams({
      mode: "listing-edit",
      listingId: identityListingIdForEdit(identity),
      leonixAdId: identity.leonixAdId,
      returnPanel: "bienes-raices",
    });
    params.set("preview", "listing");
    return withLang(`${BR_PREVIEW_NEGOCIO}?${params.toString()}`, lang(opts));
  },

  dashboardRoute: (_identity, opts) => withLang("/dashboard/mis-anuncios", lang(opts)),

  // Inventory-pack editing — always resolved against the PARENT's id (bienesInventoryEditHref,
  // app/(site)/dashboard/lib/bienesDashboardInventoryAddonCheckout.ts:96-99): there is no
  // dedicated per-child inventory-manage URL, only the parent-scoped inventory-edit step.
  secondaryManageRoute: (identity, opts) => {
    const params = dashboardEditParams({
      mode: "inventory-edit",
      focus: "inventory-pack",
      listingId: identityListingIdForEdit(identity),
      leonixAdId: identity.leonixAdId,
      returnPanel: "bienes-raices",
    });
    return withLang(`${BIENES_DASHBOARD_APPLICATION_BASE}?${params.toString()}`, lang(opts));
  },

  supportsParentChildInventory: true,
  supportsCoupons: false,
  supportsBusinessHub: true,

  knownLimitations: [
    "Published-to-draft hydration currently hard-caps mapped inventory children at 4 via " +
      "`.slice(0,4)` (app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/" +
      "application/utils/bienesPublishedToAgenteApplicationDraft.ts:116) — a 5th+ child is " +
      "invisible in the editor even though the DB row is untouched.",
    "Editing an existing listing to add a new inventory child beyond the already-hydrated set " +
      "is silently skipped by the edit API (`skippedNewChildren`, " +
      "app/api/clasificados/bienes-raices/listing-edit/route.ts:310-352) and never surfaced " +
      "to the UI by either known caller.",
    "The public child page's sibling-inventory carousel is fetched but never rendered on the " +
      "child's own view (`!isChild` guard, BienesRaicesNegocioLiveDetailShell.tsx:401,467).",
    "Confirmed (Gate D inspection) that the live dashboard renders NO edit/preview/manage action " +
      "for a BR inventory-property child row at all — BrNegocioListingInventoryActions.tsx:114-127 " +
      "renders only a static 'Inventory property' card with no Link/button for children. " +
      "editRoute()/previewRoute()/secondaryManageRoute() above only resolve real URLs for the " +
      "parent identity; the dashboard action resolver (Gate D) must not expose edit/preview/" +
      "manage for a child role on this pipeline, since no genuine per-child entry point exists.",
  ],
};

// ---------------------------------------------------------------------------------------
// Auto Dealers (autos_negocios)
// Public child URL: app/(site)/clasificados/autos/filters/autosBrowseFilterContract.ts:175-177
//   (autosLiveVehiclePath -> `/clasificados/autos/vehiculo/${id}`).
// Public dealer-group URL: app/lib/clasificados/autos/autosDealerInventoryAddFlow.ts:59-62
//   (dealerInventoryGroupPublicPath -> `/clasificados/autos/dealer/${groupId}`).
// Entry: repository route inventory, app/(site)/clasificados/dealers-de-autos/page.tsx.
// Results: same route inventory, app/(site)/clasificados/dealers-de-autos/results/page.tsx
//   (no /resultados alias exists for this pipeline).
// Edit/Preview bases: app/(site)/dashboard/lib/autosDashboardInventoryAddonCheckout.ts:60,63
//   (AUTOS_DASHBOARD_APPLICATION_BASE = "/publicar/autos/negocios",
//    AUTOS_DASHBOARD_PREVIEW_BASE = "/clasificados/autos/negocios/preview").
// ---------------------------------------------------------------------------------------
const AUTOS_DASHBOARD_APPLICATION_BASE = "/publicar/autos/negocios";
const AUTOS_DASHBOARD_PREVIEW_BASE = "/clasificados/autos/negocios/preview";

type AutosNegociosAdapter = CategoryRouteAdapter & {
  /** Dealer inventory browse page — distinct from any single listing's own detail page. */
  dealerGroupPublicRoute: (inventoryGroupId: string, opts?: RouteResolveOpts) => string;
};

const AUTOS_NEGOCIOS_ADAPTER: AutosNegociosAdapter = {
  pipeline: "autos_negocios",
  category: "autos",
  sourceTable: "autos_classifieds_listings",
  entryRoute: "/clasificados/dealers-de-autos",
  applicationRoute: AUTOS_DASHBOARD_APPLICATION_BASE,
  resultsRoute: "/clasificados/dealers-de-autos/results",

  publicRoute: (identity) => `/clasificados/autos/vehiculo/${encodeURIComponent(identity.sourceId)}`,

  editRoute: (identity, opts) => {
    const params = dashboardEditParams({
      mode: "listing-edit",
      listingId: identityListingIdForEdit(identity),
      leonixAdId: identity.leonixAdId,
      returnPanel: "autos",
    });
    return withLang(`${AUTOS_DASHBOARD_APPLICATION_BASE}?${params.toString()}`, lang(opts));
  },

  // Uses the identity's OWN sourceId (never the parent-fallback used by editRoute above) —
  // Gate C's AutosNegociosPreviewClient fetches GET /api/clasificados/autos/listings/[id] by
  // whatever id it's given and hydrates from that exact row, so a child's own preview
  // genuinely works bound to its own id, unlike edit (no per-child edit UI exists).
  previewRoute: (identity, opts) => {
    const params = dashboardEditParams({
      mode: "listing-edit",
      listingId: identity.sourceId,
      leonixAdId: identity.leonixAdId,
      returnPanel: "autos",
    });
    params.set("preview", "listing");
    return withLang(`${AUTOS_DASHBOARD_PREVIEW_BASE}?${params.toString()}`, lang(opts));
  },

  dashboardRoute: (_identity, opts) => withLang("/dashboard/mis-anuncios", lang(opts)),

  dealerGroupPublicRoute: (inventoryGroupId, opts) =>
    withLang(`/clasificados/autos/dealer/${encodeURIComponent(inventoryGroupId)}`, lang(opts)),

  // Inventory-pack editing — always resolved against the PARENT's id
  // (autosDealerInventoryEditHref, autosDashboardInventoryAddonCheckout.ts:95-98): no dedicated
  // per-child inventory-manage URL exists, only the parent-scoped inventory-edit drawer step.
  secondaryManageRoute: (identity, opts) => {
    const params = dashboardEditParams({
      mode: "inventory-edit",
      focus: "inventory-pack",
      listingId: identityListingIdForEdit(identity),
      leonixAdId: identity.leonixAdId,
      returnPanel: "autos",
    });
    return withLang(`${AUTOS_DASHBOARD_APPLICATION_BASE}?${params.toString()}`, lang(opts));
  },

  supportsParentChildInventory: true,
  supportsCoupons: false,
  supportsBusinessHub: true,

  knownLimitations: [
    "PATCH /api/clasificados/autos/listings/[id] (updateAutosClassifiedsListingDraft, " +
      "app/lib/clasificados/autos/autosClassifiedsListingService.ts) now accepts an authenticated " +
      "owner's update to an already-active negocios row (parent or child), not only " +
      "draft/pending_payment/payment_failed — repaired in Gate C (Auto Dealer Same-Record Save " +
      "and Listing-Bound Preview). The write is owner-scoped on both the preceding read and the " +
      "update itself, and only ever sets listing_payload/lang/updated_at, so id/leonix_ad_id/" +
      "dealer_inventory_group_id/dealer_inventory_parent_listing_id/inventory_role/lane are " +
      "preserved by column scope. Autos Privado's editable-status set is unchanged (still " +
      "draft/pending_payment/payment_failed only — the active-row allowance is negocios-only).",
    "The Preview route above is now genuinely listing-bound when a canonical listingId is " +
      "present — repaired in Gate C. AutosNegociosPreviewClient.tsx reads listingId from the " +
      "route/query, fetches the owner-authorized row via GET /api/clasificados/autos/listings/" +
      "[id], and resolves from the real database UUID rather than shared per-user localStorage " +
      "draft state; that generic draft is never consulted or merged in once a canonical " +
      "listingId is present. Invalid, unauthorized, wrong-lane, unsupported-role, or missing " +
      "rows render an explicit error state rather than falling back to the blank/new-listing " +
      "empty state. The original no-listingId draft Preview path (for a genuinely new, " +
      "not-yet-saved listing) is unchanged.",
    "No per-child edit link/route exists in the dashboard inventory section " +
      "(AutosDealerInventoryDashboardSection.tsx) — only the parent-level 'Editar inventario' " +
      "link above, which opens the drawer-based inventory step rather than a dedicated child URL.",
    "No confirmed enforced product limit exists for additional dealer inventory vehicles (unlike " +
      "Bienes' documented cap of 4) — productLimit for this pipeline is intentionally null, not 4.",
    "Gate D correction: previewRoute() now resolves from the identity's OWN sourceId (not the " +
      "parent-fallback used by editRoute/secondaryManageRoute), since Gate C's Preview client " +
      "genuinely supports being bound to a child vehicle's own id. The dashboard action resolver " +
      "(Gate D) still must not expose an 'edit' action for a child role on this pipeline — only " +
      "viewPublic/preview/analytics — since no per-child edit UI exists (see the entry above).",
  ],
};

// ---------------------------------------------------------------------------------------
// Autos Privado — registered separately and explicitly to make its exclusion from dealer
// parent/child behavior visible in the registry, not merely implied by omission.
// Public URL: same shared vehicle detail page as dealer listings
//   (autosLiveVehiclePath, app/(site)/clasificados/autos/filters/autosBrowseFilterContract.ts:175-177).
// Entry/Results: app/(site)/clasificados/lib/hubUrl.ts:26 (HUB_CATEGORY_PATH.autos), and the
//   confirmed `/clasificados/autos/resultados` + `?seller=private` filter param.
// Edit: confirmed working via `?listingId=...&edit=1&source=dashboard` on the application
//   route itself, strictly requiring `lane==="privado"` on hydrate
//   (app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx:88-150) — no
//   exported href-builder constant exists for this pipeline (unlike the other three), so the
//   query-param shape is reproduced here from that confirmed source.
// ---------------------------------------------------------------------------------------
const AUTOS_PRIVADO_APPLICATION_BASE = "/publicar/autos/privado";
const AUTOS_PRIVADO_PREVIEW_BASE = "/clasificados/autos/privado/preview";

const AUTOS_PRIVADO_ADAPTER: CategoryRouteAdapter = {
  pipeline: "autos_privado",
  category: "autos",
  sourceTable: "autos_classifieds_listings",
  entryRoute: "/clasificados/autos",
  applicationRoute: AUTOS_PRIVADO_APPLICATION_BASE,
  resultsRoute: "/clasificados/autos/resultados",

  publicRoute: (identity) => `/clasificados/autos/vehiculo/${encodeURIComponent(identity.sourceId)}`,

  editRoute: (identity, opts) => {
    const params = new URLSearchParams({
      edit: "1",
      source: "dashboard",
      listingId: identity.sourceId,
    });
    return withLang(`${AUTOS_PRIVADO_APPLICATION_BASE}?${params.toString()}`, lang(opts));
  },

  previewRoute: (identity, opts) => {
    const params = new URLSearchParams({
      edit: "1",
      source: "dashboard",
      listingId: identity.sourceId,
    });
    return withLang(`${AUTOS_PRIVADO_PREVIEW_BASE}?${params.toString()}`, lang(opts));
  },

  dashboardRoute: (_identity, opts) => withLang("/dashboard/mis-anuncios", lang(opts)),

  // Locked product rule: Autos Privado never supports dealer parent/child inventory or coupons.
  supportsParentChildInventory: false,
  supportsCoupons: false,
  supportsBusinessHub: false,

  knownLimitations: [
    "No exported href-builder constant exists for this pipeline's edit/preview routes (unlike " +
      "restaurantes/servicios/bienes-raices-negocio/autos-negocios, which each export one) — the " +
      "query-param shape above was reproduced from the confirmed hydration call site rather than " +
      "imported.",
    "Preview-route listing-boundedness beyond the draft hook's own hydration was not " +
      "independently confirmed to re-fetch by listingId; treat as best-effort.",
  ],
};

/** Category registry — the source of truth this module actually exposes. */
export const CATEGORY_ROUTE_REGISTRY = {
  restaurantes: RESTAURANTES_ADAPTER,
  servicios: SERVICIOS_ADAPTER,
  bienes_raices_negocio: BIENES_RAICES_NEGOCIO_ADAPTER,
  autos_negocios: AUTOS_NEGOCIOS_ADAPTER,
  autos_privado: AUTOS_PRIVADO_ADAPTER,
} as const satisfies Record<
  "restaurantes" | "servicios" | "bienes_raices_negocio" | "autos_negocios" | "autos_privado",
  CategoryRouteAdapter
>;

export type CategoryRouteRegistry = typeof CATEGORY_ROUTE_REGISTRY;

export function getCategoryRouteAdapter<K extends keyof CategoryRouteRegistry>(
  pipeline: K,
): CategoryRouteRegistry[K] {
  return CATEGORY_ROUTE_REGISTRY[pipeline];
}

/** `inventory_role` -> whether the pipeline this role belongs to supports the concept at all. */
export function pipelineSupportsInventoryRole(
  pipeline: keyof CategoryRouteRegistry,
  role: InventoryRole,
): boolean {
  if (role === "main") return true;
  return CATEGORY_ROUTE_REGISTRY[pipeline].supportsParentChildInventory;
}
