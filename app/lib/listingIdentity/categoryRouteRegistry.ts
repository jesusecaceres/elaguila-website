/**
 * Gate B — category route registry.
 *
 * Registers one `CategoryRouteAdapter` per pipeline, describing CURRENT repository routing
 * truth only. Nothing here is wired into any live page/dashboard/publish/webhook yet
 * (additive only, per Gate B scope) — EXCEPT the five adapters present before Gate I.5.1
 * (restaurantes, servicios, bienes_raices_negocio, autos_negocios, autos_privado), which Gates
 * D.1–D.3 have since partially live-wired into dashboard action buttons (see index.ts's header
 * comment for the exact wired subset per pipeline). Gate I.5.1 did not modify a single field on
 * those five adapters — only added twelve new ones alongside them.
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
 *
 * GATE I.5.1 — canonical route-contract reconciliation (Gate I.5A follow-up).
 *
 * This gate reconciles the systemic route drift Gate I.5A found (dual-mount `/publicar/{cat}`
 * vs `/clasificados/publicar/{cat}` trees, `results`/`resultados` duplicates, two overlapping
 * canonicalization files) by making THIS registry the single declared source of canonical-route
 * truth, and extending it from 5 to 17 pipelines (every dashboard-relevant category; `cupones`
 * excluded on purpose, see CanonicalCategoryKey's doc comment in ./types).
 *
 * IMPORTANT — this registry is declared/target truth, not yet universally live truth. A
 * second file, app/(site)/clasificados/components/categoryStandard/categoryStandardRoutes.ts,
 * independently declares a `categoryPublishPath()` map that IS live-wired into real CTAs today
 * (CategoryStandardLandingPage.tsx's default publishHref, and EmpleosLandingPageClient.tsx's
 * CTA). Gate I.5A found that map disagrees with the decisions below for Servicios, Empleos,
 * and Bienes Raíces. Per Gate I.5.1's explicit restriction ("do not rewire global CTAs yet"),
 * `categoryPublishPath()`'s return values were NOT changed in this gate — doing so would change
 * live navigation. That reconciliation (making the live map either consume this registry or
 * match its decisions) is Gate I.5.2's job. `categoryStandardRoutes.ts` itself was only given a
 * documentation comment pointing here, no value changed.
 *
 * Per-category canonical decisions made in this gate (see each adapter's own header comment for
 * evidence, and the Gate I.5.1 report for full reasoning):
 *   - Servicios:      "/publicar/servicios" (already the value the pre-existing SERVICIOS_ADAPTER
 *                      used — this gate confirms it as decided-canonical, no value changed).
 *   - Empleos:         "/publicar/empleos" (new adapter this gate; quick/premium/feria lanes
 *                      preserved as sub-routes, documented in knownLimitations).
 *   - Bienes Raíces:   hub = "/clasificados/publicar/bienes-raices" (CORRECTED in Gate I.5.3A —
 *                      originally set to "/publicar/bienes-raices" here in Gate I.5.2, which was
 *                      proven wrong: that route is a Negocio-only property-type selector with no
 *                      Privado path, per brPublishRoutes.ts:12,17,21. The old nested-tree hub is
 *                      the only page offering the real Privado-vs-Negocio choice — retained as
 *                      a documented temporary exception, same reasoning as Rentas/En Venta). The
 *                      pre-existing NEGOCIO adapter's `applicationRoute` (the real deep
 *                      multi-step form) remains UNCHANGED — the hub funnels into it, it does not
 *                      replace it. PRIVADO adapter's `applicationRoute` =
 *                      "/publicar/bienes-raices/privado" (confirmed to mount the same
 *                      BienesRaicesPrivadoApplication as its nested counterpart) — unchanged.
 *   - Rentas:          no modern flat `/publicar/rentas` hub exists (confirmed absent) — the
 *                      nested `/clasificados/publicar/rentas/{negocio,privado}` hub is retained
 *                      as a documented temporary exception, same reasoning as En Venta below.
 *                      Each lane's own `applicationRoute` DOES have a confirmed modern flat
 *                      counterpart though (`/publicar/rentas/{negocio,privado}`), used here.
 *   - Restaurantes:    unchanged — already fully resolved to "/publicar/restaurantes" pre-gate.
 *                      The separate `/clasificados/publicar/restaurantes/page.tsx` selector's
 *                      unique-behavior status is UNCONFIRMED (not investigated deeply enough in
 *                      Gate I.5A to prove it's a safe zero-behavior-change duplicate) — left
 *                      untouched, flagged for Gate I.5.2/I.5.7 investigation before any action.
 *   - En Venta/Varios: NO modern `/publicar/en-venta` route exists, and Gate I.5.1 was
 *                      explicitly barred from building one without proof of zero behavior
 *                      change (not attempted this gate — the Pro application component's
 *                      dependencies were not audited deeply enough to prove that). DECISION:
 *                      Option B — the nested `/clasificados/publicar/en-venta` (Pro lane) is
 *                      formally retained as canonical, documented as a temporary exception, not
 *                      left ambiguous.
 */

import type {
  CanonicalCategoryKey,
  CategoryRouteAdapter,
  InventoryRole,
  ListingIdentity,
  RouteResolveOpts,
} from "./types";

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
// Existing-listing edit route (Gate I.5.7E — corrected; was wrongly declared unsupported):
//   restauranteListingEditHref, app/(site)/dashboard/lib/restaurantesDashboardCouponAddonCheckout.ts:273-289
//   (`/publicar/restaurantes?...&mode=listing-edit&listingId=...`), the real helper already
//   called via router.push at app/(site)/dashboard/restaurantes/page.tsx:307-313.
// Coupon-edit-only route (distinct mode, unaffected by this correction):
//   restauranteCouponEditHref, app/(site)/dashboard/lib/restaurantesDashboardCouponAddonCheckout.ts:291-307
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

  // Gate I.5.7E — corrected. A confirmed full-listing dashboard edit route exists and is
  // already actively used: restauranteListingEditHref (restaurantesDashboardCouponAddonCheckout.ts:273-289),
  // called via router.push at dashboard/restaurantes/page.tsx:307-313. Mirrors that helper's
  // exact param set (`source`, `mode: "listing-edit"`, `listingId`, optional `leonixAdId`,
  // `returnPanel: "restaurantes"`) — distinct from the coupon-only secondaryManageRoute below
  // (`mode: "coupon-edit"`).
  editRoute: (identity, opts) => {
    const params = new URLSearchParams({
      source: "dashboard",
      mode: "listing-edit",
      listingId: identity.sourceId,
    });
    if (identity.leonixAdId) params.set("leonixAdId", identity.leonixAdId);
    params.set("returnPanel", "restaurantes");
    return withLang(`/publicar/restaurantes?${params.toString()}`, lang(opts));
  },

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
  // Gate I.5.3A CORRECTION (was "/publicar/bienes-raices" in Gate I.5.2 — proven wrong): that
  // route renders PublicarBienesRaicesNegocioSelectorClient, confirmed by reading its source to
  // be a NEGOCIO-ONLY property-type + inventory-child selector with no Privado path at all (see
  // brPublishRoutes.ts:17's own comment: "Negocio: seller + property category selector"). The
  // ONLY page offering the real Privado-vs-Negocio choice is this one — brPublishRoutes.ts:12,21
  // ("Hub: elegir Negocio vs Privado"). Temporary canonical exception, same reasoning as Rentas
  // and En Venta: no modern replacement hub exists yet.
  hubRoute: "/clasificados/publicar/bienes-raices",
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
  // Gate I.5.2 addition (new field only) — canonical branch chooser:
  // app/(site)/publicar/autos/page.tsx (PublicarAutosBranchClient), already the value used by
  // dashboard/page.tsx's Autos publishHref pre-Gate-I.5.2.
  hubRoute: "/publicar/autos",
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
  // Gate I.5.2 addition (new field only) — same branch chooser as Autos Negocios.
  hubRoute: "/publicar/autos",
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

// ---------------------------------------------------------------------------------------
// Bienes Raíces Privado
// Shares entry/results with Negocio (app/(site)/clasificados/bienes-raices/shared/constants/
//   brPublishRoutes.ts:26,28 — BR_CATEGORY_HOME, BR_RESULTS). Canonical hub decision above.
// Application (public entry, confirmed to mount the same BienesRaicesPrivadoApplication as its
//   nested BR_PUBLICAR_PRIVADO counterpart): brPublishRoutes.ts:15
//   (BR_PUBLICAR_PRIVADO_PUBLIC_ENTRY = "/publicar/bienes-raices/privado").
// Preview: brPublishRoutes.ts:25 (BR_PREVIEW_PRIVADO = "/clasificados/bienes-raices/preview/privado").
// Public detail: same shared anuncio shell as Negocio.
// ---------------------------------------------------------------------------------------
const BIENES_RAICES_PRIVADO_ADAPTER: CategoryRouteAdapter = {
  pipeline: "bienes_raices_privado",
  category: "bienes-raices",
  sourceTable: "listings",
  entryRoute: "/clasificados/bienes-raices",
  applicationRoute: "/publicar/bienes-raices/privado",
  // Gate I.5.3A CORRECTION — see the Negocio adapter's hubRoute comment above for the evidence;
  // both lanes of the same family always share one hub value.
  hubRoute: "/clasificados/publicar/bienes-raices",
  resultsRoute: "/clasificados/bienes-raices/resultados",

  publicRoute: (identity) => `/clasificados/anuncio/${identity.sourceId}`,

  // No confirmed dashboard edit-route builder distinct from Negocio's was found in the Gate
  // I.5A pass — the Gate B registry only ever covered the Negocio pipeline's editRoute. Rather
  // than assume the same query-param shape applies, this returns null honestly.
  editRoute: () => null,

  previewRoute: (identity, opts) => {
    const params = dashboardEditParams({
      mode: "listing-edit",
      listingId: identityListingIdForEdit(identity),
      leonixAdId: identity.leonixAdId,
      returnPanel: "bienes-raices",
    });
    params.set("preview", "listing");
    return withLang(`/clasificados/bienes-raices/preview/privado?${params.toString()}`, lang(opts));
  },

  dashboardRoute: (_identity, opts) => withLang("/dashboard/mis-anuncios", lang(opts)),

  supportsParentChildInventory: false,
  supportsCoupons: false,
  supportsBusinessHub: false,

  knownLimitations: [
    "editRoute() returns null — no confirmed dashboard full-listing edit route was found " +
      "specific to the Privado lane (only Negocio's edit route was confirmed in Gate B/I.5A).",
    "results/resultados duplicate: Gate I.5A found both `/clasificados/bienes-raices/results` " +
      "(brPublishRoutes.ts:28) and `/clasificados/bienes-raices/resultados` (also live) exist. " +
      "`resultados` was chosen here for consistency with the pre-existing Negocio adapter; the " +
      "`results` duplicate is a future-redirect candidate, not deleted or redirected here.",
  ],
};

// ---------------------------------------------------------------------------------------
// Rentas Negocio / Privado
// Landing: app/(site)/clasificados/rentas/shared/utils/rentasPublishRoutes.ts:21 (RENTAS_LANDING).
// Hub decision: no modern flat `/publicar/rentas` index exists (confirmed absent) — nested hub
//   retained as documented temporary exception (see file header).
// Application (public entry, confirmed same components as nested counterparts):
//   rentasPublishRoutes.ts:9 (RENTAS_PUBLICAR_NEGOCIO_PUBLIC_ENTRY="/publicar/rentas/negocio"),
//   :13 (RENTAS_PUBLICAR_PRIVADO_PUBLIC_ENTRY="/publicar/rentas/privado").
// Preview: rentasPublishRoutes.ts:15 (RENTAS_PREVIEW_NEGOCIO), :10 (RENTAS_PREVIEW_PRIVADO).
// Results: rentasPublishRoutes.ts:18 (RENTAS_RESULTS = "/clasificados/rentas/results").
// Renewal: confirmed real (`operation:"renew_listing"` via /api/revenue-os/checkout,
//   `rentas_30d`), but triggered by an async checkout call, not a navigable URL — not
//   represented as a route field here to avoid fabricating a page that doesn't exist.
// ---------------------------------------------------------------------------------------
const RENTAS_NEGOCIO_ADAPTER: CategoryRouteAdapter = {
  pipeline: "rentas_negocio",
  category: "rentas",
  sourceTable: "listings",
  entryRoute: "/clasificados/rentas",
  applicationRoute: "/publicar/rentas/negocio",
  // Gate I.5.2 — nested hub per the Gate I.5.1 documented temporary exception (no modern flat
  // /publicar/rentas index exists): rentasPublishRoutes.ts:4 (RENTAS_PUBLICAR_HUB).
  hubRoute: "/clasificados/publicar/rentas",
  resultsRoute: "/clasificados/rentas/results",

  // CORRECTED in Gate I.5.4D — was `/clasificados/anuncio/${identity.sourceId}` (the shared
  // generic multi-category shell). Every live Rentas caller audited in that gate (dashboard,
  // Mis Anuncios, admin, results/landing cards, the canonical page's own share link) already uses
  // `rentasListingPublicPath()` (rentasPublishRoutes.ts:24,26-28,
  // RENTAS_LISTING_PUBLIC_BASE="/clasificados/rentas/listing"), which reuses the approved
  // `RentasVisualMatchPreviewView` renderer with proven Preview → Published parity. This registry
  // was the one place still resolving to the old, less-proven shell.
  publicRoute: (identity) => `/clasificados/rentas/listing/${identity.sourceId}`,

  // Gate I.5A confirmed a real edit API (app/api/clasificados/rentas/listing-edit/route.ts) but
  // no confirmed dashboard href-builder constant for it — returning null rather than guessing.
  editRoute: () => null,

  previewRoute: (identity, opts) => withLang(`/clasificados/rentas/preview/negocio?listingId=${encodeURIComponent(identity.sourceId)}`, lang(opts)),

  dashboardRoute: (_identity, opts) => withLang("/dashboard/mis-anuncios", lang(opts)),

  supportsParentChildInventory: false,
  supportsCoupons: false,
  supportsBusinessHub: true,

  knownLimitations: [
    "editRoute() returns null — a real edit API exists but no confirmed dashboard href-builder " +
      "was found for it in Gate I.5A's pass.",
    "A confirmed renewal capability exists (operation:\"renew_listing\" via the shared " +
      "/api/revenue-os/checkout endpoint) but is not representable as a `route` here — it's an " +
      "async checkout call, not a navigable page.",
    "The old shared `/clasificados/anuncio/[id]` route is kept as a compatibility fallback for " +
      "any not-yet-rewired inbound link (Gate I.5.4D deliberately did not touch or redirect that " +
      "shared multi-category file — it also serves En Venta and Bienes Raíces).",
  ],
};

const RENTAS_PRIVADO_ADAPTER: CategoryRouteAdapter = {
  pipeline: "rentas_privado",
  category: "rentas",
  sourceTable: "listings",
  entryRoute: "/clasificados/rentas",
  applicationRoute: "/publicar/rentas/privado",
  hubRoute: "/clasificados/publicar/rentas",
  resultsRoute: "/clasificados/rentas/results",

  // CORRECTED in Gate I.5.4D — same reasoning as Rentas Negocio above.
  publicRoute: (identity) => `/clasificados/rentas/listing/${identity.sourceId}`,
  editRoute: () => null,
  previewRoute: (identity, opts) => withLang(`/clasificados/rentas/preview/privado?listingId=${encodeURIComponent(identity.sourceId)}`, lang(opts)),
  dashboardRoute: (_identity, opts) => withLang("/dashboard/mis-anuncios", lang(opts)),

  supportsParentChildInventory: false,
  supportsCoupons: false,
  supportsBusinessHub: false,

  knownLimitations: [
    "editRoute() returns null — same reasoning as Rentas Negocio.",
    "Same confirmed-but-unrepresentable renewal capability as Rentas Negocio.",
  ],
};

// ---------------------------------------------------------------------------------------
// Empleos
// Entry: app/(site)/clasificados/empleos/page.tsx. Backing table confirmed:
//   app/api/clasificados/empleos/listings/route.ts (.from("empleos_public_listings")).
// Publish-start DECISION: "/publicar/empleos" (canonical hub) — the legacy
//   EMPLEOS_PUBLISH_HUB_PATH="/clasificados/publicar/empleos" (empleosLandingRoutes.ts:9) still
//   self-declares canonical and disagrees; that conflict is Gate I.5.2's to resolve in the live
//   CTA layer. Lanes preserved: /publicar/empleos/{quick,premium,feria}.
// Edit: dedicated dashboard, /dashboard/empleos/[listingId] (confirmed, live).
// Results DECISION: "/clasificados/empleos/resultados" — matches the live
//   dashboardMisAnunciosCategories wiring AND (as of Gate I.5.8) buildEmpleosResultadosUrl
//   (app/(site)/clasificados/empleos/shared/utils/empleosListaUrl.ts), the shared builder behind
//   ~30 live public landing/results call sites. The legacy "/results" wrapper page remains for
//   compatibility (results/page.tsx re-exports resultados/page.tsx) but is no longer actively
//   generated by any known live caller.
// ---------------------------------------------------------------------------------------
const EMPLEOS_ADAPTER: CategoryRouteAdapter = {
  pipeline: "empleos",
  category: "empleos",
  sourceTable: "empleos_public_listings",
  entryRoute: "/clasificados/empleos",
  applicationRoute: "/publicar/empleos",
  resultsRoute: "/clasificados/empleos/resultados",

  publicRoute: (identity) => identity.publicUrl || null,

  editRoute: (identity, opts) => withLang(`/dashboard/empleos/${encodeURIComponent(identity.sourceId)}`, lang(opts)),

  // Preview is lane-specific (quick-preview/premium-preview/feria-preview) and cannot be
  // resolved generically from identity alone without knowing which lane the listing used —
  // returning null rather than guessing a lane.
  previewRoute: () => null,

  dashboardRoute: (_identity, opts) => withLang("/dashboard/empleos", lang(opts)),

  supportsParentChildInventory: false,
  supportsCoupons: false,
  supportsBusinessHub: false,

  knownLimitations: [
    "previewRoute() returns null — three lane-specific preview routes exist " +
      "(/clasificados/empleos/{quick,premium,feria}-preview) but this adapter cannot determine " +
      "which lane a given identity used without additional (unconfirmed) lookup.",
    "applicationRoute points at the modern \"/publicar/empleos\" hub per this gate's decision; " +
      "the old EMPLEOS_PUBLISH_HUB_PATH constant and several live CTAs still point at the legacy " +
      "\"/clasificados/publicar/empleos\" — unresolved in the live layer until Gate I.5.2.",
    "Gate I.5.8 — resultsRoute \"/resultados\" is now the sole actively-generated results " +
      "destination (buildEmpleosResultadosUrl and EMPLEOS_RESULTS_PATH both corrected to match). " +
      "\"/clasificados/empleos/results\" remains live as a compatibility wrapper page only.",
  ],
};

// ---------------------------------------------------------------------------------------
// En Venta / Varios — DECISION: Option B, nested route formally retained as canonical (see
// file header). No modern `/publicar/en-venta` exists and none was built this gate.
// Entry: app/(site)/clasificados/en-venta/page.tsx.
// Application: app/(site)/clasificados/en-venta/shared/constants/enVentaPublishRoutes.ts:5
//   (EN_VENTA_PUBLICAR_PRO = "/clasificados/publicar/en-venta/pro" — the active lane; Free lane
//   is parked, Storefront lane exists separately).
// Preview: app/(site)/clasificados/en-venta/preview/page.tsx.
// Public detail: shared anuncio shell (app/(site)/clasificados/anuncio/[id]/page.tsx:56-60).
// ---------------------------------------------------------------------------------------
const EN_VENTA_ADAPTER: CategoryRouteAdapter = {
  pipeline: "en_venta",
  category: "en-venta",
  sourceTable: "listings",
  entryRoute: "/clasificados/en-venta",
  applicationRoute: "/clasificados/publicar/en-venta/pro",
  resultsRoute: "/clasificados/en-venta/results",

  publicRoute: (identity) => `/clasificados/anuncio/${identity.sourceId}`,

  // Gate I.6A — corrected. A real, generic, owner-verified edit page exists and is already
  // live-wired for En Venta rows: app/(site)/dashboard/mis-anuncios/[id]/editar/page.tsx, reached
  // via EnVentaListingManageCard's editHref and the per-listing workspace (both build
  // `/dashboard/mis-anuncios/${id}/editar?lang=${lang}` — confirmed exact query shape, no other
  // params). It UPDATEs the same row by UUID (never inserts), scoped to owner_id both client-side
  // and via Postgres RLS. Limited to title/price/description/photos/status — not the full
  // category-specific Pro/Free application fields (see knownLimitations).
  editRoute: (identity, opts) => withLang(`/dashboard/mis-anuncios/${identity.sourceId}/editar`, lang(opts)),

  previewRoute: (_identity, opts) => withLang("/clasificados/en-venta/preview", lang(opts)),

  dashboardRoute: (_identity, opts) => withLang("/dashboard/mis-anuncios", lang(opts)),

  supportsParentChildInventory: false,
  supportsCoupons: false,
  supportsBusinessHub: false,

  knownLimitations: [
    "DOCUMENTED TEMPORARY EXCEPTION (Gate I.5.1 decision): no modern \"/publicar/en-venta\" " +
      "route exists anywhere in the repository, unlike every other monetized category. Building " +
      "one was explicitly out of scope for this gate (would have required proving a zero-" +
      "behavior-change wrapper around the Pro application component, not attempted). The nested " +
      "\"/clasificados/publicar/en-venta/pro\" route is retained as canonical until a future gate " +
      "either builds the modern equivalent or formally re-confirms this exception.",
    "Gate I.6A — editRoute() now resolves to the generic /dashboard/mis-anuncios/{id}/editar " +
      "page (title/price/description/photos/status only). The category-specific Pro/Free " +
      "application fields have no edit surface; re-running the publish flow always inserts a " +
      "new row rather than updating the existing one (no prefill-from-existing exists).",
    "A separate Storefront lane (EN_VENTA_PUBLICAR_STOREFRONT) exists but is not represented " +
      "here — this adapter only covers the active Pro lane.",
    "No Stripe/checkout wiring was found for base En Venta listings in Gate I.5A's pass (Pro " +
      "appears to be included at no charge per an in-code comment) — supportsBusinessHub/" +
      "Coupons left false, not because the Storefront concept doesn't imply business-like use, " +
      "but because no confirmed monetization contract was found to justify true.",
  ],
};

// ---------------------------------------------------------------------------------------
// Comida Local
// Entry: app/(site)/clasificados/comida-local/page.tsx. Backing table confirmed:
//   app/api/clasificados/comida-local/publish/route.ts (.from("comida_local_public_listings")).
// Application: app/(site)/publicar/comida-local/page.tsx — the only publish route found, no
//   legacy duplicate (already fully modern per Gate I.5A).
// Preview: app/(site)/clasificados/comida-local/preview/page.tsx.
// ---------------------------------------------------------------------------------------
const COMIDA_LOCAL_ADAPTER: CategoryRouteAdapter = {
  pipeline: "comida_local",
  category: "comida-local",
  sourceTable: "comida_local_public_listings",
  entryRoute: "/clasificados/comida-local",
  applicationRoute: "/publicar/comida-local",
  // No dedicated results/browse route was confirmed distinct from the landing page in Gate
  // I.5A's pass — the landing page itself appears to embed browse. Using entryRoute's value
  // honestly rather than inventing a results path that may not exist.
  resultsRoute: "/clasificados/comida-local",

  publicRoute: (identity) => identity.publicUrl || null,
  editRoute: () => null,
  previewRoute: (_identity, opts) => withLang("/clasificados/comida-local/preview", lang(opts)),
  dashboardRoute: (_identity, opts) => withLang("/dashboard/mis-anuncios", lang(opts)),

  supportsParentChildInventory: false,
  supportsCoupons: false,
  supportsBusinessHub: false,

  knownLimitations: [
    "resultsRoute duplicates entryRoute — no separate results/browse page was confirmed to " +
      "exist for this category; treat as unconfirmed rather than a genuine distinct route.",
    "editRoute() returns null — not confirmed in Gate I.5A's pass.",
  ],
};

// ---------------------------------------------------------------------------------------
// Ofertas Locales
// Entry: app/(site)/clasificados/ofertas-locales/page.tsx. Backing table confirmed via grep of
//   app/api for ofertas/cupon-related .from() calls: "ofertas_locales".
// Application: app/(site)/publicar/ofertas-locales/page.tsx (only route, already modern).
// Dashboard: /dashboard/ofertas-locales — confirmed DEDICATED, NOT part of Mis Anuncios
//   (absent from dashboardMisAnunciosCategories.ts's MIS_ANUNCIOS_CATEGORY_KEYS).
// Cupones: confirmed non-standalone — /cupones renders the same OfertasLocalesPublicSearchClient
//   with surface="cupones"; not a separate pipeline/adapter (see CanonicalCategoryKey doc).
// ---------------------------------------------------------------------------------------
const OFERTAS_LOCALES_ADAPTER: CategoryRouteAdapter = {
  pipeline: "ofertas_locales",
  category: "ofertas-locales",
  sourceTable: "ofertas_locales",
  entryRoute: "/clasificados/ofertas-locales",
  applicationRoute: "/publicar/ofertas-locales",
  resultsRoute: "/clasificados/ofertas-locales/results",

  publicRoute: (identity) => identity.publicUrl || null,

  editRoute: (identity, opts) => withLang(`/dashboard/ofertas-locales/${encodeURIComponent(identity.sourceId)}`, lang(opts)),
  previewRoute: (_identity, opts) => withLang("/publicar/ofertas-locales/preview", lang(opts)),
  dashboardRoute: (_identity, opts) => withLang("/dashboard/ofertas-locales", lang(opts)),

  supportsParentChildInventory: false,
  // "supportsCoupons" here means a coupon *add-on sub-flow on top of* the category, mirroring
  // Restaurantes/Servicios — Ofertas Locales IS itself the coupon/offer surface, not a category
  // with an add-on, so this is correctly false, not an oversight.
  supportsCoupons: false,
  supportsBusinessHub: false,

  knownLimitations: [
    "No payment/checkout route was confirmed for Ofertas Locales base publishing in Gate I.5A's " +
      "pass — may ride on a business-profile entitlement elsewhere; not resolved here.",
    "Cupones (/cupones, /cupones/resultados) is intentionally NOT a separate adapter — confirmed " +
      "to be a filtered view (surface=\"cupones\") over this same pipeline's public data.",
  ],
};

// ---------------------------------------------------------------------------------------
// Busco / Se busca — quick free-ad category.
// Entry: app/(site)/clasificados/busco/page.tsx.
// Application (confirmed canonical, matches majority of live callers):
//   app/(site)/publicar/busco/shared/buscoPublishRoutes.ts:4 (BUSCO_QUICK_ROUTE).
// Preview: buscoPublishRoutes.ts:5 (BUSCO_PREVIEW_ROUTE).
// Public detail: shared anuncio shell (BuscoPublishedDetailPage, confirmed).
// Legacy: app/(site)/clasificados/publicar/busco/page.tsx is a confirmed WORKING redirect() to
//   the application route above — a correct compatibility shim, not a conflict.
// ---------------------------------------------------------------------------------------
const BUSCO_ADAPTER: CategoryRouteAdapter = {
  pipeline: "busco",
  category: "busco",
  sourceTable: "listings",
  entryRoute: "/clasificados/busco",
  applicationRoute: "/publicar/busco/quick",
  resultsRoute: "/clasificados/busco/resultados",

  publicRoute: (identity) => `/clasificados/anuncio/${identity.sourceId}`,

  // Gate I.6A — corrected. buscoQuickEditUrl() (buscoPublishRoutes.ts) is confirmed to be a
  // return-to-in-progress-draft link only (no id/query param at all, used solely by the preview
  // page's "volver a editar" — it targets the SAME session draft, not a published listing). The
  // real edit-an-existing-published-listing surface is the same generic, owner-verified,
  // UPDATE-by-UUID page used by every other listings-table category:
  // app/(site)/dashboard/mis-anuncios/[id]/editar/page.tsx (`/dashboard/mis-anuncios/${id}/editar?lang=`).
  editRoute: (identity, opts) => withLang(`/dashboard/mis-anuncios/${identity.sourceId}/editar`, lang(opts)),

  previewRoute: (_identity, opts) => withLang("/publicar/busco/quick/preview", lang(opts)),
  dashboardRoute: (_identity, opts) => withLang("/dashboard/mis-anuncios", lang(opts)),

  supportsParentChildInventory: false,
  supportsCoupons: false,
  supportsBusinessHub: false,

  knownLimitations: [
    "Gate I.6A — editRoute() now resolves to the generic /dashboard/mis-anuncios/{id}/editar " +
      "page. Re-running /publicar/busco/quick with intent to edit an existing published listing " +
      "still always INSERTs a brand-new row (publishBuscoQuickToListings has no update-if-exists " +
      "branch) — there is no way to target the category's own quick-form UI at an existing row, " +
      "only the generic editor above.",
    "The old /clasificados/page.tsx landing hub's own hardcoded CATEGORY_PUBLISH_PATH map still " +
      "disagrees with this decision (uses the legacy /clasificados/publicar/busco path directly, " +
      "bypassing even its own working redirect shim) — a live-CTA conflict for Gate I.5.2, not " +
      "fixed here.",
    "results/resultados duplicate exists (both directories present) — resultados chosen for " +
      "consistency with live dashboard wiring.",
  ],
};

// ---------------------------------------------------------------------------------------
// Clases / Comunidad — free quick-ad categories with NO dedicated Mis Anuncios category tab
// (confirmed `ready:false`, `manageHref: () => null` in dashboardMisAnunciosCategories.ts, still
// true as of Gate I.6A). dashboardRoute() honestly returns null rather than resolving to
// `/dashboard/mis-anuncios` as if a dedicated tab existed. Gate I.6A found this needs a caveat,
// not a value change: a real, generic, non-category-gated per-listing workspace + editor
// (app/(site)/dashboard/mis-anuncios/[id]/page.tsx and its /editar sibling) IS reachable for
// these rows once you already have the listing's UUID — see each adapter's editRoute/
// knownLimitations below. Both categories share one implementation
// (CommunityQuickApplicationClient({kind: "clases"|"comunidad"})) — this is intentional code
// sharing, not two divergent products, confirmed by direct inspection.
// ---------------------------------------------------------------------------------------
const CLASES_ADAPTER: CategoryRouteAdapter = {
  pipeline: "clases",
  category: "clases",
  sourceTable: "listings",
  entryRoute: "/clasificados/clases",
  applicationRoute: "/publicar/clases/quick",
  resultsRoute: "/clasificados/clases/resultados",

  publicRoute: (identity) => `/clasificados/anuncio/${identity.sourceId}`,
  // Gate I.6A — corrected. Same generic, owner-verified, UPDATE-by-UUID edit page as every other
  // listings-table quick category (app/(site)/dashboard/mis-anuncios/[id]/editar/page.tsx).
  // Limited to title/price/description/photos/status — the category-specific fields (schedule,
  // audience, links, etc., stored in detail_pairs) have no edit surface.
  editRoute: (identity, opts) => withLang(`/dashboard/mis-anuncios/${identity.sourceId}/editar`, lang(opts)),
  previewRoute: (_identity, opts) => withLang("/publicar/clases/quick/preview", lang(opts)),
  // Confirmed `ready:false`, `manageHref: () => null` in dashboardMisAnunciosCategories.ts —
  // no DEDICATED category tab exists; this must not be resolved as /dashboard/mis-anuncios.
  dashboardRoute: () => null,

  supportsParentChildInventory: false,
  supportsCoupons: false,
  supportsBusinessHub: false,

  knownLimitations: [
    "dashboardRoute() returns null on purpose — no dedicated Mis Anuncios category tab exists " +
      "(confirmed still true). A generic, non-category-gated per-listing workspace is reachable " +
      "once the owner has the listing's UUID (see editRoute).",
    "Gate I.6A — editRoute() now resolves to the generic /dashboard/mis-anuncios/{id}/editar " +
      "page. publishCommunityQuickToListings always INSERTs a fresh row on every publish click " +
      "(no update-if-exists check, no dedup against a prior successful publish of the same " +
      "session draft) — a real, structural duplicate-row risk on double-submit, not repaired here.",
  ],
};

const COMUNIDAD_ADAPTER: CategoryRouteAdapter = {
  pipeline: "comunidad",
  category: "comunidad",
  sourceTable: "listings",
  entryRoute: "/clasificados/comunidad",
  applicationRoute: "/publicar/comunidad/quick",
  resultsRoute: "/clasificados/comunidad/resultados",

  publicRoute: (identity) => `/clasificados/anuncio/${identity.sourceId}`,
  // Gate I.6A — corrected, same reasoning as Clases above (shared implementation).
  editRoute: (identity, opts) => withLang(`/dashboard/mis-anuncios/${identity.sourceId}/editar`, lang(opts)),
  previewRoute: (_identity, opts) => withLang("/publicar/comunidad/quick/preview", lang(opts)),
  dashboardRoute: () => null,

  supportsParentChildInventory: false,
  supportsCoupons: false,
  supportsBusinessHub: false,

  knownLimitations: [
    "dashboardRoute() returns null on purpose — no dedicated Mis Anuncios category tab exists " +
      "(confirmed still true). A generic, non-category-gated per-listing workspace is reachable " +
      "once the owner has the listing's UUID (see editRoute).",
    "Gate I.6A — editRoute() now resolves to the generic /dashboard/mis-anuncios/{id}/editar " +
      "page. Same fresh-INSERT-on-every-publish duplicate-row risk as Clases (shared publish " +
      "implementation), not repaired here.",
    "Gate I.6A — corrected: the previously-flagged \"separate /publicar/community/ tree, not " +
      "confirmed whether same product\" concern was unfounded. Direct inspection confirms there " +
      "is no standalone routable page under app/(site)/publicar/community/ at all — it is purely " +
      "the shared component/logic library both /publicar/clases/quick and /publicar/comunidad/" +
      "quick import from. Not a duplicate product, not a fork.",
  ],
};

const MASCOTAS_Y_PERDIDOS_ADAPTER: CategoryRouteAdapter = {
  pipeline: "mascotas_y_perdidos",
  category: "mascotas-y-perdidos",
  sourceTable: "listings",
  entryRoute: "/clasificados/mascotas-y-perdidos",
  applicationRoute: "/publicar/mascotas-y-perdidos/quick",
  // mascotasPerdidosResultsUrl() is the actual live-called function for this route.
  resultsRoute: "/clasificados/mascotas-y-perdidos/results",

  // Gate I.6B — corrected. The shared shell's root cause (CATEGORY_KEYS allowlist omission,
  // see knownLimitations) is now fixed: app/(site)/clasificados/anuncio/[id]/page.tsx accepts
  // "mascotas-y-perdidos" and renders it through a real, dedicated
  // MascotasPerdidosPublishedDetailPage component. Verified route shape matches every other
  // UUID-keyed quick category exactly.
  publicRoute: (identity) => `/clasificados/anuncio/${identity.sourceId}`,
  // Deliberately still null — no category-specific editor exists for Mascotas, and the public
  // rendering fix does not by itself create a safe edit surface. Do not expose the generic Edit
  // page here without separately proving it's safe for this category's data shape.
  editRoute: () => null,
  previewRoute: (_identity, opts) => withLang("/publicar/mascotas-y-perdidos/quick/preview", lang(opts)),
  dashboardRoute: () => null,

  supportsParentChildInventory: false,
  supportsCoupons: false,
  supportsBusinessHub: false,

  knownLimitations: [
    "Gate I.6B — repaired. Root cause was the shared shell's CATEGORY_KEYS allowlist " +
      "(app/(site)/clasificados/anuncio/[id]/page.tsx) omitting \"mascotas-y-perdidos\", which " +
      "silently coerced every real Mascotas listing to render as En Venta. Fixed by adding the " +
      "category to the allowlist and adding a dedicated dispatch branch rendering " +
      "MascotasPerdidosPublishedDetailPage (a new, category-specific component built from this " +
      "category's own detail_pairs contract — lost/found/adoption notice type, last-known " +
      "location, contact — not a copy of the En Venta renderer). Regression-tested to confirm " +
      "every other shell-served category's classification is unaffected.",
    "editRoute() remains null on purpose — public rendering being fixed does not by itself " +
      "create a safe category-specific edit surface; the generic /dashboard/mis-anuncios/{id}/" +
      "editar page is intentionally NOT exposed for this pipeline pending separate confirmation.",
    "dashboardRoute() returns null — confirmed absent from Mis Anuncios entirely (no key in " +
      "dashboardMisAnunciosCategories.ts), still true as of Gate I.6B.",
  ],
};

// ---------------------------------------------------------------------------------------
// Viajes
// Entry: app/(site)/clasificados/viajes/page.tsx. Backing table confirmed:
//   app/api/clasificados/viajes/** (.from("viajes_staged_listings")).
// Application: app/(site)/publicar/viajes/page.tsx is the branch chooser
//   (PublicarViajesBranchClient); real lane forms at /publicar/viajes/{negocios,privado}.
// Dashboard: /dashboard/viajes — dedicated, confirmed.
// No payment/checkout wiring found (lead/inquiry-based model, not Stripe).
// ---------------------------------------------------------------------------------------
const VIAJES_ADAPTER: CategoryRouteAdapter = {
  pipeline: "viajes",
  category: "viajes",
  sourceTable: "viajes_staged_listings",
  entryRoute: "/clasificados/viajes",
  applicationRoute: "/publicar/viajes",
  resultsRoute: "/clasificados/viajes/resultados",

  // Gate I.5A found TWO separate public detail trees for this category
  // (/clasificados/viajes/negocio/[slug] and /clasificados/viajes/oferta/[slug]) and could not
  // confirm which applies to a given identity without a product-level clarification of whether
  // they represent the same or different listing concepts. Returning null rather than guessing.
  publicRoute: () => null,
  editRoute: () => null,
  previewRoute: () => null,
  dashboardRoute: (_identity, opts) => withLang("/dashboard/viajes", lang(opts)),

  supportsParentChildInventory: false,
  supportsCoupons: false,
  supportsBusinessHub: true,

  knownLimitations: [
    "publicRoute()/previewRoute() return null — CONFIRMED AMBIGUITY, not merely unresolved: two " +
      "separate detail-page trees exist (negocio/[slug] vs oferta/[slug]) and preview has " +
      "matching negocios/privado sub-branches; resolving this needs product clarification on " +
      "whether these represent the same listing concept, not a routing guess.",
    "Gate I.5.8 — the previously-stale categoryPublishPath(\"viajes\") value in " +
      "categoryStandardRoutes.ts (which mapped to a confirmed-nonexistent route folder, with zero " +
      "confirmed live callers) has been corrected to match this adapter's applicationRoute.",
    "No Stripe/checkout wiring found — appears to be a lead/inquiry model, not paid publishing; " +
      "supportsBusinessHub left true only because a negocio (business) lane genuinely exists.",
  ],
};

/** Category registry — the source of truth this module actually exposes. */
export const CATEGORY_ROUTE_REGISTRY = {
  restaurantes: RESTAURANTES_ADAPTER,
  servicios: SERVICIOS_ADAPTER,
  bienes_raices_negocio: BIENES_RAICES_NEGOCIO_ADAPTER,
  bienes_raices_privado: BIENES_RAICES_PRIVADO_ADAPTER,
  autos_negocios: AUTOS_NEGOCIOS_ADAPTER,
  autos_privado: AUTOS_PRIVADO_ADAPTER,
  rentas_negocio: RENTAS_NEGOCIO_ADAPTER,
  rentas_privado: RENTAS_PRIVADO_ADAPTER,
  empleos: EMPLEOS_ADAPTER,
  en_venta: EN_VENTA_ADAPTER,
  comida_local: COMIDA_LOCAL_ADAPTER,
  ofertas_locales: OFERTAS_LOCALES_ADAPTER,
  busco: BUSCO_ADAPTER,
  clases: CLASES_ADAPTER,
  comunidad: COMUNIDAD_ADAPTER,
  mascotas_y_perdidos: MASCOTAS_Y_PERDIDOS_ADAPTER,
  viajes: VIAJES_ADAPTER,
} as const satisfies Record<CanonicalCategoryKey, CategoryRouteAdapter>;

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
