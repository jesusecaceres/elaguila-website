# Business card builder (tienda)

Orientation for maintainers. **Dominant path today:** template-driven sides with `textBlocks.length > 0` (**block mode**) — absolute text blocks + `logoGeom`. **Legacy path:** empty `textBlocks` — stacked `fields` with `presetToLogoStyle` / `presetToTextAnchorStyle`.

| Concern | Where |
|--------|--------|
| Document model + validation types | `types.ts`, `validation.ts` |
| Reducer (mutations) | `businessCardBuilderReducer.ts` |
| Layout presets (legacy CSS vs block geom/scale) | `layoutPresets.ts` → `layout/layoutLegacyCss.ts`, `layout/layoutGeomAndScale.ts` |
| Templates (apply template, sync blocks ↔ fields) | `templates.ts`, `businessCardTemplateLayouts.ts`, `businessCardTemplateCatalog.ts` |
| Preview / export DOM | `app/tienda/components/business-cards/BusinessCardPreview.tsx` |
| Preview-only math (trim surface, drag clamp, block text scale) | `preview/*.ts` |
| Editor UI | `app/tienda/components/business-cards/BusinessCardEditorPanel.tsx` |
| Copy strings | `app/tienda/data/businessCardBuilderCopy.ts` |
| LEO | `businessCardLeoAdvisor.ts`, `businessCardLeoScoring.ts`, `businessCardLeoPolish.ts`, `businessCardLeoPresetMapper.ts`, `businessCardLeoTypes.ts` |
| Draft persistence | `businessCardDraftPersistence.ts` |
| Order / review mapping | `app/tienda/order/mappers/businessCardDocumentToReview.ts`, `hydrateBusinessCardDocumentFromSession.ts` |
| **Designer V2 foundation** (typed layers, derived read model — V1 still canonical) | `designer-v2/README.md`, `designer-v2/index.ts` |

**Designer V2:** parallel object model under `designer-v2/`; full editor/canvas phases will build on `deriveDesignerV2FromBusinessCardDocument` and related types. Until migration, LEO, persistence, and order pipeline stay on `BusinessCardDocument` only.
