# Leonix Pricing, Promo Code, Sales Attribution, and Commission Model

**Gate G1.6D — code + docs foundation only**

This document defines the shared **pricing ladder**, **contract term discounts**, **promo-code rules**, **sales attribution**, and **commission estimate** behavior for Leonix Print-to-Digital monetization. Future Admin pricing calculator, promo generator, sales rep dashboard, Stripe Checkout metadata, newsletter/SMS codes, and commission tracking must use the same source of truth.

**Code:** `app/lib/listingPlans/packagePricingRules.ts`

**Related:** [`package-entitlement-model.md`](./package-entitlement-model.md) (G1.6A–C entitlements), [`print-to-digital-visibility-policy.md`](./print-to-digital-visibility-policy.md) (G0 visibility).

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

## 5. Newsletter / SMS unique one-time codes (later)

- **newsletter** and **sms** promo types: `oneTimeUse: true`, `requiresSubscriberIdentity: true`.
- Future gates will generate a **unique code per subscriber email/phone**.
- Typically `canDiscountPayment: true`, `canCreatePackageEntitlement: false` unless policy changes.
- Not implemented in G1.6D — model only.

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

## 10. Admin pricing calculator (later)

Gate **G1.6E** will add Admin UI that calls `resolvePackagePricing`, `resolvePromoCodeRule`, and `resolveSalesAttribution` — no duplicate price tables in forms.

---

## 11. Verification

```bash
npm run verify:pricing-promo-code-sales-model
```

---

## 12. Gate boundaries (G1.6D)

| In scope | Out of scope |
|----------|----------------|
| Pure TS helpers | DB migrations / Supabase pricing tables |
| Docs + verify script | Stripe SDK / live payments |
| Commission **estimate** | Commission payout / ledger |
| Promo/attribution **rules** | Public redemption, checkout UI |
| Central price ladder | Public sorting / Servicios ranking |
| | Admin UI wiring (G1.6E) |
