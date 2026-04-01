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

## Next phases (expected)

- Wire a layers panel or canvas to `deriveDesignerV2FromBusinessCardDocument`
- Persist V2 or dual-write — only after order pipeline agreement
- Implement reverse adapter or promote V2 to canonical
- Add shape/decorative instances beyond placeholders in `types/objects.ts`
