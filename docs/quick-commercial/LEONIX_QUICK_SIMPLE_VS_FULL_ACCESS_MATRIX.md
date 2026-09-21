# LEONIX QUICK — SIMPLE VS FULL ACCESS MATRIX (AUTHORITATIVE)

**Gate 2.** The owner-locked answer to "who gets what". Print columns state the **digital business
access** a print package includes. Print visibility benefits are a **separate dimension** and are
listed in §3 so the two are never confused.

Owner lock, encoded in `businessAccessLevelForPrintTier()`:

```
QUARTER_PAGE  digital_access = SIMPLE
HALF_PAGE     digital_access = FULL
FULL_PAGE     digital_access = FULL
PREMIUM       digital_access = FULL
```

Legend: **Y** included · **N** not included · **CAT** category-dependent (the canonical product
decides) · **SEP** separate entitlement, not conferred by this column.

---

## 1. Access matrix

| Feature | SIMPLE | FULL | QUARTER_PAGE | HALF_PAGE | FULL_PAGE | PREMIUM | Source of truth | Enforcement location | Status |
|---|---|---|---|---|---|---|---|---|---|
| PUBLIC LISTING | Y | Y | Y | Y | Y | Y | `capabilitiesForBusinessAccessLevel` → `public_listing` | canonical category publisher | PROVEN |
| CONTACT CTA CALL | Y | Y | Y | Y | Y | Y | `contact_ctas` | canonical public detail page | PROVEN |
| CONTACT CTA SMS | Y | Y | Y | Y | Y | Y | `contact_ctas` | canonical public detail page (where the category supports it) | PROVEN |
| CONTACT CTA WHATSAPP | Y | Y | Y | Y | Y | Y | `contact_ctas` | canonical public detail page (where the category supports it) | PROVEN |
| CONTACT CTA EMAIL | Y | Y | Y | Y | Y | Y | `contact_ctas` | canonical public detail page (where the category supports it) | PROVEN |
| WEBSITE | Y | Y | Y | Y | Y | Y | `contact_ctas` | canonical public detail page | PROVEN |
| DIRECTIONS | Y | Y | Y | Y | Y | Y | `contact_ctas` | canonical public detail page | PROVEN |
| IMAGE ALLOWANCE | capped | CAT | capped | CAT | CAT | CAT | `QUICK_BUSINESS_DEFINITIONS[].media` / canonical application | Quick intake media contract; canonical publisher | PROVEN |
| VIDEO | CAT | CAT | CAT | CAT | CAT | CAT | canonical category media contract | canonical publisher | PROVEN_NA |
| EDIT | Y | Y | Y | Y | Y | Y | `simple_management` | existing category owner surface (`manage.dashboardHref`) | PROVEN |
| PAUSE | CAT | CAT | CAT | CAT | CAT | CAT | canonical lifecycle | existing category owner surface | PROVEN |
| REACTIVATE | CAT | CAT | CAT | CAT | CAT | CAT | canonical lifecycle | existing category owner surface | PROVEN |
| END/CANCEL | CAT | CAT | CAT | CAT | CAT | CAT | canonical lifecycle + `subscriptionLifecycle.ts` | existing category owner surface | PROVEN |
| RENEW | CAT | CAT | CAT | CAT | CAT | CAT | canonical lifecycle (subscriptions renew; one-time packages re-purchase) | Revenue OS | PROVEN_NA |
| HELP | Y | Y | Y | Y | Y | Y | `simple_management` | `/contact` | PROVEN |
| UPGRADE | Y | n/a | Y | n/a | n/a | n/a | `upgrade_to_full` + `upgradeTargetPackageKey()` | Simple doorway → category checkout | PROVEN |
| BUSINESS HUB | **N** | Y | **N** | Y | Y | Y | `business_hub` (FULL-only) | `resolveFullOnlyFeatureGate` | PROVEN_NA — no customer-facing Hub product exists yet (see current-state §2) |
| ANALYTICS | **N** | Y | **N** | Y | Y | Y | `analytics` (FULL-only) | `app/api/dashboard/analytics/listing/route.ts` → 403 `upgrade_required` | PROVEN |
| LEADS | **N** | Y | **N** | Y | Y | Y | `leads` (FULL-only) | `resolveFullOnlyFeatureGate` | PROVEN_NA — no leads product implemented |
| BUSINESS TOOLS | **N** | **N** | **N** | **N** | **N** | **N** | Business Identity pilot flag `business_identity_flags` | `app/lib/business/access.ts` | PROVEN_NA — orthogonal flagged pilot, not sold in any package (current-state §3) |
| BUSINESS CONCIERGE | **N** | **N** | preview only | Y | Y | Y | Three separate notions (§5): the reserved `business_concierge` capability, the `concierge_eligible` premium print benefit, and the shipped DIY Concierge pilot | `resolveDiyAccess` → pilot flag + exact business membership + `resolveConciergeEntitlement` (print tier only) | PROVEN — the shipped gate grants nothing to a digital-only package, and splits the print ladder exactly where the owner lock does |
| COUPONS/OFFERS | **N** | CAT | SEP | SEP | SEP | SEP | `RevenuePackageDefinition.capabilities` (`coupons_offers`) | `resolveBusinessToolsAccess` (`categoryCommercialPlan.ts`) | PROVEN — included in the Servicios/Restaurantes Full packages only; Quick declares `capabilities: []` |
| INVENTORY | 1 item | package allowance | SEP | SEP | SEP | SEP | `includedInventory` / `addOnInventory` on the package | Revenue OS inventory packs + capacity activation | PROVEN |
| ADVANCED MEDIA | **N** | CAT | **N** | CAT | CAT | CAT | `advanced_media` (FULL-only) | `resolveFullOnlyFeatureGate` | PROVEN_NA — no capability-gated advanced media surface today |
| REPUBLISH | SEP | SEP | Y | Y | Y | **N** | `getPackageEntitlementBenefits().republish_access` | print/visibility model | PROVEN — print dimension, unchanged |
| BOOST | SEP | SEP | **N** | Y | Y | **N** | `getPackageEntitlementBenefits().boost_access` | print/visibility model | PROVEN — print dimension, unchanged |
| AUTO REFRESH | SEP | SEP | **N** | **N** | **N** | **N** | `getPackageEntitlementBenefits().auto_refresh_access` (`digital_only` tier) | print/visibility model | PROVEN — print dimension, unchanged |
| PRINT BADGE | **N** | **N** | Y | Y | Y | Y | `getPackageEntitlementBenefits().print_advertiser_badge` | print/visibility model | PROVEN — a digital package never confers a print badge |
| PRINT PRIORITY | **N** | **N** | **N** | **N** | Y | **N** | `eligibleForResultsPriority` (full page only) | print/visibility model | PROVEN — unchanged |
| DESTACADOS | **N** | **N** | **N** | **N** | **N** | Y | `eligibleForDestacadosModule` (premium only) | print/visibility model | PROVEN — unchanged |

---

## 2. Why print columns are not a copy of the SIMPLE / FULL columns

A print package grants **two independent things**:

1. its **print visibility** benefits (the bottom six rows), which come from
   `getPackageEntitlementBenefits(tier)` and are unchanged by this mission; and
2. its **bundled digital business access**, which comes from `businessAccessLevelForPrintTier(tier)`
   and is new.

A quarter-page advertiser keeps `print_advertiser_badge` and `republish_access` **and** gains
SIMPLE digital access. It does not gain boost, destacados, results priority, the Hub or analytics.
A premium advertiser keeps destacados **and** gains FULL digital access — and separately keeps the
pre-existing `concierge_eligible` print benefit, which is not the same thing as the FULL
`business_concierge` capability.

## 3. Combination rule

Two steps, in order.

**Per row** (`businessAccessGrantForRow`): one entitlement row is one purchase, so it yields at
most one grant. If the row carries a print tier, the **tier decides** and the row's `package_key`
is ignored for access purposes. Otherwise the package key decides.

That precedence is load-bearing, not cosmetic. Package C Build 3 stamps the category **base
(Full)** package key onto print-tier admin grants in Restaurantes and Servicios so the
pre-existing capability resolver can find the catalog entry by exact key. The stamp records which
catalog row to read; it is not evidence the customer paid $399. Taking the maximum of tier and
key at row level would have handed every quarter-page advertiser in those two categories FULL
access off a bookkeeping field, silently breaking the `QUARTER_PAGE = SIMPLE` lock. Locked by
`verify-quick-print-bundle-access-02.ts` → "a stamped Full package_key never upgrades a
quarter-page row to FULL".

**Across rows** (`maxBusinessAccessLevel`, applied in `decideBusinessAccess`): a customer's access
level is the **highest** live grant. This can only ever raise a level, never lower one.

| Holding | Resolves to |
|---|---|
| Quick digital only | SIMPLE |
| Full digital only | FULL |
| Quarter page only | SIMPLE |
| Half / full / premium page only | FULL |
| Quarter page + Quick digital | SIMPLE |
| Quarter page + Full digital | **FULL** |
| Half page + Quick digital | **FULL** |
| Nothing live (expired, or suspended subscription) | NONE |

## 4. Consequence the owner should see

A **quarter-page-only** business advertiser now resolves to SIMPLE and is therefore denied the
FULL-only capabilities — today that means the per-listing analytics route returns
`403 upgrade_required`. This follows directly from the owner lock `QUARTER_PAGE = SIMPLE` and is
intended, not a defect. A quarter-page advertiser who also holds a Full digital package is
unaffected, because the highest grant wins.

## 5. The three things called "Concierge"

They are unrelated, and conflating them is the easiest way to misread the Concierge row:

1. `concierge_eligible` — a **print benefit flag**, premium tier only, in the untouched
   print/visibility model.
2. `business_concierge` — the FULL-only **capability** reserved by this mission. No caller, no copy.
3. The **DIY Concierge** — a shipped customer-facing pilot at
   `/dashboard/business-tools/concierge`, part of the flagged Business Identity product.

Only the third grants anything today. `resolveDiyAccess` requires the pilot flag plus an exact
active business membership, then `resolveConciergeEntitlement` resolves a tier from verified
`business_listing_links` joined against active `listing_package_entitlements` rows — accepting
**print tiers only**. `quarter_page` gives a preview with `personalizedAccess: false`; `half_page`
and above give personalized access; a `digital_only` row (every Quick and every Full digital grant)
is not a known tier and grants nothing.

That pilot predates this mission and splits the print ladder at exactly the point the owner lock
does. The print bridge here restates policy the repository already enforced rather than inventing
it, and `verify-quick-print-bundle-access-02.ts` now asserts the two resolvers agree.
