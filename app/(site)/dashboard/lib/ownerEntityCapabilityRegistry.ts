/**
 * Owner Command Center — Package 3, Gate 3A. Canonical owner-entity capability model.
 *
 * This registry is UI CAPABILITY TRUTH — it answers "does this category truthfully support
 * this owner-facing feature, and how should the shared workspace shell treat it." It is
 * deliberately NOT route truth: `app/lib/listingIdentity/categoryRouteRegistry.ts` and
 * `dashboardActionResolver.ts` remain the sole owners of hrefs/identity resolution. Nothing
 * here builds a URL, calls a mutation, or resolves an identity — category page adapters keep
 * doing that with their existing helpers, then read this registry only to decide whether to
 * render a section/action at all.
 *
 * States are richer than booleans on purpose (Master Blueprint doctrine — "do not use
 * booleans where the architecture requires a richer state"):
 *   - "supported"  — real, wired, truthful today.
 *   - "unsupported" — confirmed absent; a shared component must render nothing, not a
 *     disabled/greyed placeholder.
 *   - "unproven"   — a real data path may exist but this pass did not confirm it end-to-end;
 *     treat identically to "unsupported" for rendering (never guess into existence), but keep
 *     the distinction so a future gate knows where to look before flipping to "supported".
 *   - "specialized" — real, but not a generic capability; the section renders through a
 *     category-specific adapter/module rather than the generic shared path.
 *
 * Every row below is sourced from repo-truth research conducted for the Owner Command Center
 * Globalization program (Package 2 survey + the Package 3 Community Trust / engagement /
 * analytics / CTA deep-dive). Only Servicios and Restaurantes are consumed by real shared
 * components this gate (Gate 3A); the remaining rows are populated now — not fabricated, not
 * left as TODOs — so Gate 3B+ can read this file instead of re-deriving capability truth.
 */

export type CapabilityState = "supported" | "unsupported" | "unproven" | "specialized";

export type OwnerEntityCapabilities = {
  identity: {
    publicView: CapabilityState;
    preview: CapabilityState;
    results: CapabilityState;
    edit: CapabilityState;
    analytics: CapabilityState;
  };
  engagement: {
    like: CapabilityState;
    save: CapabilityState;
    share: CapabilityState;
    report: CapabilityState;
  };
  communityTrust: CapabilityState;
  externalReviews: CapabilityState;
  video: CapabilityState;
  contactHub: CapabilityState;
  translateAd: CapabilityState;
  relatedListings: CapabilityState;
  lifecycle: {
    pause: CapabilityState;
    reactivate: CapabilityState;
    archive: CapabilityState;
    markSold: CapabilityState;
    republish: CapabilityState;
    renew: CapabilityState;
    close: CapabilityState;
  };
  specialized: {
    inventory: CapabilityState;
    applications: CapabilityState;
    leads: CapabilityState;
    requests: CapabilityState;
    offers: CapabilityState;
    coupons: CapabilityState;
    campaign: CapabilityState;
    aiScan: CapabilityState;
    businessTools: CapabilityState;
    businessConcierge: CapabilityState;
    activity: CapabilityState;
  };
  commercial: {
    plan: CapabilityState;
    entitlement: CapabilityState;
    placement: CapabilityState;
    verification: CapabilityState;
  };
};

const UNSUPPORTED_ALL: OwnerEntityCapabilities = {
  identity: { publicView: "unsupported", preview: "unsupported", results: "unsupported", edit: "unsupported", analytics: "unsupported" },
  engagement: { like: "unsupported", save: "unsupported", share: "unsupported", report: "unsupported" },
  communityTrust: "unsupported",
  externalReviews: "unsupported",
  video: "unsupported",
  contactHub: "unsupported",
  translateAd: "unsupported",
  relatedListings: "unsupported",
  lifecycle: { pause: "unsupported", reactivate: "unsupported", archive: "unsupported", markSold: "unsupported", republish: "unsupported", renew: "unsupported", close: "unsupported" },
  specialized: { inventory: "unsupported", applications: "unsupported", leads: "unsupported", requests: "unsupported", offers: "unsupported", coupons: "unsupported", campaign: "unsupported", aiScan: "unsupported", businessTools: "unsupported", businessConcierge: "unsupported", activity: "unsupported" },
  commercial: { plan: "unsupported", entitlement: "unsupported", placement: "unsupported", verification: "unsupported" },
};

function merge(overrides: Partial<OwnerEntityCapabilities>): OwnerEntityCapabilities {
  return {
    identity: { ...UNSUPPORTED_ALL.identity, ...overrides.identity },
    engagement: { ...UNSUPPORTED_ALL.engagement, ...overrides.engagement },
    communityTrust: overrides.communityTrust ?? UNSUPPORTED_ALL.communityTrust,
    externalReviews: overrides.externalReviews ?? UNSUPPORTED_ALL.externalReviews,
    video: overrides.video ?? UNSUPPORTED_ALL.video,
    contactHub: overrides.contactHub ?? UNSUPPORTED_ALL.contactHub,
    translateAd: overrides.translateAd ?? UNSUPPORTED_ALL.translateAd,
    relatedListings: overrides.relatedListings ?? UNSUPPORTED_ALL.relatedListings,
    lifecycle: { ...UNSUPPORTED_ALL.lifecycle, ...overrides.lifecycle },
    specialized: { ...UNSUPPORTED_ALL.specialized, ...overrides.specialized },
    commercial: { ...UNSUPPORTED_ALL.commercial, ...overrides.commercial },
  };
}

/**
 * Category keys match `MisAnunciosCategoryKey` / `categoryRouteRegistry.ts` pipeline naming
 * conventions where they overlap. This registry does not require every key that registry has —
 * only owner-manageable entities are represented.
 */
export type OwnerEntityCategoryKey =
  | "servicios"
  | "restaurantes"
  | "en-venta"
  | "autos-privado"
  | "autos-negocios"
  | "bienes-raices-privado"
  | "bienes-raices-negocio"
  | "rentas-privado"
  | "rentas-negocio"
  | "empleos"
  | "clases"
  | "comunidad"
  | "busco"
  | "mascotas-y-perdidos"
  | "comida-local"
  | "ofertas-locales"
  | "viajes"
  | "iglesias";

export const OWNER_ENTITY_CAPABILITIES: Record<OwnerEntityCategoryKey, OwnerEntityCapabilities> = {
  // Gate 3A reference implementation #1. Community Trust is real (§4 of the master survey).
  servicios: merge({
    identity: { publicView: "supported", preview: "supported", results: "supported", edit: "supported", analytics: "supported" },
    engagement: { like: "supported", save: "supported", share: "supported", report: "unproven" },
    communityTrust: "supported",
    externalReviews: "supported",
    video: "supported",
    contactHub: "supported",
    translateAd: "supported",
    relatedListings: "unsupported",
    lifecycle: { pause: "supported", reactivate: "supported", archive: "unsupported", markSold: "unsupported", republish: "unsupported", renew: "unsupported", close: "unsupported" },
    specialized: { inventory: "unsupported", applications: "unsupported", leads: "supported", requests: "supported", offers: "specialized", coupons: "unsupported", campaign: "unsupported", aiScan: "unsupported", businessTools: "specialized", businessConcierge: "unsupported", activity: "supported" },
    commercial: { plan: "supported", entitlement: "supported", placement: "unproven", verification: "supported" },
  }),
  // Gate 3A reference implementation #2. No lifecycle mutation and no per-listing preview
  // exist for this category — confirmed absent, must render as honest empty, not fabricated.
  restaurantes: merge({
    identity: { publicView: "supported", preview: "unsupported", results: "supported", edit: "supported", analytics: "unproven" },
    engagement: { like: "supported", save: "supported", share: "supported", report: "unproven" },
    communityTrust: "supported",
    externalReviews: "supported",
    video: "supported",
    contactHub: "supported",
    translateAd: "supported",
    relatedListings: "unsupported",
    lifecycle: { pause: "unsupported", reactivate: "unsupported", archive: "unsupported", markSold: "unsupported", republish: "unsupported", renew: "unsupported", close: "unsupported" },
    specialized: { inventory: "unsupported", applications: "unsupported", leads: "unsupported", requests: "unsupported", offers: "unsupported", coupons: "specialized", campaign: "unsupported", aiScan: "unsupported", businessTools: "specialized", businessConcierge: "unsupported", activity: "unsupported" },
    commercial: { plan: "supported", entitlement: "supported", placement: "supported", verification: "supported" },
  }),
  // Gate 3B — analytics corrected from "unproven" to "supported": `mis-anuncios/[id]/page.tsx`
  // (the real, generic, category-agnostic per-listing workspace every listings-table category
  // shares) confirmed to query real `listing_analytics` rows and render a live analytics tab
  // for this category end-to-end, not merely a plausible unconfirmed path.
  "en-venta": merge({
    identity: { publicView: "supported", preview: "supported", results: "supported", edit: "supported", analytics: "supported" },
    engagement: { like: "supported", save: "supported", share: "supported", report: "supported" },
    video: "supported",
    contactHub: "supported",
    translateAd: "supported",
    relatedListings: "unsupported",
    lifecycle: { pause: "supported", reactivate: "supported", archive: "supported", markSold: "supported", republish: "supported", renew: "unsupported", close: "unsupported" },
    specialized: { inventory: "unsupported", applications: "unsupported", leads: "unsupported", requests: "unsupported", offers: "unsupported", coupons: "unsupported", campaign: "unsupported", aiScan: "unsupported", businessTools: "unsupported", businessConcierge: "unsupported", activity: "supported" },
  }),
  "autos-privado": merge({
    identity: { publicView: "supported", preview: "supported", results: "supported", edit: "supported", analytics: "supported" },
    engagement: { like: "supported", save: "supported", share: "supported", report: "supported" },
    video: "supported",
    contactHub: "supported",
    translateAd: "supported",
    lifecycle: { pause: "unsupported", reactivate: "supported", archive: "supported", markSold: "unsupported", republish: "unsupported", renew: "unsupported", close: "unsupported" },
  }),
  "autos-negocios": merge({
    identity: { publicView: "supported", preview: "supported", results: "supported", edit: "supported", analytics: "specialized" },
    engagement: { like: "supported", save: "supported", share: "supported", report: "unproven" },
    video: "supported",
    contactHub: "supported",
    translateAd: "supported",
    lifecycle: { pause: "unsupported", reactivate: "supported", archive: "supported", markSold: "unsupported", republish: "unsupported", renew: "unsupported", close: "unsupported" },
    specialized: { inventory: "specialized", applications: "unsupported", leads: "unsupported", requests: "unsupported", offers: "unsupported", coupons: "unsupported", campaign: "unsupported", aiScan: "unsupported", businessTools: "specialized", businessConcierge: "unsupported", activity: "unsupported" },
    commercial: { plan: "supported", entitlement: "supported", placement: "unproven", verification: "unproven" },
  }),
  // Gate 3B — analytics corrected to "supported" (same repo-truth basis as en-venta above).
  "bienes-raices-privado": merge({
    identity: { publicView: "supported", preview: "supported", results: "supported", edit: "supported", analytics: "supported" },
    engagement: { like: "supported", save: "supported", share: "supported", report: "unproven" },
    video: "supported",
    contactHub: "supported",
    translateAd: "supported",
    lifecycle: { pause: "supported", reactivate: "supported", archive: "supported", markSold: "supported", republish: "unsupported", renew: "unsupported", close: "unsupported" },
    specialized: { inventory: "unsupported", applications: "unsupported", leads: "unsupported", requests: "unsupported", offers: "unsupported", coupons: "unsupported", campaign: "unsupported", aiScan: "unsupported", businessTools: "unsupported", businessConcierge: "unsupported", activity: "supported" },
  }),
  "bienes-raices-negocio": merge({
    identity: { publicView: "supported", preview: "specialized", results: "supported", edit: "supported", analytics: "supported" },
    engagement: { like: "supported", save: "supported", share: "supported", report: "unproven" },
    video: "supported",
    contactHub: "supported",
    translateAd: "supported",
    lifecycle: { pause: "specialized", reactivate: "specialized", archive: "specialized", markSold: "specialized", republish: "specialized", renew: "unsupported", close: "unsupported" },
    specialized: { inventory: "specialized", applications: "unsupported", leads: "unsupported", requests: "unsupported", offers: "unsupported", coupons: "unsupported", campaign: "unsupported", aiScan: "unsupported", businessTools: "specialized", businessConcierge: "unsupported", activity: "supported" },
    commercial: { plan: "supported", entitlement: "supported", placement: "unproven", verification: "unproven" },
  }),
  // Gate 3B — analytics corrected to "supported" (real, wired; also cross-confirmed by a
  // dedicated repo audit doc, app/(site)/clasificados/rentas/RENTAS_ANALYTICS_TRUTH_AUDIT.md).
  "rentas-privado": merge({
    identity: { publicView: "supported", preview: "supported", results: "supported", edit: "supported", analytics: "supported" },
    engagement: { like: "supported", save: "supported", share: "supported", report: "unproven" },
    video: "supported",
    contactHub: "supported",
    translateAd: "supported",
    lifecycle: { pause: "supported", reactivate: "supported", archive: "supported", markSold: "unsupported", republish: "unsupported", renew: "specialized", close: "unsupported" },
    specialized: { inventory: "unsupported", applications: "unsupported", leads: "unsupported", requests: "unsupported", offers: "unsupported", coupons: "unsupported", campaign: "unsupported", aiScan: "unsupported", businessTools: "unsupported", businessConcierge: "unsupported", activity: "supported" },
  }),
  "rentas-negocio": merge({
    identity: { publicView: "supported", preview: "supported", results: "supported", edit: "supported", analytics: "unsupported" },
    engagement: { like: "supported", save: "supported", share: "supported", report: "unproven" },
    video: "supported",
    contactHub: "supported",
    translateAd: "supported",
    lifecycle: { pause: "supported", reactivate: "supported", archive: "supported", markSold: "unsupported", republish: "unsupported", renew: "specialized", close: "unsupported" },
  }),
  empleos: merge({
    identity: { publicView: "supported", preview: "unsupported", results: "supported", edit: "supported", analytics: "unproven" },
    engagement: { like: "supported", save: "supported", share: "supported", report: "unproven" },
    video: "supported",
    contactHub: "supported",
    translateAd: "supported",
    relatedListings: "unproven",
    lifecycle: { pause: "supported", reactivate: "supported", archive: "supported", markSold: "unsupported", republish: "unsupported", renew: "unsupported", close: "unsupported" },
    specialized: { inventory: "unsupported", applications: "specialized", leads: "unsupported", requests: "unsupported", offers: "unsupported", coupons: "unsupported", campaign: "unsupported", aiScan: "unsupported", businessTools: "unsupported", businessConcierge: "unsupported", activity: "specialized" },
  }),
  // Gate 3B — analytics corrected to "supported" for clases/comunidad/busco/mascotas-y-perdidos
  // below (same repo-truth basis: the shared `mis-anuncios/[id]/page.tsx` workspace's analytics
  // tab is category-agnostic and confirmed wired for every listings-table category, not only
  // the ones previously marked "supported"). `specialized.activity` corrected to "supported" for
  // all four — real per-listing `messages` rows are fetched by this same shared workspace
  // (filtered by `listing_id`), previously fetched but never rendered (a real, orphaned data
  // path, not a fabricated one) — Gate 3B surfaces it through `OwnerEntityActivity`.
  clases: merge({
    identity: { publicView: "supported", preview: "supported", results: "supported", edit: "supported", analytics: "supported" },
    engagement: { like: "supported", save: "supported", share: "supported", report: "supported" },
    video: "unsupported",
    contactHub: "supported",
    translateAd: "supported",
    lifecycle: { pause: "unsupported", reactivate: "unsupported", archive: "supported", markSold: "unsupported", republish: "unsupported", renew: "unsupported", close: "unsupported" },
    specialized: { inventory: "unsupported", applications: "unsupported", leads: "unsupported", requests: "unsupported", offers: "unsupported", coupons: "unsupported", campaign: "unsupported", aiScan: "unsupported", businessTools: "unsupported", businessConcierge: "unsupported", activity: "supported" },
  }),
  comunidad: merge({
    identity: { publicView: "supported", preview: "supported", results: "supported", edit: "supported", analytics: "supported" },
    engagement: { like: "supported", save: "supported", share: "supported", report: "supported" },
    video: "unsupported",
    contactHub: "supported",
    translateAd: "supported",
    lifecycle: { pause: "unsupported", reactivate: "unsupported", archive: "supported", markSold: "unsupported", republish: "unsupported", renew: "unsupported", close: "unsupported" },
    specialized: { inventory: "unsupported", applications: "unsupported", leads: "unsupported", requests: "unsupported", offers: "unsupported", coupons: "unsupported", campaign: "unsupported", aiScan: "unsupported", businessTools: "unsupported", businessConcierge: "unsupported", activity: "supported" },
  }),
  busco: merge({
    identity: { publicView: "supported", preview: "supported", results: "supported", edit: "supported", analytics: "supported" },
    engagement: { like: "unsupported", save: "unsupported", share: "unsupported", report: "supported" },
    video: "unsupported",
    contactHub: "supported",
    translateAd: "supported",
    lifecycle: { pause: "unsupported", reactivate: "unsupported", archive: "supported", markSold: "unsupported", republish: "unsupported", renew: "unsupported", close: "unsupported" },
    specialized: { inventory: "unsupported", applications: "unsupported", leads: "unsupported", requests: "unsupported", offers: "unsupported", coupons: "unsupported", campaign: "unsupported", aiScan: "unsupported", businessTools: "unsupported", businessConcierge: "unsupported", activity: "supported" },
  }),
  "mascotas-y-perdidos": merge({
    identity: { publicView: "supported", preview: "supported", results: "supported", edit: "supported", analytics: "supported" },
    engagement: { like: "unsupported", save: "unsupported", share: "unsupported", report: "unsupported" },
    video: "unsupported",
    contactHub: "supported",
    translateAd: "supported",
    lifecycle: { pause: "unsupported", reactivate: "unsupported", archive: "supported", markSold: "unsupported", republish: "unsupported", renew: "unsupported", close: "unsupported" },
    specialized: { inventory: "unsupported", applications: "unsupported", leads: "unsupported", requests: "unsupported", offers: "unsupported", coupons: "unsupported", campaign: "unsupported", aiScan: "unsupported", businessTools: "unsupported", businessConcierge: "unsupported", activity: "supported" },
  }),
  "comida-local": merge({
    identity: { publicView: "supported", preview: "unsupported", results: "unsupported", edit: "supported", analytics: "unproven" },
    engagement: { like: "unsupported", save: "unsupported", share: "unsupported", report: "unproven" },
    video: "unsupported",
    contactHub: "supported",
    translateAd: "supported",
    lifecycle: { pause: "supported", reactivate: "supported", archive: "unsupported", markSold: "unsupported", republish: "unsupported", renew: "unsupported", close: "unsupported" },
  }),
  "ofertas-locales": merge({
    identity: { publicView: "supported", preview: "supported", results: "supported", edit: "specialized", analytics: "supported" },
    engagement: { like: "unsupported", save: "specialized", share: "unproven", report: "unproven" },
    video: "unsupported",
    contactHub: "supported",
    translateAd: "supported",
    lifecycle: { pause: "unsupported", reactivate: "unsupported", archive: "unsupported", markSold: "unsupported", republish: "unsupported", renew: "specialized", close: "unsupported" },
    specialized: { inventory: "unsupported", applications: "unsupported", leads: "unsupported", requests: "unsupported", offers: "unsupported", coupons: "specialized", campaign: "specialized", aiScan: "specialized", businessTools: "unsupported", businessConcierge: "unsupported", activity: "unsupported" },
    commercial: { plan: "unproven", entitlement: "supported", placement: "unproven", verification: "unproven" },
  }),
  viajes: merge({
    identity: { publicView: "supported", preview: "specialized", results: "supported", edit: "specialized", analytics: "unsupported" },
    engagement: { like: "unsupported", save: "unsupported", share: "unsupported", report: "unproven" },
    video: "supported",
    contactHub: "supported",
    translateAd: "supported",
    lifecycle: { pause: "unsupported", reactivate: "unsupported", archive: "unsupported", markSold: "unsupported", republish: "unsupported", renew: "unsupported", close: "unsupported" },
    specialized: { inventory: "unsupported", applications: "unsupported", leads: "unsupported", requests: "unsupported", offers: "unsupported", coupons: "unsupported", campaign: "unsupported", aiScan: "unsupported", businessTools: "unsupported", businessConcierge: "unsupported", activity: "unsupported" },
  }),
  // No owner workspace exists for this category at any layer today (confirmed — no owner_id,
  // no claim flow, no edit route). Every capability below is honestly "unsupported"; this row
  // exists so a future gate reads capability truth instead of re-discovering the gap.
  iglesias: merge({
    identity: { publicView: "supported", preview: "unsupported", results: "unsupported", edit: "unsupported", analytics: "unsupported" },
    contactHub: "supported",
  }),
};

/** Truthful lookup — returns the fully-unsupported shape for any key not yet in the registry,
 * never `undefined`, so a caller can always safely gate rendering without a null check. */
export function getOwnerEntityCapabilities(category: OwnerEntityCategoryKey): OwnerEntityCapabilities {
  return OWNER_ENTITY_CAPABILITIES[category] ?? UNSUPPORTED_ALL;
}

/** True when a capability should render: real wired ("supported") or real specialized-module path. */
export function isLiveCapability(state: CapabilityState): boolean {
  return state === "supported" || state === "specialized";
}
