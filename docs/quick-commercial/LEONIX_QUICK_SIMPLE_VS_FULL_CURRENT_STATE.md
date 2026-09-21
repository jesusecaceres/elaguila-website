# LEONIX QUICK — SIMPLE VS FULL: CURRENT STATE (COLD ARCHITECTURE INVENTORY)

**Gate 1.** What the repository actually did before this mission, read from source. Every claim
cites a file. Where a thing does not exist, this says so rather than describing an intention.

Branch base: `cursor/remaining-families-closeout-cb29` @ `5699569c051e93f5ec03aac18294cbdf0888ce53`
(`origin/main` @ `fd9094994aa2a63fdcea49f24b2435300a7b49a4`, behind 0).

---

## 0. The gap this inventory was written to size

`app/lib/quickBusiness/quickBusinessRegistry.ts` named the **Full** package key for all four Quick
Business categories: `servicios_base_monthly`, `restaurantes_base_monthly`, `autos_dealer_monthly`,
`br_agent_monthly` — each $399/mo in `revenuePricingMatrix.ts`. Quick's price display reads the
amount from the matrix at render time (`QuickBusinessReviewStep.tsx`, `QuickBusinessChooser.tsx`),
so Quick was showing, and would have sold, the full product at the full price.

There was **no** Simple/Full distinction anywhere: a repository-wide search for
`businessAccessLevel`, `business_access_level`, `accessLevel` and `AccessLevel` returned no files.

---

## 1. What controls public visibility

`app/lib/listingPlans/packageEntitlements.ts` — the **print/visibility** model. A
`PackageEntitlementTier` (`premium | full_page | half_page | quarter_page | classified_print |
digital_only | none | unknown`) maps to a fixed benefit set: `destacados_module`,
`results_priority`, `classified_listing`, `republish_access`, `boost_access`,
`auto_refresh_access`, `print_advertiser_badge`, `verified_review_eligible`, `concierge_eligible`,
plus a `visibilityBucket` consumed by ranking.

This model is about **where a listing appears**, not about which product features its owner may
use. It explicitly refuses to infer tier from account state: "Not used as entitlement truth:
`profiles.membership_tier`, `business_lite`, `business_premium`, `account_type`, Stripe / payment
status" (`docs/package-entitlement-model.md` §7).

## 2. What controls the Business Hub

**There is no customer-facing Business Hub product to gate.** "Business Hub" in this repository is
either a **public presentation** concept (for example
`app/(site)/clasificados/ofertas-locales/OfertasLocalesBusinessHubLiteCard.tsx`, and the Autos /
Bienes preview hub cards) or the **admin** Executive Hub (`app/admin/(dashboard)/team/executive-hub/`,
`app/admin/_lib/executiveHubStore.ts`). Neither is an entitled customer feature.

Consequence for the access model: `business_hub` is declared as a FULL-only capability so the
contract is complete and future Hub work inherits the gate, but there is no existing customer
surface to retro-gate today. Claiming otherwise would be inventing enforcement.

## 3. What controls business tools

`/dashboard/business-tools` and `app/lib/business/**` are the **Business Identity ("Negocio")**
product, and they are gated by something entirely separate from package entitlements:

- `app/lib/business/featureFlag.ts` reads `business_identity_flags` and resolves a pilot tier
  (`global` / `preview` / `unavailable`).
- `app/lib/business/access.ts` then resolves membership → business → drafts → eligibility, in that
  fixed order (`accessLogic.ts`).
- `app/lib/business/eligibility.ts` **explicitly excludes** `listing_package_entitlements` as an
  eligibility signal: "Its `package_tier` values … are print/digital ad-package sizes, not a
  business/personal distinction. Treating an active row here as eligibility evidence would be
  inventing a qualifying value that the schema does not support."

So Business Tools is **not** sold as part of the $399 Full package today. It is a flagged pilot on
its own membership model. Wiring business access level into it would either hand Full customers a
product they have not bought or cut off pilot users — both wrong. It is recorded here as an
orthogonal system and left alone.

Separately and confusingly, `resolveBusinessToolsAccess` is the name of **two different**
functions: the capability resolver in `app/lib/listingPlans/categoryCommercialPlan.ts`, and the
Business Identity resolver in `app/lib/business/access.ts`. Only the first is package-driven.

## 4. What controls analytics

`app/api/dashboard/analytics/listing/route.ts` (per listing) and
`app/api/dashboard/analytics/summary/route.ts` (account rollup), backed by
`app/lib/analytics/server/fetchOwnerDashboardAnalyticsServer.ts`.

Before this mission the per-listing route checked **authentication** (`getBearerUserId`) and
**ownership** (`resolved.identity.ownerUserId !== ownerId`) and nothing else. Any owner of any
listing received analytics. There was no entitlement check of any kind — which is exactly why
Simple would have received analytics for free.

The **summary** route is account-scoped and serves every seller, including free classified users.
It is a universal seller rollup rather than the business analytics product.

## 5. What controls inventory allowances

Declared as prose on the package (`includedInventory`, `addOnInventory` in
`revenuePricingMatrix.ts`: "10 active vehicles", "+10 vehicles via
`autos_dealer_inventory_pack_monthly`"), with the purchasable expansion modelled as its own
package (`autos_dealer_inventory_pack_monthly`, `br_inventory_pack_monthly`) and read back through
`addonEntitlementReader.ts` / `capacityActivationRpc.ts`.

The allowance is therefore tied to **which packages a listing holds**, which is why the Quick
packages declare a smaller `includedInventory` and `addOnInventory: null` rather than needing new
enforcement code.

## 6. What controls customer dashboards

`app/(site)/dashboard/**` — `mis-anuncios`, per-category (`servicios`, `restaurantes`,
`ofertas-locales`, `empleos`, `viajes`), plus `analiticas` / `analytics`, `business-tools`,
`mensajes`, `notificaciones`, `perfil`. The authenticated entitlement API
`app/api/dashboard/listing-package-entitlements/route.ts` is the canonical read: it authenticates,
**verifies owner authorization server-side** with `resolveOwnedListingIdentityKeys` (noting that it
uses the admin client, "so RLS is never a safety net here"), and returns placement badges, add-on
status, Revenue OS proof, subscription state, and `capabilities` for capability-model categories.

## 7. Is any access still inferred from old account-level tiers?

For the **commercial** model, no. `categoryCommercialPlan.ts` states it "never reads
`leonix_placement_entitlements`, account-tier tables, or verification tables — commercial state
only", and the entitlement doc forbids `membership_tier` / `account_type` as truth.

The one account-level tier still in play is the **Business Identity pilot flag**
(`business_identity_flags`), which gates the separate Negocio product described in §3. It is a
rollout flag, not a commercial tier.

`resolvePackageEntitlement` also gates `en-venta` with the note "En Venta uses Free/Pro ideology",
but that is a **category exclusion**, not an access grant.

## 8. Does package entitlement already support capability grants?

**Yes — and this is the single most important finding.**

`RevenuePackageDefinition.capabilities?: string[]` already exists
(`revenuePricingMatrix.ts`), is declared per package (today only `coupons_offers`, on
`servicios_base_monthly` and `restaurantes_base_monthly`), and is resolved by the pure policy
`decideCategoryListingPlan` (`categoryCommercialPlanPolicy.ts`) behind the impure
`resolveCategoryListingPlan` / `resolveBusinessToolsAccess` (`categoryCommercialPlan.ts`).

That resolver already handles the hard parts: multiple simultaneously-live rows per listing, a
stale `active` row past its own `ends_at` not counting as live, grace keeping paid access usable
while `suspended` blocks it, and a canonical base package beating a legacy add-on.

The access model reuses this machinery rather than building beside it.

## 9. Where print packages attach digital benefits

Two places, and they are different in kind:

1. **Visibility** — `getPackageEntitlementBenefits` (§1) plus `printDigitalVisibilityRank.ts` and
   `magazinePlacementPriority.ts`. This is ranking.
2. **One narrow capability** — `qualifiesForLegacyPrintIncludedFallback`
   (`categoryCommercialPlanPolicy.ts`) grants the coupons capability when `grant_source ===
   "print_included"` **and** `package_tier` is a qualifying print tier **and** the category is
   servicios or restaurantes. Category alone is deliberately never sufficient.

There was **no** general "print tier grants a digital product level" bridge. That is what Gate 5
adds, and it is kept separate from (1) so ranking is unaffected.

Print entitlement rows are created by the admin generator
(`/admin/workspace/package-entitlements`, `app/admin/_lib/buildEntitlementPricingMetadata.ts`);
Stripe-purchased digital rows are written by `revenueEntitlementFulfillment.ts`, which sets
`package_tier: "digital_only"` and the real `package_key`.

## 10. How upgrades could preserve listing identity

The entitlement row already references the canonical listing by `listing_id` and carries
`package_key` — and access is **derived** from those rows at read time rather than stored on the
listing. So an upgrade can be nothing more than a different `package_key` on a new entitlement row
for the same listing. No listing copy, no slug change, no media move. This is what made a
zero-migration upgrade contract possible (Gate 10).

---

## 11. Schema reality (why no migration was needed)

`listing_package_entitlements` already carries everything the access model reads: `category`,
`listing_source`, `listing_id`, `package_key`, `package_tier`, `grant_source`, `status`,
`starts_at`, `ends_at`, `billing_mode`, `payment_record_id`, plus a free-form `metadata` JSON
column already used for `sales_rep_id`, `pricing`, `promo_rule`, `print_placement` and more
(`docs/package-entitlement-model.md` §9, §13, §14).

Business access level is derived from `package_key` and `package_tier`, both existing columns, so
nothing needed to be stored and no migration was required. `metadata` was available as a fallback
and was not needed.

---

## 12. Stripe reality (why no Stripe product was needed)

`revenueStripe.ts` builds line items with inline `price_data` (`unit_amount` from the package
definition, `recurring: { interval: "month" }` for subscriptions). There are no pre-created Stripe
price ids to mint, so adding a package to the matrix is sufficient to make it purchasable at the
right price in the right mode.

---

## 13. Open owner decisions recorded, not guessed

| Item | State | Why |
|---|---|---|
| **Comida Local tier** | Deferred; `comida_local_base_monthly` stays $129/mo, declares no access level | Gate 7: no owner lock exists, and the flow is already certified. Declaring nothing preserves today's behaviour exactly. |
| **Viajes `viajes_business_monthly`** | Deferred; declares no access level | It is $399/mo but is not one of the four Quick Business categories named by the owner, and its price is itself an unresolved owner decision in the matrix. |
| **Quick promo eligibility** | `promoEligible: false` on all four Quick packages | The brief says not to invent promo eligibility. No source supports Quick promo eligibility, and a discount is easier to turn on later than to take back. |
| **Quick print comp / placement eligibility** | `printCompEligible: false`, `placementEligible: false` | Same reasoning: these are paid visibility benefits of the Full and print products; granting them to the cheapest tier would be inventing a giveaway. |
| **Account analytics rollup for Simple** | Not gated | `/api/dashboard/analytics/summary` serves every seller including free classified users; gating it would leave a paying Simple customer with less than a free one. Flagged for the owner rather than changed. |
