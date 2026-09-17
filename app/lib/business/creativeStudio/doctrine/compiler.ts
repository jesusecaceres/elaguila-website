/**
 * Package A — Contextual Leonix Creative Doctrine compiler.
 *
 * Selects only the doctrine rules relevant to a given job's asset type / risk class / creative
 * lane / family, instead of injecting the entire rule set into every provider prompt. A rule
 * applies when every `appliesTo*` filter it declares matches the input; a rule with no filter on
 * a given dimension is universal on that dimension (e.g. Truth Lock rules apply everywhere).
 */
import type { CreativeAssetType } from "../types";
import type { CompiledDoctrine, CreativeFamily, DoctrineCompilerInput, DoctrineRule } from "./types";
import { CURRENT_DOCTRINE_VERSION, getDoctrineRulesForVersion } from "./versions";

const ASSET_TYPE_TO_FAMILY: Partial<Record<CreativeAssetType, CreativeFamily>> = {
  sponsored_insert: "SPONSORED_EDUCATIONAL_FEATURE",
  magazine_ad: "BUSINESS_AD",
  business_description: "BUSINESS_AD",
  social_copy: "BUSINESS_AD",
  whatsapp_promo_copy: "BUSINESS_AD",
  flyer_copy: "BUSINESS_AD",
  coupon_copy: "BUSINESS_AD",
  campaign_plan_30_day: "BUSINESS_AD",
};

/**
 * Best-effort default family derived from asset type. Callers with more specific business/editorial
 * context (e.g. a restaurant business mapped to a FOOD_RECIPES sponsored feature) should pass an
 * explicit `family` on DoctrineCompilerInput instead of relying on this default.
 */
export function inferCreativeFamilyFromAssetType(assetType: CreativeAssetType): CreativeFamily | undefined {
  return ASSET_TYPE_TO_FAMILY[assetType];
}

function ruleApplies(rule: DoctrineRule, input: DoctrineCompilerInput): boolean {
  if (rule.appliesToAssetTypes && !rule.appliesToAssetTypes.includes(input.assetType)) return false;
  if (rule.appliesToRiskClasses && !rule.appliesToRiskClasses.includes(input.riskClass)) return false;
  if (rule.appliesToLanes && !rule.appliesToLanes.includes(input.creativeLane)) return false;
  if (rule.appliesToFamilies && (!input.family || !rule.appliesToFamilies.includes(input.family))) return false;
  return true;
}

const CATEGORY_ORDER = [
  "PHILOSOPHY", "HIERARCHY", "TRUTH_LOCK", "ASSET_PRIORITY", "ANTI_AI",
  "BUSINESS_AD", "SPONSORED_FEATURE", "PRINT_GEOMETRY", "QR_BRAND", "FAMILY_TONE",
] as const;

function renderInstructionText(rules: readonly DoctrineRule[], doctrineVersion: string): string {
  const lines: string[] = [`=== LEONIX CREATIVE DOCTRINE (${doctrineVersion}) ===`];
  for (const category of CATEGORY_ORDER) {
    const inCategory = rules.filter((r) => r.category === category);
    if (inCategory.length === 0) continue;
    lines.push("");
    lines.push(`-- ${category} --`);
    for (const rule of inCategory) {
      lines.push(`- ${rule.text}`);
    }
  }
  return lines.join("\n");
}

/**
 * Compile the doctrine subset relevant to one creative job. Falls back to `CURRENT_DOCTRINE_VERSION`
 * if the requested version is unknown (never throws — a missing/garbled version must not block
 * generation; the caller can inspect `doctrineVersion` on the result to see what was actually used).
 */
export function compileDoctrineForJob(
  input: DoctrineCompilerInput,
  requestedVersion: string = CURRENT_DOCTRINE_VERSION,
): CompiledDoctrine {
  const doctrineVersion = getDoctrineRulesForVersion(requestedVersion) ? requestedVersion : CURRENT_DOCTRINE_VERSION;
  const allRules = getDoctrineRulesForVersion(doctrineVersion) ?? [];
  const rules = allRules.filter((rule) => ruleApplies(rule, input));

  return {
    doctrineVersion,
    rules,
    instructionText: renderInstructionText(rules, doctrineVersion),
  };
}
