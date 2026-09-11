/**
 * Client Discovery & Project Blueprint Engine, Gate 6 — a single dispatch point mapping a
 * ProjectType to its catalog + packet builder + Markdown builder, so every API route shares one
 * source of truth instead of re-implementing the same switch statement.
 */
import type { ProjectType } from "./types";
import type { SpecializedDiscoveryContext, SpecializedRequirementDefinition } from "./specializedDiscoveryEngine";
import { LOGO_BRAND_CATALOG_VERSION, LOGO_BRAND_REQUIREMENTS, type LogoBrandSection } from "./logoBrandDiscoveryCatalog";
import { PRINT_COLLATERAL_CATALOG_VERSION, PRINT_COLLATERAL_REQUIREMENTS, type PrintCollateralSection } from "./printCollateralDiscoveryCatalog";
import { CAMPAIGN_CATALOG_VERSION, CAMPAIGN_REQUIREMENTS, type CampaignSection } from "./campaignDiscoveryCatalog";
import {
  buildLogoBrandBlueprintPacket,
  buildMediaCampaignBlueprintPacket,
  buildPrintCollateralBlueprintPacket,
  type SpecializedBlueprintCommonInput,
  type SpecializedProjectBlueprintPacket,
} from "./specializedBlueprintEngine";
import { buildSpecializedBlueprintMarkdown } from "./specializedBlueprintMarkdown";
import type { BlueprintStatus } from "./blueprintEngine";

export type SpecializedFamily = "logo_brand" | "print_collateral" | "media_campaign";

const FAMILY_BY_PROJECT_TYPE: Record<string, SpecializedFamily> = {
  logo_brand_identity: "logo_brand",
  business_cards: "print_collateral",
  flyer: "print_collateral",
  banner_signage: "print_collateral",
  referral_materials: "print_collateral",
  campaign_creative: "media_campaign",
  sponsored_editorial: "media_campaign",
  media_exposure_campaign: "media_campaign",
};

export function specializedFamilyForProjectType(projectType: ProjectType): SpecializedFamily | null {
  return FAMILY_BY_PROJECT_TYPE[projectType] ?? null;
}

export function catalogForProjectType(projectType: ProjectType): { catalog: readonly SpecializedRequirementDefinition<string>[]; catalogVersion: string } | null {
  const family = specializedFamilyForProjectType(projectType);
  if (family === "logo_brand") return { catalog: LOGO_BRAND_REQUIREMENTS as readonly SpecializedRequirementDefinition<LogoBrandSection>[], catalogVersion: LOGO_BRAND_CATALOG_VERSION };
  if (family === "print_collateral") return { catalog: PRINT_COLLATERAL_REQUIREMENTS as readonly SpecializedRequirementDefinition<PrintCollateralSection>[], catalogVersion: PRINT_COLLATERAL_CATALOG_VERSION };
  if (family === "media_campaign") return { catalog: CAMPAIGN_REQUIREMENTS as readonly SpecializedRequirementDefinition<CampaignSection>[], catalogVersion: CAMPAIGN_CATALOG_VERSION };
  return null;
}

export function buildSpecializedPacketForProjectType(
  projectType: ProjectType,
  input: Omit<SpecializedBlueprintCommonInput<string>, "catalog" | "catalogVersion">,
): SpecializedProjectBlueprintPacket | null {
  const family = specializedFamilyForProjectType(projectType);
  if (family === "logo_brand") {
    return buildLogoBrandBlueprintPacket({ ...input, catalog: LOGO_BRAND_REQUIREMENTS, catalogVersion: LOGO_BRAND_CATALOG_VERSION });
  }
  if (family === "print_collateral") {
    return buildPrintCollateralBlueprintPacket({
      ...input,
      catalog: PRINT_COLLATERAL_REQUIREMENTS,
      catalogVersion: PRINT_COLLATERAL_CATALOG_VERSION,
      projectType: projectType as "business_cards" | "flyer" | "banner_signage" | "referral_materials",
    });
  }
  if (family === "media_campaign") {
    return buildMediaCampaignBlueprintPacket({
      ...input,
      catalog: CAMPAIGN_REQUIREMENTS,
      catalogVersion: CAMPAIGN_CATALOG_VERSION,
      projectType: projectType as "campaign_creative" | "sponsored_editorial" | "media_exposure_campaign",
    });
  }
  return null;
}

export function buildSpecializedMarkdownForPacket(packet: SpecializedProjectBlueprintPacket, meta: { version: number; status: BlueprintStatus }): string {
  return buildSpecializedBlueprintMarkdown(packet, meta);
}

export type { SpecializedDiscoveryContext };
