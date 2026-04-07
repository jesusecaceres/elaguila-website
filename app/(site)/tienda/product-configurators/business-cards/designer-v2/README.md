# Business Card Designer V2 (foundation)

## What this is

A **parallel read model** for a future canvas-style editor: typed layers (text, image, shape, accents), per-side object lists, transforms, and z-order. It does **not** replace `BusinessCardDocument` yet.

## Why it exists now

The live product still uses `textBlocks`, `logoGeom`, template application, and legacy stacked fields. That model is correct for shipping, but it is not the right long-term abstraction for multiple images, shapes, and freeform tools. The V2 types and adapters let us grow a design surface **without** blocking LEO, templates, upload, checkout, or order review.

## Relationship to V1

| V1 (canonical today) | Designer V2 (derived) |
|----------------------|------------------------|
| `BusinessCardDocument` in `../types.ts` | `DesignerV2Document` from `deriveDesignerV2FromBusinessCardDocument` |
| Reducer, drafts, order mappers | Unchanged — still read/write V1 only |
| Block + legacy preview | `designerV2FromBusinessCardDocument` projects both paths into objects |

## Folders

- `types/` — transforms, object variants, document + selection
- `model/` — schema version constant
- `adapters/` — `fromBusinessCardDocument` (implemented), `toBusinessCardDocument` (stub; throws)
- `utils/` — id normalization helpers
- `integration.ts` — derive + selection mapping for future UI

## Native studio objects (implemented)

`BusinessCardSideState.designerV2NativeObjects` holds **persisted** extra images and shapes. They serialize in the v3 design session next to `textBlocks` / `logoGeom`. Large studio **image** data URLs may be stored in IndexedDB (same DB as logo vault, keys `slug::studio::side::objectId`); `draftStudioVault` lists vaulted ids and session JSON uses `previewUrl: null` until `mergeVaultedStudioImagesIntoDocument` runs on the client.

## Layer stack semantics

Template-derived layers and studio layers share **one** CSS z-index space in the trim box (`buildUnifiedLayerRows`, `previewStackOrder.ts`). **Studio forward/back** only swaps z-index among `designerV2NativeObjects`, not template text/logo. A future phase may introduce a single ordered `layerStack` or cross-type reorder in the reducer.

## Next phases (expected)

- Deeper z-merge between V1 and V2 layers in the UI (optional unified list interactions)
- Implement reverse adapter or promote V2 to canonical
- Add shape/decorative instances beyond placeholders in `types/objects.ts`
