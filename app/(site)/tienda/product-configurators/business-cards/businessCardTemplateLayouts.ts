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
    case "bilingual-ribbon-feature":
    case "bilingual-inline-stack":
    case "bilingual-ledger-pair":
    case "bilingual-bridge-field":
      return { ...base, address: false };
    case "noir-razor-stack":
      return { ...base, website: false, address: false };
    case "forge-steel-callout":
      return { ...base, website: false, email: false, address: false };
    case "saffron-edge-dynamic":
      return { ...base, website: false };
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
  if (templateId === "leonix-gold-diagonal" || templateId === "realtor-elevated-gold") {
    return { kind: "preset", id: "pearl" };
  }
  if (templateId === "gold-accent-executive" || templateId === "ivory-executive-band") {
    return { kind: "preset", id: "sand" };
  }
  if (templateId === "monochrome-power") {
    return { kind: "preset", id: "linen" };
  }
  if (templateId === "carbon-soft-elevated") {
    return { kind: "solid", color: "#2a2a2e" };
  }
  if (templateId === "real-estate-horizon") {
    return { kind: "solid", color: "#1e3a4a" };
  }
  if (templateId === "azure-confidence-strip") {
    return { kind: "solid", color: "#f1f5f9" };
  }
  if (templateId === "wellness-sage-soft") {
    return { kind: "solid", color: "#ecfdf5" };
  }
  if (templateId === "studio-rose-line") {
    return { kind: "solid", color: "#fdf2f8" };
  }
  if (templateId === "sanctuary-burgundy-warm" || templateId === "leonix-orbit-halo" || templateId === "leonix-ledger-stripe") {
    return { kind: "solid", color: templateId === "leonix-orbit-halo" ? "#0e0e10" : templateId === "leonix-ledger-stripe" ? "#121214" : "#3f1d1d" };
  }
  if (templateId === "velvet-midnight-gold" || templateId === "leonix-prism-facet") {
    return { kind: "solid", color: templateId === "leonix-prism-facet" ? "#0a0a0c" : "#0f0f12" };
  }
  if (templateId === "sandstone-whisper") return { kind: "solid", color: "#f5f0e8" };
  if (templateId === "noir-razor-stack") return { kind: "solid", color: "#121214" };
  if (templateId === "ceramic-layered-air") return { kind: "solid", color: "#fffdf9" };
  if (templateId === "estate-skyline-grid") return { kind: "solid", color: "#e2e8f0" };
  if (templateId === "bench-brief-easel") return { kind: "solid", color: "#0f172a" };
  if (templateId === "forge-steel-callout") return { kind: "solid", color: "#1c1917" };
  if (templateId === "cellar-script-plate") return { kind: "solid", color: "#292524" };
  if (templateId === "bilingual-ledger-pair") return { kind: "solid", color: "#fffdf9" };
  if (templateId === "bilingual-bridge-field") return { kind: "solid", color: "#f8f6f1" };
  if (templateId === "leonix-marque-band") return { kind: "preset", id: "sand" };
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
          block("t1", "company", f.company, 50, 40, 88, 13, 700, "center", 5, gold),
          block("t2", "personName", f.personName, 50, 52, 88, 11, 600, "center", 6, "#fffef9"),
          block("t3", "title", f.title, 50, 62, 88, 9, 500, "center", 7, muted),
          block("t4", "phone", f.phone, 50, 74, 88, 10, 500, "center", 8, gold),
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
          block("t1", "company", f.company, 50, 40, 86, 15, 700, "center", 5, ink),
          block("t2", "personName", f.personName, 50, 51, 86, 11, 600, "center", 6, ink),
          block("t3", "title", f.title, 50, 60, 86, 10, 500, "center", 7, mutedDark),
          block("t4", "phone", f.phone, 50, 71, 86, 9, 500, "center", 8, ink),
          block("t5", "email", f.email, 50, 80, 86, 9, 400, "center", 9, ink),
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
          block("t1", "personName", f.personName, 50, 26, 80, 16, 600, "center", 5, "#2c261c"),
          block("t2", "title", f.title, 50, 40, 72, 9, 500, "center", 6, "rgba(44,38,28,0.65)"),
          block("t3", "company", f.company, 50, 50, 80, 12, 700, "center", 7, "#2c261c"),
          block("t4", "tagline", f.tagline, 50, 60, 78, 9, 400, "center", 8, "rgba(44,38,28,0.55)"),
          block("t5", "email", f.email, 50, 72, 80, 8, 400, "center", 9, "#2c261c"),
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
    case "ivory-executive-band":
      return {
        fields: f,
        logoGeom: { xPct: 50, yPct: 20, widthPct: 20, zIndex: 5 },
        blocks: [
          block("t0", "tagline", f.tagline, 50, 34, 80, 8, 600, "center", 4, "#8a7018"),
          block("t1", "company", f.company, 50, 46, 88, 15, 700, "center", 5, "#2c261c"),
          block("t2", "personName", f.personName, 50, 58, 88, 11, 600, "center", 6, ink),
          block("t3", "title", f.title, 50, 68, 88, 9, 500, "center", 7, mutedDark),
          block("t4", "phone", f.phone, 50, 80, 88, 9, 500, "center", 8, "#a67c2a"),
        ],
      };
    case "carbon-soft-elevated":
      return {
        fields: f,
        logoGeom: { xPct: 50, yPct: 22, widthPct: 22, zIndex: 6 },
        blocks: [
          block("t1", "company", f.company, 50, 40, 88, 14, 700, "center", 5, "#f5f0e6"),
          block("t2", "personName", f.personName, 50, 52, 88, 11, 600, "center", 6, "#fffef9"),
          block("t3", "title", f.title, 50, 62, 88, 9, 500, "center", 7, "rgba(255,252,247,0.65)"),
          block("t4", "phone", f.phone, 50, 74, 88, 10, 500, "center", 8, "#e8dcc8"),
          block("t5", "email", f.email, 50, 84, 88, 8, 400, "center", 9, "rgba(255,252,247,0.72)"),
        ],
      };
    case "azure-confidence-strip":
      return {
        fields: f,
        logoGeom: { xPct: 78, yPct: 28, widthPct: 18, zIndex: 5 },
        blocks: [
          block("t1", "company", f.company, 38, 36, 58, 13, 700, "left", 5, "#1e3a5f"),
          block("t2", "personName", f.personName, 38, 50, 58, 11, 600, "left", 6, ink),
          block("t3", "title", f.title, 38, 62, 58, 9, 500, "left", 7, mutedDark),
          block("t4", "phone", f.phone, 38, 76, 58, 9, 500, "left", 8, "#1e3a5f"),
          block("t5", "email", f.email, 38, 86, 58, 8, 400, "left", 9, ink),
        ],
      };
    case "saffron-edge-dynamic":
      return {
        fields: f,
        logoGeom: { xPct: 62, yPct: 26, widthPct: 20, zIndex: 5 },
        blocks: [
          block("t1", "company", f.company, 62, 38, 68, 14, 700, "left", 5, "#1a1814"),
          block("t2", "personName", f.personName, 62, 52, 68, 11, 600, "left", 6, ink),
          block("t3", "title", f.title, 62, 64, 68, 9, 500, "left", 7, mutedDark),
          block("t4", "phone", f.phone, 62, 78, 68, 10, 600, "left", 8, "#d97706"),
          block("t5", "email", f.email, 62, 88, 68, 8, 400, "left", 9, ink),
        ],
      };
    case "realtor-elevated-gold":
      return {
        fields: f,
        logoGeom: { xPct: 50, yPct: 20, widthPct: 20, zIndex: 5 },
        blocks: [
          block("t1", "company", f.company, 50, 36, 90, 13, 700, "center", 5, "#1e3a4a"),
          block("t2", "personName", f.personName, 50, 48, 88, 12, 600, "center", 6, "#111113"),
          block("t3", "title", f.title, 50, 60, 86, 9, 500, "center", 7, "rgba(30,58,74,0.75)"),
          block("t4", "phone", f.phone, 50, 72, 88, 11, 600, "center", 8, "#b8860b"),
          block("t5", "email", f.email, 50, 84, 88, 8, 400, "center", 9, "#1e3a4a"),
        ],
      };
    case "wellness-sage-soft":
      return {
        fields: f,
        logoGeom: { xPct: 50, yPct: 22, widthPct: 19, zIndex: 4 },
        blocks: [
          block("t1", "company", f.company, 50, 40, 88, 12, 700, "center", 5, "#0f766e"),
          block("t2", "personName", f.personName, 50, 52, 88, 12, 600, "center", 6, "#134e4a"),
          block("t3", "title", f.title, 50, 64, 88, 9, 500, "center", 7, "rgba(15,118,110,0.75)"),
          block("t4", "phone", f.phone, 50, 76, 88, 9, 500, "center", 8, "#0f766e"),
          block("t5", "email", f.email, 50, 86, 88, 8, 400, "center", 9, "#134e4a"),
        ],
      };
    case "studio-rose-line":
      return {
        fields: f,
        logoGeom: { xPct: 50, yPct: 24, widthPct: 21, zIndex: 5 },
        blocks: [
          block("t1", "company", f.company, 50, 40, 88, 13, 700, "center", 5, "#9d174d"),
          block("t2", "personName", f.personName, 50, 52, 88, 11, 600, "center", 6, "#831843"),
          block("t3", "title", f.title, 50, 62, 88, 9, 500, "center", 7, "rgba(157,23,77,0.75)"),
          block("t4", "phone", f.phone, 50, 74, 88, 9, 500, "center", 8, "#9d174d"),
          block("t5", "email", f.email, 50, 84, 88, 8, 400, "center", 9, "#831843"),
        ],
      };
    case "sanctuary-burgundy-warm":
      return {
        fields: f,
        logoGeom: { xPct: 50, yPct: 24, widthPct: 20, zIndex: 5 },
        blocks: [
          block("t1", "company", f.company, 50, 40, 88, 12, 700, "center", 5, "#f5e6c8"),
          block("t2", "personName", f.personName, 50, 52, 88, 12, 600, "center", 6, "#fffef9"),
          block("t3", "title", f.title, 50, 64, 88, 9, 500, "center", 7, "rgba(245,230,200,0.85)"),
          block("t4", "phone", f.phone, 50, 76, 88, 10, 500, "center", 8, "#f5e6c8"),
          block("t5", "email", f.email, 50, 86, 88, 8, 400, "center", 9, "rgba(255,254,249,0.88)"),
        ],
      };
    case "bilingual-ribbon-feature":
      return {
        fields: bf,
        logoGeom: { xPct: 50, yPct: 22, widthPct: 18, zIndex: 4 },
        blocks: [
          block("t1", "company", bf.company, 50, 34, 88, 12, 700, "center", 5, ink),
          block("t2", "personName", bf.personName, 50, 46, 88, 11, 600, "center", 6, ink),
          block("t3", "title", bf.title, 50, 58, 88, 9, 500, "center", 7, mutedDark),
          block("t4", "tagline", bf.tagline, 50, 68, 86, 8, 500, "center", 8, "rgba(44,38,28,0.55)"),
          block("t5", "phone", bf.phone, 50, 82, 88, 10, 600, "center", 9, "#1c1914"),
        ],
      };
    case "bilingual-inline-stack":
      return {
        fields: bf,
        logoGeom: { xPct: 50, yPct: 24, widthPct: 19, zIndex: 4 },
        blocks: [
          block("t1", "company", bf.company, 50, 36, 88, 12, 700, "center", 5, "#3d3428"),
          block("t2", "title", bf.title, 50, 48, 88, 9, 500, "center", 6, mutedDark),
          block("t3", "personName", bf.personName, 50, 58, 88, 11, 600, "center", 7, ink),
          block("t4", "phone", bf.phone, 50, 72, 88, 9, 500, "center", 8, "#3d3428"),
          block("t5", "email", bf.email, 50, 84, 88, 8, 400, "center", 9, ink),
        ],
      };
    case "leonix-orbit-halo":
      return {
        fields: f,
        logoGeom: { xPct: 50, yPct: 34, widthPct: 28, zIndex: 8 },
        blocks: [
          block("t1", "company", f.company, 50, 68, 88, 12, 700, "center", 5, "#d4af37"),
          block("t2", "personName", f.personName, 50, 80, 88, 10, 500, "center", 6, "rgba(255,252,247,0.9)"),
        ],
      };
    case "leonix-ledger-stripe":
      return {
        fields: f,
        logoGeom: { xPct: 50, yPct: 26, widthPct: 22, zIndex: 6 },
        blocks: [
          block("t1", "company", f.company, 50, 40, 88, 13, 700, "center", 5, "#fffef9"),
          block("t2", "personName", f.personName, 50, 54, 88, 11, 600, "center", 6, "rgba(255,254,249,0.92)"),
          block("t3", "title", f.title, 50, 66, 88, 9, 500, "center", 7, "rgba(255,254,249,0.65)"),
          block("t4", "phone", f.phone, 50, 88, 92, 11, 600, "center", 8, "#0a0a0c"),
        ],
      };
    case "velvet-midnight-gold":
      return {
        fields: f,
        logoGeom: { xPct: 50, yPct: 22, widthPct: 22, zIndex: 6 },
        blocks: [
          block("t1", "company", f.company, 50, 38, 88, 13, 700, "center", 5, "#d4af37"),
          block("t2", "personName", f.personName, 50, 50, 88, 12, 600, "center", 6, "#fffef9"),
          block("t3", "title", f.title, 50, 62, 88, 9, 500, "center", 7, "rgba(255,254,249,0.72)"),
          block("t4", "phone", f.phone, 50, 74, 88, 10, 500, "center", 8, "#d4af37"),
          block("t5", "email", f.email, 50, 84, 88, 8, 400, "center", 9, "rgba(255,254,249,0.82)"),
        ],
      };
    case "sandstone-whisper":
      return {
        fields: f,
        logoGeom: { xPct: 22, yPct: 30, widthPct: 20, zIndex: 5 },
        blocks: [
          block("t1", "company", f.company, 62, 32, 64, 12, 700, "left", 5, "#5c5346"),
          block("t2", "personName", f.personName, 62, 44, 64, 11, 600, "left", 6, "#3d3830"),
          block("t3", "title", f.title, 62, 54, 64, 9, 500, "left", 7, "rgba(92,83,70,0.65)"),
          block("t4", "phone", f.phone, 62, 68, 64, 9, 500, "left", 8, "#5c5346"),
          block("t5", "email", f.email, 62, 78, 64, 8, 400, "left", 9, "#5c5346"),
        ],
      };
    case "noir-razor-stack":
      return {
        fields: f,
        logoGeom: { xPct: 50, yPct: 22, widthPct: 24, zIndex: 6 },
        blocks: [
          block("t1", "company", f.company, 50, 46, 92, 20, 700, "center", 5, "#e2e8f0"),
          block("t2", "personName", f.personName, 50, 62, 88, 11, 600, "center", 6, "#fffef9"),
          block("t3", "tagline", f.tagline, 50, 74, 86, 9, 500, "center", 7, "rgba(226,232,240,0.65)"),
          block("t4", "phone", f.phone, 50, 86, 88, 11, 600, "center", 8, "#e2e8f0"),
        ],
      };
    case "ceramic-layered-air":
      return {
        fields: f,
        logoGeom: { xPct: 50, yPct: 22, widthPct: 20, zIndex: 4 },
        blocks: [
          block("t1", "company", f.company, 50, 38, 86, 14, 700, "center", 5, "#2a2824"),
          block("t2", "personName", f.personName, 50, 50, 86, 11, 600, "center", 6, "#2a2824"),
          block("t3", "title", f.title, 50, 60, 86, 9, 500, "center", 7, "rgba(42,40,36,0.6)"),
          block("t4", "phone", f.phone, 50, 72, 86, 9, 500, "center", 8, "#2a2824"),
          block("t5", "email", f.email, 50, 82, 86, 8, 400, "center", 9, "#2a2824"),
        ],
      };
    case "estate-skyline-grid":
      return {
        fields: f,
        logoGeom: { xPct: 50, yPct: 18, widthPct: 19, zIndex: 5 },
        blocks: [
          block("t1", "company", f.company, 50, 34, 90, 12, 700, "center", 5, "#1e293b"),
          block("t2", "personName", f.personName, 50, 46, 88, 12, 600, "center", 6, "#0f172a"),
          block("t3", "title", f.title, 50, 58, 86, 9, 500, "center", 7, "rgba(30,41,59,0.75)"),
          block("t4", "phone", f.phone, 50, 72, 88, 10, 600, "center", 8, "#1e293b"),
          block("t5", "email", f.email, 50, 84, 88, 8, 400, "center", 9, "#1e293b"),
        ],
      };
    case "bench-brief-easel":
      return {
        fields: f,
        logoGeom: { xPct: 50, yPct: 24, widthPct: 18, zIndex: 5 },
        blocks: [
          block("t1", "company", f.company, 50, 40, 88, 12, 700, "center", 5, "#c9a84a"),
          block("t2", "personName", f.personName, 50, 52, 88, 11, 600, "center", 6, "#f8fafc"),
          block("t3", "title", f.title, 50, 62, 88, 9, 500, "center", 7, "rgba(248,250,252,0.75)"),
          block("t4", "phone", f.phone, 50, 74, 88, 9, 500, "center", 8, "#c9a84a"),
          block("t5", "email", f.email, 50, 84, 88, 8, 400, "center", 9, "rgba(248,250,252,0.88)"),
        ],
      };
    case "forge-steel-callout":
      return {
        fields: f,
        logoGeom: { xPct: 50, yPct: 28, widthPct: 22, zIndex: 5 },
        blocks: [
          block("t1", "company", f.company, 50, 44, 92, 14, 700, "center", 5, "#ea580c"),
          block("t2", "personName", f.personName, 50, 58, 88, 11, 600, "center", 6, "#fffef9"),
          block("t3", "title", f.title, 50, 68, 88, 9, 500, "center", 7, "rgba(255,254,249,0.72)"),
          block("t4", "phone", f.phone, 50, 86, 92, 15, 700, "center", 8, "#ea580c"),
        ],
      };
    case "cellar-script-plate":
      return {
        fields: f,
        logoGeom: { xPct: 50, yPct: 24, widthPct: 22, zIndex: 5 },
        blocks: [
          block("t1", "company", f.company, 50, 40, 88, 14, 700, "center", 5, "#fcd34d"),
          block("t2", "tagline", f.tagline, 50, 54, 84, 10, 500, "center", 6, "rgba(252,211,77,0.75)"),
          block("t3", "personName", f.personName, 50, 66, 82, 10, 600, "center", 7, "#fffef9"),
          block("t4", "phone", f.phone, 50, 80, 86, 9, 400, "center", 8, "#fcd34d"),
        ],
      };
    case "bilingual-ledger-pair":
      return {
        fields: bf,
        logoGeom: { xPct: 50, yPct: 20, widthPct: 18, zIndex: 4 },
        blocks: [
          block("t1", "company", bf.company, 50, 32, 88, 12, 700, "center", 5, ink),
          block("t2", "personName", bf.personName, 50, 44, 88, 11, 600, "center", 6, ink),
          block("t3", "title", bf.title, 50, 56, 88, 9, 500, "center", 7, mutedDark),
          block("t4", "phone", bf.phone, 32, 74, 38, 9, 500, "center", 8, ink),
          block("t5", "email", bf.email, 68, 74, 38, 8, 400, "center", 9, ink),
        ],
      };
    case "bilingual-bridge-field":
      return {
        fields: bf,
        logoGeom: { xPct: 50, yPct: 22, widthPct: 19, zIndex: 4 },
        blocks: [
          block("t1", "company", bf.company, 50, 34, 88, 12, 700, "center", 5, "#3d3428"),
          block("t2", "personName", bf.personName, 50, 46, 88, 11, 600, "center", 6, ink),
          block("t3", "title", bf.title, 50, 58, 88, 9, 500, "center", 7, mutedDark),
          block("t4", "tagline", bf.tagline, 50, 68, 86, 8, 500, "center", 8, "rgba(61,52,40,0.55)"),
          block("t5", "phone", bf.phone, 50, 82, 88, 9, 500, "center", 9, "#3d3428"),
        ],
      };
    case "leonix-prism-facet":
      return {
        fields: f,
        logoGeom: { xPct: 50, yPct: 34, widthPct: 30, zIndex: 8 },
        blocks: [
          block("t1", "company", f.company, 50, 70, 88, 12, 700, "center", 5, "#d4af37"),
          block("t2", "personName", f.personName, 50, 82, 88, 10, 500, "center", 6, "rgba(255,252,247,0.92)"),
        ],
      };
    case "leonix-marque-band":
      return {
        fields: f,
        logoGeom: { xPct: 50, yPct: 30, widthPct: 22, zIndex: 6 },
        blocks: [
          block("t0", "tagline", f.tagline, 50, 44, 80, 8, 600, "center", 4, "#8a7018"),
          block("t1", "company", f.company, 50, 56, 88, 14, 700, "center", 5, "#2c261c"),
          block("t2", "personName", f.personName, 50, 68, 88, 11, 600, "center", 6, "#3d3428"),
          block("t3", "phone", f.phone, 50, 82, 88, 10, 500, "center", 7, "#b8860b"),
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
    if (templateId === "sanctuary-burgundy-warm") {
      const cream = "#f5e6c8";
      const creamMuted = "rgba(245,230,200,0.85)";
      return {
        fields: f,
        logoGeom: { xPct: 50, yPct: 26, widthPct: 15, zIndex: 4 },
        blocks: [
          block("b1", "company", f.company, 50, 36, 88, 12, 700, "center", 5, cream),
          block("b2", "address", f.address, 50, 50, 86, 9, 500, "center", 6, creamMuted),
          block("b3", "tagline", f.tagline, 50, 68, 86, 9, 500, "center", 7, cream),
        ],
      };
    }
    if (templateId === "cellar-script-plate") {
      return {
        fields: f,
        logoGeom: { xPct: 50, yPct: 26, widthPct: 15, zIndex: 4 },
        blocks: [
          block("b1", "company", f.company, 50, 36, 88, 12, 700, "center", 5, "#fcd34d"),
          block("b2", "address", f.address, 50, 50, 86, 9, 500, "center", 6, "rgba(255,254,249,0.82)"),
          block("b3", "tagline", f.tagline, 50, 68, 86, 9, 500, "center", 7, "#fcd34d"),
        ],
      };
    }
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

  if (templateId === "leonix-orbit-halo") {
    return {
      fields: f,
      logoGeom: { xPct: 50, yPct: 42, widthPct: 24, zIndex: 4 },
      blocks: [
        block("b1", "company", f.company, 50, 64, 88, 11, 700, "center", 5, "#d4af37"),
        block("b2", "tagline", f.tagline, 50, 78, 88, 9, 500, "center", 6, "rgba(255,252,247,0.88)"),
      ],
    };
  }

  if (templateId === "leonix-ledger-stripe") {
    return {
      fields: f,
      logoGeom: { xPct: 50, yPct: 32, widthPct: 14, zIndex: 4 },
      blocks: [
        block("b1", "company", f.company, 50, 46, 88, 12, 700, "center", 5, "#fffef9"),
        block("b2", "tagline", f.tagline, 50, 60, 88, 9, 500, "center", 6, "rgba(255,254,249,0.72)"),
        block("b3", "phone", f.phone, 50, 88, 92, 10, 600, "center", 7, "#c9a84a"),
      ],
    };
  }

  if (templateId === "carbon-soft-elevated") {
    return {
      fields: f,
      logoGeom: { xPct: 50, yPct: 48, widthPct: 16, zIndex: 4 },
      blocks: [
        block("b1", "company", f.company, 50, 44, 88, 12, 700, "center", 5, "#f5f0e6"),
        block("b2", "tagline", f.tagline, 50, 58, 88, 9, 500, "center", 6, "rgba(245,240,230,0.78)"),
      ],
    };
  }

  if (templateId === "studio-rose-line") {
    return {
      fields: f,
      logoGeom: { xPct: 50, yPct: 48, widthPct: 16, zIndex: 4 },
      blocks: [
        block("b1", "company", f.company, 50, 40, 88, 12, 700, "center", 5, "#9d174d"),
        block("b2", "tagline", f.tagline, 50, 56, 88, 9, 500, "center", 6, "rgba(131,24,67,0.75)"),
      ],
    };
  }

  if (templateId === "bilingual-ribbon-feature") {
    return {
      fields: f,
      logoGeom: { xPct: 50, yPct: 28, widthPct: 14, zIndex: 4 },
      blocks: [
        block("b1", "company", f.company, 50, 42, 88, 12, 700, "center", 5, ink),
        block("b2", "tagline", f.tagline, 50, 56, 88, 9, 500, "center", 6, muted),
      ],
    };
  }

  if (templateId === "bilingual-inline-stack") {
    return {
      fields: f,
      logoGeom: { xPct: 50, yPct: 46, widthPct: 16, zIndex: 4 },
      blocks: [
        block("b1", "company", f.company, 50, 40, 88, 12, 700, "center", 5, "#3d3428"),
        block("b2", "tagline", f.tagline, 50, 56, 88, 9, 500, "center", 6, muted),
      ],
    };
  }

  if (templateId === "bilingual-ledger-pair") {
    return {
      fields: f,
      logoGeom: { xPct: 50, yPct: 30, widthPct: 14, zIndex: 4 },
      blocks: [
        block("b1", "company", f.company, 50, 42, 88, 12, 700, "center", 5, ink),
        block("b2", "tagline", f.tagline, 50, 58, 88, 9, 500, "center", 6, muted),
      ],
    };
  }

  if (templateId === "bilingual-bridge-field") {
    return {
      fields: f,
      logoGeom: { xPct: 50, yPct: 44, widthPct: 16, zIndex: 4 },
      blocks: [
        block("b1", "company", f.company, 50, 40, 88, 12, 700, "center", 5, "#3d3428"),
        block("b2", "tagline", f.tagline, 50, 58, 88, 9, 500, "center", 6, muted),
      ],
    };
  }

  if (templateId === "velvet-midnight-gold") {
    return {
      fields: f,
      logoGeom: { xPct: 50, yPct: 44, widthPct: 16, zIndex: 4 },
      blocks: [
        block("b1", "company", f.company, 50, 46, 86, 12, 700, "center", 5, "#d4af37"),
        block("b2", "tagline", f.tagline, 50, 62, 86, 9, 500, "center", 6, "rgba(255,254,249,0.78)"),
      ],
    };
  }

  if (templateId === "sandstone-whisper") {
    return {
      fields: f,
      logoGeom: { xPct: 50, yPct: 48, widthPct: 16, zIndex: 4 },
      blocks: [
        block("b1", "company", f.company, 50, 44, 86, 12, 700, "center", 5, "#5c5346"),
        block("b2", "tagline", f.tagline, 50, 58, 86, 9, 500, "center", 6, "rgba(92,83,70,0.7)"),
      ],
    };
  }

  if (templateId === "noir-razor-stack") {
    return {
      fields: f,
      logoGeom: { xPct: 50, yPct: 44, widthPct: 18, zIndex: 4 },
      blocks: [
        block("b1", "company", f.company, 50, 48, 88, 14, 700, "center", 5, "#e2e8f0"),
        block("b2", "tagline", f.tagline, 50, 68, 86, 9, 500, "center", 6, "rgba(226,232,240,0.65)"),
      ],
    };
  }

  if (templateId === "bench-brief-easel") {
    return {
      fields: f,
      logoGeom: { xPct: 50, yPct: 32, widthPct: 14, zIndex: 4 },
      blocks: [
        block("b1", "company", f.company, 50, 48, 88, 12, 700, "center", 5, "#c9a84a"),
        block("b2", "tagline", f.tagline, 50, 64, 88, 9, 500, "center", 6, "rgba(248,250,252,0.82)"),
      ],
    };
  }

  if (templateId === "forge-steel-callout") {
    return {
      fields: f,
      logoGeom: { xPct: 50, yPct: 40, widthPct: 18, zIndex: 4 },
      blocks: [
        block("b1", "company", f.company, 50, 44, 88, 12, 700, "center", 5, "#ea580c"),
        block("b2", "phone", f.phone, 50, 72, 88, 12, 700, "center", 6, "#fffef9"),
      ],
    };
  }

  if (templateId === "leonix-prism-facet") {
    return {
      fields: f,
      logoGeom: { xPct: 50, yPct: 42, widthPct: 26, zIndex: 4 },
      blocks: [
        block("b1", "company", f.company, 50, 66, 88, 11, 700, "center", 5, "#d4af37"),
        block("b2", "tagline", f.tagline, 50, 80, 88, 9, 500, "center", 6, "rgba(255,252,247,0.88)"),
      ],
    };
  }

  if (templateId === "leonix-marque-band") {
    return {
      fields: f,
      logoGeom: { xPct: 50, yPct: 46, widthPct: 16, zIndex: 4 },
      blocks: [
        block("b1", "company", f.company, 50, 44, 88, 12, 700, "center", 5, "#2c261c"),
        block("b2", "tagline", f.tagline, 50, 60, 88, 9, 500, "center", 6, "rgba(44,38,28,0.65)"),
      ],
    };
  }

  return {
    fields: f,
    logoGeom: { xPct: 50, yPct: 48, widthPct: 18, zIndex: 4 },
    blocks: [
      block("b1", "company", f.company, 50, 38, 86, 14, 700, "center", 5, ink),
      block("b2", "tagline", f.tagline, 50, 54, 86, 10, 500, "center", 6, muted),
    ],
  };
}
