/**
 * Single list model for the layer panel: template-derived vs studio-native, with honest reorder/UX flags.
 */
import type { BusinessCardDocument, BusinessCardSide } from "../../types";
import { designerV2FromBusinessCardDocument } from "../adapters/fromBusinessCardDocument";
import type { DesignerV2Object } from "../types/objects";

export type LayerRowSource = "template" | "studio";

/** Stable panel / legacy mapping */
export type UnifiedLayerKind = "template-text" | "template-logo" | "studio-image" | "studio-shape";

export type UnifiedLayerRow = {
  id: string;
  layerSource: LayerRowSource;
  kind: UnifiedLayerKind;
  /** Same numeric space as CSS z-index in preview (template + studio share one stack) */
  stackOrder: number;
  displayLabel: string;
  visible: boolean;
  /** Template text blocks that exist in `textBlocks` can be selected for block editing */
  canSelectForTemplateEdit: boolean;
  /** Logo row — opens logo inspector */
  isTemplateLogo: boolean;
  /** Studio image or shape — full studio inspector + reorder among studio only */
  isStudioObject: boolean;
  /**
   * Forward/back in inspector only applies to studio objects, and only reorders among other studio objects.
   * Template z-order is not changed by these actions.
   */
  studioReorderEligible: boolean;
  /** Legacy stacked text (no real block id) — list is informational */
  isInformationalTemplateText: boolean;
  /** Studio-only: object is locked in the document */
  locked?: boolean;
};

function labelForV2Object(o: DesignerV2Object): { labelEn: string; labelEs: string; isLogo: boolean } {
  if (o.kind === "text") {
    const role = o.role ? String(o.role) : "text";
    return {
      labelEn: role === "custom" ? "Custom text" : `Text (${role})`,
      labelEs: role === "custom" ? "Texto personalizado" : `Texto (${role})`,
      isLogo: false,
    };
  }
  if (o.kind === "image") {
    return { labelEn: "Logo", labelEs: "Logo", isLogo: true };
  }
  return { labelEn: "Layer", labelEs: "Capa", isLogo: false };
}

function labelForNative(
  kind: "native-image" | "native-shape",
  shape?: "rect" | "ellipse"
): { labelEn: string; labelEs: string } {
  if (kind === "native-image") {
    return { labelEn: "Added image", labelEs: "Imagen añadida" };
  }
  const isEllipse = shape === "ellipse";
  return {
    labelEn: isEllipse ? "Added ellipse" : "Added rectangle",
    labelEs: isEllipse ? "Elipse añadida" : "Rectángulo añadido",
  };
}

export function buildUnifiedLayerRows(
  doc: BusinessCardDocument,
  side: BusinessCardSide,
  lang: "en" | "es"
): UnifiedLayerRow[] {
  const v2doc = designerV2FromBusinessCardDocument(doc);
  const sideModel = side === "front" ? v2doc.front : v2doc.back;
  const state = side === "front" ? doc.front : doc.back;

  const templateRows: UnifiedLayerRow[] = sideModel.objects.map((o) => {
    const lb = labelForV2Object(o);
    const label = lang === "en" ? lb.labelEn : lb.labelEs;
    const isText = o.kind === "text";
    const blockId = isText ? o.id : "";
    const canSelect = isText && state.textBlocks.some((b) => b.id === blockId);
    const informational = isText && !canSelect;

    return {
      id: o.id,
      layerSource: "template",
      kind: lb.isLogo ? "template-logo" : "template-text",
      stackOrder: o.zIndex,
      displayLabel: label,
      visible: o.visible,
      canSelectForTemplateEdit: canSelect,
      isTemplateLogo: lb.isLogo,
      isStudioObject: false,
      studioReorderEligible: false,
      isInformationalTemplateText: informational,
    };
  });

  const studioRows: UnifiedLayerRow[] = (state.designerV2NativeObjects ?? []).map((o) => {
    const lb = labelForNative(o.kind, o.kind === "native-shape" ? o.shape : undefined);
    const label = lang === "en" ? lb.labelEn : lb.labelEs;
    const kind: UnifiedLayerKind = o.kind === "native-image" ? "studio-image" : "studio-shape";
    return {
      id: o.id,
      layerSource: "studio",
      kind,
      stackOrder: o.zIndex,
      displayLabel: label,
      visible: o.visible,
      canSelectForTemplateEdit: false,
      isTemplateLogo: false,
      isStudioObject: true,
      studioReorderEligible: o.locked !== true,
      isInformationalTemplateText: false,
      locked: o.locked === true,
    };
  });

  const merged = [...templateRows, ...studioRows].sort((a, b) => b.stackOrder - a.stackOrder);
  return merged;
}
