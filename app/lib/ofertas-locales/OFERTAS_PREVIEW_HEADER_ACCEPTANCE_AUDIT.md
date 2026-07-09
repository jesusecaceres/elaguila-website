# OFERTAS PREVIEW HEADER ACCEPTANCE PATCH — Logo Upload + Identity Scale + Membership CTA Cleanup

## 1. Task classification

**SCOPED GATED BUILD** — Screenshot-driven acceptance patch for Ofertas Locales preview header: logo file upload (existing Blob pipeline), larger identity block, stronger valid dates, removal of full-width membership strip, compact CTA integration.

## 2. Files inspected

- `OfertasLocalesApplicationClient.tsx` (Step 2 logo URL)
- `ofertasLocalesApplicationCopy.ts`
- `OfertasLocalesPreviewCard.tsx` (header identity, dates, membership strip, CTAs)
- `ofertasLocalesPreviewCopy.ts`
- `ofertasLocalesTypes.ts`, `createEmptyOfertaLocalDraft.ts`, `ofertasLocalesDraftPersistence.ts`
- `ofertasLocalesPreviewHelpers.ts`, `ofertasLocalesPublishMapper.ts`
- `ofertasLocalesAssetUpload.ts`, `ofertasLocalesClientUploadValidation.ts`, `ofertasLocalesStoragePaths.ts`
- API routes: `assets/upload`, `assets/upload-intent`, `assets/client-upload`

## 3. Files changed

- `app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx`
- `app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts`
- `app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewCard.tsx`
- `app/(site)/publicar/ofertas-locales/preview/ofertasLocalesPreviewCopy.ts`
- `app/lib/ofertas-locales/ofertasLocalesTypes.ts`
- `app/lib/ofertas-locales/createEmptyOfertaLocalDraft.ts`
- `app/lib/ofertas-locales/ofertasLocalesDraftPersistence.ts`
- `app/lib/ofertas-locales/ofertasLocalesPreviewHelpers.ts`
- `app/lib/ofertas-locales/ofertasLocalesPublishMapper.ts`
- `app/lib/ofertas-locales/ofertasLocalesClientUploadValidation.ts`
- `app/lib/ofertas-locales/ofertasLocalesStoragePaths.ts`
- `app/api/ofertas-locales/assets/upload/route.ts`
- `app/api/ofertas-locales/assets/upload-intent/route.ts`
- `app/api/ofertas-locales/assets/client-upload/route.ts`
- `app/lib/ofertas-locales/OFERTAS_PREVIEW_HEADER_ACCEPTANCE_AUDIT.md`
- `scripts/verify-ofertas-preview-header-acceptance.mjs`
- `package.json` (verifier script)

## 4. Screenshot issues addressed

| Issue | Fix |
|-------|-----|
| URL-only logo | Step 2: URL + file upload via existing Vercel Blob pipeline (`assetKind: logo`) |
| Small logo/monogram | 88–132px framed logo block with gold border |
| Weak business identity | “Negocio en oferta” label, larger serif business name, “Ofertas de {title}” |
| Tiny valid dates | VÁLIDO/VALID badge with burgundy label + charcoal dates |
| Long membership strip | Removed; compact Registrarse / Activar in CTA row when real URL exists |
| Dead white space | Cream/gold gradient card, tighter identity cluster layout |

## 5. Logo input/upload result

- **URL:** Preserved; `businessLogoUrl` unchanged.
- **File upload:** Supported via extended `OfertaLocalClientAssetKind` `"logo"` → Vercel Blob under `ofertas-locales/drafts/{owner}/logo/{assetId}/`.
- **Priority:** `businessLogoUploadedUrl` wins over pasted URL in `getOfertaLocalBusinessLogoUrl`.
- **Persistence:** `businessLogoUploadedUrl`, `businessLogoUploadedFileName` in localStorage draft.
- **Publish:** Logo URL included in publish `internal_notes` metadata as `businessLogoUrl`.

## 6. Logo/title scale result

- Mobile logo: ~88–96px; desktop: ~132px.
- Business name: up to ~2.35rem serif on desktop.
- Store label + offer title hierarchy clarifies “business with the sale.”

## 7. Valid dates result

- `validBadgeEs` / `validBadgeEn` (VÁLIDO / VALID) in gold-bordered badge.
- Mobile + desktop placement; location in separate compact chip.

## 8. Membership/rewards cleanup result

- Full-width strip with `membershipCopy` removed from preview header.
- Membership/digital coupon appear only as secondary outline buttons in CTA row when `membershipHref` / `digitalCouponHref` resolve.
- Hidden when no real URL.

## 9. CTA row result

Real actions only: Call, WhatsApp, Directions, Website, Share, plus compact membership/coupon when URLs exist. Burgundy primary, WhatsApp green, cream/gold outlines.

## 10. Deferred items

- Dedicated `logo_image` draft asset type in DB (uses flyer_image limits for upload validation).
- Business Hub compacting (separate gate).
- Public flyer overlay work (separate gate).

## 11. TRUE/FALSE table

| Criterion | Result |
|-----------|--------|
| logo URL input preserved | TRUE |
| logo file upload supported | TRUE |
| uploaded logo preview works | TRUE |
| logo persists through draft | TRUE |
| preview receives logo | TRUE |
| logo/monogram visually enlarged | TRUE |
| business/title hierarchy visibly stronger | TRUE |
| valid dates visibly stronger | TRUE |
| long membership strip removed | TRUE |
| membership CTA available when real URL exists | TRUE |
| membership hidden when no real URL | TRUE |
| CTA row shows only real actions | TRUE |
| no fake claim/redeem/wallet/save/cart | TRUE |
| mobile header no horizontal overflow | TRUE |
| ES/EN copy exists | TRUE |
| no public flyer overlay work touched | TRUE |
| no Business Hub compacting touched | TRUE |
| no scan/crop engine touched | TRUE |
| no Stripe/payment touched | TRUE |
| no admin/dashboard touched | TRUE |
| no unrelated categories touched | TRUE |
| build passed | TRUE |
