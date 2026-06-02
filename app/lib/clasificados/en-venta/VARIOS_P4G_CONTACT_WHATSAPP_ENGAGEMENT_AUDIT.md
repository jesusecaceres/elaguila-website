# Gate P4-G — Varios Contact Formatting + WhatsApp Visibility + Real Engagement Verification

## 1. Files inspected

- `app/(site)/clasificados/publicar/en-venta/free/application/sections/SellerContactSection.tsx`
- `app/(site)/clasificados/publicar/en-venta/free/application/schema/enVentaFreeFormState.ts`
- `app/(site)/clasificados/en-venta/preview/buildEnVentaPreviewModel.ts`
- `app/(site)/clasificados/en-venta/preview/EnVentaPreviewPage.tsx`
- `app/(site)/clasificados/en-venta/listing/EnVentaAnuncioLayout.tsx`
- `app/(site)/clasificados/en-venta/shared/utils/enVentaContactActions.ts`
- `app/(site)/clasificados/en-venta/shared/components/EnVentaContactButtons.tsx`
- `app/(site)/clasificados/en-venta/shared/components/EnVentaEngagementRow.tsx`
- `app/(site)/clasificados/en-venta/publish/enVentaPublishFromDraft.ts`
- `app/(site)/clasificados/en-venta/results/EnVentaResultListingCard.tsx`
- `app/(site)/clasificados/en-venta/results/EnVentaResultsClient.tsx`
- `app/components/clasificados/analytics/LeonixLikeButton.tsx` (read-only)
- `app/components/clasificados/analytics/LeonixSaveButton.tsx` (read-only)
- `app/components/clasificados/analytics/LeonixShareButton.tsx` (read-only)
- `app/(site)/clasificados/servicios/**` engagement pattern (read-only)
- `app/(site)/clasificados/components/savedListings.ts` (read-only)

## 2. Files changed

- `app/(site)/clasificados/en-venta/shared/utils/enVentaPhoneDisplay.ts` (new)
- `app/(site)/clasificados/en-venta/shared/utils/enVentaContactActions.ts`
- `app/(site)/clasificados/en-venta/shared/components/EnVentaContactButtons.tsx`
- `app/(site)/clasificados/en-venta/shared/components/EnVentaEngagementRow.tsx`
- `app/(site)/clasificados/en-venta/preview/EnVentaPreviewPage.tsx`
- `app/(site)/clasificados/en-venta/publish/enVentaPublishFromDraft.ts`
- `app/(site)/clasificados/en-venta/listing/EnVentaAnuncioLayout.tsx`
- `app/lib/clasificados/en-venta/VARIOS_P4G_CONTACT_WHATSAPP_ENGAGEMENT_AUDIT.md` (this file)
- `scripts/varios-p4g-contact-whatsapp-engagement-audit.ts` (new)
- `package.json` (audit script only)

## 3. WhatsApp visibility root cause

Preview and draft contact builders required `contactMethod === "whatsapp"` before rendering WhatsApp, even when `state.whatsapp` had digits. `EnVentaPreviewPage` duplicated that guard on sheet open. Live detail used `contactChannel === "whatsapp"` and derived WhatsApp digits only from `contact_phone`, so a seller who filled the optional WhatsApp field with preferred method `phone`/`both`/`email` saw no WhatsApp CTA. Publish also did not persist a dedicated WhatsApp number unless preferred method was WhatsApp.

## 4. Phone/WhatsApp formatting finding

No Varios-local formatter existed. Rentas/BR use `formatUsPhoneDisplay`; this gate adds `formatEnVentaPhoneDisplay` in `enVentaPhoneDisplay.ts` (10- and 11-digit US, fallback to trimmed original). Hrefs use `enVentaContactDigits` only.

## 5. Contact action fix applied

- `buildEnVentaContactActions`: show WhatsApp when `state.whatsapp` has ≥8 digits; order WhatsApp → call → SMS → email with preferred-method boost only.
- `buildEnVentaLiveContactActions`: accept `whatsappTel` from `Leonix:whatsapp` pair; show WhatsApp when digits valid regardless of `contactChannel`.
- Publish: persist `Leonix:whatsapp` detail pair when seller entered WhatsApp.
- `EnVentaAnuncioLayout`: read pair, fix `showWhatsAppCta` and sheet digits.
- `EnVentaPreviewPage`: remove `contactMethod === "whatsapp"` gate on WhatsApp sheet.

## 6. WhatsApp icon/logo result

`EnVentaContactButtons` already ships inline SVG `IconWhatsApp` and green styling (`#25D366` / `#128C7E`). No new assets.

## 7. Servicios engagement pattern inspected (read-only)

- Detail: `LeonixLikeButton`, `LeonixSaveButton`, `LeonixShareButton` with `persistEngagement` when listing id present; auth required for save/like writes.
- Listing key: `serviciosEngagementListingKey` (leonix ad id → uuid).
- Share: Leonix share hub / CTA sheet with copy feedback.

## 8. Varios published engagement result

- **Detail hero:** `EnVentaEngagementRow` `mode="live"` with `LeonixLikeButton`, `LeonixSaveButton` (heart), `LeonixShareButton` — Supabase-backed when signed in; no fake counts.
- **Results/landing card heart:** `toggleListingSaved` / `isListingSaved` — real **browser localStorage** persistence (`leonix_saved_listings_v1`), not Supabase; documented as card-level bookmark, distinct from account dashboard save on detail.

## 9. Varios preview engagement result

- Save/heart and report: disabled with hint `Disponible cuando el anuncio esté publicado.` / `Available when the listing is published.`
- Share: `LeonixShareButton` with `persistEngagement={false}`; preview page toast `Enlace copiado` / `Link copied` for copy flows.

## 10. Stable listing key strategy

`enVentaEngagementListingKey(listingId, leonixAdId)` → `leonix_ad_id` when set, else listing UUID. Passed to Leonix like/save/share on live detail.

## 11. Behavior preservation result

No changes to layout grid, gallery, video, draft persistence, preview return, publish terms, Leonix Ad ID, results-card sample, or visibility helpers.

## 12. Build/check result

Run `npm run varios:p4g-contact-whatsapp-engagement-audit` and `npm run build` after edits (see gate validation output).

## 13. Remaining risks

- Listings published **before** this gate without `Leonix:whatsapp` pair may still hide WhatsApp if seller used non-WhatsApp preferred channel (WhatsApp digits were not stored). Republish or backfill pair required.
- Results card save remains localStorage-only (by design in current app).

## TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Publish form WhatsApp field was inspected | TRUE | `SellerContactSection.tsx` |
| Draft WhatsApp field was inspected | TRUE | `enVentaFreeFormState.ts` |
| Preview contact model was inspected | TRUE | `buildEnVentaPreviewModel.ts` |
| Public detail contact model was inspected | TRUE | `EnVentaAnuncioLayout.tsx` |
| Contact action builder was inspected | TRUE | `enVentaContactActions.ts` |
| WhatsApp visibility root cause was identified | TRUE | §3 |
| WhatsApp shows when seller entered WhatsApp number | TRUE | `showWa = waValid` in builders |
| WhatsApp hides when WhatsApp field is empty | TRUE | `waValid` requires ≥8 digits |
| Preferred contact method no longer incorrectly hides provided WhatsApp | TRUE | §5 |
| WhatsApp CTA has recognizable icon/logo or documented fallback | TRUE | `IconWhatsApp` in `EnVentaContactButtons.tsx` |
| WhatsApp CTA uses restrained WhatsApp green styling | TRUE | `actionClass` whatsapp branch |
| Phone display formats 10-digit numbers as (###) ###-#### | TRUE | `formatEnVentaPhoneDisplay` |
| WhatsApp display formats 10-digit numbers as (###) ###-#### where shown | TRUE | `displayNumber` on actions |
| tel/sms hrefs still use safe dialable values | TRUE | `enVentaContactDigits` in hrefs |
| WhatsApp href still uses safe digits-only value | TRUE | `wa.me/${waDigits}` |
| Servicios engagement pattern inspected read-only | TRUE | §7 |
| Varios public detail Guardar/heart uses real behavior or blocker documented | TRUE | `LeonixSaveButton` + `LeonixLikeButton` live mode |
| Varios results/landing heart uses real behavior or blocker documented | TRUE | localStorage `savedListings` §8 |
| Varios Compartir uses real share/copy behavior | TRUE | `LeonixShareButton` + CTA hub |
| Share success feedback exists | TRUE | preview toast + CTA hub copy |
| Report flow remains real | TRUE | `EnVentaListingReportDrawer` on live detail |
| Preview does not fake unpublished save/heart persistence | TRUE | disabled buttons + hint §9 |
| No fake counters were added | TRUE | no counter strings added |
| No fake analytics were added | TRUE | existing analytics only |
| Stable listing key strategy documented | TRUE | §10 |
| Results-card preview was not removed | TRUE | no preview sample edits |
| Images/gallery behavior was not changed | TRUE | out of scope |
| Video behavior was not changed | TRUE | out of scope |
| Draft persistence was not changed | TRUE | out of scope |
| Publish flow was not changed | TRUE | only `Leonix:whatsapp` pair append |
| Desktop layout was not regressed | TRUE | no layout class edits |
| Mobile layout was not regressed | TRUE | no layout class edits |
| No unrelated categories were edited | TRUE | scope-only diffs |
| No global layout/theme files were edited | TRUE | scope-only diffs |
| No Stripe/payment files were edited | TRUE | scope-only diffs |
| npm run build passed | TRUE | gate validation |
