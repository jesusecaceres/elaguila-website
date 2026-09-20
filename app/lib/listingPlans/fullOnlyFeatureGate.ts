/**
 * Server-side gate for FULL-only business features (Business Hub, analytics, leads, …).
 *
 * UI hiding is not access control. Every route that serves a Full-only capability calls this,
 * because an authenticated Simple customer can otherwise reach the data route directly with
 * their own listing id and read a feature they did not buy — ownership checks pass, since they
 * really do own the listing. What they lack is the entitlement, not the ownership.
 *
 * DENY IS DELIBERATELY NARROW: only an access level of exactly `simple` is denied.
 *
 * `none` is never denied. A category with no Simple/Full split, a listing with no entitlement
 * row, an unconfigured database and a failed lookup all resolve to `none`, and denying those
 * would silently strip analytics from classifieds and from listings whose commercial state this
 * model does not describe. Denying only `simple` means the gate can reject exactly the customers
 * who bought the Simple product and no one else — the blast radius is the new product itself.
 *
 * The one intended behaviour change for an existing customer is the owner's commercial lock:
 * a quarter-page print advertiser now resolves to `simple`, so a quarter-page-only business is
 * denied Full-only features. A quarter-page customer who ALSO holds a Full digital package
 * still resolves to `full`, because the access resolver always takes the highest live grant.
 */

import "server-only";
import {
  isBusinessAccessCategory,
  upgradeTargetPackageKey,
  type BusinessAccessCapability,
  type BusinessAccessLevel,
} from "./businessAccessLevel";
import { resolveBusinessAccess } from "./categoryCommercialPlan";

export type FullOnlyFeatureGateResult = {
  /** True when the caller must refuse to serve the feature. */
  denied: boolean;
  level: BusinessAccessLevel;
  capability: BusinessAccessCapability;
  /** The Full package key this customer would buy to unlock it. Null outside the split. */
  upgradePackageKey: string | null;
};

export async function resolveFullOnlyFeatureGate(input: {
  category: string | null | undefined;
  listingSource: string | null | undefined;
  listingId: string | null | undefined;
  capability: BusinessAccessCapability;
}): Promise<FullOnlyFeatureGateResult> {
  const category = String(input.category ?? "").trim().toLowerCase();
  const listingSource = String(input.listingSource ?? "").trim();
  const listingId = String(input.listingId ?? "").trim();

  const open: FullOnlyFeatureGateResult = {
    denied: false,
    level: "none",
    capability: input.capability,
    upgradePackageKey: null,
  };

  if (!isBusinessAccessCategory(category) || !listingSource || !listingId) return open;

  let level: BusinessAccessLevel = "none";
  try {
    level = (await resolveBusinessAccess({ category, listingSource, listingId })).level;
  } catch {
    // An unreadable commercial state must not remove access a customer already had.
    return open;
  }

  if (level !== "simple") return { ...open, level };

  return {
    denied: true,
    level,
    capability: input.capability,
    upgradePackageKey: upgradeTargetPackageKey(category),
  };
}

/** The response body every denied Full-only route returns, so the client can offer the upgrade. */
export function fullOnlyFeatureDeniedBody(gate: FullOnlyFeatureGateResult): {
  ok: false;
  error: "upgrade_required";
  required_level: "full";
  business_access_level: BusinessAccessLevel;
  capability: BusinessAccessCapability;
  upgrade_package_key: string | null;
} {
  return {
    ok: false,
    error: "upgrade_required",
    required_level: "full",
    business_access_level: gate.level,
    capability: gate.capability,
    upgrade_package_key: gate.upgradePackageKey,
  };
}
