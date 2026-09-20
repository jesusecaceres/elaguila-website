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

- It does not automate the upgrade as a one-click self-service flow. The upgrade is a purchase of
  the category's existing Full package through the category's existing checkout.
- It does not downgrade Full to Simple. No automatic downgrade path exists, by design.
- It does not change any Full benefit, price, or capability.
