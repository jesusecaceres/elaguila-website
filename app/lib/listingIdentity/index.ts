/**
 * Gate B/D — public barrel export for the canonical listing identity, category route registry,
 * and dashboard action resolver.
 *
 * Gate D.1 status: `resolveDashboardActions` is live-wired into the Restaurantes and Servicios
 * dashboard action builder (dashboardMisAnunciosCategoryTools.ts), but only for the href-based
 * actions verified byte-identical to the pre-existing live routes — "viewPublic" for both
 * pipelines, and "analytics" for Servicios (Restaurantes analytics stays "unproven"/hidden).
 * Servicios "edit"/"preview" were deliberately NOT switched to the resolver: the registry's
 * route builders omit the `listingSlug` query param (and the preview route forces
 * `mode=listing-edit`) that the live `serviciosListingEditHref`/`serviciosListingPreviewHref`
 * helpers include, a confirmed parity gap — swapping those without resolving the gap would risk
 * silently changing behavior on the receiving page. Restaurante coupon actions and Servicios
 * offers actions remain the existing async onClick handlers (hydration/checkout side effects),
 * never resolver hrefs.
 *
 * Gate D.2/D.2.2 status: `resolveDashboardActions` is additionally live-wired into the Bienes
 * Raíces Negocio dashboard — LeonixRealEstateListingManageCard.tsx ("viewPublic" for both parent
 * and child inventory-property rows, each keyed by its own row uuid; "edit"/"preview" for the
 * parent role only) and BrNegocioListingInventoryActions.tsx ("manageInventory", parent only,
 * entitlement-gated by the same `upgradeActive` truth the component already computed). Parent
 * edit/preview were initially withheld pending verification that the registry's `editRoute`/
 * `previewRoute` omitting `categoriaPropiedad` was safe — confirmed safe (Gate D.2.1): both the
 * Edit application and the dashboard-linked Preview client independently re-hydrate
 * `categoriaPropiedad` from the real DB row on mount (`hydrateBienesAgenteListingForDashboardEdit`),
 * so the query param is redundant, not required, whenever a real `listingId` is present. Child
 * edit/preview remain intentionally unwired and untouched — Gate D.2.1 traced a genuine,
 * pre-existing bug where hydrating a child's own id re-includes it as one of its own inventory
 * properties, corrupting save; this gate must not mask, repair, or further expose that bug. No
 * Analytics button was added for Bienes — none exists in this card today for any role, and adding
 * one would be new UI, not route-resolution truth.
 *
 * Gate D.3 status: `resolveDashboardActions` is additionally live-wired into the Auto Dealer
 * dashboard — AutosDealerInventoryDashboardSection.tsx, dealer-grouped section only (the separate
 * top "all Autos listings" flat list, which also renders Autos Privado rows, was left completely
 * untouched to guarantee zero risk of leaking dealer identity/actions into private listings).
 * Wired: parent "viewPublic"/"edit"/"preview"/"analytics"/"manageInventory", and child (vehicle)
 * "viewPublic"/"preview"/"analytics" — verified either byte-identical to the live builders
 * (`autosLiveVehiclePath`, `autosPaidListingAnalyticsHref`) or a pure addition of the row's real
 * `leonixAdId` to routes whose live call sites in this component simply omit it today (not a
 * missing-required-field gap). Child "edit"/"manageInventory" are never consumed — no per-child
 * dashboard Edit entry point exists yet, per the locked Gate D.3 product rule; the resolver's own
 * `parent`-only gating already excludes both for `autos_negocios` children regardless. A new
 * "Preview" button was added (previously absent from this component's UI) since Gate C made
 * Preview genuinely listing-bound for any owned negocios row, parent or child, by its own id.
 */

export type {
  CanonicalCategoryKey,
  CanonicalDbCategory,
  CanonicalSourceTable,
  CategoryRouteAdapter,
  InventoryChildIdentity,
  InventoryRole,
  ListingIdentity,
  ParentChildInventoryIdentity,
  RouteResolveOpts,
} from "./types";

export {
  buildListingIdentity,
  buildParentChildInventoryIdentity,
  isCanonicalUuid,
  unwrapListingIdentity,
} from "./identityBuilders";
export type {
  BuildListingIdentityError,
  BuildListingIdentityInput,
  BuildListingIdentityResult,
  BuildParentChildInventoryIdentityError,
  BuildParentChildInventoryIdentityInput,
  BuildParentChildInventoryIdentityResult,
} from "./identityBuilders";

export {
  CATEGORY_ROUTE_REGISTRY,
  getCategoryRouteAdapter,
  pipelineSupportsInventoryRole,
} from "./categoryRouteRegistry";
export type { CategoryRouteRegistry } from "./categoryRouteRegistry";

export { resolveDashboardActions } from "./dashboardActionResolver";
export type {
  DashboardAction,
  DashboardActionContext,
  DashboardActionKey,
  DashboardActionKind,
  DashboardEntitlementState,
  DashboardLifecycleState,
} from "./dashboardActionTypes";
