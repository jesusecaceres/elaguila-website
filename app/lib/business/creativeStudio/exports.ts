/**
 * Program 6, Gate 6V — Export generators.
 * V1 real export types: JSON, text, copy deck, image brief, print spec, review checklist, approval snapshot.
 * No PDF renderer — final Canva-designed print PDF remains a human-reviewed production artifact.
 */
import type { CreativeJob, CreativeJobVersion, CreativeBrief } from "./types";
import type { PrintFormatSpec } from "./printSpecs";
import type { ArchetypeDefinition } from "./archetypes/types";
import type { CreativeCompositionZone } from "./archetypes/compositionRules";
import type { BusinessCreativeAsset } from "./assetTypes";
import type { CanvaProductionPack } from "./canvaHandoff";
import type { CreativeReview } from "./types";
import type { ExportType } from "./types";

export interface ExportInput {
  job: CreativeJob;
  version: CreativeJobVersion;
  brief: CreativeBrief;
  formatSpec: PrintFormatSpec;
  archetype: ArchetypeDefinition;
  zones: readonly CreativeCompositionZone[];
  assets: readonly BusinessCreativeAsset[];
  reviews: readonly CreativeReview[];
  canvaPack: CanvaProductionPack | null;
}

export interface ExportResult {
  exportType: ExportType;
  content: string;
  status: "generated" | "failed";
}

export function generateExport(type: ExportType, input: ExportInput): ExportResult {
  try {
    switch (type) {
      case "CANVA_PRODUCTION_PACK_JSON":
        return {
          exportType: type,
          content: input.canvaPack ? JSON.stringify(input.canvaPack, null, 2) : "{}",
          status: "generated",
        };

      case "CANVA_PRODUCTION_BRIEF_TEXT":
        return {
          exportType: type,
          content: input.canvaPack?.canvaPrompt ?? "No Canva prompt available.",
          status: "generated",
        };

      case "COPY_DECK":
        return {
          exportType: type,
          content: JSON.stringify({
            job: { id: input.job.id, assetType: input.job.assetType, language: input.job.language },
            headlines: input.version.generatedHeadlines,
            bodyCopy: input.version.generatedBodyCopy,
            cta: input.version.generatedCta,
            disclaimer: input.version.generatedDisclaimer,
            brief: {
              primaryMessage: input.brief.primaryMessage,
              supportingMessage: input.brief.supportingMessage,
              offer: input.brief.offer,
              contactPath: input.brief.contactPath,
              qrTarget: input.brief.qrTarget,
            },
          }, null, 2),
          status: "generated",
        };

      case "IMAGE_BRIEF":
        return {
          exportType: type,
          content: JSON.stringify({
            format: input.formatSpec.key,
            archetype: input.archetype.key,
            imageZones: input.zones.filter((z) => z.role === "hero_image" || z.role === "secondary_image" || z.role === "portrait"),
            assets: input.assets.map((a) => ({
              originalFilename: a.originalFilename,
              assetKind: a.assetKind,
              rightsStatus: a.rightsStatus,
              authenticityClassification: a.authenticityClassification,
              pixelWidth: a.pixelWidth,
              pixelHeight: a.pixelHeight,
            })),
            instructions: [
              "Do not invent images.",
              "Do not represent AI-generated imagery as authentic client photography.",
              "Verify effective PPI at final placed dimensions.",
              "Verify rights status is approved for print use.",
            ],
          }, null, 2),
          status: "generated",
        };

      case "PRINT_SPEC_SHEET":
        return {
          exportType: type,
          content: JSON.stringify({
            format: input.formatSpec.label,
            trim: `${input.formatSpec.trimWidthIn}" x ${input.formatSpec.trimHeightIn}"`,
            bleed: `${input.formatSpec.bleedWidthIn}" x ${input.formatSpec.bleedHeightIn}"`,
            pixels: `${input.formatSpec.pixelWidth} x ${input.formatSpec.pixelHeight} @ 300 PPI`,
            bleedInches: 0.125,
            criticalSafeOffset: 0.375,
            bindingMargins: { inside: 0.50, outside: 0.25, top: 0.375, bottom: 0.375 },
            exportTarget: "PDF Print / CMYK",
            confirmWithPrinter: ["Printer-specific PDF standard", "CMYK profile", "Rich-black build", "Ink limit", "Crop mark requirement", "Creep settings"],
          }, null, 2),
          status: "generated",
        };

      case "REVIEW_CHECKLIST":
        return {
          exportType: type,
          content: JSON.stringify({
            reviews: input.reviews.map((r) => ({
              issueType: r.issueType,
              description: r.issueDescription,
              severity: r.severity,
              resolutionOfId: r.resolutionOfId,
            })),
            humanQaChecklist: input.canvaPack?.humanQaChecklist ?? [],
          }, null, 2),
          status: "generated",
        };

      case "APPROVAL_SNAPSHOT":
        return {
          exportType: type,
          content: JSON.stringify({
            job: {
              id: input.job.id,
              status: input.job.status,
              approvedAt: input.job.approvedAt,
              approvedActorType: input.job.approvedActorType,
            },
            version: {
              id: input.version.id,
              versionNumber: input.version.versionNumber,
            },
            brief: {
              id: input.brief.id,
              status: input.brief.status,
            },
            timestamp: new Date().toISOString(),
          }, null, 2),
          status: "generated",
        };

      case "CREATIVE_PROOF_PDF":
        return {
          exportType: type,
          content: "CREATIVE_PROOF_PDF not available in V1. Use Canva Production Pack for manual production.",
          status: "failed",
        };

      default:
        return {
          exportType: type,
          content: `Unknown export type: ${type}`,
          status: "failed",
        };
    }
  } catch {
    return {
      exportType: type,
      content: "Export generation failed.",
      status: "failed",
    };
  }
}
