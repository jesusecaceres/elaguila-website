# Ofertas Durable Draft + Review Control Audit

## Task classification

**SCOPED GATED BUILD** — Ofertas draft/scan session durability, NorCal city suggestions, review page continuation, Step 7 control center.

## Files inspected

- `app/lib/ofertas-locales/ofertasLocalesDraftPersistence.ts`
- `app/lib/ofertas-locales/ofertasLocalesAiScanRecordPersistence.ts`
- `app/lib/ofertas-locales/useOfertasLocalesDraft.ts`
- `app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx`
- `app/(site)/publicar/ofertas-locales/OfertasLocalesAiItemReviewPanel.tsx`
- `app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts`
- `app/lib/ofertas-locales/ofertasLocalesLocationHelpers.ts`

## Files changed

- `ofertasLocalesDraftPersistence.ts`
- `ofertasLocalesAiScanRecordPersistence.ts`
- `ofertasLocalesLocationHelpers.ts`
- `ofertasLocalesApplicationCopy.ts`
- `OfertasLocalesApplicationClient.tsx`
- `OfertasLocalesAiItemReviewPanel.tsx`
- `OFERTAS_DURABLE_DRAFT_REVIEW_CONTROL_AUDIT.md`
- `scripts/verify-ofertas-durable-draft-review-control.mjs`
- `package.json` (verifier script)

## Persistence audit before/after

| Item | Before | After |
|------|--------|-------|
| Draft backend | sessionStorage only | localStorage primary, sessionStorage fallback + sync |
| Legacy localStorage | Cleared on every load | Preserved; session migrated into local when empty |
| Scan session | sessionStorage only | localStorage primary, sessionStorage fallback + sync |
| Tab close | Lost draft/scan | Restored from localStorage |
| Intentional clear | `clearOfertaLocalDraftStorage()` / `clearOfertaLocalAiScanSession()` | Clears both backends |

## Storage strategy

- Same keys (`leonix:ofertas-locales:draft:v1`, `leonix:ofertas-locales:ai-scan-session:v1`).
- On load: migrate session → local if local empty.
- On save: write local first, then session backup.
- No raw PDF/base64 — only existing draft metadata and scan IDs.

## What clears draft/session

- Delete application / start over (`handleStartFresh`) after confirm.
- `resetDraft()` + explicit scan clear in start-over flow only.

## What does not clear draft/session

- Refresh / hard refresh
- Language switch (lang is URL-only; draft hook hydrates once)
- Tab close / reopen
- Wizard step navigation

## NorCal city suggestions result

- `OFERTA_LOCAL_NORCAL_CITY_SUGGESTIONS` in location helpers (32 cities).
- City field uses datalist; free text unchanged.
- Helper copy: San Jose/NorCal examples are suggestions, not limits.

## Review workbench alignment / page CTA result

- **Continue to Page {n}** copy in ES/EN near selected product editor.
- Page-complete card placed below editor actions (not only in header).
- `proceedToNextPage` scrolls review workbench into view and selects first item on next page via existing selection context.
- All-pages-complete message uses `aiReviewAllPagesComplete`.

## Step 7 summary / control center result

- When scan exists: AI scan summary with total/approved/review later/rejected/pending counts.
- Primary actions: Continue reviewing, pending/rejected shortcuts, View preview.
- Scan panel moved to collapsed **Need to rescan?** with warning (not primary).
- Full review desk remains on Step 5 only.

## Featured exposure section result

- Hidden in Step 6 UI (`wantsFeaturedPlacement` field preserved in draft).
- Step 7 “more exposure” promo block removed from pricing summary.

## Deferred Preview polish

- Preview layout/visual redesign untouched per gate lock.

## TRUE/FALSE/PARTIAL table

| Check | Result |
|-------|--------|
| draft uses durable localStorage primary | TRUE |
| sessionStorage fallback remains | TRUE |
| old session draft migrates to durable storage | TRUE |
| legacy localStorage is not cleared on load | TRUE |
| hard refresh restores draft | TRUE |
| tab close/reopen restores draft | TRUE |
| language switch restores draft | TRUE |
| scan session uses durable localStorage primary | TRUE |
| scan session restores ofertaLocalId | TRUE |
| scan session restores lastScanJobId | TRUE |
| delete/start-over clears draft/session intentionally | TRUE |
| raw PDF/base64 not stored in localStorage | TRUE |
| uploaded asset metadata preserved | TRUE |
| NorCal city suggestions restored | TRUE |
| city remains free text | TRUE |
| city suggestions are not limits | TRUE |
| review page-complete CTA appears near editor | TRUE |
| Continue to Page X opens next page/form | TRUE |
| all-pages-complete state is clear | TRUE |
| main Next remains locked until all pages complete | TRUE |
| Step 7 shows AI scan summary when scan exists | TRUE |
| Step 7 rescan action is not primary after scan exists | TRUE |
| featured exposure section hidden/de-emphasized | TRUE |
| Preview visual redesign untouched | TRUE |
| scan/crop engine untouched | TRUE |
| Stripe untouched | TRUE |
| analytics untouched | TRUE |
| admin/dashboard untouched | TRUE |
| other categories untouched | TRUE |
