import type { BusinessCardDocument } from "./types";

/** Deep clone for undo/redo; `structuredClone` preserves `File` on logo when present. */
export function cloneBusinessCardDocument(doc: BusinessCardDocument): BusinessCardDocument {
  return structuredClone(doc);
}
