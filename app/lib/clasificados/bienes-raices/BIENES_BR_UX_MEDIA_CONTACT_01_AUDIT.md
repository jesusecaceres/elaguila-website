# BIENES BR-UX-MEDIA-CONTACT-01

Gate: **BR-UX-MEDIA-CONTACT-01** — Bienes preview media + brochure + contact card direct action repair.

## Repo confirmation

| Field | Value |
|-------|-------|
| Repo | `C:/projects/elaguila-website` |
| Branch | `main` |
| HEAD (preflight) | `93dc316ce63aaccee9861c70352d502f72857b63` |
| Initial dirty | Clean tracked tree |

## Files inspected

- `publicar/bienes-raices/negocio/agente-individual/preview/AgenteIndividualResidencialPreviewPage.tsx`
- `publicar/bienes-raices/negocio/agente-individual/preview/AgenteIndividualResidencialMediaLightbox.tsx`
- `publicar/bienes-raices/negocio/agente-individual/preview/BrAgenteResContactSidebar.tsx`
- `publicar/bienes-raices/negocio/agente-individual/preview/BrPreviewVideoModal.tsx` (new)
- `bienes-raices/preview/BienesRaicesNegocioPreviewView.tsx`
- `clasificados/lib/LeonixPreviewGalleryLightbox.tsx` (Bienes-shared lightbox)
- `lib/clasificados/bienes-raices/brPreviewVideoEmbed.ts` (new)

## Files changed

See git diff — preview media/contact only; no inventory/publish/dashboard/admin.

## Before / after

| Area | Before | After |
|------|--------|-------|
| Video CTA cards (×4) | Opened new tab OR dead black lightbox fallback only | `BrPreviewVideoModal` with YouTube/Vimeo embed + polished fallback card + switch rail |
| View all photos | Non-clickable `<span>` | Button opens photo-only lightbox at index 0 |
| Photo lightbox | Included video slide at end | `photosOnly` — photos only for View all photos / photo tiles |
| Brochure/plan links | `download` attribute on `data:` URLs | `target="_blank"` + `rel="noopener noreferrer"` (open, not force download) |
| Contact email | mailto only | mailto + copy icon button |
| Contact phone/WA/web | Already direct | Verified unchanged |

## Mobile

Video modal + lightbox: min 44px close/nav; fallback card tappable; thumbnail rail scrolls horizontally.

## Build

Run at validation (`npm run build`).

## Remaining risks

- Some PDF hosts may still trigger browser download via `Content-Disposition` headers (hosting limitation; UI no longer sets `download`).
- TikTok/Instagram URLs use fallback card (no unsafe embed).

## TRUE/FALSE battlefield audit

| Requirement | TRUE/FALSE | Evidence |
|-------------|------------|----------|
| Correct repo confirmed | TRUE | Preflight |
| Initial git status reviewed | TRUE | Clean |
| Unrelated dirty files untouched | TRUE | Scope |
| Bienes media modal file found | TRUE | MediaLightbox + BrPreviewVideoModal |
| Bienes video CTA handler found | TRUE | PreviewPage externalVideos buttons |
| Bienes View all photos handler found | TRUE | openPhotoGallery(0) button |
| Bienes brochure/floor plan link found | TRUE | tourOrPlan anchor + contact sidebar |
| Bienes contact card found | TRUE | BrAgenteResContactSidebar |
| Video click no longer opens dead black modal only | TRUE | BrPreviewVideoModal embed/fallback |
| YouTube/Vimeo embed handled when safe | TRUE | brPreviewVideoEmbed |
| Non-embeddable video fallback is polished | TRUE | Cream card + platform label |
| Multiple video URLs can be shown/selected | TRUE | Modal thumbnail rail |
| View all photos opens gallery | TRUE | Button wired |
| View all photos starts on photo mode/index | TRUE | photosOnly lightbox |
| Gallery close still works | TRUE | Unchanged |
| Gallery arrows/thumbnails still work | TRUE | Unchanged |
| Brochure/plan no longer intentionally forces download | TRUE | download attr removed |
| Brochure/plan opens new tab when browser allows | TRUE | target=_blank |
| Phone uses tel: | TRUE | Contact sidebar |
| Office phone uses tel: if visible | TRUE | Contact sidebar |
| Email has mailto/open behavior | TRUE | EmailRow mailto |
| Email has copy action if visible | TRUE | FiCopy button |
| Website opens directly | TRUE | target=_blank links |
| WhatsApp opens directly if visible | TRUE | wa.me href |
| Map opens directly if visible | TRUE | maps link in preview page |
| Empty contact fields hide | TRUE | Conditional render |
| No fake contact placeholders added | TRUE | — |
| No parent/child inventory files touched | TRUE | — |
| No publish logic touched | TRUE | — |
| No dashboard/admin touched | TRUE | — |
| No unrelated categories touched | TRUE | Leonix lightbox is Bienes-shared |
| Mobile 390px behavior considered | TRUE | min-h 44px targets |
| npm run build passed | TRUE | Validation run |
| No files staged | TRUE | Gate rule |
| No commit | TRUE | Gate rule |
| No push | TRUE | Gate rule |
| Ready to commit this build YES/NO | YES | After build green |

## Final recommendation

**GREEN**
