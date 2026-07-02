# Ofertas Review CTA Cleanup Audit

## Task classification

**MICRO PATCH / SCOPED UX FIX** — Ofertas Step 5 guided review deck labels and button behavior only.

## Files inspected

- `app/(site)/publicar/ofertas-locales/OfertasLocalesAiItemReviewPanel.tsx`
- `app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts`

## Files changed

- `app/(site)/publicar/ofertas-locales/OfertasLocalesAiItemReviewPanel.tsx`
- `app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts`
- `app/lib/ofertas-locales/OFERTAS_REVIEW_CTA_CLEANUP_AUDIT.md` (this file)
- `scripts/verify-ofertas-review-cta-cleanup.mjs`

## Old UX problem

The workspace editor showed duplicate/confusing CTAs: Save review, Keep, Needs review, Remove, Next, plus separate Approve & next / Reject & next blocks. Operators could not tell which action was primary, and reject had no confirmation.

## New CTA model

Guided review deck per selected product:

1. **Approve & next** — primary burgundy full-width action
2. **Review later** + **Save edits** — secondary row
3. **Back** / **Next** — small navigation
4. **Reject product** — small danger action with inline confirmation

## Approve behavior

`handleApproveAndNext` saves current edits, marks item approved, removes from active queue, selects next active item, decreases remaining count.

## Review later behavior

`handleReviewLater` does not approve or reject. Item stays in active queue (count unchanged). Local `deferredQueueTail` moves the item to the end of the session queue for the current page; next item opens. Helper copy explains the item still needs a final decision. No DB order change.

## Reject confirmation behavior

Click **Reject product** → inline confirmation panel with title/body and Cancel / Reject product. Only confirmed reject calls `handleStatusAndAdvance(..., "rejected")`, removes from active queue, opens next item.

## Active queue visibility decision

Bottom list retitled **View products on this page** / **Ver productos de esta página**, collapsed by default. Used only for jump navigation; normal flow is editor → action → next product.

## Language copy changes

EN/ES updated in `ofertasLocalesApplicationCopy.ts`. Operator-facing labels no longer use Keep/Mantener, Remove/Quitar, or Needs review/Necesita revisión. Status badges show To review / Por revisar, Approved / Aprobado, Rejected / Rechazado.

## Mobile notes

Same guided deck order; primary Approve & next remains thumb-friendly full width. Collapsed page product drawer reduces list scrolling during normal review.

## TRUE/FALSE table

| Check | Result |
|-------|--------|
| Keep/Mantener removed from main workflow | TRUE |
| Save review renamed to Save edits / Guardar cambios | TRUE |
| Needs review renamed to Review later / Revisar después | TRUE |
| Remove/Quitar replaced with Reject product / Rechazar producto | TRUE |
| Reject requires confirmation | TRUE |
| Approve & next is primary | TRUE |
| Review later does not approve/reject item | TRUE |
| Review later moves/defers item safely | TRUE (local session order) |
| Active queue no longer required as main workflow | TRUE |
| Progress copy is clear | TRUE |
| Raw needs_review is not shown to users | TRUE |
| ES/EN labels updated | TRUE |
| Viewer untouched | TRUE |
| Scan/crop untouched | TRUE |
| Stripe untouched | TRUE |
| Analytics untouched | TRUE |
| Other categories untouched | TRUE |
