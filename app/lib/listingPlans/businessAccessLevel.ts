/**
 * Business access level — the SIMPLE vs FULL commercial dimension (pure: no DB, no Stripe, no env).
 *
 * Leonix sells two orthogonal things to a business:
 *
 *   1. PRINT PACKAGE TIER  (`package_tier`: quarter_page | half_page | full_page | premium | …)
 *      — magazine placement plus the print VISIBILITY benefits already modelled by
 *        `packageEntitlements.ts` (destacados, results priority, republish, boost, print badge).
 *
 *   2. BUSINESS ACCESS LEVEL (this module: none | simple | full)
 *      — how much of the DIGITAL business product the customer may use.
 *
 * They are deliberately NOT conflated. Overloading the print tier enum with digital access
 * would corrupt ranking, because ranking reads the tier. A quarter-page advertiser keeps its
 * quarter-page ranking AND gets `simple` digital access; a half-page advertiser keeps its
 * half-page ranking AND gets `full` digital access.
 *
 * Nothing here is stored. The level is DERIVED at read time from columns that already exist on
 * `listing_package_entitlements` (`package_key`, `package_tier`, `status`, `ends_at`), so this
 * model needs no migration and no new table. Two independent sources can grant it:
 *
 *   - a digital package the customer bought   -> `RevenuePackageDefinition.businessAccessLevel`
 *   - a print package the customer bought     -> `businessAccessLevelForPrintTier` (the bridge)
 *
 * When a customer holds both, the HIGHEST level wins. A print half-page subscriber who also
 * bought a $99 Quick package is `full`, never `simple` — this module can only ever upgrade a
 * customer, never silently downgrade one.
 */

import { isRowCurrentlyLive, type EntitlementRowFacts } from "./categoryCommercialPlanPolicy";
import { normalizePackageEntitlementTier, type PackageEntitlementTier } from "./packageEntitlements";
import { getRevenuePackageDefinition } from "./revenuePricingMatrix";

export type BusinessAccessLevel = "none" | "simple" | "full";

/**
 * Capabilities gated by ACCESS LEVEL. Deliberately disjoint from
 * `RevenuePackageDefinition.capabilities` (today: `coupons_offers`), which stays the per-package
 * grant it already is. Keeping them separate is what stops this module from silently widening an
 * existing product: granting `full` never invents `coupons_offers` for a category whose package
 * never declared it.
 */
export type BusinessAccessCapability =
  // Included at SIMPLE and above.
  | "public_listing"
  | "contact_ctas"
  | "simple_management"
  | "upgrade_to_full"
  // FULL only.
  | "business_hub"
  | "analytics"
  | "leads"
  | "business_tools"
  | "business_concierge"
  | "inventory_expansion"
  | "advanced_media";

const SIMPLE_CAPABILITIES: readonly BusinessAccessCapability[] = [
  "public_listing",
  "contact_ctas",
  "simple_management",
  "upgrade_to_full",
];

/** Everything SIMPLE has, plus the operator-grade surfaces Simple is explicitly sold without. */
const FULL_ONLY_CAPABILITIES: readonly BusinessAccessCapability[] = [
  "business_hub",
  "analytics",
  "leads",
  "business_tools",
  "business_concierge",
  "inventory_expansion",
  "advanced_media",
];

export const BUSINESS_ACCESS_FULL_ONLY_CAPABILITIES = FULL_ONLY_CAPABILITIES;

const RANK: Record<BusinessAccessLevel, number> = { none: 0, simple: 1, full: 2 };

export function compareBusinessAccessLevel(a: BusinessAccessLevel, b: BusinessAccessLevel): number {
  return RANK[a] - RANK[b];
}

/** The higher of two levels. Used everywhere two grants overlap — never the newer or the cheaper. */
export function maxBusinessAccessLevel(
  a: BusinessAccessLevel,
  b: BusinessAccessLevel,
): BusinessAccessLevel {
  return RANK[a] >= RANK[b] ? a : b;
}

export function capabilitiesForBusinessAccessLevel(
  level: BusinessAccessLevel,
): BusinessAccessCapability[] {
  if (level === "full") return [...SIMPLE_CAPABILITIES, ...FULL_ONLY_CAPABILITIES];
  if (level === "simple") return [...SIMPLE_CAPABILITIES];
  return [];
}

export function businessAccessAllows(
  level: BusinessAccessLevel,
  capability: BusinessAccessCapability,
): boolean {
  return capabilitiesForBusinessAccessLevel(level).includes(capability);
}

export function isFullOnlyCapability(capability: BusinessAccessCapability): boolean {
  return FULL_ONLY_CAPABILITIES.includes(capability);
}

/**
 * OWNER COMMERCIAL LOCK — the print-to-digital business-access bridge.
 *
 * Quarter page includes SIMPLE digital access; half page, full page and premium include FULL.
 * This grants DIGITAL PRODUCT ACCESS only. Print ranking and print visibility benefits are
 * untouched and continue to come from `packageEntitlements.getPackageEntitlementBenefits`, which
 * this function deliberately does not call: the two dimensions must stay independently auditable.
 *
 * `classified_print` and `digital_only` are NOT business packages, so they bridge to nothing —
 * a digital-only row's access comes from its own `package_key`, not from its tier.
 */
export function businessAccessLevelForPrintTier(
  tier: PackageEntitlementTier | string | null | undefined,
): BusinessAccessLevel {
  const normalized = normalizePackageEntitlementTier(tier);
  switch (normalized) {
    case "premium":
    case "full_page":
    case "half_page":
      return "full";
    case "quarter_page":
      return "simple";
    default:
      return "none";
  }
}

/** The access level a purchased digital package confers, declared on the package itself. */
export function businessAccessLevelForPackageKey(
  packageKey: string | null | undefined,
): BusinessAccessLevel {
  const key = String(packageKey ?? "").trim().toLowerCase();
  if (!key) return "none";
  const def = getRevenuePackageDefinition(key);
  if (!def?.businessAccessLevel) return "none";
  return def.businessAccessLevel;
}

export type BusinessAccessGrantSourceKind = "digital_package" | "print_package" | "none";

export type BusinessAccessDecision = {
  level: BusinessAccessLevel;
  capabilities: BusinessAccessCapability[];
  /** Which dimension produced the winning level — for honest staff/admin display. */
  source: BusinessAccessGrantSourceKind;
  /** The winning row's package key, when the winner was a digital package. Never fabricated. */
  packageKey: string | null;
  /** The winning row's print tier, when the winner was a print package. Never fabricated. */
  printTier: PackageEntitlementTier | null;
  /** Every live grant seen, highest first — so staff can see "print half page + quick". */
  grants: BusinessAccessGrant[];
};

export type BusinessAccessGrant = {
  level: BusinessAccessLevel;
  kind: BusinessAccessGrantSourceKind;
  packageKey: string | null;
  printTier: PackageEntitlementTier | null;
  entitlementId: string;
  endsAt: string | null;
};

const NO_ACCESS: BusinessAccessDecision = {
  level: "none",
  capabilities: [],
  source: "none",
  packageKey: null,
  printTier: null,
  grants: [],
};

/**
 * Decide business access from the caller's full live entitlement row set.
 *
 * Mirrors the liveness doctrine already established in `categoryCommercialPlanPolicy`: a listing
 * may legitimately hold several simultaneously-live rows, and a stale `active` row past its own
 * `ends_at` is not live even though nothing has swept it yet. A `suspended` subscription blocks
 * access outright, matching the locked grace doctrine (grace keeps paid access usable).
 */
export function decideBusinessAccess(input: {
  rows: readonly EntitlementRowFacts[];
  nowMs: number;
  subscriptionOverride?: "grace" | "suspended" | null;
}): BusinessAccessDecision {
  if (input.subscriptionOverride === "suspended") return { ...NO_ACCESS };

  const grants: BusinessAccessGrant[] = [];
  for (const row of input.rows ?? []) {
    if (!isRowCurrentlyLive(row, input.nowMs)) continue;

    const fromPackage = businessAccessLevelForPackageKey(row.packageKey);
    if (fromPackage !== "none") {
      grants.push({
        level: fromPackage,
        kind: "digital_package",
        packageKey: row.packageKey,
        printTier: null,
        entitlementId: row.id,
        endsAt: row.endsAt,
      });
    }

    const fromPrint = businessAccessLevelForPrintTier(row.packageTier);
    if (fromPrint !== "none") {
      grants.push({
        level: fromPrint,
        kind: "print_package",
        packageKey: null,
        printTier: normalizePackageEntitlementTier(row.packageTier),
        entitlementId: row.id,
        endsAt: row.endsAt,
      });
    }
  }

  if (grants.length === 0) return { ...NO_ACCESS };

  grants.sort((a, b) => RANK[b.level] - RANK[a.level]);
  const winner = grants[0]!;

  return {
    level: winner.level,
    capabilities: capabilitiesForBusinessAccessLevel(winner.level),
    source: winner.kind,
    packageKey: winner.packageKey,
    printTier: winner.printTier,
    grants,
  };
}

export type BusinessAccessCapabilityDecision = {
  allowed: boolean;
  level: BusinessAccessLevel;
  /** True when FULL would allow this and the customer is on SIMPLE — the upsell case. */
  upgradeUnlocks: boolean;
  requiredLevel: BusinessAccessLevel;
};

/**
 * The single question every Full-only feature gate asks. Returning `upgradeUnlocks` is what lets
 * a Simple customer be shown an honest upgrade path instead of a dead end, without any caller
 * re-deriving the rule.
 */
export function decideBusinessAccessCapability(input: {
  level: BusinessAccessLevel;
  capability: BusinessAccessCapability;
}): BusinessAccessCapabilityDecision {
  const requiredLevel: BusinessAccessLevel = isFullOnlyCapability(input.capability)
    ? "full"
    : "simple";
  const allowed = businessAccessAllows(input.level, input.capability);
  return {
    allowed,
    level: input.level,
    requiredLevel,
    upgradeUnlocks: !allowed && businessAccessAllows("full", input.capability),
  };
}
