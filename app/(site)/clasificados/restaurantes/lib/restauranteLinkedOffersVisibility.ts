/**
 * RESTAURANTES — public LINKED OFFERS visibility (pure decision, no IO, no `server-only`).
 *
 * OWNER RULE (Quick / Full boundary, 2026-09-24):
 *   - a PROVEN Quick (Simple) listing never shows offers;
 *   - a proven Full listing shows them;
 *   - unknown / unreadable / no server evidence must NOT hide valid stored Full content just
 *     because the Quick repair exists. Absence of evidence is never a reason to hide.
 *
 * WHY THIS IS NOT THE COUPONS CAPABILITY. `restauranteCouponsCapabilityActive` FAILS CLOSED (a
 * lookup problem hides coupons). Production (d043fede3) never applied that gate to linked offers —
 * it always rendered `fetchRestauranteLinkedOffersForPublicPage` results. Gating linked offers on
 * the coupons capability therefore turned any transient lookup error, or an entitlement-row quirk,
 * into silent removal of a paying Full restaurant's offers. Coupon behavior is untouched; this
 * module only decides linked offers, and it FAILS OPEN for display.
 *
 * PROVEN QUICK, precisely: the entitlement lookup succeeded AND there is at least one LIVE row that
 * is the category's Simple base package (`restaurantes_quick_monthly`, with no print tier lifting it
 * to Full) AND there is NO live row that grants Full access (Full base package, or a half/full/
 * premium print tier). A listing holding BOTH Quick and Full rows (an upgrade in flight) is Full.
 * A lone quarter-page print row is not a Quick base package, so it is not proven Quick.
 * A LIVE legacy `restaurantes_offers_addon` row (the retired $79 offers add-on) means the owner PURCHASED offers,
 * so it is never treated as Quick either: stored offers a customer paid for are not hidden by this repair.
 *
 * Reads only the columns `listing_package_entitlements` already carries; the same Simple/Full
 * derivation (`businessAccessGrantForRow`) every other surface uses, so this cannot drift.
 */
import { businessAccessGrantForRow, businessPackageKeyForLevel } from "@/app/lib/listingPlans/businessAccessLevel";
import { isRowCurrentlyLive } from "@/app/lib/listingPlans/categoryCommercialPlanPolicy";

const CATEGORY = "restaurantes" as const;
/** The retired offers add-on: a live row means offers were purchased (see PROVEN QUICK above). */
const LEGACY_OFFERS_ADDON_KEY = "restaurantes_offers_addon";

export type RestauranteLinkedOffersEntitlementRow = {
  packageKey?: string | null;
  packageTier?: string | null;
  status: string;
  endsAt?: string | null;
};

export type RestauranteLinkedOffersVisibilityInput = {
  /** `error` = the entitlement read failed or could not run. Never treated as evidence of Quick. */
  entitlementLookup: "ok" | "error";
  rows: readonly RestauranteLinkedOffersEntitlementRow[] | null | undefined;
  /** Injectable clock for tests; defaults to now. */
  nowMs?: number;
};

/** True only when server records affirmatively prove Quick (Simple) with no live Full grant. */
export function restauranteListingIsProvenQuick(input: RestauranteLinkedOffersVisibilityInput): boolean {
  if (input.entitlementLookup !== "ok") return false;
  const nowMs = input.nowMs ?? Date.now();
  const simpleKey = businessPackageKeyForLevel(CATEGORY, "simple");
  let quickBase = false;
  for (const row of input.rows ?? []) {
    if (!isRowCurrentlyLive({ status: String(row.status ?? ""), endsAt: row.endsAt ?? null }, nowMs)) continue;
    if (String(row.packageKey ?? "").trim().toLowerCase() === LEGACY_OFFERS_ADDON_KEY) return false;
    const grant = businessAccessGrantForRow({ packageKey: row.packageKey, packageTier: row.packageTier });
    if (!grant) continue;
    if (grant.level === "full") return false; // any live Full grant wins, whatever else is held
    if (
      grant.level === "simple" &&
      grant.kind === "digital_package" &&
      simpleKey !== null &&
      String(row.packageKey ?? "").trim().toLowerCase() === simpleKey
    ) {
      quickBase = true;
    }
  }
  return quickBase;
}

/** Public linked offers render unless the listing is PROVEN Quick. Fails open on error/unknown. */
export function restauranteLinkedOffersVisible(input: RestauranteLinkedOffersVisibilityInput): boolean {
  return !restauranteListingIsProvenQuick(input);
}
