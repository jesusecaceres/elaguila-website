/**
 * Package C Build 3 (C5/C6) — pure canonical category-plan decision logic (no DB, no Stripe,
 * no env; imports only the static pricing matrix). The impure resolver
 * (categoryCommercialPlan.ts) fetches the real entitlement row set and subscription state and
 * hands them here.
 *
 * Coach's Final Addendum, encoded directly:
 *   - A listing may have multiple simultaneously-live entitlement rows (the DB uniqueness
 *     boundary is per (listing_source, listing_id, package_key), not per listing) — this module
 *     never assumes a single row and never picks "whichever is newest."
 *   - A canonical base-package row (by real packageKey, or the narrowly-qualified historical
 *     print-included fallback) always wins over an also-active legacy addon entitlement.
 *   - A legacy addon-only listing gets coupon capability for compatibility, but its
 *     `packageKey` in the result is honestly the addon's own key — never fabricated as the base
 *     package.
 *   - The historical print fallback requires BOTH `grant_source === "print_included"` AND a
 *     qualifying non-digital-only `package_tier` — category alone is never sufficient.
 */

import { getRevenuePackageDefinition } from "./revenuePricingMatrix";

export type EntitlementRowFacts = {
  id: string;
  packageKey: string | null;
  grantSource: string | null;
  packageTier: string | null;
  status: string;
  startsAt: string | null;
  endsAt: string | null;
};

export const CATEGORY_BASE_PACKAGE_KEY: Readonly<Record<string, string>> = {
  restaurantes: "restaurantes_base_monthly",
  servicios: "servicios_base_monthly",
};

export const CATEGORY_ADDON_PACKAGE_KEY: Readonly<Record<string, string>> = {
  restaurantes: "restaurantes_offers_addon",
  servicios: "servicios_offers_addon",
};

const QUALIFYING_PRINT_TIERS = new Set([
  "premium",
  "full_page",
  "half_page",
  "quarter_page",
  "classified_print",
]);

/** Effective liveness: stored status AND ends_at both matter — a stale 'active' row past its
 * own end date is not live, even though nothing has swept it yet (read-time reconciliation,
 * matching the doctrine already established for subscription grace elsewhere in this repo). */
export function isRowCurrentlyLive(row: { status: string; endsAt: string | null }, nowMs: number): boolean {
  if (row.status !== "active" && row.status !== "scheduled") return false;
  if (row.endsAt) {
    const end = Date.parse(row.endsAt);
    if (Number.isFinite(end) && end < nowMs) return false;
  }
  return true;
}

/** Coach's Final Addendum — narrowed historical fallback. Category + null package_key alone is
 * never sufficient; admin_manual/digital_only/unknown rows never qualify. */
export function qualifiesForLegacyPrintIncludedFallback(row: EntitlementRowFacts, category: string): boolean {
  if (row.packageKey) return false;
  if (row.grantSource !== "print_included") return false;
  if (!row.packageTier || !QUALIFYING_PRINT_TIERS.has(row.packageTier)) return false;
  return category === "restaurantes" || category === "servicios";
}

export type CanonicalResolution = {
  canonical: EntitlementRowFacts | null;
  canonicalIsPrintFallback: boolean;
  legacyAddonRow: EntitlementRowFacts | null;
  /** Most-recent NON-live row that would have qualified as canonical, for honest "expired"
   * reporting instead of silently reporting "none" for a listing that once had a package. */
  expiredCanonicalCandidate: EntitlementRowFacts | null;
};

export function resolveCanonicalEntitlement(input: {
  category: string;
  rows: EntitlementRowFacts[];
  nowMs: number;
}): CanonicalResolution {
  const baseKey = CATEGORY_BASE_PACKAGE_KEY[input.category];
  const addonKey = CATEGORY_ADDON_PACKAGE_KEY[input.category];
  const live = input.rows.filter((r) => isRowCurrentlyLive(r, input.nowMs));
  const notLive = input.rows.filter((r) => !isRowCurrentlyLive(r, input.nowMs));

  let canonical: EntitlementRowFacts | null = baseKey ? live.find((r) => r.packageKey === baseKey) ?? null : null;
  let canonicalIsPrintFallback = false;
  if (!canonical) {
    const fallback = live.find((r) => qualifiesForLegacyPrintIncludedFallback(r, input.category)) ?? null;
    if (fallback) {
      canonical = fallback;
      canonicalIsPrintFallback = true;
    }
  }

  const legacyAddonRow = addonKey ? live.find((r) => r.packageKey === addonKey) ?? null : null;

  let expiredCanonicalCandidate: EntitlementRowFacts | null = null;
  if (!canonical) {
    const expiredBase = baseKey
      ? notLive
          .filter((r) => r.packageKey === baseKey)
          .sort((a, b) => Date.parse(b.endsAt ?? "") - Date.parse(a.endsAt ?? ""))[0] ?? null
      : null;
    const expiredFallback =
      notLive.filter((r) => qualifiesForLegacyPrintIncludedFallback(r, input.category))
        .sort((a, b) => Date.parse(b.endsAt ?? "") - Date.parse(a.endsAt ?? ""))[0] ?? null;
    const expiredAddon = addonKey
      ? notLive
          .filter((r) => r.packageKey === addonKey)
          .sort((a, b) => Date.parse(b.endsAt ?? "") - Date.parse(a.endsAt ?? ""))[0] ?? null
      : null;
    expiredCanonicalCandidate = expiredBase ?? expiredFallback ?? expiredAddon ?? null;
  }

  return { canonical, canonicalIsPrintFallback, legacyAddonRow, expiredCanonicalCandidate };
}

export type PlanStatus = "active" | "grace" | "suspended" | "scheduled" | "expired" | "none";
export type CapabilitySource = "package_key" | "legacy_print_included" | "legacy_addon_entitlement" | "none";
export type ReasonCode =
  | "active_package"
  | "active_grant"
  | "legacy_addon_entitlement"
  | "no_qualifying_package"
  | "suspended"
  | "expired";

export type CategoryListingPlan = {
  packageKey: string | null;
  grantSource: string | null;
  status: PlanStatus;
  startsAt: string | null;
  endsAt: string | null;
  capabilities: string[];
  capabilitySource: CapabilitySource;
};

const REAL_PAYMENT_GRANT_SOURCES = new Set(["stripe_webhook", "manual_cleared_payment"]);

export function decideCategoryListingPlan(input: {
  category: string;
  rows: EntitlementRowFacts[];
  nowMs: number;
  /** Pre-resolved by the impure layer from leonix_subscription_records — only meaningful when
   * the canonical row's package billingMode is monthly_subscription. Never reads placement,
   * account tier, or verification — those are structurally absent from this input's shape. */
  subscriptionOverride?: "grace" | "suspended" | null;
}): CategoryListingPlan {
  const { canonical, canonicalIsPrintFallback, legacyAddonRow, expiredCanonicalCandidate } =
    resolveCanonicalEntitlement({ category: input.category, rows: input.rows, nowMs: input.nowMs });

  if (canonical) {
    const packageDef = canonical.packageKey ? getRevenuePackageDefinition(canonical.packageKey) : null;
    const baseKey = CATEGORY_BASE_PACKAGE_KEY[input.category];
    const baseDef = baseKey ? getRevenuePackageDefinition(baseKey) : null;
    const capabilitySource: CapabilitySource = canonicalIsPrintFallback ? "legacy_print_included" : "package_key";
    const baseCapabilities = canonicalIsPrintFallback ? baseDef?.capabilities ?? [] : packageDef?.capabilities ?? [];

    let status: PlanStatus = canonical.status === "scheduled" ? "scheduled" : "active";
    if (input.subscriptionOverride === "suspended") status = "suspended";
    else if (input.subscriptionOverride === "grace") status = "grace";

    // Locked grace doctrine (Build 1/C3): existing paid access stays usable through grace;
    // suspended blocks capability outright.
    const capabilitiesAllowed = status !== "suspended";
    const legacyAddonAlsoActive = Boolean(legacyAddonRow);
    const capabilities = capabilitiesAllowed
      ? Array.from(new Set([...baseCapabilities, ...(legacyAddonAlsoActive ? ["coupons_offers"] : [])]))
      : [];

    return {
      packageKey: canonical.packageKey, // honest — null for a print-fallback row, never fabricated
      grantSource: canonical.grantSource,
      status,
      startsAt: canonical.startsAt,
      endsAt: canonical.endsAt,
      capabilities,
      capabilitySource,
    };
  }

  if (legacyAddonRow) {
    return {
      packageKey: legacyAddonRow.packageKey,
      grantSource: legacyAddonRow.grantSource,
      status: legacyAddonRow.status === "scheduled" ? "scheduled" : "active",
      startsAt: legacyAddonRow.startsAt,
      endsAt: legacyAddonRow.endsAt,
      capabilities: ["coupons_offers"],
      capabilitySource: "legacy_addon_entitlement",
    };
  }

  if (expiredCanonicalCandidate) {
    return {
      packageKey: expiredCanonicalCandidate.packageKey,
      grantSource: expiredCanonicalCandidate.grantSource,
      status: "expired",
      startsAt: expiredCanonicalCandidate.startsAt,
      endsAt: expiredCanonicalCandidate.endsAt,
      capabilities: [],
      capabilitySource: "none",
    };
  }

  return { packageKey: null, grantSource: null, status: "none", startsAt: null, endsAt: null, capabilities: [], capabilitySource: "none" };
}

export type BusinessToolsDecision = {
  allowed: boolean;
  reasonCode: ReasonCode;
  plan: CategoryListingPlan;
};

export function decideBusinessToolsAccess(input: { plan: CategoryListingPlan; capability: string }): BusinessToolsDecision {
  const { plan } = input;
  if (plan.status === "suspended") return { allowed: false, reasonCode: "suspended", plan };
  if (plan.status === "expired") return { allowed: false, reasonCode: "expired", plan };
  if (plan.status === "none") return { allowed: false, reasonCode: "no_qualifying_package", plan };

  const allowed = plan.capabilities.includes(input.capability);
  if (!allowed) return { allowed: false, reasonCode: "no_qualifying_package", plan };

  if (plan.capabilitySource === "legacy_addon_entitlement") {
    return { allowed: true, reasonCode: "legacy_addon_entitlement", plan };
  }
  if (plan.grantSource && REAL_PAYMENT_GRANT_SOURCES.has(plan.grantSource)) {
    return { allowed: true, reasonCode: "active_package", plan };
  }
  // admin_manual / comp / partner / print_included fallback — a valid, real grant, just not a
  // real-payment source.
  return { allowed: true, reasonCode: "active_grant", plan };
}
