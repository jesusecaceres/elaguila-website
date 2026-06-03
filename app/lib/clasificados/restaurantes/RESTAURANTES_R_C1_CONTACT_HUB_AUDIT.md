# Gate R-C1 — Restaurante Contact Hub Standardization

## Files inspected

- `app/(site)/servicios/components/ServiciosBusinessHubContactCard.tsx`
- `app/(site)/servicios/lib/mapServiciosProfileToBusinessHubContact.ts`
- `app/(site)/servicios/lib/serviciosBusinessHubSocialBrand.tsx`
- `app/(site)/servicios/components/ServiciosBusinessHubFauxMap.tsx`
- `app/(site)/servicios/components/ServiciosHubReviewLinkButton.tsx`
- `app/(site)/servicios/components/serviciosLeonixBrand.ts`
- `app/(site)/clasificados/restaurantes/application/buildRestaurantContactHub.ts`
- `app/(site)/clasificados/restaurantes/application/mapRestauranteDraftToShell.ts`
- `app/(site)/clasificados/restaurantes/shell/RestaurantContactHub.tsx`
- `app/(site)/clasificados/restaurantes/shell/RestaurantContactHubFauxMap.tsx`
- `app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx`
- `app/(site)/clasificados/restaurantes/shell/RestauranteDetailShell.tsx`
- `app/(site)/clasificados/restaurantes/shell/RestauranteAdStoryPreview.tsx`
- `scripts/restaurant-contact-hub-qa.ts`

## Files changed

- `app/(site)/clasificados/restaurantes/application/buildRestaurantContactHub.ts`
- `app/(site)/clasificados/restaurantes/application/mapRestauranteDraftToShell.ts`
- `app/(site)/clasificados/restaurantes/shell/RestaurantContactHub.tsx`
- `app/(site)/clasificados/restaurantes/shell/RestaurantContactHubFauxMap.tsx`
- `app/(site)/clasificados/restaurantes/shell/restaurantContactHubLeonix.ts` (new)
- `app/(site)/clasificados/restaurantes/shell/restaurantContactHubSocialBrand.tsx` (new)
- `app/(site)/clasificados/restaurantes/shell/RestaurantHubReviewLinkButton.tsx` (new)
- `scripts/restaurant-contact-hub-qa.ts`
- `scripts/restaurantes-r-c1-contact-hub-audit.ts` (new)
- `package.json` (audit script only)
- `app/lib/clasificados/restaurantes/RESTAURANTES_R_C1_CONTACT_HUB_AUDIT.md` (this file)

## Servicios reference findings

1. **Contact layout**: `Llamar` as full-width burgundy primary; secondary grid for Mensaje, WhatsApp (brand green), Correo (cream/gold secondary on pro hub).
2. **Social**: `businessHubSocialBrandStyle` + `BusinessHubSocialBrandIcon` per platform; compact rounded-lg chips.
3. **Website/links**: `Búscanos aquí` cream cards, gold border, burgundy globe accent.
4. **Reviews**: `ServiciosHubReviewLinkButton` with Google “G” and Yelp mark; no invented stars unless profile has rating.
5. **Map**: `ServiciosBusinessHubFauxMap` charcoal/burgundy/gold faux map, `max-h` controlled, burgundy pin.
6. **Empty fields**: Mapper and UI only push/show rows with validated HTTP(S) or tel/sms/mailto hrefs.
7. **Hours**: `Horarios` section with “Hoy”/open-now line + weekly rows.
8. **Mobile**: Sections stack with dividers; social wrap; full-width CTAs.

## Current Restaurante issues found (before)

- Wrong section order (social before reviews; no Ordena o reserva; no Horarios in hub).
- Menu/order/reserve/website mixed in `findUs` with label “Encuéntranos aquí”.
- Generic gold icons for all CTAs; no burgundy primary for Llamar.
- Social buttons: neutral border, no platform colors.
- Reviews: generic icons; labels “Reseñas en Google” / “Yelp” inconsistent with gate copy.
- Map: large 16/9 light grid dominated the card.
- Hours only in separate page section, not in contact hub.

## Brand/color mapping used

| Token | Use |
|---|---|
| `#FFFCF7` ivory / cream | Hub card, secondary buttons, link cards |
| `#7A1E2C` burgundy | Llamar, map CTA, secondary action accents |
| `#C9A84A` / `#D4C4A8` gold/bronze | Dividers, borders, map pin, icon accents |
| `#1E1814` charcoal | Headings, body emphasis |
| `#25D366` WhatsApp | WhatsApp CTA only |
| Platform hex | Facebook, Instagram, TikTok, YouTube review/social marks |
| `#2D5A3D` trust green | Reserved in tokens; not used as primary CTA |

## Contact section result

`Contáctanos` with conditional Llamar (burgundy), Mensaje/Correo (cream secondary), WhatsApp (green). Empty methods omitted in `buildRestaurantContactHub`.

## Restaurant action section result

`Ordena o reserva` via `orderReserve`: Menú, Reservar, Pedir ahora, Sitio web from draft URLs/file only.

## Reviews section result

`Opiniones` with `RestaurantHubReviewLinkButton` for Google/Yelp when URLs validate.

## Socials section result

`Síguenos` with `restaurantContactHubSocialBrand` true-color chips for filled social fields only.

## Website/link section result

`Búscanos aquí` shows `findUs` + catering inquiry links (moving vendor location, catering form) — not duplicating orderReserve items.

## Location/map result

`Nuestra ubicación` with address copy chip, compact faux map (`max-h-[148px]`), `Cómo llegar` when `mapsHref` exists. Hidden when no address/maps/service area.

## Hours result

`Horarios` from weekly draft days + `computeShellHoursPreview` today line; today row highlighted; special note when set.

## Application-to-output mapping

| Form field | Hub output |
|---|---|
| `phoneNumber` | Llamar, Mensaje (sms) |
| `whatsAppNumber` | WhatsApp |
| `email` | Correo |
| `menuUrl` / `menuFile` | Menú |
| `reservationUrl` | Reservar |
| `orderUrl` | Pedir ahora |
| `websiteUrl` | Sitio web (orderReserve) |
| `googleReviewUrl` | Opiniones en Google |
| `yelpReviewUrl` | Opiniones en Yelp |
| `instagramUrl`, `facebookUrl`, `tiktokUrl`, `youtubeUrl` | Síguenos |
| Address + maps resolution | Nuestra ubicación |
| `monday`…`sunday` schedules | Horarios |
| Draft persistence / publish payload | Unchanged field names; hub is view-layer only |

## Desktop result

Hub card uses Leonix cream surface, section dividers, 2-col contact grid, compact map, sidebar-friendly width in `RestauranteDetailShell`.

## Mobile result

Full-width stacked sections, tappable 48px min buttons, wrapping social row, no horizontal overflow on map (`max-w-full`).

## Risks / deferred work

- LinkedIn, X, Snapchat not in restaurant application schema yet; will appear when form fields are added.
- Leonix Media profile URL not in current draft schema.
- Catering CTAs render under `Búscanos aquí` (no separate catering heading) to match the 7-section spec.
- External rating in hero (`trustRating`) unchanged; not duplicated in contact hub.

---

## TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Servicios contact card was inspected as reference | TRUE | Servicios files listed in “Files inspected” |
| Restaurante contact hub uses Leonix cream/ivory surfaces | TRUE | `RCH_HUB_CARD`, `#FFFCF7` in `restaurantContactHubLeonix.ts` |
| Restaurante primary contact CTA uses burgundy intentionally | TRUE | Llamar button `backgroundColor: RCH_LX.burgundy` |
| Gold/bronze accents are used intentionally | TRUE | Dividers `#E8D9C4`, borders `#D4C4A8`, map pin gold |
| Charcoal text hierarchy is consistent | TRUE | Headings `#1E1814`, muted `#6F6254` |
| Green is only used as restrained trust/contact accent | TRUE | WhatsApp `#25D366` only; no green primary CTAs |
| True platform colors/logos are used for socials/reviews | TRUE | `restaurantContactHubSocialBrand.tsx`, `RestaurantHubReviewLinkButton.tsx` |
| Contact methods are grouped under Contáctanos | TRUE | `RestaurantContactHub.tsx` section 1 |
| Restaurant actions are grouped under Ordena o reserva | TRUE | `orderReserve` array + UI section |
| Google/Yelp reviews are grouped under Opiniones | TRUE | `hub.reviews` section |
| Social icons are grouped under Síguenos | TRUE | `hub.social` section |
| Website/external links are grouped under Búscanos aquí | TRUE | `findUs` + `catering` in find section |
| Location/map is grouped under Nuestra ubicación | TRUE | Location section + faux map |
| Hours are grouped under Horarios | TRUE | `hub.hours` section |
| Empty phone button is hidden | TRUE | `buildRestaurantContactHub` guards `phoneNumber` |
| Empty WhatsApp button is hidden | TRUE | `waHref` + `nonEmpty` guard |
| Empty SMS/message button is hidden | TRUE | `smsHref` only when valid |
| Empty email button is hidden | TRUE | `nonEmpty(d.email)` |
| Empty menu action is hidden | TRUE | Valid menu URL or file only |
| Empty reservation action is hidden | TRUE | `isValidExternalHttpUrl` on reserve |
| Empty order action is hidden | TRUE | `isValidExternalHttpUrl` on order |
| Empty website action is hidden | TRUE | `isValidExternalHttpUrl` on website |
| Empty Google review card is hidden | TRUE | URL validation before push |
| Empty Yelp review card is hidden | TRUE | URL validation before push |
| Empty social icons are hidden | TRUE | `addSocial` skips empty/invalid |
| Empty location/map section is hidden | TRUE | `showLocation` guard |
| Empty hours section is hidden | TRUE | `showHours` when no rows/notes |
| Menu URL or uploaded menu drives Menú output | TRUE | `menuUrl` / `menuFile` → `orderReserve` |
| Reservation URL drives Reservar output | TRUE | `reservationUrl` mapping |
| Order URL drives Pedir ahora output | TRUE | `orderUrl` mapping |
| Social form fields drive social output | TRUE | instagram/facebook/tiktok/youtube |
| Review form fields drive review output | TRUE | googleReviewUrl, yelpReviewUrl |
| Address field drives map/directions output | TRUE | `resolveRestaurantMapsHref` |
| Hours fields drive Horarios output | TRUE | `buildHubHours` from weekly draft |
| No fake ratings were added | TRUE | No rating UI in hub |
| No fake review counts were added | TRUE | Review cards: “Abrir reseñas” only |
| No fake followers were added | TRUE | Not implemented |
| No fake analytics/counters were added | TRUE | Not implemented |
| No placeholder URLs render as real links | TRUE | `isValidExternalHttpUrl` / `normalizeActionableUrl` |
| Map is no longer oversized | TRUE | `max-h-[148px]`, aspect `2.1/1` |
| Desktop layout is organized and polished | TRUE | Section order + Leonix card |
| Mobile layout stacks cleanly | TRUE | Full-width grids, flex-wrap socials |
| No unrelated categories were edited | TRUE | Only restaurantes paths + package script |
| Restaurant draft/session persistence was not broken | TRUE | No draft storage changes |
| Restaurant publish flow was not broken | TRUE | No publish payload changes |
| npm run build passed | TRUE | `npm run build` exit 0 (2026-06-03) |
