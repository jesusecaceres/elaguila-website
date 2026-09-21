# Leonix Viajes — Owner Manual QA

Local server: **http://localhost:3003**  
Branch: `integration/viajes-launch-qa-2026-08`  
Certified base: `f563cdf336173625138c8f427d57754f92dc592f`

Sign in with your real owner/admin accounts where required. Do not paste credentials into chat or evidence files.

## Quick URLs (live QA)

- Landing: http://localhost:3003/clasificados/viajes
- Results: http://localhost:3003/clasificados/viajes/resultados
- Filtered: http://localhost:3003/clasificados/viajes/resultados?lang=es&budget=economico&from=san-jose
- Sort newest: http://localhost:3003/clasificados/viajes/resultados?lang=es&sort=newest
- Sort priceAsc: http://localhost:3003/clasificados/viajes/resultados?lang=es&sort=priceAsc
- Sort priceDesc: http://localhost:3003/clasificados/viajes/resultados?lang=es&sort=priceDesc
- Empty: http://localhost:3003/clasificados/viajes/resultados?lang=es&q=__no_match_empty_state_qa__
- Live offer (example): http://localhost:3003/clasificados/viajes/oferta/vj-pri-1785892005889-escapada-privada
- Live provider (example): http://localhost:3003/clasificados/viajes/negocio/agencia-vj-bus-1785891474965
- Business publisher: http://localhost:3003/publicar/viajes/negocios
- Private publisher: http://localhost:3003/publicar/viajes/privado
- Preview negocios: http://localhost:3003/clasificados/viajes/preview/negocios
- Preview privado: http://localhost:3003/clasificados/viajes/preview/privado
- Dashboard: http://localhost:3003/dashboard/viajes
- Admin queue: http://localhost:3003/admin/clasificados/viajes/business-offers

---

## A. Landing

1. Open http://localhost:3003/clasificados/viajes
2. Confirm Spanish-first hero, Leonix Viajes identity, compact search (not an oversized form).
3. Confirm departure framing uses **San José, California / SJC** (no SJO / Costa Rica departure).
4. Scroll: top offers, intent pills, local departures, nearby escapes, stays, mobility, providers, lower sections.
5. Confirm no star ratings, no fake verified badges, no fake scarcity/savings.
6. Resize / device: **390**, **768**, **1440** — no horizontal overflow.
7. Click a top offer → lands on offer detail or results browse as labeled.
8. Toggle EN via Viajes lang control → English copy present; global toggle unchanged.

## B. Results

1. Open http://localhost:3003/clasificados/viajes/resultados
2. Confirm compact header, truthful count, filters, active filters, sort control.
3. Apply filters: destination, from=`san-jose`, trip type=`tours`.
4. Confirm URL updates and refresh preserves state.
5. Browser back/forward restores prior state.
6. Sort through: featured → newest → priceAsc → priceDesc. Confirm order changes on representative cards.
7. Confirm **no** popularity / best-rated / savings sorts.
8. Open empty state: http://localhost:3003/clasificados/viajes/resultados?q=__no_match_empty_state_qa__
9. Use reset filters → returns to a usable default.
10. Cards: one primary **Ver oferta**, consistent image ratio, no contact CTA cluster, no fake discounts.
11. Mobile drawer and desktop filters agree (390 vs 1440).

## C. Business application

1. Open http://localhost:3003/publicar/viajes/negocios (sign in).
2. Complete all **5** steps: getaway → inclusions → media → business hub → review.
3. After each step: refresh — values persist.
4. Media: add photos, watch progress, **Cancel** mid-upload, **Retry**, reorder, set hero + results card, edit alt/focal.
5. Open Preview → return-to-edit with `stagedId` when editing an existing row.
6. Submit → enviado shows id, slug, lane.
7. Dashboard → edit same row → resubmit **same UUID** (no duplicate row).

## D. Private application

1. Open http://localhost:3003/publicar/viajes/privado (sign in).
2. Complete **4** steps: getaway → experience → contact → review.
3. Confirm private exact address defaults **not** public / **not** on map.
4. Preview/public must **not** show privateExact.
5. Submit → dashboard → public surfaces protect privateExact.

## E. Admin

1. Open http://localhost:3003/admin/clasificados/viajes/business-offers (staff auth).
2. Queue shows V1/V2 rows, lane, timestamps, hero, Ad ID when present.
3. Open detail: modules, media, public locations; privateExact staff-only and marked private.
4. Moderate approve → public offer uses **same UUID/slug**.

## F. Actions

On a live offer with real contact data, verify only valid channels render:

1. Call / SMS / WhatsApp / email / website / provider outbound / directions / share.
2. Confirm no `href="#"`, no dead buttons, outbound disclosure on affiliate/partner links.
3. Confirm privateExact never feeds public directions.

## G. ES/EN

1. Landing, results, detail, publisher, validation, dashboard/admin Viajes copy — Spanish default, English complete.
2. No raw translation keys; no mixed-language sentences in filters/sort/steps.

## H. Mobile

1. Real phone or 390 px: touch targets, sticky controls, keyboard, no horizontal overflow.

## I. Globalization handoff

Do **not** expect these to be complete in Viajes scope:

- Site-wide language toggle behavior
- Shared analytics event persistence
- Global like/save
- Global report/moderation pipeline
- Global sitemap registry
- Shared dashboard analytics shell
