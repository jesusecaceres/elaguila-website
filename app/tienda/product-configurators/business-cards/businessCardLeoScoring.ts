import {
  BUSINESS_CARD_TEMPLATE_IDS,
  BUSINESS_CARD_TEMPLATE_LIBRARY,
  type BusinessCardTemplateId,
} from "./businessCardTemplateCatalog";
import type { BusinessCardLeoIntake, LeoPreferredStyle } from "./businessCardLeoTypes";

const TIE_ORDER = new Map(BUSINESS_CARD_TEMPLATE_IDS.map((id, i) => [id, i]));

function suggestsBilingual(haystack: string): boolean {
  return (
    /\b(bilingual|bilingüe|bilingue)\b/i.test(haystack) ||
    /\b(es\/en|en\/es)\b/i.test(haystack) ||
    /\b(spanish|español|espanol)\b.*\b(english|inglés|ingles)\b/i.test(haystack) ||
    /\b(english|inglés|ingles)\b.*\b(spanish|español|espanol)\b/i.test(haystack)
  );
}

function colorHints(haystack: string): { dark: boolean; light: boolean; gold: boolean } {
  const t = haystack.toLowerCase();
  return {
    dark: /\b(black|negro|oscuro|dark|charcoal|midnight)\b/.test(t),
    light: /\b(white|blanco|light|cream|crema|ivory|marfil)\b/.test(t),
    gold: /\b(gold|dorado|oro|champagne)\b/.test(t),
  };
}

const STYLE_WEIGHTS: Record<LeoPreferredStyle, Partial<Record<BusinessCardTemplateId, number>>> = {
  luxury: {
    "gold-accent-executive": 14,
    "luxe-editorial": 14,
    "leonix-gold-diagonal": 12,
    "leonix-crest-mark": 11,
    "minimal-black-onyx": 6,
    "clean-white-premium": 5,
  },
  modern: {
    "bold-modern-slab": 14,
    "clean-white-premium": 12,
    "monochrome-power": 10,
    "minimal-black-onyx": 8,
    "leonix-grind-bar": 7,
  },
  bold: {
    "bold-modern-slab": 12,
    "auto-dealer-stripe": 12,
    "contractor-bold-phone": 12,
    "leonix-grind-bar": 10,
    "minimal-black-onyx": 6,
  },
  minimal: {
    "minimal-black-onyx": 14,
    "monochrome-power": 12,
    "clean-white-premium": 11,
    "bold-modern-slab": 4,
  },
  elegant: {
    "luxe-editorial": 13,
    "lawyer-column-trust": 12,
    "gold-accent-executive": 11,
    "monochrome-power": 8,
    "clean-white-premium": 7,
  },
};

const INDUSTRY_RULES: Array<{ re: RegExp; template: BusinessCardTemplateId; weight: number }> = [
  { re: /real\s*estate|realtor|inmobiliaria|bienes ra[ií]ces|propiedad/i, template: "real-estate-horizon", weight: 28 },
  { re: /auto|car dealer|dealership|automotriz|concesionaria|veh[ií]culo/i, template: "auto-dealer-stripe", weight: 28 },
  { re: /dental|dentist|odont|cl[ií]nica dental/i, template: "dental-clinical-clean", weight: 28 },
  { re: /law|legal|attorney|abogad|bufete|notar/i, template: "lawyer-column-trust", weight: 26 },
  { re: /restaurant|chef|kitchen|cocina|caf[eé]|bar |food service|catering/i, template: "restaurant-warm-plate", weight: 26 },
  { re: /contractor|plumb|hvac|roof|electric|construc|remodel|handyman|jardiner/i, template: "contractor-bold-phone", weight: 26 },
];

/**
 * Deterministic template ranking for LEO V1 — higher score wins; ties follow catalog order.
 */
export function scoreLeoTemplateCandidates(intake: Pick<BusinessCardLeoIntake, "profession" | "businessName" | "slogan" | "preferredColors" | "preferredStyle" | "emphasis" | "backStyle">): BusinessCardTemplateId[] {
  const haystack = `${intake.profession} ${intake.businessName} ${intake.slogan} ${intake.preferredColors}`.trim();
  const lower = haystack.toLowerCase();
  const scores = new Map<BusinessCardTemplateId, number>();
  for (const id of BUSINESS_CARD_TEMPLATE_IDS) scores.set(id, 0);

  const add = (id: BusinessCardTemplateId, pts: number) => scores.set(id, (scores.get(id) ?? 0) + pts);

  /* Universal premium baseline so unknown professions still look polished */
  add("clean-white-premium", 6);
  add("gold-accent-executive", 5);
  add("luxe-editorial", 4);

  for (const rule of INDUSTRY_RULES) {
    if (rule.re.test(lower)) add(rule.template, rule.weight);
  }

  if (suggestsBilingual(lower)) {
    add("bilingual-two-column", 22);
    add("bilingual-dual-line", 18);
  }

  const sw = STYLE_WEIGHTS[intake.preferredStyle];
  for (const id of BUSINESS_CARD_TEMPLATE_IDS) {
    const w = sw[id];
    if (w) add(id, w);
  }

  if (intake.emphasis === "logo") {
    add("leonix-crest-mark", 14);
    add("bold-modern-slab", 8);
    add("auto-dealer-stripe", 6);
  } else if (intake.emphasis === "company") {
    add("bold-modern-slab", 12);
    add("auto-dealer-stripe", 10);
    add("leonix-grind-bar", 8);
  } else {
    add("contractor-bold-phone", 12);
    add("dental-clinical-clean", 8);
    add("clean-white-premium", 6);
  }

  if (intake.backStyle === "map-style" || intake.backStyle === "address") {
    for (const id of BUSINESS_CARD_TEMPLATE_IDS) {
      if (BUSINESS_CARD_TEMPLATE_LIBRARY[id].mapBlockOnBack) add(id, 14);
    }
  } else if (intake.backStyle === "clean") {
    add("clean-white-premium", 5);
    add("minimal-black-onyx", 5);
    add("monochrome-power", 4);
  } else if (intake.backStyle === "services") {
    add("luxe-editorial", 6);
    add("gold-accent-executive", 5);
  }

  const { dark, light, gold } = colorHints(`${lower} ${intake.preferredStyle}`);
  if (dark) {
    add("minimal-black-onyx", 12);
    add("leonix-crest-mark", 10);
    add("lawyer-column-trust", 6);
  }
  if (light && !dark) {
    add("clean-white-premium", 8);
    add("gold-accent-executive", 7);
    add("monochrome-power", 5);
  }
  if (gold) {
    add("gold-accent-executive", 10);
    add("leonix-gold-diagonal", 10);
    add("leonix-crest-mark", 8);
  }

  return [...BUSINESS_CARD_TEMPLATE_IDS].sort((a, b) => {
    const d = (scores.get(b) ?? 0) - (scores.get(a) ?? 0);
    if (d !== 0) return d;
    return (TIE_ORDER.get(a) ?? 0) - (TIE_ORDER.get(b) ?? 0);
  });
}

export function pickLeoTemplateId(intake: Pick<BusinessCardLeoIntake, "profession" | "businessName" | "slogan" | "preferredColors" | "preferredStyle" | "emphasis" | "backStyle">): BusinessCardTemplateId {
  return scoreLeoTemplateCandidates(intake)[0];
}
