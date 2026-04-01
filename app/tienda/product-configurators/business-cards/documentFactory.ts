import type { Lang } from "../../types/tienda";
import { DEFAULT_BUSINESS_CARD_TEMPLATE_ID } from "./businessCardTemplateCatalog";
import type {
  BusinessCardCanvasBackground,
  BusinessCardDesignIntake,
  BusinessCardDocument,
  BusinessCardImageBlock,
  BusinessCardProductSlug,
  BusinessCardSideState,
  BusinessCardTemplateId,
  BusinessCardTextFields,
  BusinessCardTextLayout,
} from "./types";
import { getTemplateCanvasBackground, getTemplateLineVisibilityForSide } from "./businessCardTemplateLayouts";
import {
  getBusinessCardTemplateBack,
  getBusinessCardTemplateFront,
  syncFieldsFromBlocks,
  syncSideBlocksFromFields,
} from "./templates";

function emptyFields(): BusinessCardTextFields {
  return {
    personName: "",
    title: "",
    company: "",
    phone: "",
    email: "",
    website: "",
    address: "",
    tagline: "",
  };
}

function defaultTextLayout(): BusinessCardTextLayout {
  const allTrue: Record<keyof BusinessCardTextFields, boolean> = {
    personName: true,
    title: true,
    company: true,
    phone: true,
    email: true,
    website: true,
    address: true,
    tagline: true,
  };
  return {
    groupPosition: "bottom-center",
    groupScale: "md",
    lineVisible: allTrue,
  };
}

function emptyLogo(): BusinessCardImageBlock {
  return {
    id: "logo",
    visible: true,
    position: "top-center",
    scale: "md",
    file: null,
    previewUrl: null,
    naturalWidth: null,
    naturalHeight: null,
  };
}

function sideFromTemplateFront(lang: Lang, templateId: BusinessCardTemplateId): BusinessCardSideState {
  const t = getBusinessCardTemplateFront(templateId, lang);
  const lineVisible = getTemplateLineVisibilityForSide("front", templateId);
  const base: BusinessCardSideState = {
    fields: t.fields,
    textLayout: { ...defaultTextLayout(), lineVisible },
    logo: emptyLogo(),
    textBlocks: t.blocks,
    logoGeom: t.logoGeom,
    designerV2NativeObjects: [],
  };
  return syncSideBlocksFromFields(syncFieldsFromBlocks(base));
}

function sideFromTemplateBack(lang: Lang, templateId: BusinessCardTemplateId): BusinessCardSideState {
  const t = getBusinessCardTemplateBack(templateId, lang);
  const lineVisible = getTemplateLineVisibilityForSide("back", templateId);
  const base: BusinessCardSideState = {
    fields: t.fields,
    textLayout: { ...defaultTextLayout(), groupPosition: "center", lineVisible },
    logo: { ...emptyLogo(), visible: false, position: "center" },
    textBlocks: t.blocks,
    logoGeom: t.logoGeom,
    designerV2NativeObjects: [],
  };
  return syncSideBlocksFromFields(syncFieldsFromBlocks(base));
}

function emptySide(): BusinessCardSideState {
  return {
    fields: emptyFields(),
    textLayout: { ...defaultTextLayout(), groupPosition: "center" },
    logo: { ...emptyLogo(), visible: false },
    textBlocks: [],
    logoGeom: { xPct: 50, yPct: 28, widthPct: 20, zIndex: 4 },
    designerV2NativeObjects: [],
  };
}

export function createInitialBusinessCardDocument(
  productSlug: BusinessCardProductSlug,
  lang: Lang,
  opts?: { designIntake?: BusinessCardDesignIntake; templateId?: BusinessCardTemplateId }
): BusinessCardDocument {
  const templateId = opts?.templateId ?? DEFAULT_BUSINESS_CARD_TEMPLATE_ID;
  const designIntake: BusinessCardDesignIntake = opts?.designIntake ?? "template";
  const two = productSlug === "two-sided-business-cards";
  const canvasBackground: BusinessCardCanvasBackground = getTemplateCanvasBackground(templateId);
  return {
    id: `bc-${Date.now().toString(36)}`,
    version: 3,
    productSlug,
    sidedness: two ? "two-sided" : "one-sided",
    designIntake,
    selectedTemplateId: templateId,
    activeSide: "front",
    guidesVisible: true,
    canvasBackground,
    textNudgeX: 0,
    textNudgeY: 0,
    logoNudgeX: 0,
    logoNudgeY: 0,
    front: sideFromTemplateFront(lang, templateId),
    back: two ? sideFromTemplateBack(lang, templateId) : emptySide(),
    approval: {
      spellingReviewed: false,
      layoutReviewed: false,
      printAsApproved: false,
      noRedesignExpectation: false,
    },
  };
}
