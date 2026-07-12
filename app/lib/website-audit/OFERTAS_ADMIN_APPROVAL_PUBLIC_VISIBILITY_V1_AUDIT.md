# Ofertas Admin Approval Public Visibility V1 Audit

## 1. Task classification

**SCOPED GATED BUILD** — Ofertas Admin Approval Activation V1: make approved offers and approved items public after admin approval, without Stripe or payment wiring.

## 2. Files inspected

- `app/api/ofertas-locales/publish/route.ts`
- `app/api/ofertas-locales/admin/[id]/review/route.ts`
- `app/api/ofertas-locales/items/[itemId]/route.ts`
- `app/api/ofertas-locales/public-offers/route.ts`
- `app/api/ofertas-locales/public-search/route.ts`
- `app/lib/ofertas-locales/ofertasLocalesAdminReviewMutations.ts`
- `app/lib/ofertas-locales/ofertasLocalesPublishMapper.ts`
- `app/lib/ofertas-locales/ofertasLocalesPublicOfferHelpers.ts`
- `app/lib/ofertas-locales/ofertasLocalesPublicSearchHelpers.ts`
- `app/lib/ofertas-locales/ofertasLocalesItemReviewActivation.ts`
- `app/lib/ofertas-locales/ofertasLocalesItemReviewMapper.ts`
- `app/lib/ofertas-locales/ofertasLocalesTypes.ts`
- `app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx`
- `app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicOfferCard.tsx`
- `app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicItemCard.tsx`
- `app/(site)/clasificados/ofertas-locales/[id]/page.tsx`
- `scripts/ofertas-locales-stack-e-shopping-list-audit.ts`
- `app/lib/website-audit/OFERTAS_PUBLIC_DATA_VISIBILITY_AUDIT.md`

## 3. Files changed

- `app/lib/ofertas-locales/ofertasLocalesItemReviewActivation.ts` — exported `shouldOfertaLocalItemBePubliclyActive`; centralized activation rule
- `app/lib/ofertas-locales/ofertasLocalesAdminReviewMutations.ts` — extracted `syncOfertaLocalItemsActivationAfterAdminReview`; error handling on item sync; rollback parent on sync failure; set `published_at` on approve
- `app/api/ofertas-locales/admin/[id]/review/route.ts` — revalidate `/clasificados/ofertas-locales/results` after admin review
- `scripts/ofertas-locales-stack-e-shopping-list-audit.ts` — activation pipeline structure checks
- `app/lib/website-audit/OFERTAS_ADMIN_APPROVAL_PUBLIC_VISIBILITY_V1_AUDIT.md` — this audit

## 4. Approval pipeline map

| Step | Location | Behavior |
|------|----------|----------|
| Publish | `POST /api/ofertas-locales/publish` → `ofertasLocalesPublishMapper` | Parent `status = pending_review` |
| Admin approve parent | `POST /api/ofertas-locales/admin/[id]/review` → `mutateOfertaLocalAdminReview` | Parent `status = approved`, `published_at` set |
| Activate approved items on parent approve | `syncOfertaLocalItemsActivationAfterAdminReview` | Bulk `is_active = true` where `review_status = approved` |
| Deactivate on reject/archive | same sync helper | All child items `is_active = false` |
| Item approve before parent | Item PATCH → `resolveOfertaLocalItemIsActiveOnReviewPatch` | `is_active = false` until parent approved |
| Item approve after parent | Item PATCH → same resolver | `is_active = true` immediately |
| Public offers | `GET /api/ofertas-locales/public-offers` | `.eq("status", "approved")` |
| Public products | `GET /api/ofertas-locales/public-search` | `review_status=approved` + `is_active=true` + parent `status=approved` |
| Cupones | separate surface | Product shopping list hidden via `!isCupones` gate in search client |

## 5. Activation bug classification

**Primary:** G — no code bug blocking visibility; production needs admin-approved listing + approved active items.

**Secondary robustness (fixed):** Admin item activation/deactivation previously ignored Supabase errors. Now errors are checked; parent status rolls back if item sync fails after approve.

**Ruled out:**

- A — parent approval activating approved items: code existed; hardened
- B — item approval after parent approved: `resolveOfertaLocalItemIsActiveOnReviewPatch` handles this
- C/D — public API filters use correct field names
- E/F — public mappers include card/cart fields; join select present

## 6. Exact fix

| File | Function | Old behavior | New behavior | Why safe |
|------|----------|--------------|--------------|----------|
| `ofertasLocalesAdminReviewMutations.ts` | `syncOfertaLocalItemsActivationAfterAdminReview` | Inline update, errors ignored | Exported helper; checks errors; returns failure codes | Prevents silent failure leaving approved parent with inactive items |
| `ofertasLocalesAdminReviewMutations.ts` | `mutateOfertaLocalAdminReview` | No rollback on item sync fail | Reverts parent status if item sync fails | Keeps parent/items consistent |
| `ofertasLocalesAdminReviewMutations.ts` | approve branch | No `published_at` | Sets `published_at` on approve | Standard publish timestamp; no schema change |
| `ofertasLocalesItemReviewActivation.ts` | `shouldOfertaLocalItemBePubliclyActive` | Logic only in resolver | Explicit exported rule | Single source of truth for audits/tests |
| `admin/[id]/review/route.ts` | POST success | Revalidated landing only | Also revalidates results path | Cache freshness after approval |

No schema/RLS changes required.

## 7. Public API safety gates

- **public-offers:** parent `status = approved` only
- **public-search:** item `review_status = approved`, `is_active = true`, joined parent `status = approved`
- **pending/rejected/draft/archived:** excluded by filters; not loosened
- **No fake data** seeded in this build

## 8. Offer card → public hub path

- `OfertasLocalesPublicOfferCard` links via `ofertaLocalPublicDetailPath(offer.id, lang)` → `/clasificados/ofertas-locales/[id]`
- Public detail page fetches approved offer by id with eligibility check
- No card/hub redesign in this build

## 9. Product → drawer → shopping list path

- `OfertasLocalesPublicItemCard` passes add handlers
- `OfertasLocalesPublicItemDetailDrawer` receives `isAdded`, `onAdd`, `onRemove`, `onOpenList`
- `useOfertasLocalesShoppingList` persists locally; no checkout/payment
- Public search mapping includes fields needed for list items
- Cupones surface hides floating product cart (`!isCupones`)

## 10. Intentionally not touched

- Landing UI shell
- Results UI shell / mode intro design
- Preview page visual design
- Product card / cart panel design
- Supabase schema, migrations, RLS
- Stripe / payment / checkout
- Auth (beyond existing admin cookie gate)
- Other clasificados categories
- AI scan/crop engine
- categoryStandardV2

## 11. Remaining manual QA steps

1. Publish an Ofertas listing (enters `pending_review`).
2. In admin, approve individual product items.
3. Approve the parent listing.
4. Open flyer results: `/clasificados/ofertas-locales/results?lang=es&offerType=weekly_flyer&mode=flyers` — confirm offer appears.
5. Open product search: `/clasificados/ofertas-locales/results?lang=es&q=tomate&mode=products` — confirm approved products appear.
6. Open product drawer, add to Lista de compras, confirm badge updates.
7. Open offer card → public hub `/clasificados/ofertas-locales/[id]`.
8. Open Cupones — confirm product shopping cart does not appear.

## 12. TRUE/FALSE audit

| Check | Result |
|-------|--------|
| Landing shell untouched | TRUE |
| Results shell untouched | TRUE |
| Preview page untouched | TRUE |
| Cart preserved | TRUE |
| Cupones shopping-list hidden preserved | TRUE |
| Parent approval path inspected | TRUE |
| Item approval path inspected | TRUE |
| Admin approval activates approved items | TRUE |
| Item approval respects parent status | TRUE |
| Public offers require parent approved | TRUE |
| Public items require approved + active + approved parent | TRUE |
| Pending/rejected data stays private | TRUE |
| No fake data created | TRUE |
| No DB/schema touched | TRUE |
| No RLS/policy touched | TRUE |
| No Stripe/payment touched | TRUE |
| No admin/dashboard redesign | TRUE |
| No other categories touched | TRUE |
| Build passed | (see Gate 9) |
| Audit complete | TRUE |
