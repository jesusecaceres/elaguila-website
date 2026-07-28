/**
 * Gate B — public barrel export for the canonical listing identity + category route registry.
 * ADDITIVE ONLY — see types.ts for the scope note. Nothing here is wired into runtime pages,
 * dashboards, publish routes, Preview pages, public shells, checkout flows, or webhooks yet.
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
