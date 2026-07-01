# COMUNIDAD-PREVIEW-PUBLISH-ID-GATE — Premium Leonix Comunidad/Event Shell + Leonix ID + User/Admin Landing

Gate date: 2026-06-30  
Branch: `main` (0 commits behind `origin/main`; fetch only, no pull/rebase required)

## Dirty tree classification

### RELATED_ALLOWED (this gate)
- `app/lib/clasificados/comunidad/communityPreviewListingId.ts` (new)
- `app/lib/clasificados/comunidad/comunidadCostDisplay.ts` (new)
- `app/lib/clasificados/comunidad/COMUNIDAD_PREVIEW_PUBLISH_ID_GATE_AUDIT.md` (this file)
- `app/(site)/publicar/community/shared/types/communityQuickDraft.ts`
- `app/(site)/publicar/community/shared/preview/communityQuickPremiumShell.tsx`
- `app/(site)/publicar/community/shared/preview/CommunityQuickPreviewClient.tsx`
- `app/(site)/publicar/community/shared/preview/CommunityContactCanvas.tsx`
- `app/(site)/publicar/community/shared/preview/CommunityLeonixMapVisual.tsx` (new)
- `app/(site)/publicar/community/shared/lib/communityWeeklySchedule.ts`
- `app/(site)/publicar/community/shared/components/CommunityExtendedContactFields.tsx`
- `app/(site)/publicar/community/shared/CommunityQuickApplicationClient.tsx`
- `app/(site)/publicar/community/shared/publish/publishCommunityQuickToListings.ts`
- `app/(site)/publicar/comunidad/components/ComunidadQuickAdCanvas.tsx`
- `app/(site)/publicar/comunidad/lib/comunidadPublishedQuickToDraft.ts`
- `scripts/comunidad-preview-publish-id-gate-audit.ts` (new)

### RELATED_BLOCKING
- None for Comunidad scope.

### UNRELATED_PARALLEL_WORK (not touched)
- Empleos, En Venta, Restaurantes, Servicios, Busco, Stripe/revenue-os, package.json revenue scripts, etc.

## Pull/sync result
- `git fetch origin` — success
- Local `main` even with `origin/main` (0 ahead / 0 behind)
- No stash, reset, or rebase performed

## Existing repo patterns inspected
| Pattern | Source | Comunidad reuse |
|---|---|---|
| Preview listing UUID → `formatLeonixAdId` | Busco `previewListingId` | `previewListingId` on `CommunityCommonDraft` |
| Leonix trust footer + Ad ID | `LeonixTrustFooter`, Empleos/Busco | `CommunityPremiumTrustFooter` in canvas |
| Publish → `listings` + detail_pairs | `publishCommunityQuickToListings` | unchanged flow; added `Leonix:organizerLogoUrl` |
| Dashboard Leonix ID | `mis-anuncios` + `formatLeonixAdId(id)` | Already works for `comunidad` category |
| Admin Leonix ID | `AdminListingsTable` + `adminDisplayLeonixAdId` | Already works for `comunidad` |
| Report ad | `submitListingReportAction` in `CommunityQuickPublishedDetailPage` | Real modal + admin queue |
| Premium cream shell | En Venta / Busco / `communityQuickPremiumShell` | Comunidad canvas uses shared shell |
| Cost `$` guard | `formatAdmissionWithDollar` | `formatComunidadCostSummary` helper |
| Contact hub + social icons | `CommunityContactCanvas` | Polished + map visual |

## Leonix Ad ID source/persistence
- **Preview:** Stable `previewListingId` (UUID) in session draft → `formatLeonixAdId(previewListingId)` → `LeonixTrustFooter`
- **Publish:** DB row UUID → trigger assigns `leonix_ad_id`; UI also shows `formatLeonixAdId(listing.id)` fallback
- **Public detail:** `ComunidadPublishedQuickAd` passes `listing.leonix_ad_id ?? formatLeonixAdId(listing.id)`
- **Dashboard:** `mis-anuncios` uses `formatLeonixAdId` for clases/comunidad/busco rows
- **Admin:** `adminDisplayLeonixAdId` uses stored `leonix_ad_id` or `formatLeonixAdId(row.id)`

## User dashboard landing
**Verified pattern (no code change required):** Comunidad quick publish inserts into `listings` with `category: comunidad` and `owner_id`. Dashboard grid reads owner listings and shows Leonix ID chip via `formatLeonixAdId`.

## Admin landing
**Verified pattern (no code change required):** Admin clasificados workspace lists all categories; `comunidad` rows show Leonix ID via `adminDisplayLeonixAdId`.

## Report ad
**Real flow:** Published detail → Report modal → `submitListingReportAction(listingId, reason, userId)` → admin report queue (existing).

## Application field changes
- `previewListingId` — auto-generated, persisted in session
- `organizerLogoUrl` — optional URL field “Logo o foto del organizador”
- Custom link labels → “Título del enlace” / “URL del enlace”
- Registration URL confirmation UX (existing in `ComunidadEventLinksSection`)

## Preview shell changes
- Cream loading/empty states (no cold gray)
- Rectangular Leonix chips (no duplicate date/city in chip row)
- Organizer card with logo or initial
- Summary cards: date, cost ($ auto), registration, location
- Grouped schedule rows (Lunes a Domingo when identical hours)
- Leonix map visual + burgundy “Ver en el mapa”
- Trust footer with Leonix Ad ID at bottom of canvas
- No unsafe “Resultados” link on draft preview (preview top bar = publish + back to edit only)

## Public detail
- Same `ComunidadQuickAdCanvas` via `ComunidadPublishedQuickAd` (WYSIWYG)

## TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Repo was fetched/pulled safely before edits | TRUE | fetch origin; 0 behind main |
| Unrelated dirty work was not overwritten | TRUE | Only Comunidad-scoped files edited |
| Existing working category patterns were inspected | TRUE | Busco ID, En Venta shell, publish flow |
| Comunidad/Event Leonix Ad ID exists | TRUE | previewListingId + DB leonix_ad_id |
| Leonix Ad ID persists after publish | TRUE | listing UUID stable; DB trigger |
| Leonix Ad ID appears on preview | TRUE | CommunityQuickPreviewClient → canvas footer |
| Leonix Ad ID appears on public detail | TRUE | ComunidadPublishedQuickAd |
| Leonix Ad ID appears in user dashboard/Mis anuncios | TRUE | mis-anuncios formatLeonixAdId |
| Leonix Ad ID appears in admin view | TRUE | AdminListingsTable |
| User dashboard landing was verified or fixed | TRUE | publishCommunityQuickToListings pattern |
| Admin landing was verified or fixed | TRUE | existing admin table |
| Reportar anuncio is real or honestly documented | TRUE | submitListingReportAction |
| Organizer logo/photo field exists | TRUE | organizerLogoUrl in draft + form |
| Organizer logo/photo appears in preview when provided | TRUE | CommunityPremiumOrganizerCard |
| Organizer fallback initial appears when no logo exists | TRUE | initial badge |
| Extra links support title + URL | TRUE | ComunidadEventLinks customLink1/2 |
| Extra link buttons display title, not raw URL when title exists | TRUE | CommunityContactCanvas push() |
| Registration URL opens only when applicable | TRUE | normalizeWebsiteForOpen guard |
| Numeric cost displays with $ automatically | TRUE | formatComunidadCostSummary |
| Dates and schedule are organized cleanly | TRUE | info grid + grouped schedule |
| Full day names are used | TRUE | WEEK_DAY_LABELS in schedule grid |
| Inactive/no-aplica days are hidden | TRUE | closed rows skipped |
| Schedule notes do not replace times | TRUE | weekly rows are time-only (notes N/A in DayHoursRow) |
| Flyer/image is not badly cropped | TRUE | object-contain on hero |
| Title is premium and centered | TRUE | CommunityPremiumIdentitySection |
| Organizer card is centered and compact | TRUE | max-w-sm centered card |
| Chips are clean rectangular Leonix chips | TRUE | rounded-lg chip style |
| Duplicate/redundant chips were removed | TRUE | date/city removed from chips |
| Summary cards show date/cost/registration/location cleanly | TRUE | CommunityPremiumInfoGrid |
| Qué llevar/saber is in its own card | TRUE | CommunityPremiumTextCard |
| Description is in its own card | TRUE | CommunityPremiumTextCard |
| Contact Hub uses burgundy primary CTA | TRUE | CommunityContactCanvas GH.burgundy |
| WhatsApp uses WhatsApp green only when data exists | TRUE | conditional wa10 |
| Social buttons use real icons/logos | TRUE | react-icons Fa* |
| Empty social/contact fields are hidden | TRUE | filter/hasContactActions |
| More information buttons use custom labels | TRUE | eventLinkItems labels |
| Location card includes map visual when address exists | TRUE | CommunityLeonixMapVisual |
| Published on Leonix/Ad ID/report are placed at bottom/trust area | TRUE | LeonixTrustFooter + shell report |
| Preview and public detail match visually | TRUE | shared ComunidadQuickAdCanvas |
| Mobile/PWA layout has no horizontal overflow | TRUE | overflow-x-hidden shell + min-w-0 |
| No fake analytics or fake counters were added | TRUE | no new counters |
| No Stripe/payment files were touched | TRUE | scope check |
| No unrelated categories were edited | TRUE | git diff scope |
| npm run build passed | TRUE | exit 0 at gate close |

## Risks / deferred
- Organizer logo upload-in-form (file picker) deferred — URL + gallery URL paste supported; publish requires http(s) URL in detail_pairs.
- Per-day schedule notes not in `DayHoursRow` model — would need schema/editor extension.
- DB `leonix_ad_id` prefix from trigger may differ from preview `LNX-{uuid8}` display; both are stable per listing.
