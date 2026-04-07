/**
 * Thin API for upcoming UI: derive read model, map selection into V2 terms.
 * Safe to import from client components — no side effects.
 */
import type { BusinessCardDocument, BusinessCardSide } from "../types";
import type { DesignerV2Document, DesignerV2Selection } from "./types";
import { designerV2FromBusinessCardDocument } from "./adapters/fromBusinessCardDocument";

export function deriveDesignerV2FromBusinessCardDocument(doc: BusinessCardDocument): DesignerV2Document {
  return designerV2FromBusinessCardDocument(doc);
}

/** Same as `doc.activeSide` — explicit hook for tools that only accept V2 types */
export function designerV2ActiveSideFromDocument(doc: BusinessCardDocument): BusinessCardSide {
  return doc.activeSide;
}

function logoObjectIdForSide(doc: BusinessCardDocument, side: BusinessCardSide): "v1-logo" | "v1-legacy-logo" {
  const state = side === "front" ? doc.front : doc.back;
  return state.textBlocks.length > 0 ? "v1-logo" : "v1-legacy-logo";
}

/**
 * Maps current editor selection into V2 selection ids.
 * Block mode: text blocks use their real ids; logo maps to `v1-logo`.
 * Legacy stack: logo maps to `v1-legacy-logo`; synthetic text ids are `v1-legacy-text-{role}`.
 */
export function designerV2SelectionFromEditorState(
  doc: BusinessCardDocument,
  input: { selectedTextBlockId: string | null; logoSelected: boolean }
): DesignerV2Selection {
  const { selectedTextBlockId, logoSelected } = input;
  const activeSide = doc.activeSide;
  if (logoSelected) {
    return { kind: "object", objectId: logoObjectIdForSide(doc, activeSide), side: activeSide };
  }
  if (selectedTextBlockId) {
    return { kind: "object", objectId: selectedTextBlockId, side: activeSide };
  }
  return { kind: "none" };
}
