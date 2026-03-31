import type { Lang } from "../../types/tienda";
import type {
  BusinessCardLogoGeom,
  BusinessCardSideState,
  BusinessCardTextBlock,
  BusinessCardTextFields,
  TextFieldRole,
} from "./types";

export type BusinessCardTemplateId = "modern-centered" | "classic-left" | "bold-logo-top" | "minimal-contact";

export const BUSINESS_CARD_TEMPLATE_IDS: BusinessCardTemplateId[] = [
  "modern-centered",
  "classic-left",
  "bold-logo-top",
  "minimal-contact",
];

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

function enFields(): BusinessCardTextFields {
  return {
    personName: "Alex Rivera",
    title: "Creative Director",
    company: "Leonix Media",
    phone: "(555) 010-2000",
    email: "hello@leonix.example",
    website: "leonix.example",
    address: "",
    tagline: "Premium print for business",
  };
}

function esFields(): BusinessCardTextFields {
  return {
    personName: "Alex Rivera",
    title: "Director Creativo",
    company: "Leonix Media",
    phone: "(555) 010-2000",
    email: "hola@leonix.example",
    website: "leonix.example",
    address: "",
    tagline: "Impresión premium para negocios",
  };
}

function block(
  id: string,
  role: TextFieldRole,
  text: string,
  x: number,
  y: number,
  w: number,
  fs: number,
  fw: 400 | 500 | 600 | 700,
  align: "left" | "center" | "right",
  z: number
): BusinessCardTextBlock {
  return {
    id,
    role,
    text,
    xPct: x,
    yPct: y,
    widthPct: w,
    fontSize: fs,
    fontWeight: fw,
    color: "var(--lx-text)",
    textAlign: align,
    zIndex: z,
  };
}

/** Front template blocks + logo geometry (trim-relative %). */
export function getBusinessCardTemplateFront(
  templateId: BusinessCardTemplateId,
  lang: Lang
): { fields: BusinessCardTextFields; blocks: BusinessCardTextBlock[]; logoGeom: BusinessCardLogoGeom } {
  const f = lang === "en" ? enFields() : esFields();
  switch (templateId) {
    case "modern-centered":
      return {
        fields: f,
        logoGeom: { xPct: 50, yPct: 24, widthPct: 20, zIndex: 4 },
        blocks: [
          block("t1", "company", f.company, 50, 44, 88, 13, 700, "center", 5),
          block("t2", "personName", f.personName, 50, 58, 88, 11, 600, "center", 6),
          block("t3", "title", f.title, 50, 66, 88, 10, 500, "center", 7),
          block("t4", "phone", f.phone, 50, 78, 88, 9, 400, "center", 8),
          block("t5", "email", f.email, 50, 85, 88, 9, 400, "center", 9),
        ],
      };
    case "classic-left":
      return {
        fields: f,
        logoGeom: { xPct: 22, yPct: 30, widthPct: 22, zIndex: 4 },
        blocks: [
          block("t1", "company", f.company, 58, 34, 68, 12, 700, "left", 5),
          block("t2", "personName", f.personName, 58, 46, 68, 11, 600, "left", 6),
          block("t3", "title", f.title, 58, 55, 68, 10, 500, "left", 7),
          block("t4", "phone", f.phone, 58, 68, 68, 9, 400, "left", 8),
          block("t5", "email", f.email, 58, 76, 68, 9, 400, "left", 9),
        ],
      };
    case "bold-logo-top":
      return {
        fields: f,
        logoGeom: { xPct: 50, yPct: 26, widthPct: 28, zIndex: 6 },
        blocks: [
          block("t1", "company", f.company, 50, 48, 90, 14, 700, "center", 5),
          block("t2", "tagline", f.tagline, 50, 62, 88, 10, 500, "center", 7),
          block("t3", "personName", f.personName, 50, 72, 88, 10, 600, "center", 8),
          block("t4", "email", f.email, 50, 84, 88, 9, 400, "center", 9),
        ],
      };
    case "minimal-contact":
      return {
        fields: { ...f, tagline: "", title: "" },
        logoGeom: { xPct: 18, yPct: 50, widthPct: 18, zIndex: 4 },
        blocks: [
          block("t1", "personName", f.personName, 52, 40, 72, 12, 600, "left", 5),
          block("t2", "company", f.company, 52, 52, 72, 11, 700, "left", 6),
          block("t3", "phone", f.phone, 52, 66, 72, 10, 400, "left", 7),
          block("t4", "email", f.email, 52, 76, 72, 9, 400, "left", 8),
        ],
      };
    default:
      return getBusinessCardTemplateFront("modern-centered", lang);
  }
}

export function getBusinessCardTemplateBack(lang: Lang): {
  fields: BusinessCardTextFields;
  blocks: BusinessCardTextBlock[];
  logoGeom: BusinessCardLogoGeom;
} {
  const f: BusinessCardTextFields =
    lang === "en"
      ? {
          personName: "",
          title: "",
          company: "Thank you",
          phone: "",
          email: "",
          website: "",
          address: "",
          tagline: "We print what you approve.",
        }
      : {
          personName: "",
          title: "",
          company: "Gracias",
          phone: "",
          email: "",
          website: "",
          address: "",
          tagline: "Imprimimos lo que apruebas.",
        };
  return {
    fields: f,
    logoGeom: { xPct: 50, yPct: 50, widthPct: 18, zIndex: 4 },
    blocks: [
      block("b1", "company", f.company, 50, 44, 86, 13, 700, "center", 5),
      block("b2", "tagline", f.tagline, 50, 58, 86, 10, 500, "center", 6),
    ],
  };
}

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

/** Merge template positions with current field text. */
export function applyBusinessCardTemplateToDocument(
  templateId: BusinessCardTemplateId,
  lang: Lang,
  twoSided: boolean,
  prev: { front: BusinessCardSideState; back: BusinessCardSideState }
): { front: BusinessCardSideState; back: BusinessCardSideState } {
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
  };
  const mergedFront = syncFieldsFromBlocks(syncSideBlocksFromFields(mergeFront));
  if (!twoSided) {
    return { front: mergedFront, back: prev.back };
  }
  const backT = getBusinessCardTemplateBack(lang);
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
  };
  return { front: mergedFront, back: syncFieldsFromBlocks(syncSideBlocksFromFields(mergeBack)) };
}
