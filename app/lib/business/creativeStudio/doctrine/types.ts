/**
 * Package A — Leonix Creative Doctrine v1 types.
 *
 * Replaces the flat `CREATIVE_DOCTRINE_RULES` string array (types.ts) as the source of AI
 * provider generation instructions. That flat array is preserved unchanged and remains the
 * doctrine text used by canvaPromptCompiler.ts for Canva production handoff — this module is
 * additive, not a replacement of existing behavior.
 *
 * A DoctrineRule is a single plain-language instruction, tagged with which creative contexts it
 * applies to so the compiler only injects relevant rules into a given provider prompt instead of
 * pasting one giant document into every request.
 */
import type { CreativeAssetType, CreativeLanguage, RiskClass } from "../types";
import type { CreativeLane } from "../archetypes/types";

/** Broad creative "family" used to select tone/energy rules. Not persisted — derived per job. */
export type CreativeFamily =
  | "SPORTS_FAN_ENERGY"
  | "EVENTS_LOCAL_DISCOVERY"
  | "FAMILY_YOUTH_COMMUNITY"
  | "FOOD_RECIPES"
  | "HEALTH_WELLNESS"
  | "RESOURCES_PUBLIC_INFORMATION"
  | "FINANCE_BUSINESS"
  | "CULTURE_HERITAGE"
  | "LEONIX_HOUSE_BUSINESS_CONCIERGE"
  | "BUSINESS_AD"
  | "SPONSORED_EDUCATIONAL_FEATURE";

export type DoctrineRuleCategory =
  | "PHILOSOPHY"
  | "HIERARCHY"
  | "TRUTH_LOCK"
  | "ASSET_PRIORITY"
  | "ANTI_AI"
  | "BUSINESS_AD"
  | "SPONSORED_FEATURE"
  | "PRINT_GEOMETRY"
  | "QR_BRAND"
  | "FAMILY_TONE";

export interface DoctrineRule {
  readonly id: string;
  readonly category: DoctrineRuleCategory;
  readonly text: string;
  /**
   * When set, the rule only applies to these asset types. Omitted/empty means "applies to every
   * asset type" (e.g. the Truth Lock rules, which are universal).
   */
  readonly appliesToAssetTypes?: readonly CreativeAssetType[];
  /** When set, the rule only applies to these risk classes. Omitted means "applies to all". */
  readonly appliesToRiskClasses?: readonly RiskClass[];
  /** When set, the rule only applies to these creative lanes. Omitted means "applies to all". */
  readonly appliesToLanes?: readonly CreativeLane[];
  /** When set, the rule only applies to these creative families. Omitted means "applies to all". */
  readonly appliesToFamilies?: readonly CreativeFamily[];
}

export interface DoctrineCompilerInput {
  readonly assetType: CreativeAssetType;
  readonly riskClass: RiskClass;
  readonly creativeLane: CreativeLane;
  readonly language: CreativeLanguage;
  readonly family?: CreativeFamily;
}

export interface CompiledDoctrine {
  readonly doctrineVersion: string;
  readonly rules: readonly DoctrineRule[];
  /** Flattened, provider-ready instruction text — one rule per line, grouped by category. */
  readonly instructionText: string;
}
