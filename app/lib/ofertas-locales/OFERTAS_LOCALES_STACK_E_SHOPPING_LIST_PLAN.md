# Stack E — Shopping List V1 Plan

## 1. Current public search state

Stack D provides `/clasificados/ofertas-locales` with `OfertaLocalPublicSearchItem` from `GET /api/ofertas-locales/public-search`. Stable public `id`, business name, city/ZIP, price, contact CTAs, source asset href.

## 2. Shopping list item data shape

`OfertaLocalShoppingListItem`: public item id, name, price, unit, business name, city, zip, address, phone/website/directions/source hrefs, valid dates, quantity (1–99), note (max 140). No owner_id, internal_notes, or raw AI fields.

## 3. Local persistence strategy

**localStorage** key `leonix:ofertas-locales:shopping-list:v1`. Safe JSON parse, max 50 items, survives refresh. No API/DB.

## 4. Group-by-business strategy

Group key: normalized `businessName|city|zipCode`. Display store count + item count.

## 5. Add/remove/update behavior

Add from public card (no refetch). Remove, clear, quantity ±, optional note. Duplicate add increments quantity (cap 99).

## 6. Share/copy strategy

Plain-text clipboard copy grouped by business — item name, price, quantity. No internal IDs.

## 7. Route-builder readiness

List stores directions href per business for future route stack. Disabled CTA: “Shopping route coming next”.

## 8. What will not be implemented

Route optimization, Maps builder, account sync, DB, login, payment, analytics, nav changes, migrations.

## 9. QA URLs

- https://www.leonixmedia.com/clasificados/ofertas-locales?lang=es
- https://www.leonixmedia.com/clasificados/ofertas-locales?lang=en
- https://www.leonixmedia.com/publicar/ofertas-locales?lang=es
- https://www.leonixmedia.com/publicar/ofertas-locales?lang=en
