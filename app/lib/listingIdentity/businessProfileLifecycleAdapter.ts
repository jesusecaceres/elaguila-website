/**
 * Gate G.2.1 — pure Business Profile Family lifecycle adapter.
 *
 * Translates already-normalized family-level signals into the Gate G.1 global owner lifecycle
 * contract (`OwnerLifecycleEligibilityInput`). No I/O, no Supabase, no fetch, no React, no
 * browser globals — same purity guarantee as `ownerLifecycleResolver.ts`.
 *
 * Internal architecture name: "Business Profile Family". Not "Negocios Locales" — the live
 * `/negocios-locales` route is a separate directory product and must never be confused with this
 * internal family grouping (Restaurantes, Servicios, Autos Dealers, Bienes Raíces Negocio,
 * Viajes Negocio, Comida Local, Ofertas Locales, Cupones).
 *
 * COMPLETELY UNWIRED (Gate G.2.1 scope): nothing in this file is imported by any dashboard,
 * category adapter, or mutation path yet. A future category adapter (BR pilot: Gate G.2.2)
 * builds a `BusinessProfileFamilyInput` from its own already-normalized status/entitlement data
 * and calls `buildBusinessProfileEligibilityInput` to get a contract-valid input for the real
 * Gate G.1 resolvers (`resolveOwnerFacingStatus`, `resolveAttentionState`,
 * `resolveEligibleGlobalActions`, `resolveLifecycleMutationDescriptors`).
 *
 * Cupones architecture note (for future category adapters, not implemented here): standalone
 * Cupones is a priced campaign lane inside the Ofertas Locales stack, not a separate database
 * stack — its future category adapter should reuse whatever Ofertas Locales campaign-status
 * mapping is built for Gate G.2.6, not invent a parallel one. Restaurant coupons (an add-on
 * bound to a Restaurantes listing) and Servicios offers (an add-on bound to a Servicios listing)
 * are separate, category-bound add-ons and must never be confused with standalone Cupones.
 *
 * OWNERSHIP BOUNDARY: this file owns only what is genuinely identical across every Business
 * Profile Family category — common input shape, safe all-false capability defaults, and a pure
 * mapper from the existing shared add-on lifecycle vocabulary (`AddonLifecycleStatus`) to the
 * global contract's paid-module vocabulary (`PaidModuleLifecycleState`). It deliberately contains
 * zero `if (category === ...)` branching and zero category-specific route/mutation/inventory
 * knowledge — that belongs entirely to each category's own future adapter.
 */

import type { AddonLifecycleStatus } from "@/app/lib/listingPlans/addonLifecycle";
import type {
  GlobalNavigationActionKey,
  OwnerFacingStatusKey,
  OwnerLifecycleCapabilityFlags,
  OwnerLifecycleEligibilityInput,
  PaidModuleLifecycleState,
} from "./ownerLifecycleTypes";
import type { CanonicalCategoryKey, InventoryRole } from "./types";

/* ------------------------------------------------------------------------------------------ *
 * Safe capability defaults
 * ------------------------------------------------------------------------------------------ */

/**
 * Every lifecycle capability defaults to `false` — a Business Profile category with no certified
 * lifecycle mutations (the common case today; see Gate G.2A's mutation-safety audit) inherits
 * this untouched and grants nothing. A category adapter may only ever *add* a `true` flag
 * explicitly; it can never omit a field and have it silently resolve to granted.
 */
export const DEFAULT_BUSINESS_PROFILE_CAPABILITIES: Readonly<OwnerLifecycleCapabilityFlags> = Object.freeze({
  canPublish: false,
  canPause: false,
  canResume: false,
  canRenew: false,
  canRepublish: false,
  canExtend: false,
  canArchive: false,
  canDiscontinue: false,
  canRestore: false,
  canResolvePayment: false,
  canResubmit: false,
  canPurchaseAddon: false,
  canUpgrade: false,
  canManageAddon: false,
});

/* ------------------------------------------------------------------------------------------ *
 * Paid-module normalization
 * ------------------------------------------------------------------------------------------ */

/**
 * Pure mapper from the existing shared add-on entitlement lifecycle vocabulary
 * (`AddonLifecycleStatus`, from `addonLifecycle.ts` — never re-derived here) to the global
 * contract's `PaidModuleLifecycleState`. Fails closed: only `"active"` maps to `"active"`;
 * `"scheduled"` never grants active access (the global type has no dedicated scheduled state,
 * so it maps to `"inactive"`, never to `"active"`); `"revoked"` never grants active access either
 * (same reasoning — the global type has no dedicated revoked state, so it maps to `"inactive"`,
 * not `"expired"`, since revoked is an administrative removal, not a natural lapse); any
 * unrecognized/malformed value also fails closed to `"inactive"`.
 */
export function mapAddonLifecycleStatusToPaidModuleState(status: AddonLifecycleStatus): PaidModuleLifecycleState {
  switch (status) {
    case "active":
      return "active";
    case "expired":
      return "expired";
    case "scheduled":
      return "inactive";
    case "revoked":
      return "inactive";
    case "not_purchased":
      return "inactive";
    default:
      return "inactive";
  }
}

/**
 * Batch form of `mapAddonLifecycleStatusToPaidModuleState`, keyed by whatever package/module key
 * the category adapter already uses (e.g. `"br_inventory_pack_monthly"`). `undefined` in,
 * `undefined` out — a category with no paid modules simply omits the field.
 */
export function buildBusinessProfilePaidModuleStates(
  modules: Readonly<Record<string, AddonLifecycleStatus>> | undefined,
): Record<string, PaidModuleLifecycleState> | undefined {
  if (!modules) return undefined;
  const result: Record<string, PaidModuleLifecycleState> = {};
  for (const [key, status] of Object.entries(modules)) {
    result[key] = mapAddonLifecycleStatusToPaidModuleState(status);
  }
  return result;
}

/* ------------------------------------------------------------------------------------------ *
 * Family input contract
 * ------------------------------------------------------------------------------------------ */

/**
 * Pure, category-neutral input a Business Profile category adapter builds from its own
 * already-normalized data. No database row type, no Supabase type, no React type, no browser
 * global — a category adapter is responsible for translating its real row/entitlement data into
 * this shape *before* calling `buildBusinessProfileEligibilityInput`.
 *
 * `role` reuses the existing global `InventoryRole` type unchanged (`"main" | "inventory_property"
 * | "inventory_vehicle"`, or `null`/omitted for a category with no parent/child concept at all —
 * "standalone"). This file does not translate or default role values itself: which literal a
 * child row uses ("inventory_property" vs. "inventory_vehicle") is real category-specific
 * vocabulary, not something a family-level file should collapse or reinterpret.
 */
export type BusinessProfileFamilyInput = {
  canonicalListingId: string | null;
  categoryKey: CanonicalCategoryKey | string;
  ownerVerified: boolean;
  normalizedStatus: OwnerFacingStatusKey;
  internalStatus?: string | null;
  publicVisibility: boolean;
  editable: boolean;
  paidOrFree: "paid" | "free";
  expirationAt?: string | null;
  paymentIssue?: boolean;
  moderationIssue?: boolean;
  role?: InventoryRole | null;
  /** Raw shared add-on lifecycle statuses keyed by package/module key. This adapter — not the
   * category adapter — normalizes these into the global contract's `paidModuleStates`; a
   * category adapter must never pre-map this field itself. */
  paidModules?: Readonly<Record<string, AddonLifecycleStatus>>;
  /** Only ever merged on top of `DEFAULT_BUSINESS_PROFILE_CAPABILITIES` — omit a flag to leave
   * it at its safe `false` default. */
  capabilities?: OwnerLifecycleCapabilityFlags;
  /** Real hrefs already resolved by the category adapter (e.g. via the Gate B category route
   * registry). Never fabricated here — an absent key stays absent. */
  navigationHrefs?: Partial<Record<GlobalNavigationActionKey, string | null>>;
  /** Explicit "now" — this file never calls `Date.now()`/`new Date()` itself. */
  now: Date;
};

/* ------------------------------------------------------------------------------------------ *
 * Adapter output
 * ------------------------------------------------------------------------------------------ */

/**
 * Builds a valid `OwnerLifecycleEligibilityInput` from a `BusinessProfileFamilyInput`. Purely a
 * translation/normalization step — it does not re-implement the Gate G.1 resolvers' own
 * owner-verification/canonical-UUID fail-closed gate (duplicating that check here would risk the
 * two diverging over time); every consumer must still call the real G.1 resolvers, which already
 * enforce that gate on the output of this function exactly as they would on any other caller's.
 *
 * Preserves the supplied normalized status, role, and current-time value unchanged; only ever
 * *adds* capabilities on top of the safe all-false default; only ever passes through
 * caller-supplied navigation hrefs verbatim (never invents one); normalizes paid-module states
 * through `buildBusinessProfilePaidModuleStates`.
 */
export function buildBusinessProfileEligibilityInput(
  input: BusinessProfileFamilyInput,
): OwnerLifecycleEligibilityInput {
  const canonicalListingId = input.canonicalListingId?.trim() ? input.canonicalListingId.trim() : null;

  return {
    canonicalListingId,
    categoryKey: input.categoryKey,
    ownerVerified: input.ownerVerified === true,
    normalizedStatus: input.normalizedStatus,
    internalStatus: input.internalStatus ?? null,
    publicVisibility: input.publicVisibility === true,
    editable: input.editable === true,
    paidOrFree: input.paidOrFree,
    expirationDate: input.expirationAt ?? null,
    paymentIssue: input.paymentIssue === true,
    moderationIssue: input.moderationIssue === true,
    role: input.role ?? null,
    capabilities: { ...DEFAULT_BUSINESS_PROFILE_CAPABILITIES, ...(input.capabilities ?? {}) },
    paidModuleStates: buildBusinessProfilePaidModuleStates(input.paidModules),
    navigationHrefs: input.navigationHrefs,
    now: input.now,
  };
}
