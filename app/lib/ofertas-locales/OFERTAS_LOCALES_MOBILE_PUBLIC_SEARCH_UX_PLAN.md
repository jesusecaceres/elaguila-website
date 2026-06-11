# Ofertas Locales — Mobile-First Public Search UX Plan

## Current mobile UX issues

1. **Header overlap** — `py-8` only; sticky site header covers title on small screens.
2. **Hero too tall** — Three text blocks + list button in header row consume vertical space.
3. **Filter card too tall** — All 7 fields visible in one form on mobile before results.
4. **Results far below fold** — Large `mb-8` gaps between hero, form, and results.
5. **List button prominence** — Full-size pill next to title before any results.
6. **Typography/spacing** — Desktop-oriented padding (`py-10` empty states).
7. **Copy** — Hero body is long; pipeline empty title/body combined in one string.

## Proposed mobile layout

- `pt-14 sm:pt-16` top padding under sticky header.
- Compact hero: title + subtitle + short body line.
- Primary row (mobile): keyword input + Filtros toggle + small Lista button + compact Buscar.
- Collapsible advanced filters (`aria-expanded`) below `md` breakpoint.
- Compact empty state (`py-6`) closer to search.
- List button secondary when empty; badge when items exist.

## Desktop preservation

- Full filter grid from `md` breakpoint upward (unchanged fields).
- Mobile-only rows hidden on `md+`.
- Same URL query params and API fetch logic.

## Files to change

- `OfertasLocalesPublicSearchClient.tsx` — layout/styling
- `ofertasLocalesPublicSearchCopy.ts` — mobile copy + empty state split
- `OFERTAS_LOCALES_MOBILE_PUBLIC_SEARCH_UX_AUDIT.md`
- `scripts/ofertas-locales-mobile-public-search-ux-audit.ts`
- `package.json` — audit script

## Safety rules (unchanged)

- No edits to `public-offers` or `public-search` API routes.
- No weakening of approved/active/parent-approved filters.
- No exposure of pending/rejected/private metadata.
