# Autos go-live: payments and production publish

## Required environment variables

| Variable | Purpose | Where used |
|----------|---------|------------|
| `STRIPE_SECRET_KEY` | Stripe API (live or test key) | `app/lib/stripe/server.ts`, checkout + webhook |
| `STRIPE_WEBHOOK_SECRET` | Verify `checkout.session.completed` | `app/api/webhooks/stripe/route.ts` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client if needed | publish surface (optional) |
| `NEXT_PUBLIC_SITE_URL` | Success/cancel URLs, absolute links | `app/api/clasificados/autos/checkout/route.ts`, `checkout/verify` |
| `STRIPE_PRICE_AUTOS_NEGOCIOS` | Stripe Price ID for **negocios** lane | `app/lib/clasificados/autos/stripeAutosConfig.ts` |
| `STRIPE_PRICE_AUTOS_PRIVADO` | Stripe Price ID for **privado** lane | same |
| `AUTOS_PUBLISH_INTERNAL_BYPASS` | **Dev only** — skip Stripe when `true` + `NODE_ENV !== "production"` | `app/lib/clasificados/autos/autosPublishInternalBypass.ts`, checkout route |
| `NEXT_PUBLIC_LEONIX_AUTOS_PUBLIC_DEMO` | **Non-production / QA only** — when `1`, empty public Autos API responses are filled with blueprint sample cards for UI | `app/(site)/clasificados/autos/lib/autosPublicInventoryPolicy.ts`, `resolveAutosLandingInventory` |

**Production:** `AUTOS_PUBLISH_INTERNAL_BYPASS` must be unset or `false`. In production, `autosPublishInternalBypassEnabled()` returns `false` regardless of env string.

**Production:** Do **not** set `NEXT_PUBLIC_LEONIX_AUTOS_PUBLIC_DEMO=1` on the live site, or the landing/results shell may show Unsplash sample listings when the database has no active rows (`resolveAutosLandingInventory` in `sampleAutosPublicInventory.ts`).

## Lane pricing

- `lane` on row: `"negocios"` | `"privado"` (`AutosClassifiedsLane` in `autosClassifiedsTypes.ts`).
- Checkout selects price id via `stripeAutosConfig.ts` helpers. Missing env → checkout returns **503** / configured error path (`stripe_not_configured` pattern in `app/api/clasificados/autos/checkout/route.ts`).

## Status transition table

| From | Event | To | Public visible |
|------|--------|-----|------------------|
| `draft` | User saves | `draft` | No |
| `draft` | Checkout session created | `pending_payment` | No |
| `pending_payment` | Payment success (webhook or verify) | `active` | Yes |
| `pending_payment` | User abandons | stays `pending_payment` | No |
| `pending_payment` | Open session reused | stays `pending_payment`, same URL | No |
| `payment_failed` | Retry checkout | `pending_payment` | No |
| `active` | Owner unpublish / admin | may become `removed` or non-public per product rules | Yes while `status === "active"` and listed by `listActiveAutosClassifiedsRows` |

Canonical helpers: `app/lib/clasificados/autos/autosClassifiedsVisibility.ts`.

## Failure / retry

1. Stripe session `expired` / `complete` without success path → row can move to `payment_failed` (verify route + webhook handlers).
2. User hits **Reintentar pago** on `/publicar/autos/confirmar` → `POST /api/clasificados/autos/checkout` with `listingId`. If status `pending_payment` and existing session still `open`, route **reuses** session URL (`reusedSession: true`) to avoid duplicate charges from double-submit.

## Routes (reference)

- `POST /api/clasificados/autos/checkout` — `app/api/clasificados/autos/checkout/route.ts`
- `GET /api/clasificados/autos/checkout/verify` — `app/api/clasificados/autos/checkout/verify/route.ts`
- `POST /api/webhooks/stripe` — `app/api/webhooks/stripe/route.ts` (delegates to `handleStripeWebhook`)
- Success UI: `app/(site)/publicar/autos/pago-exitoso/page.tsx`
- Cancel UI: `app/(site)/publicar/autos/pago-cancelado/page.tsx`

## Production launch payment checklist

- [ ] `STRIPE_SECRET_KEY` = live secret in Vercel production
- [ ] `STRIPE_WEBHOOK_SECRET` = live signing secret for production webhook endpoint
- [ ] Webhook URL registered: `{NEXT_PUBLIC_SITE_URL}/api/webhooks/stripe` with event `checkout.session.completed`
- [ ] `STRIPE_PRICE_AUTOS_NEGOCIOS` and `STRIPE_PRICE_AUTOS_PRIVADO` set to **live** Price IDs (mode matches key)
- [ ] `NEXT_PUBLIC_SITE_URL` = production origin (https, no trailing slash issues for Stripe redirects)
- [ ] `AUTOS_PUBLISH_INTERNAL_BYPASS` **not** set in production
- [ ] Run one real **private** and one **dealer** checkout in staging/test mode first, then smoke in production with small amount or Stripe test clock as applicable

## Evidence: failed payment does not publish (code)

Public list + detail loaders query **only** `status === "active"` (see `listActiveAutosClassifiedsRows` / `getActiveLiveAutosBundle` in `autosClassifiedsListingService.ts`). Non-active rows never enter `mapAutosClassifiedsToPublic.ts`.

---

## Enforcement addendum — execution vs code (this pass)

| Claim | Code / config support | Test-mode Checkout executed (this repo run) | Live-mode Checkout executed |
|-------|----------------------|-----------------------------------------------|------------------------------|
| Lane price IDs resolve | **TRUE** — `autosStripePriceIds.ts` | **FALSE** | **FALSE** |
| Checkout creates/reuses session | **TRUE** — `app/api/clasificados/autos/checkout/route.ts` | **FALSE** | **FALSE** |
| Webhook / verify activates row | **TRUE** — wired to service layer | **FALSE** | **FALSE** |
| Duplicate checkout mitigation | **TRUE** — reuse branch when session `open` | **FALSE** | **FALSE** |

**Payment readiness verdict (strict):** **NOT PROVEN** for runtime (test or live) in this environment. Code support is implemented; **execution is a mandatory staging/prod step** before any **GO-LIVE READY** claim that includes payments.

## Publish CTA / button (code inspection — this recovery pass)

| Step | Location | Behavior |
| ---- | -------- | -------- |
| Lane choice | `/publicar/autos` | Routes to Negocios vs Privado publish shells. |
| Draft → review → pay | `AutosPublishConfirmCore` and lane-specific confirm pages under `app/(site)/publicar/autos/` | Creates/updates `autos_classifieds_listings` then redirects to Stripe Checkout when configured; internal bypass only when `AUTOS_PUBLISH_INTERNAL_BYPASS` + non-production per `autosPublishInternalBypass.ts`. |
| Success | `/clasificados/autos/pago/exito` + verify route | Reactivates listing to `active` when payment verified. |

**Runtime proof:** Stripe Checkout session creation was **not** executed in this agent session (no secret keys in environment log). Treat payment path as **code-ready**, **runtime-unproven** until staging checkout completes.
