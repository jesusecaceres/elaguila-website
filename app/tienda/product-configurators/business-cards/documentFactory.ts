import type { Lang } from "../../types/tienda";
import type {
  BusinessCardCanvasBackground,
  BusinessCardDocument,
  BusinessCardImageBlock,
  BusinessCardProductSlug,
  BusinessCardSideState,
  BusinessCardTextFields,
  BusinessCardTextLayout,
} from "./types";
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

const DEFAULT_BG: BusinessCardCanvasBackground = { kind: "solid", color: "#fffdf7" };

function sideFromTemplateFront(lang: Lang): BusinessCardSideState {
  const t = getBusinessCardTemplateFront("modern-centered", lang);
  const base: BusinessCardSideState = {
    fields: t.fields,
    textLayout: defaultTextLayout(),
    logo: emptyLogo(),
    textBlocks: t.blocks,
    logoGeom: t.logoGeom,
  };
  return syncSideBlocksFromFields(syncFieldsFromBlocks(base));
}

function sideFromTemplateBack(lang: Lang): BusinessCardSideState {
  const t = getBusinessCardTemplateBack(lang);
  const base: BusinessCardSideState = {
    fields: t.fields,
    textLayout: { ...defaultTextLayout(), groupPosition: "center" },
    logo: { ...emptyLogo(), visible: false, position: "center" },
    textBlocks: t.blocks,
    logoGeom: t.logoGeom,
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
  };
}

export function createInitialBusinessCardDocument(
  productSlug: BusinessCardProductSlug,
  lang: Lang
): BusinessCardDocument {
  const two = productSlug === "two-sided-business-cards";
  return {
    id: `bc-${Date.now().toString(36)}`,
    version: 3,
    productSlug,
    sidedness: two ? "two-sided" : "one-sided",
    activeSide: "front",
    guidesVisible: true,
    canvasBackground: DEFAULT_BG,
    textNudgeX: 0,
    textNudgeY: 0,
    logoNudgeX: 0,
    logoNudgeY: 0,
    front: sideFromTemplateFront(lang),
    back: two ? sideFromTemplateBack(lang) : emptySide(),
    approval: {
      spellingReviewed: false,
      layoutReviewed: false,
      printAsApproved: false,
      noRedesignExpectation: false,
    },
  };
}
