import {
  BUSINESS_CARD_TEMPLATE_IDS,
  BUSINESS_CARD_TEMPLATE_LIBRARY,
  type BusinessCardTemplateId,
} from "./businessCardTemplateCatalog";
import type { BusinessCardLeoIntake, LeoPreferredStyle } from "./businessCardLeoTypes";
import type { BusinessCardDocument, BusinessCardProductSlug } from "./types";

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

function countFilledFields(intake: Pick<BusinessCardLeoIntake, "profession" | "businessName" | "personName" | "title" | "phone" | "email" | "website" | "address" | "slogan">): number {
  return [
    intake.profession,
    intake.businessName,
    intake.personName,
    intake.title,
    intake.phone,
    intake.email,
    intake.website,
    intake.address,
    intake.slogan,
  ].filter((s) => String(s ?? "").trim().length > 0).length;
}

/** Few fields beyond core contact — typography-led layouts work best. */
function isSparseContactHeavy(intake: Pick<BusinessCardLeoIntake, "title" | "website" | "address" | "slogan" | "phone" | "email" | "personName" | "businessName">): boolean {
  const has = (s: string) => String(s ?? "").trim().length > 0;
  const extras = [intake.title, intake.website, intake.address, intake.slogan].filter(has).length;
  return extras === 0 && has(intake.phone) && has(intake.email) && has(intake.personName) && has(intake.businessName);
}

/** Stronger type scale on first draft when the user gave little copy. */
export function leoShouldBoostTypography(intake: BusinessCardLeoIntake): boolean {
  const filled = countFilledFields(intake);
  return filled <= 5 || isSparseContactHeavy(intake);
}

const STYLE_WEIGHTS: Record<LeoPreferredStyle, Partial<Record<BusinessCardTemplateId, number>>> = {
  luxury: {
    "gold-accent-executive": 16,
    "luxe-editorial": 15,
    "leonix-gold-diagonal": 13,
    "leonix-crest-mark": 10,
    "lawyer-column-trust": 9,
    "minimal-black-onyx": 8,
    "clean-white-premium": 7,
  },
  modern: {
    "bold-modern-slab": 15,
    "clean-white-premium": 13,
    "monochrome-power": 11,
    "minimal-black-onyx": 9,
    "leonix-gold-diagonal": 8,
    "leonix-grind-bar": 8,
  },
  bold: {
    "bold-modern-slab": 14,
    "auto-dealer-stripe": 13,
    "contractor-bold-phone": 13,
    "leonix-grind-bar": 11,
    "minimal-black-onyx": 7,
  },
  minimal: {
    "minimal-black-onyx": 15,
    "monochrome-power": 13,
    "clean-white-premium": 12,
    "bold-modern-slab": 3,
  },
  elegant: {
    "luxe-editorial": 14,
    "lawyer-column-trust": 13,
    "gold-accent-executive": 12,
    "monochrome-power": 9,
    "clean-white-premium": 8,
  },
};

const INDUSTRY_RULES: Array<{ re: RegExp; template: BusinessCardTemplateId; weight: number }> = [
  { re: /real\s*estate|realtor|inmobiliaria|bienes ra[ií]ces|propiedad/i, template: "real-estate-horizon", weight: 30 },
  { re: /auto|car dealer|dealership|automotriz|concesionaria|veh[ií]culo/i, template: "auto-dealer-stripe", weight: 30 },
  { re: /dental|dentist|odont|cl[ií]nica dental/i, template: "dental-clinical-clean", weight: 30 },
  { re: /law|legal|attorney|abogad|bufete|notar/i, template: "lawyer-column-trust", weight: 28 },
  { re: /restaurant|chef|kitchen|cocina|caf[eé]|bar |food service|catering/i, template: "restaurant-warm-plate", weight: 27 },
  { re: /contractor|plumb|hvac|roof|electric|construc|remodel|handyman|jardiner/i, template: "contractor-bold-phone", weight: 27 },
  { re: /salon|spa|beauty|est[eé]tica|barber|cosmet/i, template: "luxe-editorial", weight: 12 },
  { re: /tech|software|saas|digital|desarrollo/i, template: "minimal-black-onyx", weight: 10 },
];

/**
 * Deterministic template ranking for LEO — higher score wins; ties follow catalog order.
 */
export function scoreLeoTemplateCandidates(
  intake: Pick<
    BusinessCardLeoIntake,
    | "profession"
    | "businessName"
    | "personName"
    | "title"
    | "phone"
    | "email"
    | "website"
    | "address"
    | "slogan"
    | "preferredColors"
    | "preferredStyle"
    | "emphasis"
    | "backStyle"
  >,
  logoDataUrl: string | null,
  productSlug: BusinessCardProductSlug
): BusinessCardTemplateId[] {
  const haystack = `${intake.profession} ${intake.businessName} ${intake.slogan} ${intake.preferredColors}`.trim();
  const lower = haystack.toLowerCase();
  const scores = new Map<BusinessCardTemplateId, number>();
  for (const id of BUSINESS_CARD_TEMPLATE_IDS) scores.set(id, 0);

  const add = (id: BusinessCardTemplateId, pts: number) => scores.set(id, (scores.get(id) ?? 0) + pts);

  const hasLogo = !!logoDataUrl?.trim();

  /* Universal premium baseline — unknown industries still land on strong layouts */
  add("clean-white-premium", 8);
  add("gold-accent-executive", 6);
  add("luxe-editorial", 5);

  for (const rule of INDUSTRY_RULES) {
    if (rule.re.test(lower)) add(rule.template, rule.weight);
  }

  if (suggestsBilingual(lower)) {
    add("bilingual-two-column", 24);
    add("bilingual-dual-line", 19);
  }

  const sw = STYLE_WEIGHTS[intake.preferredStyle];
  for (const id of BUSINESS_CARD_TEMPLATE_IDS) {
    const w = sw[id];
    if (w) add(id, w);
  }

  if (intake.emphasis === "logo") {
    if (hasLogo) {
      add("leonix-crest-mark", 18);
      add("auto-dealer-stripe", 10);
      add("bold-modern-slab", 9);
    } else {
      /* Logo-forward templates need a mark — steer to layouts that read well text-only */
      add("bold-modern-slab", 12);
      add("clean-white-premium", 10);
      add("gold-accent-executive", 9);
    }
  } else if (intake.emphasis === "company") {
    add("bold-modern-slab", 13);
    add("auto-dealer-stripe", 11);
    add("leonix-grind-bar", 9);
    add("leonix-gold-diagonal", 7);
  } else {
    add("contractor-bold-phone", 13);
    add("dental-clinical-clean", 9);
    add("clean-white-premium", 8);
    add("real-estate-horizon", 6);
  }

  if (!hasLogo) {
    add("leonix-crest-mark", -22);
    add("clean-white-premium", 10);
    add("gold-accent-executive", 8);
    add("lawyer-column-trust", 6);
    add("luxe-editorial", 5);
  }

  if (intake.backStyle === "map-style" || intake.backStyle === "address") {
    for (const id of BUSINESS_CARD_TEMPLATE_IDS) {
      if (BUSINESS_CARD_TEMPLATE_LIBRARY[id].mapBlockOnBack) add(id, 16);
    }
  } else if (intake.backStyle === "clean") {
    add("clean-white-premium", 6);
    add("minimal-black-onyx", 6);
    add("monochrome-power", 5);
  } else if (intake.backStyle === "services") {
    add("luxe-editorial", 8);
    add("gold-accent-executive", 6);
    add("restaurant-warm-plate", 5);
  }

  const filled = countFilledFields(intake);
  if (filled <= 4) {
    add("clean-white-premium", 8);
    add("monochrome-power", 6);
    add("minimal-black-onyx", 5);
  }

  if (productSlug === "standard-business-cards") {
    add("bold-modern-slab", 7);
    add("auto-dealer-stripe", 6);
    add("leonix-grind-bar", 6);
    add("contractor-bold-phone", 5);
    add("clean-white-premium", 5);
  } else {
    add("luxe-editorial", 6);
    add("bilingual-two-column", 5);
    add("bilingual-dual-line", 4);
    add("real-estate-horizon", 4);
  }

  const { dark, light, gold } = colorHints(`${lower} ${intake.preferredStyle}`);
  if (dark) {
    add("minimal-black-onyx", 13);
    add("leonix-crest-mark", 8);
    add("lawyer-column-trust", 7);
  }
  if (light && !dark) {
    add("clean-white-premium", 9);
    add("gold-accent-executive", 8);
    add("monochrome-power", 6);
  }
  if (gold) {
    add("gold-accent-executive", 11);
    add("leonix-gold-diagonal", 11);
    add("leonix-crest-mark", hasLogo ? 8 : 0);
  }

  return [...BUSINESS_CARD_TEMPLATE_IDS].sort((a, b) => {
    const d = (scores.get(b) ?? 0) - (scores.get(a) ?? 0);
    if (d !== 0) return d;
    return (TIE_ORDER.get(a) ?? 0) - (TIE_ORDER.get(b) ?? 0);
  });
}

export function pickLeoTemplateId(intake: BusinessCardLeoIntake, productSlug: BusinessCardProductSlug): BusinessCardTemplateId {
  return scoreLeoTemplateCandidates(intake, intake.logoDataUrl, productSlug)[0];
}

/** Rebuild intake from saved LEO snapshot + current document fields (for deterministic “try another look”). */
export function buildLeoIntakeFromDocumentForScoring(doc: BusinessCardDocument): BusinessCardLeoIntake | null {
  const snap = doc.leoSnapshot;
  if (!snap || doc.designIntake !== "leo") return null;
  return {
    profession: snap.profession,
    businessName: doc.front.fields.company,
    personName: doc.front.fields.personName,
    title: doc.front.fields.title,
    phone: doc.front.fields.phone,
    email: doc.front.fields.email,
    website: doc.front.fields.website,
    address: doc.front.fields.address || doc.back.fields.address,
    slogan: doc.front.fields.tagline,
    preferredStyle: snap.preferredStyle,
    preferredColors: snap.preferredColorsNote,
    emphasis: snap.emphasis,
    backStyle: snap.backStyle,
    logoDataUrl: doc.front.logo.previewUrl,
    logoNaturalWidth: doc.front.logo.naturalWidth,
    logoNaturalHeight: doc.front.logo.naturalHeight,
  };
}

/**
 * Next template in LEO’s ranked list (cycles deterministically, skips current).
 */
export function getLeoAlternateTemplateId(doc: BusinessCardDocument): BusinessCardTemplateId | null {
  const intake = buildLeoIntakeFromDocumentForScoring(doc);
  if (!intake) return null;
  const ranked = scoreLeoTemplateCandidates(intake, intake.logoDataUrl, doc.productSlug);
  if (ranked.length < 2) return null;
  const cur = doc.selectedTemplateId;
  const idx = cur ? ranked.indexOf(cur) : -1;
  if (idx < 0) {
    return ranked.find((id) => id !== cur) ?? null;
  }
  for (let step = 1; step < ranked.length; step++) {
    const j = (idx + step) % ranked.length;
    if (ranked[j] !== cur) return ranked[j];
  }
  return null;
}
