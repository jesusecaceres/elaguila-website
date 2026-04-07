/**
 * Template application: copy layout from `businessCardTemplateLayouts` and keep `fields` ↔ `textBlocks` aligned.
 */
import type { Lang } from "../../types/tienda";
import type {
  BusinessCardCanvasBackground,
  BusinessCardSideState,
  BusinessCardTextFields,
  TextFieldRole,
} from "./types";
import type { BusinessCardTemplateId } from "./businessCardTemplateCatalog";
export type { BusinessCardTemplateId } from "./businessCardTemplateCatalog";
export { BUSINESS_CARD_TEMPLATE_IDS } from "./businessCardTemplateCatalog";
import {
  getBusinessCardTemplateBack,
  getBusinessCardTemplateFront,
  getTemplateCanvasBackground,
  getTemplateLineVisibilityForSide,
} from "./businessCardTemplateLayouts";

const ROLES_ORDER: TextFieldRole[] = [
  "company",
  "personName",
  "title",
  "tagline",
  "phone",
  "email",
  "website",
  "address",
];

export { getBusinessCardTemplateFront, getBusinessCardTemplateBack } from "./businessCardTemplateLayouts";
export { getTemplateCanvasBackground } from "./businessCardTemplateLayouts";

/** Sync text block strings from `fields` for standard roles. */
export function syncSideBlocksFromFields(side: BusinessCardSideState): BusinessCardSideState {
  const next = side.textBlocks.map((b) => {
    if (b.role === "custom") return b;
    const v = side.fields[b.role]?.trim() ?? "";
    return { ...b, text: v };
  });
  return { ...side, textBlocks: next };
}

export function syncFieldsFromBlocks(side: BusinessCardSideState): BusinessCardSideState {
  const fields = { ...side.fields };
  for (const b of side.textBlocks) {
    if (b.role !== "custom") {
      (fields as Record<string, string>)[b.role] = b.text;
    }
  }
  return { ...side, fields };
}

/**
 * When applying a new template, keep the user's copy only where they entered something.
 * Empty strings from the prior state must NOT overwrite template placeholder text —
 * otherwise blocks render blank and the layout looks "collapsed" at the top.
 */
function mergeTemplateFields(templateDefaults: BusinessCardTextFields, userFields: BusinessCardTextFields): BusinessCardTextFields {
  const out: BusinessCardTextFields = { ...templateDefaults };
  for (const role of ROLES_ORDER) {
    const u = userFields[role]?.trim();
    if (u) out[role] = userFields[role];
  }
  return out;
}

/** Merge template positions with current field text + canvas + line visibility. */
export function applyBusinessCardTemplateToDocument(
  templateId: BusinessCardTemplateId,
  lang: Lang,
  twoSided: boolean,
  prev: { front: BusinessCardSideState; back: BusinessCardSideState }
): { front: BusinessCardSideState; back: BusinessCardSideState; canvasBackground: BusinessCardCanvasBackground } {
  const frontT = getBusinessCardTemplateFront(templateId, lang);
  const customFront = prev.front.textBlocks.filter((b) => b.role === "custom");
  const mergedFrontFields = mergeTemplateFields(frontT.fields, prev.front.fields);
  const mergeFront: BusinessCardSideState = {
    ...prev.front,
    fields: mergedFrontFields,
    textBlocks: [
      ...frontT.blocks.map((b) => ({
        ...b,
        text: mergedFrontFields[b.role as TextFieldRole],
      })),
      ...customFront,
    ],
    logoGeom: frontT.logoGeom,
    textLayout: {
      ...prev.front.textLayout,
      lineVisible: getTemplateLineVisibilityForSide("front", templateId),
    },
  };
  let mergedFront = syncFieldsFromBlocks(syncSideBlocksFromFields(mergeFront));
  const canvasBackground = getTemplateCanvasBackground(templateId);

  if (!twoSided) {
    return { front: mergedFront, back: prev.back, canvasBackground };
  }
  const backT = getBusinessCardTemplateBack(templateId, lang);
  const customBack = prev.back.textBlocks.filter((b) => b.role === "custom");
  const mergedBackFields = mergeTemplateFields(backT.fields, prev.back.fields);
  const mergeBack: BusinessCardSideState = {
    ...prev.back,
    fields: mergedBackFields,
    textBlocks: [
      ...backT.blocks.map((b) => ({
        ...b,
        text: mergedBackFields[b.role as TextFieldRole],
      })),
      ...customBack,
    ],
    logoGeom: backT.logoGeom,
    textLayout: {
      ...prev.back.textLayout,
      lineVisible: getTemplateLineVisibilityForSide("back", templateId),
    },
  };
  mergedFront = mergedFront;
  const mergedBack = syncFieldsFromBlocks(syncSideBlocksFromFields(mergeBack));
  return { front: mergedFront, back: mergedBack, canvasBackground };
}
