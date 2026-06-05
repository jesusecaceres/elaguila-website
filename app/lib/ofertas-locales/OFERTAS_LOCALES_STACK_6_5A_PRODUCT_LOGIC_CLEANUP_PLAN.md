# Stack 6.5A — Ofertas Locales — Product Logic Cleanup Plan (Gate A)

## 1. Current product logic issues

- Single long form with mixed ES/EN copy on one screen
- `marketType === other` shows “Otro” with no custom input
- Magazine pickup partner section dominates the flow
- Full internal pricing table (8 packages) shown in application
- Business-editable membership CTA label adds confusion
- Coupon and weekly flyer flows share identical fields
- File upload confirmation language inconsistent
- No AI add-on intent toggle (only future teaser text)

## 2. “Otro” custom field plan

Add `customMarketType` to draft. Show field when `marketType === other`. Helper `getOfertaLocalMarketDisplayLabel(draft)` returns custom text for search/preview when set.

## 3. Location/map/search/filter plan

Improve city/address/directions copy for future filters. Confirm address when city+ZIP present; confirm map link when `directionsUrl` validates. No new global city autocomplete (NorCal list exists elsewhere — deferred).

## 4. Phone formatting plan

Centralize `formatOfertaLocalPhoneDisplay` in `ofertasLocalesFormatting.ts` as `(xxx) xxx-xxxx` for US 10-digit input.

## 5. Membership simplification plan

Hide `membershipCtaLabel` input. Standard shopper CTAs: “Regístrate antes de ir” / “Sign up before you go”. Digital: “Activar cupones digitales” / “Activate digital coupons”.

## 6. Leonix Partner callout plan

Remove main magazine pickup form section. Replace with compact “Leonix Partner” contact callout linking to `/contacto`.

## 7. Digital-only pricing display plan

Show only `digitalCouponListing`, `digitalWeeklySpecials`, `aiSearchableSpecialsAddOn` from existing `OFERTAS_LOCALES_PRICING` constants. Add more-exposure contact copy for print packages.

## 8. AI add-on intent plan

Add `wantsAiSearchableSpecials` boolean + checkbox with explanation. Preview shows interest note only — not active AI.

## 9. Offer-type conditional UI plan

| offerType | Emphasis |
|-----------|----------|
| weekly_flyer | flyer title, flyer assets, dates; coupon secondary |
| coupon | coupon text, coupon assets, dates; hide flyer title/assets |
| promotion/seasonal/bundle/featured | general description + both asset sections |

## 10. File/PDF/URL/archive confirmation plan

Standard labels: upload pending, file received, link accepted, PDF card (no image preview for PDF).

## 11. What will not be touched

- Pricing constants values
- Upload API behavior
- DB migrations / publish API
- Header/nav, admin, other categories
- Analytics, Stripe, public results

## 12. Production QA URLs

- https://www.leonixmedia.com/publicar/ofertas-locales?lang=es
- https://www.leonixmedia.com/publicar/ofertas-locales?lang=en
- https://www.leonixmedia.com/publicar/ofertas-locales/preview?lang=es
- https://www.leonixmedia.com/publicar/ofertas-locales/preview?lang=en
