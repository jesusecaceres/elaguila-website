# Ofertas Public Shell Shopper Modes Standard V1 — Audit

## Task classification
SCOPED GATED BUILD — Ofertas public landing + results shell and shopper mode identity.

## Branch / HEAD
- Branch: `main`
- HEAD: `0386eee1f95362f37e9de2e29198e521685a5d65`

## Initial dirty state
Unrelated dirty files in Rentas lifecycle/dashboard/admin (not part of this gate). Ofertas/Cupones prior work committed. No staged files at gate start.

## Files inspected
Rentas/Bienes landing and results shells (read-only), `categoryStandardV2/*`, `OfertasLocalesPublicSearchClient.tsx`, `ofertasLocalesPublicSearchCopy.ts`, Ofertas route pages, stack E audit script.

## Files changed
- `app/(site)/clasificados/components/categoryStandardV2/LeonixCategoryPageShell.tsx`
- `app/(site)/clasificados/components/categoryStandardV2/constants.ts`
- `app/(site)/clasificados/components/categoryStandardV2/LeonixCategoryHeroGateway.tsx`
- `app/(site)/clasificados/components/categoryStandardV2/types.ts`
- `app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx`
- `app/(site)/clasificados/ofertas-locales/ofertasLocalesPublicSearchCopy.ts`
- `scripts/ofertas-locales-stack-e-shopping-list-audit.ts`
- `app/lib/website-audit/OFERTAS_PUBLIC_SHELL_SHOPPER_MODES_STANDARD_V1.md` (this file)

## Rentas/Bienes measurements extracted
| Token | Exact value |
|-------|-------------|
| Safe top | `pt-[calc(5rem+env(safe-area-inset-top,0px))] sm:pt-12 lg:pt-14` |
| Max width | `max-w-[1280px]` |
| Landing padding | `px-3.5 pb-14 sm:px-5 lg:px-6` |
| Results padding | `px-3.5 pb-12 sm:px-5 lg:px-6` |
| Page bg landing | `bg-[#F3EBDD] text-[#1F241C]` |
| Gateway panel | `rounded-xl border border-[#C9A84A]/40 bg-[#FFFDF7]/88 shadow-[0_16px_48px_-24px_rgba(42,36,22,0.28)] backdrop-blur-[2px] sm:rounded-2xl` |
| Primary CTA landing | `shadow-[0_12px_24px_-16px_rgba(122,30,44,0.65)] hover:shadow-[0_16px_28px_-16px_rgba(122,30,44,0.75)]` |

## Results clipping root cause
`LeonixCategoryPageShell` applied `LEONIX_HEADER_SAFE_TOP` only on landing, not results — hero clipped under global nav.

## Results top-safe fix
Both landing and results lanes now receive `LEONIX_HEADER_SAFE_TOP`.

## Shared lane contract
Landing uses `LEONIX_LANDING_SHELL` (1280px + horizontal padding). Results uses `LEONIX_RESULTS_SHELL` with matching horizontal padding.

## Mode parser architecture
Centralized in `ofertasLocalesPublicSearchCopy.ts`:
- `resolveOfertasLocalesShopperMode`
- `ofertasLocalesShopperModePresentation`
- `filterOfertasLocalesOffersForShopperMode`
- `filterOfertasLocalesItemsForShopperMode`

## Mode title/description table
| Mode | ES title | Composition |
|------|----------|-------------|
| all | Todas las ofertas | Offers + items sections |
| flyers | Volantes semanales | weekly_flyer offers only |
| products | Productos encontrados | Items only |
| coupons | Cupones | coupon offers only |
| promos | Promociones | promotion offers only |
| stores | Tiendas locales | retail / flyer store cards |
| food | Comida y mercados | food-category offers |
| services | Servicios locales | service marketType offers |

## Empty-state table
Mode-specific `emptyTitle` / `emptyHint` in `RESULT_MODE_COPY`; pipeline and filtered states preserved.

## Landing route map
Discovery intents unchanged: flyers, coupons, promos, stores, services, food → results with mode + query params.

## Card / shopping-list / Cupones
Cards, drawers, Lista de compras, public hub untouched. Cupones `!isCupones` gates preserved.

## TRUE/FALSE audit
See final gate report rows.
