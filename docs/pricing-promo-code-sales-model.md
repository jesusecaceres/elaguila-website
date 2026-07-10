# Leonix Pricing, Promo Code, Sales Attribution, and Commission Model

**Gate G1.6D — code + docs foundation only**

This document defines the shared **pricing ladder**, **contract term discounts**, **promo-code rules**, **sales attribution**, and **commission estimate** behavior for Leonix Print-to-Digital monetization. Future Admin pricing calculator, promo generator, sales rep dashboard, Stripe Checkout metadata, newsletter/SMS codes, and commission tracking must use the same source of truth.

**Code:** `app/lib/listingPlans/packagePricingRules.ts`

**Related:** [`package-entitlement-model.md`](./package-entitlement-model.md) (G1.6A–C entitlements), [`print-to-digital-visibility-policy.md`](./print-to-digital-visibility-policy.md) (G0 visibility), [`entitlement-redemption-attachment-model.md`](./entitlement-redemption-attachment-model.md) (G1.6G — attach-to-listing + user dashboard read model), [`stripe-payment-tracker-model.md`](./stripe-payment-tracker-model.md) (G1.6I — global payment tracker).

**Not in Gate G1.6D:** Stripe Checkout, payment processing, public redemption, public pricing page redesign, Servicios ranking, sales rep dashboard UI, commission payout ledger, Supabase pricing tables, public coupon marketplace, Admin UI wiring.

---

## 1. Package price ladder (V1)

Base **monthly** prices in USD (stored as cents in code):

| Package tier | Monthly price | Cents (`getPackageBasePriceCents`) |
|--------------|---------------|-------------------------------------|
| **premium** | $1,999/mo | 199900 |
| **full_page** | $1,199/mo | 119900 |
| **half_page** | $799/mo | 79900 |
| **quarter_page** | $499/mo | 49900 |
| **classified_print** | $399/mo | 39900 |
| **digital_only** | $399/mo baseline | 39900 |

`classified_print` maps to “Nuestros Negocios” / basic digital-style visibility. `digital_only` uses the same baseline until a separate digital-only price is defined.

Pricing can be updated centrally in `packagePricingRules.ts` — do not scatter prices in UI or Stripe metadata without syncing this model.

---

## 2. Contract term discounts (V1)

| Contract term | Term length | Discount | Notes |
|---------------|-------------|----------|-------|
| **month_to_month** | 1 month | 0% | No commitment discount |
| **3_month** | 3 months | 10% | Applied to monthly rate × term |
| **6_month** | 6 months | 15% | |
| **12_month** | 12 months | 20% | |
| **founding_partner** | 12 months (default) | 25% max | **Owner/admin approval required** |

`resolvePackagePricing(input)` returns `PricingRuleSummary`: base monthly, discounted monthly, `termMonths`, and `estimatedContractTotalCents`.

---

## 3. Promo code vs package entitlement

| Concept | Role |
|---------|------|
| **Package entitlement** | Grants visibility/access to a listing (tier, category, duration). See entitlement model. |
| **Promo / discount code** | May reduce checkout price; does not alone define visibility. |
| **Combined code (future)** | A single code string may act as entitlement handle and discount handle; the model **distinguishes** `entitlement` vs `discount` types. |

`resolvePromoCodeRule(input)` returns capabilities: `canCreatePackageEntitlement`, `canDiscountPayment`, approval flags, one-time use, etc.

---

## 4. Non-stackable promo codes

- Promo codes are **non-stackable** by default (`nonStackable: true`).
- Only **one active discount rule** should win at checkout or invoicing.
- Package entitlement + separate discount may be composed in future gates, but stacking multiple discount codes is not allowed in V1.

---

## 5. Newsletter / SMS unique one-time codes (website Launch 25)

- **newsletter** promo type: `oneTimeUse: true`, `requiresSubscriberIdentity: true`, `canDiscountPayment: true`.
- Public signup generates `website_launch_25` family codes (metadata) for **eligible website Stripe checkout only**.
- **Not eligible:** print magazine packages, print+digital combos, manual contracts, free posts, future renewals.
- Promo code never grants placement/ranking/verification — only discounts eligible checkout when redemption is wired.
- See [`newsletter-promo-code-readiness.md`](./newsletter-promo-code-readiness.md).

### 5b. Public CTA placements (Home + Digital Magazine)

- **Home / Inicio** (`/home`): `LeonixLaunchCouponCard` compact — `source=home`, `sourceCta=launch_25`.
- **Digital magazine** (`/magazine`): same card — `source=digital_magazine`, `sourceCta=launch_25`.
- Routes to `/newsletter` signup only; no print/combo/manual promise on these surfaces.

---

## 6. Sales rep attribution

`resolveSalesAttribution(input)` supports:

- `sales_rep_id`, `sales_rep_name`
- `created_by_admin`
- `source`: `admin_manual`, `sales_rep`, `newsletter_signup`, `sms_signup`, `stripe_checkout`, `owner_override`, `founding_partner`, etc.

**sales_rep** promo type requires sales rep attribution. Admin-generated entitlements may store rep metadata in `metadata` (G1.6C tracker).

**Future:** sales rep dashboard reads the same attribution keys.

---

## 7. Owner dashboard tracker direction

Gate G1.6C provides Admin package entitlement tracker/search/manage. Pricing and promo rules from G1.6D will feed:

- **Gate G1.6E** — Admin pricing / promo generator UI
- Entitlement creation with quoted price and contract term
- Audit trail linking code → rep → package → listing

---

## 8. Commission model (estimate only)

**Rules (V1 model, no payout system):**

- Commission is **not earned until payment clears** (`paid`, `cleared`, `succeeded`).
- `estimateCommission(input)` returns **informational** `estimatedCommissionCents` only — not binding payout truth.
- Eligibility depends on: package tier, contract length, discount used, cleared payment, renewal vs new sale (future).
- Month-to-month may use flat rules; contract terms may use percentage-of-contract estimates (configured in code as placeholders).

**Future:** commission tracker after Stripe/webhook confirms cleared payment; payout ledger is a later gate.

---

## 9. Stripe Checkout metadata (future)

Stripe Checkout and Payment Links are **not** implemented in G1.6D. When added, session metadata should include:

- `package_tier`, `contract_term`
- `promo_code_type`, `sales_rep_id`
- `entitlement_code` (if applicable)
- Pricing snapshot from `resolvePackagePricing` at checkout time

---

## 10. Admin pricing / promo preview (Gate G1.6E — live)

**Route:** `/admin/workspace/package-entitlements`

The create form now includes **contract term** and **promo/code type** selectors. Live previews call `packagePricingRules.ts` via `buildEntitlementPricingMetadata` and `PackageEntitlementSalesPreview`:

- **Pricing:** base monthly, discount %, final monthly, term months, estimated contract total
- **Promo:** non-stackable, one-time use, owner approval, subscriber identity, sales rep required, entitlement vs discount capabilities
- **Sales attribution:** rep ID/name, source, commission rule key
- **Commission preview:** labeled *Future commission preview* — not earned until payment clears; no payout ledger

On create, metadata stores `pricing`, `promo_rule`, `sales_attribution`, and `commission_preview` snapshots (merged with existing `sales_rep_id` / `sales_rep_name`).

**Still not in G1.6E:** Stripe Checkout, Payment Links, public redemption, commission payout, sales rep dashboard.

Verify: `npm run verify:admin-pricing-promo-generator-ui`

---

## 10b. Gate G1.6F — Promo code lifecycle table + Admin manager

- **Table:** `public.leonix_promo_codes` — operational promo rows (status, type, dates, redemption counts, sales rep, customer email/phone, optional `package_entitlement_id`).
- **Admin:** `/admin/workspace/promo-codes` — create, list, search/filter, revoke (no hard delete). States clearly this is **not** the public Cupones CMS.
- **Linkage:** Package entitlement create best-effort upserts a matching promo row (`metadata.source = package_entitlement_generator`).
- **Still later:** public redemption, Stripe Checkout, commission payout ledger, Servicios public ranking.

See [`promo-code-lifecycle-model.md`](./promo-code-lifecycle-model.md).

Verify: `npm run verify:admin-promo-code-lifecycle`

---

## 11. Verification

```bash
npm run verify:pricing-promo-code-sales-model
npm run verify:admin-pricing-promo-generator-ui
npm run verify:admin-promo-code-lifecycle
```

---

## 11b. Website Launch 25 checkout redemption (WEBSITE-LAUNCH-25-CHECKOUT-REDEMPTION-WIRING-01)

`newsletter`-type codes in the `website_launch_25` family generate a discount usable **for website Stripe checkout only**, on the allowlisted central Revenue OS package keys `rentas_30d`, `empleos_job_post_paid`, `autos_privado_30d`, and `restaurantes_base_monthly`.

- Excluded: printed magazine packages, print+digital combos, manual invoices/contracts, free products, renewals, and any package not yet on central Revenue OS checkout.
- Discount is server-owned (`percent_off`/`amount_off_cents`); never inferred from the code text.
- Server revalidates at `POST /api/revenue-os/checkout` and charges the discounted final amount; redemption is webhook-only after payment. The code never grants placement/ranking/verification/entitlement.

## 12. Gate boundaries

| Gate | In scope | Out of scope |
|------|----------|----------------|
| **G1.6D** | Pure TS helpers, docs | Admin UI, Stripe, DB |
| **G1.6E** | Admin create previews + metadata snapshots | Stripe, payout ledger, public redemption, public sorting |
| **Launch 25 wiring** | Website checkout allowlist + shared promo field | New categories, Stripe Coupon objects, schema, webhook rebuild |
