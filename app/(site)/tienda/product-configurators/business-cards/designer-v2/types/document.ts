import type { BusinessCardProductSlug, BusinessCardSide, BusinessCardSidedness } from "../../types";
import type { DesignerV2Object } from "./objects";

/**
 * Canvas background — mirrors `BusinessCardCanvasBackground` without importing V1 in core types
 * (adapters copy field-for-field).
 */
export type DesignerV2CanvasBackground =
  | { kind: "solid"; color: string }
  | { kind: "preset"; id: "linen" | "pearl" | "graphite" | "sand" };

/** How this side was composed in V1 — keeps legacy vs block explicit for future migration */
export type DesignerV2SideCompositionMode = "block" | "legacy-stack";

export type DesignerV2SideModel = {
  side: BusinessCardSide;
  compositionMode: DesignerV2SideCompositionMode;
  objects: DesignerV2Object[];
};

/**
 * Read model for a design surface: per-side object lists + shared document fields.
 * Not persisted independently yet — derived from `BusinessCardDocument` until migration phases land.
 */
export type DesignerV2Document = {
  schemaVersion: number;
  productSlug: BusinessCardProductSlug;
  sidedness: BusinessCardSidedness;
  activeSide: BusinessCardSide;
  canvasBackground: DesignerV2CanvasBackground;
  /** Fine nudges from V1 preview — kept so a future renderer can match today's output */
  textNudgeX: number;
  textNudgeY: number;
  logoNudgeX: number;
  logoNudgeY: number;
  guidesVisible: boolean;
  front: DesignerV2SideModel;
  back: DesignerV2SideModel;
  /** For debugging: which V1 document this was derived from */
  derivedFromDocumentId?: string;
};

export type DesignerV2Selection =
  | { kind: "none" }
  | { kind: "object"; objectId: string; side: BusinessCardSide };
