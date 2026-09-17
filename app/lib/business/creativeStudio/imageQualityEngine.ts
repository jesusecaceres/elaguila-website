/**
 * Program 6, Gate 6H — Effective image quality engine.
 * Judges effective PPI at final placed dimensions, not metadata "300 DPI".
 */

export type ImageQualityStatus = "PASS" | "WARNING" | "FAIL" | "UNKNOWN";

export type ImageQualityFinding =
  | "LOW_RESOLUTION"
  | "ASPECT_RATIO_MISMATCH"
  | "WATERMARK_DETECTED_MANUAL_REVIEW"
  | "RIGHTS_UNKNOWN"
  | "FACE_NEAR_TRIM"
  | "LOGO_LOW_RESOLUTION"
  | "QR_TOO_SMALL"
  | "TEXT_TOO_SMALL"
  | "IMAGE_UPSCALE_REQUIRED";

export interface EffectivePpiResult {
  readonly status: ImageQualityStatus;
  readonly effectivePpi: number | null;
  readonly findings: readonly ImageQualityFinding[];
  readonly message: string;
}

export const PPI_PASS_THRESHOLD = 300;
export const PPI_WARNING_THRESHOLD = 200;

export function effectivePpi(pixelDimension: number, placedInches: number): number {
  if (placedInches <= 0) return 0;
  return Math.round(pixelDimension / placedInches);
}

export function evaluateImageForPlacement(
  pixelWidth: number | null,
  pixelHeight: number | null,
  placedWidthInches: number,
  placedHeightInches: number,
): EffectivePpiResult {
  const findings: ImageQualityFinding[] = [];

  if (pixelWidth === null || pixelHeight === null) {
    return {
      status: "UNKNOWN",
      effectivePpi: null,
      findings: [],
      message: "Image dimensions unknown. Cannot evaluate effective PPI.",
    };
  }

  const ppiW = effectivePpi(pixelWidth, placedWidthInches);
  const ppiH = effectivePpi(pixelHeight, placedHeightInches);
  const minPpi = Math.min(ppiW, ppiH);

  if (minPpi < PPI_WARNING_THRESHOLD) {
    findings.push("LOW_RESOLUTION");
  }

  if (minPpi < PPI_PASS_THRESHOLD && minPpi >= PPI_WARNING_THRESHOLD) {
    findings.push("IMAGE_UPSCALE_REQUIRED");
  }

  const expectedAspect = placedWidthInches / placedHeightInches;
  const actualAspect = pixelWidth / pixelHeight;
  const aspectDiff = Math.abs(expectedAspect - actualAspect) / expectedAspect;
  if (aspectDiff > 0.1) {
    findings.push("ASPECT_RATIO_MISMATCH");
  }

  let status: ImageQualityStatus;
  if (minPpi >= PPI_PASS_THRESHOLD) {
    status = "PASS";
  } else if (minPpi >= PPI_WARNING_THRESHOLD) {
    status = "WARNING";
  } else {
    status = "FAIL";
  }

  const message = `Effective PPI: ${minPpi} (W:${ppiW} x H:${ppiH}) at ${placedWidthInches}" x ${placedHeightInches}".`;

  return { status, effectivePpi: minPpi, findings, message };
}

export function evaluateLogoForPlacement(
  pixelWidth: number | null,
  pixelHeight: number | null,
  placedWidthInches: number,
  placedHeightInches: number,
): EffectivePpiResult {
  const result = evaluateImageForPlacement(pixelWidth, pixelHeight, placedWidthInches, placedHeightInches);
  if (result.effectivePpi !== null && result.effectivePpi < PPI_PASS_THRESHOLD) {
    return {
      ...result,
      findings: [...result.findings, "LOGO_LOW_RESOLUTION"],
    };
  }
  return result;
}
