/**
 * Program 6, Gate 6E — Creative archetype types.
 * Each archetype defines supported formats, content slots, visual hierarchy, etc.
 */

import type { PrintFormatKey } from "../printSpecs";

export type CreativeArchetypeKey =
  | "AUTHORITY_TRADITIONAL_UPGRADED"
  | "PREMIUM_PHOTO_HERO"
  | "OFFER_PROMO_BLAST"
  | "MULTI_PANEL_SERVICE_GRID"
  | "RECRUITMENT_HIRING"
  | "EVENT_VENUE_SHOWCASE"
  | "SPONSORED_EDITORIAL"
  | "BUSINESS_PROFILE_STORY"
  | "PREMIUM_INSTITUTIONAL"
  | "LEGACY_DIRECTORY_BASIC";

export type CreativeLane = "LANE_A_TRADITIONAL_UPGRADED" | "LANE_B_PREMIUM_CREATIVE" | "LANE_C_SPONSORED_EDITORIAL";

export type ContentSlotKey =
  | "logo"
  | "headline"
  | "subheadline"
  | "hero_image"
  | "secondary_image"
  | "portrait"
  | "offer"
  | "benefits"
  | "services"
  | "trust"
  | "cta"
  | "qr"
  | "contact"
  | "address"
  | "disclaimer"
  | "sponsor"
  | "leonix_brand"
  | "page_number";

export interface ArchetypeDefinition {
  readonly key: CreativeArchetypeKey;
  readonly label: string;
  readonly lane: CreativeLane;
  readonly supportedFormats: readonly PrintFormatKey[];
  readonly primaryPurpose: string;
  readonly recommendedCategories: readonly string[];
  readonly requiredSlots: readonly ContentSlotKey[];
  readonly optionalSlots: readonly ContentSlotKey[];
  readonly disallowedElements: readonly string[];
  readonly visualHierarchy: string;
  readonly imageStrategy: string;
  readonly ctaStrategy: string;
  readonly copyDensityBudget: string;
  readonly sponsorBehavior: string | null;
  readonly languageBehavior: string;
  readonly complianceRiskTags: readonly string[];
}
