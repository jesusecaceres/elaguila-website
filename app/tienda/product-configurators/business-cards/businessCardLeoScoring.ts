import {
  BUSINESS_CARD_TEMPLATE_IDS,
  BUSINESS_CARD_TEMPLATE_LIBRARY,
  type BusinessCardTemplateId,
} from "./businessCardTemplateCatalog";
import type { BusinessCardLeoIntake, LeoEmphasis, LeoPreferredStyle } from "./businessCardLeoTypes";
import type { BusinessCardDocument, BusinessCardProductSlug } from "./types";

const TIE_ORDER = new Map(BUSINESS_CARD_TEMPLATE_IDS.map((id, i) => [id, i]));

/** Emphasis drives template ranking (deterministic). Secondary uses the same rule set at a lower weight. */
function addEmphasisTemplateScores(
  emphasis: LeoEmphasis,
  hasLogo: boolean,
  add: (id: BusinessCardTemplateId, pts: number) => void,
  weight: number
): void {
  const w = (pts: number) => Math.round(pts * weight);
  if (emphasis === "logo") {
    if (hasLogo) {
      add("leonix-crest-mark", w(18));
      add("leonix-orbit-halo", w(14));
      add("leonix-prism-facet", w(13));
      add("auto-dealer-stripe", w(10));
      add("bold-modern-slab", w(9));
    } else {
      add("bold-modern-slab", w(12));
      add("clean-white-premium", w(10));
      add("gold-accent-executive", w(9));
    }
  } else if (emphasis === "company") {
    add("bold-modern-slab", w(13));
    add("auto-dealer-stripe", w(11));
    add("leonix-grind-bar", w(9));
    add("leonix-gold-diagonal", w(7));
    add("noir-razor-stack", w(10));
    add("leonix-marque-band", w(7));
  } else {
    add("contractor-bold-phone", w(13));
    add("forge-steel-callout", w(11));
    add("dental-clinical-clean", w(9));
    add("clean-white-premium", w(8));
    add("real-estate-horizon", w(6));
  }
}

function suggestsBilingual(haystack: string): boolean {
  return (
    /\b(bilingual|bilingüe|bilingue)\b/i.test(haystack) ||
    /\b(es\/en|en\/es)\b/i.test(haystack) ||
    /\b(spanish|español|espanol)\b.*\b(english|inglés|ingles)\b/i.test(haystack) ||
    /\b(english|inglés|ingles)\b.*\b(spanish|español|espanol)\b/i.test(haystack)
  );
}

function colorHints(haystack: string): { dark: boolean; light: boolean; gold: boolean; warmAmber: boolean; coolSlate: boolean } {
  const t = haystack.toLowerCase();
  return {
    dark: /\b(black|negro|oscuro|dark|charcoal|midnight)\b/.test(t),
    light: /\b(white|blanco|light|cream|crema|ivory|marfil)\b/.test(t),
    gold: /\b(gold|dorado|oro|champagne)\b/.test(t),
    warmAmber: /\b(amber|copper|cobre|terracotta|oxide|burnt orange|naranja quemado)\b/.test(t),
    coolSlate: /\b(slate|steel|gris|haze|fog|niebla|sky|skyline)\b/.test(t),
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
    "ivory-executive-band": 14,
    "leonix-orbit-halo": 12,
    "realtor-elevated-gold": 10,
    "leonix-crest-mark": 10,
    "lawyer-column-trust": 9,
    "carbon-soft-elevated": 8,
    "minimal-black-onyx": 8,
    "clean-white-premium": 7,
    "velvet-midnight-gold": 12,
    "leonix-marque-band": 11,
    "leonix-prism-facet": 10,
  },
  modern: {
    "bold-modern-slab": 15,
    "clean-white-premium": 13,
    "azure-confidence-strip": 12,
    "saffron-edge-dynamic": 11,
    "leonix-ledger-stripe": 10,
    "monochrome-power": 11,
    "minimal-black-onyx": 9,
    "leonix-gold-diagonal": 8,
    "leonix-grind-bar": 8,
    "noir-razor-stack": 12,
    "estate-skyline-grid": 9,
    "ceramic-layered-air": 8,
  },
  bold: {
    "bold-modern-slab": 14,
    "auto-dealer-stripe": 13,
    "contractor-bold-phone": 13,
    "saffron-edge-dynamic": 12,
    "leonix-ledger-stripe": 9,
    "leonix-grind-bar": 11,
    "minimal-black-onyx": 7,
    "noir-razor-stack": 13,
    "forge-steel-callout": 11,
  },
  minimal: {
    "minimal-black-onyx": 15,
    "monochrome-power": 13,
    "azure-confidence-strip": 10,
    "ivory-executive-band": 9,
    "clean-white-premium": 12,
    "bold-modern-slab": 3,
    "sandstone-whisper": 12,
    "ceramic-layered-air": 10,
  },
  elegant: {
    "luxe-editorial": 14,
    "lawyer-column-trust": 13,
    "ivory-executive-band": 13,
    "gold-accent-executive": 12,
    "studio-rose-line": 10,
    "monochrome-power": 9,
    "clean-white-premium": 8,
    "sandstone-whisper": 11,
    "velvet-midnight-gold": 9,
  },
};

const INDUSTRY_RULES: Array<{ re: RegExp; template: BusinessCardTemplateId; weight: number }> = [
  { re: /real\s*estate|realtor|inmobiliaria|bienes ra[ií]ces|propiedad/i, template: "real-estate-horizon", weight: 30 },
  { re: /real\s*estate|realtor|inmobiliaria|bienes ra[ií]ces|propiedad/i, template: "realtor-elevated-gold", weight: 22 },
  { re: /real\s*estate|realtor|inmobiliaria|bienes ra[ií]ces|propiedad/i, template: "estate-skyline-grid", weight: 20 },
  { re: /auto|car dealer|dealership|automotriz|concesionaria|veh[ií]culo/i, template: "auto-dealer-stripe", weight: 30 },
  { re: /dental|dentist|odont|cl[ií]nica dental/i, template: "dental-clinical-clean", weight: 30 },
  { re: /dental|dentist|odont|wellness|medical clinic|cl[ií]nica m[eé]dica|cl[ií]nica dental/i, template: "wellness-sage-soft", weight: 22 },
  { re: /law|legal|attorney|abogad|bufete|notar/i, template: "lawyer-column-trust", weight: 28 },
  { re: /law|legal|attorney|abogad|bufete|notar/i, template: "bench-brief-easel", weight: 18 },
  { re: /restaurant|chef|kitchen|cocina|caf[eé]|bar |food service|catering/i, template: "restaurant-warm-plate", weight: 27 },
  { re: /restaurant|chef|kitchen|cocina|caf[eé]|bar |food service|catering/i, template: "cellar-script-plate", weight: 18 },
  { re: /contractor|plumb|hvac|roof|electric|construc|remodel|handyman|jardiner/i, template: "contractor-bold-phone", weight: 27 },
  { re: /contractor|plumb|hvac|roof|electric|construc|remodel|handyman|jardiner/i, template: "forge-steel-callout", weight: 20 },
  { re: /church|faith|ministry|parish|iglesia|pastor|comunidad/i, template: "sanctuary-burgundy-warm", weight: 26 },
  { re: /salon|spa|beauty|est[eé]tica|barber|cosmet/i, template: "studio-rose-line", weight: 22 },
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
    | "emphasisSecondary"
    | "backStyle"
  >,
  logoDataUrl: string | null,
  productSlug: BusinessCardProductSlug
): BusinessCardTemplateId[] {
  const haystack =
    `${intake.profession} ${intake.title} ${intake.businessName} ${intake.slogan} ${intake.preferredColors}`.trim();
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
    add("bilingual-ribbon-feature", 21);
    add("bilingual-dual-line", 19);
    add("bilingual-inline-stack", 18);
    add("bilingual-ledger-pair", 17);
    add("bilingual-bridge-field", 16);
  }

  const sw = STYLE_WEIGHTS[intake.preferredStyle];
  for (const id of BUSINESS_CARD_TEMPLATE_IDS) {
    const w = sw[id];
    if (w) add(id, w);
  }

  if (/\b(executive|ejecutiv|board|director|ceo|c-level)\b/i.test(lower)) {
    add("ivory-executive-band", 7);
    add("velvet-midnight-gold", 6);
    add("leonix-marque-band", 5);
    add("azure-confidence-strip", 5);
    add("realtor-elevated-gold", 4);
  }

  addEmphasisTemplateScores(intake.emphasis, hasLogo, add, 1);
  const sec = intake.emphasisSecondary;
  if (sec && sec !== intake.emphasis) {
    addEmphasisTemplateScores(sec, hasLogo, add, 0.45);
  }

  if (!hasLogo) {
    add("leonix-crest-mark", -22);
    add("leonix-prism-facet", -20);
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
    add("studio-rose-line", 7);
    add("ivory-executive-band", 6);
    add("gold-accent-executive", 6);
    add("restaurant-warm-plate", 5);
    add("cellar-script-plate", 6);
  }

  const filled = countFilledFields(intake);
  if (filled <= 4) {
    add("clean-white-premium", 8);
    add("ivory-executive-band", 7);
    add("azure-confidence-strip", 6);
    add("monochrome-power", 6);
    add("minimal-black-onyx", 5);
    add("sandstone-whisper", 5);
    add("ceramic-layered-air", 4);
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

  const { dark, light, gold, warmAmber, coolSlate } = colorHints(`${lower} ${intake.preferredStyle}`);
  if (dark) {
    add("minimal-black-onyx", 13);
    add("leonix-crest-mark", 8);
    add("lawyer-column-trust", 7);
    add("velvet-midnight-gold", 6);
  }
  if (light && !dark) {
    add("clean-white-premium", 9);
    add("gold-accent-executive", 8);
    add("monochrome-power", 6);
    add("ceramic-layered-air", 5);
  }
  if (gold) {
    add("gold-accent-executive", 11);
    add("leonix-gold-diagonal", 11);
    add("realtor-elevated-gold", 9);
    add("ivory-executive-band", 8);
    add("velvet-midnight-gold", 8);
    add("leonix-marque-band", 7);
    add("leonix-crest-mark", hasLogo ? 8 : 0);
  }
  if (warmAmber) {
    add("forge-steel-callout", 8);
    add("cellar-script-plate", 7);
    add("saffron-edge-dynamic", 6);
  }
  if (coolSlate) {
    add("estate-skyline-grid", 8);
    add("azure-confidence-strip", 6);
    add("bench-brief-easel", 5);
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
    emphasisSecondary: snap.emphasisSecondary ?? null,
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
