# Gate REST-POLISH2 — Restaurante Media Priority + Video Preview Cards

**Gate type:** STRICT PUBLIC OUTPUT MICRO-POLISH — NO FORM/UX/FLOW/DATA CHANGES — BUILD REQUIRED

## Preflight status

- Git worktree clean at gate start
- Active preview: `RestaurantePreviewClient` → `RestauranteAdStoryPreview`
- Active detail: `[slug]/page.tsx` → `RestauranteAdStoryPreview`

## Visual reference summary

Restaurant showcase feel; food/media before checklist details; premium header with stronger hero on desktop; compact video preview cards; photos/videos separated.

## Files inspected

- `RestauranteAdStoryPreview.tsx`, `RestauranteProfileHeader.tsx`, `RestauranteLockedGallerySection.tsx`
- `RestauranteShellGalleryPrimitives.tsx`, `restauranteVideoUrls.ts`, `mapRestauranteDraftToShell.ts`
- En Venta read-only: `enVentaVideoEmbed.ts`, `resolveEnVentaListingImageUrls.ts`, `EnVentaVideoPlayer.tsx`

## Files changed

- `restauranteVideoPreview.ts` (new)
- `RestauranteVideoPreviewCard.tsx` (new)
- `RestauranteShellGalleryPrimitives.tsx`
- `RestauranteLockedGallerySection.tsx`
- `RestauranteAdStoryPreview.tsx`
- `RestauranteProfileHeader.tsx`
- `RESTAURANTES_POLISH2_AUDIT.md`
- `scripts/restaurantes-polish2-audit.ts`
- `package.json`

## En Venta/Varios video reference findings

- YouTube ID via `extractYoutubeId` (watch, youtu.be, shorts, embed)
- Thumbnail: `https://img.youtube.com/vi/{id}/hqdefault.jpg`
- Vimeo embed via numeric ID
- TikTok/Instagram: no safe thumbnail without API — fallback branded cards
- No oEmbed calls — display-only pattern copied into Restaurante-specific helpers

## Gate A result — video inspection

Restaurante videos live in `venueGallery.categories[key=video]` from `videoUrls[]` / legacy `videoUrl` / local `videoFile`. Modal tabs separate photos/videos. Mobile uses same components. Raw URLs not shown as primary UI in new cards.

## Gate B result — video thumbnail/preview cards

`RestauranteVideoPreviewCard` + `restauranteVideoPreview.ts` provide YouTube thumbnails, platform fallback cards, local video poster via `<video preload=metadata>`, click opens modal player or external link.

## Gate C result — section order + hero image adjustment

Public order after About + Business Hub: Especialidades → Galería y Videos → Servicios → Amenidades → Más información. Desktop hero image panel added in `RestauranteProfileHeader` (lg only). Like/Save/Share remain in hero.

## Section order result

Documented in `RestauranteAdStoryPreview.tsx` with index order verified by audit script.

## Hero image result

`heroImageUrl` renders in desktop-only side panel (`lg:flex-[1.15]`, max-h ~300px). Mobile unchanged (hidden hero band).

## Manual QA checklist

- [ ] YouTube URL shows thumbnail + play overlay
- [ ] TikTok/Instagram show platform card (no fake thumb)
- [ ] Multiple videos: selector cards in modal
- [ ] Section order: specialties before gallery before features
- [ ] Desktop hero image visible when heroImageUrl set
- [ ] Like/Save/Share still in header
- [ ] Business Hub 3-column intact

## Gate A TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Restaurante preview video renderer inspected | TRUE | LockedGallerySection + ShellVideoSlide |
| Restaurante public detail video renderer inspected | TRUE | Same AdStoryPreview path |
| Restaurante current video URL shape documented | TRUE | videoUrls[] / videoUrl / videoFile |
| Restaurante mobile video output inspected | TRUE | Responsive grids |
| En Venta/Varios pattern inspected read-only | TRUE | enVentaVideoEmbed.ts |
| YouTube thumbnail strategy identified | TRUE | hqdefault.jpg |
| Non-YouTube fallback strategy identified | TRUE | platform cards |
| No En Venta/Varios files edited | TRUE | scope |
| No form UX/flow files edited in Gate A | TRUE | scope |
| No app/api/database files edited | TRUE | scope |

## Gate B TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Restaurante video preview/card helper exists | TRUE | restauranteVideoPreview.ts + Card |
| YouTube video ID extraction exists | TRUE | extractRestauranteYoutubeId |
| YouTube thumbnail renders when possible | TRUE | img.youtube.com |
| TikTok/Instagram/Vimeo get platform fallback cards | TRUE | RestauranteVideoPreviewCard |
| Generic https URLs get clean fallback card | TRUE | platform generic |
| Raw video URL is not primary UI | TRUE | Ver video / platform label |
| Clicking preview opens/plays video | TRUE | modal ShellVideoSlide / external |
| Multiple video URLs still work | TRUE | preview card selectors |
| Empty video section hides | TRUE | conditional render |
| Photos/videos remain separated | TRUE | food grid + video row + tabs |
| Photo gallery behavior untouched | TRUE | food preview grid unchanged |
| No Mux/direct upload reintroduced | TRUE | URL/file only |
| No fake thumbnails added | TRUE | YouTube only when ID resolved |
| No form video URL behavior changed | TRUE | scope |

## Gate C TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Especialidades before gallery/media | TRUE | story index order |
| Galería y Videos before Servicios | TRUE | story index order |
| Servicios before Amenidades | TRUE | story index order |
| Amenidades after media sections | TRUE | story index order |
| No filled section data removed | TRUE | all sections kept |
| Empty sections still hide | TRUE | conditionals |
| Business Hub layout intact | TRUE | lg:grid-cols-3 |
| Hero image slightly larger on desktop | TRUE | HERO_IMAGE_FRAME lg |
| Hero title/content spacing balanced | TRUE | flex layout |
| Me gusta/Guardar/Compartir in hero | TRUE | Leonix* buttons |
| Mobile clean/no overflow | TRUE | hero hidden on mobile |
| No form UX changed | TRUE | scope |
| No draft/session/publish/upload changed | TRUE | scope |
| npm run build passed | TRUE | see build log |
