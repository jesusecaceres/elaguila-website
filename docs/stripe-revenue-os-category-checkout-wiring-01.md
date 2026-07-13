# STRIPE-REVENUE-OS-CATEGORY-CHECKOUT-WIRING-01

Gate: wire first category publish/payment CTAs into central Leonix Revenue OS Checkout.  
Date: 2026-06-30  
Mode: **sandbox / test Stripe only** — no live Stripe mode, no client-side activation.

## 1. Executive Summary

Revenue OS Checkout (`POST /api/revenue-os/checkout`) and webhook fulfillment were already production-proven in prior gates. This gate connects **three initial categories** to that central route with correct package keys, metadata, return paths, and guardrails:

| Category | Package key | Price |
|----------|-------------|-------|
| Rentas privado | `rentas_30d` | $24.99 / 30 days |
| Empleos regular paid job post (quick + premium) | `empleos_job_post_paid` | $24.99 / 30 days |
| Autos privado | `autos_privado_30d` | $24.99 / 30 days |

**Not wired in this gate:** Restaurantes, Servicios, Bienes Raíces, Viajes, Clases, Comunidad, En Venta Pro, Autos negocio/dealer, Empleos job fair.

## 2. Repo Baseline

At gate start:

```text
git status --short   → clean (no output)
git diff --name-only → clean
git diff --cached --name-only → clean
```

No `.env` edits. No migrations added. Checkout/webhook foundation files unchanged.

## 3. Category Scope

**In scope (wired):**

- Rentas privado preview publish CTA
- Empleos quick + premium paid job post confirm modal
- Autos privado confirm/pay CTA (stripe mode only)

**Explicitly deferred:**

- Rentas negocio
- Empleos job fair (`empleos_job_fair_free`)
- Autos negocio / dealer inventory
- All other Revenue OS matrix categories

## 4. Rentas Checkout Wiring

**Entry:** `app/(site)/clasificados/rentas/preview/privado/components/RentasPrivadoPreviewClient.tsx`

**Flow:**

1. User completes preview gate and clicks **Continuar al pago seguro** / **Continue to secure payment**.
2. Listing saved via `publishLeonixListingFromRentasPrivadoDraft` with `activationMode: "pending_payment"` (not live until webhook entitlement).
3. `startRevenueCategoryCheckout` → `POST /api/revenue-os/checkout` with:
   - `category: rentas`
   - `packageKey: rentas_30d`
   - `listingId` from saved row
   - `leonixAdId` when available from `listings.leonix_ad_id`
   - `returnPath: /clasificados/rentas`
4. Browser redirects to Stripe `checkoutUrl` from API response.
5. No local paid badge. No `?published=1` redirect before payment.

## 5. Empleos Checkout Wiring

**Entry:** `EmpleoQuickApplicationClient.tsx`, `EmpleoPremiumApplicationClient.tsx`

**Flow:**

1. User confirms modal → **Pagar y publicar empleo** / **Pay and publish job post**.
2. `saveEmpleosDraftAndStartPaidJobCheckout` saves envelope as **draft** (not live publish).
3. Central checkout with `empleos` / `empleos_job_post_paid`, `returnPath: /clasificados/empleos`.
4. Redirect to Stripe checkout URL.

**Copy:** Bilingual calm messaging; loading **Creando pago seguro…** / **Creating secure checkout…**.

## 6. Autos Privado Checkout Wiring

**Entry:** `AutosPublishConfirmCore.tsx` when `lane === "privado"` and `publishConfirmMode === "stripe"`.

**Flow:**

1. Existing draft create/sync unchanged.
2. Pay CTA calls Revenue OS checkout (not `/api/clasificados/autos/checkout`) with `autos` / `autos_privado_30d`.
3. `leonixAdId` fetched from owner listing GET when available.
4. `returnPath: /clasificados/autos`.

**QA bypass paths** (internal/test) still use legacy autos checkout route — negocio lane untouched.

## 7. Job Fair Non-Stripe Rule

`EmpleoFeriaApplicationClient.tsx` **unchanged**. Job fair continues free publish via `/api/clasificados/empleos/listings` with `mode: "publish"`. It must **never** call `/api/revenue-os/checkout`. Package `empleos_job_fair_free` is rejected at checkout API.

## 8. Autos Negocio Deferred Rule

`AutosPublishConfirmCore` negocio/dealer/inventory-add paths still call `/api/clasificados/autos/checkout`. No dealer inventory drawer, VIN, or bundle changes in this gate.

## 9. Success/Cancel Route Contract

Central checkout (unchanged) generates:

- Success: `/revenue-os/pago/exito?session_id={CHECKOUT_SESSION_ID}&category=…&package_key=…&lang=…&return_to=…`
- Cancel: `/revenue-os/pago/cancelado?category=…&package_key=…&listing_id=…&lang=…`

Success page is **lookup-only** (`lookupRevenuePaymentProof`). Cancel page is honest (no activation implied). Category `returnPath` passed as `return_to` on success URL.

Set `NEXT_PUBLIC_SITE_URL=https://leonixmedia.com` in production to avoid preview SSO redirect issues (documented in sandbox E2E gate).

## 10. Account Plan vs Listing/Ad Plan Rule

- **Account plan** (user subscription tier) is separate from listing/ad plan.
- **Listing/ad plan** is category + package-specific (`rentas_30d`, `empleos_job_post_paid`, `autos_privado_30d`).
- **Package key** identifies what was purchased or granted.
- **Entitlement** (webhook-only) decides active paid access.
- No fake paid status, entitlement, or placement from the client.

## 11. Security Rules

- No Stripe secrets in browser or docs.
- Client helper calls `POST /api/revenue-os/checkout` only.
- No client-side entitlement or payment activation.
- No raw JSON/technical errors shown to users.
- Bearer auth forwarded when session exists.

## 12. Manual QA Checklist

- [ ] Rentas privado preview CTA starts central Checkout with `rentas_30d`
- [ ] Empleos quick/premium paid job post starts Checkout with `empleos_job_post_paid`
- [ ] Empleos job fair does **not** start Checkout
- [ ] Autos privado starts Checkout with `autos_privado_30d`
- [ ] Autos negocio/dealer path unchanged (legacy autos checkout)
- [ ] Success page shows lookup-only paid state after webhook
- [ ] Cancel page does not imply activation
- [ ] Dashboard/admin paid state remains entitlement-backed
- [ ] Free package rejection still passes (`empleos_job_fair_free`, `comunidad_free`)
- [ ] Prior Revenue OS verifiers pass
- [ ] No secrets exposed in UI/docs/scripts

## 13. What This Gate Does Not Do

- Does not rebuild Checkout or webhook
- Does not wire every category
- Does not switch to live Stripe mode
- Does not create fake paid status, analytics, placement, or promo redemption
- Does not activate entitlements from the client
- Does not modify Supabase schema

## 14. Next Gate Recommendation

**STRIPE-REVENUE-OS-CATEGORY-CHECKOUT-WIRING-02** — extend pattern to next batch (e.g. Bienes Raíces FSBO, Servicios base) after manual sandbox QA on these three categories.

## 15. Final Recommendation

This gate proves a **safe repeatable pattern**: save listing data → central Revenue OS Checkout → webhook-only activation → lookup-only success UI. Ready for owner sandbox manual QA on Rentas, Empleos paid job, and Autos privado before wiring additional categories.

## Shared helpers

| File | Role |
|------|------|
| `app/lib/listingPlans/revenueCategoryCheckoutPayload.ts` | Package keys, return paths, request body builder |
| `app/lib/listingPlans/revenueCategoryCheckoutClient.ts` | Browser `startRevenueCategoryCheckout` |
| `app/(site)/publicar/empleos/shared/publish/empleosRevenueCheckout.ts` | Empleos draft save + checkout orchestration |

## 16. Website Launch 25 promo on these categories (WEBSITE-LAUNCH-25-CHECKOUT-REDEMPTION-WIRING-01)

The three wired categories (Rentas privado, Empleos paid job post, Autos privado) plus the existing Restaurantes proof checkout now accept **`website_launch_25`** promo codes:

- Codes are captured via newsletter/account/dashboard signup and are **website checkout only**. They apply only to the allowlisted package keys `rentas_30d`, `empleos_job_post_paid`, `autos_privado_30d`, `restaurantes_base_monthly`.
- They do **not** apply to print/combo/manual/free/renewal/unknown products, and never grant placement, ranking, verification, or entitlement.
- The applied code is captured client-side (shared `RevenuePromoField`, or `PublishCheckoutCheckpoint` for Restaurantes), forwarded to `startRevenueCategoryCheckout` → `POST /api/revenue-os/checkout`, which **revalidates server-side** and uses the server `finalAmountCents` for the Stripe session.
- Redemption is **webhook-only** after a successful paid session; abandoned/cancelled checkouts do not consume the code.
- Empleos **job fair (free)** and Autos **negocio/dealer** legacy checkout are intentionally untouched — no promo field is rendered there.

## 17. Launch 25 checkout UX polish (LAUNCH-25-ELIGIBLE-CHECKOUT-UX-POLISH-01)

UX continuity pass over the same eligible surfaces. No backend/validation/discount/Stripe/schema changes.

- Shared reminder: `app/components/leonix/LeonixLaunchCouponCard.tsx` (`variant="mini"`). (The earlier standalone `LeonixLaunch25MiniNotice` was removed during design-system unification — see section 18.)
- Rentas privado, Empleos quick+premium paid forms, and Autos privado form now show the reminder near their top/price area.
- Selector pages: paid Empleos job card and Autos private-seller card show a Launch 25 eligibility badge. The free job fair and the Autos dealer card are excluded (dealer shows a neutral "separate promotions" note).
- Final `RevenuePromoField` gained a calm helper line only.
- Server checkout remains the source of truth; redemption stays webhook-only.

## 18. Launch 25 design-system unification (LAUNCH-25-COUPON-DESIGN-SYSTEM-UNIFICATION-01)

Every Launch 25 placement now renders from one component family, `app/components/leonix/LeonixLaunchCouponCard.tsx`, so the campaign uses one design and one copy source.

- Variants: `public`/`dashboard`/`compact` (full cards), `mini` (eligible form reminders), `badge` (eligible selector pills).
- Newsletter keeps `variant="public"`. Rentas privado, Empleos quick+premium, and Autos privado forms use `variant="mini"`. Empleos paid job card and Autos private-seller card use `variant="badge"`.
- The standalone `LeonixLaunch25MiniNotice` component and all per-page `launchBadge` copy were removed. Autos dealer keeps only a neutral separate-promotions note; Empleos free job fair has no badge.
- No backend/checkout/Stripe/schema changes. Do not create a second Launch 25 card or copy source.

## 19. Servicios Launch 25 publish readiness (SERVICIOS-LAUNCH-25-PUBLISH-READINESS-01)

**Status: ELIGIBLE** — Chuy can use a valid Launch 25 newsletter code on Servicios **new-application** paid checkout today.

| Item | Value |
|------|-------|
| Package key | `servicios_base_monthly` ($399/mo) |
| Checkout path | `ClasificadosServiciosPreviewClient` → `PublishCheckoutCheckpoint` → `startRevenueCategoryCheckout` → `POST /api/revenue-os/checkout` |
| Promo UI | `onPromoApply` → `validateRevenuePromoForCheckout`; `promoCode` forwarded in checkout payload |
| Allowlist | `servicios_base_monthly` in `WEBSITE_LAUNCH_25_ALLOWLISTED_PACKAGE_KEYS` |
| Launch 25 reminder | `LeonixLaunchCouponCard` mini on new application form; compact at final preview checkout |
| Newsletter checkbox | Optional at checkout; source `servicios_checkout` via `captureCheckoutNewsletterSubscriber` (non-blocking) |

**Not eligible:** dashboard listing edit (already paid), add-on-only dashboard checkout (`servicios_offers_addon`), print/combo/manual packages, free paths.

Server validation + webhook-only redemption unchanged. Promo never grants placement/ranking/verification.

## 20. LAUNCH-25-PAID-CATEGORY-ELIGIBILITY-AUDIT-01

See **`docs/publish-checkout-promo-validation-ui-01.md` §20** for the full matrix. Summary:

| Category | Status | Package key |
|----------|--------|-------------|
| Rentas | READY | `rentas_30d` |
| Empleos paid | READY | `empleos_job_post_paid` |
| Autos privado | READY | `autos_privado_30d` |
| Restaurantes base | READY | `restaurantes_base_monthly` |
| Servicios base | READY | `servicios_base_monthly` |
| Bienes negocio | NOT READY / FUTURE | `br_agent_monthly` |
| Ofertas Locales / Negocios / Clases / Viajes | NOT READY / FUTURE | various / none |
| Dealer / add-ons / free / print / combo / manual | EXCLUDED | — |

No new categories wired in this gate. Allowlist unchanged (five keys only).

See **`docs/bienes-autos-dealer-paid-readiness-01.md`** — Bienes `br_agent_monthly` needs webhook fulfillment before Launch 25; Autos dealer stays on legacy checkout (Launch 25 excluded).
