# Ofertas Step 5 — Progressive Upload + AI Scan + Review UX

**Task classification:** SCOPED UX POLISH BUILD  
**Date:** 2026-07-02

## Files inspected

- `app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx`
- `app/(site)/publicar/ofertas-locales/OfertasLocalesAiScanPanel.tsx`
- `app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts`

## Files changed

- `app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx`
- `app/(site)/publicar/ofertas-locales/OfertasLocalesAiScanPanel.tsx`
- `app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts`
- `app/lib/ofertas-locales/OFERTAS_STEP5_PROGRESSIVE_UX_AUDIT.md`
- `scripts/verify-ofertas-step5-progressive-ux.mjs`
- `package.json` (verifier script only)

## Old Step 5 issue

Step 5 rendered a vertical stack: upload hints, asset sections, upload warnings, AI scan panel (with duplicate scan CTAs for single files), clickable item preview, and delete/start-over — all visible at once. Users could not tell which action was next even though the engine worked.

## New checkpoint model

| Checkpoint | Complete when | Open when |
|------------|---------------|-----------|
| **upload** | Primary lane asset uploaded/saved, no pending local metadata | Upload incomplete or user editing files |
| **scan** | AI add-on off, OR scan job/items exist | Upload complete, AI on, scan not done |
| **review** | AI off, OR scan done and no pending AI review items | Scan complete, review incomplete |

Derived: `step5ActiveCheckpoint` drives auto-open; manual expand via card toggle without clearing scan session.

## Upload card behavior

- Accordion card with title, collapsed summary (file name + ready/pending).
- Collapses when upload complete; reopen via header or “Replace / Edit files”.
- View/preview link when URL available.
- Reopening upload does not wipe scan session.

## Scan card behavior

- Shown only when AI add-on selected.
- Locked until upload complete with ES/EN lock copy.
- Embeds simplified `OfertasLocalesAiScanPanel` in `compactMode`.
- Collapses after scan complete; shows product count summary.
- Single primary scan CTA (no duplicate per-file + bottom button for one asset).

## Review card behavior

- Locked until scan complete.
- Summary shows pending/approved/rejected counts.
- “Review products” scrolls to full-width review workbench ref.
- Complete message when all required items reviewed.

## Locking behavior

- Next disabled until upload complete.
- With AI: Next also blocked until scan complete and review complete.
- Lock messages use `step5CheckpointLockedScan`, `step5CheckpointLockedReview`, `step5CheckpointLockedNext`.

## Workbench focus behavior

- `reviewWorkbenchRef` on full-width `OfertasLocalesAiScanReviewWorkspace` section.
- `scrollToReviewWorkbench()` uses `scrollIntoView({ behavior: 'smooth', block: 'start' })`.

## Intentionally not touched

- Preview routes/cards
- Scan API, crop engine, Gemini pipeline
- Stripe, analytics, admin, dashboard
- Other categories
- Supabase migrations
- `.env.local`, PDF fixtures

## TRUE/FALSE/PARTIAL audit table

| Check | Result |
|-------|--------|
| Step 5 has upload checkpoint | TRUE |
| Upload checkpoint collapses when complete | TRUE |
| Upload summary still shows file name/status | TRUE |
| Step 5 has scan checkpoint | TRUE |
| Scan checkpoint locked until upload complete | TRUE |
| Scan checkpoint collapses after scan complete | TRUE |
| Repeated scan CTA removed | TRUE |
| Scan again is not primary after scan complete | TRUE |
| Step 5 has review checkpoint | TRUE |
| Review checkpoint locked until scan complete | TRUE |
| Review products CTA scrolls to workbench | TRUE |
| Step 5 Next remains locked until AI review complete | TRUE |
| AI not selected path still works | TRUE |
| Delete/start-over remains secondary danger | TRUE |
| Coupon lane still works | TRUE |
| Flyer lane still works | TRUE |
| Preview untouched | TRUE |
| Scan/crop engine untouched | TRUE |
| Stripe untouched | TRUE |
| Analytics untouched | TRUE |
| Admin/dashboard untouched | TRUE |
| Other categories untouched | TRUE |
| No Supabase migration added | TRUE |
