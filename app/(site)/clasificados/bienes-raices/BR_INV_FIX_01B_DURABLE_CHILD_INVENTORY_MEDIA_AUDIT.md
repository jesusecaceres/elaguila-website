# BR-INV-FIX-01B — Durable Child Inventory + Media Persistence Audit

**Gate:** BR-INV-FIX-01B  
**Title:** Durable Child Inventory + Media Persistence  
**Date:** 2026-05-19

## 1. Gate name

BR-INV-FIX-01B

## 2. Files inspected

- `BR_INV_B_DRAWER_SHELL_AUDIT.md`, `BR_INV_C_PROPERTY_DRAWER_FIELDS_AUDIT.md`, `BR_INV_D_INVENTORY_PREVIEW_CARDS_AUDIT.md`, `BR_INV_E_FAST_REAL_PUBLISH_QUEUE_AUDIT.md`
- `brNegocioAdditionalInventoryDraft.ts`, `BrNegocioPrePublishInventoryDrawerForm.tsx`, `BrNegocioPrePublishInventoryShell.tsx`
- `agente-individual/application/utils/previewDraft.ts`, `application/utils/bienesRaicesPreviewDraft.ts`
- `brNegocioInventoryPublishQueue.ts`, `brNegocioInventoryQueuePrefill.ts`
- BR Privado / Rentas paths (regression read only)

## 3. Files changed

- `brNegocioAdditionalInventoryDraft.ts` — photoUrls, primaryPhotoIndex, video/tour/brochure/mls/listado URLs
- `brNegocioInventoryDraftPersistence.ts` (new) — session strip + in-memory media bridge
- `BrNegocioPrePublishInventoryDrawerMedia.tsx` (new) — child gallery + link fields
- `BrNegocioPrePublishInventoryDrawerForm.tsx` — media section wired
- `brNegocioPrePublishInventoryShellCopy.ts` — media copy ES/EN
- `BrNegocioPrePublishInventoryDrawerShell.tsx` — normalize on save
- `BrNegocioPrePublishInventoryShell.tsx` — normalized list updates
- `brNegocioInventoryCardModel.ts` — cover from child gallery
- `brNegocioInventoryQueuePrefill.ts` — full media prefill for add-mode
- `brNegocioInventoryPublishQueue.ts` — queue strip/bridge; queue does not clear early
- `previewDraft.ts`, `bienesRaicesPreviewDraft.ts` — preview/back child inventory durability
- `AgenteIndividualResidencialApplication.tsx`, `ResumenPublicarNegocioSection.tsx` — bridge on inventory change
- `BR_INV_FIX_01B_DURABLE_CHILD_INVENTORY_MEDIA_AUDIT.md`, `scripts/br-inv-fix-01b-durable-child-inventory-media-audit.ts`, `package.json`

## 4. Child property application

Drawer remains property-only (no agent/contact/finance). Full property details + media links inside drawer.

## 5. Child media

Multi-photo gallery with cover selection, URL paste, device upload (data: in session). Optional URLs: listado, video, tour, brochure, MLS.

## 6. Persistence

- In-memory `childInventoryMediaBridge` preserves data: child photos same-tab
- sessionStorage writes strip data: blobs from child inventory (quota-safe)
- Preview/back merge bridge into `additionalInventoryProperties`
- Queue write/read uses same strip + bridge pattern

## 7. Preview cards

Cover photo from `photoUrls[primaryPhotoIndex]` via `childInventoryCoverPhotoUrl`.

## 8. Queue/prefill readiness

`applyInventoryDraftToAgenteFormState` / `applyInventoryDraftToNegocioFormState` map photos + media URLs. Queue advances only after successful child publish; not cleared on preview navigation.

## 9. Cover image limitation

data: child photos persist same-tab via bridge (preview/back/queue prefill). Full browser restart without durable upload remains a 01C item.

## 10. Regression audit

| Lane | Touched? | Result |
|------|----------|--------|
| BR Privado regression audit | FALSE | No inventory drawer added |
| Rentas Privado regression audit | FALSE | Untouched |
| Rentas Negocio regression audit | FALSE | Untouched |
| Autos | FALSE | Untouched |

## 11. Intentionally not touched

Child publish mapping beyond prefill, Supabase/schema, Stripe/payment, analytics, hub card (01A), batch publish.

## 12. Manual QA checklist

- [ ] Add child property with photos + tour URL in drawer
- [ ] Save; navigate steps; inventory count/cards persist
- [ ] Open preview and return; child inventory + photos persist
- [ ] Publish main with children; queue retains remaining items
- [ ] Publish next child; prefill shows child photos/links
- [ ] No fake public URLs or Leonix IDs on draft cards
- [ ] BR Privado/Rentas unchanged

## 13. No stage / commit / push

This gate did not stage, commit, or push.
