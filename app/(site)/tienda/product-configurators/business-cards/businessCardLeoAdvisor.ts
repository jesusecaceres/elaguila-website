/**
 * LEO (guided assistant): intake → template pick → scoring helpers → polish pass on the document.
 */
import type { Lang } from "../../types/tienda";
import { createInitialBusinessCardDocument } from "./documentFactory";
import { buildLeoIntakeFromDocumentForScoring, pickLeoTemplateId } from "./businessCardLeoScoring";
import { leoCanvasBackgroundForIntake } from "./businessCardLeoPresetMapper";
import type { BusinessCardLeoIntake, BusinessCardLeoSnapshot } from "./businessCardLeoTypes";
import type { BusinessCardDocument, BusinessCardProductSlug, BusinessCardTextFields, TextFieldRole } from "./types";
import { syncSideBlocksFromFields } from "./templates";
import { getTemplateLineVisibilityForSide } from "./businessCardTemplateLayouts";
import type { BusinessCardTemplateId } from "./businessCardTemplateCatalog";
import { leoAdjustLogoAndScale, leoBoostSparseTypography, leoPruneEmptyVisibleLines } from "./businessCardLeoPolish";

const ROLES: TextFieldRole[] = ["company", "personName", "title", "tagline", "phone", "email", "website", "address"];

function userFieldsFromIntake(intake: BusinessCardLeoIntake): BusinessCardTextFields {
  return {
    personName: intake.personName.trim(),
    title: intake.title.trim(),
    company: intake.businessName.trim(),
    phone: intake.phone.trim(),
    email: intake.email.trim(),
    website: intake.website.trim(),
    address: intake.address.trim(),
    tagline: intake.slogan.trim(),
  };
}

function mergeUserIntoSideFields(templateFields: BusinessCardTextFields, user: BusinessCardTextFields): BusinessCardTextFields {
  const out = { ...templateFields };
  for (const role of ROLES) {
    const u = user[role]?.trim();
    if (u) out[role] = user[role];
  }
  return out;
}

function applyBackStyleLineVisibility(
  lineVisible: Record<TextFieldRole, boolean>,
  backStyle: BusinessCardLeoIntake["backStyle"]
): Record<TextFieldRole, boolean> {
  const next = { ...lineVisible };
  if (backStyle === "clean") {
    next.tagline = false;
    next.website = false;
  } else if (backStyle === "services") {
    next.tagline = true;
    next.website = true;
    next.phone = true;
    next.email = true;
  } else if (backStyle === "address" || backStyle === "map-style") {
    next.address = true;
    next.phone = true;
    next.email = true;
  }
  return next;
}

function applyFrontEmphasis(
  doc: BusinessCardDocument,
  emphasis: BusinessCardLeoIntake["emphasis"]
): BusinessCardDocument {
  const lv = { ...doc.front.textLayout.lineVisible };
  if (emphasis === "company") {
    lv.title = false;
  } else if (emphasis === "contact") {
    lv.tagline = false;
  }
  return {
    ...doc,
    front: {
      ...doc.front,
      textLayout: { ...doc.front.textLayout, lineVisible: lv },
    },
  };
}

function applyLogoEmphasis(doc: BusinessCardDocument, emphasis: BusinessCardLeoIntake["emphasis"], intake: BusinessCardLeoIntake): BusinessCardDocument {
  if (emphasis !== "logo" || !intake.logoDataUrl) return doc;
  return {
    ...doc,
    front: {
      ...doc.front,
      logo: {
        ...doc.front.logo,
        visible: true,
        scale: "lg",
        previewUrl: intake.logoDataUrl,
        naturalWidth: intake.logoNaturalWidth,
        naturalHeight: intake.logoNaturalHeight,
        file: null,
      },
    },
  };
}

/**
 * Maps LEO intake into a v3 builder document + snapshot for session/order metadata.
 */
export function buildBusinessCardDocumentFromLeoIntake(
  intake: BusinessCardLeoIntake,
  productSlug: BusinessCardProductSlug,
  lang: Lang
): { document: BusinessCardDocument; leoSnapshot: BusinessCardLeoSnapshot } {
  const templateId: BusinessCardTemplateId = pickLeoTemplateId(intake, productSlug);
  const user = userFieldsFromIntake(intake);

  let doc = createInitialBusinessCardDocument(productSlug, lang, { designIntake: "leo", templateId });
  doc.canvasBackground = leoCanvasBackgroundForIntake(templateId, intake.preferredColors, intake.preferredStyle);

  const frontFields = mergeUserIntoSideFields(doc.front.fields, user);
  let front = syncSideBlocksFromFields({
    ...doc.front,
    fields: frontFields,
    textLayout: {
      ...doc.front.textLayout,
      lineVisible: getTemplateLineVisibilityForSide("front", templateId),
    },
  });

  let back = doc.back;
  if (doc.sidedness === "two-sided") {
    const backFields = mergeUserIntoSideFields(doc.back.fields, user);
    const baseLv = getTemplateLineVisibilityForSide("back", templateId);
    back = syncSideBlocksFromFields({
      ...doc.back,
      fields: backFields,
      textLayout: {
        ...doc.back.textLayout,
        lineVisible: applyBackStyleLineVisibility(baseLv, intake.backStyle),
      },
    });
  }

  doc = { ...doc, front, back, selectedTemplateId: templateId };
  doc = applyFrontEmphasis(doc, intake.emphasis);
  doc = applyLogoEmphasis(doc, intake.emphasis, intake);

  if (intake.logoDataUrl && intake.emphasis !== "logo") {
    doc = {
      ...doc,
      front: {
        ...doc.front,
        logo: {
          ...doc.front.logo,
          visible: true,
          previewUrl: intake.logoDataUrl,
          naturalWidth: intake.logoNaturalWidth,
          naturalHeight: intake.logoNaturalHeight,
          file: null,
        },
      },
    };
  }

  doc = leoPruneEmptyVisibleLines(doc);
  doc = leoAdjustLogoAndScale(doc, intake, templateId);
  doc = leoBoostSparseTypography(doc, intake);

  const leoSnapshot: BusinessCardLeoSnapshot = {
    profession: intake.profession.trim(),
    preferredStyle: intake.preferredStyle,
    preferredColorsNote: intake.preferredColors.trim(),
    emphasis: intake.emphasis,
    emphasisSecondary: intake.emphasisSecondary ?? null,
    backStyle: intake.backStyle,
    selectedTemplateId: templateId,
  };

  return { document: { ...doc, leoSnapshot }, leoSnapshot };
}

/**
 * After `APPLY_TEMPLATE` while `designIntake === "leo"`, restore LEO canvas, visibility rules,
 * and polish so alternate layouts match the quality of the first draft.
 */
export function applyLeoFinishingPass(doc: BusinessCardDocument): BusinessCardDocument {
  if (doc.designIntake !== "leo" || !doc.leoSnapshot) return doc;
  const intake = buildLeoIntakeFromDocumentForScoring(doc);
  if (!intake) return doc;
  const templateId = doc.selectedTemplateId;
  if (!templateId) return doc;

  let next: BusinessCardDocument = {
    ...doc,
    canvasBackground: leoCanvasBackgroundForIntake(templateId, intake.preferredColors, intake.preferredStyle),
  };

  const frontLv = getTemplateLineVisibilityForSide("front", templateId);
  next = applyFrontEmphasis(
    {
      ...next,
      front: {
        ...next.front,
        textLayout: { ...next.front.textLayout, lineVisible: frontLv },
      },
    },
    intake.emphasis
  );

  if (next.sidedness === "two-sided") {
    const backLv = applyBackStyleLineVisibility(getTemplateLineVisibilityForSide("back", templateId), intake.backStyle);
    next = {
      ...next,
      back: {
        ...next.back,
        textLayout: { ...next.back.textLayout, lineVisible: backLv },
      },
    };
  }

  next = applyLogoEmphasis(next, intake.emphasis, intake);

  if (intake.logoDataUrl && intake.emphasis !== "logo") {
    next = {
      ...next,
      front: {
        ...next.front,
        logo: {
          ...next.front.logo,
          visible: true,
          previewUrl: intake.logoDataUrl,
          naturalWidth: intake.logoNaturalWidth,
          naturalHeight: intake.logoNaturalHeight,
          file: null,
        },
      },
    };
  }

  next = leoPruneEmptyVisibleLines(next);
  next = leoAdjustLogoAndScale(next, intake, templateId);
  next = leoBoostSparseTypography(next, intake);
  return {
    ...next,
    leoSnapshot: next.leoSnapshot ? { ...next.leoSnapshot, selectedTemplateId: templateId } : undefined,
  };
}
