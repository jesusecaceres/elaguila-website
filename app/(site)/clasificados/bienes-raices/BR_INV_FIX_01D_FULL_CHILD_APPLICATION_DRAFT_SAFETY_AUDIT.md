# BR-INV-FIX-01D — Full Child Inventory Application + Draft Safety

Gate: **BR-INV-FIX-01D** — replace mini child inventory drawer with full BR Agente property application; protect existing main application drafts.

## Draft persistence keys inspected

| Key | Storage | Purpose |
|-----|---------|---------|
| `br-negocio-agente-residencial-preview-draft` | sessionStorage | Preview route + refresh fallback |
| `br-negocio-agente-residencial-return-draft` | sessionStorage | Volver a editar + debounced autosave |
| `fullDraftMediaBridge` | in-memory | Same-tab `data:` photo blobs for main draft |
| `childInventoryMediaBridge` | in-memory | Same-tab child inventory photo blobs |
| `br-negocio-inventory-publish-queue` | sessionStorage | Post-publish child queue (unchanged) |
| `br-negocio-child-inventory-editor-session` | sessionStorage + memory | Isolated child editor progress (NEW — does not touch main keys) |

No localStorage used for Agente publish draft. No draft key renames.

## Existing user draft safety proof

- **Volver a editar:** `saveAgenteResPreviewReturnDraft` → bootstrap reads `BR_AGENTE_RES_RETURN_KEY` + `fullDraftMediaBridge` (unchanged path).
- **Refresh:** NEW debounced `persistAgenteResApplicationDraftQuiet` writes return + preview keys without clearing memory bridge; bootstrap also falls back to preview key when return already consumed.
- **Child editor open:** uses isolated `BR_NEGOCIO_CHILD_INVENTORY_EDITOR_SESSION_KEY` — never overwrites main draft keys.
- **Cancel child editor:** clears only child editor session; parent `state` untouched.

## Main draft refresh proof

`AgenteIndividualResidencialApplication` debounces `persistAgenteResApplicationDraftQuiet(state)` on every state change (800ms). Child inventory saves also call quiet persist via `onItemsChange`.

## Child draft refresh proof

- Saved children live in `state.additionalInventoryProperties` on main draft (persisted with main quiet save).
- In-progress child editor persists to `br-negocio-child-inventory-editor-session` (property slice only).
- `propertyForm` on each child draft stores full property slice for round-trip; `mergeChildInventoryWithMediaBridge` restores `data:` photos same-tab.

## Files inspected

- `agente-individual/application/utils/previewDraft.ts`
- `brNegocioInventoryDraftPersistence.ts`
- `brNegocioInventoryPublishQueue.ts`
- `BrNegocioPrePublishInventoryShell.tsx` + drawer (legacy)
- `AgenteIndividualResidencialApplication.tsx`
- `brNegocioInventoryQueuePrefill.ts`

## Files changed

- `brNegocioChildInventoryFormMapping.ts` (NEW)
- `brNegocioChildInventoryEditorSession.ts` (NEW)
- `BrNegocioChildInventoryFullApplication.tsx` (NEW)
- `BrNegocioChildInventoryInheritedHubPanel.tsx` (NEW)
- `BrNegocioPrePublishInventoryShell.tsx` — full app instead of mini drawer
- `brNegocioAdditionalInventoryDraft.ts` — `propertyForm` field
- `brNegocioInventoryDraftPersistence.ts` — propertyForm strip/merge
- `brNegocioInventoryQueuePrefill.ts` — propertyForm prefill for publish
- `previewDraft.ts` — quiet autosave + preview bootstrap fallback
- `AgenteIndividualResidencialApplication.tsx` — debounced persist + parentHubSnapshot
- `ResumenPublicarNegocioSection.tsx` — negocio hub snapshot
- `brNegocioPrePublishInventoryShellCopy.ts` — full-app copy

Legacy drawer files retained (not deleted) but no longer wired from shell.

## How child flow reuses full BR Agente application

`BrNegocioChildInventoryFullApplication` reuses:

- `Step01TipoAnuncio` … `Step06Descripcion`
- `Step08CtaEnlaces` (read-only detected actions — inherited hub)
- `Step09ExtrasOpcionales` (open house)
- `BrNegocioChildInventoryInheritedHubPanel` (read-only step 7)

Ends with **Guardar propiedad** / **Guardar y agregar otra** — no publish.

## Inherited from parent

Agent name/title, office/broker, phones, email, socials, contact CTAs, financing blocks (via parent hub snapshot).

## Child-specific

Property type, title, price, address, media, details, features, description, open house, property URLs.

## Media behavior

Same Step03Media UX (reorder, cover, URL/file confirmations). Child `propertyForm` + media bridge preserve http(s) after refresh; `data:` images same-tab via bridge (honest limitation documented).

## Preview/carousel behavior

Save updates `additionalInventoryProperties` → inventory preview cards via existing `BrNegocioPrePublishInventoryPreview`. No fake public URL or Leonix ID on cards.

## Publish contract

Unchanged from 01C — save-to-inventory does not publish; queue/add-mode publish still creates real rows.

## Manual QA checklist

- [ ] Fill main Agente form 15+ min; refresh — data remains
- [ ] Open preview → Volver a editar — data remains
- [ ] Add child property — full step flow opens
- [ ] Steps 7–8 show inherited hub (read-only)
- [ ] Save child — appears in inventory carousel with photo
- [ ] Save and add another — parent data intact
- [ ] Cancel child editor — parent data intact
- [ ] Edit child — parent data intact
- [ ] Refresh during child edit — editor session restores (same tab)
- [ ] No fake URL/Leonix ID on draft cards

## No stage / commit / push
