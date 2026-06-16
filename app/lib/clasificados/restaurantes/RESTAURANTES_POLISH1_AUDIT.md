# Gate REST-POLISH1 — Restaurante Public Detail Compression + Business Hub Layout

**Gate type:** STRICT PUBLIC OUTPUT POLISH — NO UX/FLOW/FORM/DATA CHANGES — BUILD REQUIRED AT END

## Preflight status

- Git worktree clean at gate start
- Active preview: `/clasificados/restaurantes/preview?lang=es` → `RestaurantePreviewClient` → `RestauranteAdStoryPreview`
- Active detail: `/clasificados/restaurantes/[slug]?lang=es` → `[slug]/page.tsx` → `RestauranteAdStoryPreview`

## Visual reference summary

Premium compact Restaurante header direction; horizontal Business Hub (contact / map / hours); compact feature chips; icon-flavored amenity pills; 4-col specialties on desktop; compact gallery strip; low-priority content in collapsible “Más información”. No sample text or fake data copied.

## Active preview/detail files identified

- `RestauranteAdStoryPreview.tsx` (primary public renderer)
- `RestaurantContactHub.tsx` (Business Hub)
- `RestauranteGroupedFeaturesSection.tsx`
- `RestauranteAmenitiesShellSection.tsx`
- `RestauranteLockedGallerySection.tsx`
- `RestauranteProfileHeader.tsx` (unchanged — already premium)

## Files inspected

- All shell components above
- `restauranteAmenitiesCatalog.ts` (icon lookup for display)
- `RestaurantePreviewClient.tsx`, `[slug]/page.tsx` (routing only)
- `RestauranteApplicationClient.tsx` (read-only — form untouched)

## Files changed

- `RestaurantContactHub.tsx`
- `RestauranteAdStoryPreview.tsx`
- `RestauranteGroupedFeaturesSection.tsx`
- `RestauranteAmenitiesShellSection.tsx`
- `RestauranteLockedGallerySection.tsx`
- `restauranteAmenitiesCatalog.ts` (display lookup exports only)
- `RESTAURANTES_POLISH1_AUDIT.md`
- `scripts/restaurantes-polish1-audit.ts`
- `package.json`

## Gate A result — layout density audit

**Major sections before:** 12+ vertical blocks (header, about, contact hub, features, amenities, specialties, gallery, standalone hours, trust, stacks).

**High priority (kept visible):** Hero, Sobre nosotros, Business Hub, Services/features, Amenities, Specialties, Gallery.

**Secondary (compacted):** Trust/proof, Información adicional stacks, catering details → “Más información” collapsible.

**Safe to compact:** Duplicate hours (hub already has hours), verbose feature descriptions, checkmark amenity lists, 2-col specialties, 8-thumb gallery grid, prominent trust/stack cards.

## Gate B result — Business Hub compression

3-column `lg:grid-cols-3`: Col1 contact+order, Col2 location+map, Col3 hours. Secondary row: reviews, social, find-us. Mobile stacks in same order. All actions preserved; empty sections hide.

## Gate C result — features/amenities/gallery compression

- Features: servicios wide chip block + 4-col mini cards for cocina/ambiente/idiomas/precio
- Amenities: compact category cards with emoji/icon chips (catalog lookup)
- Specialties: `lg:grid-cols-4` desktop, tighter cards
- Gallery: 7-thumb single-row strip, compact aspect
- Low-priority: `Más información` details element

## Desktop result

Materially shorter page height; Business Hub horizontal; 4 specialty cards per row; compact gallery strip.

## Mobile result

Clean vertical stack; no horizontal overflow; carousel specialties preserved; collapsible Más información.

## Contact/social/reviews/map result

All real-link actions preserved. Platform-specific social icons unchanged. Map CTA and faux map compact. Duplicate standalone hours removed when hub includes hours.

## Services/features result

Tighter Servicios y Características with chip blocks; no data removed.

## Amenities result

Icon-flavored pills per category; all selected items still render.

## Specialties/gallery result

Shorter specialty cards; gallery compact 7-thumb row; modal/CTA preserved; photos/videos tabs unchanged.

## Low-priority sections result

Trust + stack sections moved under collapsible “Más información”; filled data preserved.

## Data preservation result

No fields removed; empty sections still hide; no fake data added.

## Form UX untouched result

No edits to `RestauranteApplicationClient.tsx` form logic.

## Media upload untouched result

No upload/draft/session/API changes.

## What was intentionally not touched

- Form application UX
- Draft/session/publish flow
- APIs, database, admin, payment, analytics
- Other categories (Comida Local, etc.)
- `RestauranteDetailShell.tsx` (unused in live routes; `RestauranteAdStoryPreview` is canonical)

## Risks/deferred work

- `Más información` collapsed by default — users must expand for trust/stacks (intentional density tradeoff)
- Very long amenity lists may wrap within compact cards

## Manual QA checklist

- [ ] Preview `/clasificados/restaurantes/preview?lang=es` — page fits fewer screenshots
- [ ] Desktop: contact/map/hours side-by-side in Business Hub
- [ ] Mobile: hub stacks cleanly
- [ ] All contact buttons work when data filled
- [ ] Social icons correct per platform
- [ ] Specialties show 4 across on wide desktop
- [ ] Gallery opens modal; photos/videos tabs work
- [ ] Más información expands with trust/stacks when filled
- [ ] Published slug page matches preview layout

## Gate A TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Public preview renderer identified | TRUE | RestaurantePreviewClient → AdStoryPreview |
| Public detail renderer identified | TRUE | [slug]/page.tsx → AdStoryPreview |
| Current major sections documented | TRUE | Gate A section |
| High priority sections documented | TRUE | Gate A section |
| Secondary sections documented | TRUE | Gate A section |
| Sections safe to compact documented | TRUE | Gate A section |
| No form UX changed in Gate A | TRUE | No form edits |
| No data model/API/database edits made | TRUE | Display only |

## Gate B TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Contact/actions are compacted | TRUE | RestaurantContactHub col1 |
| Location/map is compacted | TRUE | RestaurantContactHub col2 |
| Hours are compacted | TRUE | RestaurantContactHub col3 |
| Desktop uses 3-column or equivalent compact hub | TRUE | lg:grid-cols-3 |
| Mobile stacks cleanly | TRUE | grid-cols-1 |
| Social icons remain platform-specific | TRUE | RestaurantHubSocialBrandIcon |
| Google/Yelp remain real-link only | TRUE | RestaurantHubReviewLinkButton |
| Empty contact/social/review/map actions hide | TRUE | conditional render |
| No raw URLs shown publicly | TRUE | button labels only |
| No fake links/reviews/ratings added | TRUE | unchanged data paths |
| No form UX changed | TRUE | scope |

## Gate C TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Servicios y Características is more compact | TRUE | GroupedFeaturesSection |
| Amenities use compact icon-flavored chips/cards | TRUE | AmenitiesShellSection |
| Existing selected amenities still render | TRUE | same data mapping |
| Especialidades section is shorter on desktop | TRUE | lg:grid-cols-4 |
| Gallery remains compact | TRUE | 7-thumb strip |
| Photos/videos separation remains | TRUE | LockedGallerySection modal tabs |
| Low-priority sections compacted or moved into Más información | TRUE | details element |
| Filled low-priority data is not lost | TRUE | same stack/trust render |
| Empty sections hide | TRUE | conditional |
| Mobile layout has no horizontal overflow | TRUE | responsive grids |
| Gallery modal still opens | TRUE | openModal preserved |
| No media upload logic changed | TRUE | scope |
| No form UX changed | TRUE | scope |
| npm run build passed | TRUE | see build log |
