# Revenue OS Global Return Safety 01

Gate: `REVENUE-OS-GLOBAL-RETURN-SAFETY-PLUS-RESTAURANTES-ADDON-ONLY-01`  
Date: 2026-07-06

## Executive Summary

Stripe success/cancel redirects must never strand owners at Coming Soon. This gate hardens the global Revenue OS return contract: sanitized internal `return_to`, payment-result pages on the launch-lock allowlist, honest lookup-only success/cancel UX, and dashboard-safe returns for add-on checkouts.

## Problem

With `PUBLIC_LAUNCH_LOCK` active on production, middleware redirected almost all paths to `/coming-soon-v2`. Paths **not** allowlisted included:

- `/revenue-os/pago/exito`
- `/revenue-os/pago/cancelado`
- `/dashboard/...`

Owners returning from Stripe (without admin or preview-bypass cookies) hit Coming Soon instead of seeing payment result or returning to Mis anuncios.

## Global return contract

1. Checkout builds success URL: `/revenue-os/pago/exito?session_id=…&category=…&package_key=…&lang=…&return_to=…`
2. Checkout builds cancel URL: `/revenue-os/pago/cancelado?category=…&package_key=…&listing_id=…&lang=…&return_to=…`
3. `return_to` is sanitized server-side via `sanitizeRevenueOsReturnPath()` — internal paths only, no `http(s)://` or `//` escapes.
4. Success page uses `lookupRevenuePaymentProof()` — lookup only, no client-paid claims.
5. Invalid/missing `return_to` falls back to category default or dashboard default (add-on flows).

## Category return defaults

| Category | Default `return_to` |
|----------|---------------------|
| rentas | `/clasificados/rentas?lang=…` |
| empleos | `/clasificados/empleos?lang=…` |
| autos | `/clasificados/autos?lang=…` |
| restaurantes | `/clasificados/restaurantes?lang=…` |
| servicios | `/clasificados/servicios?lang=…` |
| bienes-raices | `/clasificados/bienes-raices?lang=…` |
| dashboard add-on | `/dashboard/mis-anuncios?lang=…&category=restaurantes` |

## Dashboard add-on return behavior

`restaurantes_offers_addon` dashboard checkout sets `returnPath` to `/dashboard/mis-anuncios?lang=…&category=restaurantes`. Success/cancel pages honor sanitized `return_to` with primary CTA **Volver a mi panel**.

## Success page lookup-only rule

- Shows **Pago recibido** / **Payment received** when Stripe payment is processing or confirmed.
- Does **not** say “published” unless webhook-backed proof shows active entitlement.
- Copy: “Estamos confirmando la publicación de tu anuncio.” / “We're confirming your listing.”
- CTAs: **Volver a mi panel** + **Ver categoría**.

## Cancel page rule

- Honest **Pago cancelado** / **Payment canceled** — no fake activation.
- CTA back to sanitized `return_to` (dashboard or category context).

## Preview bypass / Coming Soon lock behavior

- `/revenue-os` and `/dashboard` added to `ALLOWED_PUBLIC_PREFIXES` so Stripe redirects and owner panel returns work during launch lock.
- Public visitors without preview bypass still see Coming Soon on `/clasificados/...` and other non-allowlisted paths.
- Preview bypass cookie remains 30 days; admin cookie bypass unchanged.
- Owner QA unlock (server env token only):

  ```
  /api/preview/unlock?token=<token>&next=/dashboard/mis-anuncios?lang=es
  ```

## Manual QA

1. Unlock preview bypass (owner QA URL above).
2. Complete a Rentas/Empleos/Autos checkout in sandbox — confirm success page loads (not Coming Soon).
3. Click **Volver a mi panel** — confirm `/dashboard/mis-anuncios` loads.
4. Cancel a checkout — confirm cancel page loads with honest copy and dashboard CTA.
5. Try `return_to=https://evil.com` on success URL — confirm fallback to safe internal path.
6. Public incognito (no bypass) — confirm `/clasificados/rentas` still redirects to Coming Soon.

## What was not touched

- Stripe webhook raw body/signature handling
- Supabase schema/migrations
- Restaurante preview shell layout or application step structure
- Public Coming Soon UI design
- Global visual theme
