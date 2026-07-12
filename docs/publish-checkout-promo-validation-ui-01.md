# PUBLISH-CHECKOUT-PROMO-VALIDATION-UI-01

## 1. Executive Summary

Wires **Leonix admin-created promo codes** into the shared `PublishCheckoutCheckpoint` for **Restaurantes proof category only**. Promo codes validate server-side against `leonix_promo_codes`; discounts come from **server-owned columns/metadata** (`percent_off`, `amount_off_cents`, `promo_type`) — never inferred from code text like `RESTO-LAUNCH-25`. Redemption occurs **only after successful Stripe payment webhook**.

## 2. Admin Code Created

Test code `RESTO-LAUNCH-25` may exist without discount metadata. **Do not assume 25% from the name.**

To test checkout discount:
1. Open `/admin` → **Promo Code Generator**
2. Create **RESTO-LAUNCH-25-V2** (or recreate with new admin fields):
   - Type: **Discount**
   - Discount type: **Percent off**
   - Percent off: **25**
   - Category: **restaurantes**
   - Package scope (optional): `restaurantes_base_monthly`
   - Status: **Active**

## 3. Promo Code vs Public Cupones/Ofertas

| System | Purpose |
|--------|---------|
| **Leonix promo code** | Advertiser checkout discount to Leonix (this gate) |
| **Restaurante coupon module** | Category-owned add-on (separate gate) |
| **Cupones / Ofertas Locales** | Public customer-facing offers — **not** mixed here |

## 4. Discount Source Truth

Discount amount comes from server-owned sources only:

| Source | Fields |
|--------|--------|
| DB columns | `promo_type`, `percent_off`, `amount_off_cents` |
| Metadata fallback | `metadata.discount_type`, `metadata.discount_percent`, `metadata.discount_amount_cents` |

**No fake 25%** inferred from code text. Codes without configured discount values fail validation with a clear admin-facing message.

## 5. Validation Route

`POST /api/revenue-os/promo/validate`

- Read-only — **no redemption**, no payment record, no entitlement
- Validates against `leonix_promo_codes`
- Returns `discountCents`, `totalCents`, `discountLabel` from server calculation
- Invalid: *Este código promocional no es válido para este pago.*

Implementation: `app/lib/listingPlans/revenuePromoValidation.ts` + `app/api/revenue-os/promo/validate/route.ts`

## 6. Restaurante Checkout UI

- `promoEligible: true` in `RestaurantePreviewClient`
- `PublishCheckoutCheckpoint` shows **Código promocional** / **Promo code**
- **Aplicar / Apply** calls validation route
- **Quitar / Remove** clears applied code
- Discount line appears only after successful server validation
- Total updates from server `totalCents`
- Checkout proceeds without promo when field empty

## 7. Revenue OS Checkout Revalidation

`POST /api/revenue-os/checkout` re-validates promo via `resolvePromoForCheckout` before creating Stripe session. Client Apply result is not trusted alone.

## 8. Stripe Discount/Amount Contract

Stripe Checkout session `unit_amount` = validated `finalAmountCents` (discounted). Base package price from Revenue OS matrix; discount applied server-side before session creation.

## 9. Webhook Redemption Contract

On `checkout.session.completed` (paid):
- Payment marked paid (unchanged)
- Entitlement + Restaurante listing activation (unchanged)
- Pending promo redemption → **redeemed**
- `leonix_promo_codes.redemption_count` incremented **once** (idempotent)

On expired/canceled session:
- Promo redemption → **expired** (not redeemed)
- No redemption count increment

## 10. Expired/Canceled Session Rules

`markPromoRedemptionExpiredOrCancelled` runs on checkout session expired webhook. Abandoned checkout does not consume promo.

## 11. Admin Generator Result

Admin create form now includes for Type = Discount:
- Discount type (percent / amount)
- Percent off (1–100)
- Amount off ($)
- Revenue OS package scope (optional)

Stored in `promo_type`, `percent_off`, `amount_off_cents`, `category_scope`, `package_scope`, and metadata mirror.

## 11b. Website Launch 25 checkout wiring (WEBSITE-LAUNCH-25-CHECKOUT-REDEMPTION-WIRING-01)

`website_launch_25` codes (captured via newsletter/account/dashboard signup) are now honored at eligible **website checkout** surfaces beyond Restaurantes. They are **website checkout only**, one-time, non-stackable, and never grant placement/ranking/verification/entitlement.

- Detection: `isWebsiteLaunch25Promo(row)` — `metadata.promo_family === "website_launch_25"` OR (`code_type === "newsletter"` AND `metadata.website_checkout_only`).
- Allowlist (`WEBSITE_LAUNCH_25_ALLOWLISTED_PACKAGE_KEYS`): `rentas_30d`, `empleos_job_post_paid`, `autos_privado_30d`, `restaurantes_base_monthly`, `servicios_base_monthly`. Any other package key (print/combo/manual/free/unknown) is rejected with a calm message.
- Enforcement runs in **both** the preview validation (`validatePromoForPublishCheckout`) and the checkout revalidation (`resolvePromoForCheckout`).
- Discount is still **server-owned** (`percent_off`/`amount_off_cents`/`promo_type`) — never inferred from code text.
- New surfaces reuse the shared `RevenuePromoField` (Rentas privado preview, Empleos quick + premium confirm modal, Autos privado confirm). Restaurantes and **Servicios** keep the existing `PublishCheckoutCheckpoint` promo UI with `onPromoApply` → `validateRevenuePromoForCheckout` and `promoCode` forwarded to `startRevenueCategoryCheckout`.
- **Servicios** (`servicios_base_monthly`, $399/mo): final preview checkout only — not dashboard edit, not add-on-only dashboard checkout (`servicios_offers_addon`). Newsletter opt-in at checkout uses source `servicios_checkout` (non-blocking).
- Payment record metadata records `promo_family`, `website_checkout_only`, `base_amount_cents`, `final_amount_cents`. Redemption stays **webhook-only**; abandoned/cancelled checkouts never consume the code.

## 12. Files Inspected

Admin promo manager, Revenue OS checkout/webhook/promo modules, shared checkpoint, Restaurante preview, Supabase migration references.

## 13. Files Changed

| File | Change |
|------|--------|
| `app/api/revenue-os/promo/validate/route.ts` | New read-only validation API |
| `app/lib/listingPlans/revenuePromoValidation.ts` | Publish checkout validation logic |
| `app/lib/listingPlans/revenuePromoRedemptions.ts` | Discount resolution, redemption count increment |
| `app/lib/listingPlans/revenuePaymentRecords.ts` | Promo snapshot in payment metadata |
| `app/api/revenue-os/checkout/route.ts` | Promo snapshot on payment create |
| `app/lib/listingPlans/revenueCategoryCheckoutClient.ts` | Browser validation client |
| `PublishCheckoutCheckpoint.tsx` | Promo UI + Remove |
| `RestaurantePreviewClient.tsx` | `promoEligible: true`, validation wiring |
| `app/admin/.../promo-codes/actions.ts` | Discount fields on create |
| `app/admin/.../promo-codes/page.tsx` | Discount form + list summary |
| `docs/publish-checkout-promo-validation-ui-01.md` | This document |
| `scripts/verify-publish-checkout-promo-validation-ui-01.mjs` | Verifier |

## 14. What This Gate Does Not Do

- Does not migrate Servicios, Bienes, Autos, or other categories
- Does not wire Restaurante coupon/Ofertas Locales add-on
- Does not infer discount from promo code name
- Does not redeem on Apply or checkout session creation
- No Supabase migrations added
- No Stripe live mode

## 15. Manual QA Checklist

- [ ] Admin: create RESTO-LAUNCH-25-V2 with 25% + restaurantes category
- [ ] Restaurante application → preview
- [ ] Promo field visible
- [ ] Invalid code → calm error message
- [ ] Valid code → discount line + updated total
- [ ] Confirmations still gate checkout
- [ ] Secure payment → Stripe sandbox amount matches discounted total
- [ ] Complete sandbox payment (test card only)
- [ ] Payment record paid + promo metadata
- [ ] Listing published after webhook
- [ ] Promo redemption count +1 once
- [ ] Abandoned checkout does not redeem

## 16. Next Gates

- Promo validation on additional categories (Servicios, Bienes negocio, etc.)
- STRIPE-REVENUE-OS-RESTAURANTES-COUPON-ADDON-01 (category add-on billing)

## 17. LAUNCH-25-ELIGIBLE-CHECKOUT-UX-POLISH-01 (UX continuity gate)

This gate is **UX only** — no validation, discount math, Stripe, or schema changes.
Server checkout remains the source of truth; redemption stays webhook-only.

Reusable reminder (as of Gate 18, below) is the official `LeonixLaunchCouponCard` (`variant="mini"`).
The earlier standalone `LeonixLaunch25MiniNotice` component was removed during design-system unification.

Reminders added to eligible paid surfaces:

- **Rentas privado** (`RentasPrivadoForm.tsx`): reminder banner near the top of the form. No promo input here — validation stays on the preview/confirm checkpoint.
- **Empleos paid**:
  - Selector (`EmpleosPublicarHubClient.tsx`): "Acepta código Leonix Launch 25" / "Launch 25 code eligible" badge on the paid job card only. The free job fair card is intentionally excluded.
  - Quick + premium paid forms: reminder banner near the price banner.
- **Autos privado**:
  - Selector (`PublicarAutosBranchClient.tsx`): eligibility badge on the private seller card. The dealer card shows a neutral "Business package — separate promotions" note and never claims Launch 25 eligibility.
  - Private form (`AutosPrivadoApplication.tsx`): reminder banner in the header, next to the pricing plan banner.
- **Final promo field** (`RevenuePromoField.tsx`): added a calm helper line ("Use your Leonix Launch 25 code if it applies to this checkout."). Validation/payload/totals unchanged.

Excluded (no reminder/badge): En Venta, Comunidad, free classes, Empleos job fair, Autos dealer/negocio, Bienes privado, Servicios, Ofertas Locales, Nuestros Negocios, print/combo/manual.

Verifier: `npm run verify:website-launch-25-checkout-wiring` extended with UX presence assertions.

## 18. LAUNCH-25-COUPON-DESIGN-SYSTEM-UNIFICATION-01 (one visual source of truth)

All Launch 25 UI now renders from a single component family: **`app/components/leonix/LeonixLaunchCouponCard.tsx`**. There is exactly one design and one copy source for the whole campaign.

Variants:

- `public` — full premium card (newsletter).
- `dashboard` — launch-benefit framing (dashboard home).
- `compact` — smaller full card (login signup, profile onboarding).
- `mini` — same campaign look, smaller spacing + short fine print (eligible form reminders: Rentas privado, Empleos quick + premium, Autos privado).
- `badge` — small official campaign pill for eligible selector cards (Empleos paid job card, Autos private-seller card). Rendered as a `<span>` so it can live inside `<Link>` selector cards.

Centralized copy (exact): title `Obtén tu código Leonix Launch 25` / `Get your Leonix Launch 25 code`; code label `LEONIX LAUNCH CODE`; badge pill `25% DE DESCUENTO` / `25% OFF`; eligible pill `ACEPTA CÓDIGO LEONIX LAUNCH 25` / `LAUNCH 25 CODE ELIGIBLE`; short + full fine print (excludes print/combo/free/renewals; no placement/ranking/verification claims).

Changes:

- The separate `LeonixLaunch25MiniNotice` component was **deleted**. No page defines its own Launch 25 marketing copy anymore.
- Per-page `launchBadge` copy in `EmpleosPublicarHubClient.tsx` and `autosBranchCopy.ts` was removed; those cards now render `variant="badge"`.
- Autos dealer keeps only a neutral, non-Launch-25 note (`Business package — separate promotions` / `Paquete de negocio — promociones separadas`). Empleos free job fair carries no badge.
- Props added safely: `finePrintMode` (`full` | `short` | `none`) and `showLogo`; existing `showCta` / `href` / `ctaLabel` / `className` preserved.

No backend, checkout, Stripe, or schema logic changed. Future work: do not create a second Launch 25 card or copy source — extend `LeonixLaunchCouponCard`.

## 20. LAUNCH-25-PAID-CATEGORY-ELIGIBILITY-AUDIT-01 (remaining paid categories)

Battlefield audit of remaining paid candidates. **No new allowlist keys were added in this gate** — only categories already on central Revenue OS checkout with full promo forward were confirmed READY.

### Final Launch 25 category matrix

| Category | Launch 25 status | Package key | Notes |
|----------|------------------|-------------|-------|
| Servicios base | **READY** | `servicios_base_monthly` | `PublishCheckoutCheckpoint` + `onPromoApply`; newsletter `servicios_checkout` |
| Autos privado | **READY** | `autos_privado_30d` | Preview `PublishCheckoutCheckpoint`; newsletter `autos_privado_checkout` |
| Rentas privado / negocio | **READY** | `rentas_30d` | Preview checkpoint; newsletter `rentas_checkout` |
| Empleos paid job post | **READY** | `empleos_job_post_paid` | Quick + premium preview checkpoints; newsletter `empleos_checkout` |
| Restaurantes base | **READY** | `restaurantes_base_monthly` | Preview checkpoint; newsletter `restaurantes_checkout` |
| Bienes Raíces negocio (agent) | **NOT READY / FUTURE** | `br_agent_monthly` | Revenue OS checkout exists but `promoEligible` shows deferred promo only — no `onPromoApply`, promo not forwarded to `startRevenueCategoryCheckout` |
| Bienes Raíces FSBO privado | **NOT READY / FUTURE** | `br_fsbo_45d` | Package in matrix; no central Revenue OS publish checkout wiring found |
| Ofertas Locales | **NOT READY / FUTURE** | — | No `startRevenueCategoryCheckout` publish path |
| Nuestros Negocios / Negocios Locales | **NOT READY / FUTURE** | — | No Revenue OS website checkout found |
| Autos negocio / dealer | **EXCLUDED** | `autos_dealer_monthly` | Legacy `/api/clasificados/autos/checkout`; not website Launch 25 scope |
| Autos dealer inventory pack | **EXCLUDED** | `autos_dealer_inventory_pack_monthly` | Dashboard add-on only |
| Restaurantes offers add-on | **EXCLUDED** | `restaurantes_offers_addon` | Dashboard add-on only; not base website package |
| Servicios offers add-on | **EXCLUDED** | `servicios_offers_addon` | Dashboard add-on only |
| Clases paid | **NOT READY / FUTURE** | `clases_paid_30d` | Package in matrix; no Revenue OS checkout wiring |
| Viajes business | **NOT READY / FUTURE** | `viajes_business_monthly` | No publish checkout wiring found |
| En Venta / Comunidad / Mascotas / Busco | **EXCLUDED** | `en_venta_free_v1`, `comunidad_free`, etc. | Free products |
| Empleos job fair | **EXCLUDED** | `empleos_job_fair_free` | Free |
| Print / combo / manual contracts | **EXCLUDED** | — | Business rule: never Launch 25 eligible |

### Newsletter checkbox capture (ready categories)

| Category | Checkbox at final checkout | Source label | Non-blocking |
|----------|---------------------------|--------------|--------------|
| Servicios | Yes | `servicios_checkout` | Yes |
| Autos privado | Yes | `autos_privado_checkout` | Yes |
| Rentas | Yes | `rentas_checkout` | Yes |
| Empleos paid | Yes | `empleos_checkout` | Yes |
| Restaurantes | Yes | `restaurantes_checkout` | Yes |

**Verifier:** `npm run verify:website-launch-25-checkout-wiring` (extended with forbidden allowlist keys + NOT READY guards).
