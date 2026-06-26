# Gate REST-OFFERS-UPSELL1 — Restaurante Final Review Ofertas Locales Combo Upsell

## Gate type

STRICT RESTAURANTE MONETIZATION UPSELL — NO FAKE COUPONS — BUILD REQUIRED

## Files inspected

**Autos (read-only):** `AutosNegociosInventoryValueModule.tsx`, `AutosNegociosInventoryBoostPanel.tsx`, `autosDealerInventoryValueCopy.ts`

**Ofertas Locales (read-only):** `/publicar/ofertas-locales`, `ofertasLocalesTwoLaneProductModel.ts` ($399/$199 lanes), public routes

**Restaurante:** `RestaurantePreviewClient.tsx` (final review + publish), `RestauranteOffersPreviewStrip.tsx` (REST-OFFERS1)

## Files changed

- `app/lib/clasificados/restaurantes/RestauranteOfertasLocalesUpsellCard.tsx` (new)
- `app/lib/clasificados/restaurantes/restaurantesOffersUpsellCopy.ts` (new)
- `app/(site)/clasificados/restaurantes/preview/RestaurantePreviewClient.tsx` (wire upsell — minimal integration)
- `app/lib/clasificados/restaurantes/RESTAURANTES_OFFERS_UPSELL1_AUDIT.md` (this file)
- `scripts/restaurantes-offers-upsell1-audit.ts` (new)
- `package.json` (audit script)

## Autos upsell reference findings

- **Pattern:** `AutosNegociosInventoryValueModule` — gradient bordered card, title, pricing bullets, optional CTA links, does not block publish
- **Payment:** display/link only; boost panel notes checkout-soon, no fake entitlement
- **Style:** `rounded-2xl border`, gold gradient bg, min-h CTA buttons

## Ofertas Locales route/pricing findings

- **Publish route:** `/publicar/ofertas-locales?lang=es|en` — PASS
- **Pricing lanes:** shopping specials ~$399/mo, local coupons ~$199/mo (`ofertasLocalesTwoLaneProductModel.ts`)
- **Prefill query:** not supported today — CTA links to base publish route only
- **Public detail:** `/clasificados/ofertas-locales/[id]`

## Restaurante final review placement

**`RestaurantePreviewClient.tsx`** — collapsible “Publicar y ayuda de sesión” panel when draft is publish-ready (`minOk`), **after** server note and **before** publish confirmations/checkboxes.

## Pricing strategy

| Item | Price |
| ---- | ----- |
| Restaurante Premium | $399/mes |
| Ofertas Locales standalone | $199/mes |
| Restaurante Premium + Ofertas | $499/mes |
| Add-on value | +$100/mes |
| Savings vs separate | $99/mes |

## CEO rationale

Coupons drive conversion; restaurants need recurring specials; Leonix becomes a revenue tool beyond directory listings.

## CFO rationale

$100 add-on is high-margin; bundle reduces friction vs selling $199 standalone; preserves standalone value.

## Client rationale

Simple bundle math; cheaper than two products; monthly reason to update; shareable promos on social.

## Upsell card implementation result

**FIXED** — `RestauranteOfertasLocalesUpsellCard` added with Spanish copy per spec, value bullets, non-blocking placement.

## CTA route result

**PASS** — `Crear oferta local` → `/publicar/ofertas-locales?lang=es|en` via `restauranteOfertasLocalesPublishHref`.

## Public detail coupon safety result

**PASS (REST-OFFERS1)** — `RestauranteOffersPreviewStrip` returns null without linked offers; explicit `linkedRestaurantePublicListingId` required; no changes this gate.

## No fake coupon result

**PASS** — No counts, no sample coupons, no purchased-state claims.

## No payment behavior changed

**PASS** — Copy/constants only; no Stripe/checkout edits.

## No publish blocking

**PASS** — Upsell is informational; confirmations + publish unchanged.

## Mobile result

**PASS** — Stack layout, responsive bullet grid, full-width CTA, no overflow.

## Remaining / future work

- REST-OFFERS2: write `linkedRestaurantePublicListingId` on Ofertas publish
- Optional: prefill Ofertas form from restaurant draft (query params)
- Combo billing/entitlement when checkout exists

## Manual QA checklist

- [ ] Open preview with publish-ready draft — upsell visible in publish panel
- [ ] Confirmations still required to publish
- [ ] “Crear oferta local” opens `/publicar/ofertas-locales?lang=es`
- [ ] Public restaurant page — no fake offers strip without linked data
- [ ] Mobile — card readable, no horizontal scroll

## Gate A TRUE/FALSE

| Requirement | TRUE/FALSE | Evidence |
| ----------- | ---------- | -------- |
| Autos upsell pattern inspected read-only | TRUE | `AutosNegociosInventoryValueModule.tsx` |
| Ofertas Locales route inspected read-only | TRUE | `/publicar/ofertas-locales` |
| Restaurante final review placement identified | TRUE | `RestaurantePreviewClient.tsx` |
| No files edited in Gate A | TRUE | inventory only |

## Gate B TRUE/FALSE

| Requirement | TRUE/FALSE | Evidence |
| ----------- | ---------- | -------- |
| Upsell card added to final review | TRUE | `RestaurantePreviewClient.tsx` |
| $399 base shown | TRUE | copy |
| +$100 add-on shown | TRUE | copy |
| $499 combo shown | TRUE | copy |
| $99 savings shown | TRUE | copy |
| CTA → real Ofertas route | TRUE | href |
| Does not block publish | TRUE | optional card |
| No payment change | TRUE | link only |
| No fake coupons/counts | TRUE | no counts |
| Mobile safe | TRUE | responsive classes |

## Gate C TRUE/FALSE

| Requirement | TRUE/FALSE | Evidence |
| ----------- | ---------- | -------- |
| Public detail coupon state inspected | TRUE | `RestauranteOffersPreviewStrip.tsx` |
| No fake public coupon cards added | TRUE | no Gate C edits |
| Public page clean without linked offers | TRUE | `return null` |
| Missing relation documented | TRUE | REST-OFFERS2 |
| Food/media order preserved | TRUE | no shell edits |
| Shell/canvas preserved | TRUE | preview canvas unchanged |
