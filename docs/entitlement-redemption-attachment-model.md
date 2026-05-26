# Entitlement Redemption and Attachment Model

**Gate G1.6G-STACK — read model + admin attachment sync; no public sorting/Stripe**

This document defines how a **promo code** or **package entitlement** gets attached to a **listing** after the code is created, and how the **user dashboard** can safely display entitlement info.

**Code:** `app/lib/listingPlans/entitlementRedemption.ts`

**Admin sync:** `app/admin/(dashboard)/workspace/package-entitlements/actions.ts` (`attachListingToPackageEntitlementAction` → `syncPromoCodeListingIdFromEntitlement`)

**Related:** [`package-entitlement-model.md`](./package-entitlement-model.md), [`promo-code-lifecycle-model.md`](./promo-code-lifecycle-model.md), [`pricing-promo-code-sales-model.md`](./pricing-promo-code-sales-model.md)

---

## 1. Code can be created before listing exists

Admin/sales creates a package entitlement and promo code **before** the customer's listing exists. The `listing_id` on both `listing_package_entitlements` and `leonix_promo_codes` is nullable. The code is handed to the customer; the listing is attached later.

---

## 2. Attach-to-listing flow

1. Customer creates listing.
2. Admin uses "Attach listing" on `/admin/workspace/package-entitlements`.
3. `attachListingToPackageEntitlementAction` updates `listing_package_entitlements.listing_id`.
4. `syncPromoCodeListingIdFromEntitlement` best-effort updates the linked `leonix_promo_codes.listing_id` where `package_entitlement_id` matches.
5. Both rows now point to the same listing.

**Attach-to-listing is NOT payment confirmation.** Payment and Stripe Checkout are later gates.

---

## 3. Redemption status model

`resolvePromoCodeRedemptionState(input)` returns:

| Status | Meaning |
|--------|---------|
| `attachable` | Code is active and can be attached to a listing |
| `already_attached` | Code already has a listing_id |
| `expired` | Past end date |
| `revoked` | Admin revoked |
| `redeemed` | Max redemptions reached |
| `not_found` | No code provided |
| `not_active` | Draft or unknown status |
| `missing_listing` | No target listing |
| `category_mismatch` | Code category differs from listing category |
| `unknown` | Unresolvable |

---

## 4. Entitlement attachment validation

`resolveListingEntitlementAttachment(input)` checks:

- Entitlement exists
- Target listing exists
- Not revoked
- Not expired (scheduled-but-not-started is allowed with warning)
- Category matches

Returns `{ canAttach, reason, warnings }`.

---

## 5. User dashboard safe entitlement summary

`buildUserDashboardEntitlementSummary(input)` returns only **safe public-facing** info:

- Package label and tier
- Benefits list
- Expiration / status
- Code (if appropriate)
- Business name
- Warnings

**Does NOT expose sales rep ID/name or admin metadata to users:**

- Sales rep metadata is not user-visible — admin/owner only
- Internal creator / admin metadata excluded
- Commission data excluded
- Owner-only notes excluded
- Pricing internals excluded

---

## 6. User dashboard wiring

The dashboard already fetches entitlement badges via `/api/dashboard/listing-package-entitlements` for Destacado / Priority badges. The read model helper (`buildUserDashboardEntitlementSummary`) is wired when the dashboard can safely receive full entitlement rows per-listing. Until then, the badge system provides the minimum viable indicator.

**Dashboard UI wiring for full entitlement cards:** next gate after per-listing entitlement query is safe (requires owner-scoped RLS or API filter). This gate provides the helper + types.

---

## 7. Revoked/expired codes

Revoked or expired codes **must not** grant future public visibility. The read model explicitly returns `isActive: false` for these statuses. Public ranking gates must check `isActive` before granting Destacados or results priority.

---

## 8. Explicitly later gates

| Capability | Gate |
|------------|------|
| Public sorting / Servicios ranking | Category visibility gates |
| Stripe Checkout / Payment Links | G1.6I+ |
| Commission payout | After payment |
| Public redemption form | G1.6H+ |
| Public coupon marketplace | Not planned |
| Automatic redemption without guardrails | Not allowed |

---

## 9. Verification

```bash
npm run verify:entitlement-redemption-attachment
```

Manual QA:

- https://www.leonixmedia.com/admin/workspace/package-entitlements (attach listing syncs promo code)
- https://www.leonixmedia.com/admin/workspace/promo-codes
- https://www.leonixmedia.com/dashboard/mis-anuncios (badges existing; full summary helper available for next gate)
