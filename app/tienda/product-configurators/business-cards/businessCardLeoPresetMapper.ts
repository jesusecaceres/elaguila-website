import type { BusinessCardCanvasBackground } from "./types";
import type { BusinessCardTemplateId } from "./businessCardTemplateCatalog";
import { getTemplateCanvasBackground } from "./businessCardTemplateLayouts";
import type { LeoPreferredStyle } from "./businessCardLeoTypes";

/**
 * Optional canvas tweak from color notes + style — keeps templates authoritative when unclear.
 */
export function leoCanvasBackgroundForIntake(
  templateId: BusinessCardTemplateId,
  preferredColorsNote: string,
  preferredStyle: LeoPreferredStyle
): BusinessCardCanvasBackground {
  const base = getTemplateCanvasBackground(templateId);
  const t = preferredColorsNote.toLowerCase();

  if (/\b(navy|azul marino|marino)\b/.test(t)) {
    if (templateId === "azure-confidence-strip") {
      return { kind: "solid", color: "#f1f5f9" };
    }
    if (templateId === "bench-brief-easel") {
      return { kind: "solid", color: "#0f172a" };
    }
    return { kind: "solid", color: "#142032" };
  }
  if (/\b(black|negro|carbon|charcoal)\b/.test(t) && !/\b(white|blanco)\b/.test(t)) {
    if (templateId === "carbon-soft-elevated") {
      return { kind: "solid", color: "#2a2a2e" };
    }
    if (templateId === "velvet-midnight-gold") {
      return { kind: "solid", color: "#0f0f12" };
    }
    if (templateId === "leonix-orbit-halo" || templateId === "leonix-ledger-stripe") {
      return { kind: "solid", color: templateId === "leonix-ledger-stripe" ? "#121214" : "#0e0e10" };
    }
    if (templateId === "leonix-prism-facet") {
      return { kind: "solid", color: "#0a0a0c" };
    }
    return { kind: "solid", color: "#0a0a0c" };
  }
  if (/\b(white|blanco|ivory|marfil)\b/.test(t) && !/\b(black|negro)\b/.test(t)) {
    if (templateId === "ceramic-layered-air") {
      return { kind: "solid", color: "#fffdf9" };
    }
    return { kind: "solid", color: "#fffdf7" };
  }
  if (/\b(burgundy|wine|vino|bordo)\b/.test(t)) {
    return { kind: "solid", color: "#faf6f4" };
  }
  if (/\b(sage|olive|salvia|verde suave)\b/.test(t)) {
    if (templateId === "wellness-sage-soft") {
      return { kind: "solid", color: "#ecfdf5" };
    }
    return { kind: "solid", color: "#f4f7f4" };
  }
  if (/\b(rose|dusty rose|rosa)\b/.test(t)) {
    if (templateId === "studio-rose-line") {
      return { kind: "solid", color: "#fdf2f8" };
    }
    return { kind: "solid", color: "#fdf8f8" };
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
  if (/\b(pearl|perla)\b/.test(t)) {
    return { kind: "preset", id: "pearl" };
  }
  if (/\b(teal|turquesa|mint|dental|clinic|cl[ií]nica)\b/.test(t)) {
    return { kind: "solid", color: "#f0fdfa" };
  }

  /* No color notes: subtle style-based atmosphere (deterministic) */
  if (!t.trim()) {
    if (
      preferredStyle === "luxury" &&
      (templateId === "gold-accent-executive" ||
        templateId === "luxe-editorial" ||
        templateId === "ivory-executive-band" ||
        templateId === "leonix-marque-band")
    ) {
      return { kind: "preset", id: "sand" };
    }
    if (preferredStyle === "minimal" && (templateId === "clean-white-premium" || templateId === "azure-confidence-strip")) {
      return { kind: "preset", id: "pearl" };
    }
    if (preferredStyle === "elegant" && (templateId === "luxe-editorial" || templateId === "studio-rose-line")) {
      return { kind: "preset", id: "linen" };
    }
    if (preferredStyle === "modern" && (templateId === "monochrome-power" || templateId === "leonix-ledger-stripe")) {
      return { kind: "preset", id: "graphite" };
    }
    if (preferredStyle === "bold" && templateId === "saffron-edge-dynamic") {
      return { kind: "solid", color: "#fffdf7" };
    }
  }

  return base;
}
