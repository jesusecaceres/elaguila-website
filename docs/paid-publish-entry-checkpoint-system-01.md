# Paid Publish Entry Checkpoint System

Gate: **PAID-PUBLISH-ENTRY-CHECKPOINT-01**

## Purpose

Standardize paid category publish **entry pages** using the Restaurantes checkpoint pattern: stacked cards, visible price, short description, burgundy CTA, “Ver más” modal, cautious Launch 25 copy.

This gate is **entry UX only** — no checkout, Stripe, promo validation, forms, or schema changes.

## Reference pattern

`/clasificados/publicar/restaurantes?lang=es`

- Cream page background (`#F6F0E2`)
- White/cream cards, gold eyebrow, burgundy CTA text
- Modal overlay with bullet breakdown and burgundy close button
- Mobile-first `max-w-lg` centered stack

## Reusable components

- `app/(site)/clasificados/publicar/_components/PublishEntryCheckpoint.tsx`
  - `PaidPublishCheckpointCard`
  - `PaidPublishCheckpointModal`
  - `PublishEntryCheckpointLayout`
  - `PublishEntryCheckpointStack`
- `app/(site)/clasificados/publicar/_lib/categoryPublishCheckpoints.ts` — display copy + pricing labels
- `app/(site)/clasificados/publicar/_lib/publishCheckpointCopy.ts` — Launch 25 cautious copy

## Pricing source

Primary: `app/lib/listingPlans/revenuePricingMatrix.ts` via `getRevenuePackagePriceCents` + `formatRevenuePriceLabel`.

| Product | Package key | Display |
|---------|-------------|---------|
| Restaurantes establecido | `restaurantes_base_monthly` | $399/mes |
| Comida local | *(display config)* | $199/mes — **not in Revenue V1 matrix** |
| Servicios | `servicios_base_monthly` | $399/mes |
| Autos privado | `autos_privado_30d` | $24.99 / 30 días |
| Autos dealer | `autos_dealer_monthly` | $399/mes · 10 vehicles |
| Autos inventory pack | `autos_dealer_inventory_pack_monthly` | +$129/mes |
| Rentas privado | `rentas_30d` | $24.99 / 30 días |
| Rentas negocio | *(same per-listing as privado; no matrix bulk key)* | **$24.99 / 30 días por anuncio** — owner correction (follow-up gate) |
| BR FSBO privado | `br_fsbo_45d` | $49.99 / 45 días |
| BR agente negocio | `br_agent_monthly` | $399/mes |
| BR inventory pack | `br_inventory_pack_monthly` | +$99/mes |
| Empleos paid | `empleos_job_post_paid` | $24.99 / 30 días |

### Documented mismatches

- **Comida local $199/mes** — shown on live Restaurantes page; not in Revenue V1 matrix (footnoted in config).
- **BR FSBO** — matrix uses $49.99/45d, not a flat $399 (owner notes sometimes group “negocio $399” separately).
- **Rentas negocio** — **corrected (follow-up gate):** same $24.99 / 30 días **por anuncio** as privado; business path collects more business/admin fields only — **not** a bulk inventory package or higher bundle price. Checkout/application remain source of truth.

## Follow-up gate — Launch 25 top banner + Rentas negocio correction

**Gate:** PAID-PUBLISH-ENTRY-CHECKPOINT-FOLLOWUP-01

### Rentas negocio display rule

- Privado: `$24.99 / 30 días`
- Negocio: `$24.99 / 30 días por anuncio` (same per-listing rate)
- Modal explains: each post is $24.99 for 30 days; business path is for landlords/property managers; no bulk inventory package
- No invented `$399` or “see in application” placeholder for negocio pricing on checkpoint cards

### Launch 25 top banner (paid checkpoints only)

Paid publish entry pages with at least one paid-style card show **one** `LeonixLaunchCouponCard` banner above the card stack (below title/intro):

- Restaurantes, Servicios, Autos, Rentas, Bienes Raíces, Empleos (paid hub)
- Mixed pages (e.g. Empleos paid + free feria): banner shows because a paid card exists; free feria card does **not** promise Launch 25
- Pure free/community redirect paths (Comunidad, Mascotas, Busco) do **not** show the banner

CTA opens `/newsletter?lang=…&source=paid_checkpoint_launch_25&return=checkpoint&category={slug}` in a **new tab** (`target="_blank"`). Original checkpoint page stays open.

Per-card coupon copy shortens to one line when the top banner is present; modals keep full cautious copy.

### Newsletter close-helper

When `return=checkpoint` and signup succeeds, newsletter success shows:

- ES: “Listo. Ya puedes cerrar esta ventana y regresar a tu página de publicación.” + **Cerrar ventana** button (`window.close()` with manual-close fallback)
- Source tracking appends category when present: `paid_checkpoint_launch_25_{category}`

No newsletter backend, promo generation, or redemption changes in this gate.

### Still intentionally not touched

- Servicios promo-code bug fix
- Stripe / checkout math / promo validation / redemption
- Supabase schema
- Category publish forms after entry

## Category coverage

| Category | Entry route | Checkpoint |
|----------|-------------|------------|
| Restaurantes | `/clasificados/publicar/restaurantes` | ✅ 2 cards (migrated to shared component) |
| Servicios | `/clasificados/publicar/servicios/checkpoint` | ✅ 1 card |
| Autos | `/publicar/autos` | ✅ privado + dealer |
| Rentas | `/clasificados/publicar/rentas` | ✅ privado + negocio (no invented negocio price) |
| Bienes Raíces | `/clasificados/publicar/bienes-raices` | ✅ privado + negocio |
| Empleos | `/clasificados/publicar/empleos` | ✅ paid + free feria |
| En Venta | redirects to pro | Simple redirect — free V1 |
| Comunidad / Mascotas / Busco | redirect to quick flows | No Launch 25 on free paths |

## Launch 25 / coupon copy

**Top banner** on paid checkpoint pages (see follow-up gate above).

Paid + `promoEligible` cards also show a short per-card line (or full line if no banner):

- ES: “Código Launch 25 elegible en checkout.” (banner present) or full cautious line
- Modal exclusions: free posts, print, combos, manual contracts, dealer unless enabled, no guaranteed placement.

Free paths (empleos feria, comunidad redirects) do **not** promise Launch 25.

## Intentionally not touched

- Stripe checkout / webhooks
- Promo validation / redemption
- Supabase schema
- Publish application forms after entry
- Admin / dashboard
- Public results / detail pages
- Servicios promo fix
- Global nav / site tokens

## Future work

- Money-path QA on each category checkout
- Align Comida Local $199 with Revenue matrix if/when package key exists
- Rentas negocio pricing in matrix when locked

## Verification

```bash
npm run verify:paid-publish-entry-checkpoints
```

## Money-path QA

**PENDING** — visual entry QA only in this gate.
