# LEONIX QUICK — BUSINESS ACCESS ARCHITECTURE

**Gate 3.** The entitlement model behind SIMPLE vs FULL: where it comes from, who resolves it,
what it decides, and what it deliberately does not touch.

---

## SOURCE

Two orthogonal dimensions, never conflated:

| Dimension | Column | Values | Owns |
|---|---|---|---|
| **Print package tier** | `listing_package_entitlements.package_tier` | `premium`, `full_page`, `half_page`, `quarter_page`, `classified_print`, `digital_only`, `none` | magazine placement and print/digital **visibility** ranking |
| **Business access level** | *derived, not stored* | `none`, `simple`, `full` | how much of the **digital business product** the customer may use |

Overloading the print tier enum with digital access was rejected: ranking reads that enum, so a
new value or a reused one would corrupt placement. Instead the level is **derived at read time**
from two columns that already exist:

- `package_key` → `RevenuePackageDefinition.businessAccessLevel` (a new declarative field)
- `package_tier` → `businessAccessLevelForPrintTier()` (the owner-locked print bridge)

**No migration. No new table. No new column.** Nothing about the access level is written anywhere;
it is a function of rows the system already stores.

## RESOLVER

| Layer | File | Purity |
|---|---|---|
| Decision logic | `app/lib/listingPlans/businessAccessLevel.ts` | **pure** — no DB, no Stripe, no env |
| Row fetch + subscription overlay | `app/lib/listingPlans/categoryCommercialPlan.ts` (`resolveBusinessAccess`, `resolveBusinessAccessForListings`) | server-only |
| Route gate | `app/lib/listingPlans/fullOnlyFeatureGate.ts` (`resolveFullOnlyFeatureGate`) | server-only |

`resolveBusinessAccessForListings` reuses the **same** `fetchEntitlementRows` and
`resolveSubscriptionOverrides` the existing plan resolver uses. One fetch implementation means a
listing can never be `full` to one surface and `simple` to another.

## INPUTS

- The listing's **full live entitlement row set** — never one row. A listing may legitimately hold
  several simultaneously-live rows (the DB uniqueness boundary is per
  `(listing_source, listing_id, package_key)`), so the resolver never picks "whichever is newest".
- `nowMs`, applied through the existing `isRowCurrentlyLive` doctrine: a stale `active` row past
  its own `ends_at` is **not** live even though nothing has swept it yet.
- An optional subscription override (`grace` | `suspended`) from `leonix_subscription_records`,
  resolved only for listings holding a live `stripe_webhook` row.

## OUTPUT

```ts
type BusinessAccessDecision = {
  level: "none" | "simple" | "full";
  capabilities: BusinessAccessCapability[];
  source: "digital_package" | "print_package" | "none";
  packageKey: string | null;   // honest: null when a print grant won
  printTier: PackageEntitlementTier | null;
  grants: BusinessAccessGrant[]; // every live grant, highest first
};
```

`grants` is retained rather than collapsed so staff can see *"print half page + Quick digital"*
instead of a single opaque verdict, and so the reason for a level is always auditable.

**Highest grant wins.** `maxBusinessAccessLevel` / the highest-first sort mean this model can only
ever raise a customer's level, never silently lower it.

**Grace and suspension** follow the locked doctrine already in the repo: `grace` keeps existing
paid access usable, `suspended` blocks access outright.

## CAPABILITIES

Access-level capabilities are **disjoint** from the pre-existing
`RevenuePackageDefinition.capabilities` (today: `coupons_offers`). That separation is what stops
the model silently widening an existing product: granting `full` must not invent `coupons_offers`
for Autos or Bienes, whose packages never declared it.

| Level | Capabilities |
|---|---|
| `none` | — |
| `simple` | `public_listing`, `contact_ctas`, `simple_management`, `upgrade_to_full` |
| `full` | everything in `simple`, plus `business_hub`, `analytics`, `leads`, `business_tools`, `business_concierge`, `inventory_expansion`, `advanced_media` |

## FULL GATES

Server-side, via `resolveFullOnlyFeatureGate` + `fullOnlyFeatureDeniedBody`. Wired today into
`app/api/dashboard/analytics/listing/route.ts`, which previously checked only authentication and
ownership.

The gate is deliberately narrow: **it denies an access level of exactly `simple` and nothing
else.**

`none` is never denied. A category outside the Simple/Full split, a listing with no entitlement
row, an unconfigured database and a thrown lookup all resolve to `none`, and denying those would
strip analytics from classifieds and from listings this model does not describe. Denying only
`simple` means the blast radius is exactly the new product.

Ordering inside a gated route is fixed and verified: **authenticate → own → entitlement → read
data**. No protected data is fetched before the entitlement answer.

UI hiding is never the only control. The Simple doorway omits Full entry points *and* the route
refuses a direct request.

## SIMPLE GATES

Simple is not gated by subtraction in the UI. The Simple product is a positive set: the canonical
public listing, the contact CTAs, a capped real-image allowance, and a small management doorway
(`/publicar/negocio-rapido/mi-negocio`) whose every verb links into an existing canonical owner
surface. The doorway performs no writes, calls no API, and makes no commercial decision.

## PRINT BRIDGE

```
quarter_page                       -> simple
half_page | full_page | premium    -> full
classified_print | digital_only    -> none   (not business packages)
```

The bridge is additive. It never reads or rewrites `getPackageEntitlementBenefits`, so print
ranking, destacados, results priority, republish, boost and the print badge are untouched — a fact
asserted mechanically by `verify-quick-print-bundle-access-02.ts`, which strips comments and then
checks that the resolver's executable code contains none of those ranking symbols.

## UPGRADE PATH

`BUSINESS_CATEGORY_PACKAGE_PAIR` is the single place pairing each category's `simple` and `full`
keys; `upgradeTargetPackageKey()` reads it. An upgrade changes which package is paid for and
touches nothing else, so listing id, slug, media, owner and public URL survive by not being read.
Full detail in `LEONIX_QUICK_TO_FULL_UPGRADE_CONTRACT.md`.

## WHAT THIS ARCHITECTURE DOES NOT DO

- No second customer or business database, no second public listing type, no second Business Hub,
  no second dashboard, no parallel checkout. Every Quick purchase goes through the existing
  Revenue OS checkout and the existing entitlement fulfilment.
- No Stripe product or price id is created or invented. `revenueStripe.ts` builds line items with
  inline `price_data`, so a matrix entry is sufficient.
- No print price and no Full price changed.
- It does not touch the Business Identity pilot (`app/lib/business/**`), which is gated by its own
  feature flag and explicitly refuses `listing_package_entitlements` as evidence.
