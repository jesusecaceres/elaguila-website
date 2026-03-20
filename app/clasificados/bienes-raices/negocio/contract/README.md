# BR Negocio — preflight contract (Phase 0)

This folder **locks the naming and data contract** before the BR negocio UI/output rebuild.

## Audit summary (current codebase)

- **Form state**: flat `details: Record<string, string>` on publish page; branch `bienesRaicesBranch === "negocio"`.
- **Preview switchboard**: `ListingView` → if `previewMode && category === bienes-raices` and `businessRail` set → `BienesRaicesPreviewNegocioFresh`; else BR privado listing preview.
- **ListingData**: `components/ListingView.tsx` — `detailPairs`, `businessRail`, `floorPlanUrl`, media URLs.
- **Business meta**: `config/businessListingContract.ts` — `BUSINESS_META_KEYS` for DB `business_meta` JSON.
- **Full preview payload**: `fullPreviewListingData` in `publicar/[category]/page.tsx` builds `businessRail` from `negocio*` fields + `floorPlanUrl` from `negocioFloorPlanUrl`.
- **detailPairs**: built by `getDetailPairs` for property facts + negocio summary rows; consumed by `partitionBienesRaicesPreviewDetailPairs` and `groupBienesRaicesNegocioDetailPairs`.

## Files

| File | Purpose |
|------|---------|
| `brNegocioCanonicalFields.ts` | Canonical keys, aliases, field flow table |
| `brNegocioTypes.ts` | `BrNegocioFormState`, rail + normalized preview types, `ListingData` guard |
| `brNegocioDetailPairsPolicy.ts` | What stays in pairs vs typed fields |
| `brNegocioSectionMatrix.ts` | Section → field ownership |
| `brNegocioFallbackRules.ts` | Hide / fallback behavior |
| `brNegocioBuildOrder.ts` | Ordered rebuild steps |

## Status

**Contract locked** — safe to start rebuild implementation following `BR_NEGOCIO_FINAL_BUILD_ORDER`.

No runtime behavior was changed by adding these files.
