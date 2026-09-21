# Comida Local — commercial classification audit (Gate 7)

Question: should Comida Local join the SIMPLE vs FULL business access split introduced by this
mission, and if so at what price?

Verdict: **A — existing standalone category package only. Commercial tier expansion is DEFERRED
pending an owner decision.** Comida Local keeps `comida_local_base_monthly` at $129/mo, declares
no `businessAccessLevel`, and is absent from `BUSINESS_CATEGORY_PACKAGE_PAIR`.

This gate changed no Comida Local behaviour. It is an audit plus a mechanical lock on the
deferral, so a later pass cannot drift the category into the split by accident.

## What repository truth actually says

| Question | Answer | Evidence |
|---|---|---|
| How many paid Comida Local products exist? | Exactly one | `revenuePricingMatrix.ts` — `comida_local_base_monthly`, `priceCents: 12900`, `monthly_subscription`, `stripeEligible: true` |
| Is that price owner-locked? | Yes | Matrix comment "Gate D18 — owner-locked current sale price for Comida Local"; Owner Command Center Bible §14 "Comida Local \| $129/month" |
| Do the legacy $99 Basic / $149 Plus tiers still sell? | No | `comidaLocalPackages.ts` — "never wired to Stripe and are superseded for all current sales by the single `comida_local_base_monthly` $129/mo package… they remain only for historical tier-label/feature-limit reads" |
| Does Comida Local use the shared business-access resolver? | No | `CATEGORY_BASE_PACKAGE_KEY` / `CATEGORY_ADDON_PACKAGE_KEY` contain only `restaurantes` and `servicios`; no Comida Local call site of `resolveBusinessToolsAccess` exists |
| Does it get Business Hub, coupons, or an analytics surface? | No | `categoryRouteRegistry.ts` — `supportsBusinessHub: false`, `supportsCoupons: false`; matrix `capabilities: []`; `mapComidaLocalDashboardListing.ts` — `analyticsHref: null` |
| Does it use `listing_package_entitlements`? | For billing only | `revenueActiveEntitlementGuard.ts` includes the key (recharge protection); the dashboard reads native `comida_local_public_listings.package_tier` / `payment_status` via `mapComidaLocalDashboardListing.ts`, not the shared plan resolver |
| Is there already a "Quick" Comida Local? | A shorter intake form, not a cheaper tier | `quickRemainingRegistry.ts` routes `/publicar/comida-local/rapido` at `packageKey: "comida_local_base_monthly"`; the remaining-families decision doc states "Not a new product, not a new schema, not a new price" |
| Does any owner doc approve a Comida Local Simple tier? | No such document exists | Searched `docs/**`; the only Comida Local commercial locks found are the $129 price and its distinctness from the $399 Restaurantes product |

## Why deferral is the correct outcome, not laziness

Three independent reasons, each sufficient on its own.

**There is no owner decision to implement.** The mission's standing instruction is to use repository
truth where it answers a question and to record — not invent — a missing owner commercial decision.
Repository truth answers "what does Comida Local cost" ($129, locked) and "is it in the split"
(no). It does not answer "should there be a $99 Comida Local". Choosing a price here would be
fabricating a commercial decision.

**The three candidate options are not equivalent, and two of them change money.** Option B (Simple
access at the existing $129) would silently reclassify every existing Comida Local customer as a
Simple business, which is a downgrade in stated entitlement for people who bought a standalone
product that was never sold as tiered. Option C (both Quick and Full tiers) requires a Full
Comida Local product that does not exist and a price for it. Option A changes nothing and
forecloses nothing.

**Comida Local is a different shape from the four split categories.** The split works because
Servicios, Restaurantes, Autos Dealer and Bienes Negocio each resolve commercial state through
`listing_package_entitlements` and the shared plan resolver, so an access level can be derived at
read time from columns those rows already carry. Comida Local renders its plan and payment truth
from native columns on its own published-listing table instead. Giving it an access level would
either do nothing (nothing reads it) or require wiring Comida Local into the shared resolver —
a structural change to an already-certified flow, which this mission is explicitly told not to
destabilise.

## What is now locked mechanically

`scripts/verify-quick-business-access-level-01.ts` — "Comida Local keeps its own $129 product and
stays out of the split" asserts all four of:

- `comida_local_base_monthly` still exists and is still `12900` cents
- it declares no `businessAccessLevel`
- `isBusinessAccessCategory("comida-local")` is false
- the matrix holds exactly one `comida-local` package, so no second SKU can be slipped in

`scripts/verify-quick-upgrade-contract-05.ts` independently asserts
`upgradeTargetPackageKey("comida-local") === null`, so no upgrade path can appear for a category
that has nothing to upgrade into.

## What an owner decision would need to supply

If the owner later wants Comida Local tiered, the missing inputs are exactly:

1. the Simple price (the $99 Quick Business rate is **not** transferable — Comida Local is a
   distinct product at a distinct rate, and the retired Basic tier was coincidentally $99)
2. whether existing $129 customers become Simple or Full
3. what a Comida Local Full tier would include, given the category has no Business Hub, no
   coupons and no analytics surface today

Given those three answers, the implementation is small: add the second package to the matrix with
a `businessAccessLevel`, add the category to `BUSINESS_CATEGORY_PACKAGE_PAIR`, and point the Quick
intake at the Simple key. No migration and no new resolver — the same shape used for the four
categories this mission did close.
