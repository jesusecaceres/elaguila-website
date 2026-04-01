import type { BusinessCardCanvasBackground } from "./types";
import type { BusinessCardTemplateId } from "./businessCardTemplateCatalog";
import { getTemplateCanvasBackground } from "./businessCardTemplateLayouts";

/**
 * Optional canvas tweak from free-text color notes — keeps templates authoritative when unclear.
 */
export function leoCanvasBackgroundForIntake(
  templateId: BusinessCardTemplateId,
  preferredColorsNote: string
): BusinessCardCanvasBackground {
  const base = getTemplateCanvasBackground(templateId);
  const t = preferredColorsNote.toLowerCase();
  if (/\b(navy|azul marino|marino)\b/.test(t)) {
    return { kind: "solid", color: "#142032" };
  }
  if (/\b(black|negro|carbon|charcoal)\b/.test(t) && !/\b(white|blanco)\b/.test(t)) {
    return { kind: "solid", color: "#0a0a0c" };
  }
  if (/\b(white|blanco|ivory|marfil)\b/.test(t) && !/\b(black|negro)\b/.test(t)) {
    return { kind: "solid", color: "#fffdf7" };
  }
  if (/\b(cream|crema|beige|sand)\b/.test(t)) {
    return { kind: "preset", id: "sand" };
  }
  if (/\b(gray|grey|gris|graphite)\b/.test(t)) {
    return { kind: "preset", id: "graphite" };
  }
  if (/\b(linen|lino|textured)\b/.test(t)) {
    return { kind: "preset", id: "linen" };
  }
  if (/\b(teal|turquesa|mint|dental|clinic|cl[ií]nica)\b/.test(t)) {
    return { kind: "solid", color: "#f0fdfa" };
  }
  return base;
}
