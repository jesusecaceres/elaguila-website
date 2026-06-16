# Gate OL-7 — AI Scan Action + Candidate Review — Audit Results

Gate: **OL-7 — Ofertas Locales — AI Scan Action + Extracted Item/Coupon Review Flow**

## Summary

| Area | Result |
|------|--------|
| Root blocker | Step 7 `ofertaLocalId` requirement removed via `scan-prep` |
| AI readiness | Uploaded PDF/JPG/PNG detected; external URL excluded |
| Scan action | Real `POST /api/ofertas-locales/scan` with storage metadata |
| Candidates | Server-stored; review panel wired on Step 5 |
| Coupon lane | Partial — product normalizer + honest UI copy |
| Public safety | Unchanged — `review_status === approved` && `is_active` |
| Migration | None added |

## Files changed (scope)

- `app/lib/ofertas-locales/ofertasLocalesAiScanReadiness.ts`
- `app/lib/ofertas-locales/ofertasLocalesAiScanPersist.ts` (new)
- `app/lib/ofertas-locales/ofertasLocalesAiScanPersistClient.ts` (new)
- `app/lib/ofertas-locales/ofertasLocalesAiScanRecordPersistence.ts` (new)
- `app/lib/ofertas-locales/ofertasLocalesScanApiHandler.ts`
- `app/lib/ofertas-locales/ofertasLocalesTypes.ts`
- `app/api/ofertas-locales/scan-prep/route.ts` (new)
- `app/(site)/publicar/ofertas-locales/OfertasLocalesAiScanPanel.tsx`
- `app/(site)/publicar/ofertas-locales/OfertasLocalesAiItemReviewPanel.tsx`
- `app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx`
- `app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts`
- Plan + audit docs + audit script + package.json script

## Risks

1. **15 MB scan cap** — flyers uploaded up to 75 MB (OL-5) may fail at scan with real error.
2. **Document AI env** — production must have Google Document AI configured or scan returns 503.
3. **scan-prep insert** — creates `pending_review` row before Step 7; same moderation path as publish.

## Manual QA URL

https://www.leonixmedia.com/publicar/ofertas-locales?lang=es
