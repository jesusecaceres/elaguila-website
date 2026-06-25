# Gate REST-OFFERS1 — Restaurante + Ofertas Locales Combo Bridge

## Gate type

STRICT MONETIZATION + EXISTING-COUPON INTEGRATION — NO FAKE OFFERS — BUILD REQUIRED

## Preflight status

Clean working tree at gate start (no unrelated dirty files).

## Implementation result

**Outcome B — DOCUMENTED + SAFE UI READY**

- Safe preview strip wired on published Restaurante detail only.
- Query uses explicit `draft_snapshot.linkedRestaurantePublicListingId` — returns empty in current production (no link field written yet).
- No public placeholders, fake coupons, or “coming soon” on restaurant pages.

## Ofertas Locales route inventory

| Route | Status | Notes |
| ----- | ------ | ----- |
| `/publicar/ofertas-locales?lang=es\|en` | PASS | `OfertasLocalesApplicationClient.tsx` |
| `/publicar/ofertas-locales/preview?lang=es\|en` | PASS | `preview/page.tsx` + `OfertasLocalesPreviewClient.tsx` |
| `/clasificados/ofertas-locales` | PASS | Public search hub |
| `/clasificados/ofertas-locales/[id]` | PASS | Public offer detail |

## Ofertas Locales data / API / query inventory

| Item | Value |
| ---- | ----- |
| Table | `public.ofertas_locales` |
| Owner | `owner_id` |
| Public status | `approved` (non-expired) |
| Fields | `title`, `offer_title`, `description`, `coupon_text`, `valid_from`, `valid_until`, `business_category`, `business_name`, assets |
| Publish API | `POST /api/ofertas-locales/publish` |
| Public search API | `GET /api/ofertas-locales/public-search` |
| Public detail helper | `fetchPublicOfertaLocalDetailById` |
| Restaurant FK | **None in production columns** |

## Restaurante-to-offer link strategy

| Key | Status |
| --- | ------ |
| `restaurantes_public_listings.id` UUID | **READY** — contract key `linkedRestaurantePublicListingId` in `draft_snapshot` |
| Leonix ID | DEFERRED — not stored on Ofertas rows today |
| `owner_id` match | DEFERRED — unsafe (multi-business owners) |
| Business name / phone | DEFERRED — not used (no fuzzy matching) |

**Next gate:** Ofertas publish writes `linkedRestaurantePublicListingId` when seller has combo entitlement.

## Pricing / package strategy

| Product | Price |
| ------- | ----- |
| Restaurante Premium | **$399/month** |
| Ofertas Locales standalone (local coupons lane) | **$199/month** |
| **Restaurante Premium + Ofertas** combo | **$499/month** |
| Add-on value vs standalone stack | **+$100/month** bundled |
| Client savings vs $399 + $199 | **$99/month** ($598 → $499) |

**Included in combo:** Premium profile, Business Hub, media/menu/reservation/social, analytics, up to **4 active offers**, preview strip when linked, shareable `/clasificados/ofertas-locales/[id]` links.

**Extra upsell:** +4 active offers — launch **+$49/month**, standard **+$99/month** (document only).

Constants: `restaurantesOffersComboPricing.ts`

## CEO rationale

Coupons increase conversion. Restaurants need recurring specials. Leonix becomes a revenue tool, not only a directory.

## CFO rationale

$100 add-on is high-margin. Bundle reduces friction vs separate $199 sale. Creates recurring upsell while keeping standalone $199 valuable.

## Client rationale

Easy to understand. Cheaper than two products. Reason to update monthly. Shareable social promotions.

**Client-facing copy (ES):** “Agrega ofertas y especiales a tu perfil premium para convertir visitas en clientes.”

**Client-facing copy (EN):** “Add offers and specials to your premium profile to turn views into customers.”

## Public page placement decision

After Business Hub contact section, before Especialidades — implemented in `RestauranteAdStoryPreview.tsx`.

## Query / component behavior

- `fetchRestauranteLinkedOffersForPublicPage` — approved + non-expired + explicit snapshot link; max 3.
- `RestauranteOffersPreviewStrip` — returns `null` when `offers.length === 0`.
- Wired on `[slug]/page.tsx` only (published detail). Preview form session unchanged (no strip).

## No fake offer result

**PASS** — Strip hidden until real linked rows exist. No placeholder coupons or counts.

## No payment behavior changed

**PASS** — Pricing is documentation/constants only. No Stripe/checkout edits.

## No Restaurante shell redesign

**PASS** — Compact strip added; hero/hub/gallery order preserved.

## Mobile result

**PASS** — Responsive 1/2/3 column grid; compact cards.

## Files inspected

Ofertas Locales: routes, `ofertasLocalesDbSchema.ts`, `ofertasLocalesTypes.ts`, public helpers, publish mapper, two-lane pricing model.

Restaurante: `RestauranteAdStoryPreview.tsx`, `[slug]/page.tsx`, `RestaurantContactHub.tsx`, package plans.

## Files changed

- `app/lib/clasificados/restaurantes/restaurantesOffersComboPricing.ts`
- `app/lib/clasificados/restaurantes/restaurantesLinkedOffersTypes.ts`
- `app/lib/clasificados/restaurantes/restaurantesLinkedOffersQuery.ts`
- `app/(site)/clasificados/restaurantes/shell/RestauranteOffersPreviewStrip.tsx`
- `app/(site)/clasificados/restaurantes/shell/RestauranteAdStoryPreview.tsx`
- `app/(site)/clasificados/restaurantes/[slug]/page.tsx`
- `app/lib/clasificados/restaurantes/RESTAURANTES_OFFERS1_AUDIT.md`
- `scripts/restaurantes-offers1-audit.ts`
- `package.json`

## Intentionally not touched

Restaurante form/publish/media/video/analytics, Ofertas Locales publish flow, Stripe, migrations, dashboard, other categories.

## DEFERRED items

1. Write `linkedRestaurantePublicListingId` on Ofertas publish (REST-OFFERS2)
2. Combo entitlement / billing (REST-OFFERS2 or billing gate)
3. Restaurant-filtered “Ver todas” on Ofertas hub

## Manual QA checklist

- [ ] Published restaurant with no linked offers — no strip visible
- [ ] Manually set `draft_snapshot.linkedRestaurantePublicListingId` on approved offer — strip shows up to 3 cards
- [ ] Expired offers excluded
- [ ] Preview form — no strip
- [ ] `npm run restaurantes:offers1-audit` PASS
- [ ] `npm run build` PASS

## Gate A status table

| Item | Status |
| ---- | ------ |
| Routes inspected | PASS |
| Public results/detail documented | PASS |
| Data/API documented | PASS |
| Link key | DEFERRED (contract READY, data empty) |
| No fake strategy | PASS |
| Gate A no edits | PASS |

## Gate B status table

| Item | Status |
| ---- | ------ |
| $399 documented | PASS |
| $199 documented | PASS |
| $499 combo | PASS |
| +$100 add-on logic | PASS |
| Client copy | PASS |
| CEO/CFO/client rationale | PASS |
| No payment change | PASS |
| No fake entitlement | PASS |

## Gate C status table

| Item | Status |
| ---- | ------ |
| Placement after hub | FIXED |
| Hides without offers | PASS |
| No fake coupons | PASS |
| Query explicit link only | READY |
| Shell preserved | PASS |
| Mobile safe | PASS |
| Food/media order preserved | PASS |

## Next recommended gate

**REST-OFFERS2** — Ofertas publish writes `linkedRestaurantePublicListingId`, combo entitlement check, optional seller UI to pick linked restaurant.
