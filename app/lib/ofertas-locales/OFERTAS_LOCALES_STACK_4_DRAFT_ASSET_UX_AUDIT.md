# Stack 4 — Ofertas Locales — Draft Asset UX Foundation

## Gate summary

Stack 4 adds draft-level asset metadata for weekly flyers and coupons across three internal gates:

- **Gate A:** `OfertaLocalDraftAsset` types, constants, validation, persistence
- **Gate B:** Draft form asset management cards (metadata only)
- **Gate C:** Preview rendering + stack audit + full build

No real upload, Supabase storage, API, DB migrations, checkout, or analytics tracking.

## Files created/changed

| File | Gate |
|------|------|
| `ofertasLocalesTypes.ts` | A |
| `createEmptyOfertaLocalDraftAsset.ts` | A |
| `ofertasLocalesConstants.ts` | A |
| `ofertasLocalesValidation.ts` | A |
| `ofertasLocalesDraftPersistence.ts` | A |
| `ofertasLocalesDraftAssetHelpers.ts` | A |
| `OfertasLocalesDraftAssetSection.tsx` | B |
| `OfertasLocalesApplicationClient.tsx` | B |
| `ofertasLocalesApplicationCopy.ts` | B |
| `OfertasLocalesPreviewAssetCards.tsx` | C |
| `OfertasLocalesPreviewCard.tsx` | C |
| `ofertasLocalesPreviewCopy.ts` | C |
| `ofertasLocalesPreviewHelpers.ts` | A/C |

## Draft asset model

`OfertaLocalDraftAsset`: id, assetType, title, note, url, fileName, mimeType, pageNumber, sortOrder, status.

Types: `flyer_pdf`, `flyer_image`, `coupon_pdf`, `coupon_image`, `external_url`.

Status: `draft`, `ready`, `needs_upload`, `removed`.

## What was not implemented

- Cloud upload, Supabase storage, API routes, DB, Stripe, analytics tracking, header/nav

## Auth/layout note

Routes remain under `/publicar` and inherit `PublishAuthGateLayout`.

## TRUE/FALSE checklist

| Requirement | TRUE/FALSE |
|-------------|------------|
| Draft asset type created | TRUE |
| Flyer/coupon draft assets supported | TRUE |
| Draft form add/edit/remove metadata | TRUE |
| No real files/base64 stored | TRUE |
| Preview renders asset metadata | TRUE |
| Stack audit passes | PENDING |
| Build passes | PENDING |

## Recommended next stack

**Stack 5 — Ofertas Locales — Client Upload Shell (pre-storage)**

Wire disabled file inputs to client-side validation and metadata updates only, or API upload when storage gate is ready.
