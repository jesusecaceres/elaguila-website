/**
 * Gate B — canonical listing identity + category route registry contracts.
 *
 * ADDITIVE ONLY: nothing in app/lib/listingIdentity/ is wired into any live page, dashboard
 * action, publish route, Preview page, public shell, checkout flow, or webhook yet. That
 * runtime unification is deferred to a later gate. This module only describes, in types and
 * pure helpers, what canonical identity and routing already looks like across the repository.
 *
 * See the Leonix Negocios Locales audit (Gate B request) for the evidence this file encodes.
 */

/**
 * Categories with a registered adapter in this gate. This is intentionally a NARROWER union
 * than the open `MisAnunciosCategoryKey` string type used elsewhere in the dashboard — it only
 * covers the four Negocios Locales pipelines plus Autos Privado (registered separately to make
 * its exclusion from dealer parent/child behavior explicit, not implicit).
 */
export type CanonicalCategoryKey =
  | "restaurantes"
  | "servicios"
  | "bienes_raices_negocio"
  | "autos_negocios"
  | "autos_privado";

/**
 * The real, stored `category` (or `lane`) value as it appears in the backing table — e.g.
 * `listings.category = "bienes-raices"`, or the fixed single category of a dedicated table
 * like `restaurantes_public_listings`. Distinct from `pipeline`: one DB `category` can back
 * more than one `pipeline` (bienes-raices backs both bienes_raices_negocio and BR-privado;
 * autos_classifieds_listings.lane backs both autos_negocios and autos_privado).
 */
export type CanonicalDbCategory = "restaurantes" | "servicios" | "bienes-raices" | "autos";

/** Real backing tables for the categories registered in this gate. */
export type CanonicalSourceTable =
  | "restaurantes_public_listings"
  | "servicios_public_listings"
  | "listings"
  | "autos_classifieds_listings";

/**
 * Parent/child row role, mirroring the `inventory_role` columns added by
 * supabase/migrations/20260518130600_br_property_inventory_grouping.sql (`listings`) and
 * supabase/migrations/20260518124700_autos_dealer_inventory_grouping.sql
 * (`autos_classifieds_listings`). `"main"` is the parent/dealer's own row.
 */
export type InventoryRole = "main" | "inventory_property" | "inventory_vehicle";

/**
 * Canonical listing identity.
 *
 * `sourceId` is ALWAYS the row's real database primary key (a uuid). It must NEVER be a
 * slug, a `draft_listing_id`, a localStorage key, a URL query parameter, or an analytics
 * fallback key (see app/lib/analytics/listingAnalyticsIdentity.ts, which intentionally uses a
 * *different* identity scheme — `leonix_ad_id` › slug › `table:id` — for analytics rollups
 * only; that scheme must never be confused with this one). Slug and other aliases may still be
 * used internally by a category adapter as a *lookup* key, but must never be assigned here.
 */
export type ListingIdentity = {
  sourceTable: CanonicalSourceTable;
  /** Real DB primary key (uuid). Never slug, never draft_listing_id. */
  sourceId: string;
  category: CanonicalDbCategory;
  pipeline: CanonicalCategoryKey;
  leonixAdId: string;
  ownerUserId: string;
  /** Precomputed public detail URL. Required at construction time — this module never
   * resolves a slug from a sourceId, since that would require a DB call. */
  publicUrl: string;
  /** Dashboard "edit this listing" destination, or null when no confirmed edit route exists
   * for this identity (see CategoryRouteAdapter.knownLimitations for why, when applicable). */
  editUrl: string | null;
  /** Listing-bound Preview destination, or null when no confirmed listing-bound preview
   * exists for this identity. */
  previewUrl: string | null;
  /** Where this listing is managed from in the dashboard (category hub or generic
   * /dashboard/mis-anuncios), or null if unresolved. */
  dashboardUrl: string | null;
  /** Real DB primary key (uuid) of the parent/dealer row, for inventory children only. */
  parentSourceId?: string | null;
  /** `br_inventory_group_id` / `dealer_inventory_group_id` for parent+children in a group. */
  inventoryGroupId?: string | null;
  inventoryRole?: InventoryRole | null;
};

/**
 * A typed adapter describing one pipeline's current, real routing truth. Resolver functions
 * take a real `ListingIdentity` — they must never construct identity from a slug or a
 * draft id themselves.
 */
export type CategoryRouteAdapter = {
  pipeline: CanonicalCategoryKey;
  category: CanonicalDbCategory;
  sourceTable: CanonicalSourceTable;

  /** Public category landing page (not listing-specific). */
  entryRoute: string;
  /** Where a brand-new application/draft starts (not an edit of an existing listing). */
  applicationRoute: string;
  /** Public category results/search page. */
  resultsRoute: string;

  /** Public listing detail route for this identity, or null if not resolvable without a
   * lookup this module cannot perform (e.g. a slug-keyed category with no precomputed
   * `publicUrl` on the identity). */
  publicRoute: (identity: ListingIdentity, opts?: RouteResolveOpts) => string | null;
  /** Dashboard "edit this listing" route, or null when no confirmed edit route exists. */
  editRoute: (identity: ListingIdentity, opts?: RouteResolveOpts) => string | null;
  /** Listing-bound Preview route, or null when no confirmed listing-bound preview exists. */
  previewRoute: (identity: ListingIdentity, opts?: RouteResolveOpts) => string | null;
  /** Where this listing is managed from in the dashboard. */
  dashboardRoute: (identity: ListingIdentity, opts?: RouteResolveOpts) => string | null;

  supportsParentChildInventory: boolean;
  supportsCoupons: boolean;
  supportsBusinessHub: boolean;

  /**
   * Free-text notes on known gaps/defects for routes this adapter still reports as
   * available (a route existing is not the same claim as the route working correctly).
   * Populated only from prior, cited audit findings — never guessed.
   */
  knownLimitations: readonly string[];
};

export type RouteResolveOpts = {
  lang?: "es" | "en";
};

export type InventoryChildIdentity = {
  identity: ListingIdentity;
  role: Extract<InventoryRole, "inventory_property" | "inventory_vehicle">;
  active: boolean;
};

/**
 * Parent/child inventory identity for Bienes Raíces Negocio and Auto Dealers.
 *
 * `productLimit` is the confirmed, product-documented cap on additional children (Bienes: 4).
 * When no cap is documented for a category (Autos, as of this gate), `productLimit` is `null`
 * — never guessed as 4 by analogy. `children` is NEVER truncated by this contract; an
 * over-limit condition is represented via `overLimit`/`overLimitCount`, and callers are
 * responsible for surfacing that as an explicit warning rather than hiding the extra records.
 */
export type ParentChildInventoryIdentity = {
  parent: ListingIdentity;
  inventoryGroupId: string;
  productLimit: number | null;
  children: readonly InventoryChildIdentity[];
  overLimit: boolean;
  overLimitCount: number;
};
