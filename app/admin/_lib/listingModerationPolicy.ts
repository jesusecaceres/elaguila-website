import "server-only";

import type { ListingModerationContentPayload } from "./listingModerationReviewTypes";

/** Leonix Safety & Trust policy brain version. */
export const LEONIX_MODERATION_POLICY_VERSION = "2.0.0";
export const LEONIX_MODERATION_PROMPT_VERSION = "2.0.0";

export type ModerationRiskLevel = "low" | "medium" | "high" | "critical";

export type ModerationRecommendedAction =
  | "approve"
  | "review_manually"
  | "contact_seller"
  | "request_more_info"
  | "edit_listing"
  | "archive"
  | "remove_listing";

export type PolicyScannerResult = {
  riskLevel: ModerationRiskLevel;
  policyFlags: string[];
  keywordFlags: string[];
  categoryRules: string[];
  recommendedAction: ModerationRecommendedAction;
  scannerSummary: string;
};

type KeywordRule = {
  id: string;
  policyFlag: string;
  patterns: RegExp[];
  weight: 1 | 2 | 3;
};

const GLOBAL_KEYWORD_RULES: KeywordRule[] = [
  {
    id: "adult_or_sexual",
    policyFlag: "adult_or_sexual",
    patterns: [
      /\b(escort|masaje\s*er[oó]tico|servicios?\s*sexual|onlyfans|contenido\s*adulto|xxx|porn)\b/i,
      /\b(adult\s*services?|sexual\s*services?|erotic\s*massage)\b/i,
    ],
    weight: 3,
  },
  {
    id: "weapons",
    policyFlag: "weapons",
    patterns: [/\b(arma[s]?|pistola|rifle|escopeta|munici[oó]n|firearm|gun|ammo)\b/i],
    weight: 3,
  },
  {
    id: "drugs",
    policyFlag: "drugs_or_controlled_substances",
    patterns: [
      /\b(marihuana|mota|coca[ií]na|fentanilo|droga[s]?|narc[oó]tico|weed|drugs?|pills?\s*for\s*sale)\b/i,
    ],
    weight: 3,
  },
  {
    id: "counterfeit_stolen",
    policyFlag: "counterfeit_or_stolen",
    patterns: [
      /\b(replica\s*1:1|counterfeit|fake\s*brand|stolen\s*goods?|hot\s*merchandise|robado[s]?)\b/i,
      /\b(mercanc[ií]a\s*robada|producto\s*falso|copia\s*ilegal)\b/i,
    ],
    weight: 3,
  },
  {
    id: "fraud_payment",
    policyFlag: "fraud_or_payment_scam",
    patterns: [
      /\b(wire\s*transfer|western\s*union|zelle\s*only|gift\s*card|crypto\s*only|bitcoin\s*only)\b/i,
      /\b(transferencia\s*anticipada|pago\s*por\s*adelantado|sin\s*ver|env[ií]o\s*internacional\s*r[aá]pido)\b/i,
      /\b(pay\s*before|send\s*code|verification\s*fee|processing\s*fee)\b/i,
    ],
    weight: 2,
  },
  {
    id: "off_platform",
    policyFlag: "off_platform_risk",
    patterns: [
      /\b(whatsapp\s*only|telegram\s*only|text\s*me\s*at|contact\s*outside|fuera\s*de\s*la\s*plataforma)\b/i,
      /\b(no\s*responder\s*en\s*la\s*app|contactar\s*por\s*whatsapp)\b/i,
    ],
    weight: 2,
  },
  {
    id: "hate_threats",
    policyFlag: "explicit_violence",
    patterns: [/\b(kill\s*you|matar|amenaza|threat|hate\s*speech)\b/i],
    weight: 3,
  },
  {
    id: "spam",
    policyFlag: "spam",
    patterns: [
      /\b(click\s*here|work\s*from\s*home\s*\$|make\s*\$\d+\/day|gana\s*\$\d+\s*diarios)\b/i,
      /\b(crypto\s*mining|mlm|network\s*marketing|piramide)\b/i,
    ],
    weight: 2,
  },
  {
    id: "unsafe_contact",
    policyFlag: "unsafe_contact",
    patterns: [/\b(cash\s*app\s*only|venmo\s*only|no\s*questions|urgent\s*sale)\b/i],
    weight: 1,
  },
];

function normalizeCategory(category: string | null): string {
  return (category ?? "").trim().toLowerCase().replace(/_/g, "-");
}

function buildSearchBlob(content: ListingModerationContentPayload): string {
  return [
    content.title,
    content.description,
    content.category,
    content.city,
    content.zip,
    content.contact_email,
    content.contact_phone,
    content.business_name,
    content.seller_type,
    content.owner_email,
    content.price != null ? String(content.price) : "",
    content.is_free ? "free" : "",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function matchKeywordRules(blob: string): { policyFlags: string[]; keywordFlags: string[]; score: number } {
  const policyFlags = new Set<string>();
  const keywordFlags: string[] = [];
  let score = 0;

  for (const rule of GLOBAL_KEYWORD_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(blob)) {
        policyFlags.add(rule.policyFlag);
        keywordFlags.push(rule.id);
        score += rule.weight;
        break;
      }
    }
  }

  return { policyFlags: [...policyFlags], keywordFlags, score };
}

function applyCategoryRules(
  category: string,
  blob: string,
  content: ListingModerationContentPayload,
): { rules: string[]; flags: string[]; score: number } {
  const rules: string[] = [];
  const flags: string[] = [];
  let score = 0;

  const add = (rule: string, flag?: string, weight = 1) => {
    rules.push(rule);
    if (flag) flags.push(flag);
    score += weight;
  };

  switch (category) {
    case "en-venta":
      if (/\b(replica|counterfeit|fake\s*brand|robado|stolen)\b/i.test(blob)) {
        add("en_venta:counterfeit_or_stolen_indicator", "counterfeit_or_stolen", 3);
      }
      if (content.price != null && content.price > 0 && content.price < 5) {
        add("en_venta:suspiciously_low_price", "suspicious_price", 2);
      }
      if (/\b(wire|zelle|gift\s*card|transferencia)\b/i.test(blob)) {
        add("en_venta:unsafe_payment_language", "fraud_or_payment_scam", 2);
      }
      if (!content.description?.trim() || content.description.trim().length < 20) {
        add("en_venta:thin_description", "low_quality_or_missing_info", 1);
      }
      break;

    case "autos":
      if (/\b(no\s*title|sin\s*t[ií]tulo|salvage\s*only|clean\s*title\s*guaranteed)\b/i.test(blob)) {
        add("autos:title_or_vin_red_flag", "misleading_claim", 2);
      }
      if (content.price != null && content.price > 0 && content.price < 500) {
        add("autos:suspiciously_low_price", "suspicious_price", 2);
      }
      if (/\b(financing\s*with\s*no\s*credit|0\s*down\s*guaranteed|easy\s*approval)\b/i.test(blob)) {
        add("autos:scam_financing_language", "fraud_or_payment_scam", 2);
      }
      if (/\b(dealer|concesionario)\b/i.test(blob) && !content.business_name?.trim()) {
        add("autos:dealer_claim_without_business_identity", "fake_business_claim", 1);
      }
      break;

    case "servicios":
      if (/\b(escort|masaje\s*er[oó]tico|adult)\b/i.test(blob)) {
        add("servicios:adult_service_language", "adult_or_sexual", 3);
      }
      if (/\b(licensed|certificado|insured)\b/i.test(blob) && !content.business_name?.trim()) {
        add("servicios:license_claim_without_identity", "fake_business_claim", 1);
      }
      if (/\b(pay\s*upfront|pago\s*anticipado|deposit\s*first)\b/i.test(blob)) {
        add("servicios:payment_before_service", "fraud_or_payment_scam", 2);
      }
      break;

    case "empleos":
      if (/\b(pay\s*to\s*apply|paga\s*para\s*aplicar|application\s*fee|training\s*fee)\b/i.test(blob)) {
        add("empleos:pay_to_apply", "fake_job", 3);
      }
      if (/\b(work\s*from\s*home\s*\$|gana\s*miles|mlm|network\s*marketing)\b/i.test(blob)) {
        add("empleos:mlm_or_get_rich_quick", "scam", 3);
      }
      if (/\b(remote\s*only|no\s*interview|wire\s*your\s*details)\b/i.test(blob)) {
        add("empleos:suspicious_remote_wording", "fake_job", 2);
      }
      break;

    case "rentas":
    case "bienes-raices":
      if (/\b(deposit\s*before\s*viewing|dep[oó]sito\s*antes|wire\s*deposit|zelle\s*deposit)\b/i.test(blob)) {
        add("rentas:deposit_scam_language", "rental_scam", 3);
      }
      if (/\b(below\s*market|demasiado\s*barato|urgent\s*move|must\s*pay\s*today)\b/i.test(blob)) {
        add("rentas:pressure_or_below_market", "rental_scam", 2);
      }
      if (!content.city?.trim() && !content.zip?.trim()) {
        add("rentas:missing_location", "low_quality_or_missing_info", 1);
      }
      break;

    case "restaurantes":
      if (!content.business_name?.trim() && !content.contact_phone?.trim()) {
        add("restaurantes:missing_business_identity", "fake_business_claim", 1);
      }
      if (/\b(#1\s*restaurant|best\s*in\s*town\s*guaranteed)\b/i.test(blob)) {
        add("restaurantes:misleading_claim", "misleading_claim", 1);
      }
      break;

    case "comunidad":
      if (/\b(fundraiser|go\s*fund|donate\s*now)\b/i.test(blob) && /\b(urgent|emergency)\b/i.test(blob)) {
        add("comunidad:fundraising_review", "policy_review", 1);
      }
      break;

    case "viajes":
      if (/\b(all\s*inclusive\s*\$\d+|viaje\s*gratis|free\s*trip)\b/i.test(blob)) {
        add("viajes:misleading_price", "misleading_claim", 2);
      }
      if (/\b(no\s*provider|sin\s*agencia|wire\s*only)\b/i.test(blob)) {
        add("viajes:payment_or_identity_risk", "fraud_or_payment_scam", 2);
      }
      break;

    default:
      break;
  }

  return { rules, flags, score };
}

function scoreToRiskLevel(score: number, hasCriticalFlag: boolean): ModerationRiskLevel {
  if (hasCriticalFlag || score >= 8) return "critical";
  if (score >= 5) return "high";
  if (score >= 2) return "medium";
  return "low";
}

function deriveRecommendedAction(
  riskLevel: ModerationRiskLevel,
  policyFlags: string[],
): ModerationRecommendedAction {
  if (riskLevel === "critical") {
    if (
      policyFlags.some((f) =>
        ["weapons", "drugs_or_controlled_substances", "adult_or_sexual", "explicit_violence"].includes(f),
      )
    ) {
      return "remove_listing";
    }
    return "review_manually";
  }
  if (riskLevel === "high") return "review_manually";
  if (riskLevel === "medium") return "request_more_info";
  return "approve";
}

/** Deterministic pre-AI policy scan — signal layer only, not final judgment. */
export function runListingModerationPolicyScan(content: ListingModerationContentPayload): PolicyScannerResult {
  const blob = buildSearchBlob(content);
  const category = normalizeCategory(content.category);
  const keyword = matchKeywordRules(blob);
  const categoryScan = applyCategoryRules(category, blob, content);

  const policyFlags = [...new Set([...keyword.policyFlags, ...categoryScan.flags])];
  const keywordFlags = keyword.keywordFlags;
  const categoryRules = categoryScan.rules;
  const totalScore = keyword.score + categoryScan.score;

  const hasCriticalFlag = policyFlags.some((f) =>
    ["adult_or_sexual", "weapons", "drugs_or_controlled_substances", "explicit_violence", "counterfeit_or_stolen"].includes(
      f,
    ),
  );

  const riskLevel = scoreToRiskLevel(totalScore, hasCriticalFlag);
  const recommendedAction = deriveRecommendedAction(riskLevel, policyFlags);

  const parts: string[] = [];
  if (policyFlags.length) parts.push(`Policy flags: ${policyFlags.join(", ")}`);
  if (keywordFlags.length) parts.push(`Keyword hits: ${keywordFlags.join(", ")}`);
  if (categoryRules.length) parts.push(`Category rules: ${categoryRules.join(", ")}`);
  if (!parts.length) parts.push("No deterministic policy signals detected.");

  return {
    riskLevel,
    policyFlags,
    keywordFlags,
    categoryRules,
    recommendedAction,
    scannerSummary: parts.join(" · "),
  };
}

export function getCategoryPolicyNotes(category: string | null): string {
  const cat = normalizeCategory(category);
  const notes: Record<string, string> = {
    "en-venta": "Watch for stolen/counterfeit goods, suspiciously low prices, unsafe payment language.",
    autos: "Watch for fake dealer claims, scam financing, missing title/VIN info, suspicious low prices.",
    servicios: "Watch for unlicensed contractor claims, adult services, payment-before-service scams.",
    empleos: "Watch for pay-to-apply, MLM/get-rich-quick, fake remote hiring scams.",
    rentas: "Watch for deposit-before-viewing scams, wire/Zelle pressure, fake addresses.",
    "bienes-raices": "Watch for deposit scams, below-market pressure, missing location.",
    restaurantes: "Watch for fake business identity, duplicate vendor content, misleading claims.",
    comunidad: "Watch for hate/threats, unsafe events, spam, misleading fundraising.",
    viajes: "Watch for fake travel packages, misleading prices, payment scams, no provider identity.",
  };
  return notes[cat] ?? "Apply general marketplace safety: scams, prohibited items, unsafe contact, spam.";
}

export const LEONIX_MODERATION_REASON_CATEGORIES = [
  "safe",
  "spam",
  "scam",
  "adult_or_sexual",
  "weapons",
  "drugs_or_controlled_substances",
  "counterfeit_or_stolen",
  "fraud_or_payment_scam",
  "fake_business_claim",
  "unsafe_service",
  "fake_job",
  "rental_scam",
  "prohibited_item",
  "suspicious_price",
  "duplicate_listing",
  "low_quality_or_missing_info",
  "unsafe_contact",
  "off_platform_risk",
  "misleading_claim",
  "policy_review",
  "other",
  "duplicate",
  "missing_info",
] as const;

export type LeonixModerationReasonCategory = (typeof LEONIX_MODERATION_REASON_CATEGORIES)[number];

export function normalizeLeonixReasonCategory(raw: unknown): LeonixModerationReasonCategory {
  const s = String(raw ?? "")
    .trim()
    .toLowerCase();
  const aliases: Record<string, LeonixModerationReasonCategory> = {
    duplicate: "duplicate_listing",
    missing_info: "low_quality_or_missing_info",
  };
  const mapped = aliases[s] ?? s;
  return (LEONIX_MODERATION_REASON_CATEGORIES as readonly string[]).includes(mapped)
    ? (mapped as LeonixModerationReasonCategory)
    : "other";
}

export const LEONIX_MODERATION_RECOMMENDED_ACTIONS = [
  "approve",
  "review_manually",
  "contact_seller",
  "request_more_info",
  "edit_listing",
  "archive",
  "remove_listing",
] as const;

export function normalizeRecommendedAction(raw: unknown): ModerationRecommendedAction {
  const s = String(raw ?? "").trim().toLowerCase();
  return (LEONIX_MODERATION_RECOMMENDED_ACTIONS as readonly string[]).includes(s)
    ? (s as ModerationRecommendedAction)
    : "review_manually";
}

export function normalizeRiskLevel(raw: unknown): ModerationRiskLevel {
  const s = String(raw ?? "").trim().toLowerCase();
  if (s === "low" || s === "medium" || s === "high" || s === "critical") return s;
  return "medium";
}

export function normalizeStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((x) => String(x).trim()).filter(Boolean);
}
