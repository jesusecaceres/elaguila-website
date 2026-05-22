# Package Entitlement Model

**Gate G1.6A — code + docs foundation · Gate G1.6B — Admin generator + DB**

This document defines Leonix / El Águila **package entitlements**: what a print or digital package grants to a **listing** in a **category** for a **contract duration**. It is the shared source of truth for future Admin UI, Supabase tables, ranking (G1), and promo-code workflows.

**Code:** `app/lib/listingPlans/packageEntitlements.ts`

**Related:** [`print-to-digital-visibility-policy.md`](./print-to-digital-visibility-policy.md) (G0), [`printDigitalVisibilityRank.ts`](../app/lib/listingPlans/printDigitalVisibilityRank.ts) (G1), Gate G1.5 audit, **Admin generator** [`/admin/workspace/package-entitlements`](../app/admin/(dashboard)/workspace/package-entitlements/page.tsx) (G1.6B), **pricing / promo / sales / commission model** [`pricing-promo-code-sales-model.md`](./pricing-promo-code-sales-model.md) (G1.6D — `packagePricingRules.ts`).

---

## 1. Promo code vs package entitlement

| Concept | Meaning |
|---------|---------|
| **Promo code** | Discount or payment benefit at checkout or invoicing. Reduces price; does **not** by itself define visibility. |
| **Package entitlement** | Visibility and access benefit attached to a **listing**, **category**, **package tier**, and **duration**. Drives Destacados modules, results priority, Republish/Boost access, and badges. |

A future Admin tool may **generate** a code, but that code must **create or connect to** a package entitlement record. Ranking and public surfaces must read **entitlements**, not guess from `membership_tier`, Stripe status, or random `promoted` flags alone.

---

## 2. Package tiers

| Tier | Print shape (summary) | Primary digital posture |
|------|------------------------|-------------------------|
| **premium** | Cover / back cover / outside premium (~$2k/mo class, ~8–10 inventory) | Destacados / Patrocinado **modules** |
| **full_page** | Full-page advertiser | **Priority** in matching category results after search/filter |
| **half_page** | Half-page advertiser | Print pool + **classified listing** + **Republish** + **Boost** |
| **quarter_page** | Quarter-page advertiser | Print pool + classified listing; **limited Republish** per policy |
| **classified_print** | Smaller print unit | Basic digital listing + print pool |
| **digital_only** | No print package | Digital tools only (Republish, Boost, Auto Refresh) — below print priority |
| **none** | No entitlement on row | Organic / basic |
| **unknown** | Unrecognized tier value | Defensive unknown |

---

## 3. Benefits by package

Benefit keys (see `PackageEntitlementBenefit` in code):

| Benefit | Premium | Full-page | Half-page | Quarter-page | Classified print | Digital-only |
|---------|---------|-----------|-----------|--------------|------------------|--------------|
| `destacados_module` | yes | no | no | no | no | no |
| `results_priority` | no | yes | no | no | no | no |
| `classified_listing` | yes | yes | yes | yes | yes | no |
| `republish_access` | no | yes | yes | yes (policy) | no | yes |
| `boost_access` | no | yes | yes | no (default) | no | yes |
| `auto_refresh_access` | no | no | no | no | no | yes |
| `print_advertiser_badge` | yes | yes | yes | yes | yes | no |
| `concierge_eligible` | yes | no | no | no | no | no |

**Half-page** explicitly includes **Republish / Refrescado** and **Boost / Impulsado** access. It does **not** grant Premium Destacados or full-page results priority by default.

**Premium** grants Destacados module eligibility and does **not** force normal results priority by default.

**Full-page** grants results priority and outranks half/quarter/classified, digital-only tools, and organic within the matching result set (after search/filter).

---

## 4. Visibility bucket mapping

`resolvePackageEntitlement` sets `visibilityBucket` aligned with Gate G1:

- `premium` → `premium_destacado_module`
- `full_page` → `full_page_print_priority`
- `half_page`, `quarter_page`, `classified_print` → `print_advertiser_pool`
- `digital_only` → `digital_featured` (Republish usage may still map to `republished` in rank helper when only republish metadata exists)
- `none` → `organic`

Future ranking should prefer **entitlement resolution** over inferring tier from legacy `promoted` / `package_tier` alone.

---

## 5. Duration and expiration

Entitlements are **contract-based**:

- `startsAt` / `endsAt` (or future DB columns) define the active window.
- `isPackageEntitlementActive` returns `true` / `false` / `null` (unknown dates).
- Expired entitlements must not grant visibility; warnings are surfaced instead of crashing.

Optional row fields read defensively today: `starts_at`, `ends_at`, `sponsored_until`, `featured_until`.

---

## 6. Category and listing attachment

V1 categories: **servicios**, **restaurantes**, **autos**, **bienes-raices**, **rentas**.

Excluded / deferred:

- **en-venta** → separate Free/Pro model (`separate_model`)
- **clases**, **comunidad** → not client-ready (`deferred`)
- **empleos**, **viajes** → separate / staged model (`separate_model`)

Each entitlement is tied to a **category** and optional **listing row**. Pre-ad grants may have `listing_id` null until attach. `requiresMatchingCategoryFirst: true` — search/filter must match before visibility benefits apply in public sort (after listing is attached).

---

## 7. Defensive field reads (no schema in G1.6A)

The resolver may read optional listing fields if present:

`package_entitlement_tier`, `print_package_tier`, `package_tier`, `digital_visibility_tier`, `starts_at`, `ends_at`, `sponsored_until`, `featured_until`, `entitlement_code`, `contract_code`, `promo_code` (reference only).

Missing fields → `tier: none` or `unknown` + **warnings**, not crashes.

**Not used as entitlement truth:** `profiles.membership_tier`, `business_lite`, `business_premium`, `account_type`, Stripe / payment status.

---

## 8. Gate G1.6B — Admin Package Entitlement Generator

**URL:** `/admin/workspace/package-entitlements` (Workspace nav: **Package entitlements** / **Paquetes**).

**What it does:**

- Creates rows in `public.listing_package_entitlements` with tier, category, `listing_source`, contract `starts_at` / `ends_at`, optional `contract_code`, and `entitlement_code` (auto `LX-ENT-…` when blank).
- **`listing_id` is optional at creation** (Gate G1.6B-FIX1): sales can issue a code **before** the customer publishes an ad. Admin shows **Pending listing** / **Unassigned listing** until attached.
- A **future redemption/attach gate** will connect the entitlement code to the customer listing. Until then the row is trackable in Admin but must not drive public sorting.
- Snapshots `benefits` from `getPackageEntitlementBenefits` at grant time.
- Sets `metadata.source = admin_manual` and nullable Stripe Checkout placeholders (`stripe_checkout_session_id`, `stripe_payment_intent_id`, `stripe_customer_id`, `stripe_subscription_id`, `payment_status`) for a future **Stripe Checkout** path (preferred over Payment Links).
- Lists recent entitlements and supports **revoke** (status `revoked`, `revoked_at` set — no hard delete).
- Soft warning when active Premium count nears policy cap (~10).

**What it does not do:**

- Charge customers or call Stripe.
- Change public Servicios/homepage/results sorting (category gates G2+).
- Replace `/admin/workspace/cupones` (marketing CMS only).

**Promo vs entitlement:** Staff may call this a “code generator,” but the **entitlement row** is what grants visibility. A discount promo alone is insufficient.

---

## 9. Gate G1.6C — Owner tracker (search, manage, attribution)

**URL:** same `/admin/workspace/package-entitlements` with **Buscar y filtrar** above the tracker list.

**Pre-ad flow (unchanged):**

1. Sales/Admin creates entitlement with optional `listing_id` → customer receives `LX-ENT-…` code.
2. Customer publishes ad later.
3. Staff **attach listing ID** on the tracker row (Admin only — does **not** activate public sorting yet).
4. Future **redemption/attach gate** may automate customer self-service.

**Tracker capabilities:**

| Action | Behavior |
|--------|----------|
| Search/filter | Code, contract, business, customer, listing ID, sales rep fields, category, tier, effective status |
| Extend | Updates `ends_at` + recalculated `status` only (tier/benefits unchanged) |
| Attach listing | Sets `listing_id`, `metadata.listing_attachment = attached` |
| Revoke | Soft: `status = revoked`, `revoked_at` set, row retained |

**Sales rep / employee attribution (metadata):**

- `metadata.sales_rep_id`
- `metadata.sales_rep_name`

Used for a future **sales rep dashboard** and **commission** accrual **after payment clears** (not in G1.6C).

**Creator snapshot (metadata):**

- `metadata.creator_name` (default `"Admin"`)
- `metadata.creator_role` (`"admin"`)
- `metadata.creator_email` (`null` until staff auth exposes email)

**Stripe Checkout (future):** `metadata` already reserves session/intent/customer/subscription/`payment_status`. Webhook-created entitlements should set `source = stripe_checkout` in a later gate.

**Not in G1.6C:** public redemption, public sorting, pricing table, commission ledger, sales rep portal.

---

## 10. Gate G1.6A scope (foundation)

**Included:** resolver helpers + this document.

**Not included in G1.6A alone:** DB, Admin UI, public ranking (delivered in G1.6B for Admin only).

---

## 11. Ranking integration (later)

**Gate G2+** should call `resolvePackageEntitlement` (then `resolveListingVisibilityRank` or a thin bridge) **after** category/search filters. Do not apply G1 ranking to public Servicios until entitlements can be created and read consistently.

---

## 12. Gate G1.6D — pricing, promo rules, sales attribution, commission estimate

**Code:** `app/lib/listingPlans/packagePricingRules.ts` · **Docs:** [`pricing-promo-code-sales-model.md`](./pricing-promo-code-sales-model.md)

| Helper | Purpose |
|--------|---------|
| `getPackageBasePriceCents` / `getContractTermDiscount` | V1 monthly ladder + term discounts |
| `resolvePackagePricing` | Quoted monthly + contract total for Admin calculator (G1.6E) |
| `resolvePromoCodeRule` | Non-stackable promo capabilities by code type |
| `resolveSalesAttribution` | `sales_rep_id`, source, commission rule key |
| `estimateCommission` | Informational estimate **after payment clears** only |

Entitlement **creation** (G1.6B/C) remains separate from **price** and **discount** codes. Stripe Checkout metadata and commission ledger are future gates — not G1.6D.

Verify: `npm run verify:pricing-promo-code-sales-model`

---

## 13. Gate G1.6E — Admin pricing / promo generator preview

**Route:** `/admin/workspace/package-entitlements` · **Preview:** `PackageEntitlementSalesPreview.tsx` · **Metadata builder:** `app/admin/_lib/buildEntitlementPricingMetadata.ts`

On create, Admin selects package tier, **contract term**, and **promo/code type**, sees model-driven pricing and promo previews, then saves snapshots under `metadata.pricing`, `metadata.promo_rule`, `metadata.sales_attribution`, `metadata.commission_preview`.

Tracker rows and dashboard recent cards show contract term, final monthly, estimated total, promo type, and commission preview line when metadata exists.

**Not in G1.6E:** Stripe, public redemption, sales rep dashboard, commission payout table.

Verify: `npm run verify:admin-pricing-promo-generator-ui`
