# Stack E — Shopping List V1 Audit

## Gate A

- Audited `OfertaLocalPublicSearchItem`, public cards, detail drawer
- Stable public id + business grouping fields confirmed
- localStorage pattern aligned with restaurantes saved IDs

## Gate B

- `ofertasLocalesShoppingList.ts` — pure helpers, max 50 items, qty 1–99
- `useOfertasLocalesShoppingList.ts` — client hook
- `OfertasLocalesShoppingListPanel.tsx` — grouped drawer
- Wired add/remove on public item cards + list button

## Gate C

- Copy list to clipboard (plain text, grouped by business)
- Route CTA disabled with coming-next copy
- Full build at end

## Safety

- Only public search item fields stored
- No owner_id, internal_notes, Supabase, or API persistence
- No route builder / Maps optimization

## QA URLs

- https://www.leonixmedia.com/clasificados/ofertas-locales?lang=es
- https://www.leonixmedia.com/clasificados/ofertas-locales?lang=en

## Next stack

**Stack F — Route builder V1:** multi-stop directions from grouped list (max 5 stops), URL-based Maps links.
