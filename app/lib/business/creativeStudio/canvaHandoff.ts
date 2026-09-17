/**
 * Program 6, Gate 6Q — Canva Production Pack builder.
 * Generates a complete production pack for manual Canva handoff.
 * Canva integration status defaults to manual_handoff.
 */
import type { PrintFormatSpec } from "./printSpecs";
import {
  BLEED_INCHES,
  CRITICAL_SAFE_OFFSET_INCHES,
  MODULAR_CONTENT_SAFETY_INCHES,
  BINDING_MARGINS,
  CONFIRM_WITH_PRINTER_ITEMS,
  PRINT_EXPORT_TARGET,
  PRINT_RESOLUTION_TARGET,
} from "./printSpecs";
import type { CreativeBrief } from "./types";
import type { CreativeCompositionZone } from "./archetypes/compositionRules";
import type { ArchetypeDefinition } from "./archetypes/types";
import type { BusinessCreativeAsset } from "./assetTypes";
import type { BrandAssetDefinition } from "./brand/brandTypes";
import { CANVA_DEFAULT_STATUS, type CanvaIntegrationStatus } from "./types";
import { buildCanvaPrompt } from "./canvaPromptCompiler";

export interface CanvaProductionPack {
  adDimensions: {
    trimWidthIn: number;
    trimHeightIn: number;
    bleedWidthIn: number;
    bleedHeightIn: number;
    pixelWidth: number;
    pixelHeight: number;
  };
  trimBleedSafeSpecs: {
    bleedInches: number;
    criticalSafeOffsetInches: number;
    modularContentSafetyInches: number;
    bindingMargins: { inside: number; outside: number; top: number; bottom: number };
  };
  archetype: string;
  layoutVariant: string;
  compositionZoneMap: readonly CreativeCompositionZone[];
  finalApprovedCopy: Record<string, unknown>;
  imageAssetList: readonly BusinessCreativeAsset[];
  imagePlacementInstructions: readonly string[];
  brandAssetInstructions: readonly string[];
  paletteDirection: string;
  typographyRoles: readonly { role: string; minPt: number; maxPt: number }[];
  qrAsset: { destination: string | null; sizeInches: number } | null;
  sponsorTreatment: string | null;
  disclaimer: string | null;
  exportRequirements: readonly string[];
  printerConfirmationItems: readonly string[];
  canvaPrompt: string;
  humanQaChecklist: readonly string[];
  integrationStatus: CanvaIntegrationStatus;
}

export function buildCanvaProductionPack(
  formatSpec: PrintFormatSpec,
  archetype: ArchetypeDefinition,
  layoutVariant: string,
  zones: readonly CreativeCompositionZone[],
  brief: CreativeBrief,
  assets: readonly BusinessCreativeAsset[],
  brandAssets: readonly BrandAssetDefinition[],
  generatedCopy: Record<string, unknown>,
  qrDestination: string | null,
): CanvaProductionPack {
  const imagePlacementInstructions = zones
    .filter((z) => z.role === "hero_image" || z.role === "secondary_image" || z.role === "portrait")
    .map((z) => {
      const asset = assets.find((a) => a.id === brief.mustUseAssetIds[0]);
      return `${z.role}: place at x=${z.xPct}%, y=${z.yPct}%, w=${z.widthPct}%, h=${z.heightPct}%. Fit: ${z.imageFit ?? "cover"}. ${asset ? `Use asset: ${asset.originalFilename}` : "MISSING ASSET — do not invent."}`;
    });

  const brandAssetInstructions = brandAssets.map((a) =>
    `${a.kind}: path=${a.path}. ${a.exists ? "Available." : "NOT YET AVAILABLE — do not substitute."} Preferred: ${a.preferredUsage.join(", ")}.`,
  );

  const canvaPrompt = buildCanvaPrompt({
    formatSpec,
    archetype,
    layoutVariant,
    brief,
    zones,
    generatedCopy,
    assets,
    qrDestination,
  });

  return {
    adDimensions: {
      trimWidthIn: formatSpec.trimWidthIn,
      trimHeightIn: formatSpec.trimHeightIn,
      bleedWidthIn: formatSpec.bleedWidthIn,
      bleedHeightIn: formatSpec.bleedHeightIn,
      pixelWidth: formatSpec.pixelWidth,
      pixelHeight: formatSpec.pixelHeight,
    },
    trimBleedSafeSpecs: {
      bleedInches: 0.125,
      criticalSafeOffsetInches: 0.375,
      modularContentSafetyInches: 0.25,
      bindingMargins: { inside: 0.50, outside: 0.25, top: 0.375, bottom: 0.375 },
    },
    archetype: archetype.key,
    layoutVariant,
    compositionZoneMap: zones,
    finalApprovedCopy: generatedCopy,
    imageAssetList: assets,
    imagePlacementInstructions,
    brandAssetInstructions,
    paletteDirection: brief.imageStrategy,
    typographyRoles: [
      { role: "headline", minPt: 22, maxPt: 40 },
      { role: "secondary", minPt: 14, maxPt: 22 },
      { role: "body", minPt: 9.5, maxPt: 11 },
      { role: "contact", minPt: 10, maxPt: 12 },
      { role: "disclaimer", minPt: 7.5, maxPt: 8 },
      { role: "qr_cta", minPt: 9, maxPt: 11 },
    ],
    qrAsset: qrDestination ? { destination: qrDestination, sizeInches: 0.90 } : null,
    sponsorTreatment: brief.creativeLane === "LANE_C_SPONSORED_EDITORIAL" ? "Sponsor supports useful Leonix content. Disclosure required." : null,
    disclaimer: brief.requiredDisclaimers[0] ?? null,
    exportRequirements: [PRINT_EXPORT_TARGET, PRINT_RESOLUTION_TARGET],
    printerConfirmationItems: [...CONFIRM_WITH_PRINTER_ITEMS],
    canvaPrompt,
    humanQaChecklist: [
      "Verify all business names, phone numbers, and addresses match approved snapshot.",
      "Verify QR code scans to correct HTTPS destination.",
      "Verify no invented facts, offers, or testimonials.",
      "Verify Leonix brand assets are not distorted or recolored.",
      "Verify disclaimer is present and legible.",
      "Verify content does not exceed density limits for format.",
      "Verify image rights are approved for print use.",
      "Verify effective PPI is sufficient at final placed dimensions.",
    ],
    integrationStatus: CANVA_DEFAULT_STATUS,
  };
}

export function getCanvaIntegrationStatus(): CanvaIntegrationStatus {
  return CANVA_DEFAULT_STATUS;
}
