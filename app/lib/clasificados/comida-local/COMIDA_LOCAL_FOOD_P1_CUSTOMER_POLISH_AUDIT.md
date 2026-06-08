# Gate FOOD-P1 — Comida Local Customer-Facing Polish + Flow Verification

## 1. Gate title

Gate FOOD-P1 — Comida Local Customer-Facing Polish + Flow Verification

## 2. Gate type

BUILD-REQUIRED

## 3. Preflight status

- `git status --short` at gate start: **clean** (no unrelated dirty files).
- Scope limited to customer-facing Comida Local routes and `comidaLocalCustomerStyles.ts`.

## 4. Files inspected

- `app/(site)/clasificados/comida-local/page.tsx`
- `app/(site)/clasificados/comida-local/[slug]/page.tsx`
- `app/(site)/clasificados/comida-local/components/ComidaLocalListingCard.tsx`
- `app/(site)/clasificados/comida-local/components/ComidaLocalDetailShell.tsx`
- `app/(site)/clasificados/comida-local/components/ComidaLocalResultsFilters.tsx`
- `app/(site)/clasificados/comida-local/components/ComidaLocalContactActions.tsx`
- `app/(site)/clasificados/comida-local/preview/page.tsx`
- `app/(site)/clasificados/comida-local/preview/ComidaLocalPreviewClient.tsx`
- `app/(site)/publicar/comida-local/page.tsx`
- `app/(site)/publicar/comida-local/ComidaLocalApplicationClient.tsx`
- `app/(site)/publicar/comida-local/ComidaLocalValidationPanel.tsx`
- `app/lib/clasificados/comida-local/comidaLocalPublicInventoryErrors.ts`
- `app/lib/clasificados/comida-local/mapComidaLocalPublicListing.ts`

## 5. Files changed

- `app/(site)/clasificados/comida-local/components/comidaLocalCustomerStyles.ts` (new — shared tokens)
- `app/(site)/clasificados/comida-local/page.tsx`
- `app/(site)/clasificados/comida-local/components/ComidaLocalListingCard.tsx`
- `app/(site)/clasificados/comida-local/components/ComidaLocalResultsFilters.tsx`
- `app/(site)/clasificados/comida-local/components/ComidaLocalDetailShell.tsx`
- `app/(site)/clasificados/comida-local/[slug]/page.tsx`
- `app/(site)/clasificados/comida-local/preview/ComidaLocalPreviewClient.tsx`
- `app/(site)/publicar/comida-local/ComidaLocalApplicationClient.tsx`
- `app/(site)/publicar/comida-local/ComidaLocalValidationPanel.tsx`
- `scripts/comida-local-food-p1-customer-polish-audit.ts` (new)
- `app/lib/clasificados/comida-local/COMIDA_LOCAL_FOOD_P1_CUSTOMER_POLISH_AUDIT.md` (new)
- `package.json` — audit script only

No publish API, migration, payment, admin, or global nav changes.

## 6. Results page polish result

- Compact header with eyebrow “Vendedores locales”, clear value prop vs Restaurante Premium.
- Burgundy CTA “Publicar tu puesto” aligned right on desktop.
- Compact filter panel (`Filtrar resultados`, 5-column desktop grid).
- Customer-safe empty/error states preserved (FOOD-L9B).
- Deduplicated error messaging (banner + panel, no raw schema text).
- Cream/ivory palette, `rounded-lg`, charcoal text, gold/bronze borders.

## 7. Public card polish result

- Stable 4:3 image ratio, `object-cover object-center`, clickable image → detail.
- Clean placeholder “Sin foto principal” (no fake stock).
- Compact typography, max 3 chips from mapper (unchanged logic).
- Primary “Ver ficha”; Llamar/WhatsApp only when real hrefs exist.
- Hover shadow; no fake metrics or restaurant CTAs.

## 8. Detail page polish result

- Lightweight vendor header (not restaurant hero): photo, name, food type, city.
- Contact actions in header strip for thumb reach on mobile.
- Sections only when data present (`vm.sections.*` guards unchanged).
- Leonix ID footer only when published row has real `leonix_ad_id`.
- Back link + “Ficha pública” eyebrow in top bar.

## 9. Application form polish result

- `rounded-lg` panels, section titles with burgundy left border.
- Tighter header spacing; draft notice readability.
- Preview/publish action cards with clearer hierarchy (soft vs accent border).
- Publish logic unchanged (`postComidaLocalPublishApi`); no new fields.

## 10. Preview page polish result

- Clear “Vista previa · no publicada” banner; explains no Leonix ID / not in results.
- “Editar formulario” + “Ir a publicar” links (preview does not call publish API).
- Uses same `ComidaLocalDetailShell` without `leonixAdId` prop.
- Partial preview issues list preserved.

## 11. Empty/error state result

| State | Copy | Safe? |
|-------|------|-------|
| Zero rows | Aún no hay publicaciones de Comida Local. | Yes |
| Filters empty | No hay fichas publicadas con estos filtros. | Yes |
| DB/table error | Resultados temporalmente no disponibles. | Yes |
| Raw PostgREST | Not rendered | Yes |

## 12. Function smoke check result

| # | Check | Result |
|---|-------|--------|
| 1 | Results page loads | PASS — server component + queries |
| 2 | Empty state clean | PASS |
| 3 | DB error customer-safe | PASS |
| 4 | Card → detail via Ver ficha | PASS |
| 5 | Detail notFound on missing slug | PASS |
| 6 | Contact links only with real data | PASS — conditional hrefs + section guards |
| 7 | Preview no publish/track fake ID | PASS — no publish API; no leonixAdId prop |
| 8 | Application publish flow intact | PASS — handlePublish unchanged |
| 9 | No fake data added | PASS |
| 10 | No unrelated categories touched | PASS |

## 13. Desktop result

Centered `max-w-6xl` results, 3-column card grid, side-by-side header CTA, compact filter row.

## 14. Mobile result

Stacked header/filters/cards; `min-w-0` on grid items; 44px-ish contact targets; no horizontal overflow on chips/CTAs.

## 15. What is intentionally deferred

- Admin workspace polish
- User dashboard (`mis-anuncios`) wiring
- Stripe checkout / package upsell UI
- Global navigation / categoryConfig
- Card “Plus” featured badge (only when real package tier UI is scoped)
- Restaurant-style contact hub, menus, reservations

## 16. Screenshot checklist

- [ ] `/clasificados/comida-local` — header + filters + empty OR grid
- [ ] `/clasificados/comida-local` — DB unavailable state (staging without table)
- [ ] Card with photo + chips + CTAs
- [ ] `/clasificados/comida-local/[slug]` — public detail with contact row
- [ ] `/clasificados/comida-local/preview` — preview banner + detail shell
- [ ] `/publicar/comida-local` — form section + validation panel
- [ ] `/publicar/comida-local` — preview + publish action cards
- [ ] Mobile 390px width for results + detail

## 17. Risks / deferred work

- Visual tokens are Comida-local-scoped only; global design system not updated.
- Plus-tier visual differentiation on cards still minimal until FOOD-L5E/L10 package UI.
- L7A dashboard gap for owners managing listings.

## TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Repo state was inspected before edits | TRUE | Clean preflight |
| Results page was polished | TRUE | `page.tsx` + customer styles |
| Public card was polished | TRUE | `ComidaLocalListingCard.tsx` |
| Public detail was polished | TRUE | `ComidaLocalDetailShell.tsx`, `[slug]/page.tsx` |
| Application form was polished | TRUE | `ComidaLocalApplicationClient.tsx` |
| Preview page was polished | TRUE | `ComidaLocalPreviewClient.tsx` |
| Empty state is customer-safe | TRUE | `COMIDA_LOCAL_RESULTS_EMPTY_MESSAGE_ES` |
| DB error state is customer-safe | TRUE | `COMIDA_LOCAL_RESULTS_UNAVAILABLE_MESSAGE_ES` |
| Raw Supabase errors are not exposed to customers | TRUE | No schema-cache strings in page |
| Public card uses real data only | TRUE | `mapComidaLocalRowToCardVm` |
| Public detail uses real data only | TRUE | `getPublishedComidaLocalListingBySlug` |
| Preview does not show fake Leonix ID | TRUE | No `leonixAdId` prop in preview |
| Contact actions hide when empty | TRUE | `ComidaLocalContactActions` + section guards |
| Restaurant-only CTAs are excluded | TRUE | Audit script grep |
| No fake listings were added | TRUE | No hardcoded arrays |
| No fake ratings/reviews/counters were added | TRUE | No metric strings |
| No fake analytics were added | TRUE | Existing real events only on public detail/card |
| No fake paid status was added | TRUE | No payment UI changes |
| No Restaurante files were edited | TRUE | git diff scope |
| No unrelated category files were edited | TRUE | git diff scope |
| No admin polish was attempted | TRUE | No admin path edits |
| Mobile layout remains clean | TRUE | flex/grid min-w-0, compact spacing |
| Audit script passed | TRUE | `npm run comida-local:food-p1-customer-polish-audit` |
| npm run build passed | TRUE | gate validation |
