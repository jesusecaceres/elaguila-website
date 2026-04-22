# Bienes Raíces — system source of truth (routes + contracts)

## Route map (public)

| Route | File(s) | Purpose |
|-------|---------|---------|
| `/clasificados/bienes-raices` | `bienes-raices/page.tsx`, `BienesRaicesLandingHub.tsx`, `landing/BienesRaicesLandingView.tsx` | Category landing: search handoff, publish CTAs, inventory bands |
| `/clasificados/bienes-raices/resultados` | `resultados/page.tsx`, `BienesRaicesResultsClient.tsx` | Filtered browse; URL is canonical state |
| `/clasificados/bienes-raices/anuncio/[id]` | `bienes-raices/anuncio/[id]/page.tsx` | BR-specific detail shell when routed (if present); **live** detail also uses `/clasificados/anuncio/[id]` |
| `/clasificados/bienes-raices/preview/privado` | `preview/privado/` | Preview VM from local draft |
| `/clasificados/bienes-raices/preview/negocio` | `preview/negocio/` | Preview VM from preview draft |
| `/clasificados/publicar/bienes-raices` | `publicar/bienes-raices/page.tsx` | In-hub publish selector |
| `/clasificados/publicar/bienes-raices/privado` | `publicar/bienes-raices/privado/page.tsx` | Privado wizard |
| `/clasificados/publicar/bienes-raices/negocio` | `publicar/bienes-raices/negocio/page.tsx` | Negocio wizard |
| `/publicar/bienes-raices` | `app/(site)/publicar/bienes-raices/page.tsx` | Short public entry to hub |
| `/publicar/bienes-raices/privado` | `publicar/bienes-raices/privado/page.tsx` | Public entry → clasificados privado flow |
| `/publicar/bienes-raices/negocios` | `publicar/bienes-raices/negocios/page.tsx` | Selector / redirect into negocio lane |

Constants: `bienes-raices/shared/constants/brPublishRoutes.ts`, `brResultsRoutes.ts`.

## Publish / read contract

1. **Draft storage**
   - Privado: `bienesRaicesPrivadoDraft` utilities under `publicar/bienes-raices/privado/application/utils/`.
   - Negocio: `bienesRaicesPreviewDraft` under `negocio/application/utils/`.

2. **Preview**
   - Maps form state → preview VM → `clasificados/bienes-raices/preview/*` UI.

3. **Publish (live)**
   - `publishLeonixListingFromBienesRaicesPrivadoDraft` / `publishLeonixListingFromBienesRaicesNegocioDraft` in `leonixPublishRealEstateFromDraftState.ts`:
     - Builds human + machine `detail_pairs` via `leonixRealEstateDetailPairsFromPreviewVm` + `leonixBrMachineFacetPairsFromFormState` + `leonixRealEstatePersistContract`.
   - `publishLeonixRealEstateListingCore` inserts `listings` row (`category: bienes-raices`, `status: active`, `is_published: true` when successful path), uploads gallery to `listing-images`, strips `[LEONIX_IMAGES]` marker from description, returns `listingId`.

4. **Public read**
   - Results + landing: `fetchBrPublishedListingsForBrowse` (`lib/fetchBrPublishedListingsBrowser.ts`) — same select filters as historical inline query.
   - Detail: `/clasificados/anuncio/[id]` loads row by id (category includes `bienes-raices`).

## Filter / URL read contract

- Parser / merger: `resultados/lib/brResultsUrlState.ts` (`parseBrResultsUrl`, `mergeBrResultsHref`).
- Filter execution: `resultados/lib/brResultsFilters.ts` (`filterBrListings`, etc.).
- Quick chips on landing: `shared/brFilterContract.ts` (`BR_LANDING_QUICK_CHIP_CONTRACT`).

## Public inventory mode

- `lib/brPublicInventoryMode.ts` — `brShouldMergeDemoInventoryWithLive()`: **`false` in production** (`NODE_ENV === 'production'`), **`true` in development** so `demoData` can supplement empty grids.
- Landing section derivation: `landing/buildBrLandingInventorySections.ts` on the merged or live-only pool.

## Runtime dependency checklist

| Dependency | Required for |
|------------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser client; publish + browse live rows |
| Supabase table `listings` with columns used in insert/select | Publish + results + anuncio |
| RLS: `authenticated` insert/update on `listings` as implemented | Publish from signed-in user |
| Storage bucket `listing-images` | Photo upload on publish |
| Optional migrations for `zip`, `business_meta`, etc. | Core insert tolerates absence with error surfacing from PostgREST |

## Admin / moderation

- **Admin queue:** `/admin/workspace/clasificados` — filters `category=bienes-raices`, Leonix branch/operation/property from `detail_pairs` when column present.
- **User report:** `submitListingReportAction` from anuncio experience (see `clasificados/anuncio/[id]/page.tsx`).
