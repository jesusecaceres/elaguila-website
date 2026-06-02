import type { ServiciosLang, ServiciosProfileResolved } from "../types/serviciosBusinessProfile";
import { parseLanguageOtherLines } from "@/app/(site)/clasificados/publicar/servicios/lib/languageOtherLines";

/** Build deduped public language labels from application state. */
export function buildServiciosLanguageLabels(
  state: { languageIds: string[]; languageOtherLines: string },
  lang: ServiciosLang,
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const add = (label: string) => {
    const t = label.trim();
    if (!t) return;
    const key = t.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(t.slice(0, 48));
  };

  if (state.languageIds.includes("lang_es")) {
    add(lang === "en" ? "Spanish" : "Español");
  }
  if (state.languageIds.includes("lang_en")) {
    add(lang === "en" ? "English" : "Inglés");
  }
  if (state.languageIds.includes("lang_otro")) {
    const extra = parseLanguageOtherLines(state.languageOtherLines);
    if (extra.length === 0) {
      add(lang === "en" ? "Other language" : "Otro idioma");
    } else {
      for (const lab of extra) add(lab);
    }
  }
  return out;
}

/** Language labels from resolved hero badges (spanish + custom language chips). */
export function collectServiciosLanguageLabelsFromProfile(
  profile: Pick<ServiciosProfileResolved["hero"], "badges">,
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const b of profile.badges ?? []) {
    if (b.kind !== "spanish" && b.kind !== "custom") continue;
    const label = b.label?.trim();
    if (!label) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(label);
  }
  return out;
}

export type ServiciosHeroLanguageDisplay = {
  visible: string[];
  overflowCount: number;
  overflowLabel: string | null;
};

/** Hero: cap visible chips; summarize overflow as +N idiomas / +N languages. */
export function formatServiciosHeroLanguageDisplay(
  labels: string[],
  lang: ServiciosLang,
  maxVisible = 3,
): ServiciosHeroLanguageDisplay {
  if (labels.length <= maxVisible) {
    return { visible: labels, overflowCount: 0, overflowLabel: null };
  }
  const overflowCount = labels.length - maxVisible;
  return {
    visible: labels.slice(0, maxVisible),
    overflowCount,
    overflowLabel:
      lang === "en"
        ? `+${overflowCount} language${overflowCount === 1 ? "" : "s"}`
        : overflowCount === 1
          ? `+${overflowCount} idioma`
          : `+${overflowCount} idiomas`,
  };
}
