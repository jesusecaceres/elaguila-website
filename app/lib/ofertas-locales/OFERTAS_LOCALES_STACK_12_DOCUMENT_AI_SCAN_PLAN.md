# Stack 12 — Google Document AI Scan API Plan

## 1. Existing API/auth/Supabase pattern found

| Area | Pattern |
|------|---------|
| Auth | `getBearerUserId(req)` from `Authorization: Bearer <access_token>` |
| Upload | `ofertasLocalesOwnerIdFromBearer` → Vercel Blob public URL |
| Publish | `getAdminSupabase()` service role insert into `ofertas_locales` |
| Runtime | `export const runtime = "nodejs"` on API routes |
| Errors | JSON `{ ok: false, error, detail }` with HTTP status codes |

## 2. Uploaded asset metadata compatibility

`OfertaLocalDraftAsset` provides `id`, `url` (public blob), `storagePath`, `mimeType`, `fileName`.  
Scan API loads bytes via **HTTPS fetch of public `assetUrl`** (same as upload route output).

## 3. Google Document AI env/config (exact names)

| Env var | Purpose |
|---------|---------|
| `GOOGLE_DOCUMENT_AI_CREDENTIALS_JSON` | Service account JSON (server-only) |
| `GOOGLE_DOCUMENT_AI_PROJECT_ID` | `leonix-media-ai` |
| `GOOGLE_DOCUMENT_AI_PROCESSOR_LOCATION` | `us` |
| `GOOGLE_DOCUMENT_AI_OCR_PROCESSOR_ID` | `21e61c81466a0933` |

**Not used:** `GOOGLE_APPLICATION_CREDENTIALS_JSON`, `GOOGLE_CLOUD_PROJECT_ID`, translation env names.

## 4. Processor strategy

Document OCR processor first (`GOOGLE_DOCUMENT_AI_OCR_PROCESSOR_ID`). Custom extractor deferred.

## 5. Scan request shape

```json
{
  "ofertaLocalId": "uuid",
  "assetId": "draft-asset-id",
  "assetKind": "flyer" | "coupon",
  "assetUrl": "https://…",
  "storagePath": "optional",
  "mimeType": "application/pdf" | "image/jpeg" | …
}
```

## 6. Scan job lifecycle

`pending` → `processing` → `needs_review` | `failed`  
On success: `pages_processed`, `items_extracted_count`, `confidence_average` updated.

## 7. Raw extraction storage

Stack 12: structured summary in API response only; DB stores counts/paths placeholders. Full raw JSON → object storage in a later stack.

## 8. Leonix normalizer placeholder

Deterministic line parser for price-like patterns; all candidates `review_status: pending|needs_review`, `is_active: false`.

## 9. Item candidate insert

`mapOfertaLocalSearchableItemDraftToDbInsert` via service role; never `approved`, never `is_active: true`.

## 10. Failure/error handling

| Condition | Response |
|-----------|----------|
| Missing auth | 401 |
| Missing Google env | 503 + `configurationMissing: true` |
| DB tables missing | 503 + clear message |
| Asset fetch fail | scan job `failed` |
| Document AI error | scan job `failed` |

## 11. Cost guardrails

- Max file size 15 MB (flyer upload limit)
- Max 12 pages processed metadata
- One scan per API request (no batch)
- Auth required

## 12. Gate B/C implementation

- `ofertasLocalesDocumentAiConfig.ts`, `ofertasLocalesDocumentAiClient.ts`
- `ofertasLocalesAiNormalizer.ts`, `ofertasLocalesAiScanReadiness.ts`
- `POST /api/ofertas-locales/scan`
- Draft UI scan panel (steps 5 + 7)

## 13. Remains pending

Owner item review UI, public search/results, shopping list, Maps route, payment, admin moderation UI.

## 14. Google Cloud activation checklist

- [x] Project `leonix-media-ai`
- [x] Document OCR processor in `us`
- [x] Vercel env vars (Production + Preview)
- [ ] Stack 11 migration applied to production DB (apply gate)
- [ ] End-to-end scan smoke after DB apply

## 15. QA URLs

- https://www.leonixmedia.com/publicar/ofertas-locales?lang=es
- https://www.leonixmedia.com/publicar/ofertas-locales?lang=en
- https://www.leonixmedia.com/publicar/ofertas-locales/preview?lang=es
- https://www.leonixmedia.com/publicar/ofertas-locales/preview?lang=en
