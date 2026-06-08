# BR-INV-E-FAST — Real Inventory Publish Queue Audit

**Gate:** BR-INV-E-FAST  
**Title:** Publish Real Inventory Using Existing Add-Mode Flow  
**Date:** 2026-05-19

## 1. Gate name

BR-INV-E-FAST — sequential real publish of BR Negocio additional inventory via existing BR13 `inventoryMode=add` path.

## 2. Files inspected

- `app/(site)/clasificados/bienes-raices/BR_INV_A_SUPABASE_BACKING_AUDIT.md`
- `app/(site)/clasificados/bienes-raices/BR_INV_B_DRAWER_SHELL_AUDIT.md`
- `app/(site)/clasificados/bienes-raices/BR_INV_C_PROPERTY_DRAWER_FIELDS_AUDIT.md`
- `app/(site)/clasificados/bienes-raices/BR_INV_D_INVENTORY_PREVIEW_CARDS_AUDIT.md`
- `app/(site)/clasificados/lib/leonixBrPropertyInventoryAddFlow.ts`
- `app/(site)/clasificados/lib/leonixBrPropertyInventoryPolicy.ts`
- `app/(site)/clasificados/lib/leonixPublishRealEstateFromDraftState.ts`
- `app/(site)/clasificados/lib/leonixPublishRealEstateListingCore.ts`
- `app/(site)/clasificados/publicar/bienes-raices/negocio/application/BienesRaicesNegocioApplication.tsx`
- `app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/AgenteIndividualResidencialApplication.tsx`
- `app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/preview/AgenteIndividualResidencialPreviewClient.tsx`
- `app/(site)/clasificados/bienes-raices/preview/negocio/components/BienesRaicesNegocioPreviewClient.tsx`
- `app/(site)/clasificados/bienes-raices/components/RelatedBrAgentProperties.tsx`
- `app/(site)/clasificados/bienes-raices/lib/fetchBrRelatedInventoryListingsBrowser.ts`
- `app/(site)/clasificados/bienes-raices/components/BrRelatedAgentPropertiesSection.tsx`

## 3. Files changed

- `app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioInventoryPublishQueue.ts` (new)
- `app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioInventoryQueuePrefill.ts` (new)
- `app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioInventoryPostPublishFlow.ts` (new)
- `app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioInventoryPublishBridgeCopy.ts` (new)
- `app/(site)/clasificados/publicar/bienes-raices/negocio/application/sections/shared/BrNegocioInventoryPublishBridgePanel.tsx` (new)
- `app/(site)/clasificados/publicar/bienes-raices/negocio/application/mapping/mapAgenteResidencialFormStateToNegocioForPublish.ts` (new)
- `app/(site)/clasificados/lib/leonixPublishRealEstateFromDraftState.ts` — `publishLeonixListingFromAgenteResidencialDraft`
- `app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/preview/AgenteIndividualResidencialPreviewClient.tsx`
- `app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/AgenteIndividualResidencialApplication.tsx`
- `app/(site)/clasificados/bienes-raices/preview/negocio/components/BienesRaicesNegocioPreviewClient.tsx`
- `app/(site)/clasificados/publicar/bienes-raices/negocio/application/BienesRaicesNegocioApplication.tsx`
- `scripts/br-inv-e-fast-real-publish-queue-audit.ts` (new)
- `package.json` — `br:inv-e-fast-audit` script only

## 4. Why existing add-mode instead of batch publish

Batch publish would require new server orchestration, entitlement checks, and rollback paths. BR13 already inserts real child rows through `inventoryMetadataForBrNegocioPublish({ mode: 'add' })` with `br_inventory_group_id`, `br_inventory_parent_listing_id`, and `inventory_role: inventory_property`. Sequential publish reuses that proven insert path once per owner confirmation — true listing IDs, true Leonix Ad IDs, true public URLs — without inventing a parallel batch API today.

## 5. Queue storage behavior

- Session key: `lx-br-negocio-inventory-publish-queue-v1`
- Prefill key: `lx-br-negocio-inventory-queue-prefill-v1`
- Stores: parent listing id, parent public path, `br_inventory_group_id`, draft child property payloads, inherited agente/negocio form snapshot, current index, version `1`
- Does **not** store fake listing IDs or fake Leonix Ad IDs
- No Supabase writes in queue helper
- No localStorage

## 6. Main publish bridge behavior

After successful main publish when `additionalInventoryProperties.length > 0`:

1. `createQueueAfterMainPublish(...)` runs
2. Owner-only bridge panel shows (ES/EN copy per gate spec)
3. “Publish next property” → `prepareNextQueuedChildNavigation` → existing `inventoryMode=add` publish URL
4. “View main listing” links to real `leonixLiveAnuncioPath(parentListingId)` — never blocked

## 7. Child prefill behavior

On add-mode entry with active queue:

- Inherited agent/contact/business fields from `inheritedAgenteSnapshot` or `inheritedNegocioSnapshot`
- Property-only overlay via `applyInventoryDraftToAgenteFormState` / `applyInventoryDraftToNegocioFormState` from `readQueuePrefillForAddMode()`
- Child draft fake IDs are not carried
- Inventory drawer hidden in add-mode

## 8. Child publish behavior

Child preview publish calls existing core with `BrNegocioPublishInventoryContext { mode: 'add', parentListingId, brInventoryGroupId }`. On success with active queue: `advanceQueue()`, bridge shows real child public URL, remaining count, next CTA or “View main listing”. Manual add-mode (no queue) keeps prior redirect-to-parent behavior.

## 9. Public related inventory behavior

No redesign. Existing `RelatedBrAgentProperties` + `fetchBrRelatedInventoryListingsBrowser` + `BrRelatedAgentPropertiesSection` already load published siblings by `br_inventory_group_id`. Child cards use real listing ids and `leonixLiveAnuncioPath`. Only active/published rows appear; no owner edit/remove on public cards.

## 10. Evidence each child is a real listing row

Child publish path: `publishLeonixListingFromBienesRaicesNegocioDraft` / `publishLeonixListingFromAgenteResidencialDraft` → `publishLeonixRealEstateListingCore` → Supabase `listings` insert with `inventoryMetadataForBrNegocioPublish` add-mode patch (`inventory_role: inventory_property`, group + parent FK). Same path as BR13 manual “Add property to inventory”.

## 11. Evidence — No fake listing IDs, No fake URLs, no fake Leonix Ad IDs

- Queue stores draft property fields only — no listing id or Leonix id fields
- Bridge child URL built only from `publishLeonixRealEstateListingCoreResult.listingId` after successful insert
- Preview placeholders (`brLeonixAdIdPlaceholderLine`) unchanged for unpublished preview; no fake child links in bridge before publish

## 12. Lane protection

| Lane | Touched? | Result |
|------|----------|--------|
| BR Negocio / Agente | TRUE | Queue, bridge, add-mode prefill, publish wired |
| BR Privado | FALSE | No files under `privado/**` modified |
| Rentas | FALSE | No files under `rentas/**` modified |
| Other categories | FALSE | Out of scope |

## 13. Intentionally deferred

- No schema/migration changes in this gate
- True one-click batch publish
- Stripe entitlement truth
- Analytics
- Dashboard polish
- Visual card polish on bridge panel

## 14. Manual QA checklist

- [ ] Open BR Negocio publish flow (Agente path)
- [ ] Add at least one additional property in inventory drawer
- [ ] Confirm BR-INV-D preview cards show main + child draft
- [ ] Publish main property from preview
- [ ] Confirm main listing gets real public URL
- [ ] Confirm bridge shows additional properties remaining
- [ ] Click “Publish next property”
- [ ] Confirm add-mode opens with child property prefilled (agent/contact inherited)
- [ ] Publish child property from preview
- [ ] Confirm child gets real public URL
- [ ] Confirm child Leonix Ad ID on live detail if returned by publish
- [ ] Open parent public detail — related inventory shows real child
- [ ] Click child card — child public detail opens
- [ ] No fake URL/listing ID/Leonix Ad ID anywhere
- [ ] BR Privado / Rentas have no inventory queue flow
- [ ] Mobile public detail does not overflow

## 15. No stage / commit / push

This gate did not `git add`, commit, or push.
