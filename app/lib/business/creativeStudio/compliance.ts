/**
 * Program 6, Gate 6N — Compliance / Claim Safety.
 * Risk classes and rules for high-risk content.
 */
import type { RiskClass } from "./types";

export interface ComplianceRule {
  readonly riskClass: RiskClass;
  readonly requiresSourceVerification: boolean;
  readonly requiresDisclaimer: boolean;
  readonly requiresProfessionalReview: boolean;
  readonly prohibitedClaims: readonly string[];
  readonly description: string;
}

export const COMPLIANCE_RULES: Record<RiskClass, ComplianceRule> = {
  NORMAL: {
    riskClass: "NORMAL",
    requiresSourceVerification: false,
    requiresDisclaimer: false,
    requiresProfessionalReview: false,
    prohibitedClaims: ["fake_testimonial", "fake_award", "invented_rating"],
    description: "Standard commercial content. No special compliance requirements.",
  },
  LEGAL: {
    riskClass: "LEGAL",
    requiresSourceVerification: true,
    requiresDisclaimer: true,
    requiresProfessionalReview: true,
    prohibitedClaims: ["guaranteed_outcome", "guaranteed_result", "legal_advice_from_leonix"],
    description: "Legal content requires current source verification, careful educational wording, no guarantees, disclaimer, and professional review.",
  },
  MEDICAL: {
    riskClass: "MEDICAL",
    requiresSourceVerification: true,
    requiresDisclaimer: true,
    requiresProfessionalReview: true,
    prohibitedClaims: ["medical_result", "treatment_guarantee", "health_advice_from_leonix"],
    description: "Medical content requires current source verification, no fabricated results, disclaimer, and professional review.",
  },
  FINANCIAL: {
    riskClass: "FINANCIAL",
    requiresSourceVerification: true,
    requiresDisclaimer: true,
    requiresProfessionalReview: true,
    prohibitedClaims: ["investment_guarantee", "return_promise", "financial_advice_from_leonix"],
    description: "Financial content requires source verification, no return promises, disclaimer, and professional review.",
  },
  INSURANCE: {
    riskClass: "INSURANCE",
    requiresSourceVerification: true,
    requiresDisclaimer: true,
    requiresProfessionalReview: true,
    prohibitedClaims: ["coverage_guarantee", "claim_approval_guarantee"],
    description: "Insurance content requires source verification, no coverage guarantees, disclaimer, and professional review.",
  },
  IMMIGRATION: {
    riskClass: "IMMIGRATION",
    requiresSourceVerification: true,
    requiresDisclaimer: true,
    requiresProfessionalReview: true,
    prohibitedClaims: ["approval_guarantee", "immigration_advice_from_leonix"],
    description: "Immigration content requires source verification, no approval guarantees, disclaimer, and professional review.",
  },
  TAX: {
    riskClass: "TAX",
    requiresSourceVerification: true,
    requiresDisclaimer: true,
    requiresProfessionalReview: true,
    prohibitedClaims: ["refund_guarantee", "tax_advice_from_leonix"],
    description: "Tax content requires source verification, no refund guarantees, disclaimer, and professional review.",
  },
  SAFETY: {
    riskClass: "SAFETY",
    requiresSourceVerification: true,
    requiresDisclaimer: true,
    requiresProfessionalReview: true,
    prohibitedClaims: ["safety_guarantee", "risk_elimination_claim"],
    description: "Safety content requires source verification, no risk elimination claims, disclaimer, and professional review.",
  },
  EMPLOYMENT: {
    riskClass: "EMPLOYMENT",
    requiresSourceVerification: true,
    requiresDisclaimer: false,
    requiresProfessionalReview: false,
    prohibitedClaims: ["discriminatory_language", "invented_salary", "fake_benefit"],
    description: "Employment content requires source verification, no discriminatory language, no invented salary/benefits.",
  },
  HOUSING: {
    riskClass: "HOUSING",
    requiresSourceVerification: true,
    requiresDisclaimer: true,
    requiresProfessionalReview: true,
    prohibitedClaims: ["housing_guarantee", "fair_housing_violation"],
    description: "Housing content requires source verification, fair housing compliance, disclaimer, and professional review.",
  },
};

export function getComplianceRule(riskClass: RiskClass): ComplianceRule {
  return COMPLIANCE_RULES[riskClass];
}

export function requiresDisclaimer(riskClass: RiskClass): boolean {
  return COMPLIANCE_RULES[riskClass].requiresDisclaimer;
}

export function requiresProfessionalReview(riskClass: RiskClass): boolean {
  return COMPLIANCE_RULES[riskClass].requiresProfessionalReview;
}

export function isClaimProhibited(riskClass: RiskClass, claim: string): boolean {
  const rule = COMPLIANCE_RULES[riskClass];
  return rule.prohibitedClaims.some((p) => claim.toLowerCase().includes(p.toLowerCase()));
}

export const SPONSOR_DISCLOSURE_TYPES: readonly { key: string; es: string; en: string }[] = [
  { key: "presented_with_support", es: "Presentado con el apoyo de", en: "Presented with support from" },
  { key: "educational_reviewed_by", es: "Contenido educativo revisado por", en: "Educational content reviewed by" },
  { key: "sponsored_content", es: "Contenido patrocinado", en: "Sponsored content" },
];

export function areSponsorDisclosuresDistinct(a: string, b: string): boolean {
  return a !== b;
}
