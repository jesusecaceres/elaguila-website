# Checkpoint-First Route Restoration + Autos Privado Crash Fix

Gate: **CHECKPOINT-FIRST-ROUTE-RESTORATION-AUTOS-CRASH-01**

## Purpose

Restore paid publish **checkpoints as the front door** before raw application routes, and fix the live client crash on `/publicar/autos/privado`.

## Why checkpoints first

Checkpoint pages are the sales explanation layer:
- visible price
- Launch 25 coupon banner
- Ver más modal
- product expectation before the application starts

A prior Negocios Locales route cleanup overcorrected hub CTAs to skip checkpoints and link directly to `/publicar/restaurantes` and `/publicar/autos/negocios`.

## Route chains (restored)

### Restaurantes

1. Clasificados or Negocios Locales card → `/clasificados/publicar/restaurantes?lang=es`
2. Checkpoint CTA → `/publicar/restaurantes?lang=es` (application)

### Autos

1. Clasificados Autos card or Negocios Locales Dealers de Autos → `/clasificados/publicar/autos?lang=es`
2. Checkpoint split:
   - **Autos privado** → `/publicar/autos/privado?lang=es`
   - **Dealers de Autos** → `/publicar/autos/negocios?lang=es`

`/publicar/autos` remains as a legacy alias using the same checkpoint client; hub cards now point to `/clasificados/publicar/autos`.

## Autos privado crash fix

**Root cause:** `AutosPrivadoApplication` called `useEffect` **after** an early `if (!hydrated) return`, violating React Rules of Hooks. When hydration completed, hook order changed and the page threw a client-side exception.

**Fix:** Move the legacy `customEquipment` migration `useEffect` above the hydration gate and guard with `if (!hydrated) return` inside the effect.

## What was intentionally not touched

- Stripe / checkout / promo validation / redemption
- Supabase schema
- Restaurant/autos form field logic (beyond hook-order guard)
- Admin / dashboard
- Results / detail pages
- Servicios promo fix

## QA URLs

- `/clasificados?lang=es` — Restaurantes + Autos publish → checkpoint
- `/negocios-locales?lang=es` — Restaurantes + Dealers → checkpoint
- `/clasificados/publicar/restaurantes?lang=es`
- `/clasificados/publicar/autos?lang=es`
- `/publicar/autos/privado?lang=es` (no crash)
- `/publicar/autos/negocios?lang=es`

## Money-path QA

**PENDING**

## Verification

```bash
npm run verify:checkpoint-first-routes
```
