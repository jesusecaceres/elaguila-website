# Stack 12 — Google Document AI Scan API Audit

**Script:** `npm run ofertas-locales:stack-12-document-ai-scan-audit`

## 1. Stack summary

First Google Document AI scan API for Ofertas Locales: server-only config, client wrapper, deterministic normalizer placeholder, authenticated `POST /api/ofertas-locales/scan`, and draft UI scan trigger.

## 2. Google Document AI config (exact env names)

- `GOOGLE_DOCUMENT_AI_CREDENTIALS_JSON`
- `GOOGLE_DOCUMENT_AI_PROJECT_ID`
- `GOOGLE_DOCUMENT_AI_PROCESSOR_LOCATION`
- `GOOGLE_DOCUMENT_AI_OCR_PROCESSOR_ID`

Translation env names (`GOOGLE_CLOUD_PROJECT_ID`, `GOOGLE_APPLICATION_CREDENTIALS_JSON`) are **not** used.

## 3. Scan API behavior

POST only, Bearer auth, ownership check on `ofertas_locales`, scan job insert → Document AI → item candidates → `needs_review` or `failed`.

## 4. Readiness behavior

`getOfertaLocalAiScanReadiness` requires AI add-on, uploaded asset URL, submitted `ofertaLocalId`, and reports server config at scan time.

## 5. Raw extraction

`processOfertaLocalAssetWithDocumentAi` returns text, pages, entities summary — no credentials in response.

## 6. Normalizer placeholder

Deterministic line parser; candidates default `pending`/`needs_review`, `is_active: false`.

## 7. DB safety

No public SELECT; no `approved` items; no `is_active: true`; fails if Stack 11 tables missing.

## 8. Public exposure

Nothing extracted goes public in this stack.

## 9. Not implemented

Owner review UI, public search/results, shopping list, Maps route, payment, admin, analytics.

## 10. Google Cloud activation checklist

- [x] Project + OCR processor in Vercel env
- [ ] Stack 11 migration applied to target DB
- [ ] Live scan smoke after DB apply

## 11. Recommended next stack

**Stack 13 — Owner item review UI** (approve/reject extracted items) + **Stack 11 DB apply gate**.

## QA URLs

- https://www.leonixmedia.com/publicar/ofertas-locales?lang=es
- https://www.leonixmedia.com/publicar/ofertas-locales?lang=en
- https://www.leonixmedia.com/publicar/ofertas-locales/preview?lang=es
- https://www.leonixmedia.com/publicar/ofertas-locales/preview?lang=en
