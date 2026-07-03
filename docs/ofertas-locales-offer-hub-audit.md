# Ofertas Locales — Offer Hub + Flyer/Coupon Lane Cleanup + Final Review Foundation

**Gate title:** Ofertas Locales — Offer Hub + Flyer/Coupon Lane Cleanup + Final Review Foundation  
**Task classification:** SCOPED GATED BUILD  
**Date:** 2026-07-02

## Files inspected

- `app/lib/ofertas-locales/ofertasLocalesTypes.ts`
- `app/lib/ofertas-locales/createEmptyOfertaLocalDraft.ts`
- `app/lib/ofertas-locales/ofertasLocalesDraftPersistence.ts`
- `app/lib/ofertas-locales/ofertasLocalesApplicationHelpers.ts`
- `app/lib/ofertas-locales/ofertasLocalesPublishMapper.ts`
- `app/lib/ofertas-locales/ofertasLocalesPreviewHelpers.ts`
- `app/lib/ofertas-locales/ofertasLocalesPublicSearchHelpers.ts`
- `app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts`
- `app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx`
- `app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewCard.tsx`
- `app/(site)/publicar/ofertas-locales/preview/ofertasLocalesPreviewCopy.ts`
- `app/lib/ofertas-locales/ofertasLocalesDraftPersistence.ts`
- `app/lib/ofertas-locales/ofertasLocalesAiScanRecordPersistence.ts`
- `app/lib/ofertas-locales/useOfertasLocalesDraft.ts`

## Files changed

- `app/lib/ofertas-locales/ofertasLocalesTypes.ts`
- `app/lib/ofertas-locales/createEmptyOfertaLocalDraft.ts`
- `app/lib/ofertas-locales/ofertasLocalesDraftPersistence.ts`
- `app/lib/ofertas-locales/ofertasLocalesApplicationHelpers.ts`
- `app/lib/ofertas-locales/ofertasLocalesPublishMapper.ts`
- `app/lib/ofertas-locales/ofertasLocalesPreviewHelpers.ts`
- `app/lib/ofertas-locales/ofertasLocalesPublicSearchHelpers.ts`
- `app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts`
- `app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx`
- `app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewCard.tsx`
- `app/(site)/publicar/ofertas-locales/preview/ofertasLocalesPreviewCopy.ts`
- `docs/ofertas-locales-offer-hub-audit.md`
- `scripts/ofertas-locales-offer-hub-audit.ts`
- `package.json` (audit script only)

## Product decision: weekly flyer vs coupon/promotion

| Lane | Purpose | Step 5 | Step 6 extras |
|------|---------|--------|---------------|
| **Weekly flyer** (`shopping_specials`) | Full weekly flyers, supermarket/market ads, AI searchable product extraction | Main flyer upload only; optional coupon upload block removed from core UI | Offer Hub (all lanes); optional membership/rewards for market-type businesses |
| **Coupon/promotion** (`local_coupons`) | Coupons, promos, restaurant/service deals | Main coupon asset upload + optional promo flyer | Offer Hub (all lanes); digital coupon URL/instructions |

Old drafts retaining `couponAssets` on flyer lane continue to hydrate; data is not deleted.

## Offer Hub / Business Hub-Lite field list

| Field | Draft | Publish storage | Public preview |
|-------|-------|-----------------|----------------|
| Email | `email` | `internal_notes` metadata `contactEmail` (no DB column) | mailto + copy when valid |
| Facebook | `facebookUrl` | `metadata.socialLinks.facebookUrl` | Follow pill |
| Instagram | `instagramUrl` | metadata | Follow pill |
| TikTok | `tiktokUrl` | metadata | Follow pill |
| YouTube | `youtubeUrl` | metadata | Follow pill |
| X / Twitter | `xTwitterUrl` | metadata | Follow pill |
| LinkedIn | `linkedinUrl` | metadata | Follow pill |
| Snapchat | `snapchatUrl` | metadata | Follow pill |
| Pinterest | `pinterestUrl` | metadata | Follow pill |
| Google Business | `googleBusinessUrl` | metadata | Business pill |
| Google Reviews | `googleReviewUrl` | metadata | Reviews pill |
| Yelp | `yelpUrl` | metadata | Reviews pill |
| Phone / WhatsApp / Website / Directions | existing contact fields | existing columns | direct CTAs |

## Contact CTA truth table

| CTA | Shown when | Behavior |
|-----|------------|----------|
| Phone | Valid phone | `tel:` link |
| WhatsApp | Valid WhatsApp/phone | `wa.me` link |
| Website | Valid URL | direct external link |
| Directions | Address or directions URL | Google Maps search or URL |
| Email | Valid email format | mailto + copy button |
| Social pills | Valid normalized URL only | labeled pill, no raw URL text |
| Membership | Membership block data + URL | external link only |
| Digital coupon | Coupon lane + URL | external link only |

## Social platform truth table

| Platform | Application Step 6 | Draft persist | Publish metadata | Preview |
|----------|-------------------|---------------|------------------|---------|
| Facebook | optional URL | yes | yes | Follow |
| Instagram | optional URL | yes | yes | Follow |
| TikTok | optional URL | yes | yes | Follow |
| YouTube | optional URL | yes | yes | Follow |
| X / Twitter | optional URL | yes | yes | Follow |
| LinkedIn | optional URL | yes | yes | Follow |
| Snapchat | optional URL | yes | yes | Follow |
| Pinterest | optional URL | yes | yes | Follow |
| Google Business | optional URL | yes | yes | Business |
| Google Reviews | optional URL | yes | yes | Reviews |
| Yelp | optional URL | yes | yes | Reviews |

Empty fields are omitted everywhere public-facing.

## Persistence / hard-refresh result

- Draft uses existing `localStorage` primary + `sessionStorage` fallback via `ofertasLocalesDraftPersistence.ts`.
- New fields (`email`, `xTwitterUrl`, `linkedinUrl`, `snapchatUrl`, `pinterestUrl`) merge with empty-string defaults for old drafts.
- AI scan session persistence unchanged (`ofertasLocalesAiScanRecordPersistence.ts`).
- Delete/start-over copy clarifies browser draft vs DB AI products.

## Preview readiness result

Foundation only (not full premium redesign):

- Offer Hub sections: Contact business, Location, Follow us, Google Business, Reviews
- Trust cue: **Publicado en Leonix** / **Published on Leonix** (not “verified”)
- Email mailto/copy when present
- Brand-aware social pills, valid URLs only
- Submit blocked when AI `needsReviewCount > 0` (preview page)

## Deferred items for later preview polish

- Full premium Offer Hub layout / mockup alignment
- Share/report Leonix components (if not already wired in allowed Ofertas scope)
- Public results/landing Offer Hub parity
- Rejected-items filter in Step 7 review buttons (currently navigates to Step 5; queue filter deferred)
- Icon library polish for social platforms
- Public detail page email display from `contactEmail` metadata (publish path ready; public routes locked this gate)

## TRUE/FALSE audit table

| Check | Result |
|-------|--------|
| Weekly flyer lane is separate from coupon/promotion lane | TRUE |
| Coupon/promotion lane still exists | TRUE |
| Flyer lane no longer pushes coupon upload clutter as a core step | TRUE |
| Email is supported or honestly documented if not possible without DB changes | TRUE |
| Facebook supported | TRUE |
| Instagram supported | TRUE |
| TikTok supported | TRUE |
| YouTube supported | TRUE |
| X/Twitter supported | TRUE |
| LinkedIn supported | TRUE |
| Snapchat supported | TRUE |
| Pinterest supported | TRUE |
| Google Business supported | TRUE |
| Google Reviews supported | TRUE |
| Yelp supported | TRUE |
| Empty social fields are hidden | TRUE |
| Raw URLs are not shown publicly | TRUE |
| Phone opens tel: | TRUE |
| WhatsApp opens direct WhatsApp/browser link | TRUE |
| Website opens direct | TRUE |
| Directions opens direct | TRUE |
| Email opens/copies if present | TRUE |
| No fake ratings/reviews added | TRUE |
| No fake verified badge added | TRUE |
| No fake save/list feature added | TRUE |
| Trust cue uses "Published on Leonix / Publicado en Leonix" | TRUE |
| Step 7 shows pricing/plan summary | TRUE |
| Step 7 shows AI summary only if AI selected/scanned | TRUE |
| Rescan is not a confusing primary action after scan exists | TRUE |
| Preview CTA is gated by confirmations | TRUE |
| Submit remains blocked if AI review is incomplete | TRUE |
| Hard refresh persistence preserved | TRUE |
| Old drafts hydrate safely | TRUE |
| Spanish/English copy exists | TRUE |
| Mobile layout remains usable | TRUE |
| No unrelated categories changed | TRUE |
| No Supabase migration added | TRUE |
| No Stripe/payment files touched | TRUE |
| npm run build passed | TRUE |
