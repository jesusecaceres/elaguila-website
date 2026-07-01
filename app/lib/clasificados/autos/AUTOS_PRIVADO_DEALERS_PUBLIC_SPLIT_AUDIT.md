# AUTOS PRIVADO / DEALERS DE AUTOS PUBLIC SPLIT AUDIT

## Objective

Split the public Autos marketplace into two launch-ready experiences:

- **Autos** — private seller vehicles (`lane=privado`, `seller=private`)
- **Dealers de Autos** — dealership/business inventory (`lane=negocios`, `seller=dealer`)

No publish/API/media/Stripe changes. No screenshots. Scoped public landing/results/routing only.

## Classification

**SCOPED GATED BUILD** — thin `market` prop on existing Autos landing/results components + new dealer routes + hub category card.

## Route inventory

| Route | Component | Purpose |
|---|---|---|
| `/clasificados/autos` | `AutosLandingPage market="private"` | Private seller landing |
| `/clasificados/autos/results` | `AutosPublicResultsShell market="private"` | Private seller results (default `seller=private`) |
| `/clasificados/dealers-de-autos` | `AutosLandingPage market="dealer"` | Dealer/business landing |
| `/clasificados/dealers-de-autos/results` | `AutosPublicResultsShell market="dealer"` | Dealer results (default `seller=dealer`) |

## Product split matrix

| Market | Default seller/lane | Data source | Publish CTA |
|---|---|---|---|
| Autos (private) | `seller=private` / privado | `useAutosPublicListingsFetch` + `applyAutosPublicFilters` | `/publicar/autos/privado` |
| Dealers de Autos | `seller=dealer` / negocios | same public listing fetch | `/publicar/autos/negocios` |

## Main /clasificados category card split

| Card | Explore | Post | Status |
|---|---|---|---|
| Autos | `/clasificados/autos?lang=` | `/publicar/autos/privado?lang=` | FIXED |
| Dealers de Autos | `/clasificados/dealers-de-autos?lang=` | `/publicar/autos/negocios?lang=` | FIXED |

## Landing cleanup

| Page | Section | Action | Reason |
|---|---|---|---|
| Autos private | Body-style image grid | REMOVED | Dealer clutter demoted |
| Autos private | Need-based image grid | REMOVED | Compact private focus |
| Autos private | Dealer spotlight / featured dealers | REMOVED | Private-seller focus |
| Autos private | 4-card lane cross-nav | REPLACED | Single peer link to Dealers |
| Dealers | Private fresh section | REMOVED | Dealer-focused |
| Dealers | Dealer spotlight + featured dealers | KEPT | Dealer inventory focus |

## Results defaults

- **Autos results:** redirects to `seller=private` when missing (private seller default)
- **Dealers results:** redirects to `seller=dealer` when missing (dealer/negocios default)
- Cross-link banner between markets on both results pages

## Chips

All chips route to real filter query params on the correct results base path. No fake filters.

## Mobile/PWA code check

- Search rows use `min-w-0`, single-column mobile grid, horizontal scroll chips, `min-h-[44px]` CTAs — no layout rewrite.

## Files changed

- `app/lib/clasificados/autos/autosPublicMarket.ts`
- `app/lib/clasificados/autos/autosPublicMarketCopy.ts`
- `app/lib/clasificados/autos/dealersDeAutosHubCategoryCopy.ts`
- `app/(site)/clasificados/autos/landing/AutosLandingPage.tsx`
- `app/(site)/clasificados/autos/components/public/AutosPublicResultsShell.tsx`
- `app/(site)/clasificados/autos/components/public/AutosPublicResultsQuickChips.tsx`
- `app/(site)/clasificados/autos/components/public/AutosMarketPeerCrossLink.tsx`
- `app/(site)/clasificados/autos/components/public/DealersDeAutosHubCategoryCard.tsx`
- `app/(site)/clasificados/autos/components/public/AutosPublicLanding.tsx`
- `app/(site)/clasificados/autos/page.tsx`
- `app/(site)/clasificados/autos/resultados/page.tsx`
- `app/(site)/clasificados/dealers-de-autos/page.tsx`
- `app/(site)/clasificados/dealers-de-autos/results/page.tsx`
- `app/(site)/clasificados/page.tsx`
- `app/(site)/clasificados/components/categoryStandard/CategoryStandardLandingPage.tsx` (optional title/description override)
- `app/lib/clasificados/clasificadosHubPageCopy/index.ts` (Autos card desc only)
- `scripts/autos-privado-dealers-public-split-audit.ts`
- `package.json` (audit script only)

## Hard locks

- no Stripe
- no Supabase schema / migrations
- no publish/API/media changes
- no screenshots
- no commit / push / stage

## Build result

Run `npm run build` at Gate 10.

## Final decision

**READY TO COMMIT** pending Chuy manual browser review of both public markets.
