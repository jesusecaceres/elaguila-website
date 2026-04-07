import type { BusinessCardTextFontPreset } from "./types";
import type { Lang } from "../../types/tienda";

/** Curated stacks only — no extra font loading; “default” follows card/trim typography. */
const PRESET_CSS: Record<Exclude<BusinessCardTextFontPreset, "default">, string> = {
  editorial: "Georgia, 'Times New Roman', serif",
  modern: "'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  mono: "ui-monospace, 'Cascadia Code', 'Consolas', 'Courier New', monospace",
};

export function resolveTextBlockFontFamilyCss(preset: BusinessCardTextFontPreset | undefined): string | undefined {
  if (!preset || preset === "default") return undefined;
  return PRESET_CSS[preset];
}

export function textFontPresetOptions(lang: Lang): { value: BusinessCardTextFontPreset; label: string }[] {
  const en = lang === "en";
  return [
    { value: "default", label: en ? "Card default" : "Predeterminado de la tarjeta" },
    { value: "editorial", label: en ? "Editorial serif" : "Serif editorial" },
    { value: "modern", label: en ? "Modern sans" : "Sans moderna" },
    { value: "mono", label: en ? "Technical mono" : "Mono técnica" },
  ];
}
