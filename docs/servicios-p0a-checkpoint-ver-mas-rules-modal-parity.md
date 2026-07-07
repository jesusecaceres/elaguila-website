# SERVICIOS-P0A — Checkpoint Ver Más + Rules Modal Parity

## Gate title
**SERVICIOS-P0A-CHECKPOINT-VER-MAS-RULES-MODAL-PARITY**

## Problem from QA
- `/clasificados/publicar/servicios/checkpoint?lang=es` — **Ver más** unreliable (button nested inside card `Link`)
- `/publicar/servicios?lang=es&product=servicios_profesionales` — coupon step **Ver más** had no `onClick` handler
- Final confirmation needed visible **Leonix rules** modal with category-safe publishing bullets

## Files inspected
- `app/(site)/clasificados/publicar/restaurantes/RestaurantesSelectorClient.tsx` (style reference)
- `app/(site)/clasificados/publicar/servicios/checkpoint/ServiciosCheckpointClient.tsx`
- `app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx`
- `app/(site)/clasificados/en-venta/shared/components/ListingRulesConfirmationSection.tsx` (existing checkboxes)

## Files changed
- `ServiciosCheckpointClient.tsx` — card refactor, modal Escape close
- `ClasificadosServiciosApplication.tsx` — coupon Ver más modal, Leonix rules modal, rules intro
- `scripts/verify-servicios-p0a-checkpoint-ver-mas-rules-modal-parity.mjs`
- `package.json` — verifier script
- This doc

## Restaurante reference style used
- Page: `min-h-screen bg-[#F6F0E2]`, `mx-auto max-w-lg`
- Card: `rounded-2xl border border-[#E8DFD0] bg-[#FFFCF7] p-5 shadow-sm`
- Kicker gold `#B8954A`, price burgundy `#7A1E2C`
- Modal: `fixed inset-0 z-50 bg-black/50`, panel `max-w-lg rounded-2xl bg-[#FFFCF7] p-6 shadow-xl`
- Close: full-width rounded-full `#1E1810` button

## Servicios checkpoint fix
- Replaced wrapping `Link` card with `<article>` container
- **Publicar servicio** is its own `Link` to `/publicar/servicios?product=servicios_profesionales`
- **Ver más** is a standalone button (no navigation)
- Modal closes via close button, overlay click, Escape

## In-application coupon Ver más fix
- Added `couponDetailOpen` state + modal
- Explains +$99/mo add-on, up to 4 offers, vs quick highlights
- Opening modal does **not** set `couponsAddOn: true`

## Leonix rules modal
- Prominent intro before confirmation checkboxes on step 7
- **Ver reglas de Leonix** / **View Leonix rules** opens servicios publishing rules modal
- Close: **Entendido** / **Got it**
- Existing `ListingRulesConfirmationSection` checkboxes unchanged

## CTA behavior audit

### Entry checkpoint (`ServiciosCheckpointClient`)
| CTA | Behavior |
|-----|----------|
| ← Volver a Clasificados | Link to `/clasificados` |
| Publicar servicio | Link to application with `product=servicios_profesionales` |
| Ver más | Opens product details modal |
| Modal Cerrar / overlay / Escape | Closes modal |

### Application coupon step
| CTA | Behavior |
|-----|----------|
| Ver más | Opens coupon add-on explanation modal |
| Agregar cupones por $99/mes | Enables `couponsAddOn` |
| Continuar sin cupones | Skips add-on, advances step |
| Siguiente / Anterior | Step navigation |

### Final confirmation (step 7)
| CTA | Behavior |
|-----|----------|
| Ver reglas de Leonix | Opens publishing rules modal |
| Confirmation checkboxes (×3) | Gate final publish/preview |
| Final continue/publish | Unchanged readiness gates |

## What was protected
- Stripe pricing and Revenue OS checkout
- Webhook and Supabase schema
- Coupon persistence logic
- Public Servicios detail renderer
- Restaurantes and other categories
- Application step structure

## Manual QA checklist
- [ ] Open `/clasificados/publicar/servicios/checkpoint?lang=es`
- [ ] Click **Ver más** — modal opens
- [ ] Close modal (button, overlay, Escape)
- [ ] Click **Publicar servicio** — opens `/publicar/servicios?lang=es&product=servicios_profesionales`
- [ ] Go to coupon step
- [ ] Click coupon **Ver más** — modal opens, coupons not activated
- [ ] Click **Agregar cupones por $99/mes** — coupon fields open
- [ ] Continue to final confirmation
- [ ] Click **Ver reglas de Leonix** — rules modal opens/closes
- [ ] Confirm checkboxes still control final action
- [ ] Test mobile width ~390px

## TRUE/FALSE audit

| Check | Result |
|-------|--------|
| Entry Ver más opens modal | TRUE |
| Entry Ver más does not navigate | TRUE |
| Publicar servicio route preserved | TRUE |
| Coupon Ver más opens modal | TRUE |
| Coupon Ver más does not activate add-on | TRUE |
| Rules CTA visible | TRUE |
| Rules modal ES/EN content | TRUE |
| Checkboxes gate final action | TRUE |
| No Stripe/webhook/schema changes | TRUE |

## READY TO COMMIT status
Pending Gate 9 final checks.
