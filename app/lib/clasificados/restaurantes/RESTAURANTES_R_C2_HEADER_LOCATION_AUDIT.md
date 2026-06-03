# Gate R-C2 — Restaurante Header + Description + Location CTA Cleanup

## Files inspected

- `app/(site)/servicios/components/ServiciosProfessionalHero.tsx`
- `app/(site)/servicios/components/serviciosLeonixBrand.ts`
- `app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx`
- `app/(site)/clasificados/restaurantes/shell/RestauranteAdStoryPreview.tsx`
- `app/(site)/clasificados/restaurantes/shell/RestauranteDetailShell.tsx`
- `app/(site)/clasificados/restaurantes/application/mapRestauranteDraftToShell.ts`
- `app/(site)/clasificados/restaurantes/application/restauranteContactHref.ts`
- `app/(site)/clasificados/restaurantes/application/restauranteListingApplicationModel.ts`
- `app/api/clasificados/restaurantes/publish/route.ts`

## Files changed

- `app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx`
- `app/(site)/clasificados/restaurantes/shell/RestauranteProfileHeader.tsx` (new)
- `app/(site)/clasificados/restaurantes/shell/RestauranteAdStoryPreview.tsx`
- `app/(site)/clasificados/restaurantes/shell/RestauranteDetailShell.tsx`
- `app/(site)/clasificados/restaurantes/shell/RestaurantePreviewCard.tsx`
- `app/(site)/clasificados/restaurantes/application/mapRestauranteDraftToShell.ts`
- `app/(site)/clasificados/restaurantes/application/restauranteContactHref.ts`
- `app/(site)/clasificados/restaurantes/application/restauranteListingApplicationModel.ts`
- `app/(site)/clasificados/restaurantes/application/restaurantePreviewRequirements.ts`
- `app/(site)/clasificados/restaurantes/application/createEmptyRestauranteDraft.ts`
- `app/(site)/clasificados/restaurantes/application/useRestauranteDraft.ts`
- `app/(site)/clasificados/restaurantes/lib/restauranteCardSummary.ts` (new)
- `app/(site)/clasificados/restaurantes/lib/restaurantesPublicListingMapper.ts`
- `app/(site)/clasificados/restaurantes/lib/restaurantesTranslateAd.ts`
- `app/(site)/clasificados/restaurantes/adapters/restauranteApplicationToDiscoveryRow.ts`
- `app/(site)/clasificados/restaurantes/preview/RestaurantePreviewClient.tsx`
- `app/api/clasificados/restaurantes/publish/route.ts`
- `scripts/restaurant-contact-hub-qa.ts`
- `scripts/restaurantes-r-c2-header-location-audit.ts` (new)
- `package.json`

## Servicios reference findings

- Professional hero uses `LX_HERO_BG` charcoal/burgundy gradient — not food photo as required background.
- Logo in cream frame with gold border for contrast.
- Identity (name, chips, hours, location) on controlled dark surface.
- Contact/location CTAs live in Business Hub, not cluttered in hero.
- No duplicate short-summary line in hero.

## Resumen corto removal result

- Field removed from `RestauranteApplicationClient` UI and preview/publish minimum requirements.
- `mapRestauranteDraftToShell` sets `summaryShort: undefined` (legacy draft property tolerated).
- `shortSummary` remains optional on types and publish payload for backwards compatibility.

## Sobre nosotros result

- Application label: **Sobre nosotros (recomendado)** with helper explaining it appears lower in the ficha.
- Preview/detail section title **Sobre nosotros**; only `aboutBody` renders (no resumen fallback).

## Address-to-map CTA result

- `buildRestaurantPublicAddressQuery` combines street, line 2, city, state, ZIP.
- `resolveRestaurantMapsHref`: custom `verUbicacionUrl` first, else encoded Google Maps search, else service area URL.
- Contact hub **Cómo llegar** uses same resolver (Gate R-C1).

## Custom map URL helper copy result

- Label: **Ver en el mapa (URL personalizada)** with optional/privacy helpers per gate spec.

## Header background standard result

- `RestauranteProfileHeader`: espresso/charcoal/burgundy gradient, gold accents, cream logo frame — no hero food photo background.
- Hero image remains in gallery/media pipeline only.

## Application-to-output mapping

| Field | Output |
|---|---|
| businessName | Header title |
| cuisines / taxonomy | Header chips |
| address + city | Location line + maps CTA |
| businessLogo | Header avatar |
| heroImage | Gallery/media (not header BG) |
| longDescription | Sobre nosotros body |
| verUbicacionUrl | Optional maps override |
| contact fields | Contact hub (R-C1) |

## Desktop / mobile result

- Compact header card; stacks on mobile; no oversized photo hero; about section below contact/gallery blocks.

## Risks / deferred work

- Discovery cards use cuisine line or long-description excerpt when resumen absent (not a marketing tagline).
- `shortSummary` column may still exist in DB for old rows — ignored in UI.

---

## TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Servicios header/contact behavior was inspected | TRUE | Servicios files listed above |
| Resumen corto was removed from visible Restaurante application UI | TRUE | No FieldLabel in `RestauranteApplicationClient.tsx` |
| Resumen corto is no longer required for Restaurante validation | TRUE | Removed from `auditRestaurantePublishReadiness` + publish route |
| Resumen corto no longer renders in Restaurante header | TRUE | `RestauranteProfileHeader` — no summaryShort |
| Resumen corto no longer renders as required preview copy | TRUE | `summaryShort: undefined` in mapper; about only |
| Old drafts/data with resumen corto remain tolerated safely | TRUE | Optional `shortSummary?` on type; publish still accepts field |
| Sobre nosotros remains available | TRUE | `longDescription` field retained |
| Sobre nosotros is recommended instead of cluttering the header | TRUE | Label + helper in application |
| Sobre nosotros renders lower in the profile body | TRUE | Story section after header in `RestauranteAdStoryPreview` |
| Address fields remain available | TRUE | Section E unchanged |
| Custom map URL remains optional | TRUE | `verUbicacionUrl` optional |
| Map URL helper copy was improved | TRUE | New helper paragraphs in application |
| If map URL exists, location CTA uses it | TRUE | `resolveRestaurantMapsHref` priority 1 |
| If map URL is empty and public address exists, CTA is generated from address | TRUE | `buildRestaurantPublicAddressQuery` + `mapsSearchHref` |
| Generated map URL is URL encoded | TRUE | `encodeURIComponent` in `mapsSearchHref` |
| No placeholder map URL renders as real output | TRUE | `isValidExternalHttpUrl` guards |
| Empty/no-address state hides location CTA safely | TRUE | `buildRestaurantContactHub` location guards |
| Exact-address privacy behavior remains respected | TRUE | `shouldShowRestaurantStreetAddress` unchanged |
| Restaurante header uses a standard controlled brand background | TRUE | `RestauranteProfileHeader` gradient |
| Uploaded food/hero photo is not required as header background | TRUE | Photo hero removed from preview shell |
| Header logo contrast is protected | TRUE | Cream frame + gold border |
| Header is clean and not oversized | TRUE | ~5–7rem logo, no 60vh hero |
| Header follows Leonix restaurant brand colors intentionally | TRUE | Charcoal/burgundy/gold/cream |
| No fake ratings/counters/analytics were added | TRUE | No new metrics |
| Restaurant publish flow was not broken | TRUE | Payload keeps optional shortSummary |
| Restaurant draft/session persistence was not broken | TRUE | Optional trim in `useRestauranteDraft` |
| Image/gallery uploads were not broken | TRUE | No media field changes |
| Desktop layout remains clean | TRUE | Profile header + sections |
| Mobile layout stacks cleanly | TRUE | Responsive flex in header |
| No unrelated categories were edited | TRUE | Restaurant paths only |
| npm run build passed | TRUE | `npm run build` exit 0 (2026-06-03) |
