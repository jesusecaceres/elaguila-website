/**
 * Legacy shape for callers — maps unified rows to category + zIndex field names.
 */
import type { BusinessCardDocument, BusinessCardSide } from "../../types";
import { buildUnifiedLayerRows } from "./buildUnifiedLayerRows";

export type CombinedLayerCategory =
  | "template-text"
  | "template-logo"
  | "studio-image"
  | "studio-shape";

export type CombinedLayerRow = {
  id: string;
  category: CombinedLayerCategory;
  displayLabel: string;
  zIndex: number;
  visible: boolean;
};

export function buildCombinedLayerRows(
  doc: BusinessCardDocument,
  side: BusinessCardSide,
  lang: "en" | "es"
): CombinedLayerRow[] {
  return buildUnifiedLayerRows(doc, side, lang).map((r) => ({
    id: r.id,
    category: r.kind,
    displayLabel: r.displayLabel,
    zIndex: r.stackOrder,
    visible: r.visible,
  }));
}
