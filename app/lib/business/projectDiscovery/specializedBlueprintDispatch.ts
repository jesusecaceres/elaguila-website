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
import { DIGITAL_PRESENCE_CATALOG_VERSION, DIGITAL_PRESENCE_REQUIREMENTS, type DigitalPresenceSection } from "./digitalPresenceDiscoveryCatalog";
import { OTHER_PROJECT_CATALOG_VERSION, OTHER_PROJECT_REQUIREMENTS, type OtherProjectSection } from "./otherProjectDiscoveryCatalog";
import { CUSTOM_PLATFORM_CATALOG_VERSION, CUSTOM_PLATFORM_REQUIREMENTS, type CustomPlatformSection } from "./customPlatformDiscoveryCatalog";
import { LAUNCH_PACKAGE_CATALOG_VERSION, LAUNCH_PACKAGE_REQUIREMENTS, type LaunchPackageSection } from "./launchPackageDiscoveryCatalog";
import {
  buildCustomPlatformBlueprintPacket,
  buildDigitalPresenceBlueprintPacket,
  buildLaunchPackageBlueprintPacket,
  buildLogoBrandBlueprintPacket,
  buildMediaCampaignBlueprintPacket,
  buildOtherProjectBlueprintPacket,
  buildPrintCollateralBlueprintPacket,
  type SpecializedBlueprintCommonInput,
  type SpecializedProjectBlueprintPacket,
} from "./specializedBlueprintEngine";
import { buildSpecializedBlueprintMarkdown } from "./specializedBlueprintMarkdown";
import type { BlueprintStatus } from "./blueprintEngine";

export type SpecializedFamily = "logo_brand" | "print_collateral" | "media_campaign" | "digital_presence" | "other_project" | "custom_platform" | "launch_package";

const FAMILY_BY_PROJECT_TYPE: Record<string, SpecializedFamily> = {
  logo_brand_identity: "logo_brand",
  business_cards: "print_collateral",
  flyer: "print_collateral",
  banner_signage: "print_collateral",
  referral_materials: "print_collateral",
  // Gate 10.2 — promotional_products previously fell through to the generic Website catalog
  // (specializedFamilyForProjectType returned null for it) despite being a registered project
  // type; it genuinely belongs to the same print-collateral engine as the other physical pieces.
  promotional_products: "print_collateral",
  campaign_creative: "media_campaign",
  sponsored_editorial: "media_campaign",
  media_exposure_campaign: "media_campaign",
  // Gate 10.2 — both were registry-only stubs with no real discovery/execution (Gate 10.1 GAP17
  // finding): specializedFamilyForProjectType returned null for both, so every such intent silently
  // fell through to the generic Website discovery/blueprint path.
  social_setup_cleanup: "digital_presence",
  google_business_profile_support: "digital_presence",
  // Gate 10.2 — "other" was NEVER given a dedicated discovery/blueprint family at all; it silently
  // routed through the generic Website catalog (Gate 10.1 GAP17 finding), even though "other" is
  // explicitly a non-Website catch-all (MD Gate 10.2 <phase_12>: "Do not route it through Website
  // questions unless it actually becomes a Website-family project").
  other: "other_project",
  // Gate 10.2 — custom_platform_software silently used the generic Website catalog before (Gate
  // 10.1 GAP17 finding). The real, already-proven-live Custom Platform mechanism under project type
  // "website" (architecture escalation) is untouched; this is the SEPARATE standalone entry point.
  custom_platform_software: "custom_platform",
  // Gate 10.2 — launch_package_multi_project also silently used the generic Website catalog before.
  // This family is deliberately an ORCHESTRATION record only (launchPackageRollup.ts computes the
  // live roll-up from sibling intents' own real state) — see specializedBlueprintEngine.ts's
  // LaunchPackageBlueprintPacket doc comment.
  launch_package_multi_project: "launch_package",
};

export function specializedFamilyForProjectType(projectType: ProjectType): SpecializedFamily | null {
  return FAMILY_BY_PROJECT_TYPE[projectType] ?? null;
}

export function catalogForProjectType(projectType: ProjectType): { catalog: readonly SpecializedRequirementDefinition<string>[]; catalogVersion: string } | null {
  const family = specializedFamilyForProjectType(projectType);
  if (family === "logo_brand") return { catalog: LOGO_BRAND_REQUIREMENTS as readonly SpecializedRequirementDefinition<LogoBrandSection>[], catalogVersion: LOGO_BRAND_CATALOG_VERSION };
  if (family === "print_collateral") return { catalog: PRINT_COLLATERAL_REQUIREMENTS as readonly SpecializedRequirementDefinition<PrintCollateralSection>[], catalogVersion: PRINT_COLLATERAL_CATALOG_VERSION };
  if (family === "media_campaign") return { catalog: CAMPAIGN_REQUIREMENTS as readonly SpecializedRequirementDefinition<CampaignSection>[], catalogVersion: CAMPAIGN_CATALOG_VERSION };
  if (family === "digital_presence") return { catalog: DIGITAL_PRESENCE_REQUIREMENTS as readonly SpecializedRequirementDefinition<DigitalPresenceSection>[], catalogVersion: DIGITAL_PRESENCE_CATALOG_VERSION };
  if (family === "other_project") return { catalog: OTHER_PROJECT_REQUIREMENTS as readonly SpecializedRequirementDefinition<OtherProjectSection>[], catalogVersion: OTHER_PROJECT_CATALOG_VERSION };
  if (family === "custom_platform") return { catalog: CUSTOM_PLATFORM_REQUIREMENTS as readonly SpecializedRequirementDefinition<CustomPlatformSection>[], catalogVersion: CUSTOM_PLATFORM_CATALOG_VERSION };
  if (family === "launch_package") return { catalog: LAUNCH_PACKAGE_REQUIREMENTS as readonly SpecializedRequirementDefinition<LaunchPackageSection>[], catalogVersion: LAUNCH_PACKAGE_CATALOG_VERSION };
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
      projectType: projectType as "business_cards" | "flyer" | "banner_signage" | "referral_materials" | "promotional_products",
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
  if (family === "digital_presence") {
    return buildDigitalPresenceBlueprintPacket({
      ...input,
      catalog: DIGITAL_PRESENCE_REQUIREMENTS,
      catalogVersion: DIGITAL_PRESENCE_CATALOG_VERSION,
      projectType: projectType as "social_setup_cleanup" | "google_business_profile_support",
    });
  }
  if (family === "other_project") {
    return buildOtherProjectBlueprintPacket({
      ...input,
      catalog: OTHER_PROJECT_REQUIREMENTS,
      catalogVersion: OTHER_PROJECT_CATALOG_VERSION,
      projectType: "other",
    });
  }
  if (family === "custom_platform") {
    return buildCustomPlatformBlueprintPacket({
      ...input,
      catalog: CUSTOM_PLATFORM_REQUIREMENTS,
      catalogVersion: CUSTOM_PLATFORM_CATALOG_VERSION,
      projectType: "custom_platform_software",
    });
  }
  if (family === "launch_package") {
    return buildLaunchPackageBlueprintPacket({
      ...input,
      catalog: LAUNCH_PACKAGE_REQUIREMENTS,
      catalogVersion: LAUNCH_PACKAGE_CATALOG_VERSION,
      projectType: "launch_package_multi_project",
    });
  }
  return null;
}

export function buildSpecializedMarkdownForPacket(packet: SpecializedProjectBlueprintPacket, meta: { version: number; status: BlueprintStatus }): string {
  return buildSpecializedBlueprintMarkdown(packet, meta);
}

export type { SpecializedDiscoveryContext };
