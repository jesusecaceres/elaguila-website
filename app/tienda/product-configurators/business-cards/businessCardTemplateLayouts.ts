/**
 * Per-template geometry, colors, and canvas for Business Card Template Library V1.
 */

import type { Lang } from "../../types/tienda";
import type {
  BusinessCardCanvasBackground,
  BusinessCardLogoGeom,
  BusinessCardTextBlock,
  BusinessCardTextFields,
  TextFieldRole,
} from "./types";
import type { BusinessCardTemplateId } from "./businessCardTemplateCatalog";
import { BUSINESS_CARD_TEMPLATE_LIBRARY } from "./businessCardTemplateCatalog";

type TextFieldRoleAll = TextFieldRole;

function allLinesVisible(): Record<TextFieldRoleAll, boolean> {
  return {
    personName: true,
    title: true,
    company: true,
    phone: true,
    email: true,
    website: true,
    address: true,
    tagline: true,
  };
}

/** Full per-side visibility when applying a template (back may show address for map-style backs). */
export function getTemplateLineVisibilityForSide(
  side: "front" | "back",
  templateId: BusinessCardTemplateId
): Record<TextFieldRoleAll, boolean> {
  const base = getTemplateLineVisibility(templateId);
  if (side === "back" && BUSINESS_CARD_TEMPLATE_LIBRARY[templateId].mapBlockOnBack) {
    return { ...base, address: true };
  }
  return base;
}

export function getTemplateLineVisibility(templateId: BusinessCardTemplateId): Record<TextFieldRoleAll, boolean> {
  const base = allLinesVisible();
  switch (templateId) {
    case "minimal-black-onyx":
      return { ...base, website: false, address: false };
    case "bold-modern-slab":
      return { ...base, website: false, address: false, title: false };
    case "contractor-bold-phone":
      return { ...base, website: false, email: false, address: false };
    case "leonix-grind-bar":
      return { ...base, website: false, address: false };
    case "bilingual-two-column":
      return { ...base, address: false };
    case "bilingual-dual-line":
      return { ...base, address: false };
    default:
      return base;
  }
}

function enFields(): BusinessCardTextFields {
  return {
    personName: "Alex Rivera",
    title: "Creative Director",
    company: "Leonix Media",
    phone: "(555) 010-2000",
    email: "hello@leonix.example",
    website: "leonix.example",
    address: "123 Market St, Suite 100",
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
    address: "Av. Principal 123, Oficina 100",
    tagline: "Impresión premium para negocios",
  };
}

function enFieldsBilingual(): BusinessCardTextFields {
  return {
    ...enFields(),
    title: "Creative Director · Director Creativo",
    tagline: "English tagline · Eslogan en español",
  };
}

function esFieldsBilingual(): BusinessCardTextFields {
  return {
    ...esFields(),
    title: "Director Creativo · Creative Director",
    tagline: "Eslogan en español · English tagline",
  };
}

function block(
  id: string,
  role: TextFieldRole | "custom",
  text: string,
  x: number,
  y: number,
  w: number,
  fs: number,
  fw: 400 | 500 | 600 | 700,
  align: "left" | "center" | "right",
  z: number,
  color: string
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
    color,
    textAlign: align,
    zIndex: z,
  };
}

export function getTemplateCanvasBackground(templateId: BusinessCardTemplateId): BusinessCardCanvasBackground {
  const meta = BUSINESS_CARD_TEMPLATE_LIBRARY[templateId];
  const c = meta.primaryColor;
  if (templateId === "leonix-gold-diagonal") {
    return { kind: "preset", id: "pearl" };
  }
  if (templateId === "gold-accent-executive") {
    return { kind: "preset", id: "sand" };
  }
  if (templateId === "monochrome-power") {
    return { kind: "preset", id: "linen" };
  }
  if (templateId === "real-estate-horizon") {
    return { kind: "solid", color: "#1e3a4a" };
  }
  return { kind: "solid", color: c };
}

export function getBusinessCardTemplateFront(
  templateId: BusinessCardTemplateId,
  lang: Lang
): { fields: BusinessCardTextFields; blocks: BusinessCardTextBlock[]; logoGeom: BusinessCardLogoGeom } {
  const f = lang === "en" ? enFields() : esFields();
  const bf = lang === "en" ? enFieldsBilingual() : esFieldsBilingual();

  const gold = "#c9a84a";
  const ink = "#1a1814";
  const muted = "rgba(255,252,247,0.72)";
  const mutedDark = "rgba(26,24,20,0.62)";

  switch (templateId) {
    case "minimal-black-onyx":
      return {
        fields: f,
        logoGeom: { xPct: 50, yPct: 22, widthPct: 22, zIndex: 6 },
        blocks: [
          block("t1", "company", f.company, 50, 42, 88, 12, 700, "center", 5, gold),
          block("t2", "personName", f.personName, 50, 54, 88, 11, 600, "center", 6, "#fffef9"),
          block("t3", "title", f.title, 50, 64, 88, 9, 500, "center", 7, muted),
          block("t4", "phone", f.phone, 50, 76, 88, 9, 400, "center", 8, gold),
          block("t5", "email", f.email, 50, 84, 88, 8, 400, "center", 9, muted),
        ],
      };
    case "gold-accent-executive":
      return {
        fields: f,
        logoGeom: { xPct: 50, yPct: 24, widthPct: 21, zIndex: 5 },
        blocks: [
          block("t0", "tagline", f.tagline, 50, 36, 72, 8, 600, "center", 4, "#b8923a"),
          block("t1", "company", f.company, 50, 45, 86, 14, 700, "center", 5, "#2c261c"),
          block("t2", "personName", f.personName, 50, 57, 86, 11, 600, "center", 6, ink),
          block("t3", "title", f.title, 50, 67, 86, 10, 500, "center", 7, mutedDark),
          block("t4", "phone", f.phone, 50, 79, 86, 9, 500, "center", 8, "#2c261c"),
        ],
      };
    case "clean-white-premium":
      return {
        fields: f,
        logoGeom: { xPct: 50, yPct: 22, widthPct: 21, zIndex: 4 },
        blocks: [
          block("t1", "company", f.company, 50, 42, 88, 14, 700, "center", 5, ink),
          block("t2", "personName", f.personName, 50, 53, 88, 11, 600, "center", 6, ink),
          block("t3", "title", f.title, 50, 62, 88, 10, 500, "center", 7, mutedDark),
          block("t4", "phone", f.phone, 50, 73, 88, 9, 500, "center", 8, ink),
          block("t5", "email", f.email, 50, 82, 88, 9, 400, "center", 9, ink),
        ],
      };
    case "bold-modern-slab":
      return {
        fields: f,
        logoGeom: { xPct: 50, yPct: 72, widthPct: 24, zIndex: 5 },
        blocks: [
          block("t1", "company", f.company, 50, 30, 92, 18, 700, "center", 5, "#f5f0e6"),
          block("t2", "tagline", f.tagline, 50, 48, 88, 9, 500, "center", 6, "rgba(245,240,230,0.75)"),
          block("t3", "personName", f.personName, 50, 58, 88, 10, 600, "center", 7, "#fffef9"),
          block("t4", "phone", f.phone, 50, 88, 88, 10, 600, "center", 8, "#f5c400"),
        ],
      };
    case "monochrome-power":
      return {
        fields: f,
        logoGeom: { xPct: 22, yPct: 30, widthPct: 21, zIndex: 4 },
        blocks: [
          block("t1", "company", f.company, 62, 33, 68, 13, 700, "left", 5, "#111113"),
          block("t2", "personName", f.personName, 62, 45, 68, 11, 600, "left", 6, "#111113"),
          block("t3", "title", f.title, 62, 55, 68, 9, 500, "left", 7, "rgba(17,17,19,0.55)"),
          block("t4", "phone", f.phone, 62, 69, 68, 9, 500, "left", 8, "#111113"),
          block("t5", "email", f.email, 62, 79, 68, 8, 400, "left", 9, "rgba(17,17,19,0.75)"),
        ],
      };
    case "luxe-editorial":
      return {
        fields: f,
        logoGeom: { xPct: 50, yPct: 76, widthPct: 17, zIndex: 4 },
        blocks: [
          block("t1", "personName", f.personName, 50, 28, 80, 15, 600, "center", 5, "#2c261c"),
          block("t2", "title", f.title, 50, 42, 72, 9, 500, "center", 6, "rgba(44,38,28,0.65)"),
          block("t3", "company", f.company, 50, 52, 80, 12, 700, "center", 7, "#2c261c"),
          block("t4", "tagline", f.tagline, 50, 62, 78, 9, 400, "center", 8, "rgba(44,38,28,0.55)"),
          block("t5", "email", f.email, 50, 74, 80, 8, 400, "center", 9, "#2c261c"),
        ],
      };
    case "real-estate-horizon":
      return {
        fields: f,
        logoGeom: { xPct: 82, yPct: 36, widthPct: 18, zIndex: 6 },
        blocks: [
          block("t1", "company", f.company, 50, 16, 92, 11, 700, "center", 5, "#e8dcc8"),
          block("t2", "personName", f.personName, 50, 38, 82, 12, 600, "center", 6, "#ffffff"),
          block("t3", "title", f.title, 50, 50, 82, 9, 500, "center", 7, "rgba(255,252,247,0.78)"),
          block("t4", "phone", f.phone, 50, 66, 82, 10, 600, "center", 8, "#e8dcc8"),
          block("t5", "email", f.email, 50, 78, 82, 8, 400, "center", 9, "rgba(255,252,247,0.88)"),
        ],
      };
    case "auto-dealer-stripe":
      return {
        fields: f,
        logoGeom: { xPct: 50, yPct: 28, widthPct: 26, zIndex: 6 },
        blocks: [
          block("t1", "company", f.company, 50, 48, 90, 15, 700, "center", 5, "#b01020"),
          block("t2", "tagline", f.tagline, 50, 62, 86, 9, 500, "center", 6, "#1a1a1d"),
          block("t3", "personName", f.personName, 50, 74, 86, 10, 600, "center", 7, "#111113"),
          block("t4", "phone", f.phone, 50, 86, 86, 11, 700, "center", 8, "#111113"),
        ],
      };
    case "dental-clinical-clean":
      return {
        fields: f,
        logoGeom: { xPct: 50, yPct: 22, widthPct: 18, zIndex: 4 },
        blocks: [
          block("t1", "company", f.company, 50, 38, 88, 12, 700, "center", 5, "#0f766e"),
          block("t2", "personName", f.personName, 50, 50, 88, 12, 600, "center", 6, "#134e4a"),
          block("t3", "title", f.title, 50, 62, 88, 9, 500, "center", 7, "rgba(19,78,74,0.7)"),
          block("t4", "phone", f.phone, 50, 74, 88, 9, 500, "center", 8, "#134e4a"),
          block("t5", "email", f.email, 50, 84, 88, 8, 400, "center", 9, "#134e4a"),
        ],
      };
    case "lawyer-column-trust":
      return {
        fields: f,
        logoGeom: { xPct: 50, yPct: 24, widthPct: 18, zIndex: 5 },
        blocks: [
          block("t1", "company", f.company, 50, 40, 86, 12, 700, "center", 5, "#d4b46a"),
          block("t2", "personName", f.personName, 50, 52, 86, 11, 600, "center", 6, "#f5f0e6"),
          block("t3", "title", f.title, 50, 62, 86, 9, 500, "center", 7, "rgba(245,240,230,0.75)"),
          block("t4", "phone", f.phone, 50, 74, 86, 9, 400, "center", 8, "#d4b46a"),
          block("t5", "email", f.email, 50, 84, 86, 8, 400, "center", 9, "rgba(245,240,230,0.88)"),
        ],
      };
    case "contractor-bold-phone":
      return {
        fields: f,
        logoGeom: { xPct: 50, yPct: 30, widthPct: 22, zIndex: 5 },
        blocks: [
          block("t1", "company", f.company, 50, 44, 92, 14, 700, "center", 5, "#f5c400"),
          block("t2", "personName", f.personName, 50, 58, 88, 11, 600, "center", 6, "#ffffff"),
          block("t3", "title", f.title, 50, 68, 88, 9, 500, "center", 7, "rgba(255,255,255,0.75)"),
          block("t4", "phone", f.phone, 50, 84, 92, 14, 700, "center", 8, "#f5c400"),
        ],
      };
    case "restaurant-warm-plate":
      return {
        fields: f,
        logoGeom: { xPct: 50, yPct: 26, widthPct: 22, zIndex: 5 },
        blocks: [
          block("t1", "company", f.company, 50, 42, 88, 14, 700, "center", 5, "#e8dcc8"),
          block("t2", "tagline", f.tagline, 50, 56, 84, 10, 500, "center", 6, "rgba(232,220,200,0.85)"),
          block("t3", "personName", f.personName, 50, 68, 86, 10, 600, "center", 7, "#fffef9"),
          block("t4", "phone", f.phone, 50, 80, 86, 9, 400, "center", 8, "#e8dcc8"),
        ],
      };
    case "leonix-crest-mark":
      return {
        fields: f,
        logoGeom: { xPct: 50, yPct: 36, widthPct: 30, zIndex: 8 },
        blocks: [
          block("t1", "company", f.company, 50, 70, 88, 12, 700, "center", 5, "#d4af37"),
          block("t2", "personName", f.personName, 50, 81, 88, 10, 500, "center", 6, "rgba(255,252,247,0.92)"),
        ],
      };
    case "leonix-gold-diagonal":
      return {
        fields: f,
        logoGeom: { xPct: 22, yPct: 50, widthPct: 20, zIndex: 5 },
        blocks: [
          block("t1", "company", f.company, 62, 36, 68, 13, 700, "left", 5, "#6b5410"),
          block("t2", "personName", f.personName, 62, 50, 68, 11, 600, "left", 6, "#2c261c"),
          block("t3", "title", f.title, 62, 60, 68, 9, 500, "left", 7, "rgba(44,38,28,0.65)"),
          block("t4", "phone", f.phone, 62, 74, 68, 9, 500, "left", 8, "#8a7018"),
          block("t5", "email", f.email, 62, 84, 68, 8, 400, "left", 9, "#5c4f2e"),
        ],
      };
    case "leonix-grind-bar": {
      const grindTag = lang === "en" ? "Printed at Leonix · Built with pride" : "Impreso en Leonix · Con orgullo";
      const ff = { ...f, tagline: grindTag };
      return {
        fields: ff,
        logoGeom: { xPct: 50, yPct: 28, widthPct: 24, zIndex: 6 },
        blocks: [
          block("t1", "personName", ff.personName, 50, 44, 88, 13, 700, "center", 5, "#fffef9"),
          block("t2", "title", ff.title, 50, 56, 86, 9, 500, "center", 6, "rgba(255,254,249,0.72)"),
          block("t3", "company", ff.company, 50, 66, 88, 11, 600, "center", 7, "#c9a84a"),
          block("t4", "tagline", grindTag, 50, 88, 90, 9, 600, "center", 8, "#c9a84a"),
        ],
      };
    }
    case "bilingual-two-column":
      return {
        fields: bf,
        logoGeom: { xPct: 50, yPct: 22, widthPct: 18, zIndex: 4 },
        blocks: [
          block("t1", "company", bf.company, 50, 34, 88, 12, 700, "center", 5, ink),
          block("t2", "personName", bf.personName, 50, 46, 88, 11, 600, "center", 6, ink),
          block("t3", "title", bf.title, 50, 58, 88, 9, 500, "center", 7, mutedDark),
          block("t4", "phone", bf.phone, 32, 74, 40, 9, 500, "center", 8, ink),
          block("t5", "email", bf.email, 68, 74, 40, 8, 400, "center", 9, ink),
        ],
      };
    case "bilingual-dual-line":
      return {
        fields: bf,
        logoGeom: { xPct: 50, yPct: 26, widthPct: 20, zIndex: 4 },
        blocks: [
          block("t1", "company", bf.company, 50, 42, 88, 12, 700, "center", 5, "#3d3428"),
          block("t2", "personName", bf.personName, 50, 54, 88, 11, 600, "center", 6, ink),
          block("t3", "title", bf.title, 50, 64, 88, 9, 500, "center", 7, mutedDark),
          block("t4", "tagline", bf.tagline, 50, 76, 86, 8, 500, "center", 8, "rgba(61,52,40,0.72)"),
          block("t5", "phone", bf.phone, 50, 86, 88, 9, 500, "center", 9, "#3d3428"),
        ],
      };
    default:
      return getBusinessCardTemplateFront("clean-white-premium", lang);
  }
}

function backFieldsThankYou(lang: Lang): BusinessCardTextFields {
  return lang === "en"
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
}

function backFieldsWithAddress(lang: Lang): BusinessCardTextFields {
  const base = backFieldsThankYou(lang);
  const addr =
    lang === "en" ? "123 Market St, Suite 100 · City, ST" : "Av. Principal 123 · Ciudad";
  return { ...base, address: addr, tagline: lang === "en" ? "Visit us · Ven a vernos" : "Ven a vernos · Visit us" };
}

export function getBusinessCardTemplateBack(
  templateId: BusinessCardTemplateId,
  lang: Lang
): { fields: BusinessCardTextFields; blocks: BusinessCardTextBlock[]; logoGeom: BusinessCardLogoGeom } {
  const meta = BUSINESS_CARD_TEMPLATE_LIBRARY[templateId];
  const useMap = meta.mapBlockOnBack;
  const f = useMap ? backFieldsWithAddress(lang) : backFieldsThankYou(lang);
  const ink = "#1a1814";
  const gold = "#c9a84a";
  const muted = "rgba(26,24,20,0.65)";

  if (templateId === "lawyer-column-trust") {
    return {
      fields: f,
      logoGeom: { xPct: 50, yPct: 30, widthPct: 16, zIndex: 4 },
      blocks: [
        block("b1", "company", f.company, 50, 52, 86, 12, 700, "center", 5, "#d4b46a"),
        block("b2", "tagline", f.tagline, 50, 66, 86, 9, 500, "center", 6, "rgba(245,240,230,0.85)"),
      ],
    };
  }

  if (templateId === "minimal-black-onyx" || templateId === "leonix-crest-mark") {
    return {
      fields: f,
      logoGeom: { xPct: 50, yPct: 48, widthPct: 16, zIndex: 4 },
      blocks: [
        block("b1", "company", f.company, 50, 44, 86, 13, 700, "center", 5, gold),
        block("b2", "tagline", f.tagline, 50, 58, 86, 9, 500, "center", 6, "rgba(255,252,247,0.75)"),
      ],
    };
  }

  if (useMap) {
    return {
      fields: f,
      logoGeom: { xPct: 50, yPct: 26, widthPct: 15, zIndex: 4 },
      blocks: [
        block("b1", "company", f.company, 50, 36, 88, 12, 700, "center", 5, ink),
        block("b2", "address", f.address, 50, 50, 86, 9, 500, "center", 6, muted),
        block("b3", "tagline", f.tagline, 50, 68, 86, 9, 500, "center", 7, ink),
      ],
    };
  }

  if (templateId === "leonix-grind-bar") {
    return {
      fields: f,
      logoGeom: { xPct: 50, yPct: 50, widthPct: 18, zIndex: 4 },
      blocks: [
        block("b1", "company", f.company, 50, 44, 88, 12, 700, "center", 5, "#c9a84a"),
        block("b2", "tagline", f.tagline, 50, 58, 88, 9, 500, "center", 6, "rgba(255,252,247,0.88)"),
      ],
    };
  }

  return {
    fields: f,
    logoGeom: { xPct: 50, yPct: 48, widthPct: 18, zIndex: 4 },
    blocks: [
      block("b1", "company", f.company, 50, 40, 86, 13, 700, "center", 5, ink),
      block("b2", "tagline", f.tagline, 50, 56, 86, 10, 500, "center", 6, muted),
    ],
  };
}
