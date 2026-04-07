/**
 * Preview stacking semantics (read-only documentation + helpers).
 *
 * All template content (text blocks, logo) and studio native objects share ONE CSS stacking context
 * inside the trim box. Each layer has a numeric `zIndex` (1–40); overlap is resolved by that value
 * across the whole trim, not by subtree.
 *
 * **Editing z-order**
 * - Text blocks: `SET_TEXT_BLOCK` zIndex (text inspector / rich controls).
 * - Logo: `SET_LOGO_GEOM` zIndex (logo inspector).
 * - Native objects: `V2_PATCH_NATIVE_OBJECT` zIndex, or `V2_REORDER_NATIVE_OBJECT` to swap z with the
 *   adjacent *native* layer in z-order (same two objects exchange their previous z values).
 *
 * The Refinements layer list is a single front-to-back view (`stackOrder`); it is not a drag-reorder
 * surface for template layers.
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
