# Checkout Newsletter Checkbox Capture

Gate: **CHECKOUT-NEWSLETTER-CHECKBOX-CAPTURE-01**

## Purpose

Wire the "receive promotions / newsletter" opt-in checkbox on eligible **paid** publish/checkout flows so that checked users are saved/updated in the existing Leonix newsletter/contact subscriber system (`leonix_newsletter_subscribers`), feeding the existing admin inbox and CSV exports.

This is a list-growth / sales-contact capture gate. It is **best-effort** and must never block or fail checkout/payment.

## How it works

- Shared client helper: `app/lib/newsletter/checkoutNewsletterCapture.ts`
  - `captureCheckoutNewsletterSubscriber(input)` — gates on `checked` + valid email, then POSTs to the capture endpoint. Fire-and-forget (`void`, `keepalive: true`). Never throws.
- Best-effort API: `app/api/newsletter/checkout-capture/route.ts`
  - Reuses the existing `saveNewsletterSubscriber` pattern (same table/schema).
  - Always returns HTTP 200 so a slow/failed save can never surface as a checkout error.
  - Does **not** create promo codes, does **not** send email, does **not** touch Stripe.

## Eligible flows wired / confirmed

| Flow | Component | Source | Notes |
|------|-----------|--------|-------|
| Restaurantes checkout | `clasificados/restaurantes/preview/RestaurantePreviewClient.tsx` (existing checkbox via `PublishCheckoutCheckpoint`) | `restaurantes_checkout` | Existing checkbox — now wired to capture |
| Rentas privado checkout | `clasificados/rentas/preview/privado/components/RentasPrivadoPreviewClient.tsx` | `rentas_checkout` | Optional opt-in checkbox added near promo field |
| Empleos paid checkout (quick) | `publicar/empleos/quick/EmpleoQuickApplicationClient.tsx` + shared `EmpleosPublishConfirmModal.tsx` | `empleos_checkout` | Opt-in in confirm modal (paid only) |
| Empleos paid checkout (premium) | `publicar/empleos/premium/EmpleoPremiumApplicationClient.tsx` + shared modal | `empleos_checkout` | Opt-in in confirm modal (paid only) |
| Autos privado checkout | `publicar/autos/shared/components/AutosPublishConfirmCore.tsx` | `autos_privado_checkout` | Opt-in checkbox added in privado + Stripe branch only |

## Sources used

- `restaurantes_checkout`
- `rentas_checkout`
- `empleos_checkout`
- `autos_privado_checkout`

## Interests / tags captured

Every captured row includes:

- `cta:checkout_newsletter_opt_in`
- a category/audience tag derived server-side from the source, e.g.
  - `category:restaurantes`, `audience:business`
  - `category:rentas`, `audience:seller`
  - `category:empleos`, `audience:business`
  - `category:autos`, `seller:private`, `audience:seller`
- a package identifier where available, e.g. `package:restaurantes_base_monthly`, `package:rentas_privado`, `package:empleos_quick`, `package:empleos_premium`, `package:autos_privado`
- `launch_25` (promo-updates relevance)

`status` is `subscribed`; `consent_timestamp` is set to the capture time.

## Behavior

- **Checked + valid email** → subscriber saved/updated (best-effort).
- **Unchecked** → nothing happens (no network call).
- **Missing/invalid email** → skipped safely.
- **Save failure** → swallowed; checkout continues and redirects to Stripe normally.

## Ineligible flows excluded (NOT wired)

- Free posts / free publish paths
- **Empleos free job fair** (`publicar/empleos/feria/*`) — free; no `promo`, no `newsletter` prop passed to the shared modal
- **Autos dealer / negocio** path — capture only fires in the `lane === "privado" && publishConfirmMode === "stripe"` branch
- Print packages, magazine combos, manual contracts
- Dealer/business packages not in website checkout
- Unrelated categories (Servicios, Bienes Raíces, etc.)

## Confirmations

- Promo/discount math: **untouched** (no changes to promo validation/redemption/payment records).
- Stripe Checkout / session creation: **untouched** (capture is fully separate, fire-and-forget).
- Stripe webhook / redemption: **untouched**.
- Supabase schema/migrations: **none** (reuses existing `leonix_newsletter_subscribers`).
- No bulk newsletter sender was created; capture only saves/updates a subscriber row.

## Admin / export

Captured subscribers appear in the existing newsletter admin inbox and exports. The full CSV (`newsletterSubscribersToCsv`) already includes `source`, `interests`, `consent_timestamp`, and `status`, so checkout source + interests are visible without any admin redesign.

- `/admin/leads/newsletter`
- `/api/admin/leads/newsletter/export`
- `/api/admin/leads/newsletter/emails-export`

## Manual QA URLs

- https://www.leonixmedia.com/publicar/rentas/privado?lang=es
- https://www.leonixmedia.com/publicar/empleos/quick?lang=es
- https://www.leonixmedia.com/publicar/empleos/premium?lang=es
- https://www.leonixmedia.com/publicar/autos?lang=es
- https://www.leonixmedia.com/admin/leads/newsletter?lang=es
- https://www.leonixmedia.com/admin/workspace/promo-codes?code_type=newsletter

## Verifier

```bash
npm run verify:checkout-newsletter-capture
```

## Related docs

- `docs/newsletter-operations-readiness.md`
- `docs/newsletter-sales-contact-ops.md`
- `docs/newsletter-promo-code-readiness.md`
- `docs/stripe-revenue-os-category-checkout-wiring-01.md`
