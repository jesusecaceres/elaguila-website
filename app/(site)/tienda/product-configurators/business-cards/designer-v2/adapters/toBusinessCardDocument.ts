import type { BusinessCardDocument } from "../../types";
import type { DesignerV2Document } from "../types";

/**
 * Reverse mapping (V2 → persisted V1) is intentionally unimplemented in the foundation phase.
 * Order flow, IndexedDB drafts, and LEO continue to read/write `BusinessCardDocument` only.
 *
 * Future phase: apply patches from `DesignerV2Document` onto V1 or promote V2 to canonical.
 */
export const DESIGNER_V2_REVERSE_ADAPTER_IMPLEMENTED = false as const;

export function businessCardDocumentFromDesignerV2(_v2: DesignerV2Document): BusinessCardDocument {
  throw new Error(
    "[designer-v2] Reverse adapter not implemented — BusinessCardDocument remains the source of truth."
  );
}
