/**
 * Gate D — dashboard action resolver contracts.
 *
 * Pure types only. See dashboardActionResolver.ts for the resolver itself and
 * dashboardActionResolver.ts's top comment for the deliberate scope boundary around
 * checkout-initiating and lifecycle-mutation actions (they are not URL navigations in the
 * current codebase, so this gate's resolver only emits "navigate"-kind actions with real hrefs).
 */

import type { CanonicalCategoryKey, CanonicalDbCategory, InventoryRole, ListingIdentity } from "./types";

export type DashboardActionKey =
  | "viewPublic"
  | "preview"
  | "edit"
  | "analytics"
  | "manageCoupons"
  | "manageOffers"
  | "manageInventory";

/**
 * "navigate" is the only kind this gate's resolver actually emits. "checkout" and "lifecycle"
 * are reserved for a later gate that extends the contract to carry an action identifier/handler
 * rather than a plain href — see dashboardActionResolver.ts for why that's out of this gate's
 * scope (checkout initiation and pause/archive/etc. are live onClick handlers today, not
 * navigable URLs, and this gate must not change coupon/inventory/lifecycle architecture).
 */
export type DashboardActionKind = "navigate" | "checkout" | "lifecycle";

export type DashboardAction = {
  key: DashboardActionKey;
  labelEs: string;
  labelEn: string;
  href: string;
  actionKind: DashboardActionKind;
  category: CanonicalDbCategory;
  pipeline: CanonicalCategoryKey;
  /** Real database primary key (uuid) — never slug, never draft_listing_id. */
  sourceId: string;
  leonixAdId: string;
  requiresEntitlement: boolean;
  destructive: boolean;
};

/** Server/payment-truth entitlement flags. The resolver never computes these itself — they are
 * supplied by the caller from the same eligibility functions already used live (e.g.
 * restaurantCouponAddonUpgradeEligible / restaurantCouponEditEligible), so this gate does not
 * duplicate or change existing coupon/offer eligibility logic. */
export type DashboardEntitlementState = {
  couponsActive?: boolean;
  offersActive?: boolean;
  inventoryPackActive?: boolean;
};

export type DashboardLifecycleState = {
  status: string;
};

export type DashboardActionContext = {
  identity: ListingIdentity;
  lifecycle: DashboardLifecycleState;
  entitlement: DashboardEntitlementState;
  /** Parent/child role for this specific identity, or null when the category has no
   * parent/child concept (Restaurantes, Servicios, Autos Privado). */
  role: InventoryRole | null;
  /** Must be true (server-verified ownership already established by the caller) — the
   * resolver never verifies ownership itself, it only refuses to resolve anything without it. */
  ownerVerified: boolean;
  lang: "es" | "en";
};
