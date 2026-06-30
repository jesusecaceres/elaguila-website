/**
 * Revenue OS placement entitlement read model (pure functions).
 * Gate STRIPE-REVENUE-OS-SCHEMA-AND-ENTITLEMENT-CONTRACT-01 — no DB, Stripe, or env.
 */

export type PlacementTier =
  | "partner_premium"
  | "print_full_page"
  | "print_half_page"
  | "print_quarter_page"
  | "website_business"
  | "paid_private"
  | "free"
  | "affiliate";

export type PlacementSource =
  | "stripe_paid"
  | "included_with_print"
  | "promo_code"
  | "admin_comp"
  | "affiliate"
  | "free"
  | "manual_contract";

export type PlacementSurface =
  | "home"
  | "clasificados"
  | "negocios"
  | "category_landing"
  | "category_results"
  | "dashboard"
  | "admin";

export type PlacementEntitlementStatus =
  | "active"
  | "scheduled"
  | "expired"
  | "cancelled"
  | "comped";

export type PlacementEntitlementRow = {
  id?: string;
  category: string;
  placementTier: PlacementTier | string;
  placementSource?: PlacementSource | string | null;
  surfaces: string[];
  startsAt?: string | null;
  endsAt?: string | null;
  status?: PlacementEntitlementStatus | string | null;
  manualPriority?: number | null;
  rotationWeight?: number | null;
  listingId?: string | null;
  leonixAdId?: string | null;
};

export const PLACEMENT_TIER_RANK: Record<PlacementTier, number> = {
  partner_premium: 800,
  print_full_page: 700,
  print_half_page: 600,
  print_quarter_page: 500,
  website_business: 400,
  paid_private: 300,
  affiliate: 200,
  free: 100,
};

export const PLACEMENT_SURFACES: PlacementSurface[] = [
  "home",
  "clasificados",
  "negocios",
  "category_landing",
  "category_results",
  "dashboard",
  "admin",
];

export function normalizePlacementTier(value: unknown): PlacementTier | "unknown" {
  const raw = String(value ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (raw in PLACEMENT_TIER_RANK) return raw as PlacementTier;
  if (raw === "premium" || raw === "partner") return "partner_premium";
  if (raw === "full_page") return "print_full_page";
  if (raw === "half_page") return "print_half_page";
  if (raw === "quarter_page") return "print_quarter_page";
  return "unknown";
}

export function placementTierRank(tier: string | null | undefined): number {
  const normalized = normalizePlacementTier(tier);
  if (normalized === "unknown") return 0;
  return PLACEMENT_TIER_RANK[normalized];
}

export function isSurfaceEligible(
  entitlement: Pick<PlacementEntitlementRow, "surfaces">,
  surface: PlacementSurface | string,
): boolean {
  const target = String(surface ?? "").trim().toLowerCase();
  return (entitlement.surfaces ?? []).some(
    (s) => String(s).trim().toLowerCase() === target,
  );
}

/** No unrelated category placement — entitlement category must match listing category. */
export function placementCategoryMatches(
  entitlementCategory: string | null | undefined,
  listingCategory: string | null | undefined,
): boolean {
  const a = String(entitlementCategory ?? "").trim().toLowerCase();
  const b = String(listingCategory ?? "").trim().toLowerCase();
  if (!a || !b) return false;
  return a === b;
}

export function isPlacementEntitlementActive(
  row: Pick<PlacementEntitlementRow, "status" | "startsAt" | "endsAt">,
  now: Date = new Date(),
): boolean {
  const status = String(row.status ?? "").trim().toLowerCase();
  if (status === "cancelled" || status === "expired") return false;
  if (status === "comped" || status === "active") {
    const start = row.startsAt ? new Date(row.startsAt) : null;
    const end = row.endsAt ? new Date(row.endsAt) : null;
    const ts = now.getTime();
    if (start && Number.isFinite(start.getTime()) && start.getTime() > ts) return false;
    if (end && Number.isFinite(end.getTime()) && end.getTime() < ts) return false;
    return true;
  }
  if (status === "scheduled") {
    const start = row.startsAt ? new Date(row.startsAt) : null;
    return !!start && Number.isFinite(start.getTime()) && start.getTime() <= now.getTime();
  }
  return false;
}

export type PlacementSortInput = PlacementEntitlementRow & {
  listingCategory: string;
  surface: PlacementSurface | string;
  verified?: boolean;
  republishedAt?: string | null;
  relevanceScore?: number;
};

/**
 * Deterministic placement sort skeleton (pure).
 * Full category/results integration is a later gate.
 */
export function comparePlacementEntitlements(a: PlacementSortInput, b: PlacementSortInput): number {
  const aEligible =
    placementCategoryMatches(a.category, a.listingCategory) &&
    isSurfaceEligible(a, a.surface) &&
    isPlacementEntitlementActive(a);
  const bEligible =
    placementCategoryMatches(b.category, b.listingCategory) &&
    isSurfaceEligible(b, b.surface) &&
    isPlacementEntitlementActive(b);

  if (aEligible !== bEligible) return aEligible ? -1 : 1;

  const tierDiff = placementTierRank(b.placementTier) - placementTierRank(a.placementTier);
  if (tierDiff !== 0) return tierDiff;

  const priorityDiff = (b.manualPriority ?? 100) - (a.manualPriority ?? 100);
  if (priorityDiff !== 0) return priorityDiff;

  const rotationDiff = (b.rotationWeight ?? 1) - (a.rotationWeight ?? 1);
  if (rotationDiff !== 0) return rotationDiff;

  if (Boolean(b.verified) !== Boolean(a.verified)) return b.verified ? 1 : -1;

  const bRep = b.republishedAt ? new Date(b.republishedAt).getTime() : 0;
  const aRep = a.republishedAt ? new Date(a.republishedAt).getTime() : 0;
  if (bRep !== aRep) return bRep - aRep;

  return (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0);
}

export function placementEntitlementWarnings(row: PlacementEntitlementRow): string[] {
  const warnings: string[] = [];
  if (!row.category) warnings.push("Missing category — placement must not affect public surfaces.");
  if (!row.surfaces?.length) warnings.push("Missing surfaces — entitlement will not rank publicly.");
  if (normalizePlacementTier(row.placementTier) === "unknown") {
    warnings.push("Unknown placement tier — admin review required.");
  }
  return warnings;
}
