# Autos go-live — payments and publish hardening

This document complements `AUTOS_PUBLISH_LIFECYCLE.md` with **production** checklist items for the paid Autos shell (`autos_classifieds_listings`).

## Required environment variables

| Variable | Role |
| -------- | ---- |
| `STRIPE_SECRET_KEY` | Stripe API (Checkout create, session retrieve, webhook verify). Without it, checkout returns `503 stripe_not_configured` (except internal bypass path below). |
| `STRIPE_PRICE_AUTOS_NEGOCIOS` | Stripe Price ID for **negocios** lane checkout line item. |
| `STRIPE_PRICE_AUTOS_PRIVADO` | Stripe Price ID for **privado** lane checkout line item. |
| `NEXT_PUBLIC_SITE_URL` | Preferred canonical site origin for Checkout `success_url` / `cancel_url` (`getAutosSiteOrigin()`). On Vercel, `VERCEL_URL` is used as fallback. |
| Supabase service role (server) | Used by Autos API routes via `getAdminSupabase()` to read/write `autos_classifieds_listings`. Must match the project that owns the table. |

## Strongly recommended (production)

| Variable | Role |
| -------- | ---- |
| `STRIPE_WEBHOOK_SECRET` | Verifies `POST /api/clasificados/autos/stripe/webhook`. **Success-page activation does not depend on the webhook** (see below), but the webhook provides idempotent backup activation and analytics hooks. If unset, the webhook route returns `503 webhook_secret_missing`. |

## Internal QA only (never production)

| Variable | Role |
| -------- | ---- |
| `AUTOS_INTERNAL_PUBLISH_PAYMENT_BYPASS=1` | When `VERCEL_ENV !== "production"`, `POST /api/clasificados/autos/checkout` activates the listing immediately without Stripe. Blocked in production in `autosInternalPublishConfig.ts`. |
| `NEXT_PUBLIC_AUTOS_INTERNAL_PUBLISH_PAYMENT_BYPASS=1` | Optional client hint for publish CTA labeling only. |

## Real publish state transitions

1. **Draft / recoverable** — `draft`, `payment_failed`, or `pending_payment` (retry allowed per `POST /api/clasificados/autos/checkout` in `checkout/route.ts`).
2. **Checkout created** — Row moves to `pending_payment` and stores `stripe_checkout_session_id`.
3. **Paid** — `GET /api/clasificados/autos/checkout/verify?session_id=…` (called from `AutosPagoExitoClient`) retrieves the session; if `payment_status === "paid"`, `tryActivateAutosListingAfterPayment` updates to `active`, sets `published_at`, clears checkout session id, and optionally stores `stripe_payment_intent_id`. The update uses `.eq("status", "pending_payment")` so duplicate verify + webhook are safe.
4. **Public** — Only `status === "active"` appears in `GET /api/clasificados/autos/public/listings` and detail `GET …/public/listings/[id]`.

## Failure / cancel / retry

- **User abandons Checkout** — `cancel_url` lands on cancel page; listing can remain `pending_payment` until a new checkout is created (implementation-specific cleanup may set draft elsewhere; see cancel client if extended).
- **Verify returns not paid** — Success client shows error; listing stays non-public until paid.
- **Stripe or price misconfiguration** — Checkout `POST` returns `503` with `stripe_price_missing` / `stripe_not_configured`; listing is not activated.

## Launch checklist

- [ ] `STRIPE_SECRET_KEY`, both price IDs, and `NEXT_PUBLIC_SITE_URL` set on the **production** Vercel project.
- [ ] Stripe webhook endpoint registered pointing to `/api/clasificados/autos/stripe/webhook` with `STRIPE_WEBHOOK_SECRET` set (recommended).
- [ ] Confirm `AUTOS_INTERNAL_PUBLISH_PAYMENT_BYPASS` is **unset** (or `0`) in production.
- [ ] Run a real card payment in Stripe test mode against staging, then repeat in live mode with low-value price before marketing launch.
- [ ] Confirm success URL hits `checkout/verify` and live vehicle URL resolves.
