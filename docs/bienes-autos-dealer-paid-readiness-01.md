# BIENES-AUTOS-DEALER-PAID-READINESS-01

Gate: honest paid-pipeline readiness for **Bienes Raíces** and **Autos dealer/negocio** before final QA.  
Date: 2026-07-12  
Mode: inspection + documentation + verifier protection. **No fake Launch 25 readiness.**

## 1. Executive summary

| Lane | Paid pipeline status | Launch 25 | Blocker |
|------|---------------------|-----------|---------|
| **Bienes agent/negocio** (`br_agent_monthly`) | **NOT READY / FUTURE** | **NO** | Revenue OS checkout starts, listing saves `pending_payment`, but **no webhook listing activation** after payment; promo deferred (not forwarded) |
| **Bienes FSBO privado** (`br_fsbo_45d`) | **NOT READY / FUTURE** | **NO** | No Revenue OS publish checkout; preview publishes **immediately** without payment |
| **Autos dealer/negocio** (`autos_dealer_monthly`) | **READY (legacy checkout)** | **EXCLUDED** | Legacy `/api/clasificados/autos/checkout` + verify — not central Revenue OS; business rule excludes Launch 25 until migration |
| **Autos dealer inventory pack** (`autos_dealer_inventory_pack_monthly`) | **EXCLUDED (add-on)** | **EXCLUDED** | Dashboard add-on only via Revenue OS |

Green categories (Servicios, Autos privado, Rentas, Empleos paid, Restaurantes) were **not modified** in this gate.

## 2. Gate 1 — Current truth map

| Category/lane | Package key | Price | Duration | Entry/checkpoint | Application | Preview | Final checkout | Checkout type | Promo forwarded | Launch 25 | Reason |
|---------------|-------------|-------|----------|------------------|-------------|---------|----------------|---------------|-----------------|-----------|--------|
| Bienes agent/negocio | `br_agent_monthly` | $399/mo | Monthly subscription | `/clasificados/publicar/bienes-raices` | `/clasificados/publicar/bienes-raices/negocio` | `/clasificados/bienes-raices/preview/negocio` | `PublishCheckoutCheckpoint` on preview | **Revenue OS** (`startRevenueCategoryCheckout`) | **NO** (`promoEligible` + deferred UI, no `onPromoApply`, no `promoCode` in payload) | **FUTURE** | Missing webhook listing activation + promo forward |
| Bienes FSBO privado | `br_fsbo_45d` | $49.99 | 45 days | Same hub (Privado card) | `/clasificados/publicar/bienes-raices/privado` or `/publicar/bienes-raices/privado` | `/clasificados/bienes-raices/preview/privado` | Inline publish button only | **No checkout** | **NO** | **FUTURE** | `publishLeonixListingFromBienesRaicesPrivadoDraft` publishes live with no `pending_payment` / Stripe |
| Autos dealer/negocio | `autos_dealer_monthly` | $399/mo | Monthly (10 vehicles) | `/clasificados/publicar/autos?lang=es` | `/publicar/autos/negocios?lang=es` | Application stepped shell (no separate preview route) | `/publicar/autos/negocios/confirm` → `AutosPublishConfirmCore` | **Legacy** (`POST /api/clasificados/autos/checkout`) | **NO** (no promo field on negocios lane) | **EXCLUDED** | Dealer product on legacy Stripe; Launch 25 is website Revenue OS only |
| Autos dealer inventory pack | `autos_dealer_inventory_pack_monthly` | $129/mo | Monthly (+10 vehicles) | Dashboard mis-anuncios | Dashboard add-on CTA | N/A | Dashboard Revenue OS add-on checkout | **Revenue OS add-on** | **NO** | **EXCLUDED** | Add-on-only; not base dealer package |

## 3. Gate 2 — Decisions

### Bienes agent (`br_agent_monthly`)
- **Decision:** NOT READY / FUTURE for launch money-path QA.
- **Why not wire Launch 25 now:** Even a small promo-forward hook would discount checkout while the listing would remain unpublished after payment — **fake readiness**. `revenueFulfillment.ts` has no `tryActivateBienesListingAfterEntitlement` / `br_agent_monthly` branch.
- **Next gate:** `BIENES-REVENUE-OS-WEBHOOK-FULFILLMENT-01` (webhook activation) then promo + optional Launch 25 allowlist.

### Bienes FSBO (`br_fsbo_45d`)
- **Decision:** NOT READY / FUTURE — requires full Revenue OS migration (pending save → checkout → webhook publish), mirroring Rentas privado pattern.
- **Do not wire Launch 25** until checkout exists.

### Autos dealer (`autos_dealer_monthly`)
- **Decision:** Paid pipeline **honest and functional** on legacy path; Launch 25 **EXCLUDED** until central Revenue OS migration and explicit business approval.
- **Checkpoint:** Dealer card shows correct matrix price; neutral “separate promotions” note (no Launch 25 badge).

### Dealer inventory pack
- **Decision:** EXCLUDED from Launch 25 and out of scope except documentation.

## 4. Gate 3 — Bienes safe repair

**No wiring in this gate.** Inspection proved the gap is not “promo only” — webhook fulfillment is missing.

Current Bienes agent flow (when `brPublishPaymentRequired("negocio")` is true):
1. Application → preview at `BR_PREVIEW_NEGOCIO`.
2. `PublishCheckoutCheckpoint` with `promoEligible: true`, `newsletterEligible: true`.
3. `onCheckout={() => void onPublishLive()}` — **does not receive** `ctx.promoCode` / `ctx.newsletterOptIn`.
4. `publishLeonixListingFromAgenteResidencialDraft` with `activationMode: "pending_payment"`.
5. `startRevenueCategoryCheckout({ ...BIENES_RAICES_NEGOCIO_CHECKOUT })` — **no `promoCode`**.
6. After Stripe payment: entitlements may activate via Revenue OS, but **listing is not published** (no bienes fulfillment hook).

`PublishCheckoutCheckpoint` shows **deferred promo** copy when `promoEligible && !onPromoApply` — not the apply field.

## 5. Gate 4 — Autos dealer safe repair

**No Launch 25 added.** Legacy checkout preserved.

Autos dealer flow:
1. Checkpoint `/clasificados/publicar/autos` → dealer card → `/publicar/autos/negocios`.
2. Stepped application → `/publicar/autos/negocios/confirm`.
3. `AutosPublishConfirmCore` with `lane === "negocios"` → `POST /api/clasificados/autos/checkout`.
4. Stripe session created; listing `pending_payment` via `setAutosListingPendingPayment`.
5. Success: `/clasificados/autos/pago/exito` → `GET /api/clasificados/autos/checkout/verify` → `tryActivateAutosListingAfterPayment` (paid only).
6. **No** `RevenuePromoField` on negocios lane (gated to privado + Revenue OS stripe mode only).

Inventory pack: dashboard `autosDashboardInventoryAddonCheckout.ts` → Revenue OS `autos_dealer_inventory_pack_monthly` — separate from dealer base publish.

## 6. Gate 5 — Checkpoint / preview truth

### Bienes
- **Checkpoint:** Yes — hub at `/clasificados/publicar/bienes-raices` with Privado vs Negocio cards (`getBienesRaicesCheckpointCards`).
- **Agent preview checkout:** Yes — `PublishCheckoutCheckpoint` with package line items, confirmations, newsletter slot (UI only), secure payment CTA.
- **FSBO preview:** Preview-only + direct publish — **no** final paid checkout block.
- **Acceptable for launch?** Agent: **NO** until webhook publish. FSBO: **NO** until paid checkout exists.

### Autos dealer
- **Checkpoint:** Yes — `/clasificados/publicar/autos` with privado vs dealer cards.
- **Preview:** Application is the review surface; confirm page is final payment.
- **Launch 25 on dealer UI:** Correctly **absent** (excluded).

## 7. Gate 6 — Newsletter checkbox audit

| Lane | Checkbox at checkout | Saves to `leonix_newsletter_subscribers` | Non-blocking | Source label |
|------|---------------------|------------------------------------------|--------------|--------------|
| Bienes agent | UI slot in checkpoint (`newsletterEligible: true`) | **NO** — `onCheckout` ignores `ctx.newsletterOptIn` | N/A | Future: `bienes_raices_checkout` (needs `CHECKOUT_NEWSLETTER_SOURCES` + server allowlist — out of scope) |
| Bienes FSBO | **NO** | **NO** | — | Future gate |
| Autos dealer | **NO** on confirm (negocios) | **NO** | — | Future: `autos_dealer_checkout` |
| Autos privado (protected) | Yes on legacy confirm + preview checkpoint | Yes | Yes | `autos_privado_checkout` |

## 8. Dashboard / edit / recharge

### Bienes agent
- Preview with `?source=dashboard` + listing id: **blocks** republish from preview (“vuelve a editar”).
- Inventory add mode: separate flow without base package recharge.
- Dashboard inventory pack: Revenue OS add-on (`br_inventory_pack_monthly`) — excluded from Launch 25.

### Autos dealer
- Inventory add from dashboard reuses negocios draft namespace.
- Confirm reuses open Stripe session when `pending_payment` (no duplicate charge on double-submit).
- Dealer limit enforced at checkout and verify.

## 9. Launch 25 answers for Chuy

| Question | Answer |
|----------|--------|
| Can Chuy use Launch 25 on Bienes today? | **NO** |
| Can Chuy use Launch 25 on Autos dealer today? | **NO** (excluded — legacy checkout) |

Allowlist unchanged: `rentas_30d`, `empleos_job_post_paid`, `autos_privado_30d`, `restaurantes_base_monthly`, `servicios_base_monthly` only.

## 10. Production QA recommendation

### QA now (Autos dealer legacy paid path)
- https://www.leonixmedia.com/clasificados/publicar/autos?lang=es
- https://www.leonixmedia.com/publicar/autos/negocios?lang=es
- Confirm $399/mo dealer package, confirm page, Stripe amount, verify activation, **no Launch 25 promo field**.

### Do NOT money-path QA Bienes agent until webhook fulfillment gate ships
- Hub: https://www.leonixmedia.com/clasificados/publicar/bienes-raices?lang=es
- Application: `/clasificados/publicar/bienes-raices/negocio`
- Preview: `/clasificados/bienes-raices/preview/negocio`

### FSBO
- Document only — preview publishes without payment today.

## 11. Next gates (ordered)

1. **BIENES-REVENUE-OS-WEBHOOK-FULFILLMENT-01** — `activatePaidBienesListingFromRevenueOs` for `br_agent_monthly`.
2. **BIENES-AGENT-CHECKOUT-PROMO-NEWSLETTER-01** — `onPromoApply`, `promoCode`, newsletter capture (after fulfillment).
3. **BIENES-FSBO-REVENUE-OS-CHECKOUT-01** — FSBO paid path (`br_fsbo_45d`).
4. **AUTOS-DEALER-REVENUE-OS-MIGRATION-01** — migrate dealer base from legacy checkout (then evaluate Launch 25 business rule).

## 12. Verifier

```bash
npm run verify:bienes-autos-dealer-paid-readiness
npm run verify:website-launch-25-checkout-wiring
```

## 13. Files changed in this gate

| File | Change |
|------|--------|
| `docs/bienes-autos-dealer-paid-readiness-01.md` | This document |
| `scripts/verify-bienes-autos-dealer-paid-readiness.mjs` | Static truth assertions |
| `package.json` | Verifier script |
| Cross-refs in Launch 25 / Revenue OS docs | Readiness pointers |

No application checkout code, webhooks, schema, or green categories modified.
