# A5.INTERACTIONS-01 — Autos Negocios Direct Contact + Like/Share + Preview Alignment Audit

## Gate title

A5.INTERACTIONS-01 — Autos Negocios Direct Contact + Like/Share + Preview Alignment Truth Pass

## Task classification

SCOPED GATED BUILD

## Root cause

`AutosSheetCtaLink` intercepted `tel:`, `sms:`, `mailto:`, and `wa.me` hrefs and opened `CtaActionSheet` modals instead of native dialer/SMS/WhatsApp/email apps. Share used the Leonix share hub drawer instead of `navigator.share` + clipboard fallback.

## Files changed

- `app/(site)/clasificados/autos/shared/components/AutosDirectContactLink.tsx` (new)
- `app/(site)/clasificados/autos/negocios/components/DealerBusinessStack.tsx`
- `app/(site)/clasificados/autos/negocios/components/DealerFinanceContact.tsx`
- `app/(site)/clasificados/autos/shared/components/AutosEngagementRow.tsx`
- `app/(site)/clasificados/autos/negocios/components/AutosNegociosPreviewEngagementStrip.tsx` (new)
- `app/(site)/clasificados/autos/negocios/components/AutosNegociosResultsCardPreview.tsx` (new)
- `app/(site)/clasificados/autos/negocios/components/AutoDealerPreviewPage.tsx`
- `app/(site)/clasificados/autos/negocios/components/VehicleSpecsGrid.tsx`
- `app/(site)/clasificados/autos/negocios/preview/AutosNegociosPreviewClient.tsx`
- `app/lib/clasificados/autos/AUTOS_A5_INTERACTIONS_01_NEGOCIOS_DIRECT_CONTACT_LIKE_SHARE_PREVIEW_ALIGNMENT_AUDIT.md` (new)
- `scripts/autos-a5-interactions-01-negocios-direct-contact-like-share-preview-alignment-audit.ts` (new)
- `package.json` (verifier script only)

## Contact action result

| Action | Behavior |
|--------|----------|
| **Call** | `<a href="tel:...">` via `AutosDirectContactLink` + `phone_click` |
| **SMS/Text** | `<a href="sms:...">` + `message_click` |
| **WhatsApp** | `<a href="https://wa.me/...">` + `whatsapp_click` |
| **Email** | `<a href="mailto:...">` + `email_click` |
| **Directions** | Direct Google Maps `<a>` (unchanged) + `directions_click` |
| **Website** | Direct external `<a>` + `website_click` |
| **Schedule test drive** | Direct external booking link + schedule event |

## Removed/bypassed modals

- Call modal — bypassed (no `CtaActionSheet` on contact CTAs in Negocios hub)
- Message modal — bypassed
- Directions modal — never existed; Maps opens directly

## Like / Share result

| Item | Detail |
|------|--------|
| **Placement** | Public: `AutosEngagementRow` in aside (not contact block). Draft: `AutosNegociosPreviewEngagementStrip` above gallery |
| **Like format** | `countDisplay="numeric"`, `numericShowZero`, `previewLabelMode="iconOnly"` → `0 ♡` / `N ♥` |
| **Public Like** | DB-backed via `autosGlobalLikeRecorderFromContext`, UUID `listingSourceId` |
| **Preview Like** | `persistEngagement={false}`, no fake analytics |
| **Share** | `directNativeShare` → `navigator.share` + clipboard fallback |
| **Public Share** | Real `listingUrl`, `listing_share` via `autosGlobalShareRecorderFromContext` |

## TRUE/FALSE audit table

| Check | Result |
|-------|--------|
| Correct repo confirmed | TRUE |
| Contact action files found | TRUE |
| Old Call modal bypassed/removed | TRUE |
| Old Message modal bypassed/removed | TRUE |
| Directions modal bypassed/removed | TRUE |
| Call opens tel directly | TRUE |
| SMS opens sms directly | TRUE |
| WhatsApp opens wa.me directly | TRUE |
| Email uses approved direct behavior | TRUE |
| Directions opens Google Maps directly | TRUE |
| Empty actions hide | TRUE |
| Like is count + heart only | TRUE |
| Like is DB-backed in public | TRUE |
| Preview Like does not fake analytics | TRUE |
| Share uses navigator.share | TRUE |
| Clipboard fallback works | TRUE |
| Public Share uses real public URL | TRUE |
| Preview Share is truthful | TRUE |
| Share event remains real | TRUE |
| No duplicate Like/Share | TRUE |
| CTAs isolated from card navigation | TRUE |
| Analytics identity unchanged | TRUE |
| No duplicate analytics | TRUE |
| No fake saves/messages/leads | TRUE |
| Top result-preview card alignment improved | TRUE |
| Main listing card alignment improved | TRUE |
| Mobile safe | TRUE |
| Autos Privado untouched | TRUE |
| Dashboard untouched | TRUE |
| Admin untouched | TRUE |
| Stripe untouched | TRUE |
| Supabase untouched | TRUE |
| Unrelated categories untouched | TRUE |
| Build passed | TRUE |
| Ready for Chuy QA | TRUE |

Final recommendation: **GREEN**
