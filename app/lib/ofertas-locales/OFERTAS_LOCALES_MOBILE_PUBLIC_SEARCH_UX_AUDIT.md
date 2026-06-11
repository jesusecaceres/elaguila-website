# Ofertas Locales — Mobile Public Search UX Audit

Run: `npm run ofertas-locales:mobile-public-search-ux-audit`

## Scope
Mobile-first layout for `/clasificados/ofertas-locales` — UI only, no API/safety changes.

## Changes
- Top padding `pt-14 sm:pt-16` for sticky header clearance
- Mobile primary row: keyword + Filtros + Lista + Buscar
- Collapsible advanced filters below `md` with `aria-expanded`
- Desktop full filter grid preserved from `md` breakpoint
- Compact pipeline empty state with burgundy publish CTA
- List button de-emphasized when empty

## Safety
Public offer/search API routes not modified in this gate.
