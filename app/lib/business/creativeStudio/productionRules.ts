/**
 * Program 6, Gate 6D — Typography, QR, and content density production rules.
 * Deterministic. The system warns CONTENT_OVER_CAPACITY rather than auto-shrinking.
 */
import type { PrintFormatKey } from "./printSpecs";

// ─── Typography ───────────────────────────────────────────────────────────

export interface TypographyRange {
  readonly role: string;
  readonly minPt: number;
  readonly maxPt: number;
}

export const TYPOGRAPHY_RANGES: readonly TypographyRange[] = [
  { role: "headline", minPt: 22, maxPt: 40 },
  { role: "secondary", minPt: 14, maxPt: 22 },
  { role: "body", minPt: 9.5, maxPt: 11 },
  { role: "contact", minPt: 10, maxPt: 12 },
  { role: "disclaimer", minPt: 7.5, maxPt: 8 },
  { role: "qr_cta", minPt: 9, maxPt: 11 },
];

export function getTypographyRange(role: string): TypographyRange | null {
  return TYPOGRAPHY_RANGES.find((r) => r.role === role) ?? null;
}

export function isFontSizeWithinRange(role: string, pt: number): boolean {
  const range = getTypographyRange(role);
  if (!range) return false;
  return pt >= range.minPt && pt <= range.maxPt;
}

// ─── QR ───────────────────────────────────────────────────────────────────

export const QR_MIN_SIZE_INCHES = 0.75;
export const QR_PREFERRED_MIN_INCHES = 0.90;
export const QR_PREFERRED_MAX_INCHES = 1.00;

export interface QrValidationResult {
  readonly status: "PASS" | "WARNING" | "FAIL";
  readonly message: string;
}

export function validateQrSize(sizeInches: number): QrValidationResult {
  if (sizeInches < QR_MIN_SIZE_INCHES) {
    return {
      status: "FAIL",
      message: `QR size ${sizeInches}" is below absolute minimum ${QR_MIN_SIZE_INCHES}".`,
    };
  }
  if (sizeInches < QR_PREFERRED_MIN_INCHES) {
    return {
      status: "WARNING",
      message: `QR size ${sizeInches}" is above minimum but below preferred ${QR_PREFERRED_MIN_INCHES}".`,
    };
  }
  return { status: "PASS", message: `QR size ${sizeInches}" is within preferred range.` };
}

export const QR_RULES: readonly string[] = [
  "Quiet zone required.",
  "No distortion.",
  "High contrast.",
  "Do not place directly over photography.",
  "Written CTA required.",
  "Final live HTTPS URL required for print approval.",
  "Printed proof testing required.",
  "iPhone/Android proof status recorded.",
  "Prefer Leonix-controlled redirect URL when architecture supports it.",
];

// ─── Content Density ──────────────────────────────────────────────────────

export interface ContentDensityRule {
  readonly format: PrintFormatKey;
  readonly maxPrimaryMessages: number;
  readonly maxBenefits: number;
  readonly maxCtas: number;
  readonly requiresQr: boolean;
  readonly allowsBilingual: boolean;
  readonly description: string;
}

export const CONTENT_DENSITY_RULES: Record<PrintFormatKey, ContentDensityRule> = {
  QUARTER: {
    format: "QUARTER",
    maxPrimaryMessages: 1,
    maxBenefits: 3,
    maxCtas: 1,
    requiresQr: true,
    allowsBilingual: false,
    description: "One primary message, one primary visual, max 3 concise benefits, one CTA, QR, essential contact only.",
  },
  HALF_HORIZONTAL: {
    format: "HALF_HORIZONTAL",
    maxPrimaryMessages: 1,
    maxBenefits: 5,
    maxCtas: 1,
    requiresQr: true,
    allowsBilingual: true,
    description: "Headline, one visual story, 3-5 benefits, one credibility element, contact, QR.",
  },
  HALF_VERTICAL: {
    format: "HALF_VERTICAL",
    maxPrimaryMessages: 1,
    maxBenefits: 5,
    maxCtas: 1,
    requiresQr: true,
    allowsBilingual: true,
    description: "Headline, one visual story, 3-5 benefits, one credibility element, contact, QR.",
  },
  FULL_PAGE: {
    format: "FULL_PAGE",
    maxPrimaryMessages: 2,
    maxBenefits: 8,
    maxCtas: 2,
    requiresQr: true,
    allowsBilingual: true,
    description: "Campaign-level concept, premium visual, offer/purpose, hierarchy, credibility, organized contact paths, QR.",
  },
  FULL_BLEED: {
    format: "FULL_BLEED",
    maxPrimaryMessages: 2,
    maxBenefits: 8,
    maxCtas: 2,
    requiresQr: true,
    allowsBilingual: true,
    description: "Campaign-level concept, premium visual, offer/purpose, hierarchy, credibility, organized contact paths, QR.",
  },
  SPREAD_TRIM: {
    format: "SPREAD_TRIM",
    maxPrimaryMessages: 3,
    maxBenefits: 12,
    maxCtas: 3,
    requiresQr: true,
    allowsBilingual: true,
    description: "Premium/major campaign only.",
  },
  SPREAD_BLEED: {
    format: "SPREAD_BLEED",
    maxPrimaryMessages: 3,
    maxBenefits: 12,
    maxCtas: 3,
    requiresQr: true,
    allowsBilingual: true,
    description: "Premium/major campaign only.",
  },
};

export interface ContentCapacityResult {
  readonly status: "OK" | "CONTENT_OVER_CAPACITY";
  readonly violations: readonly string[];
}

export function checkContentCapacity(
  format: PrintFormatKey,
  primaryMessages: number,
  benefits: number,
  ctas: number,
): ContentCapacityResult {
  const rule = CONTENT_DENSITY_RULES[format];
  const violations: string[] = [];

  if (primaryMessages > rule.maxPrimaryMessages) {
    violations.push(`Primary messages ${primaryMessages} exceeds max ${rule.maxPrimaryMessages} for ${format}.`);
  }
  if (benefits > rule.maxBenefits) {
    violations.push(`Benefits ${benefits} exceeds max ${rule.maxBenefits} for ${format}.`);
  }
  if (ctas > rule.maxCtas) {
    violations.push(`CTAs ${ctas} exceeds max ${rule.maxCtas} for ${format}.`);
  }

  return {
    status: violations.length > 0 ? "CONTENT_OVER_CAPACITY" : "OK",
    violations,
  };
}
