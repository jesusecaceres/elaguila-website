/**
 * Program 6, Gate 6AC — Pre-flight Engine.
 * Deterministic preflight result. BLOCKED if any blocker exists.
 */
import type { PrintFormatSpec } from "./printSpecs";
import type { CreativeBrief, CreativeJob, CreativeJobVersion } from "./types";
import type { BusinessCreativeAsset } from "./assetTypes";
import type { CreativeCompositionZone } from "./archetypes/compositionRules";
import { checkContentCapacity } from "./productionRules";
import { validateQrSize } from "./productionRules";
import { evaluateImageForPlacement } from "./imageQualityEngine";
import { canAssetReachFinalApproval, isAiIllustrativeAsset } from "./assetTypes";
import { requiresDisclaimer, requiresProfessionalReview, isClaimProhibited } from "./compliance";
import { checkQrReadiness, isQrRequiredForFormat } from "./qrRegistry";
import type { QrRecord } from "./qrRegistry";

export type PreflightCategory = "CONTENT" | "BRAND" | "DESIGN" | "COMMERCIAL" | "TECHNICAL" | "APPROVAL";

export type PreflightStatus = "BLOCKED" | "WARNINGS" | "READY_FOR_REVIEW" | "READY_FOR_PRODUCTION";

export interface PreflightFinding {
  category: PreflightCategory;
  severity: "blocker" | "warning" | "info";
  code: string;
  message: string;
}

export interface PreflightResult {
  status: PreflightStatus;
  findings: readonly PreflightFinding[];
  summary: string;
}

export interface PreflightInput {
  job: CreativeJob;
  brief: CreativeBrief;
  version: CreativeJobVersion;
  formatSpec: PrintFormatSpec;
  zones: readonly CreativeCompositionZone[];
  assets: readonly BusinessCreativeAsset[];
  qrRecord: QrRecord | null;
  qrSizeInches: number;
  primaryMessages: number;
  benefits: number;
  ctas: number;
  staffApproved: boolean;
  ownerApproved: boolean;
  finalProofApproved: boolean;
  snapshotAccurate: boolean;
}

export function runPreflight(input: PreflightInput): PreflightResult {
  const findings: PreflightFinding[] = [];

  // ─── CONTENT ──────────────────────────────────────────────────────────
  if (!input.snapshotAccurate) {
    findings.push({ category: "CONTENT", severity: "blocker", code: "SNAPSHOT_NOT_ACCURATE", message: "Input snapshot is not confirmed accurate." });
  }

  if (!input.brief.businessGoal || input.brief.businessGoal.trim().length === 0) {
    findings.push({ category: "CONTENT", severity: "blocker", code: "MISSING_BUSINESS_GOAL", message: "Brief is missing business goal." });
  }

  if (!input.brief.cta || input.brief.cta.trim().length === 0) {
    findings.push({ category: "CONTENT", severity: "blocker", code: "MISSING_CTA", message: "Brief is missing CTA." });
  }

  for (const prohibited of input.brief.prohibitedClaims) {
    if (isClaimProhibited(input.brief.riskClass, prohibited)) {
      findings.push({ category: "CONTENT", severity: "blocker", code: "PROHIBITED_CLAIM", message: `Prohibited claim detected: ${prohibited}` });
    }
  }

  // ─── BRAND ────────────────────────────────────────────────────────────
  const logoAsset = input.assets.find((a) => a.assetKind === "client_logo");
  if (!logoAsset) {
    findings.push({ category: "BRAND", severity: "warning", code: "NO_BUSINESS_LOGO", message: "No approved business logo asset found." });
  } else if (logoAsset.approvalState !== "approved") {
    findings.push({ category: "BRAND", severity: "blocker", code: "LOGO_NOT_APPROVED", message: "Business logo is not in approved state." });
  }

  // ─── DESIGN ───────────────────────────────────────────────────────────
  const capacity = checkContentCapacity(input.formatSpec.key, input.primaryMessages, input.benefits, input.ctas);
  if (capacity.status === "CONTENT_OVER_CAPACITY") {
    for (const v of capacity.violations) {
      findings.push({ category: "DESIGN", severity: "blocker", code: "CONTENT_OVER_CAPACITY", message: v });
    }
  }

  // Check required zones are present
  const requiredZones = input.zones.filter((z) => z.required);
  for (const z of requiredZones) {
    const hasContent = Boolean(input.version.generatedCopy[z.key]);
    if (!hasContent) {
      findings.push({ category: "DESIGN", severity: "blocker", code: "REQUIRED_ZONE_MISSING", message: `Required zone "${z.key}" (${z.role}) has no content.` });
    }
  }

  // Check image quality for hero images
  for (const z of input.zones) {
    if (z.role === "hero_image" || z.role === "secondary_image" || z.role === "portrait") {
      const asset = input.assets.find((a) => input.brief.mustUseAssetIds.includes(a.id));
      if (asset && asset.pixelWidth && asset.pixelHeight) {
        const placedW = (z.widthPct / 100) * input.formatSpec.trimWidthIn;
        const placedH = (z.heightPct / 100) * input.formatSpec.trimHeightIn;
        const quality = evaluateImageForPlacement(asset.pixelWidth, asset.pixelHeight, placedW, placedH);
        if (quality.status === "FAIL") {
          findings.push({ category: "DESIGN", severity: "blocker", code: "IMAGE_LOW_RESOLUTION", message: `Zone ${z.key}: ${quality.message}` });
        } else if (quality.status === "WARNING") {
          findings.push({ category: "DESIGN", severity: "warning", code: "IMAGE_RESOLUTION_WARNING", message: `Zone ${z.key}: ${quality.message}` });
        }
      }
    }
  }

  // QR size check
  const qrSizeResult = validateQrSize(input.qrSizeInches);
  if (qrSizeResult.status === "FAIL") {
    findings.push({ category: "DESIGN", severity: "blocker", code: "QR_TOO_SMALL", message: qrSizeResult.message });
  } else if (qrSizeResult.status === "WARNING") {
    findings.push({ category: "DESIGN", severity: "warning", code: "QR_SIZE_WARNING", message: qrSizeResult.message });
  }

  // ─── COMMERCIAL ───────────────────────────────────────────────────────
  if (input.brief.offer && input.brief.offer.trim().length > 0) {
    // Offer present — check for expiration truth
    if (!input.brief.requiredDisclaimers.some((d) => d.toLowerCase().includes("expir"))) {
      findings.push({ category: "COMMERCIAL", severity: "warning", code: "OFFER_NO_EXPIRATION_DISCLAIMER", message: "Offer present but no expiration disclaimer found." });
    }
  }

  if (input.brief.creativeLane === "LANE_C_SPONSORED_EDITORIAL") {
    if (!input.brief.requiredDisclaimers.some((d) => d.toLowerCase().includes("sponsor") || d.toLowerCase().includes("patrocin"))) {
      findings.push({ category: "COMMERCIAL", severity: "blocker", code: "SPONSOR_DISCLOSURE_MISSING", message: "Sponsored editorial requires sponsor disclosure." });
    }
  }

  // ─── TECHNICAL ────────────────────────────────────────────────────────
  if (isQrRequiredForFormat(input.formatSpec.key)) {
    const qrReady = checkQrReadiness(input.qrRecord, input.formatSpec.key, input.qrSizeInches, true);
    for (const v of qrReady.violations) {
      findings.push({ category: "TECHNICAL", severity: "blocker", code: "QR_NOT_READY", message: v });
    }
  }

  // Asset rights checks
  for (const asset of input.assets) {
    if (!canAssetReachFinalApproval(asset)) {
      findings.push({ category: "TECHNICAL", severity: "blocker", code: "ASSET_RIGHTS_BLOCKED", message: `Asset ${asset.originalFilename} rights status: ${asset.rightsStatus}. Cannot reach final approval.` });
    }
    if (isAiIllustrativeAsset(asset) && asset.authenticityClassification === "AI_ILLUSTRATIVE") {
      findings.push({ category: "TECHNICAL", severity: "warning", code: "AI_ILLUSTRATIVE_ASSET", message: `Asset ${asset.originalFilename} is AI illustrative — must not be represented as authentic client photo.` });
    }
  }

  // ─── APPROVAL ─────────────────────────────────────────────────────────
  if (!input.staffApproved) {
    findings.push({ category: "APPROVAL", severity: "blocker", code: "STAFF_APPROVAL_MISSING", message: "Staff approval is required." });
  }

  if (requiresProfessionalReview(input.brief.riskClass) && !input.staffApproved) {
    findings.push({ category: "APPROVAL", severity: "blocker", code: "PROFESSIONAL_REVIEW_REQUIRED", message: `Risk class ${input.brief.riskClass} requires professional review.` });
  }

  if (requiresDisclaimer(input.brief.riskClass) && input.brief.requiredDisclaimers.length === 0) {
    findings.push({ category: "APPROVAL", severity: "blocker", code: "DISCLAIMER_REQUIRED", message: `Risk class ${input.brief.riskClass} requires a disclaimer.` });
  }

  if (!input.finalProofApproved) {
    findings.push({ category: "APPROVAL", severity: "blocker", code: "FINAL_PROOF_NOT_APPROVED", message: "Final proof has not been approved." });
  }

  // ─── Determine status ─────────────────────────────────────────────────
  const hasBlockers = findings.some((f) => f.severity === "blocker");
  const hasWarnings = findings.some((f) => f.severity === "warning");

  let status: PreflightStatus;
  if (hasBlockers) {
    status = "BLOCKED";
  } else if (hasWarnings) {
    status = "WARNINGS";
  } else if (input.staffApproved && input.finalProofApproved) {
    status = "READY_FOR_PRODUCTION";
  } else {
    status = "READY_FOR_REVIEW";
  }

  const summary = `Preflight: ${status}. ${findings.length} findings (${findings.filter((f) => f.severity === "blocker").length} blockers, ${findings.filter((f) => f.severity === "warning").length} warnings).`;

  return { status, findings, summary };
}
