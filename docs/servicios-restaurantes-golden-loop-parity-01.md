# SERVICIOS-RESTAURANTES-GOLDEN-LOOP-PARITY-01

## 1. Gate title
Servicios → Restaurantes owner-edit **golden loop** parity. Close the full dashboard edit loop so dashboard context and listing identity survive from entry → steps → preview → "Volver a editar" → save/update, matching the Restaurante pattern end-to-end.

## 2. Chuy QA failure
After the hard-route fix, "Editar anuncio" correctly reached `/publicar/servicios?...source=dashboard...listingId...` and the saved listing loaded. Preview could render the real listing. **But** internal navigation still dropped context:
- Preview "Volver a editar" returned to `/publicar/servicios?lang=es&product=servicios_profesionales` (new blank product flow).
- "Cambiar plan" / top back link routed to the new-listing checkpoint.
- Going to preview from a dashboard edit did not carry listing identity, so the preview's back link fell back to checkpoint.

## 3. Why the route fix alone was not enough
The hard-fix only fixed the **entry** href from the dashboard. It copied Restaurante's first route, not the whole loop. Internal Servicios navigation (preview back link, change-plan link, goPreview) regenerated URLs from scratch without dashboard context, so identity was lost after the first hop.

## 4. Restaurante golden loop inspected (read-only)
- `restaurantesDashboardCouponAddonCheckout.ts`: `restauranteListingEditHref`, `restauranteCouponEditHref`, `restauranteCouponAddonHref` build **direct** `/publicar/restaurantes?source=dashboard&mode=...&listingId=...` routes — never checkpoint, never product param.
- `RestauranteApplicationClient.tsx`: parses `source/mode/listingId/leonixAdId/focus/returnPanel`, defines `isExistingDashboardListingMode` before product/new-listing init, and `goPreview` returns early / preserves dashboard mode so the loop never re-enters new-product flow.

## 5. Servicios context-drop sources found
1. `ClasificadosServiciosPreviewClient.tsx` line ~113/493: main "Volver a editar" used a **checkpoint** `editHref` even for dashboard listing previews (the computed listing-bound href was not wired into the return bar).
2. `ClasificadosServiciosApplication.tsx` `goStrictPreview`/`previewHref`: always used the plain `/clasificados/publicar/servicios/preview` route with **no** dashboard identity, so the preview lost `source/listingId` and fell back to checkpoint on return.
3. `ClasificadosServiciosApplication.tsx` "Cambiar plan" link → `/clasificados/publicar/servicios/checkpoint` (context drop in dashboard mode).
4. Top back link → `/clasificados/publicar` hub (context drop in dashboard mode).
5. Preview publish did not prime the existing slug → risk of a **duplicate** listing on publish-from-preview.

## 6. Files changed
- `app/(site)/dashboard/lib/serviciosDashboardOffersAddonCheckout.ts` — added `buildServiciosDashboardListingContextParams`, `serviciosBackToEditHrefFromPreview`; extended `serviciosListingPreviewHref` with mode/focus.
- `app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx` — dashboard-mode `previewHref` → listing-bound preview with identity/mode/focus; "Cambiar plan" and top back link route to dashboard in existing-listing mode.
- `app/(site)/clasificados/publicar/servicios/preview/ClasificadosServiciosPreviewClient.tsx` — "Volver a editar" uses `serviciosBackToEditHrefFromPreview` (preserves mode/focus/identity); primes existing slug for identity-safe publish.
- `docs/servicios-restaurantes-golden-loop-parity-01.md`, `scripts/verify-...mjs`, `scripts/smoke-...mjs`, `package.json`.

## 7. Servicios golden loop implementation
`buildServiciosDashboardListingContextParams` centralizes `edit=1`, `source=dashboard`, `mode`, `focus`, `listingId`, `listingSlug`, `leonixAdId`, `returnPanel=servicios`. Every dashboard-bound href (edit, offers, preview, back-to-edit) derives from this contract and targets `/publicar/servicios` (app) or `/clasificados/publicar/servicios/preview` (preview). No builder emits checkpoint or `product=servicios_profesionales`.

## 8. Preview "Volver a editar" fix
The return bar `editHref` is now:
- dashboard listing preview → `serviciosBackToEditHrefFromPreview({ ...identity, mode, focus })` → `/publicar/servicios?edit=1&source=dashboard&mode=listing-edit|offers-edit&...`.
- new application → the existing checkpoint href (unchanged).
`mode`/`focus` are read from the preview URL so an offers-edit preview returns to the offers step.

## 9. Save/update existing listing behavior
The publish API (`app/api/clasificados/servicios/publish/route.ts`) already performs an **update by slug** when `existingPublicSlug` is present and owned (no base recharge, no duplicate, coupons/media preserved). The app edit flow primes the slug on hydration; the preview listing-bound branch now also calls `primeServiciosExistingPublicSlug(hydrated.editIdentity.slug)` so publish-from-preview updates the same listing. No schema/Stripe changes.

## 10. Dashboard surfaces fixed
- `Mis anuncios` (`dashboardInventory.ts`): edit → `serviciosListingEditHref`, preview → `serviciosListingPreviewHref`, offers → `serviciosOffersEditHref`.
- `/dashboard/servicios`: edit + preview + offers use the same golden-loop helpers. Public/results/analytics/management routes unchanged.

## 11. Forbidden routes (for existing dashboard listings)
- `/clasificados/publicar/servicios/checkpoint`
- `/publicar/servicios?...product=servicios_profesionales`
- any preview/back route missing `source=dashboard` + listing identity.

## 12. Allowed routes
- Edit: `/publicar/servicios?edit=1&source=dashboard&mode=listing-edit&listingId=...&listingSlug=...&leonixAdId=...&returnPanel=servicios`
- Offers edit: `...&mode=offers-edit&focus=coupon-upgrade`
- Preview: `/clasificados/publicar/servicios/preview?...&preview=listing&source=dashboard&...`
- Back-to-edit: identical to Edit/Offers edit (mode/focus preserved).

## 13. Smoke strategy
`smoke-servicios-restaurantes-golden-loop-parity-01.mjs` generates edit, preview, back-to-edit, and offers-edit hrefs and asserts: `source=dashboard`, listing identity present, `preview=listing` for preview, `mode`/`focus` preserved, and **no** checkpoint / product param anywhere. It also asserts dashboard surfaces reference the helpers.

## 14. What was protected
- No Stripe price/webhook changes.
- No Supabase migration/schema changes.
- No Restaurante runtime changes (read-only reference).
- No unrelated category changes.
- Publish/media guards, P0A/P0B/P0C, owner CTA + edit hydration standards preserved (verifiers chained).

## 15. Manual QA URLs
1. `https://leonixmedia.com/dashboard/mis-anuncios?lang=es&cat=servicios` → Editar anuncio → confirm `/publicar/servicios?...source=dashboard&mode=listing-edit...`, saved data loads → preview → **Volver a editar** returns to same edit URL (not product route).
2. Servicios preview (from dashboard edit): Volver a editar preserves identity, no `product=servicios_profesionales`, no checkpoint.
3. Servicios coupon section: from dashboard edit → Cupones y ofertas → edit coupon → preview → Volver a editar → coupon context preserved.
4. `https://leonixmedia.com/dashboard/mis-anuncios?lang=es&cat=restaurantes` → Restaurante behavior unchanged (regression check).

## 16. TRUE/FALSE audit
- Restaurante golden loop inspected: TRUE
- Servicios context drops found: TRUE
- Servicios dashboard context builder created/strengthened: TRUE
- Servicios edit route direct app: TRUE
- Servicios edit route avoids checkpoint: TRUE
- Servicios edit route avoids product param: TRUE
- Servicios app preserves dashboard context through preview: TRUE
- Servicios preview Volver a editar preserves identity: TRUE
- Servicios preview Volver a editar avoids product route: TRUE
- Servicios preview Volver a editar avoids checkpoint: TRUE
- Servicios coupon focus preserved: TRUE
- existing listing save/update path safe (update by slug, no duplicate): TRUE
- Mis anuncios fixed: TRUE
- /dashboard/servicios fixed: TRUE
- no Stripe/Supabase/Restaurante runtime changed: TRUE

## 17. READY TO COMMIT status
READY TO COMMIT: YES
