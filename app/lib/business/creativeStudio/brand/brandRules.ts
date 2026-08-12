/**
 * Program 6, Gate 6B — Deterministic Leonix brand rules.
 * Enforces official asset usage, prohibits distortion/invention.
 */
import type { BrandAssetDefinition, BrandAssetKind, BrandAssetUsage } from "./brandTypes";

export interface BrandRuleViolation {
  readonly code: string;
  readonly message: string;
}

export function validateBrandAssetUsage(
  asset: BrandAssetDefinition,
  usage: BrandAssetUsage,
): BrandRuleViolation[] {
  const violations: BrandRuleViolation[] = [];

  if (!asset.preferredUsage.includes(usage)) {
    violations.push({
      code: "BRAND_ASSET_USAGE_MISMATCH",
      message: `${asset.kind} is not preferred for ${usage}. Preferred: ${asset.preferredUsage.join(", ")}`,
    });
  }

  return violations;
}

export function validateBrandAssetExists(asset: BrandAssetDefinition): BrandRuleViolation[] {
  if (!asset.exists) {
    return [{
      code: "BRAND_ASSET_MISSING",
      message: `Official brand asset ${asset.kind} at path ${asset.path} does not exist. Do not substitute or AI-generate.`,
    }];
  }
  return [];
}

export const BRAND_DISTORTION_PROHIBITED = true;
export const BRAND_RECOLOR_PROHIBITED = true;
export const BRAND_AI_SUBSTITUTE_PROHIBITED = true;

export function brandRulesSummary(): readonly string[] {
  return [
    "Do not recreate official Leonix logos.",
    "Do not redraw or AI-generate substitutes.",
    "Do not recolor or distort proportions.",
    "Do not invent another lion or wordmark.",
    "Full crest: major branded pages, covers, premium Leonix moments.",
    "Wordmark: normal magazine headers, sponsored inserts, editorial footers, routine attribution.",
  ];
}
