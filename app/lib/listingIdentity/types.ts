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
 * Categories with a registered adapter. Gate B originally covered only the four Negocios
 * Locales pipelines plus Autos Privado. Gate I.5.1 (route-contract reconciliation) extended
 * this to represent every dashboard-wired category identified by the Gate I.5A route-forensics
 * audit, so `CATEGORY_ROUTE_REGISTRY` can be a genuinely complete route contract. `"cupones"`
 * is deliberately NOT a member — Gate I.5A confirmed Cupones has no standalone publish
 * pipeline; it is a filtered public view over the Ofertas Locales pipeline and is managed
 * through parent-category (Restaurantes/Servicios) coupon add-on entitlements instead.
 */
export type CanonicalCategoryKey =
  | "restaurantes"
  | "servicios"
  | "bienes_raices_negocio"
  | "bienes_raices_privado"
  | "autos_negocios"
  | "autos_privado"
  | "rentas_negocio"
  | "rentas_privado"
  | "empleos"
  | "en_venta"
  | "comida_local"
  | "ofertas_locales"
  | "busco"
  | "clases"
  | "comunidad"
  | "mascotas_y_perdidos"
  | "viajes";

/**
 * The real, stored `category` (or `lane`) value as it appears in the backing table — e.g.
 * `listings.category = "bienes-raices"`, or the fixed single category of a dedicated table
 * like `restaurantes_public_listings`. Distinct from `pipeline`: one DB `category` can back
 * more than one `pipeline` (bienes-raices backs both bienes_raices_negocio and BR-privado;
 * autos_classifieds_listings.lane backs both autos_negocios and autos_privado; rentas and
 * en-venta each back two `pipeline`s the same way `listings.category`/`lane` already does for
 * bienes-raices/autos above).
 */
export type CanonicalDbCategory =
  | "restaurantes"
  | "servicios"
  | "bienes-raices"
  | "autos"
  | "rentas"
  | "empleos"
  | "en-venta"
  | "comida-local"
  | "ofertas-locales"
  | "busco"
  | "clases"
  | "comunidad"
  | "mascotas-y-perdidos"
  | "viajes";

/** Real backing tables for the categories registered in this gate. Confirmed per-category via
 * `.from("...")` call sites under app/api/clasificados/** (Gate I.5.1 route-forensics pass) —
 * never guessed by naming-convention analogy. */
export type CanonicalSourceTable =
  | "restaurantes_public_listings"
  | "servicios_public_listings"
  | "listings"
  | "autos_classifieds_listings"
  | "empleos_public_listings"
  | "comida_local_public_listings"
  | "ofertas_locales"
  | "viajes_staged_listings";

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
  /**
   * Gate I.5.2 — optional multi-lane hub/branch-chooser route. Set ONLY on pipelines that share
   * a lane-selection step with a sibling pipeline of the same `category` (Bienes Raíces
   * Negocio/Privado, Rentas Negocio/Privado, Autos Negocios/Privado) — a generic entry point
   * (e.g. the global publish gateway) must resolve to this hub, not straight into one lane's
   * `applicationRoute`, so the user still makes the Negocio/Privado choice. Absent on every
   * other pipeline: for those, `applicationRoute` already IS the correct single generic entry
   * point (no lane choice exists to preserve). Never used for edit/preview/dashboard
   * resolution — only for "where does a brand-new, category-only-known publish action start."
   */
  hubRoute?: string;
  /**
   * Globalization Package A Gate 2 — optional checkpoint entry page shown BEFORE the
   * application (the "Ver más" product-truth card page). Set only on pipelines whose
   * checkpoint is a distinct route the publish gateway should prefer over
   * `hubRoute`/`applicationRoute`. Absent on pipelines whose hub already renders the
   * checkpoint cards (Autos, Bienes Raíces, Rentas, Restaurantes, Empleos hub) and on
   * pipelines whose applicationRoute itself is the checkpoint hop (Servicios). Resolution
   * order in the gateway: `checkpointRoute ?? hubRoute ?? applicationRoute`.
   */
  checkpointRoute?: string;
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
  /**
   * The category's one paid/entitled "manage" sub-flow, when one exists: coupon editing for
   * Restaurantes, offers editing for Servicios, inventory-pack editing for Bienes/Autos
   * Negocios. Optional and pipeline-specific — omitted entirely for pipelines with no such
   * sub-flow (Autos Privado). Gate D's resolver decides the action's label/entitlement gating
   * per pipeline; this field only supplies the route.
   */
  secondaryManageRoute?: (identity: ListingIdentity, opts?: RouteResolveOpts) => string | null;
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

  /**
   * Globalization Package A Gate 1 — explicit lane records for multi-lane pipelines whose
   * lanes were previously modeled only in knownLimitations prose (Empleos quick/premium/feria,
   * Viajes negocios/privado, En Venta pro/free/storefront). Absent on single-lane pipelines
   * and on pipelines whose lane split is already modeled as two sibling pipelines (Autos,
   * Bienes Raíces, Rentas). Registry data only — adding a lane record here wires no live
   * behavior by itself.
   */
  lanes?: readonly CategoryLaneRecord[];
};

/**
 * Globalization Package A Gate 1 — canonical lane keys for pipelines with an intra-pipeline
 * lane split. Lanes modeled as sibling pipelines (autos_negocios/autos_privado etc.) do NOT
 * get lane keys — the pipeline key already is the lane.
 */
export type CategoryLaneKey =
  | "empleos_quick"
  | "empleos_premium"
  | "empleos_feria"
  | "viajes_negocios"
  | "viajes_privado"
  | "en_venta_pro"
  | "en_venta_free"
  | "en_venta_storefront";

/**
 * One lane of a multi-lane pipeline, as repository truth. Every field is evidence-backed:
 * `dbLaneValue` mirrors the backing table's actual lane discriminator (e.g.
 * `empleos_public_listings.lane` CHECK ('quick','premium','feria'),
 * `viajes_staged_listings.lane` CHECK ('business','private')), or null when the lane exists
 * only at the route level with no stored discriminator (En Venta lanes on `listings`).
 */
export type CategoryLaneRecord = {
  laneKey: CategoryLaneKey;
  pipeline: CanonicalCategoryKey;
  /** The lane value as stored in the backing table, or null for route-level-only lanes. */
  dbLaneValue: string | null;
  /** Whether publishing through this lane is a paid product (per revenuePricingMatrix). */
  paid: boolean;
  /** Lane exists in the repository but is deliberately not offered to users today. */
  parked: boolean;
  /** Where a brand-new application for this specific lane starts. */
  applicationRoute: string;
  /**
   * Draft-based, new-publish-only preview route for this lane, or null. This is NEVER a
   * listing-bound preview destination — pointing an existing listing at a draft-based lane
   * preview is exactly the live Empleos defect Globalization P3 fixed (a stale sessionStorage
   * draft rendered with a repeat checkout widget). Listing-bound preview stays the adapter
   * `previewRoute()`'s job.
   */
  draftPreviewRoute: string | null;
  /** Evidence-backed notes; never guessed. */
  notes: readonly string[];
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
