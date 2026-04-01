/**
 * Preview stacking semantics (read-only documentation + helpers).
 *
 * All template content (text blocks, logo) and studio native objects share ONE CSS stacking context
 * inside the trim box. Each layer has a numeric `zIndex`; the browser resolves overlap by that value
 * regardless of whether the node comes from the V1 subtree or the V2 native overlay.
 *
 * **What can reorder today:** only `designerV2NativeObjects` via `V2_REORDER_NATIVE_OBJECT` (swap among studio).
 *
 * **What cannot reorder yet:** template text blocks and logo relative to each other from this panel
 * (text uses block editor + canvas; logo uses template/logo controls). Changing template z-index
 * would require reducer support and is deferred.
 *
 * **Future:** optional `layerStack` on `BusinessCardSideState` with a single ordered id list, or
 * unified z-index assignment when mutating any layer.
 */
import type { BusinessCardDocument, BusinessCardSide } from "../../types";
import { buildUnifiedLayerRows } from "./buildUnifiedLayerRows";

export type PreviewStackPaintEntry = {
  id: string;
  /** Bottom → top paint order (ascending zIndex = drawn later on top) */
  zIndex: number;
  source: "template" | "studio";
};

/** Bottom-first paint order (useful for debugging parity with the layer list). */
export function previewPaintOrderFromBottom(doc: BusinessCardDocument, side: BusinessCardSide): PreviewStackPaintEntry[] {
  const rows = buildUnifiedLayerRows(doc, side, "en");
  return [...rows]
    .sort((a, b) => a.stackOrder - b.stackOrder)
    .map((r) => ({
      id: r.id,
      zIndex: r.stackOrder,
      source: r.layerSource,
    }));
}
