# LEONIX QUICK — SIMPLE → FULL UPGRADE CONTRACT

**Gate 10.** What must remain true when a Simple/Quick business customer upgrades to Full.

Verifier: `scripts/verify-quick-upgrade-contract-05.ts`

---

## 1. The shape of the upgrade

Quick is **not** a different product. It is a lower entitlement level around the **same canonical
business**. An upgrade therefore changes **which package the customer pays for**, and nothing else.

```
BEFORE   listing_package_entitlements: package_key = servicios_quick_monthly   -> access = simple
AFTER    listing_package_entitlements: package_key = servicios_base_monthly    -> access = full
```

The listing row, the business row, the media, the slug and the owner are not read, not copied and
not rewritten by the upgrade. Access is **derived** from the entitlement rows at read time
(`app/lib/listingPlans/businessAccessLevel.ts`), so changing the package changes the access with no
migration of the customer's content.

---

## 2. Upgrade targets

Each category upgrades into the Full package it already sells. No new Full package was created and
no Full price changed.

| Category | Simple package (from) | Full package (to) |
|---|---|---|
| Servicios | `servicios_quick_monthly` | `servicios_base_monthly` |
| Restaurantes | `restaurantes_quick_monthly` | `restaurantes_base_monthly` |
| Autos dealer | `autos_dealer_quick_monthly` | `autos_dealer_monthly` |
| Bienes Raíces agent | `br_agent_quick_monthly` | `br_agent_monthly` |

The pairing lives in exactly one place, `BUSINESS_CATEGORY_PACKAGE_PAIR`
(`app/lib/listingPlans/businessAccessLevel.ts`), read by `upgradeTargetPackageKey()`. Nothing else
may pair these keys, so an upgrade cannot drift onto the wrong package.

---

## 3. What is preserved

Every item below is preserved **because the upgrade does not touch it**, not because something
copies it across.

| Preserved | Why it survives |
|---|---|
| **listing id** | The canonical listing row is never re-created. The entitlement row references it by `listing_id`; only the entitlement changes. |
| **slug** | Owned by the canonical listing row, which is untouched. |
| **public URL** | Derived from the canonical slug and category — the same public detail page before and after. |
| **media** | Stored against the canonical listing; the entitlement layer never reads or writes media. |
| **owner / customer ownership** | `owner_user_id` lives on the canonical listing row. The upgrade neither reads nor writes it. |
| **business record** | There is only one business record. Quick has no business table, no second listing type and no public product of its own. |
| **analytics history** | Keyed to the canonical listing identity (`buildAnalyticsKeySet`), so history accumulated while on Simple is visible once Full unlocks the analytics capability. |
| **sales attribution** | Carried on the entitlement row's `metadata`, which the existing Revenue OS fulfilment writes. |

No staff member re-creates the customer, and there is no "migrate to Full" data step.

---

## 3B. How the customer actually reaches it

The upgrade is a **purchase of the category's existing Full package for the listing the owner
already has**. It is deliberately not a fresh application: reopening the public intake would start a
second listing, and the whole contract is that the customer keeps the one they have.

**The offer.** Which base package a listing should be sold right now is decided server-side, from
state the server already owns, by `decideBusinessBasePlanOffer()`
(`app/lib/listingPlans/businessBasePlanOfferPolicy.ts`):

| Listing state | Mode | What is offered |
|---|---|---|
| Holds the Full package | `settled` | Nothing. An upgrade is never offered twice. |
| Holds the Quick package | `upgrade` | `upgradeTargetPackageKey(category)` — the category's existing Full package. |
| Holds nothing, a base checkout is unresolved in `leonix_payment_records` | `resume` | **The same package that checkout was started for.** A $99 customer who abandoned Stripe is never re-offered at the Full price. |
| Holds nothing, nothing in flight | `new` | Nothing. The caller keeps its own default (a fresh application's Quick/Full marker). |

The fetch side (`businessBasePlanOffer.ts`) verifies that the caller owns the listing before it
answers, and fails closed to `new` on every unknown — a wrong owner, an unreadable table, a category
outside the split. `GET /api/revenue-os/business-base-plan` exposes it read-only to owner surfaces,
behind bearer auth, with the price read from the same server matrix the checkout charges from.

**The entry points.** One shared starter,
`startBusinessSimpleToFullUpgradeCheckout()`
(`app/(site)/dashboard/lib/businessSimpleToFullUpgradeCheckout.ts`), shaped exactly like the
dashboard add-on checkouts that already exist. It buys a package for a listing that already exists
through the same `/api/revenue-os/checkout`, with **no content save, no status change and no
republish** — which is what makes the upgrade identity-preserving by construction. The caller never
chooses the package: it is read from `upgradeTargetPackageKey()`.

| Category | Owner surface carrying the CTA |
|---|---|
| Servicios | `/dashboard/servicios` — specialized tools group |
| Restaurantes | `/dashboard/restaurantes` — specialized tools group |
| Autos dealer | `AutosDealerInventoryDashboardSection` — dealer parent's owner tools |
| Bienes Raíces negocio | `LeonixRealEstateListingManageCard` → `BusinessSimpleToFullUpgradePanel` |

Every one of them is gated by `businessUpgradeOfferedForHeldPackageKey()`, reading the base package
key the **server** resolved for that row, so the CTA cannot appear for a Full listing or for a
listing with no base package.

**The one relaxation.** An in-place upgrade must not run the first-purchase machinery. A live
listing pushed back to `pending_payment` would take a paying customer's ad offline in order to
charge them more, and the Autos "not payable status" pre-flight was written for drafts.
`isBusinessBaseUpgradeInPlace()` answers that question server-side — it returns true only for the
category's own Full target bought for a listing the entitlement table resolves as already holding
SIMPLE — and `app/api/revenue-os/checkout/route.ts` skips exactly those two steps when it does.
Nothing in the request can set that flag.

---

## 4. Never downgrade

The resolver takes the **highest** live grant
(`maxBusinessAccessLevel`, and grants sorted highest-first in `decideBusinessAccess`). Two
consequences:

1. **During the upgrade**, a customer may briefly hold both a live Quick row and a live Full row.
   They resolve to `full`, never `simple`. The old row can expire on its own schedule.
2. **A print bundle can only add.** A quarter-page advertiser who also buys the Full digital
   package is `full`, not `simple`.

Nothing in this model lowers a customer's level. A level only drops when the grants behind it stop
being live — an expired `ends_at`, or a `suspended` subscription — which is the pre-existing
lifecycle, not an upgrade action.

---

## 5. Billing correctness

Both the Simple and the Full package of every category are members of
`REVENUE_BASE_ENTITLEMENT_GUARD_PACKAGE_KEYS`
(`app/lib/listingPlans/revenueActiveEntitlementGuard.ts`). That guard is the server-side answer to
"does this customer actually need to be charged again?", read from the real entitlement table. If
the Quick packages were omitted, a Quick customer would be re-charged on every edit, and an
upgrading customer could be charged twice.

Pricing stays server-authoritative throughout: `validateRevenueCheckoutRequest` prices the checkout
from the matrix definition, and Stripe line items are built with inline `price_data`, so no Stripe
product or price id exists to drift.

---

## 6. What this contract does NOT do

- It does not grant Full on click. The CTA opens the category's existing Revenue OS checkout; the
  entitlement is granted by the verified Stripe webhook, exactly as a first purchase is.
- It does not downgrade Full to Simple. No automatic downgrade path exists, by design.
- It does not change any Full benefit, price, or capability.
